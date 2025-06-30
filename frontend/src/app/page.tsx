"use client";

import { useAuth } from "@/contexts/auth-context";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const { user, isLoading, isAuthenticated, login } = useAuth();
  const router = useRouter();

  // Redirect authenticated users to repositories page
  useEffect(() => {
    if (isAuthenticated && user && !isLoading) {
      router.push('/repositories');
    }
  }, [isAuthenticated, user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If authenticated, show loading while redirecting
  if (isAuthenticated && user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to your repositories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M8.25 6.75a3.75 3.75 0 117.5 0 3.75 3.75 0 01-7.5 0zM15.75 9.75a3 3 0 116 0 3 3 0 01-6 0zM2.25 9.75a3 3 0 116 0 3 3 0 01-6 0zM6.31 15.117A6.745 6.745 0 0112 12a6.745 6.745 0 016.709 7.498.75.75 0 01-.372.568A12.696 12.696 0 0112 21.75c-2.305 0-4.47-.612-6.337-1.684a.75.75 0 01-.372-.568 6.787 6.787 0 011.019-1.381z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">RepoCleanr</h1>
                <p className="text-sm text-gray-500">Repository Management Reimagined</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Transform your GitHub workflow with powerful repository management tools.
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            <span className="text-blue-600 font-medium">Clean, organize, and optimize</span> your repositories at scale.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {/* Welcome Card */}
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-8 border border-purple-100">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M8.25 6.75a3.75 3.75 0 117.5 0 3.75 3.75 0 01-7.5 0zM15.75 9.75a3 3 0 116 0 3 3 0 01-6 0zM2.25 9.75a3 3 0 116 0 3 3 0 01-6 0zM6.31 15.117A6.745 6.745 0 0112 12a6.745 6.745 0 016.709 7.498.75.75 0 01-.372.568A12.696 12.696 0 0112 21.75c-2.305 0-4.47-.612-6.337-1.684a.75.75 0 01-.372-.568 6.787 6.787 0 011.019-1.381z" clipRule="evenodd" />
                </svg>
              </div>
              
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Welcome</h3>
              
              <p className="text-gray-600 mb-8">
                Connect your GitHub account to unlock the full power of RepoCleanr
              </p>

              <button 
                onClick={login}
                disabled={isLoading}
                className="w-full bg-gray-800 text-white py-4 px-6 rounded-xl font-medium hover:bg-gray-900 transition-colors duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                    <span>Continue with GitHub</span>
                  </>
                )}
              </button>

              <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <svg className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-orange-800">We'll request these permissions:</p>
                    <ul className="text-sm text-orange-700 mt-1 space-y-1">
                      <li>• <strong>repo</strong> - Repository access for management</li>
                      <li>• <strong>delete_repo</strong> - Repository deletion capabilities</li>
                      <li>• <strong>read:org</strong> - Organization repository access</li>
                    </ul>
                    <p className="text-xs text-orange-600 mt-2">
                      By continuing, you agree to our <a href="#" className="underline">Terms of Service</a> and <a href="#" className="underline">Privacy Policy</a>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-6">
            <div className="flex items-start space-x-4 p-6 bg-blue-50 rounded-xl border border-blue-100">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Lightning Fast</h4>
                <p className="text-gray-600">Bulk operations and repository management at scale with intuitive controls</p>
              </div>
            </div>

            <div className="flex items-start space-x-4 p-6 bg-green-50 rounded-xl border border-green-100">
              <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Secure & Private</h4>
                <p className="text-gray-600">OAuth authentication with GitHub ensures your data stays protected</p>
              </div>
            </div>

            <div className="flex items-start space-x-4 p-6 bg-purple-50 rounded-xl border border-purple-100">
              <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Team Collaboration</h4>
                <p className="text-gray-600">Manage repositories across personal and organization accounts seamlessly</p>
              </div>
            </div>
          </div>
        </div>

        {/* Required GitHub Permissions */}
        <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200">
          <div className="flex items-center space-x-3 mb-6">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-xl font-bold text-gray-900">Required GitHub Permissions</h3>
          </div>
          <p className="text-gray-600 mb-8">RepoCleanr requires specific GitHub API scopes to provide full functionality</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                <h4 className="text-lg font-semibold text-gray-900">Repository Management</h4>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2">
                  <span className="font-mono text-sm text-blue-600">repo</span>
                  <span className="text-sm text-gray-600">Full repository access</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="font-mono text-sm text-red-600">delete_repo</span>
                  <span className="text-sm text-gray-600">Repository deletion</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="font-mono text-sm text-green-600">repo:status</span>
                  <span className="text-sm text-gray-600">Repository status</span>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-3 h-3 bg-purple-600 rounded-full"></div>
                <h4 className="text-lg font-semibold text-gray-900">Organization Access</h4>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2">
                  <span className="font-mono text-sm text-purple-600">read:org</span>
                  <span className="text-sm text-gray-600">Organization data</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="font-mono text-sm text-orange-600">admin:org</span>
                  <span className="text-sm text-gray-600">Organization management</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="font-mono text-sm text-blue-600">user:email</span>
                  <span className="text-sm text-gray-600">User email access</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 