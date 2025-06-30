import { Request, Response, NextFunction } from "express";
import { OAuthService } from "@/services/oauth.service";
import { SessionData } from "@/types/api";

export interface AuthenticatedRequest extends Request {
  user?: SessionData;
}

export class AuthMiddleware {
  private oAuthService: OAuthService;

  constructor() {
    this.oAuthService = new OAuthService();
  }

  public authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader) {
        res.status(401).json({
          success: false,
          error: "No authorization header provided",
          message: "Please provide a valid authorization token",
        });
        return;
      }

      const token = authHeader.replace("Bearer ", "");
      
      if (!token) {
        res.status(401).json({
          success: false,
          error: "No token provided",
          message: "Please provide a valid authorization token",
        });
        return;
      }

      const user = this.oAuthService.verifyJWT(token);
      req.user = user;
      next();
    } catch (error) {
      res.status(401).json({
        success: false,
        error: "Invalid token",
        message: error instanceof Error ? error.message : "Authentication failed",
      });
    }
  };

  public optionalAuth = (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    try {
      const authHeader = req.headers.authorization;
      
      if (authHeader) {
        const token = authHeader.replace("Bearer ", "");
        if (token) {
          const user = this.oAuthService.verifyJWT(token);
          req.user = user;
        }
      }
      
      next();
    } catch (error) {
      // For optional auth, we don't return an error, just proceed without user
      next();
    }
  };

  public requireScopes = (requiredScopes: string[]) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: "Authentication required",
          message: "Please authenticate to access this resource",
        });
        return;
      }

      const userScopes = req.user.token_scopes || [];
      const hasRequiredScopes = this.oAuthService.validateScopes(userScopes, requiredScopes);

      if (!hasRequiredScopes) {
        const missingScopes = this.oAuthService.getMissingScopes(userScopes);
        res.status(403).json({
          success: false,
          error: "Insufficient permissions",
          message: "Your GitHub token does not have the required scopes",
          details: {
            required_scopes: requiredScopes,
            missing_scopes: missingScopes,
            user_scopes: userScopes,
          },
        });
        return;
      }

      next();
    };
  };

  public requireRepositoryAccess = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const requiredScopes = ["repo"];
    this.requireScopes(requiredScopes)(req, res, next);
  };

  public requireDeleteAccess = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const requiredScopes = ["repo", "delete_repo"];
    this.requireScopes(requiredScopes)(req, res, next);
  };

  public requireOrgAccess = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const requiredScopes = ["repo", "read:org"];
    this.requireScopes(requiredScopes)(req, res, next);
  };
} 