import { Router, Response } from "express";
import { body, param, query, validationResult } from "express-validator";
import { GitHubService } from "@/services/github.service";
import { AuthMiddleware, AuthenticatedRequest } from "@/middleware/auth.middleware";
import { ErrorMiddleware } from "@/middleware/error.middleware";
import { 
  generalRateLimit, 
  githubApiRateLimit, 
  batchOperationRateLimit 
} from "@/middleware/rate-limit.middleware";
import {
  ApiResponse,
  RepositoryListQuery,
  RepositoryCreateRequest,
  RepositoryUpdateRequest,
  BatchOperationRequest,
  BatchOperationResponse,
  BatchOperationResult,
  FileOperationRequest,
} from "@/types/api";
import { GitHubRepository } from "@/types/github";

export class RepositoryRoutes {
  public router: Router;
  private gitHubService: GitHubService;
  private authMiddleware: AuthMiddleware;

  constructor() {
    this.router = Router();
    this.gitHubService = new GitHubService();
    this.authMiddleware = new AuthMiddleware();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Repository listing and search
    this.router.get(
      "/",
      generalRateLimit,
      this.authMiddleware.authenticate,
      this.authMiddleware.requireRepositoryAccess,
      this.validateListQuery(),
      this.getRepositories
    );

    this.router.get(
      "/search",
      githubApiRateLimit,
      this.authMiddleware.authenticate,
      this.authMiddleware.requireRepositoryAccess,
      this.validateSearchQuery(),
      this.searchRepositories
    );

    // Individual repository operations
    this.router.get(
      "/:owner/:repo",
      githubApiRateLimit,
      this.authMiddleware.authenticate,
      this.authMiddleware.requireRepositoryAccess,
      this.validateRepoParams(),
      this.getRepository
    );

    this.router.post(
      "/",
      githubApiRateLimit,
      this.authMiddleware.authenticate,
      this.authMiddleware.requireRepositoryAccess,
      this.validateCreateRepository(),
      this.createRepository
    );

    this.router.patch(
      "/:owner/:repo",
      githubApiRateLimit,
      this.authMiddleware.authenticate,
      this.authMiddleware.requireRepositoryAccess,
      this.validateRepoParams(),
      this.validateUpdateRepository(),
      this.updateRepository
    );

    this.router.delete(
      "/:owner/:repo",
      githubApiRateLimit,
      this.authMiddleware.authenticate,
      this.authMiddleware.requireDeleteAccess,
      this.validateRepoParams(),
      this.deleteRepository
    );

    // Batch operations
    this.router.post(
      "/batch",
      batchOperationRateLimit,
      this.authMiddleware.authenticate,
      this.authMiddleware.requireRepositoryAccess,
      this.validateBatchOperation(),
      this.batchOperation
    );

    // File operations
    this.router.get(
      "/:owner/:repo/contents/*",
      githubApiRateLimit,
      this.authMiddleware.authenticate,
      this.authMiddleware.requireRepositoryAccess,
      this.validateRepoParams(),
      this.getFileContent
    );

    this.router.put(
      "/:owner/:repo/contents/*",
      githubApiRateLimit,
      this.authMiddleware.authenticate,
      this.authMiddleware.requireRepositoryAccess,
      this.validateRepoParams(),
      this.validateFileOperation(),
      this.fileOperation
    );

    this.router.delete(
      "/:owner/:repo/contents/*",
      githubApiRateLimit,
      this.authMiddleware.authenticate,
      this.authMiddleware.requireRepositoryAccess,
      this.validateRepoParams(),
      this.validateFileOperation(),
      this.fileOperation
    );

    // Batch file operations
    this.router.post(
      "/:owner/:repo/batch-files",
      githubApiRateLimit,
      this.authMiddleware.authenticate,
      this.authMiddleware.requireRepositoryAccess,
      this.validateRepoParams(),
      this.validateBatchFileOperation(),
      this.batchFileTransfer
    );

    // Advanced batch file operations
    this.router.get(
      "/:owner/:repo/tree-recursive",
      githubApiRateLimit,
      this.authMiddleware.authenticate,
      this.authMiddleware.requireRepositoryAccess,
      this.validateRepoParams(),
      this.getRepositoryTreeRecursive
    );
    
    this.router.get(
      "/:owner/:repo/archive-url",
      githubApiRateLimit,
      this.authMiddleware.authenticate,
      this.authMiddleware.requireRepositoryAccess,
      this.validateRepoParams(),
      this.getRepositoryArchiveUrl
    );

    // Rate limit information
    this.router.get(
      "/rate-limit",
      generalRateLimit,
      this.authMiddleware.authenticate,
      this.getRateLimitInfo
    );
  }

  // Validation middleware
  private validateListQuery() {
    return [
      query("org").optional().isString().trim(),
      query("type").optional().isIn(["all", "owner", "public", "private", "member"]),
      query("sort").optional().isIn(["created", "updated", "pushed", "full_name"]),
      query("direction").optional().isIn(["asc", "desc"]),
      query("page").optional().isInt({ min: 1 }),
      query("per_page").optional().isInt({ min: 1, max: 100 }),
      query("search").optional().isString().trim(),
      query("language").optional().isString().trim(),
      query("archived").optional().isBoolean(),
      query("fork").optional().isBoolean(),
    ];
  }

  private validateSearchQuery() {
    return [
      query("q").notEmpty().isString().trim(),
      query("sort").optional().isIn(["stars", "forks", "help-wanted-issues", "updated"]),
      query("order").optional().isIn(["desc", "asc"]),
      query("page").optional().isInt({ min: 1 }),
      query("per_page").optional().isInt({ min: 1, max: 100 }),
    ];
  }

  private validateRepoParams() {
    return [
      param("owner").notEmpty().isString().trim(),
      param("repo").notEmpty().isString().trim(),
    ];
  }

  private validateCreateRepository() {
    return [
      body("name").notEmpty().isString().trim(),
      body("description").optional().isString().trim(),
      body("homepage").optional().custom((value) => {
        if (!value || value === '') return true;
        return /^https?:\/\/.+/.test(value);
      }).withMessage("Homepage must be a valid URL"),
      body("private").optional().isBoolean(),
      body("visibility").optional().isIn(["public", "private", "internal"]),
      body("has_issues").optional().isBoolean(),
      body("has_projects").optional().isBoolean(),
      body("has_wiki").optional().isBoolean(),
      body("auto_init").optional().isBoolean(),
      body("gitignore_template").optional().isString().trim(),
      body("license_template").optional().isString().trim(),
      body("org").optional().isString().trim(),
    ];
  }

  private validateUpdateRepository() {
    return [
      body("name").optional().isString().trim(),
      body("description").optional().isString().trim(),
      body("homepage").optional().isURL(),
      body("private").optional().isBoolean(),
      body("visibility").optional().isIn(["public", "private", "internal"]),
      body("archived").optional().isBoolean(),
      body("default_branch").optional().isString().trim(),
    ];
  }

  private validateBatchOperation() {
    return [
      body("repositories").isArray({ min: 1 }).withMessage("At least one repository must be specified"),
      body("repositories.*").isInt({ min: 1 }).withMessage("Repository IDs must be positive integers"),
      body("operation").isIn(["archive", "unarchive", "delete", "visibility_public", "visibility_private"]),
    ];
  }

  private validateFileOperation() {
    return [
      body("message").notEmpty().isString().trim(),
      body("content").optional().isString(),
      body("sha").optional().isString().trim(),
      body("branch").optional().isString().trim(),
    ];
  }

  private validateBatchFileOperation() {
    return [
      body("files").isArray({ min: 1 }).withMessage("At least one file must be specified"),
      body("files.*.path").notEmpty().isString().trim(),
      body("files.*.content").isString(),
      body("files.*.encoding").optional().isString(),
      body("message").notEmpty().isString().trim(),
      body("branch").optional().isString().trim(),
      body("folderPrefix").optional().isString().trim(),
    ];
  }

  // Route handlers
  private getRepositories = ErrorMiddleware.asyncHandler(
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw ErrorMiddleware.validationError("Invalid query parameters", errors.array());
      }

      if (!req.user) {
        throw ErrorMiddleware.authenticationError();
      }

      const query: RepositoryListQuery = {
        org: req.query.org as string,
        type: req.query.type as any,
        sort: req.query.sort as any,
        direction: req.query.direction as any,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        per_page: req.query.per_page ? parseInt(req.query.per_page as string) : 30,
        search: req.query.search as string,
        language: req.query.language as string,
        archived: req.query.archived === "true" ? true : req.query.archived === "false" ? false : undefined,
        fork: req.query.fork === "true" ? true : req.query.fork === "false" ? false : undefined,
      };

      const result = await this.gitHubService.getRepositories(req.user.access_token, query);
      res.json(result);
    }
  );

  private searchRepositories = ErrorMiddleware.asyncHandler(
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw ErrorMiddleware.validationError("Invalid search parameters", errors.array());
      }

      if (!req.user) {
        throw ErrorMiddleware.authenticationError();
      }

      const options = {
        sort: req.query.sort as any,
        order: req.query.order as any,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        per_page: req.query.per_page ? parseInt(req.query.per_page as string) : 30,
      };

      const result = await this.gitHubService.searchRepositories(
        req.user.access_token,
        req.query.q as string,
        options
      );

      const response: ApiResponse<typeof result> = {
        success: true,
        data: result,
        message: "Repository search completed successfully",
      };

      res.json(response);
    }
  );

  private getRepository = ErrorMiddleware.asyncHandler(
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw ErrorMiddleware.validationError("Invalid parameters", errors.array());
      }

      if (!req.user) {
        throw ErrorMiddleware.authenticationError();
      }

      const { owner, repo } = req.params;
      const repository = await this.gitHubService.getRepository(
        req.user.access_token,
        owner,
        repo
      );

      const response: ApiResponse<GitHubRepository> = {
        success: true,
        data: repository,
        message: "Repository retrieved successfully",
      };

      res.json(response);
    }
  );

  private createRepository = ErrorMiddleware.asyncHandler(
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log("Validation errors:", errors.array());
        console.log("Request body:", req.body);
        throw ErrorMiddleware.validationError("Invalid repository data", errors.array());
      }

      if (!req.user) {
        throw ErrorMiddleware.authenticationError();
      }

      console.log("Creating repository with data:", req.body);
      const repoData: RepositoryCreateRequest = req.body;
      
      let repository: GitHubRepository;

      if (repoData.template_owner && repoData.template_repo) {
        // Create from template
        repository = await this.gitHubService.createRepositoryFromTemplate(
          req.user.access_token,
          repoData.template_owner,
          repoData.template_repo,
          repoData
        );
      } else {
        // Create regular repository
        repository = await this.gitHubService.createRepository(
          req.user.access_token,
          repoData
        );
      }

      const response: ApiResponse<GitHubRepository> = {
        success: true,
        data: repository,
        message: "Repository created successfully",
      };

      res.status(201).json(response);
    }
  );

  private updateRepository = ErrorMiddleware.asyncHandler(
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw ErrorMiddleware.validationError("Invalid parameters or data", errors.array());
      }

      if (!req.user) {
        throw ErrorMiddleware.authenticationError();
      }

      const { owner, repo } = req.params;
      const updateData: RepositoryUpdateRequest = req.body;

      const repository = await this.gitHubService.updateRepository(
        req.user.access_token,
        owner,
        repo,
        updateData
      );

      const response: ApiResponse<GitHubRepository> = {
        success: true,
        data: repository,
        message: "Repository updated successfully",
      };

      res.json(response);
    }
  );

  private deleteRepository = ErrorMiddleware.asyncHandler(
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw ErrorMiddleware.validationError("Invalid parameters", errors.array());
      }

      if (!req.user) {
        throw ErrorMiddleware.authenticationError();
      }

      const { owner, repo } = req.params;
      
      await this.gitHubService.deleteRepository(req.user.access_token, owner, repo);

      const response: ApiResponse<null> = {
        success: true,
        data: null,
        message: "Repository deleted successfully",
      };

      res.json(response);
    }
  );

  private batchOperation = ErrorMiddleware.asyncHandler(
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw ErrorMiddleware.validationError("Invalid batch operation data", errors.array());
      }

      if (!req.user) {
        throw ErrorMiddleware.authenticationError();
      }

      const { repositories, operation }: BatchOperationRequest = req.body;
      const results: BatchOperationResult[] = [];

      // First, get all user repositories to map IDs to owner/name
      const userRepos = await this.gitHubService.getRepositories(req.user.access_token, {
        type: "owner",
        per_page: 100 // Get more repos to ensure we find all selected ones
      });

      const repoMap = new Map<number, { owner: string; name: string; full_name: string }>();
      if (userRepos.data) {
        userRepos.data.forEach(repo => {
          repoMap.set(repo.id, {
            owner: repo.owner.login,
            name: repo.name,
            full_name: repo.full_name
          });
        });
      }

      for (const repoId of repositories) {
        try {
          const repoInfo = repoMap.get(repoId);
          if (!repoInfo) {
            results.push({
              repository_id: repoId,
              repository_name: `Repository ${repoId}`,
              success: false,
              error: "Repository not found in user's repositories",
            });
            continue;
          }

          let success = true;
          let error: string | undefined;

          switch (operation) {
            case "archive":
              await this.gitHubService.updateRepository(
                req.user.access_token,
                repoInfo.owner,
                repoInfo.name,
                { archived: true }
              );
              break;
            case "unarchive":
              await this.gitHubService.updateRepository(
                req.user.access_token,
                repoInfo.owner,
                repoInfo.name,
                { archived: false }
              );
              break;
            case "visibility_public":
              await this.gitHubService.updateRepository(
                req.user.access_token,
                repoInfo.owner,
                repoInfo.name,
                { private: false }
              );
              break;
            case "visibility_private":
              await this.gitHubService.updateRepository(
                req.user.access_token,
                repoInfo.owner,
                repoInfo.name,
                { private: true }
              );
              break;
            case "delete":
              await this.gitHubService.deleteRepository(
                req.user.access_token,
                repoInfo.owner,
                repoInfo.name
              );
              break;
            default:
              success = false;
              error = `Unsupported operation: ${operation}`;
          }

          results.push({
            repository_id: repoId,
            repository_name: repoInfo.full_name,
            success,
            error,
          });
        } catch (err) {
          const repoInfo = repoMap.get(repoId);
          results.push({
            repository_id: repoId,
            repository_name: repoInfo?.full_name || `Repository ${repoId}`,
            success: false,
            error: err instanceof Error ? err.message : "Unknown error",
          });
        }
      }

      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;

      const batchResponse: BatchOperationResponse = {
        operation,
        total_requested: repositories.length,
        successful,
        failed,
        results,
      };

      const response: ApiResponse<BatchOperationResponse> = {
        success: true,
        data: batchResponse,
        message: `Batch operation completed: ${successful} successful, ${failed} failed`,
      };

      res.json(response);
    }
  );

  private getFileContent = ErrorMiddleware.asyncHandler(
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
      if (!req.user) {
        throw ErrorMiddleware.authenticationError();
      }

      const { owner, repo } = req.params;
      const path = req.params[0]; // The wildcard path
      const ref = req.query.ref as string;

      const content = await this.gitHubService.getFileContent(
        req.user.access_token,
        owner,
        repo,
        path,
        ref
      );

      const response: ApiResponse<typeof content> = {
        success: true,
        data: content,
        message: "File content retrieved successfully",
      };

      res.json(response);
    }
  );

  private fileOperation = ErrorMiddleware.asyncHandler(
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw ErrorMiddleware.validationError("Invalid file operation data", errors.array());
      }

      if (!req.user) {
        throw ErrorMiddleware.authenticationError();
      }

      const { owner, repo } = req.params;
      const path = req.params[0]; // The wildcard path
      const operation = req.method === "DELETE" ? "delete" : req.body.operation || "create";
      
      const fileData: FileOperationRequest = {
        ...req.body,
        path,
        operation,
      };

      let result: any;

      switch (operation) {
        case "create":
          result = await this.gitHubService.createFile(
            req.user.access_token,
            owner,
            repo,
            path,
            {
              message: fileData.message,
              content: fileData.content!,
              branch: fileData.branch,
              committer: fileData.committer,
              author: fileData.author,
            }
          );
          break;
        case "update":
          result = await this.gitHubService.updateFile(
            req.user.access_token,
            owner,
            repo,
            path,
            {
              message: fileData.message,
              content: fileData.content!,
              sha: fileData.sha!,
              branch: fileData.branch,
              committer: fileData.committer,
              author: fileData.author,
            }
          );
          break;
        case "delete":
          result = await this.gitHubService.deleteFile(
            req.user.access_token,
            owner,
            repo,
            path,
            {
              message: fileData.message,
              sha: fileData.sha!,
              branch: fileData.branch,
              committer: fileData.committer,
              author: fileData.author,
            }
          );
          break;
        default:
          throw ErrorMiddleware.validationError(`Unsupported file operation: ${operation}`);
      }

      const response: ApiResponse<typeof result> = {
        success: true,
        data: result,
        message: `File ${operation} operation completed successfully`,
      };

      res.json(response);
    }
  );

  private batchFileTransfer = ErrorMiddleware.asyncHandler(
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw ErrorMiddleware.validationError("Invalid batch file operation data", errors.array());
      }

      if (!req.user) {
        throw ErrorMiddleware.authenticationError();
      }

      const { owner, repo } = req.params;
      const { files, message, branch = "main", folderPrefix } = req.body;

      console.log(`🔄 Backend: Processing batch file transfer for ${owner}/${repo}, ${files.length} files`);

      try {
        // Add folder prefix to all file paths if specified
        const processedFiles = files.map((file: any) => ({
          ...file,
          path: folderPrefix ? `${folderPrefix}/${file.path}` : file.path,
        }));

        console.log(`📝 Backend: Processed files with folder prefix "${folderPrefix}"`);

        // Use the new Git Database API bulk upload method
        const result = await this.gitHubService.bulkFileUpload(
          req.user.access_token,
          owner,
          repo,
          processedFiles,
          message,
          branch
        );

        console.log(`📦 Backend: GitHub service result:`, JSON.stringify(result, null, 2));

        // Ensure result is never null/undefined
        if (!result) {
          console.error("❌ Backend: GitHub service returned null/undefined result");
          const fallbackResult = {
            success: false,
            error: "GitHub service returned null result",
            transferredFiles: 0,
            totalFiles: files.length
          };

          const response: ApiResponse<typeof fallbackResult> = {
            success: false,
            data: fallbackResult,
            message: "Bulk file upload failed: Service returned null result",
          };

          res.json(response);
          return;
        }

        // Ensure all required properties exist with safe defaults
        const safeResult = {
          success: result.success ?? false,
          commitSha: result.commitSha,
          error: result.error,
          transferredFiles: result.filesProcessed ?? 0,
          totalFiles: result.totalFiles ?? files.length
        };

        const response: ApiResponse<typeof safeResult> = {
          success: safeResult.success,
          data: safeResult,
          message: safeResult.success 
            ? `Bulk file upload completed: ${safeResult.transferredFiles}/${safeResult.totalFiles} files processed`
            : `Bulk file upload failed: ${safeResult.error}`,
        };

        console.log(`✅ Backend: Sending response:`, JSON.stringify(response, null, 2));
        res.json(response);

      } catch (error) {
        console.error("❌ Backend: Batch file transfer error:", error);
        
        const errorResult = {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error occurred",
          transferredFiles: 0,
          totalFiles: files.length
        };

        const response: ApiResponse<typeof errorResult> = {
          success: false,
          data: errorResult,
          message: `Bulk file upload failed: ${errorResult.error}`,
        };

        res.status(500).json(response);
      }
    }
  );

  private getRateLimitInfo = ErrorMiddleware.asyncHandler(
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
      if (!req.user) {
        throw ErrorMiddleware.authenticationError();
      }

             const rateLimitInfo = await this.gitHubService.getRateLimit(req.user.access_token);

      const response: ApiResponse<typeof rateLimitInfo> = {
        success: true,
        data: rateLimitInfo,
        message: "Rate limit information retrieved successfully",
      };

      res.json(response);
    }
  );

  private getRepositoryTreeRecursive = ErrorMiddleware.asyncHandler(
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
      if (!req.user) {
        throw ErrorMiddleware.authenticationError();
      }

      const { owner, repo } = req.params;
      const { branch = "main" } = req.query;

      console.log(`🌳 Route: Getting recursive tree for ${owner}/${repo}, branch: ${branch}`);

      const result = await this.gitHubService.getRepositoryTreeRecursive(
        req.user.access_token,
        owner,
        repo,
        branch as string
      );

      if (!result) {
        const fallbackResult = {
          success: false,
          files: [],
          totalFiles: 0,
          error: "Repository tree fetch returned null result"
        };

        const response: ApiResponse<typeof fallbackResult> = {
          success: false,
          data: fallbackResult,
          message: "Repository tree fetch failed: Service returned null result",
        };

        res.json(response);
        return;
      }

      const response: ApiResponse<typeof result> = {
        success: result.success,
        data: result,
        message: result.success 
          ? `Successfully fetched ${result.totalFiles} files from repository tree`
          : `Repository tree fetch failed: ${result.error || "Unknown error"}`,
      };

      res.json(response);
    }
  );

  private getRepositoryArchiveUrl = ErrorMiddleware.asyncHandler(
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
      if (!req.user) {
        throw ErrorMiddleware.authenticationError();
      }

      const { owner, repo } = req.params;
      const { format = "zipball", ref = "main" } = req.query;

      console.log(`📦 Route: Getting archive URL for ${owner}/${repo}, format: ${format}, ref: ${ref}`);

      const result = await this.gitHubService.downloadRepositoryArchive(
        req.user.access_token,
        owner,
        repo,
        format as "zipball" | "tarball",
        ref as string
      );

      if (!result) {
        const fallbackResult = {
          success: false,
          downloadUrl: undefined,
          error: "Archive URL fetch returned null result"
        };

        const response: ApiResponse<typeof fallbackResult> = {
          success: false,
          data: fallbackResult,
          message: "Archive URL fetch failed: Service returned null result",
        };

        res.json(response);
        return;
      }

      const response: ApiResponse<typeof result> = {
        success: result.success,
        data: result,
        message: result.success 
          ? `Archive URL retrieved successfully`
          : `Archive URL fetch failed: ${result.error || "Unknown error"}`,
      };

      res.json(response);
    }
  );
} 