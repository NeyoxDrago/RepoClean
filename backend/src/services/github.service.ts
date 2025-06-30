import axios, { AxiosInstance, AxiosError } from "axios";
import {
  GitHubUser,
  GitHubRepository,
  GitHubOrganization,
  GitHubContent,
  CreateRepositoryRequest,
  UpdateRepositoryRequest,
  CreateFileRequest,
  UpdateFileRequest,
  DeleteFileRequest,
  GitHubApiError,
  GitHubRateLimit,
} from "@/types/github";
import {
  ApiResponse,
  PaginationInfo,
  RepositoryListQuery,
  TokenValidationResult,
} from "@/types/api";
import { githubConfig } from "@/config";

export class GitHubService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: githubConfig.apiBaseUrl,
      timeout: 30000,
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });

    // Add response interceptor for rate limiting and error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => this.handleApiError(error)
    );
  }

  private getAuthHeaders(accessToken: string): Record<string, string> {
    return {
      Authorization: `Bearer ${accessToken}`,
    };
  }

  private handleApiError(error: AxiosError): Promise<never> {
    const status = error.response?.status;
    const data = error.response?.data as GitHubApiError;

    let message = "GitHub API error";
    if (data?.message) {
      message = data.message;
    } else if (error.message) {
      message = error.message;
    }

    switch (status) {
      case 401:
        throw new Error("Unauthorized: Invalid or expired GitHub token");
      case 403:
        if (error.response?.headers["x-ratelimit-remaining"] === "0") {
          const resetTime = error.response?.headers["x-ratelimit-reset"];
          throw new Error(
            `Rate limit exceeded. Resets at ${new Date(
              parseInt(resetTime as string) * 1000
            ).toISOString()}`
          );
        }
        throw new Error(`Forbidden: ${message}`);
      case 404:
        throw new Error(`Not found: ${message}`);
      case 422:
        throw new Error(`Validation failed: ${message}`);
      case 500:
        throw new Error(`GitHub server error: ${message}`);
      default:
        throw new Error(`GitHub API error (${status}): ${message}`);
    }
  }

  private extractRateLimit(headers: any): GitHubRateLimit {
    return {
      limit: parseInt(headers["x-ratelimit-limit"] || "0"),
      remaining: parseInt(headers["x-ratelimit-remaining"] || "0"),
      reset: parseInt(headers["x-ratelimit-reset"] || "0"),
      used: parseInt(headers["x-ratelimit-used"] || "0"),
      resource: headers["x-ratelimit-resource"] || "core",
    };
  }

  private parseLinkHeader(linkHeader: string): Record<string, string> {
    const links: Record<string, string> = {};
    const parts = linkHeader.split(",");

    for (const part of parts) {
      const section = part.split(";");
      if (section.length !== 2) continue;

      const url = section[0].replace(/<(.*)>/, "$1").trim();
      const name = section[1].replace(/rel="(.*)"/, "$1").trim();
      links[name] = url;
    }

    return links;
  }

  private buildPaginationInfo(
    page: number,
    perPage: number,
    totalCount: number,
    linkHeader?: string
  ): PaginationInfo {
    const totalPages = Math.ceil(totalCount / perPage);
    const links = linkHeader ? this.parseLinkHeader(linkHeader) : {};

    return {
      page,
      per_page: perPage,
      total_count: totalCount,
      total_pages: totalPages,
      has_next: !!links.next || page < totalPages,
      has_prev: !!links.prev || page > 1,
    };
  }

  public async validateToken(accessToken: string): Promise<TokenValidationResult> {
    try {
      const response = await this.api.get("/user", {
        headers: this.getAuthHeaders(accessToken),
      });

      const rateLimit = this.extractRateLimit(response.headers);
      const scopes = (response.headers["x-oauth-scopes"] || "").split(",").map((s: string) => s.trim()).filter(Boolean);

      return {
        valid: true,
        scopes,
        rate_limit: rateLimit,
        user: response.data,
      };
    } catch (error) {
      return {
        valid: false,
        scopes: [],
        rate_limit: { limit: 0, remaining: 0, reset: 0, used: 0, resource: "core" },
      };
    }
  }

  public async getCurrentUser(accessToken: string): Promise<GitHubUser> {
    const response = await this.api.get("/user", {
      headers: this.getAuthHeaders(accessToken),
    });
    return response.data;
  }

  public async getUserOrganizations(accessToken: string): Promise<GitHubOrganization[]> {
    const response = await this.api.get("/user/orgs", {
      headers: this.getAuthHeaders(accessToken),
    });
    return response.data;
  }

  public async getRepositories(
    accessToken: string,
    query: RepositoryListQuery
  ): Promise<ApiResponse<GitHubRepository[]>> {
    const params = new URLSearchParams();
    
    if (query.type) params.append("type", query.type);
    if (query.sort) params.append("sort", query.sort);
    if (query.direction) params.append("direction", query.direction);
    if (query.page) params.append("page", query.page.toString());
    if (query.per_page) params.append("per_page", query.per_page.toString());

    const endpoint = query.org ? `/orgs/${query.org}/repos` : "/user/repos";
    
    const response = await this.api.get(`${endpoint}?${params.toString()}`, {
      headers: this.getAuthHeaders(accessToken),
    });

    const repositories = response.data as GitHubRepository[];
    const rateLimit = this.extractRateLimit(response.headers);
    const totalCount = parseInt(response.headers["x-total-count"] || repositories.length.toString());
    
    let filteredRepos = repositories;

    // Apply client-side filters that GitHub API doesn't support directly
    if (query.search) {
      const searchTerm = query.search.toLowerCase();
      filteredRepos = filteredRepos.filter(repo =>
        repo.name.toLowerCase().includes(searchTerm) ||
        (repo.description && repo.description.toLowerCase().includes(searchTerm))
      );
    }

    if (query.language) {
      filteredRepos = filteredRepos.filter(repo => repo.language === query.language);
    }

    if (query.archived !== undefined) {
      filteredRepos = filteredRepos.filter(repo => repo.archived === query.archived);
    }

    if (query.fork !== undefined) {
      filteredRepos = filteredRepos.filter(repo => repo.fork === query.fork);
    }

    const pagination = this.buildPaginationInfo(
      query.page || 1,
      query.per_page || 30,
      totalCount,
      response.headers.link
    );

    return {
      success: true,
      data: filteredRepos,
      pagination,
      rateLimit,
    };
  }

  public async getRepository(
    accessToken: string,
    owner: string,
    repo: string
  ): Promise<GitHubRepository> {
    const response = await this.api.get(`/repos/${owner}/${repo}`, {
      headers: this.getAuthHeaders(accessToken),
    });
    return response.data;
  }

  public async createRepository(
    accessToken: string,
    data: CreateRepositoryRequest
  ): Promise<GitHubRepository> {
    const endpoint = data.org ? `/orgs/${data.org}/repos` : "/user/repos";
    
    // Remove org from data before sending to GitHub API
    const { org, ...repoData } = data;
    
    const response = await this.api.post(endpoint, repoData, {
      headers: this.getAuthHeaders(accessToken),
    });
    return response.data;
  }

  public async createRepositoryFromTemplate(
    accessToken: string,
    templateOwner: string,
    templateRepo: string,
    data: CreateRepositoryRequest
  ): Promise<GitHubRepository> {
    const { org, template_owner, template_repo, ...repoData } = data;
    
    const response = await this.api.post(
      `/repos/${templateOwner}/${templateRepo}/generate`,
      {
        ...repoData,
        owner: org || undefined,
      },
      {
        headers: {
          ...this.getAuthHeaders(accessToken),
          Accept: "application/vnd.github.baptiste-preview+json",
        },
      }
    );
    return response.data;
  }

  public async updateRepository(
    accessToken: string,
    owner: string,
    repo: string,
    data: UpdateRepositoryRequest
  ): Promise<GitHubRepository> {
    const response = await this.api.patch(`/repos/${owner}/${repo}`, data, {
      headers: this.getAuthHeaders(accessToken),
    });
    return response.data;
  }

  public async deleteRepository(
    accessToken: string,
    owner: string,
    repo: string
  ): Promise<void> {
    await this.api.delete(`/repos/${owner}/${repo}`, {
      headers: this.getAuthHeaders(accessToken),
    });
  }

  public async getFileContent(
    accessToken: string,
    owner: string,
    repo: string,
    path: string,
    ref?: string
  ): Promise<GitHubContent> {
    const params = ref ? `?ref=${encodeURIComponent(ref)}` : "";
    const response = await this.api.get(`/repos/${owner}/${repo}/contents/${path}${params}`, {
      headers: this.getAuthHeaders(accessToken),
    });
    return response.data;
  }

  public async createFile(
    accessToken: string,
    owner: string,
    repo: string,
    path: string,
    data: CreateFileRequest
  ): Promise<{ content: GitHubContent; commit: any }> {
    const response = await this.api.put(`/repos/${owner}/${repo}/contents/${path}`, data, {
      headers: this.getAuthHeaders(accessToken),
    });
    return response.data;
  }

  public async updateFile(
    accessToken: string,
    owner: string,
    repo: string,
    path: string,
    data: UpdateFileRequest
  ): Promise<{ content: GitHubContent; commit: any }> {
    const response = await this.api.put(`/repos/${owner}/${repo}/contents/${path}`, data, {
      headers: this.getAuthHeaders(accessToken),
    });
    return response.data;
  }

  public async deleteFile(
    accessToken: string,
    owner: string,
    repo: string,
    path: string,
    data: DeleteFileRequest
  ): Promise<{ commit: any }> {
    const response = await this.api.delete(`/repos/${owner}/${repo}/contents/${path}`, {
      headers: this.getAuthHeaders(accessToken),
      data,
    });
    return response.data;
  }

  public async searchRepositories(
    accessToken: string,
    query: string,
    options?: {
      sort?: "stars" | "forks" | "help-wanted-issues" | "updated";
      order?: "desc" | "asc";
      page?: number;
      per_page?: number;
    }
  ): Promise<{
    total_count: number;
    incomplete_results: boolean;
    items: GitHubRepository[];
  }> {
    const params = new URLSearchParams({ q: query });
    
    if (options?.sort) params.append("sort", options.sort);
    if (options?.order) params.append("order", options.order);
    if (options?.page) params.append("page", options.page.toString());
    if (options?.per_page) params.append("per_page", options.per_page.toString());

    const response = await this.api.get(`/search/repositories?${params.toString()}`, {
      headers: this.getAuthHeaders(accessToken),
    });
    return response.data;
  }

  public async getRateLimit(accessToken: string): Promise<GitHubRateLimit> {
    const response = await this.api.get("/rate_limit", {
      headers: this.getAuthHeaders(accessToken),
    });
    return response.data.rate;
  }

  // Git Database API methods for bulk file operations
  public async createBlob(
    accessToken: string,
    owner: string,
    repo: string,
    content: string,
    encoding: "utf-8" | "base64" = "utf-8"
  ): Promise<{ sha: string; url: string }> {
    const response = await this.api.post(`/repos/${owner}/${repo}/git/blobs`, {
      content,
      encoding
    }, {
      headers: this.getAuthHeaders(accessToken),
    });
    return response.data;
  }

  public async getTree(
    accessToken: string,
    owner: string,
    repo: string,
    treeSha: string
  ): Promise<{
    sha: string;
    url: string;
    tree: Array<{
      path: string;
      mode: string;
      type: string;
      sha: string;
      size?: number;
      url: string;
    }>;
    truncated: boolean;
  }> {
    const response = await this.api.get(`/repos/${owner}/${repo}/git/trees/${treeSha}`, {
      headers: this.getAuthHeaders(accessToken),
    });
    return response.data;
  }

  public async createTree(
    accessToken: string,
    owner: string,
    repo: string,
    tree: Array<{
      path: string;
      mode: "100644" | "100755" | "040000" | "160000" | "120000";
      type: "blob" | "tree" | "commit";
      sha: string;
    }>,
    baseTree?: string
  ): Promise<{
    sha: string;
    url: string;
    tree: Array<{
      path: string;
      mode: string;
      type: string;
      sha: string;
      size?: number;
      url: string;
    }>;
  }> {
    const data: any = { tree };
    if (baseTree) {
      data.base_tree = baseTree;
    }

    const response = await this.api.post(`/repos/${owner}/${repo}/git/trees`, data, {
      headers: this.getAuthHeaders(accessToken),
    });
    return response.data;
  }

  public async createCommit(
    accessToken: string,
    owner: string,
    repo: string,
    message: string,
    tree: string,
    parents: string[]
  ): Promise<{
    sha: string;
    url: string;
    html_url: string;
    author: any;
    committer: any;
    message: string;
    tree: { sha: string; url: string };
    parents: Array<{ sha: string; url: string; html_url: string }>;
  }> {
    const response = await this.api.post(`/repos/${owner}/${repo}/git/commits`, {
      message,
      tree,
      parents
    }, {
      headers: this.getAuthHeaders(accessToken),
    });
    return response.data;
  }

  public async getReference(
    accessToken: string,
    owner: string,
    repo: string,
    ref: string
  ): Promise<{
    ref: string;
    node_id: string;
    url: string;
    object: {
      sha: string;
      type: string;
      url: string;
    };
  }> {
    const response = await this.api.get(`/repos/${owner}/${repo}/git/refs/heads/${ref}`, {
      headers: this.getAuthHeaders(accessToken),
    });
    return response.data;
  }

  public async updateReference(
    accessToken: string,
    owner: string,
    repo: string,
    ref: string,
    sha: string
  ): Promise<{
    ref: string;
    node_id: string;
    url: string;
    object: {
      sha: string;
      type: string;
      url: string;
    };
  }> {
    const response = await this.api.patch(`/repos/${owner}/${repo}/git/refs/heads/${ref}`, {
      sha
    }, {
      headers: this.getAuthHeaders(accessToken),
    });
    return response.data;
  }

  public async bulkFileUpload(
    accessToken: string,
    owner: string,
    repo: string,
    files: Array<{
      path: string;
      content: string;
      encoding?: "utf-8" | "base64";
    }>,
    message: string,
    branch: string = "main"
  ): Promise<{
    success: boolean;
    commitSha?: string;
    error?: string;
    filesProcessed: number;
    totalFiles: number;
  }> {
    try {
      console.log(`🔄 GitHub Service: Starting bulk upload to ${owner}/${repo} on branch '${branch}'`);
      
      // Handle empty file arrays
      if (files.length === 0) {
        return {
          success: true,
          filesProcessed: 0,
          totalFiles: 0
        };
      }

      // Step 1: Get the target repository info to check default branch
      let targetRepo;
      try {
        targetRepo = await this.getRepository(accessToken, owner, repo);
        console.log(`📂 GitHub Service: Target repo default branch is '${targetRepo.default_branch}'`);
        
        // If user didn't specify a branch or specified "main" but repo uses different default
        if (branch === "main" && targetRepo.default_branch !== "main") {
          console.log(`🔄 GitHub Service: Switching from 'main' to default branch '${targetRepo.default_branch}'`);
          branch = targetRepo.default_branch;
        }
      } catch (repoError) {
        throw new Error(`Repository ${owner}/${repo} not found or inaccessible`);
      }

      // Step 2: Get the current branch reference (handle empty repos)
      let branchRef;
      let currentCommitSha;
      let currentTree;

      try {
        branchRef = await this.getReference(accessToken, owner, repo, branch);
        currentCommitSha = branchRef.object.sha;
        currentTree = await this.getTree(accessToken, owner, repo, currentCommitSha);
        console.log(`📍 GitHub Service: Found existing branch '${branch}' with commit ${currentCommitSha.substring(0, 8)}`);
      } catch (error) {
        // Repository exists but branch doesn't exist - this might be an empty repository
        console.log(`📍 GitHub Service: Branch '${branch}' not found, assuming empty repository`);
        currentCommitSha = null;
        currentTree = null;
      }

      // Step 3: Create blobs for each file
      const blobPromises = files.map(async (file) => {
        const blob = await this.createBlob(accessToken, owner, repo, file.content, file.encoding || "utf-8");
        return {
          path: file.path,
          mode: "100644" as const,
          type: "blob" as const,
          sha: blob.sha
        };
      });

      const treeItems = await Promise.all(blobPromises);

      // Step 4: Create a new tree with the new files
      const newTree = await this.createTree(
        accessToken,
        owner,
        repo,
        treeItems,
        currentTree?.sha // Use base tree only if it exists
      );

      // Step 5: Create a new commit
      const parents = currentCommitSha ? [currentCommitSha] : []; // No parents for initial commit
      const newCommit = await this.createCommit(
        accessToken,
        owner,
        repo,
        message,
        newTree.sha,
        parents
      );

      // Step 6: Update or create the branch reference
      if (currentCommitSha) {
        // Update existing branch
        await this.updateReference(accessToken, owner, repo, branch, newCommit.sha);
      } else {
        // Create new branch for empty repository
        await this.api.post(`/repos/${owner}/${repo}/git/refs`, {
          ref: `refs/heads/${branch}`,
          sha: newCommit.sha
        }, {
          headers: this.getAuthHeaders(accessToken),
        });
      }

      return {
        success: true,
        commitSha: newCommit.sha,
        filesProcessed: files.length,
        totalFiles: files.length
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      // Enhanced error logging for debugging
      console.error("🔥 GitHub Service: Bulk file upload failed:", {
        owner,
        repo,
        branch,
        fileCount: files.length,
        error: errorMessage,
        stack: error instanceof Error ? error.stack : "No stack trace"
      });

      // Ensure we always return a proper response structure
      const failureResponse = {
        success: false,
        error: `Bulk upload failed: ${errorMessage}`,
        filesProcessed: 0,
        totalFiles: files.length
      };

      console.log("🔥 GitHub Service: Returning failure response:", failureResponse);
      return failureResponse;
    }
  }

  // Advanced batch file reading methods
  public async getRepositoryTreeRecursive(
    accessToken: string,
    owner: string,
    repo: string,
    branch: string = "main"
  ): Promise<{
    success: boolean;
    files: Array<{
      path: string;
      content: string;
      encoding: string;
      sha: string;
      size: number;
    }>;
    totalFiles: number;
    error?: string;
  }> {
    try {
      console.log(`🌳 GitHub Service: Getting recursive tree for ${owner}/${repo}`);

      // Step 1: Get the branch reference
      let branchRef;
      try {
        branchRef = await this.getReference(accessToken, owner, repo, branch);
      } catch (error) {
        // Try default branch if specified branch doesn't exist
        try {
          const repoInfo = await this.getRepository(accessToken, owner, repo);
          branchRef = await this.getReference(accessToken, owner, repo, repoInfo.default_branch);
        } catch (defaultError) {
          return {
            success: false,
            files: [],
            totalFiles: 0,
            error: `Repository ${owner}/${repo} appears to be empty or inaccessible`
          };
        }
      }

      // Step 2: Get the recursive tree (up to 100,000 entries, 7MB limit)
      const tree = await this.api.get(`/repos/${owner}/${repo}/git/trees/${branchRef.object.sha}?recursive=1`, {
        headers: this.getAuthHeaders(accessToken),
      });

      const treeData = tree.data;
      console.log(`🌳 GitHub Service: Found ${treeData.tree.length} items in tree`);

      // Step 3: Filter only files and prepare batch blob requests
      const fileItems = treeData.tree.filter((item: any) => item.type === "blob");
      console.log(`📁 GitHub Service: Found ${fileItems.length} files to process`);

      if (fileItems.length === 0) {
        return {
          success: true,
          files: [],
          totalFiles: 0
        };
      }

      // Step 4: Process files in batches to avoid memory issues
      const BATCH_SIZE = 50; // Process 50 files at a time
      const allFiles: Array<{
        path: string;
        content: string;
        encoding: string;
        sha: string;
        size: number;
      }> = [];

      for (let i = 0; i < fileItems.length; i += BATCH_SIZE) {
        const batch = fileItems.slice(i, i + BATCH_SIZE);
        console.log(`📦 GitHub Service: Processing batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(fileItems.length/BATCH_SIZE)} (${batch.length} files)`);

        // Create concurrent requests for this batch
        const batchPromises = batch.map(async (item: any) => {
          try {
            // Check file size limitations
            if (item.size > 100 * 1024 * 1024) { // 100MB limit
              console.warn(`⚠️ Skipping large file: ${item.path} (${item.size} bytes > 100MB limit)`);
              return null;
            }

            const blobResponse = await this.api.get(`/repos/${owner}/${repo}/git/blobs/${item.sha}`, {
              headers: this.getAuthHeaders(accessToken),
            });

            return {
              path: item.path,
              content: blobResponse.data.content,
              encoding: blobResponse.data.encoding,
              sha: item.sha,
              size: item.size || blobResponse.data.size || 0
            };
          } catch (error) {
            console.error(`❌ Failed to get blob for ${item.path}:`, error);
            return null;
          }
        });

        const batchResults = await Promise.all(batchPromises);
        const validResults = batchResults.filter(result => result !== null);
        allFiles.push(...validResults);

        // Add small delay between batches to be respectful of rate limits
        if (i + BATCH_SIZE < fileItems.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      console.log(`✅ GitHub Service: Successfully processed ${allFiles.length}/${fileItems.length} files`);

      return {
        success: true,
        files: allFiles,
        totalFiles: allFiles.length
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("🔥 GitHub Service: Recursive tree fetch failed:", {
        owner,
        repo,
        branch,
        error: errorMessage
      });

      return {
        success: false,
        files: [],
        totalFiles: 0,
        error: `Failed to fetch repository tree: ${errorMessage}`
      };
    }
  }

  public async downloadRepositoryArchive(
    accessToken: string,
    owner: string,
    repo: string,
    format: "zipball" | "tarball" = "zipball",
    ref: string = "main"
  ): Promise<{
    success: boolean;
    downloadUrl?: string;
    error?: string;
  }> {
    try {
      console.log(`📦 GitHub Service: Getting archive URL for ${owner}/${repo} (${format})`);
      
      // This API call is expected to return a 302 redirect, which axios treats as an error
      await this.api.get(`/repos/${owner}/${repo}/${format}/${ref}`, {
        headers: this.getAuthHeaders(accessToken),
        maxRedirects: 0, // We want the redirect URL, not to follow it
      });

      // If we reach here without an error, something unexpected happened
      return {
        success: false,
        error: "Expected redirect response but got different status"
      };

    } catch (error: any) {
      // GitHub returns 302 redirect which axios treats as an error
      if (error.response && error.response.status === 302) {
        const downloadUrl = error.response.headers.location;
        console.log(`✅ GitHub Service: Got archive download URL: ${downloadUrl}`);
        
        return {
          success: true,
          downloadUrl
        };
      }

      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("🔥 GitHub Service: Archive download failed:", {
        owner,
        repo,
        format,
        ref,
        error: errorMessage
      });

      return {
        success: false,
        error: `Failed to get archive download URL: ${errorMessage}`
      };
    }
  }
} 