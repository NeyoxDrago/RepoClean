"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { repositoryService, Repository } from "@/services/repository-service";
import FileExplorer from "@/components/file-explorer";

export default function RepositoryDetailPage() {
  const params = useParams();
  const { isAuthenticated } = useAuth();
  const [repository, setRepository] = useState<Repository | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"files" | "settings" | "actions">("files");

  const owner = params.owner as string;
  const repo = params.repo as string;

  useEffect(() => {
    if (isAuthenticated && owner && repo) {
      loadRepository();
    }
  }, [isAuthenticated, owner, repo]);

  const loadRepository = async () => {
    try {
      setLoading(true);
      setError(null);
      const repoData = await repositoryService.getRepository(owner, repo);
      setRepository(repoData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load repository");
    } finally {
      setLoading(false);
    }
  };

  const handleArchiveToggle = async () => {
    if (!repository) return;

    try {
      await repositoryService.updateRepository(owner, repo, {
        archived: !repository.archived,
      });
      await loadRepository();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update repository");
    }
  };

  const handleVisibilityToggle = async () => {
    if (!repository) return;

    try {
      await repositoryService.updateRepository(owner, repo, {
        private: !repository.private,
      });
      await loadRepository();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update repository");
    }
  };

  const handleDeleteRepository = async () => {
    if (!repository || !confirm(`Are you sure you want to delete ${repository.full_name}? This action cannot be undone.`)) {
      return;
    }

    try {
      await repositoryService.deleteRepository(owner, repo);
      window.location.href = "/repositories";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete repository");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
          <p>Please log in to access repository details.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-error">Error</h1>
          <p className="mb-4">{error}</p>
          <button className="btn btn-primary" onClick={loadRepository}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!repository) {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Repository Not Found</h1>
          <p>The repository {owner}/{repo} could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-100">
      {/* Header */}
      <div className="navbar bg-base-200 shadow-md">
        <div className="flex-1">
          <a href="/repositories" className="btn btn-ghost text-xl">← Repositories</a>
        </div>
      </div>

      {/* Repository Header */}
      <div className="bg-gradient-to-r from-primary to-secondary text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="avatar">
                <div className="w-16 h-16 rounded-full">
                  <img src={repository.owner.avatar_url} alt={repository.owner.login} />
                </div>
              </div>
              
              <div>
                <h1 className="text-3xl font-bold">{repository.full_name}</h1>
                {repository.description && (
                  <p className="text-lg text-white/90 mt-2">{repository.description}</p>
                )}
                
                <div className="flex items-center gap-4 mt-4 text-sm">
                  <div className="flex items-center gap-1">
                    {repository.private ? (
                      <>
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                        </svg>
                        <span>Private</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                        </svg>
                        <span>Public</span>
                      </>
                    )}
                  </div>
                  
                  {repository.language && (
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-white/80"></div>
                      <span>{repository.language}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                    <span>{repository.stargazers_count}</span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 2a2 2 0 012 2v6.98l2 2V14a2 2 0 012 2v6a2 2 0 11-4 0v-6l-2-2zm8 0a2 2 0 012 2v6.98l-2 2V14a2 2 0 00-2-2H8.83l2.58-2.58c.78-.78.78-2.05 0-2.83-.78-.78-2.05-.78-2.83 0l-5.66 5.66c-.78.78-.78 2.05 0 2.83l5.66 5.66c.78.78 2.05.78 2.83 0 .78-.78.78-2.05 0-2.83L8.83 16H12v6a2 2 0 004 0v-6V4a2 2 0 00-2-2z"/>
                    </svg>
                    <span>{repository.forks_count}</span>
                  </div>

                  {repository.archived && (
                    <div className="badge badge-warning">Archived</div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <a
                href={repository.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline btn-sm text-white border-white hover:bg-white hover:text-primary"
              >
                View on GitHub
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="container mx-auto px-4">
        <div className="tabs tabs-boxed bg-base-200 p-1 mt-6">
          <button
            className={`tab ${activeTab === "files" ? "tab-active" : ""}`}
            onClick={() => setActiveTab("files")}
          >
            📁 Files
          </button>
          <button
            className={`tab ${activeTab === "settings" ? "tab-active" : ""}`}
            onClick={() => setActiveTab("settings")}
          >
            ⚙️ Settings
          </button>
          <button
            className={`tab ${activeTab === "actions" ? "tab-active" : ""}`}
            onClick={() => setActiveTab("actions")}
          >
            🚀 Actions
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="container mx-auto px-4 py-6">
        {activeTab === "files" && (
          <div className="bg-base-200 rounded-lg h-[600px]">
            <FileExplorer
              owner={owner}
              repo={repo}
            />
          </div>
        )}

        {activeTab === "settings" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card bg-base-200 shadow-md">
              <div className="card-body">
                <h3 className="card-title">Repository Information</h3>
                <div className="space-y-3">
                  <div>
                    <span className="font-medium">Name:</span> {repository.name}
                  </div>
                  <div>
                    <span className="font-medium">Full Name:</span> {repository.full_name}
                  </div>
                  <div>
                    <span className="font-medium">Default Branch:</span> {repository.default_branch}
                  </div>
                  <div>
                    <span className="font-medium">Size:</span> {(repository.size / 1024).toFixed(1)} MB
                  </div>
                  <div>
                    <span className="font-medium">Created:</span> {new Date(repository.created_at).toLocaleDateString()}
                  </div>
                  <div>
                    <span className="font-medium">Last Push:</span> {new Date(repository.pushed_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>

            <div className="card bg-base-200 shadow-md">
              <div className="card-body">
                <h3 className="card-title">Quick Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Visibility</div>
                      <div className="text-sm text-base-content/70">
                        {repository.private ? "Private repository" : "Public repository"}
                      </div>
                    </div>
                    <button
                      className="btn btn-sm btn-outline"
                      onClick={handleVisibilityToggle}
                    >
                      Make {repository.private ? "Public" : "Private"}
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Archive Status</div>
                      <div className="text-sm text-base-content/70">
                        {repository.archived ? "Repository is archived" : "Repository is active"}
                      </div>
                    </div>
                    <button
                      className={`btn btn-sm ${repository.archived ? "btn-success" : "btn-warning"}`}
                      onClick={handleArchiveToggle}
                    >
                      {repository.archived ? "Unarchive" : "Archive"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "actions" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card bg-base-200 shadow-md">
              <div className="card-body">
                <h3 className="card-title">Repository Actions</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Clone Repository</h4>
                    <div className="form-control">
                      <div className="input-group">
                        <input
                          type="text"
                          value={repository.clone_url}
                          readOnly
                          className="input input-bordered flex-1"
                        />
                        <button
                          className="btn btn-square"
                          onClick={() => navigator.clipboard.writeText(repository.clone_url)}
                        >
                          📋
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">SSH Clone</h4>
                    <div className="form-control">
                      <div className="input-group">
                        <input
                          type="text"
                          value={repository.ssh_url}
                          readOnly
                          className="input input-bordered flex-1"
                        />
                        <button
                          className="btn btn-square"
                          onClick={() => navigator.clipboard.writeText(repository.ssh_url)}
                        >
                          📋
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {repository.permissions?.admin && (
              <div className="card bg-base-200 shadow-md border-error">
                <div className="card-body">
                  <h3 className="card-title text-error">Danger Zone</h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Delete Repository</h4>
                      <p className="text-sm text-base-content/70 mb-3">
                        Once you delete a repository, there is no going back. Please be certain.
                      </p>
                      <button
                        className="btn btn-error btn-sm"
                        onClick={handleDeleteRepository}
                      >
                        Delete Repository
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 