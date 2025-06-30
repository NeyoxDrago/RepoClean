import { useState } from "react";
import { Repository, repositoryService } from "@/services/repository-service";

interface RepositoryMergerProps {
  repositories: Repository[];
  onComplete: () => void;
  onClose: () => void;
}

interface MergeProgress {
  phase: "scanning" | "transferring" | "deleting" | "complete" | "error";
  current: number;
  total: number;
  currentFile?: string;
  currentRepo?: string;
  errors: string[];
  processedRepos: string[];
  skippedRepos: string[];
  debugInfo: string[];
}

interface RepoMergeResult {
  success: boolean;
  repoName: string;
  fileCount: number;
  skipped: boolean;
  error?: string;
  transferredFiles: number;
  failedFiles: number;
}

export default function RepositoryMerger({ repositories, onComplete, onClose }: RepositoryMergerProps) {
  const [selectedSourceRepos, setSelectedSourceRepos] = useState<Set<number>>(new Set());
  const [targetRepo, setTargetRepo] = useState<Repository | null>(null);
  const [folderStructure, setFolderStructure] = useState<"flat" | "separate">("separate");
  const [customFolder, setCustomFolder] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [progress, setProgress] = useState<MergeProgress>({
    phase: "scanning",
    current: 0,
    total: 0,
    errors: [],
    processedRepos: [],
    skippedRepos: [],
    debugInfo: [],
  });
  const [useConservativeMode, setUseConservativeMode] = useState(false);
  const [conservativeDelaySeconds, setConservativeDelaySeconds] = useState(15);
  const [results, setResults] = useState<RepoMergeResult[]>([]);

  const availableRepos = repositories.filter(repo => !repo.archived);
  
  const filteredSourceRepos = availableRepos.filter(repo => 
    repo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    repo.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedRepos = availableRepos.filter(repo => selectedSourceRepos.has(repo.id));

  const handleSelectAll = () => {
    const allIds = new Set(filteredSourceRepos.map(repo => repo.id));
    setSelectedSourceRepos(allIds);
  };

  const handleClearAll = () => {
    setSelectedSourceRepos(new Set());
  };

  const handleToggleRepo = (repoId: number) => {
    const newSelection = new Set(selectedSourceRepos);
    if (newSelection.has(repoId)) {
      newSelection.delete(repoId);
    } else {
      newSelection.add(repoId);
    }
    setSelectedSourceRepos(newSelection);
  };

  const addDebugInfo = (message: string) => {
    setProgress(prev => ({
      ...prev,
      debugInfo: [...prev.debugInfo, `${new Date().toISOString()}: ${message}`],
    }));
    console.log(`[Merger Debug] ${message}`);
  };

  // Removed the old inefficient getAllFilesRecursively function
  // Now using optimized repositoryService.getRepositoryFilesOptimized() method

  const executeTransfer = async () => {
    if (!targetRepo || selectedRepos.length === 0) return;

    setIsProcessing(true);
    setProgress({
      phase: "scanning",
      current: 0,
      total: selectedRepos.length,
      currentFile: "Starting merge operation...",
      errors: [],
      processedRepos: [],
      skippedRepos: [],
      debugInfo: [],
    });

    addDebugInfo("🚀 Starting modern merge operation with enhanced rate limiting");
    addDebugInfo(`Selected repositories: ${selectedRepos.map(r => r.full_name).join(", ")}`);
    addDebugInfo(`Target: ${targetRepo.full_name}`);
    addDebugInfo(`Folder structure: ${folderStructure}`);
    addDebugInfo(`Conservative mode: ${useConservativeMode}`);
    
    if (useConservativeMode) {
      addDebugInfo(`Conservative delay: ${conservativeDelaySeconds} seconds between repositories`);
    }

    try {
      const repositoryPaths = selectedRepos.map(repo => repo.full_name);
      
      const result = await repositoryService.mergeRepositories(
        repositoryPaths,
        targetRepo.owner.login,
        targetRepo.name,
        folderStructure === "separate",
        (progress) => {
          // Update progress from the service
          setProgress(prev => ({
            ...prev,
            phase: progress.phase as "scanning" | "transferring" | "deleting" | "complete" | "error",
            current: progress.processedRepos,
            total: progress.totalRepos,
            currentRepo: progress.currentRepo,
            currentFile: `${progress.phase}: ${progress.currentRepo}`,
          }));
          
          addDebugInfo(`Progress: ${progress.processedRepos}/${progress.totalRepos} repos, ${progress.transferredFiles} files transferred, phase: ${progress.phase}`);
        },
        useConservativeMode,
        conservativeDelaySeconds
      );

      // Process results
      setProgress(prev => ({
        ...prev,
        phase: result.success ? "complete" : "error",
        current: result.processedRepos,
        total: selectedRepos.length,
        currentFile: result.success ? "✅ Operation completed!" : "❌ Operation completed with errors",
        errors: result.errors,
        processedRepos: result.details.map(detail => 
          `${detail.repository}: ${detail.success ? '✅' : '❌'} ${detail.transferredFiles} files (${detail.method})`
        ),
      }));

      // Add detailed results to debug info
      addDebugInfo(`\n🏁 FINAL RESULTS:`);
      addDebugInfo(`Overall success: ${result.success}`);
      addDebugInfo(`Processed repositories: ${result.processedRepos}/${selectedRepos.length}`);
      addDebugInfo(`Total files transferred: ${result.transferredFiles}`);
      addDebugInfo(`Total time: ${Math.round(result.totalTime / 1000)} seconds`);
      
      if (result.rateLimitInfo) {
        addDebugInfo(`Final rate limit: ${result.rateLimitInfo.remaining}/${result.rateLimitInfo.limit} remaining`);
      }

      result.details.forEach(detail => {
        const status = detail.success ? "✅ SUCCESS" : "❌ FAILED";
        addDebugInfo(`${detail.repository}: ${status} - ${detail.transferredFiles} files transferred (method: ${detail.method})`);
        
        if (detail.errors.length > 0) {
          detail.errors.forEach(error => addDebugInfo(`  ❌ ${error}`));
        }
      });

      // Set final merge results for UI display
      const mergeResults: RepoMergeResult[] = result.details.map(detail => ({
        success: detail.success,
        repoName: detail.repository.split('/')[1], // Extract repo name from owner/repo
        fileCount: detail.transferredFiles + detail.skippedFiles,
        skipped: detail.transferredFiles === 0 && detail.success,
        transferredFiles: detail.transferredFiles,
        failedFiles: detail.skippedFiles,
        error: detail.errors.length > 0 ? detail.errors.join("; ") : undefined,
      }));

      setResults(mergeResults);

      // Reset selections for next operation
      setSelectedSourceRepos(new Set());
      setTargetRepo(null);
      setCustomFolder("");
      setSearchTerm("");
      
      // Trigger refresh of repositories list
      onComplete();

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      addDebugInfo(`❌ CRITICAL ERROR: ${errorMessage}`);
      
      setProgress(prev => ({
        ...prev,
        phase: "error",
        currentFile: "❌ Operation failed",
        errors: [...prev.errors, errorMessage],
      }));
    } finally {
      setIsProcessing(false);
    }
  };

  const getPhaseDescription = () => {
    switch (progress.phase) {
      case "scanning":
        return "🔍 Scanning repositories...";
      case "transferring":
        return "📁 Transferring files...";
      case "deleting":
        return "🗑️ Deleting source repositories...";
      case "complete":
        return "✅ Merge completed!";
      case "error":
        return "❌ Merge failed";
      default:
        return "";
    }
  };

  const resetOperation = () => {
    setIsProcessing(false);
    setResults([]);
    setProgress({
      phase: "scanning",
      current: 0,
      total: 0,
      errors: [],
      processedRepos: [],
      skippedRepos: [],
      debugInfo: [],
    });
  };

  const downloadDebugLog = () => {
    const debugData = {
      timestamp: new Date().toISOString(),
      selectedRepos: selectedRepos.map(r => r.full_name),
      targetRepo: targetRepo?.full_name,
      folderStructure,
      customFolder,
      progress,
      results,
    };
    
    const blob = new Blob([JSON.stringify(debugData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `repository-merger-debug-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-6xl max-h-[90vh] overflow-y-auto">
        <h3 className="font-bold text-lg mb-6">🔀 Merge Multiple Repositories</h3>
        
        {!isProcessing ? (
          <>
            <div className="alert alert-info mb-6">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4 className="font-semibold">Multi-Repository Merge Process</h4>
                <p>Select multiple source repositories to merge into a target repository. Empty repositories will be transferred as blank folders. Source repositories will be deleted after successful transfer.</p>
              </div>
            </div>

            {/* Source Repository Selection */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <label className="label">
                  <span className="label-text font-medium">Source Repositories ({selectedSourceRepos.size} selected)</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Search repositories..."
                    className="input input-bordered input-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <button 
                    className="btn btn-sm btn-outline"
                    onClick={handleSelectAll}
                    disabled={filteredSourceRepos.length === 0}
                  >
                    Select All
                  </button>
                  <button 
                    className="btn btn-sm btn-outline"
                    onClick={handleClearAll}
                    disabled={selectedSourceRepos.size === 0}
                  >
                    Clear All
                  </button>
                </div>
              </div>

              <div className="border rounded-lg p-4 max-h-60 overflow-y-auto bg-base-50">
                {filteredSourceRepos.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">
                    {searchTerm ? "No repositories match your search" : "No repositories available"}
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {filteredSourceRepos.map((repo) => (
                      <label key={repo.id} className="flex items-center space-x-3 p-2 hover:bg-base-100 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          className="checkbox checkbox-primary"
                          checked={selectedSourceRepos.has(repo.id)}
                          onChange={() => handleToggleRepo(repo.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{repo.name}</div>
                          <div className="text-sm text-gray-500 truncate">
                            {repo.full_name} • {repo.private ? "Private" : "Public"}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Target Repository Selection */}
            <div className="mb-6">
              <label className="label">
                <span className="label-text font-medium">Target Repository (destination)</span>
              </label>
              <select
                className="select select-bordered w-full"
                value={targetRepo?.id || ""}
                onChange={(e) => {
                  const repo = availableRepos.find(r => r.id === parseInt(e.target.value));
                  setTargetRepo(repo || null);
                }}
              >
                <option value="">Select target repository...</option>
                {availableRepos
                  .filter(repo => !selectedSourceRepos.has(repo.id))
                  .map((repo) => (
                    <option key={repo.id} value={repo.id}>
                      {repo.full_name} ({repo.private ? "Private" : "Public"})
                    </option>
                  ))}
              </select>
            </div>

            {/* Folder Structure Configuration */}
            <div className="mb-6">
              <label className="label">
                <span className="label-text font-medium">Folder Structure</span>
              </label>
              <div className="form-control">
                <label className="label cursor-pointer">
                  <span className="label-text">Create separate folders for each repository</span>
                  <input
                    type="radio"
                    name="structure"
                    className="radio radio-primary"
                    checked={folderStructure === "separate"}
                    onChange={() => setFolderStructure("separate")}
                  />
                </label>
                <label className="label cursor-pointer">
                  <span className="label-text">Merge all files into a single folder</span>
                  <input
                    type="radio"
                    name="structure"
                    className="radio radio-primary"
                    checked={folderStructure === "flat"}
                    onChange={() => setFolderStructure("flat")}
                  />
                </label>
              </div>

              {folderStructure === "flat" && (
                <div className="mt-4">
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    placeholder="Custom folder name (optional)"
                    value={customFolder}
                    onChange={(e) => setCustomFolder(e.target.value.replace(/[^a-zA-Z0-9-_]/g, ""))}
                  />
                </div>
              )}
            </div>

            {/* Preview */}
            {selectedSourceRepos.size > 0 && targetRepo && (
              <div className="bg-base-200 rounded-lg p-4 mb-6">
                <h4 className="font-semibold mb-2">Merge Preview:</h4>
                <div className="space-y-2 text-sm">
                  <div>📤 <strong>Source:</strong> {selectedSourceRepos.size} repositories → Will be deleted</div>
                  <div>📥 <strong>Target:</strong> {targetRepo.full_name}</div>
                  <div>📁 <strong>Structure:</strong> {folderStructure === "separate" ? "Separate folders" : "Single folder"}</div>
                  <div className="mt-2">
                    <strong>Selected repositories:</strong>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedRepos.slice(0, 5).map(repo => (
                        <span key={repo.id} className="badge badge-outline badge-sm">{repo.name}</span>
                      ))}
                      {selectedRepos.length > 5 && (
                        <span className="badge badge-outline badge-sm">+{selectedRepos.length - 5} more</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="alert alert-warning mb-6">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-1.01-4.01h0M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4 className="font-semibold">⚠️ This action cannot be undone!</h4>
                <p>All selected source repositories will be permanently deleted after the merge. Empty repositories will be transferred as blank folders.</p>
              </div>
            </div>

            {/* Rate Limiting Controls */}
            <div className="space-y-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="useConservativeMode"
                  checked={useConservativeMode}
                  onChange={(e) => setUseConservativeMode(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="useConservativeMode" className="text-sm font-medium text-yellow-800">
                  🐌 Use Conservative Mode (Recommended for Rate Limiting)
                </label>
              </div>
              
              {useConservativeMode && (
                <div className="ml-6 space-y-3">
                  <div>
                    <label htmlFor="conservativeDelay" className="block text-sm font-medium text-yellow-700 mb-1">
                      Delay Between Repositories (seconds):
                    </label>
                    <input
                      type="number"
                      id="conservativeDelay"
                      min="10"
                      max="300"
                      step="5"
                      value={conservativeDelaySeconds}
                      onChange={(e) => setConservativeDelaySeconds(Number(e.target.value))}
                      className="w-20 px-2 py-1 border border-yellow-300 rounded text-sm"
                    />
                    <span className="text-xs text-yellow-600 ml-2">
                      ({Math.ceil(conservativeDelaySeconds * repositories.length / 60)} min total wait time)
                    </span>
                  </div>
                  
                  <div className="text-xs text-yellow-700 space-y-1">
                    <p><strong>🔹 Conservative Mode Benefits:</strong></p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Dramatically reduces GitHub API calls</li>
                      <li>Only scans root directory files to minimize requests</li>
                      <li>Adds aggressive delays between operations</li>
                      <li>Includes automatic retry with exponential backoff</li>
                      <li>Safer for accounts approaching rate limits</li>
                    </ul>
                    <p className="mt-2"><strong>⚠️ Trade-offs:</strong> Slower operation, only transfers root files</p>
                  </div>
                </div>
              )}
              
              {!useConservativeMode && (
                <div className="text-xs text-yellow-700">
                  <p><strong>🚀 Optimized Mode:</strong> Faster, transfers all files, but uses more API calls. Switch to Conservative Mode if you encounter rate limiting.</p>
                </div>
              )}
            </div>

            <div className="modal-action">
              <button className="btn btn-ghost" onClick={onClose}>
                Cancel
              </button>
              <button
                className="btn btn-error"
                onClick={executeTransfer}
                disabled={selectedSourceRepos.size === 0 || !targetRepo}
              >
                🔀 Merge {selectedSourceRepos.size} Repositories
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="mb-6">
              <h4 className="font-semibold mb-4">{getPhaseDescription()}</h4>
              
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span>{progress.currentFile}</span>
                  {progress.total > 0 && (
                    <span>{progress.current} / {progress.total}</span>
                  )}
                </div>
                <progress 
                  className="progress progress-primary w-full" 
                  value={progress.total > 0 ? progress.current : 0} 
                  max={progress.total > 0 ? progress.total : 100}
                ></progress>
                {progress.currentRepo && (
                  <div className="text-xs text-gray-500 mt-1">
                    Current repository: {progress.currentRepo}
                  </div>
                )}
              </div>

              {progress.processedRepos.length > 0 && (
                <div className="mb-4">
                  <h5 className="font-medium text-sm mb-2">Processed Repositories:</h5>
                  <div className="flex flex-wrap gap-1">
                    {progress.processedRepos.map((repo, index) => (
                      <span key={index} className="badge badge-success badge-sm">{repo}</span>
                    ))}
                  </div>
                </div>
              )}

              {progress.skippedRepos.length > 0 && (
                <div className="mb-4">
                  <h5 className="font-medium text-sm mb-2">Skipped Repositories:</h5>
                  <div className="flex flex-wrap gap-1">
                    {progress.skippedRepos.map((repo, index) => (
                      <span key={index} className="badge badge-warning badge-sm">{repo}</span>
                    ))}
                  </div>
                </div>
              )}

              {progress.errors.length > 0 && (
                <div className="alert alert-error mb-4">
                  <h5 className="font-semibold">Errors encountered:</h5>
                  <div className="max-h-32 overflow-y-auto">
                    <ul className="list-disc list-inside text-sm">
                      {progress.errors.slice(-10).map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                    {progress.errors.length > 10 && (
                      <p className="text-xs">... and {progress.errors.length - 10} more errors</p>
                    )}
                  </div>
                </div>
              )}

              {/* Debug Information Toggle */}
              {progress.debugInfo.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-sm">Debug Information:</h5>
                    <div className="flex gap-2">
                      <button 
                        className="btn btn-xs btn-outline"
                        onClick={() => setShowDebugInfo(!showDebugInfo)}
                      >
                        {showDebugInfo ? "Hide" : "Show"} Debug Info
                      </button>
                      <button 
                        className="btn btn-xs btn-outline"
                        onClick={downloadDebugLog}
                      >
                        Download Log
                      </button>
                    </div>
                  </div>
                  
                  {showDebugInfo && (
                    <div className="bg-gray-100 rounded p-3 max-h-40 overflow-y-auto text-xs font-mono">
                      {progress.debugInfo.slice(-20).map((info, index) => (
                        <div key={index} className="mb-1">{info}</div>
                      ))}
                      {progress.debugInfo.length > 20 && (
                        <div className="text-gray-500">... and {progress.debugInfo.length - 20} more entries</div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* Results Summary */}
        {(progress.phase === "complete" || progress.phase === "error") && results.length > 0 && (
          <div className="mb-6">
            <h4 className="font-semibold mb-4">Operation Summary</h4>
            <div className="space-y-2">
              {results.map((result, index) => (
                <div key={index} className={`alert ${result.success ? 'alert-success' : 'alert-error'} py-2`}>
                  <div className="flex justify-between items-center w-full">
                    <div>
                      <span className="font-medium">{result.repoName}</span>
                      {result.skipped ? (
                        <span className="text-sm ml-2">(empty repository - transferred as blank folder)</span>
                      ) : (
                        <span className="text-sm ml-2">
                          ({result.transferredFiles}/{result.fileCount} files transferred)
                        </span>
                      )}
                    </div>
                    <div>
                      {result.success ? "✅ Success" : `❌ ${result.error}`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action buttons for completed/error states */}
        {(progress.phase === "complete" || progress.phase === "error") && (
          <div className="modal-action">
            {progress.phase === "error" && (
              <button className="btn btn-outline" onClick={resetOperation}>
                Try Again
              </button>
            )}
            <button className="btn btn-outline" onClick={downloadDebugLog}>
              Download Debug Log
            </button>
            <button className="btn btn-primary" onClick={onClose}>
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 
