import { Router, Request, Response } from "express";
import { OAuthService } from "@/services/oauth.service";
import { GitHubService } from "@/services/github.service";
import { AuthMiddleware, AuthenticatedRequest } from "@/middleware/auth.middleware";
import { ErrorMiddleware } from "@/middleware/error.middleware";
import { authRateLimit } from "@/middleware/rate-limit.middleware";
import { ApiResponse, UserProfile } from "@/types/api";

export class AuthRoutes {
  public router: Router;
  private oAuthService: OAuthService;
  private gitHubService: GitHubService;
  private authMiddleware: AuthMiddleware;

  constructor() {
    this.router = Router();
    this.oAuthService = new OAuthService();
    this.gitHubService = new GitHubService();
    this.authMiddleware = new AuthMiddleware();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // OAuth flow routes
    this.router.get("/github", authRateLimit, this.initiateGitHubAuth);
    this.router.get("/github/callback", authRateLimit, this.handleGitHubCallback);
    
    // User profile and session management
    this.router.get("/profile", this.authMiddleware.authenticate, this.getUserProfile);
    this.router.post("/logout", this.authMiddleware.authenticate, this.logout);
    this.router.get("/validate", this.authMiddleware.authenticate, this.validateToken);
    
    // Scope and permissions info
    this.router.get("/scopes", this.getScopeInfo);
    this.router.get("/scopes/required", this.getRequiredScopes);
  }

  private initiateGitHubAuth = ErrorMiddleware.asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const redirectUrl = req.query.redirect_url as string;
      
      const { url, state } = this.oAuthService.generateAuthUrl(redirectUrl);
      
      const response: ApiResponse<{ auth_url: string; state: string }> = {
        success: true,
        data: {
          auth_url: url,
          state,
        },
        message: "OAuth authorization URL generated successfully",
      };
      
      res.json(response);
    }
  );

  private handleGitHubCallback = ErrorMiddleware.asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { code, state, error, error_description } = req.query;

      if (error) {
        // Redirect to frontend with error
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
        const errorMessage = encodeURIComponent(`GitHub OAuth error: ${error_description || error}`);
        res.redirect(`${frontendUrl}/auth/callback?error=${errorMessage}`);
        return;
      }

      if (!code || !state) {
        // Redirect to frontend with error
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
        const errorMessage = encodeURIComponent("Missing required OAuth parameters");
        res.redirect(`${frontendUrl}/auth/callback?error=${errorMessage}`);
        return;
      }

      try {
        const { user, redirectUrl } = await this.oAuthService.handleCallback(
          code as string,
          state as string
        );

        const token = this.oAuthService.generateJWT(user);

        // Redirect to frontend with success
        const frontendUrl = redirectUrl || process.env.FRONTEND_URL || "http://localhost:3000";
        const params = new URLSearchParams({
          success: 'true',
          token: token,
        });
        
        res.redirect(`${frontendUrl}/auth/callback?${params.toString()}`);
      } catch (error) {
        // Redirect to frontend with error
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
        const errorMessage = encodeURIComponent(error instanceof Error ? error.message : "Authentication failed");
        res.redirect(`${frontendUrl}/auth/callback?error=${errorMessage}`);
      }
    }
  );

  private getUserProfile = ErrorMiddleware.asyncHandler(
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
      if (!req.user) {
        throw ErrorMiddleware.authenticationError();
      }

      const [user, organizations] = await Promise.all([
        this.gitHubService.getCurrentUser(req.user.access_token),
        this.gitHubService.getUserOrganizations(req.user.access_token),
      ]);

      const profile: UserProfile = {
        user,
        organizations,
        repositories_count: user.public_repos,
        organizations_count: organizations.length,
        scopes: req.user.token_scopes,
      };

      const response: ApiResponse<UserProfile> = {
        success: true,
        data: profile,
        message: "User profile retrieved successfully",
      };

      res.json(response);
    }
  );

  private logout = ErrorMiddleware.asyncHandler(
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
      if (!req.user) {
        throw ErrorMiddleware.authenticationError();
      }

      try {
        // Revoke the GitHub token
        await this.oAuthService.revokeToken(req.user.access_token);
      } catch (error) {
        // Log the error but don't fail the logout
        console.warn("Failed to revoke GitHub token:", error);
      }

      const response: ApiResponse<null> = {
        success: true,
        data: null,
        message: "Logged out successfully",
      };

      res.json(response);
    }
  );

  private validateToken = ErrorMiddleware.asyncHandler(
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
      if (!req.user) {
        throw ErrorMiddleware.authenticationError();
      }

      const tokenValidation = await this.gitHubService.validateToken(
        req.user.access_token
      );

      if (!tokenValidation.valid) {
        throw ErrorMiddleware.authenticationError("GitHub token is invalid or expired");
      }

      const response: ApiResponse<{
        valid: boolean;
        user: typeof req.user;
        github_validation: typeof tokenValidation;
      }> = {
        success: true,
        data: {
          valid: true,
          user: req.user,
          github_validation: tokenValidation,
        },
        message: "Token is valid",
      };

      res.json(response);
    }
  );

  private getScopeInfo = ErrorMiddleware.asyncHandler(
    async (_req: Request, res: Response): Promise<void> => {
      const scopeDescriptions = this.oAuthService.getScopeDescriptions();
      
      const response: ApiResponse<{
        available_scopes: Record<string, string>;
        required_scopes: string[];
      }> = {
        success: true,
        data: {
          available_scopes: scopeDescriptions,
          required_scopes: this.oAuthService.getRequiredScopes(),
        },
        message: "Scope information retrieved successfully",
      };

      res.json(response);
    }
  );

  private getRequiredScopes = ErrorMiddleware.asyncHandler(
    async (_req: Request, res: Response): Promise<void> => {
      const requiredScopes = this.oAuthService.getRequiredScopes();
      const scopeDescriptions = this.oAuthService.getScopeDescriptions();
      
      const requiredWithDescriptions = requiredScopes.map(scope => ({
        scope,
        description: scopeDescriptions[scope] || "No description available",
      }));

      const response: ApiResponse<{
        required_scopes: Array<{ scope: string; description: string }>;
        auth_url: string;
      }> = {
        success: true,
        data: {
          required_scopes: requiredWithDescriptions,
          auth_url: "/api/auth/github",
        },
        message: "Required scopes information retrieved successfully",
      };

      res.json(response);
    }
  );
} 