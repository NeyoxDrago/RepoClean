import { jest } from "@jest/globals";

// Mock environment variables for testing
process.env.NODE_ENV = "test";
process.env.PORT = "5001";
process.env.FRONTEND_URL = "http://localhost:3000";
process.env.SESSION_SECRET = "test-session-secret";
process.env.GITHUB_CLIENT_ID = "test-client-id";
process.env.GITHUB_CLIENT_SECRET = "test-client-secret";
process.env.GITHUB_CALLBACK_URL = "http://localhost:5001/api/auth/github/callback";
process.env.JWT_SECRET = "test-jwt-secret";
process.env.GITHUB_API_BASE_URL = "https://api.github.com";
process.env.RATE_LIMIT_WINDOW_MS = "900000";
process.env.RATE_LIMIT_MAX_REQUESTS = "100";
process.env.LOG_LEVEL = "error";

// Global test timeout
jest.setTimeout(10000);

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock fetch for HTTP requests
global.fetch = jest.fn();

// Setup and teardown
beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  jest.resetAllMocks();
});

export const mockGitHubUser = {
  id: 123456,
  login: "testuser",
  name: "Test User",
  email: "test@example.com",
  avatar_url: "https://avatars.githubusercontent.com/u/123456",
  html_url: "https://github.com/testuser",
  type: "User" as const,
  company: null,
  location: null,
  bio: null,
  public_repos: 10,
  followers: 5,
  following: 3,
  created_at: "2020-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

export const mockGitHubRepository = {
  id: 789012,
  node_id: "R_kgDOABCDEF",
  name: "test-repo",
  full_name: "testuser/test-repo",
  description: "A test repository",
  private: false,
  fork: false,
  html_url: "https://github.com/testuser/test-repo",
  clone_url: "https://github.com/testuser/test-repo.git",
  ssh_url: "git@github.com:testuser/test-repo.git",
  size: 100,
  stargazers_count: 5,
  watchers_count: 5,
  forks_count: 2,
  open_issues_count: 1,
  language: "JavaScript",
  default_branch: "main",
  topics: ["test", "repository"],
  archived: false,
  disabled: false,
  visibility: "public" as const,
  created_at: "2023-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
  pushed_at: "2024-01-01T00:00:00Z",
  owner: mockGitHubUser,
  permissions: {
    admin: true,
    maintain: true,
    push: true,
    triage: true,
    pull: true,
  },
};

export const mockJWTPayload = {
  user_id: 123456,
  login: "testuser",
  access_token: "gho_test_token",
  token_scopes: ["repo", "read:user", "user:email", "read:org", "delete_repo"],
  created_at: Date.now(),
  expires_at: Date.now() + 24 * 60 * 60 * 1000,
};

export const mockGitHubApiResponse = {
  headers: {
    "x-ratelimit-limit": "5000",
    "x-ratelimit-remaining": "4999",
    "x-ratelimit-reset": "1704096000",
    "x-ratelimit-used": "1",
    "x-ratelimit-resource": "core",
    "x-oauth-scopes": "repo,read:user,user:email,read:org,delete_repo",
  },
}; 