"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { repositoryService, Repository, RepositoryListOptions } from "@/services/repository-service";
import RepositoryCard from "@/components/repository-card";
import BatchOperations from "@/components/batch-operations";
import RepositoryFilters from "@/components/repository-filters";
import RepositoryMerger from "@/components/repository-merger";
import RepositoryCreator from "@/components/repository-creator";

// Simple Tour Component (inline)
interface TourStep {
  id: string;
  title: string;
  description: string;
  target: string;
  position: "top" | "bottom" | "left" | "right";
}

const tourSteps: TourStep[] = [
  {
    id: "search",
    title: "Search Your Repositories",
    description: "Use the search bar to quickly find repositories by name or description. Hit Enter to search.",
    target: "search-input",
    position: "bottom"
  },
  {
    id: "filters",
    title: "Filter & Settings",
    description: "Use filters to narrow down your repositories by type, visibility, or other criteria.",
    target: "filter-button",
    position: "bottom"
  },
  {
    id: "stats",
    title: "Repository Statistics",
    description: "Monitor your repository statistics - total repositories, private repos, archived ones, and currently selected.",
    target: "stats-section",
    position: "bottom"
  },
  {
    id: "merge-repos",
    title: "Merge Repositories",
    description: "Combine multiple repositories into one. Perfect for consolidating similar projects or merging forks.",
    target: "merge-button",
    position: "bottom"
  },
  {
    id: "new-repo",
    title: "Create New Repository",
    description: "Click here to create a new repository directly from RepoCleanr.",
    target: "new-repo-button",
    position: "bottom"
  },
  {
    id: "selection",
    title: "Select Repositories",
    description: "Click checkboxes to select repositories. Use the master checkbox to select all at once.",
    target: "repo-list",
    position: "top"
  },
  {
    id: "batch-operations",
    title: "Batch Operations",
    description: "When you select repositories, powerful batch operations will appear here for bulk actions.",
    target: "batch-operations-area",
    position: "top"
  }
];

function Tour({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen && tourSteps[currentStep]) {
      const element = document.getElementById(tourSteps[currentStep].target);
      if (element) {
        setHighlightedElement(element);
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [isOpen, currentStep]);

  if (!isOpen) return null;

  const currentTourStep = tourSteps[currentStep];
  const isLastStep = currentStep === tourSteps.length - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = () => {
    if (isLastStep) {
      onClose();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  const getTooltipPosition = () => {
    if (!highlightedElement) return { top: "50%", left: "50%" };

    const rect = highlightedElement.getBoundingClientRect();
    const scrollTop = window.pageYOffset;
    const scrollLeft = window.pageXOffset;

    switch (currentTourStep.position) {
      case "top":
        return {
          top: rect.top + scrollTop - 20,
          left: rect.left + scrollLeft + rect.width / 2
        };
      case "bottom":
        return {
          top: rect.bottom + scrollTop + 20,
          left: rect.left + scrollLeft + rect.width / 2
        };
      case "left":
        return {
          top: rect.top + scrollTop + rect.height / 2,
          left: rect.left + scrollLeft - 20
        };
      case "right":
        return {
          top: rect.top + scrollTop + rect.height / 2,
          left: rect.right + scrollLeft + 20
        };
      default:
        return {
          top: rect.bottom + scrollTop + 20,
          left: rect.left + scrollLeft + rect.width / 2
        };
    }
  };

  const tooltipPosition = getTooltipPosition();

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-60 z-40" onClick={handleSkip} />
      
      {highlightedElement && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{
            top: highlightedElement.getBoundingClientRect().top + window.pageYOffset - 4,
            left: highlightedElement.getBoundingClientRect().left + window.pageXOffset - 4,
            width: highlightedElement.offsetWidth + 8,
            height: highlightedElement.offsetHeight + 8,
            border: "3px solid #3B82F6",
            borderRadius: "8px",
            boxShadow: "0 0 0 4px rgba(59, 130, 246, 0.3)"
          }}
        />
      )}

      <div
        className="fixed z-50 bg-white rounded-lg shadow-2xl border border-gray-200 p-6 max-w-sm transform -translate-x-1/2"
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left,
          ...(currentTourStep.position === "top" && { transform: "translate(-50%, -100%)" }),
          ...(currentTourStep.position === "bottom" && { transform: "translate(-50%, 0)" }),
          ...(currentTourStep.position === "left" && { transform: "translate(-100%, -50%)" }),
          ...(currentTourStep.position === "right" && { transform: "translate(0, -50%)" }),
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex space-x-1">
            {tourSteps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index <= currentStep ? "bg-blue-600" : "bg-gray-300"
                }`}
              />
            ))}
          </div>
          <span className="text-sm text-gray-500">
            {currentStep + 1} of {tourSteps.length}
          </span>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {currentTourStep.title}
          </h3>
          <p className="text-gray-600 text-sm leading-relaxed">
            {currentTourStep.description}
          </p>
        </div>

        <div className="flex justify-between items-center">
          <button
            onClick={handleSkip}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Skip Tour
          </button>
          
          <div className="flex space-x-2">
            {!isFirstStep && (
              <button
                onClick={handlePrevious}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Previous
              </button>
            )}
            <button
              onClick={handleNext}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              {isLastStep ? "Finish" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default function RepositoriesPage() {
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRepos, setSelectedRepos] = useState<Set<number>>(new Set());
  const [showMerger, setShowMerger] = useState(false);
  const [showCreator, setShowCreator] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showTour, setShowTour] = useState(false);
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
    if (isAuthenticated && user) {
      loadRepositories();
      
      // Check if user has seen the tour before
      const hasSeenTour = sessionStorage.getItem('repoCleanr_hasSeenTour');
      if (!hasSeenTour) {
        // Delay tour to let the page load
        setTimeout(() => {
          setShowTour(true);
        }, 1000);
      }
    }
  }, [isAuthenticated, user, filters]);

  const handleTourClose = () => {
    setShowTour(false);
    sessionStorage.setItem('repoCleanr_hasSeenTour', 'true');
  };

  const loadRepositories = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await repositoryService.getRepositories({ ...filters, search: searchQuery });
      
      if (Array.isArray(result)) {
        setRepositories(result);
        setPagination({
          total_count: result.length,
          page: filters.page || 1,
          per_page: filters.per_page || 20,
          has_next: false,
          has_prev: false,
        });
      } else if (result && result.repositories) {
        setRepositories(result.repositories);
        setPagination({
          total_count: result.total_count || result.repositories.length,
          page: result.page || filters.page || 1,
          per_page: result.per_page || filters.per_page || 20,
          has_next: result.has_next || false,
          has_prev: result.has_prev || false,
        });
      } else {
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
      
      if (errorMessage.includes("authentication") || errorMessage.includes("token") || errorMessage.includes("login")) {
        setError("Your session has expired. Please log in again.");
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

  const handleSearch = () => {
    setFilters(prev => ({ ...prev, search: searchQuery, page: 1 }));
    setSelectedRepos(new Set());
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

  // Calculate repository statistics
  const stats = {
    total: repositories?.length || 0,
    private: repositories?.filter(repo => repo.private).length || 0,
    archived: repositories?.filter(repo => repo.archived).length || 0,
    selected: selectedRepos.size
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
          <p>Please log in to access your repositories.</p>
          <button 
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors mt-4"
            onClick={() => window.location.href = "/"}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M8.25 6.75a3.75 3.75 0 117.5 0 3.75 3.75 0 01-7.5 0zM15.75 9.75a3 3 0 116 0 3 3 0 01-6 0zM2.25 9.75a3 3 0 116 0 3 3 0 01-6 0zM6.31 15.117A6.745 6.745 0 0112 12a6.745 6.745 0 016.709 7.498.75.75 0 01-.372.568A12.696 12.696 0 0112 21.75c-2.305 0-4.47-.612-6.337-1.684a.75.75 0 01-.372-.568 6.787 6.787 0 011.019-1.381z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-lg font-semibold text-gray-900">RepoCleanr</span>
              <span className="text-sm text-gray-500">Repository Management</span>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-lg mx-8">
              <div className="relative" id="search-input">
                <input
                  type="text"
                  placeholder="Search repositories by name or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full px-4 py-2 pl-10 pr-4 text-gray-700 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Right Side Controls */}
            <div className="flex items-center space-x-4">
              <button 
                id="filter-button"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 px-3 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
                </svg>
                <span>Filter</span>
              </button>

              <button className="flex items-center space-x-2 px-3 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Settings</span>
              </button>

              {/* Merge Repositories Button - More prominent */}
              <button 
                id="merge-button"
                onClick={() => setShowMerger(true)}
                disabled={repositories.length < 2}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2M8 12h8m0 0a2 2 0 012 2v6a2 2 0 01-2 2H10a2 2 0 01-2-2v-6a2 2 0 012-2z" />
                </svg>
                <span>Merge Repos</span>
              </button>

              <button 
                id="new-repo-button"
                onClick={() => setShowCreator(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>New Repo</span>
              </button>

              {/* User Menu */}
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700 font-medium">{user?.user.name || user?.user.login || 'John Doe'}</span>
                </div>
                <button 
                  onClick={logout}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Statistics */}
        <div id="stats-section" className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Total Repositories</span>
                </div>
                <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Private Repos</span>
                </div>
                <div className="text-2xl font-bold text-yellow-600">{stats.private}</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Archived</span>
                </div>
                <div className="text-2xl font-bold text-red-600">{stats.archived}</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Selected</span>
                </div>
                <div className="text-2xl font-bold text-green-600">{stats.selected}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
            <RepositoryFilters
              filters={filters}
              onFiltersChange={setFilters}
              totalCount={pagination.total_count}
            />
          </div>
        )}

        {/* Batch Operations */}
        <div id="batch-operations-area">
          {selectedRepos.size > 0 && repositories && (
            <div className="mb-6">
              <BatchOperations
                selectedRepositories={Array.from(selectedRepos)}
                repositories={repositories}
                onComplete={handleBatchOperationComplete}
              />
            </div>
          )}
        </div>

        {/* Repository List */}
        <div id="repo-list" className="bg-white rounded-lg border border-gray-200">
          {/* List Header */}
          <div className="flex justify-between items-center p-4 border-b border-gray-200">
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  checked={repositories && selectedRepos.size === repositories.length && repositories.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
                <span className="text-sm text-gray-600">
                  {selectedRepos.size > 0 
                    ? `${selectedRepos.size} repositories` 
                    : `${stats.total} repositories`
                  }
                </span>
              </label>
              <span className="text-xs text-gray-400">Click to select</span>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="p-4 bg-red-50 border-l-4 border-red-400">
              <div className="flex">
                <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                  <button 
                    onClick={loadRepositories}
                    className="mt-2 text-sm text-red-800 underline hover:text-red-900"
                  >
                    Try again
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Repository Cards */}
          {!loading && !error && (
            <div className="divide-y divide-gray-200">
              {(!repositories || repositories.length === 0) ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📁</div>
                  <h3 className="text-xl font-semibold mb-2">No repositories found</h3>
                  <p className="text-gray-500 mb-4">
                    {searchQuery 
                      ? "Try adjusting your search or filters" 
                      : "Get started by creating your first repository"
                    }
                  </p>
                  <button 
                    onClick={() => setShowCreator(true)}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create Repository
                  </button>
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
        </div>
      </main>

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

      {/* Tour Component */}
      <Tour isOpen={showTour} onClose={handleTourClose} />
    </div>
  );
} 