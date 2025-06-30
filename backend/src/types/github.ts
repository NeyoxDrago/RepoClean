export interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string;
  html_url: string;
  type: "User" | "Organization";
  company: string | null;
  location: string | null;
  bio: string | null;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
}

export interface GitHubRepository {
  id: number;
  node_id: string;
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  fork: boolean;
  html_url: string;
  clone_url: string;
  ssh_url: string;
  size: number;
  stargazers_count: number;
  watchers_count: number;
  forks_count: number;
  open_issues_count: number;
  language: string | null;
  default_branch: string;
  topics: string[];
  archived: boolean;
  disabled: boolean;
  visibility: "public" | "private" | "internal";
  created_at: string;
  updated_at: string;
  pushed_at: string;
  owner: GitHubUser;
  permissions?: {
    admin: boolean;
    maintain: boolean;
    push: boolean;
    triage: boolean;
    pull: boolean;
  };
  license?: {
    key: string;
    name: string;
    spdx_id: string;
    url: string;
  };
}

export interface GitHubOrganization {
  id: number;
  login: string;
  name: string | null;
  description: string | null;
  avatar_url: string;
  html_url: string;
  type: "Organization";
  company: string | null;
  location: string | null;
  email: string | null;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
}

export interface GitHubContent {
  type: "file" | "dir" | "symlink" | "submodule";
  size: number;
  name: string;
  path: string;
  content?: string;
  encoding?: "base64" | "utf-8";
  sha: string;
  url: string;
  git_url: string;
  html_url: string;
  download_url: string | null;
  _links: {
    self: string;
    git: string;
    html: string;
  };
}

export interface GitHubCommit {
  sha: string;
  url: string;
  html_url: string;
  author: {
    name: string;
    email: string;
    date: string;
  };
  committer: {
    name: string;
    email: string;
    date: string;
  };
  message: string;
  tree: {
    sha: string;
    url: string;
  };
  parents: Array<{
    sha: string;
    url: string;
    html_url: string;
  }>;
  verification: {
    verified: boolean;
    reason: string;
    signature: string | null;
    payload: string | null;
  };
}

export interface GitHubBranch {
  name: string;
  commit: {
    sha: string;
    url: string;
  };
  protected: boolean;
  protection?: {
    enabled: boolean;
    required_status_checks: {
      enforcement_level: string;
      contexts: string[];
    };
  };
}

export interface CreateRepositoryRequest {
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
  // Additional properties for service usage
  org?: string;
  template_owner?: string;
  template_repo?: string;
}

export interface UpdateRepositoryRequest {
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

export interface CreateFileRequest {
  message: string;
  content: string;
  branch?: string;
  committer?: {
    name: string;
    email: string;
  };
  author?: {
    name: string;
    email: string;
  };
}

export interface UpdateFileRequest extends CreateFileRequest {
  sha: string;
}

export interface DeleteFileRequest {
  message: string;
  sha: string;
  branch?: string;
  committer?: {
    name: string;
    email: string;
  };
  author?: {
    name: string;
    email: string;
  };
}

export interface GitHubApiError {
  message: string;
  documentation_url?: string;
  errors?: Array<{
    resource: string;
    field: string;
    code: string;
    message?: string;
  }>;
}

export interface GitHubRateLimit {
  limit: number;
  remaining: number;
  reset: number;
  used: number;
  resource: string;
}

export interface GitHubScope {
  repo: boolean;
  "repo:status": boolean;
  repo_deployment: boolean;
  public_repo: boolean;
  "repo:invite": boolean;
  security_events: boolean;
  admin_repo_hook: boolean;
  write_repo_hook: boolean;
  read_repo_hook: boolean;
  admin_org: boolean;
  write_org: boolean;
  read_org: boolean;
  admin_public_key: boolean;
  write_public_key: boolean;
  read_public_key: boolean;
  admin_org_hook: boolean;
  gist: boolean;
  notifications: boolean;
  user: boolean;
  read_user: boolean;
  user_email: boolean;
  user_follow: boolean;
  delete_repo: boolean;
  write_discussion: boolean;
  read_discussion: boolean;
  write_packages: boolean;
  read_packages: boolean;
  delete_packages: boolean;
  admin_gpg_key: boolean;
  write_gpg_key: boolean;
  read_gpg_key: boolean;
  codespace: boolean;
  workflow: boolean;
}

export type GitHubScopeKey = keyof GitHubScope; 