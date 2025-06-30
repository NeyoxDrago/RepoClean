"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { repositoryService, Repository, RepositoryListOptions } from "@/services/repository-service";
import RepositoryCard from "@/components/repository-card";
import BatchOperations from "@/components/batch-operations";
import RepositoryFilters from "@/components/repository-filters";
import RepositoryMerger from "@/components/repository-merger";
import RepositoryCreator from "@/components/repository-creator";

export default function RepositoriesPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRepos, setSelectedRepos] = useState<Set<number>>(new Set());
  const [showMerger, setShowMerger] = useState(false);
  const [showCreator, setShowCreator] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filters, setFilters] = useState<RepositoryListOptions>({
    type: "owner",
    sort: "updated",
    direction: "desc",
    per_page: 100,
    page: 1,
  });
  const [pagination, setPagination] = useState({
    total_count: 0,
    page: 1,
    per_page: 100,
    has_next: false,
    has_prev: false,
  });

  useEffect(() => {
    console.log("Auth state:", { isAuthenticated, user: !!user, authLoading });
    if (isAuthenticated && user) {
      loadRepositories();
    }
  }, [isAuthenticated, user, filters]);

  const loadRepositories = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("Loading repositories with filters:", filters);
      const result = await repositoryService.getRepositories(filters);
      console.log("API Response:", result);
      
      // Handle different possible response structures
      if (Array.isArray(result)) {
        // If the result is directly an array of repositories
        setRepositories(result);
        setPagination({
          total_count: result.length,
          page: filters.page || 1,
          per_page: filters.per_page || 20,
          has_next: false,
          has_prev: false,
        });
      } else if (result && result.repositories) {
        // If the result has a repositories property
        setRepositories(result.repositories);
        setPagination({
          total_count: result.total_count || result.repositories.length,
          page: result.page || filters.page || 1,
          per_page: result.per_page || filters.per_page || 20,
          has_next: result.has_next || false,
          has_prev: result.has_prev || false,
        });
      } else {
        // If the result structure is unexpected
        console.warn("Unexpected API response structure:", result);
        setRepositories([]);
        setPagination({
          total_count: 0,
          page: 1,
          per_page: 20,
          has_next: false,
          has_prev: false,
        });
      }
    } catch (err) {
      console.error("Error loading repositories:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to load repositories";
      
      // If it's an authentication error, prompt user to log in again
      if (errorMessage.includes("authentication") || errorMessage.includes("token") || errorMessage.includes("login")) {
        setError("Your session has expired. Please log in again.");
        // Optionally redirect to login after a delay
        setTimeout(() => {
          window.location.href = "/";
        }, 3000);
      } else {
        setError(errorMessage);
      }
      setRepositories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRepository = (repoId: number, selected: boolean) => {
    const newSelected = new Set(selectedRepos);
    if (selected) {
      newSelected.add(repoId);
    } else {
      newSelected.delete(repoId);
    }
    setSelectedRepos(newSelected);
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected && repositories) {
      setSelectedRepos(new Set(repositories.map(repo => repo.id)));
    } else {
      setSelectedRepos(new Set());
    }
  };

  const handleBatchOperationComplete = () => {
    setSelectedRepos(new Set());
    loadRepositories();
  };

  const handleFiltersChange = (newFilters: Partial<RepositoryListOptions>) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
    setSelectedRepos(new Set());
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
    setSelectedRepos(new Set());
  };

  const loadMore = async () => {
    if (loadingMore || !pagination.has_next) return;
    
    setLoadingMore(true);
    try {
      const nextPageFilters = { ...filters, page: pagination.page + 1 };
      const result = await repositoryService.getRepositories(nextPageFilters);
      
      if (result && result.repositories) {
        // Append new repositories to existing ones
        setRepositories(prev => [...prev, ...result.repositories]);
        setPagination({
          total_count: result.total_count || 0,
          page: result.page || (pagination.page + 1),
          per_page: result.per_page || filters.per_page || 100,
          has_next: result.has_next || false,
          has_prev: result.has_prev || true,
        });
      }
    } catch (err) {
      console.error("Error loading more repositories:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
          <p>Please log in to access your repositories.</p>
          <button 
            className="btn btn-primary mt-4"
            onClick={() => window.location.href = "/"}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-100">
      {/* Header */}
      <div className="navbar bg-base-200 shadow-md">
        <div className="flex-1">
          <a href="/" className="btn btn-ghost text-xl">← RepoCleanr</a>
        </div>
        <div className="flex-none gap-4">
          <div className="flex items-center gap-2">
            <img 
              src={user?.user.avatar_url} 
              alt={user?.user.name} 
              className="w-8 h-8 rounded-full"
            />
            <span className="font-medium">{user?.user.name || user?.user.login}</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Repositories</h1>
            <p className="text-base-content/70">
              Manage your repositories with powerful batch operations
            </p>
          </div>
          <div className="flex gap-2">
            <button 
              className="btn btn-secondary"
              onClick={() => setShowMerger(true)}
              disabled={repositories.length < 2}
            >
              🔀 Merge Repositories
            </button>
            <button 
              className="btn btn-primary"
              onClick={() => setShowCreator(true)}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              New Repository
            </button>
          </div>
        </div>

        {/* Filters */}
        <RepositoryFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          totalCount={pagination.total_count}
        />

        {/* Batch Operations */}
        {selectedRepos.size > 0 && repositories && (
          <BatchOperations
            selectedRepositories={Array.from(selectedRepos)}
            repositories={repositories}
            onComplete={handleBatchOperationComplete}
          />
        )}

        {/* Repository List */}
        <div className="bg-base-200 rounded-lg p-6">
          {/* List Header */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="checkbox checkbox-sm"
                  checked={repositories && selectedRepos.size === repositories.length && repositories.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
                <span className="text-sm">
                  {selectedRepos.size > 0 
                    ? `${selectedRepos.size} selected` 
                    : `${pagination.total_count} repositories`
                  }
                </span>
              </label>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-base-content/70">
              <span>Sort by {filters.sort}</span>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center py-12">
              <div className="loading loading-spinner loading-lg"></div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="alert alert-error mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
              <button className="btn btn-sm btn-ghost" onClick={loadRepositories}>
                Retry
              </button>
            </div>
          )}

          {/* Repository Cards */}
          {!loading && !error && (
            <div className="space-y-3">
              {(!repositories || repositories.length === 0) ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📁</div>
                  <h3 className="text-xl font-semibold mb-2">No repositories found</h3>
                  <p className="text-base-content/70 mb-4">
                    {filters.search 
                      ? "Try adjusting your search or filters" 
                      : "Get started by creating your first repository"
                    }
                  </p>
                  <button className="btn btn-primary">Create Repository</button>
                </div>
              ) : (
                                (repositories || []).map((repo) => (
                  <RepositoryCard
                    key={repo.id}
                    repository={repo}
                    selected={selectedRepos.has(repo.id)}
                    onSelect={(selected: boolean) => handleSelectRepository(repo.id, selected)}
                  />
                ))
              )}
            </div>
          )}

          {/* Pagination */}
          {!loading && !error && repositories && repositories.length > 0 && (
            <div className="flex justify-between items-center mt-6 pt-6 border-t border-base-300">
              <div className="text-sm text-base-content/70">
                Showing {((pagination.page - 1) * pagination.per_page) + 1} to {Math.min(pagination.page * pagination.per_page, pagination.total_count)} of {pagination.total_count} repositories
              </div>
              
              <div className="flex gap-2">
                <button
                  className="btn btn-sm btn-outline"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={!pagination.has_prev}
                >
                  Previous
                </button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, Math.ceil(pagination.total_count / pagination.per_page)) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        className={`btn btn-sm ${page === pagination.page ? 'btn-primary' : 'btn-ghost'}`}
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  className="btn btn-sm btn-outline"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={!pagination.has_next}
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Load More */}
          {!loading && !error && repositories && repositories.length > 0 && pagination.has_next && (
            <div className="flex justify-center mt-6 pt-6 border-t border-base-300">
              <button
                className="btn btn-outline"
                onClick={loadMore}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Loading more...
                  </>
                ) : (
                  `Load More (${repositories.length} of ${pagination.total_count})`
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Repository Merger Modal */}
      {showMerger && (
        <RepositoryMerger
          repositories={repositories}
          onComplete={handleBatchOperationComplete}
          onClose={() => setShowMerger(false)}
        />
      )}

      {/* Repository Creator Modal */}
      {showCreator && (
        <RepositoryCreator
          onComplete={handleBatchOperationComplete}
          onClose={() => setShowCreator(false)}
        />
      )}
    </div>
  );
} 