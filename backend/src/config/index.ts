import dotenv from "dotenv";
import path from "path";

// Load environment variables from root directory
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

export interface Config {
  server: {
    port: number;
    nodeEnv: string;
    frontendUrl: string;
  };
  session: {
    secret: string;
  };
  github: {
    clientId: string;
    clientSecret: string;
    callbackUrl: string;
    apiBaseUrl: string;
  };
  jwt: {
    secret: string;
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
  logging: {
    level: string;
  };
}

function parsePort(portStr: string | undefined, defaultPort: number): number {
  if (!portStr) return defaultPort;
  const port = parseInt(portStr, 10);
  if (isNaN(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid port number: ${portStr}`);
  }
  return port;
}

function parseNumber(numStr: string | undefined, defaultValue: number): number {
  if (!numStr) return defaultValue;
  const num = parseInt(numStr, 10);
  if (isNaN(num)) {
    throw new Error(`Invalid number: ${numStr}`);
  }
  return num;
}

// For development, allow some environment variables to have defaults
function validateEnvVarOrDefault(name: string, value: string | undefined, defaultValue?: string): string {
  if (!value && !defaultValue) {
    console.log("Missing required environment variable: ", name);
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value || defaultValue!;
}

const config: Config = {
  server: {
    port: parsePort(process.env.PORT, 5000),
    nodeEnv: process.env.NODE_ENV || "development",
    frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
  },
  session: {
    secret: validateEnvVarOrDefault("SESSION_SECRET", process.env.SESSION_SECRET, "dev-session-secret-change-in-production"),
  },
  github: {
    clientId: validateEnvVarOrDefault("GITHUB_CLIENT_ID", process.env.GITHUB_CLIENT_ID, "your-github-client-id"),
    clientSecret: validateEnvVarOrDefault("GITHUB_CLIENT_SECRET", process.env.GITHUB_CLIENT_SECRET, "your-github-client-secret"),
    callbackUrl: validateEnvVarOrDefault("GITHUB_CALLBACK_URL", process.env.GITHUB_CALLBACK_URL, "http://localhost:5000/api/auth/github/callback"),
    apiBaseUrl: process.env.GITHUB_API_BASE_URL || "https://api.github.com",
  },
  jwt: {
    secret: validateEnvVarOrDefault("JWT_SECRET", process.env.JWT_SECRET, "dev-jwt-secret-change-in-production"),
  },
  rateLimit: {
    windowMs: parseNumber(process.env.RATE_LIMIT_WINDOW_MS, 900000), // 15 minutes
    maxRequests: parseNumber(process.env.RATE_LIMIT_MAX_REQUESTS, 100),
  },
  logging: {
    level: process.env.LOG_LEVEL || "info",
  },
};

// Validate GitHub OAuth callback URL format
try {
  new URL(config.github.callbackUrl);
} catch (error) {
  throw new Error(`Invalid GitHub callback URL: ${config.github.callbackUrl}`);
}

// Validate frontend URL format
try {
  new URL(config.server.frontendUrl);
} catch (error) {
  throw new Error(`Invalid frontend URL: ${config.server.frontendUrl}`);
}

export default config;

// Export individual config sections for convenience
export const serverConfig = config.server;
export const sessionConfig = config.session;
export const githubConfig = config.github;
export const jwtConfig = config.jwt;
export const rateLimitConfig = config.rateLimit;
export const loggingConfig = config.logging; 