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
      label: "Archive",
      description: "Archive selected repositories (makes them read-only)",
      icon: "📦",
      color: "text-yellow-600 bg-yellow-50 border-yellow-200 hover:bg-yellow-100",
    },
    {
      id: "unarchive" as const,
      label: "Unarchive", 
      description: "Unarchive selected repositories",
      icon: "📂",
      color: "text-blue-600 bg-blue-50 border-blue-200 hover:bg-blue-100",
    },
    {
      id: "visibility_public" as const,
      label: "Make Public",
      description: "Change visibility to public",
      icon: "🌍",
      color: "text-green-600 bg-green-50 border-green-200 hover:bg-green-100",
    },
    {
      id: "visibility_private" as const,
      label: "Make Private",
      description: "Change visibility to private",
      icon: "🔒",
      color: "text-purple-600 bg-purple-50 border-purple-200 hover:bg-purple-100",
    },
    {
      id: "delete" as const,
      label: "Delete",
      description: "Permanently delete selected repositories (IRREVERSIBLE!)",
      icon: "🗑️",
      color: "text-red-600 bg-red-50 border-red-200 hover:bg-red-100",
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
      const request: BatchOperationRequest = {
        repositories: selectedRepositories,
        operation: selectedOperation,
      };

      const result = await repositoryService.batchOperation(request);
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
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-600 text-white">
              {selectedRepositories.length} selected
            </div>
            <span className="text-sm font-medium text-gray-700">
              Batch Operations:
            </span>
          </div>
          
          <div className="flex gap-2 flex-wrap">
            {operations.map((operation) => (
              <button
                key={operation.id}
                className={`px-3 py-1 rounded-lg text-sm font-medium border transition-colors ${operation.color}`}
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
        <div className="mt-3 pt-3 border-t border-blue-200">
          <div className="flex flex-wrap gap-2">
            {selectedRepoObjects.slice(0, 10).map((repo) => (
              <div key={repo.id} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-white text-gray-700 border border-gray-200">
                {repo.name}
              </div>
            ))}
            {selectedRepoObjects.length > 10 && (
              <div className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-white text-gray-700 border border-gray-200">
                +{selectedRepoObjects.length - 10} more
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
            {!results ? (
              <>
                {/* Confirmation Step */}
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {getOperationDetails()?.icon} {getOperationDetails()?.label}
                  </h3>
                  <p className="text-gray-600">{getOperationDetails()?.description}</p>
                </div>

                <div className="p-6">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <div className="flex">
                      <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <div className="ml-3">
                        <h4 className="text-sm font-medium text-yellow-800">Confirm Operation</h4>
                        <p className="text-sm text-yellow-700 mt-1">This action will affect {selectedRepositories.length} repositories.</p>
                      </div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">
                      Affected repositories:
                    </h4>
                    <div className="bg-gray-50 rounded-lg p-3 max-h-60 overflow-y-auto">
                      {selectedRepoObjects.map((repo) => (
                        <div key={repo.id} className="flex items-center justify-between py-2 border-b border-gray-200 last:border-b-0">
                          <span className="text-sm font-medium text-gray-900">{repo.full_name}</span>
                          <div className="flex space-x-2">
                            {repo.private && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                Private
                              </span>
                            )}
                            {repo.archived && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                Archived
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {selectedOperation === "delete" && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                      <div className="flex">
                        <svg className="w-5 h-5 text-red-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <div className="ml-3">
                          <h4 className="text-sm font-medium text-red-800">⚠️ DANGER ZONE ⚠️</h4>
                          <p className="text-sm text-red-700 mt-1">This action CANNOT be undone! Repositories will be permanently deleted.</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
                  <button
                    onClick={closeModal}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={executeOperation}
                    disabled={isLoading}
                    className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                      selectedOperation === "delete" 
                        ? "bg-red-600 hover:bg-red-700" 
                        : "bg-blue-600 hover:bg-blue-700"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
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
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Operation Results
                  </h3>
                </div>

                <div className="p-6">
                  <div className="mb-6">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{results.successful}</div>
                        <div className="text-sm text-gray-500">Successful</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">{results.failed}</div>
                        <div className="text-sm text-gray-500">Failed</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-600">{results.total_requested}</div>
                        <div className="text-sm text-gray-500">Total</div>
                      </div>
                    </div>
                  </div>

                  {results.errors && results.errors.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                      <h4 className="text-sm font-medium text-red-800 mb-2">Errors:</h4>
                      <ul className="text-sm text-red-700 space-y-1">
                        {results.errors.map((error: string, index: number) => (
                          <li key={index}>• {error}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {results.successful > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-sm text-green-800">
                        Operation completed successfully! The page will refresh automatically.
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex justify-end p-6 border-t border-gray-200">
                  <button
                    onClick={closeModal}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                  >
                    Close
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