const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export interface Repository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  owner: {
    login: string;
    avatar_url: string;
    type: string;
  };
  html_url: string;
  clone_url: string;
  ssh_url: string;
  language: string | null;
  stargazers_count: number;
  watchers_count: number;
  forks_count: number;
  open_issues_count: number;
  archived: boolean;
  disabled: boolean;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  size: number;
  default_branch: string;
  visibility: "public" | "private" | "internal";
  permissions?: {
    admin: boolean;
    maintain: boolean;
    push: boolean;
    triage: boolean;
    pull: boolean;
  };
}

export interface RepositoryListOptions {
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

export interface SearchOptions {
  q: string;
  sort?: "stars" | "forks" | "help-wanted-issues" | "updated";
  order?: "desc" | "asc";
  page?: number;
  per_page?: number;
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

export interface CreateRepositoryRequest {
  name: string;
  description?: string;
  homepage?: string;
  private?: boolean;
  visibility?: "public" | "private" | "internal";
  has_issues?: boolean;
  has_projects?: boolean;
  has_wiki?: boolean;
  auto_init?: boolean;
  gitignore_template?: string;
  license_template?: string;
  org?: string;
}

export interface UpdateRepositoryRequest {
  name?: string;
  description?: string;
  homepage?: string;
  private?: boolean;
  visibility?: "public" | "private" | "internal";
  archived?: boolean;
  default_branch?: string;
}

export interface FileTransferItem {
  path: string;
  content: string;
  encoding?: string;
}

export interface BatchFileTransferRequest {
  files: FileTransferItem[];
  message: string;
  branch?: string;
  folderPrefix?: string;
}

export interface BatchFileTransferResult {
  success: boolean;
  transferredFiles: number;
  totalFiles: number;
  commitSha?: string;
  error?: string;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
  used: number;
}

export interface MergeProgress {
  currentRepo: string;
  processedRepos: number;
  totalRepos: number;
  transferredFiles: number;
  skippedFiles: number;
  phase: string;
}

export interface MergeResult {
  success: boolean;
  processedRepos: number;
  transferredFiles: number;
  skippedFiles: number;
  errors: string[];
  details: RepositoryMergeDetail[];
  totalTime: number;
  rateLimitInfo?: RateLimitInfo;
}

export interface RepositoryMergeDetail {
  repository: string;
  success: boolean;
  transferredFiles: number;
  skippedFiles: number;
  errors: string[];
  method: string;
}

class RepositoryService {
  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem("github_token");
    console.log("Token from localStorage:", token ? `${token.substring(0, 10)}...` : "null");
    if (!token) {
      throw new Error("No authentication token found. Please log in again.");
    }
    return {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    console.log(`🔍 Frontend: handleResponse called with status ${response.status}`);
    
    // Log response headers for debugging
    const headers = Object.fromEntries(response.headers.entries());
    console.log(`📋 Frontend: Response headers:`, headers);
    
    const responseText = await response.text();
    console.log(`📄 Frontend: Raw response text:`, responseText);
    
    if (!response.ok) {
      console.error(`❌ Frontend: Response not OK - ${response.status} ${response.statusText}`);
      let errorData: any = {};
      try {
        errorData = JSON.parse(responseText);
      } catch (parseError) {
        console.error(`❌ Frontend: Failed to parse error response as JSON:`, parseError);
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${responseText}`);
      }
      throw new Error(errorData.message || `Request failed: ${response.status} ${response.statusText}`);
    }

    try {
      const jsonData = JSON.parse(responseText);
      console.log(`✅ Frontend: Parsed JSON data:`, JSON.stringify(jsonData, null, 2));
      
      // Check if response has the expected API structure with data field
      if (jsonData && typeof jsonData === 'object' && 'data' in jsonData) {
        console.log(`📦 Frontend: Extracting data field:`, JSON.stringify(jsonData.data, null, 2));
        return jsonData.data;
      } else {
        console.log(`📄 Frontend: No data field found, returning entire response`);
        return jsonData;
      }
    } catch (parseError) {
      console.error(`❌ Frontend: Failed to parse response as JSON:`, parseError);
      console.error(`❌ Frontend: Response text was:`, responseText);
      throw new Error(`Failed to parse API response as JSON: ${parseError}`);
    }
  }



  async getRateLimit(): Promise<RateLimitInfo> {
    const response = await fetch(`${API_BASE_URL}/api/repositories/rate-limit`, {
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse(response);
  }

  async getRepositories(options: RepositoryListOptions = {}): Promise<{
    repositories: Repository[];
    total_count: number;
    page: number;
    per_page: number;
    has_next: boolean;
    has_prev: boolean;
  }> {
    const params = new URLSearchParams();
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    });

    const response = await fetch(`${API_BASE_URL}/api/repositories?${params}`, {
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse(response);
  }

  async searchRepositories(options: SearchOptions): Promise<{
    repositories: Repository[];
    total_count: number;
    incomplete_results: boolean;
  }> {
    const params = new URLSearchParams();
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    });

    const response = await fetch(`${API_BASE_URL}/api/repositories/search?${params}`, {
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse(response);
  }

  async getRepository(owner: string, repo: string): Promise<Repository> {
    const response = await fetch(`${API_BASE_URL}/api/repositories/${owner}/${repo}`, {
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse(response);
  }

  async createRepository(data: CreateRepositoryRequest): Promise<Repository> {
    const response = await fetch(`${API_BASE_URL}/api/repositories`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    return this.handleResponse(response);
  }

  async updateRepository(owner: string, repo: string, data: UpdateRepositoryRequest): Promise<Repository> {
    const response = await fetch(`${API_BASE_URL}/api/repositories/${owner}/${repo}`, {
      method: "PATCH",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    return this.handleResponse(response);
  }

  async deleteRepository(owner: string, repo: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/repositories/${owner}/${repo}`, {
      method: "DELETE",
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to delete repository`);
    }
  }

  async batchOperation(request: BatchOperationRequest): Promise<{
    results: BatchOperationResult[];
    total_requested: number;
    successful: number;
    failed: number;
    errors: string[];
  }> {
    const response = await fetch(`${API_BASE_URL}/api/repositories/batch`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Batch operation failed: ${response.status} ${response.statusText}`);
    }

    const data = await this.handleResponse<{
      results: BatchOperationResult[];
      total_requested: number;
      successful: number;
      failed: number;
    }>(response);
    
    // Extract errors from failed results for better error reporting
    const errors = data.results?.filter(r => !r.success).map(r => r.error || "Unknown error") || [];
    
    return {
      ...data,
      errors,
    };
  }

  async getFileContent(owner: string, repo: string, path: string, ref?: string): Promise<{
    type: "file" | "dir";
    content?: string;
    encoding?: string;
    size: number;
    name: string;
    path: string;
    sha: string;
    download_url?: string;
    html_url: string;
  }> {
    const params = ref ? `?ref=${encodeURIComponent(ref)}` : "";
    const response = await fetch(`${API_BASE_URL}/api/repositories/${owner}/${repo}/contents/${path}${params}`, {
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse(response);
  }

  async createOrUpdateFile(
    owner: string, 
    repo: string, 
    path: string, 
    data: {
      message: string;
      content: string;
      sha?: string;
      branch?: string;
    }
  ): Promise<{
    content: {
      name: string;
      path: string;
      sha: string;
      size: number;
      download_url: string;
      html_url: string;
    };
    commit: {
      sha: string;
      html_url: string;
      message: string;
      author: {
        name: string;
        email: string;
        date: string;
      };
    };
  }> {
    const response = await fetch(`${API_BASE_URL}/api/repositories/${owner}/${repo}/contents/${path}`, {
      method: "PUT",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    return this.handleResponse(response);
  }

  async batchFileTransfer(
    owner: string,
    repo: string,
    request: BatchFileTransferRequest
  ): Promise<BatchFileTransferResult> {
    console.log(`🔄 Frontend: Starting batch file transfer for ${owner}/${repo} with ${request.files.length} files`);
    
    // Calculate approximate payload size to determine if chunking is needed
    const estimatedPayloadSize = this.estimatePayloadSize(request.files);
    const maxPayloadSize = 80 * 1024 * 1024; // 80MB (slightly under 100MB server limit)
    
    console.log(`📊 Frontend: Estimated payload size: ${Math.round(estimatedPayloadSize / 1024 / 1024)}MB`);
    
    if (estimatedPayloadSize > maxPayloadSize || request.files.length > 200) {
      console.log(`📦 Frontend: Large payload detected, using chunked transfer`);
      return this.chunkedBatchFileTransfer(owner, repo, request);
    }
    
    // Standard single-batch transfer for smaller payloads
    return this.singleBatchFileTransfer(owner, repo, request);
  }

  private estimatePayloadSize(files: Array<{ path: string; content: string; encoding?: string }>): number {
    let totalSize = 0;
    for (const file of files) {
      // Estimate JSON overhead + content size
      totalSize += file.path.length * 2; // JSON escaping
      totalSize += file.content.length; // Base64 content
      totalSize += 100; // JSON structure overhead per file
    }
    return totalSize;
  }

  private async singleBatchFileTransfer(
    owner: string,
    repo: string,
    request: BatchFileTransferRequest
  ): Promise<BatchFileTransferResult> {
    try {
      const response = await this.makeRateLimitedRequest<BatchFileTransferResult>(
        `${API_BASE_URL}/api/repositories/${owner}/${repo}/batch-files`,
        {
          method: "POST",
          headers: this.getAuthHeaders(),
          body: JSON.stringify(request),
        }
      );

      console.log(`✅ Frontend: Single batch transfer completed: ${response.transferredFiles}/${response.totalFiles} files`);
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error(`❌ Frontend: Single batch transfer failed:`, error);
      
      return {
        success: false,
        transferredFiles: 0,
        totalFiles: request.files.length,
        error: errorMessage
      };
    }
  }

  private async chunkedBatchFileTransfer(
    owner: string,
    repo: string,
    request: BatchFileTransferRequest
  ): Promise<BatchFileTransferResult> {
    console.log(`🔄 Frontend: Starting chunked batch transfer`);
    
    const chunkSize = this.calculateOptimalChunkSize(request.files);
    const chunks = this.chunkFiles(request.files, chunkSize);
    
    console.log(`📦 Frontend: Split ${request.files.length} files into ${chunks.length} chunks (${chunkSize} files per chunk)`);
    
    let totalTransferred = 0;
    let totalFiles = request.files.length;
    const errors: string[] = [];
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const chunkRequest: BatchFileTransferRequest = {
        ...request,
        files: chunk,
        message: `${request.message} (chunk ${i + 1}/${chunks.length})`
      };
      
      console.log(`📦 Frontend: Processing chunk ${i + 1}/${chunks.length} (${chunk.length} files)`);
      
      try {
        // Add delay between chunks to avoid overwhelming the server
        if (i > 0) {
          console.log(`⏰ Frontend: Waiting 2 seconds between chunks...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        const chunkResult = await this.singleBatchFileTransfer(owner, repo, chunkRequest);
        
        if (chunkResult.success) {
          totalTransferred += chunkResult.transferredFiles;
          console.log(`✅ Frontend: Chunk ${i + 1} completed: ${chunkResult.transferredFiles} files`);
        } else {
          errors.push(`Chunk ${i + 1}: ${chunkResult.error}`);
          console.error(`❌ Frontend: Chunk ${i + 1} failed:`, chunkResult.error);
        }
      } catch (chunkError) {
        const errorMsg = chunkError instanceof Error ? chunkError.message : "Unknown error";
        errors.push(`Chunk ${i + 1}: ${errorMsg}`);
        console.error(`❌ Frontend: Chunk ${i + 1} error:`, chunkError);
      }
    }
    
    const success = totalTransferred > 0 && errors.length === 0;
    
    console.log(`🏁 Frontend: Chunked transfer completed: ${totalTransferred}/${totalFiles} files, ${errors.length} errors`);
    
    return {
      success,
      transferredFiles: totalTransferred,
      totalFiles,
      error: errors.length > 0 ? errors.join("; ") : undefined
    };
  }

  private calculateOptimalChunkSize(files: Array<{ path: string; content: string; encoding?: string }>): number {
    // Calculate average file size
    const totalSize = files.reduce((sum, file) => sum + file.content.length, 0);
    const avgFileSize = totalSize / files.length;
    
    // Aim for chunks around 20-30MB
    const targetChunkSize = 25 * 1024 * 1024; // 25MB
    const filesPerChunk = Math.max(1, Math.floor(targetChunkSize / avgFileSize));
    
    // Cap at reasonable limits
    return Math.min(filesPerChunk, 50); // Max 50 files per chunk
  }

  private chunkFiles<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  // Advanced batch file reading methods with aggressive rate limiting
  async getRepositoryTreeRecursive(
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
      console.log(`🌳 Frontend: Getting recursive tree for ${owner}/${repo}`);
      
      const url = `${API_BASE_URL}/api/repositories/${owner}/${repo}/tree-recursive?branch=${encodeURIComponent(branch)}`;
      
      // Use rate-limited request with retries
      const apiResponse = await this.makeRateLimitedRequest<{
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
      }>(url, {
        method: "GET",
        headers: this.getAuthHeaders(),
      });

      console.log(`🌳 Frontend: Successfully fetched ${apiResponse.totalFiles} files using recursive tree API`);

      return apiResponse;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error(`❌ Frontend: Recursive tree fetch failed:`, error);
      
      return {
        success: false,
        files: [],
        totalFiles: 0,
        error: `Recursive tree fetch failed: ${errorMessage}`
      };
    }
  }

  async getRepositoryArchiveUrl(
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
      console.log(`📦 Frontend: Getting archive URL for ${owner}/${repo}`);
      
      const response = await fetch(
        `${API_BASE_URL}/api/repositories/${owner}/${repo}/archive-url?format=${format}&ref=${encodeURIComponent(ref)}`,
        {
          method: "GET",
          headers: this.getAuthHeaders(),
        }
      );

      console.log(`📦 Frontend: Archive URL API response status: ${response.status}`);

      const apiResponse = await this.handleResponse<{
        success: boolean;
        downloadUrl?: string;
        error?: string;
      }>(response);

      if (apiResponse.success && apiResponse.downloadUrl) {
        console.log(`📦 Frontend: Successfully got archive URL: ${apiResponse.downloadUrl}`);
      }

      return apiResponse;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error(`❌ Frontend: Archive URL fetch failed:`, error);
      
      return {
        success: false,
        error: `Archive URL fetch failed: ${errorMessage}`
      };
    }
  }

  // Ultra-conservative file reading for rate limit recovery
  async getRepositoryFilesConservative(
    owner: string,
    repo: string,
    branch: string = "main"
  ): Promise<{
    success: boolean;
    files: Array<{
      path: string;
      content: string;
      encoding: string;
    }>;
    totalFiles: number;
    method: "archive-download" | "minimal-api" | "failed";
    error?: string;
  }> {
    console.log(`🐌 Frontend: Using CONSERVATIVE mode for ${owner}/${repo}`);
    
    try {
      // Strategy 1: Try archive download (most efficient for rate limits)
      console.log(`📦 Frontend: Attempting archive download method...`);
      
      const archiveResult = await this.getRepositoryArchiveUrl(owner, repo, "zipball", branch);
      
      if (archiveResult.success && archiveResult.downloadUrl) {
        console.log(`🎯 Frontend: Archive download available - this would be most efficient`);
        
        // For now, return a message that archive processing isn't implemented yet
        return {
          success: false,
          files: [],
          totalFiles: 0,
          method: "archive-download",
          error: "Archive download available but client-side extraction not implemented yet. Use minimal API mode."
        };
      }
      
      // Strategy 2: Minimal API approach - only scan root directory
      console.log(`📁 Frontend: Falling back to minimal API calls...`);
      
      // Add aggressive delay before ANY API call
      console.log(`⏰ Conservative mode: Waiting 10 seconds before API call...`);
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      const url = `${API_BASE_URL}/api/repositories/${owner}/${repo}/contents`;
      
      const response = await this.makeRateLimitedRequest<any>(url, {
        method: "GET",
        headers: this.getAuthHeaders(),
      });
      
      if (!response || !Array.isArray(response)) {
        return {
          success: true,
          files: [],
          totalFiles: 0,
          method: "minimal-api"
        };
      }
      
      // Only process files in root directory to minimize API calls
      const rootFiles = response.filter(item => item.type === "file");
      const files = [];
      
      console.log(`📂 Conservative mode: Found ${rootFiles.length} files in root directory`);
      
      // Process files one by one with long delays
      for (let i = 0; i < rootFiles.length; i++) {
        const file = rootFiles[i];
        
        console.log(`📄 Conservative mode: Processing file ${i + 1}/${rootFiles.length}: ${file.name}`);
        
        // Add aggressive delay between each file
        if (i > 0) {
          console.log(`⏰ Conservative mode: Waiting 5 seconds between files...`);
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
        
        try {
          const fileUrl = `${API_BASE_URL}/api/repositories/${owner}/${repo}/contents/${encodeURIComponent(file.path)}`;
          
          const fileContent = await this.makeRateLimitedRequest<any>(fileUrl, {
            method: "GET",
            headers: this.getAuthHeaders(),
          });
          
          files.push({
            path: file.path,
            content: fileContent.content || "",
            encoding: fileContent.encoding || "base64"
          });
          
        } catch (fileError) {
          console.error(`❌ Failed to get file ${file.path}:`, fileError);
          // Continue with other files
        }
      }
      
      console.log(`✅ Conservative mode: Successfully processed ${files.length}/${rootFiles.length} root files`);
      
      return {
        success: true,
        files,
        totalFiles: files.length,
        method: "minimal-api"
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error(`❌ Frontend: Conservative file reading failed:`, error);
      
      return {
        success: false,
        files: [],
        totalFiles: 0,
        method: "failed",
        error: `Conservative file reading failed: ${errorMessage}`
      };
    }
  }

  // Enhanced rate limiting with exponential backoff
  private async handleRateLimitError(response: Response): Promise<void> {
    const rateLimitReset = response.headers.get('x-ratelimit-reset');
    const retryAfter = response.headers.get('retry-after');
    
    let waitTime = 60000; // Default 1 minute
    
    if (retryAfter) {
      // retryAfter is in seconds, convert to milliseconds
      waitTime = parseInt(retryAfter) * 1000;
      console.log(`🚫 Rate limit hit! Retry-After header says wait ${retryAfter} seconds`);
    } else if (rateLimitReset) {
      // x-ratelimit-reset is Unix timestamp, calculate wait time
      const resetTime = parseInt(rateLimitReset) * 1000;
      const now = Date.now();
      waitTime = Math.max(60000, resetTime - now + 5000); // Add 5 second buffer
      console.log(`🚫 Rate limit hit! Waiting until reset time: ${new Date(resetTime).toISOString()}`);
    }
    
    // Cap maximum wait time at 20 minutes for user experience
    waitTime = Math.min(waitTime, 20 * 60 * 1000);
    
    console.log(`⏰ Waiting ${Math.round(waitTime/1000)} seconds for rate limit recovery...`);
    
    // Show user-friendly message about the wait
    const minutes = Math.round(waitTime / 60000);
    if (minutes > 1) {
      throw new Error(`Rate limit exceeded. GitHub requires waiting ${minutes} minutes. Please try again later or use fewer repositories.`);
    }
    
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }

  private async makeRateLimitedRequest<T>(
    url: string, 
    options: RequestInit,
    maxRetries: number = 3
  ): Promise<T> {
    let attempt = 1;
    
    while (attempt <= maxRetries) {
      try {
        console.log(`🔄 API Request attempt ${attempt}/${maxRetries}: ${url}`);
        
        const response = await fetch(url, options);
        
        if (response.status === 429) {
          console.log(`⚠️ Rate limit hit on attempt ${attempt}/${maxRetries}`);
          
          if (attempt === maxRetries) {
            await this.handleRateLimitError(response);
            throw new Error("Rate limit exceeded after maximum retries. Please wait before trying again.");
          }
          
          // Exponential backoff: 2^attempt minutes
          const backoffTime = Math.pow(2, attempt) * 60000;
          console.log(`⏰ Exponential backoff: waiting ${backoffTime/60000} minutes...`);
          await new Promise(resolve => setTimeout(resolve, backoffTime));
          
          attempt++;
          continue;
        }
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        return await this.handleResponse<T>(response);
        
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }
        
        console.log(`❌ Request failed on attempt ${attempt}/${maxRetries}:`, error);
        
        // Exponential backoff for non-rate-limit errors too
        const backoffTime = Math.pow(2, attempt) * 30000; // 30s, 60s, 120s
        console.log(`⏰ Error backoff: waiting ${backoffTime/1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, backoffTime));
        
        attempt++;
      }
    }
    
    throw new Error("Max retries exceeded");
  }

  async mergeRepositories(
    repositories: string[],
    targetOwner: string,
    targetRepo: string,
    separateFolders: boolean = true,
    onProgress?: (progress: MergeProgress) => void,
    useConservativeMode: boolean = false,
    conservativeDelaySeconds: number = 15
  ): Promise<MergeResult> {
    const startTime = Date.now();
    const result: MergeResult = {
      success: false,
      processedRepos: 0,
      transferredFiles: 0,
      skippedFiles: 0,
      errors: [],
      details: [],
      totalTime: 0,
      rateLimitInfo: undefined,
    };

    console.log(`🚀 Frontend: Starting ${useConservativeMode ? 'CONSERVATIVE' : 'OPTIMIZED'} merge of ${repositories.length} repositories`);
    
    if (useConservativeMode) {
      console.log(`🐌 CONSERVATIVE MODE: Using ${conservativeDelaySeconds}s delays between repositories`);
    }

    try {
      for (let i = 0; i < repositories.length; i++) {
        const repoPath = repositories[i];
        const [owner, repo] = repoPath.split("/");

        const repoResult: RepositoryMergeDetail = {
          repository: repoPath,
          success: false,
          transferredFiles: 0,
          skippedFiles: 0,
          errors: [],
          method: useConservativeMode ? "conservative" : "optimized",
        };

        try {
          console.log(`📦 Processing repository ${i + 1}/${repositories.length}: ${repoPath}`);

          onProgress?.({
            currentRepo: repoPath,
            processedRepos: i,
            totalRepos: repositories.length,
            transferredFiles: result.transferredFiles,
            skippedFiles: result.skippedFiles,
            phase: "reading",
          });

          // CONSERVATIVE MODE: Add aggressive delays between repositories
          if (useConservativeMode && i > 0) {
            const delayMs = conservativeDelaySeconds * 1000;
            console.log(`⏰ CONSERVATIVE MODE: Waiting ${conservativeDelaySeconds} seconds before processing next repository...`);
            
            onProgress?.({
              currentRepo: repoPath,
              processedRepos: i,
              totalRepos: repositories.length,
              transferredFiles: result.transferredFiles,
              skippedFiles: result.skippedFiles,
              phase: `waiting (${conservativeDelaySeconds}s)`,
            });
            
            await new Promise(resolve => setTimeout(resolve, delayMs));
          }

          // Get repository files using conservative or optimized approach
          let filesResult;
          
          if (useConservativeMode) {
            console.log(`🐌 Using CONSERVATIVE file reading for ${repoPath}`);
            filesResult = await this.getRepositoryFilesConservative(owner, repo, "main");
          } else {
            console.log(`🚀 Using OPTIMIZED file reading for ${repoPath}`);
            filesResult = await this.getRepositoryTreeRecursive(owner, repo, "main");
            
            // If optimized fails, try conservative as fallback
            if (!filesResult.success || filesResult.files.length === 0) {
              console.log(`⚠️ Optimized failed, falling back to conservative for ${repoPath}`);
              filesResult = await this.getRepositoryFilesConservative(owner, repo, "main");
              repoResult.method = "conservative-fallback";
            }
          }

          if (!filesResult.success) {
            throw new Error(filesResult.error || "Failed to read repository files");
          }

          if (filesResult.files.length === 0) {
            console.log(`📂 Repository ${repoPath} is empty, skipping file transfer`);
            repoResult.success = true;
            repoResult.transferredFiles = 0;
            repoResult.method = `${repoResult.method}-empty`;
          } else {
            console.log(`📁 Found ${filesResult.files.length} files in ${repoPath}`);

            onProgress?.({
              currentRepo: repoPath,
              processedRepos: i,
              totalRepos: repositories.length,
              transferredFiles: result.transferredFiles,
              skippedFiles: result.skippedFiles,
              phase: "transferring",
            });

            // CONSERVATIVE MODE: Process files with extra delays
            if (useConservativeMode) {
              console.log(`🐌 CONSERVATIVE MODE: Processing files with delays...`);
              
              const batchSize = 5; // Smaller batches in conservative mode
              const batches = [];
              
              for (let j = 0; j < filesResult.files.length; j += batchSize) {
                batches.push(filesResult.files.slice(j, j + batchSize));
              }
              
              let totalTransferred = 0;
              
              for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
                const batch = batches[batchIndex];
                
                console.log(`📦 CONSERVATIVE: Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} files)`);
                
                // Add delay between batches
                if (batchIndex > 0) {
                  console.log(`⏰ CONSERVATIVE: Waiting 10 seconds between batches...`);
                  await new Promise(resolve => setTimeout(resolve, 10000));
                }
                
                try {
                  const batchResult = await this.batchFileTransfer(
                    targetOwner,
                    targetRepo,
                    {
                      files: batch.map(file => ({
                        path: file.path, // Keep original path, let backend handle folderPrefix
                        content: file.content,
                        encoding: file.encoding
                      })),
                      message: `Batch transfer from ${owner}/${repo} - batch ${batchIndex + 1}`,
                      branch: "main",
                      folderPrefix: separateFolders ? repo : undefined
                    }
                  );
                  
                  if (batchResult.success) {
                    totalTransferred += batchResult.transferredFiles;
                  } else {
                    repoResult.errors.push(`Batch ${batchIndex + 1} failed: ${batchResult.error}`);
                  }
                } catch (batchError) {
                  const errorMsg = batchError instanceof Error ? batchError.message : "Unknown error";
                  repoResult.errors.push(`Batch ${batchIndex + 1} error: ${errorMsg}`);
                }
              }
              
              repoResult.transferredFiles = totalTransferred;
              repoResult.success = totalTransferred > 0;
              
            } else {
              // Standard optimized processing
              const transferResult = await this.batchFileTransfer(
                targetOwner,
                targetRepo,
                {
                  files: filesResult.files.map(file => ({
                    path: file.path,
                    content: file.content,
                    encoding: file.encoding
                  })),
                  message: `Transfer from ${owner}/${repo}`,
                  branch: "main",
                  folderPrefix: separateFolders ? repo : undefined
                }
              );

              if (!transferResult.success) {
                throw new Error(transferResult.error || "File transfer failed");
              }

              repoResult.transferredFiles = transferResult.transferredFiles;
              repoResult.skippedFiles = 0; // BatchFileTransferResult doesn't have skippedFiles
              repoResult.success = true;
            }
          }

          // CRITICAL SAFETY CHECK: Only delete if transfer was 100% successful
          if (repoResult.success && repoResult.transferredFiles >= 0 && repoResult.errors.length === 0) {
            console.log(`🗑️ Repository ${repoPath} transfer successful, proceeding with deletion...`);
            
            onProgress?.({
              currentRepo: repoPath,
              processedRepos: i,
              totalRepos: repositories.length,
              transferredFiles: result.transferredFiles,
              skippedFiles: result.skippedFiles,
              phase: "deleting",
            });

            // CONSERVATIVE MODE: Extra delay before deletion
            if (useConservativeMode) {
              console.log(`⏰ CONSERVATIVE MODE: Waiting 10 seconds before deletion...`);
              await new Promise(resolve => setTimeout(resolve, 10000));
            } else {
              // Standard delay
              await new Promise(resolve => setTimeout(resolve, 5000));
            }

            try {
              await this.deleteRepository(owner, repo);
              console.log(`✅ Successfully deleted repository ${repoPath}`);
            } catch (deleteError) {
              const errorMsg = deleteError instanceof Error ? deleteError.message : "Unknown error";
              repoResult.errors.push(`Deletion failed: ${errorMsg}`);
              console.error(`❌ Failed to delete ${repoPath}:`, deleteError);
            }
          } else {
            const reason = repoResult.errors.length > 0 
              ? `Transfer had errors: ${repoResult.errors.join(", ")}`
              : `Transfer incomplete (${repoResult.transferredFiles} files transferred)`;
            console.log(`🛡️ Skipping deletion of ${repoPath}: ${reason}`);
            repoResult.errors.push(`Repository not deleted: ${reason}`);
          }

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          console.error(`❌ Error processing repository ${repoPath}:`, error);
          
          repoResult.success = false;
          repoResult.errors.push(errorMessage);
          
          // Check if it's a rate limit error
          if (errorMessage.includes("Rate limit") || errorMessage.includes("429")) {
            console.log(`🚫 Rate limit detected for ${repoPath}, stopping batch operation`);
            result.errors.push(`Rate limit hit at repository ${repoPath}. Consider using Conservative Mode or waiting before retrying.`);
            break; // Stop processing more repositories
          }
        }

        result.details.push(repoResult);
        result.processedRepos = i + 1;
        result.transferredFiles += repoResult.transferredFiles;
        result.skippedFiles += repoResult.skippedFiles;

        if (repoResult.errors.length > 0) {
          result.errors.push(...repoResult.errors.map(err => `${repoPath}: ${err}`));
        }
      }

      // Final success determination
      const successfulRepos = result.details.filter(detail => detail.success).length;
      result.success = successfulRepos > 0 && result.errors.filter(e => e.includes("Rate limit")).length === 0;

      console.log(`🏁 Merge operation completed: ${successfulRepos}/${repositories.length} repositories successful`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error(`❌ Merge operation failed:`, error);
      result.success = false;
      result.errors.push(`Operation failed: ${errorMessage}`);
    }

    result.totalTime = Date.now() - startTime;
    
    // Get final rate limit info
    try {
      const rateLimitInfo = await this.getRateLimit();
      result.rateLimitInfo = rateLimitInfo;
    } catch (rateLimitError) {
      console.log("Could not fetch rate limit info:", rateLimitError);
    }

    return result;
  }
}

export const repositoryService = new RepositoryService(); 