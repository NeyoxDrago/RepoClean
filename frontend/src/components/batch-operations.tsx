import { useState } from "react";
import { Repository, repositoryService, BatchOperationRequest } from "@/services/repository-service";

interface BatchOperationsProps {
  selectedRepositories: number[];
  repositories: Repository[];
  onComplete: () => void;
}

export default function BatchOperations({ selectedRepositories, repositories, onComplete }: BatchOperationsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedOperation, setSelectedOperation] = useState<BatchOperationRequest["operation"] | null>(null);
  const [results, setResults] = useState<any>(null);

  const selectedRepoObjects = (repositories || []).filter(repo => selectedRepositories.includes(repo.id));

  const operations = [
    {
      id: "archive" as const,
      label: "Archive Repositories",
      description: "Archive selected repositories (makes them read-only)",
      icon: "📦",
      variant: "btn-warning",
    },
    {
      id: "unarchive" as const,
      label: "Unarchive Repositories", 
      description: "Unarchive selected repositories",
      icon: "📂",
      variant: "btn-info",
    },
    {
      id: "visibility_public" as const,
      label: "Make Public",
      description: "Change visibility to public",
      icon: "🌍",
      variant: "btn-success",
    },
    {
      id: "visibility_private" as const,
      label: "Make Private",
      description: "Change visibility to private",
      icon: "🔒",
      variant: "btn-info",
    },
    {
      id: "delete" as const,
      label: "Delete Repositories",
      description: "Permanently delete selected repositories (IRREVERSIBLE!)",
      icon: "🗑️",
      variant: "btn-error",
    },
  ];

  const handleOperationClick = (operation: BatchOperationRequest["operation"]) => {
    setSelectedOperation(operation);
    setShowModal(true);
    setResults(null);
  };

  const executeOperation = async () => {
    if (!selectedOperation) return;

    setIsLoading(true);
    try {
      console.log("Executing batch operation:", { operation: selectedOperation, repositories: selectedRepositories });
      
      const request: BatchOperationRequest = {
        repositories: selectedRepositories,
        operation: selectedOperation,
      };

      const result = await repositoryService.batchOperation(request);
      console.log("Batch operation result:", result);
      
      setResults(result);
      
      if (result.successful > 0) {
        setTimeout(() => {
          setShowModal(false);
          onComplete();
        }, 3000);
      }
    } catch (error) {
      console.error("Batch operation failed:", error);
      const errorMessage = error instanceof Error ? error.message : "Operation failed";
      
      setResults({
        results: [],
        total_requested: selectedRepositories.length,
        successful: 0,
        failed: selectedRepositories.length,
        errors: [errorMessage],
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getOperationDetails = () => {
    return operations.find(op => op.id === selectedOperation);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedOperation(null);
    setResults(null);
  };

  return (
    <>
      {/* Batch Operations Bar */}
      <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="badge badge-primary badge-lg">
              {selectedRepositories.length} selected
            </div>
            <span className="text-sm font-medium">
              Batch Operations:
            </span>
          </div>
          
          <div className="flex gap-2 flex-wrap">
            {operations.map((operation) => (
              <button
                key={operation.id}
                className={`btn btn-sm ${operation.variant}`}
                onClick={() => handleOperationClick(operation.id)}
                disabled={isLoading}
              >
                <span className="mr-1">{operation.icon}</span>
                {operation.label}
              </button>
            ))}
          </div>
        </div>
        
        {/* Selected Repositories Preview */}
        <div className="mt-3 pt-3 border-t border-primary/20">
          <div className="flex flex-wrap gap-2">
            {selectedRepoObjects.slice(0, 10).map((repo) => (
              <div key={repo.id} className="badge badge-ghost badge-sm">
                {repo.name}
              </div>
            ))}
            {selectedRepoObjects.length > 10 && (
              <div className="badge badge-ghost badge-sm">
                +{selectedRepoObjects.length - 10} more
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            {!results ? (
              <>
                {/* Confirmation Step */}
                <h3 className="font-bold text-lg mb-4">
                  {getOperationDetails()?.icon} {getOperationDetails()?.label}
                </h3>
                
                <div className="alert alert-warning mb-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-1.01-4.01h0M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h4 className="font-semibold">Confirm Operation</h4>
                    <p>{getOperationDetails()?.description}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="font-semibold mb-2">
                    This will affect {selectedRepositories.length} repositories:
                  </h4>
                  <div className="bg-base-200 rounded-lg p-3 max-h-40 overflow-y-auto">
                    {selectedRepoObjects.map((repo) => (
                      <div key={repo.id} className="flex items-center gap-2 py-1">
                        <span className="text-sm">{repo.full_name}</span>
                        {repo.private && <div className="badge badge-sm">Private</div>}
                        {repo.archived && <div className="badge badge-warning badge-sm">Archived</div>}
                      </div>
                    ))}
                  </div>
                </div>

                {selectedOperation === "delete" && (
                  <div className="alert alert-error mb-4">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                    <div>
                      <h4 className="font-semibold text-white">⚠️ DANGER ZONE ⚠️</h4>
                      <p className="text-white">This action CANNOT be undone! Repositories will be permanently deleted.</p>
                    </div>
                  </div>
                )}

                <div className="modal-action">
                  <button className="btn btn-ghost" onClick={closeModal} disabled={isLoading}>
                    Cancel
                  </button>
                  <button 
                    className={`btn ${getOperationDetails()?.variant}`}
                    onClick={executeOperation}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <span className="loading loading-spinner loading-sm"></span>
                        Processing...
                      </>
                    ) : (
                      `Confirm ${getOperationDetails()?.label}`
                    )}
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Results Step */}
                <h3 className="font-bold text-lg mb-4">
                  Operation Results
                </h3>

                <div className="mb-4">
                  <div className="stats stats-vertical lg:stats-horizontal shadow w-full">
                    <div className="stat">
                      <div className="stat-title">Total</div>
                      <div className="stat-value text-primary">{results.total_requested}</div>
                      <div className="stat-desc">Repositories</div>
                    </div>
                    
                    <div className="stat">
                      <div className="stat-title">Successful</div>
                      <div className="stat-value text-success">{results.successful}</div>
                      <div className="stat-desc">Operations</div>
                    </div>
                    
                    <div className="stat">
                      <div className="stat-title">Failed</div>
                      <div className="stat-value text-error">{results.failed}</div>
                      <div className="stat-desc">Operations</div>
                    </div>
                  </div>
                </div>

                {results.results && results.results.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-semibold mb-2">Detailed Results:</h4>
                    <div className="bg-base-200 rounded-lg p-3 max-h-60 overflow-y-auto">
                      {results.results.map((result: any, index: number) => (
                        <div key={index} className="flex items-center gap-2 py-1">
                          {result.success ? (
                            <div className="badge badge-success badge-sm">✓</div>
                          ) : (
                            <div className="badge badge-error badge-sm">✗</div>
                          )}
                          <span className="text-sm">{result.repository_name}</span>
                          {result.error && (
                            <span className="text-xs text-error">- {result.error}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {results.errors && results.errors.length > 0 && (
                  <div className="alert alert-error mb-4">
                    <h4 className="font-semibold">Errors:</h4>
                    <ul className="list-disc list-inside text-sm">
                      {results.errors.map((error: string, index: number) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="modal-action">
                  <button className="btn btn-primary" onClick={closeModal}>
                    {results.successful > 0 ? "Close & Refresh" : "Close"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
} 