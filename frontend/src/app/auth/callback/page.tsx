"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Processing authentication...");

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const success = searchParams.get("success");
        const token = searchParams.get("token");
        const error = searchParams.get("error");

        if (error) {
          throw new Error(decodeURIComponent(error));
        }

        if (success === "true" && token) {
          setMessage("Authentication successful! Setting up your account...");
          
          // Store the token
          localStorage.setItem("github_token", token);
          localStorage.removeItem("oauth_state");

          setStatus("success");
          setMessage("Authentication successful! Redirecting...");

          // Redirect to main app
          setTimeout(() => {
            router.push("/");
          }, 2000);
        } else {
          throw new Error("Invalid authentication response");
        }

      } catch (error) {
        console.error("Authentication error:", error);
        setStatus("error");
        setMessage(error instanceof Error ? error.message : "Authentication failed");
        
        // Clear any stored state
        localStorage.removeItem("github_token");
        localStorage.removeItem("oauth_state");
        
        // Redirect to home page after 5 seconds
        setTimeout(() => {
          router.push("/");
        }, 5000);
      }
    };

    handleCallback();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-base-100 flex items-center justify-center">
      <div className="card w-96 bg-base-200 shadow-xl">
        <div className="card-body text-center">
          {status === "loading" && (
            <>
              <div className="loading loading-spinner loading-lg mx-auto"></div>
              <h2 className="card-title justify-center">Authenticating</h2>
              <p>{message}</p>
            </>
          )}
          
          {status === "success" && (
            <>
              <div className="text-success text-6xl">✓</div>
              <h2 className="card-title justify-center text-success">Success!</h2>
              <p>{message}</p>
            </>
          )}
          
          {status === "error" && (
            <>
              <div className="text-error text-6xl">✗</div>
              <h2 className="card-title justify-center text-error">Authentication Failed</h2>
              <p className="text-error">{message}</p>
              <div className="card-actions justify-center mt-4">
                <button 
                  className="btn btn-primary"
                  onClick={() => router.push("/")}
                >
                  Return Home
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-base-100 flex items-center justify-center">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
} 