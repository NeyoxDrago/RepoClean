import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import config, { serverConfig } from "@/config";
import { ErrorMiddleware } from "@/middleware/error.middleware";
import { AuthRoutes } from "@/routes/auth.routes";
import { RepositoryRoutes } from "@/routes/repositories.routes";

class App {
  public app: Application;
  private authRoutes: AuthRoutes;
  private repositoryRoutes: RepositoryRoutes;

  constructor() {
    this.app = express();
    this.authRoutes = new AuthRoutes();
    this.repositoryRoutes = new RepositoryRoutes();
    
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));

    // CORS configuration
    this.app.use(cors({
      origin: [
        config.server.frontendUrl, 
        "http://localhost:3000", 
        "http://localhost:3001", 
        "http://localhost:3002"
      ],
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    }));

    // Body parsing middleware - Increased limits for large repository operations
    this.app.use(express.json({ 
      limit: "100mb"
    }));
    this.app.use(express.urlencoded({ 
      extended: true, 
      limit: "100mb",
      parameterLimit: 10000
    }));
    this.app.use(cookieParser());

    // Logging middleware
    if (config.server.nodeEnv !== "test") {
      this.app.use(morgan("combined"));
    }
  }

  private initializeRoutes(): void {
    // Root endpoint
    this.app.get("/", (_req, res) => {
      res.json({
        name: "RepoCleanr API",
        version: "1.0.0",
        description: "GitHub repository management portal API",
        status: "running",
        timestamp: new Date().toISOString(),
        environment: config.server.nodeEnv,
        endpoints: {
          health: "/health",
          documentation: "/api",
          auth: "/api/auth"
        },
        github_oauth_setup: "Required for repository management"
      });
    });

    // Health check endpoint
    this.app.get("/health", (_req, res) => {
      res.json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        version: "1.0.0",
        environment: config.server.nodeEnv,
        github_api: "connected",
      });
    });

    // Favicon endpoint to prevent 404s
    this.app.get("/favicon.ico", (_req, res) => {
      res.status(204).end();
    });

    // API routes
    this.app.use("/api/auth", this.authRoutes.router);
    this.app.use("/api/repositories", this.repositoryRoutes.router);

    // API documentation endpoint
    this.app.get("/api", (_req, res) => {
      res.json({
        name: "RepoCleanr API",
        version: "1.0.0",
        description: "GitHub repository management portal API",
        endpoints: {
          auth: {
            "GET /api/auth/github": "Initiate GitHub OAuth flow",
            "GET /api/auth/github/callback": "Handle GitHub OAuth callback",
            "GET /api/auth/profile": "Get user profile",
            "POST /api/auth/logout": "Logout user",
            "GET /api/auth/validate": "Validate token",
            "GET /api/auth/scopes": "Get scope information",
          },
          repositories: {
            "GET /api/repositories": "List repositories (supports pagination, filtering, search)",
            "GET /api/repositories/search": "Search repositories",
            "POST /api/repositories": "Create repository",
            "GET /api/repositories/:owner/:repo": "Get repository details",
            "PATCH /api/repositories/:owner/:repo": "Update repository",
            "DELETE /api/repositories/:owner/:repo": "Delete repository",
            "POST /api/repositories/batch": "Batch operations (archive, delete, visibility)",
            "GET /api/repositories/:owner/:repo/contents/*": "Get file content",
            "PUT /api/repositories/:owner/:repo/contents/*": "Create/update file",
            "DELETE /api/repositories/:owner/:repo/contents/*": "Delete file",
          },
        },
        documentation: "https://docs.github.com/en/rest",
        github_scopes_required: [
          "repo",
          "read:user",
          "user:email",
          "read:org",
          "delete_repo",
        ],
      });
    });

    // 404 handler for unknown routes
    this.app.use("*", ErrorMiddleware.notFound);
  }

  private initializeErrorHandling(): void {
    this.app.use(ErrorMiddleware.handleError);
  }

  public listen(): void {
    const server = this.app.listen(serverConfig.port, () => {
      console.log(`🚀 RepoCleanr API server is running on port ${serverConfig.port}`);
      console.log(`📝 Environment: ${serverConfig.nodeEnv}`);
      console.log(`🌐 Frontend URL: ${serverConfig.frontendUrl}`);
      console.log(`📚 API Documentation: http://localhost:${serverConfig.port}/api`);
      console.log(`❤️  Health check: http://localhost:${serverConfig.port}/health`);
    });

    server.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${serverConfig.port} is already in use!`);
        console.error(`💡 Please either:`);
        console.error(`   1. Stop the other process using port ${serverConfig.port}`);
        console.error(`   2. Change the PORT in your .env file`);
        console.error(`   3. Kill existing processes: npx kill-port ${serverConfig.port}`);
        process.exit(1);
      } else {
        console.error('❌ Server error:', error);
        process.exit(1);
      }
    });
  }
}

// Handle uncaught exceptions and unhandled rejections
process.on("uncaughtException", (error: Error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason: unknown, promise: Promise<unknown>) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM signal received. Shutting down gracefully...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("SIGINT signal received. Shutting down gracefully...");
  process.exit(0);
});

// Start the application
if (require.main === module) {
  try {
    const app = new App();
    app.listen();
  } catch (error) {
    console.error("Failed to start application:", error);
    process.exit(1);
  }
}

export default App; 