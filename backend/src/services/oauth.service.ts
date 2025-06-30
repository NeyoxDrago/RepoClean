import axios from "axios";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { githubConfig, jwtConfig } from "@/config";
import { GitHubUser } from "@/types/github";
import { AuthenticatedUser, OAuthState, SessionData } from "@/types/api";

export class OAuthService {
  private stateStore = new Map<string, OAuthState>();

  constructor() {
    // Clean up expired states every hour
    setInterval(() => this.cleanupExpiredStates(), 60 * 60 * 1000);
  }

  private cleanupExpiredStates(): void {
    const now = Date.now();
    for (const [state, data] of this.stateStore.entries()) {
      if (now - data.created_at > 10 * 60 * 1000) { // 10 minutes
        this.stateStore.delete(state);
      }
    }
  }

  public generateAuthUrl(redirectUrl?: string): { url: string; state: string } {
    const state = crypto.randomBytes(32).toString("hex");
    
    this.stateStore.set(state, {
      state,
      redirect_url: redirectUrl,
      created_at: Date.now(),
    });

    const scopes = [
      "repo",
      "read:user",
      "user:email",
      "read:org",
      "delete_repo",
    ].join(" ");

    const params = new URLSearchParams({
      client_id: githubConfig.clientId,
      redirect_uri: githubConfig.callbackUrl,
      scope: scopes,
      state,
      allow_signup: "true",
    });

    const url = `https://github.com/login/oauth/authorize?${params.toString()}`;

    return { url, state };
  }

  public async handleCallback(
    code: string,
    state: string
  ): Promise<{ user: AuthenticatedUser; redirectUrl?: string }> {
    // Validate state
    const stateData = this.stateStore.get(state);
    if (!stateData) {
      throw new Error("Invalid or expired OAuth state");
    }

    // Clean up state
    this.stateStore.delete(state);

    // Exchange code for access token
    const tokenResponse = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: githubConfig.clientId,
        client_secret: githubConfig.clientSecret,
        code,
        state,
      },
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    const { access_token, scope, token_type } = tokenResponse.data;

    if (!access_token) {
      throw new Error("Failed to obtain access token from GitHub");
    }

    // Get user information
    const userResponse = await axios.get("https://api.github.com/user", {
      headers: {
        Authorization: `${token_type} ${access_token}`,
        Accept: "application/vnd.github+json",
      },
    });

    const githubUser: GitHubUser = userResponse.data;
    
    // Parse scopes
    const scopes = scope ? scope.split(",").map((s: string) => s.trim()) : [];

    const user: AuthenticatedUser = {
      id: githubUser.id,
      login: githubUser.login,
      name: githubUser.name,
      email: githubUser.email,
      avatar_url: githubUser.avatar_url,
      access_token,
      token_scopes: scopes,
    };

    return {
      user,
      redirectUrl: stateData.redirect_url,
    };
  }

  public generateJWT(user: AuthenticatedUser): string {
    const payload: SessionData = {
      user_id: user.id,
      login: user.login,
      access_token: user.access_token,
      token_scopes: user.token_scopes,
      created_at: Date.now(),
      expires_at: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    };

    return jwt.sign(payload, jwtConfig.secret, {
      expiresIn: "24h",
      issuer: "repo-cleanr",
      subject: user.id.toString(),
    });
  }

  public verifyJWT(token: string): SessionData {
    try {
      const decoded = jwt.verify(token, jwtConfig.secret) as SessionData;
      
      // Check if token is expired
      if (Date.now() > decoded.expires_at) {
        throw new Error("Token expired");
      }

      return decoded;
    } catch (error) {
      throw new Error("Invalid or expired token");
    }
  }

  public async refreshToken(accessToken: string): Promise<boolean> {
    try {
      // GitHub doesn't support token refresh, so we just validate the current token
      const response = await axios.get("https://api.github.com/user", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github+json",
        },
      });

      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  public async revokeToken(accessToken: string): Promise<void> {
    try {
      await axios.delete(
        `https://api.github.com/applications/${githubConfig.clientId}/grant`,
        {
          auth: {
            username: githubConfig.clientId,
            password: githubConfig.clientSecret,
          },
          data: {
            access_token: accessToken,
          },
        }
      );
    } catch (error) {
      // GitHub might return 404 if token is already revoked
      if (axios.isAxiosError(error) && error.response?.status !== 404) {
        throw error;
      }
    }
  }

  public validateScopes(userScopes: string[], requiredScopes: string[]): boolean {
    return requiredScopes.every(scope => userScopes.includes(scope));
  }

  public getRequiredScopes(): string[] {
    return [
      "repo",           // Full control of private repositories
      "read:user",      // Read user profile data
      "user:email",     // Access user email addresses
      "read:org",       // Read organization membership
      "delete_repo",    // Delete repositories
    ];
  }

  public getMissingScopes(userScopes: string[]): string[] {
    const required = this.getRequiredScopes();
    return required.filter(scope => !userScopes.includes(scope));
  }

  public getScopeDescriptions(): Record<string, string> {
    return {
      repo: "Full control of private repositories (read, write, admin)",
      "read:user": "Read user profile data",
      "user:email": "Access user email addresses (primary and public)",
      "read:org": "Read organization membership and team information",
      "delete_repo": "Delete repositories",
      "repo:status": "Access commit status",
      "admin:repo_hook": "Admin access to repository hooks",
      "write:repo_hook": "Write access to repository hooks",
      "read:repo_hook": "Read access to repository hooks",
      public_repo: "Access public repositories",
    };
  }
} 