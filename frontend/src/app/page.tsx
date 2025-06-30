"use client";

import { useAuth } from "@/contexts/auth-context";

export default function HomePage() {
  const { user, isLoading, isAuthenticated, login, logout } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  if (isAuthenticated && user) {
    return (
      <div className="min-h-screen bg-base-100">
        {/* Authenticated Header */}
        <div className="navbar bg-base-200 shadow-md">
          <div className="flex-1">
            <h1 className="text-xl font-bold">RepoCleanr</h1>
          </div>
          <div className="flex-none gap-4">
            <div className="flex items-center gap-2">
              <img 
                src={user.user.avatar_url} 
                alt={user.user.name} 
                className="w-8 h-8 rounded-full"
              />
              <span className="font-medium">{user.user.name || user.user.login}</span>
            </div>
            <button className="btn btn-outline btn-sm" onClick={logout}>
              Logout
            </button>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="hero bg-gradient-to-br from-primary to-secondary rounded-lg mb-8">
            <div className="hero-content text-center py-12">
              <div className="max-w-md text-white">
                <h1 className="text-3xl font-bold mb-4">
                  Welcome back, {user.user.name || user.user.login}!
                </h1>
                <div className="stats stats-horizontal bg-white/10 backdrop-blur">
                  <div className="stat">
                    <div className="stat-title text-white/80">Repositories</div>
                    <div className="stat-value text-white">{user.repositories_count}</div>
                  </div>
                  <div className="stat">
                    <div className="stat-title text-white/80">Organizations</div>
                    <div className="stat-value text-white">{user.organizations_count}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="card bg-base-200 shadow-md hover:shadow-lg transition-shadow">
              <div className="card-body">
                <h3 className="card-title">Repository Management</h3>
                <p>View and manage all your repositories in one place</p>
                <div className="card-actions justify-end">
                  <a href="/repositories" className="btn btn-primary btn-sm">Manage Repos</a>
                </div>
              </div>
            </div>
            
            <div className="card bg-base-200 shadow-md hover:shadow-lg transition-shadow">
              <div className="card-body">
                <h3 className="card-title">Batch Operations</h3>
                <p>Archive, delete, or change visibility of multiple repositories</p>
                <div className="card-actions justify-end">
                  <a href="/repositories" className="btn btn-primary btn-sm">Batch Actions</a>
                </div>
              </div>
            </div>
            
            <div className="card bg-base-200 shadow-md hover:shadow-lg transition-shadow">
              <div className="card-body">
                <h3 className="card-title">Organizations</h3>
                <p>Manage repositories across your organizations</p>
                <div className="card-actions justify-end">
                  <button className="btn btn-primary btn-sm">View Orgs</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-100">
      {/* Hero Section */}
      <div className="hero min-h-screen bg-gradient-to-br from-primary to-secondary">
        <div className="hero-content text-center">
          <div className="max-w-md">
            <h1 className="text-5xl font-bold text-white mb-5">
              RepoCleanr
            </h1>
            <p className="text-xl text-white/90 mb-8">
              Manage your GitHub repositories at scale with powerful batch operations
            </p>
            <div className="space-y-4">
              <button 
                className="btn btn-accent btn-lg w-full"
                onClick={login}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="loading loading-spinner"></span>
                    Connecting...
                  </>
                ) : (
                  "Connect with GitHub"
                )}
              </button>
              <div className="text-white/80 text-sm">
                Requires GitHub OAuth permissions for repository management
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Powerful Repository Management
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="card bg-base-200 shadow-md">
              <div className="card-body">
                <h3 className="card-title">Batch Operations</h3>
                <p>Archive, delete, or change visibility of multiple repositories at once</p>
              </div>
            </div>
            
            <div className="card bg-base-200 shadow-md">
              <div className="card-body">
                <h3 className="card-title">File Management</h3>
                <p>Manage files across repositories using GitHub Contents API</p>
              </div>
            </div>
            
            <div className="card bg-base-200 shadow-md">
              <div className="card-body">
                <h3 className="card-title">Template Creation</h3>
                <p>Create and manage template repositories for your organization</p>
              </div>
            </div>
            
            <div className="card bg-base-200 shadow-md">
              <div className="card-body">
                <h3 className="card-title">Search & Filter</h3>
                <p>Find repositories quickly with advanced search and filtering options</p>
              </div>
            </div>
            
            <div className="card bg-base-200 shadow-md">
              <div className="card-body">
                <h3 className="card-title">Drag & Drop</h3>
                <p>Intuitive drag and drop interface for bulk operations</p>
              </div>
            </div>
            
            <div className="card bg-base-200 shadow-md">
              <div className="card-body">
                <h3 className="card-title">Progress Tracking</h3>
                <p>Real-time progress modals for long-running operations</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 