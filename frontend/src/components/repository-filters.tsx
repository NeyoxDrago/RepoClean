import { useState } from "react";
import { RepositoryListOptions } from "@/services/repository-service";

interface RepositoryFiltersProps {
  filters: RepositoryListOptions;
  onFiltersChange: (filters: Partial<RepositoryListOptions>) => void;
  totalCount: number;
}

export default function RepositoryFilters({ filters, onFiltersChange, totalCount }: RepositoryFiltersProps) {
  const [searchTerm, setSearchTerm] = useState(filters.search || "");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFiltersChange({ search: searchTerm.trim() || undefined });
  };

  const handleQuickFilter = (filterType: string, value: any) => {
    onFiltersChange({ [filterType]: value });
  };

  const clearFilters = () => {
    setSearchTerm("");
    onFiltersChange({
      search: undefined,
      type: "owner",
      sort: "updated",
      direction: "desc",
      language: undefined,
      archived: undefined,
      fork: undefined,
      org: undefined,
    });
  };

  const hasActiveFilters = Boolean(
    filters.search || 
    filters.language || 
    filters.archived !== undefined || 
    filters.fork !== undefined ||
    filters.org ||
    filters.type !== "owner" ||
    filters.sort !== "updated" ||
    filters.direction !== "desc"
  );

  return (
    <div className="bg-base-200 rounded-lg p-4 mb-6">
      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2 mb-4">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search repositories by name, description, or README..."
            className="input input-bordered w-full pr-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 btn btn-ghost btn-sm btn-circle"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>
        
        <button
          type="button"
          className={`btn btn-outline ${showAdvanced ? 'btn-active' : ''}`}
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
          </svg>
          Filters
        </button>
      </form>

      {/* Quick Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Type:</span>
          <div className="btn-group">
            {[
              { value: "owner", label: "Owned" },
              { value: "all", label: "All" },
              { value: "public", label: "Public" },
              { value: "private", label: "Private" },
              { value: "member", label: "Member" },
            ].map((option) => (
              <button
                key={option.value}
                className={`btn btn-sm ${filters.type === option.value ? 'btn-active' : 'btn-outline'}`}
                onClick={() => handleQuickFilter("type", option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Sort:</span>
          <select
            className="select select-sm select-bordered"
            value={`${filters.sort}-${filters.direction}`}
            onChange={(e) => {
              const [sort, direction] = e.target.value.split("-");
              onFiltersChange({ sort: sort as any, direction: direction as any });
            }}
          >
            <option value="updated-desc">Recently Updated</option>
            <option value="created-desc">Recently Created</option>
            <option value="pushed-desc">Recently Pushed</option>
            <option value="full_name-asc">Name A-Z</option>
            <option value="full_name-desc">Name Z-A</option>
          </select>
        </div>

        {hasActiveFilters && (
          <button
            className="btn btn-sm btn-ghost text-error"
            onClick={clearFilters}
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear Filters
          </button>
        )}
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="border-t border-base-300 pt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Language Filter */}
            <div>
              <label className="label label-text text-sm font-medium">Language:</label>
              <input
                type="text"
                placeholder="e.g., JavaScript, Python"
                className="input input-sm input-bordered w-full"
                value={filters.language || ""}
                onChange={(e) => onFiltersChange({ language: e.target.value || undefined })}
              />
            </div>

            {/* Organization Filter */}
            <div>
              <label className="label label-text text-sm font-medium">Organization:</label>
              <input
                type="text"
                placeholder="Organization name"
                className="input input-sm input-bordered w-full"
                value={filters.org || ""}
                onChange={(e) => onFiltersChange({ org: e.target.value || undefined })}
              />
            </div>

            {/* Archive Status */}
            <div>
              <label className="label label-text text-sm font-medium">Archive Status:</label>
              <select
                className="select select-sm select-bordered w-full"
                value={filters.archived === undefined ? "all" : filters.archived.toString()}
                onChange={(e) => {
                  const value = e.target.value;
                  onFiltersChange({ 
                    archived: value === "all" ? undefined : value === "true" 
                  });
                }}
              >
                <option value="all">All</option>
                <option value="false">Active</option>
                <option value="true">Archived</option>
              </select>
            </div>

            {/* Fork Status */}
            <div>
              <label className="label label-text text-sm font-medium">Fork Status:</label>
              <select
                className="select select-sm select-bordered w-full"
                value={filters.fork === undefined ? "all" : filters.fork.toString()}
                onChange={(e) => {
                  const value = e.target.value;
                  onFiltersChange({ 
                    fork: value === "all" ? undefined : value === "true" 
                  });
                }}
              >
                <option value="all">All</option>
                <option value="false">Source</option>
                <option value="true">Forks</option>
              </select>
            </div>
          </div>

          {/* Results per page */}
          <div className="flex items-center gap-4">
            <label className="label label-text text-sm font-medium">Results per page:</label>
            <select
              className="select select-sm select-bordered"
              value={filters.per_page || 100}
              onChange={(e) => onFiltersChange({ per_page: parseInt(e.target.value) })}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      )}

      {/* Results Summary */}
      <div className="flex justify-between items-center text-sm text-base-content/70 mt-4 pt-4 border-t border-base-300">
        <span>
          {totalCount > 0 ? `${totalCount} repositories found` : "No repositories found"}
        </span>
        
        {hasActiveFilters && (
          <div className="flex items-center gap-2">
            <span>Filters active:</span>
            <div className="flex gap-1">
              {filters.search && <div className="badge badge-sm">Search: {filters.search}</div>}
              {filters.language && <div className="badge badge-sm">Language: {filters.language}</div>}
              {filters.org && <div className="badge badge-sm">Org: {filters.org}</div>}
              {filters.archived !== undefined && (
                <div className="badge badge-sm">
                  {filters.archived ? "Archived" : "Active"}
                </div>
              )}
              {filters.fork !== undefined && (
                <div className="badge badge-sm">
                  {filters.fork ? "Forks" : "Source"}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 