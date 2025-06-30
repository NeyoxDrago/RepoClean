import { GitHubRepository, GitHubUser, GitHubOrganization } from "./github";

export interface AuthenticatedUser {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string;
  access_token: string;
  token_scopes: string[];
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: PaginationInfo;
  rateLimit?: {
    limit: number;
    remaining: number;
    reset: number;
    used: number;
  };
}

export interface PaginationInfo {
  page: number;
  per_page: number;
  total_count: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface BatchOperationRequest {
  repositories: number[];
  operation: "archive" | "unarchive" | "delete" | "visibility_public" | "visibility_private";
}

export interface BatchOperationResult {
  repository_id: number;
  repository_name: string;
  success: boolean;
  error?: string;
}

export interface BatchOperationResponse {
  operation: string;
  total_requested: number;
  successful: number;
  failed: number;
  results: BatchOperationResult[];
}

export interface RepositoryListQuery {
  org?: string;
  type?: "all" | "owner" | "public" | "private" | "member";
  sort?: "created" | "updated" | "pushed" | "full_name";
  direction?: "asc" | "desc";
  page?: number;
  per_page?: number;
  search?: string;
  language?: string;
  archived?: boolean;
  fork?: boolean;
}

export interface RepositoryCreateRequest {
  name: string;
  description?: string;
  homepage?: string;
  private?: boolean;
  visibility?: "public" | "private" | "internal";
  has_issues?: boolean;
  has_projects?: boolean;
  has_wiki?: boolean;
  has_downloads?: boolean;
  is_template?: boolean;
  team_id?: number;
  auto_init?: boolean;
  gitignore_template?: string;
  license_template?: string;
  allow_squash_merge?: boolean;
  allow_merge_commit?: boolean;
  allow_rebase_merge?: boolean;
  allow_auto_merge?: boolean;
  delete_branch_on_merge?: boolean;
  template_owner?: string;
  template_repo?: string;
  org?: string;
}

export interface RepositoryUpdateRequest {
  name?: string;
  description?: string;
  homepage?: string;
  private?: boolean;
  visibility?: "public" | "private" | "internal";
  has_issues?: boolean;
  has_projects?: boolean;
  has_wiki?: boolean;
  has_downloads?: boolean;
  is_template?: boolean;
  default_branch?: string;
  allow_squash_merge?: boolean;
  allow_merge_commit?: boolean;
  allow_rebase_merge?: boolean;
  allow_auto_merge?: boolean;
  delete_branch_on_merge?: boolean;
  archived?: boolean;
}

export interface FileOperationRequest {
  path: string;
  message: string;
  content?: string;
  branch?: string;
  sha?: string;
  operation: "create" | "update" | "delete";
  committer?: {
    name: string;
    email: string;
  };
  author?: {
    name: string;
    email: string;
  };
}

export interface UserProfile {
  user: GitHubUser;
  organizations: GitHubOrganization[];
  repositories_count: number;
  organizations_count: number;
  scopes: string[];
}

export interface ErrorResponse {
  error: string;
  message: string;
  status_code: number;
  details?: unknown;
}

export interface HealthCheckResponse {
  status: "healthy" | "unhealthy";
  timestamp: string;
  version: string;
  github_api: "connected" | "disconnected";
  rate_limit?: {
    limit: number;
    remaining: number;
    reset: number;
  };
}

export interface SessionData {
  user_id: number;
  login: string;
  access_token: string;
  token_scopes: string[];
  created_at: number;
  expires_at: number;
}

export interface OAuthState {
  state: string;
  redirect_url?: string;
  created_at: number;
}

export interface TokenValidationResult {
  valid: boolean;
  scopes: string[];
  rate_limit: {
    limit: number;
    remaining: number;
    reset: number;
    used: number;
    resource: string;
  };
  user?: GitHubUser;
}

export interface RepositorySearchRequest {
  q: string;
  sort?: "stars" | "forks" | "help-wanted-issues" | "updated";
  order?: "desc" | "asc";
  page?: number;
  per_page?: number;
}

export interface RepositorySearchResponse {
  total_count: number;
  incomplete_results: boolean;
  items: GitHubRepository[];
}

export interface GitHubTemplate {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  owner: GitHubUser;
  is_template: boolean;
  visibility: "public" | "private" | "internal";
}

export interface TemplateListResponse {
  templates: GitHubTemplate[];
  total_count: number;
}

export interface WebhookEvent {
  id: string;
  type: string;
  action: string;
  repository?: GitHubRepository;
  sender: GitHubUser;
  timestamp: string;
}

export interface GitHubAppInstallation {
  id: number;
  account: GitHubUser;
  access_tokens_url: string;
  repositories_url: string;
  html_url: string;
  app_id: number;
  app_slug: string;
  target_id: number;
  target_type: "Organization" | "User";
  permissions: Record<string, string>;
  events: string[];
  created_at: string;
  updated_at: string;
  single_file_name: string | null;
  has_multiple_single_files: boolean;
  single_file_paths: string[];
  repository_selection: "selected" | "all";
}

export type SortDirection = "asc" | "desc";
export type RepositoryType = "all" | "owner" | "public" | "private" | "member";
export type RepositorySort = "created" | "updated" | "pushed" | "full_name";
export type RepositoryVisibility = "public" | "private" | "internal";
export type BatchOperation = "archive" | "unarchive" | "delete" | "visibility_public" | "visibility_private";
export type FileOperation = "create" | "update" | "delete"; 