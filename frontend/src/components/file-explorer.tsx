import { useState, useEffect } from "react";
import { repositoryService } from "@/services/repository-service";

interface FileItem {
  type: "file" | "dir";
  name: string;
  path: string;
  size: number;
  sha: string;
  download_url?: string;
  html_url: string;
}

interface FileExplorerProps {
  owner: string;
  repo: string;
  initialPath?: string;
  onFileSelect?: (file: FileItem) => void;
}

export default function FileExplorer({ owner, repo, initialPath = "", onFileSelect }: FileExplorerProps) {
  const [currentPath, setCurrentPath] = useState(initialPath);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createFileData, setCreateFileData] = useState({
    name: "",
    content: "",
    message: "Create new file",
  });

  useEffect(() => {
    loadFiles(currentPath);
  }, [currentPath, owner, repo]);

  const loadFiles = async (path: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await repositoryService.getFileContent(owner, repo, path || "");
      
      if (Array.isArray(result)) {
        setFiles(result);
      } else if (result.type === "dir") {
        // Handle single directory
        setFiles([result] as any);
      } else {
        // Handle single file
        setFiles([result] as any);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load files");
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileClick = async (file: FileItem) => {
    if (file.type === "dir") {
      setCurrentPath(file.path);
      setSelectedFile(null);
      setFileContent(null);
    } else {
      setSelectedFile(file);
      onFileSelect?.(file);
      
      // Load file content
      try {
        const content = await repositoryService.getFileContent(owner, repo, file.path);
        if (content.content && content.encoding === "base64") {
          setFileContent(atob(content.content));
        }
      } catch (err) {
        console.error("Failed to load file content:", err);
      }
    }
  };

  const navigateUp = () => {
    const pathParts = currentPath.split("/").filter(Boolean);
    pathParts.pop();
    setCurrentPath(pathParts.join("/"));
  };

  const getBreadcrumbs = () => {
    if (!currentPath) return [{ name: "root", path: "" }];
    
    const parts = currentPath.split("/").filter(Boolean);
    const breadcrumbs = [{ name: "root", path: "" }];
    
    for (let i = 0; i < parts.length; i++) {
      breadcrumbs.push({
        name: parts[i],
        path: parts.slice(0, i + 1).join("/"),
      });
    }
    
    return breadcrumbs;
  };

  const getFileIcon = (file: FileItem) => {
    if (file.type === "dir") {
      return "📁";
    }
    
    const ext = file.name.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "js":
      case "jsx":
      case "ts":
      case "tsx":
        return "⚡";
      case "md":
        return "📝";
      case "json":
        return "📋";
      case "css":
        return "🎨";
      case "html":
        return "🌐";
      case "py":
        return "🐍";
      case "java":
        return "☕";
      case "php":
        return "🐘";
      case "rb":
        return "💎";
      case "go":
        return "🐹";
      case "rs":
        return "🦀";
      case "c":
      case "cpp":
        return "⚙️";
      case "sh":
        return "🐚";
      case "yml":
      case "yaml":
        return "📊";
      case "docker":
        return "🐳";
      case "git":
        return "📚";
      default:
        return "📄";
    }
  };

  const formatFileSize = (size: number) => {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleCreateFile = async () => {
    if (!createFileData.name.trim()) return;

    try {
      const filePath = currentPath ? `${currentPath}/${createFileData.name}` : createFileData.name;
      await repositoryService.createOrUpdateFile(owner, repo, filePath, {
        message: createFileData.message,
        content: btoa(createFileData.content), // Base64 encode
      });
      
      setShowCreateModal(false);
      setCreateFileData({ name: "", content: "", message: "Create new file" });
      loadFiles(currentPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create file");
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-base-200 border-b">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">{owner}/{repo}</h3>
          <div className="text-sm text-base-content/60">
            {files.length} items
          </div>
        </div>
        
        <button
          className="btn btn-primary btn-sm"
          onClick={() => setShowCreateModal(true)}
        >
          + New File
        </button>
      </div>

      {/* Breadcrumbs */}
      <div className="px-4 py-2 bg-base-100 border-b">
        <div className="breadcrumbs text-sm">
          <ul>
            {getBreadcrumbs().map((crumb, index) => (
              <li key={index}>
                <button
                  className="link link-hover"
                  onClick={() => setCurrentPath(crumb.path)}
                >
                  {crumb.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* File List */}
        <div className="flex-1 border-r">
          {loading && (
            <div className="flex justify-center py-8">
              <div className="loading loading-spinner loading-md"></div>
            </div>
          )}

          {error && (
            <div className="alert alert-error m-4">
              <span>{error}</span>
              <button className="btn btn-sm btn-ghost" onClick={() => loadFiles(currentPath)}>
                Retry
              </button>
            </div>
          )}

          {!loading && !error && (
            <div className="overflow-y-auto">
              {currentPath && (
                <button
                  className="w-full px-4 py-2 text-left hover:bg-base-200 flex items-center gap-2"
                  onClick={navigateUp}
                >
                  <span>⬆️</span>
                  <span>..</span>
                </button>
              )}
              
              {files.map((file, index) => (
                <button
                  key={index}
                  className={`w-full px-4 py-2 text-left hover:bg-base-200 border-b border-base-300 flex items-center gap-3 ${
                    selectedFile?.path === file.path ? "bg-primary/10" : ""
                  }`}
                  onClick={() => handleFileClick(file)}
                >
                  <span className="text-lg">{getFileIcon(file)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{file.name}</div>
                    {file.type === "file" && (
                      <div className="text-xs text-base-content/60">
                        {formatFileSize(file.size)}
                      </div>
                    )}
                  </div>
                  {file.type === "dir" && (
                    <span className="text-base-content/60">→</span>
                  )}
                </button>
              ))}

              {files.length === 0 && !loading && !error && (
                <div className="text-center py-8 text-base-content/60">
                  No files found
                </div>
              )}
            </div>
          )}
        </div>

        {/* File Content Viewer */}
        {selectedFile && (
          <div className="w-1/2 flex flex-col">
            <div className="p-4 bg-base-200 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">{selectedFile.name}</h4>
                  <div className="text-sm text-base-content/60">
                    {formatFileSize(selectedFile.size)} • {selectedFile.sha.substring(0, 7)}
                  </div>
                </div>
                <div className="flex gap-2">
                  <a
                    href={selectedFile.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-sm btn-outline"
                  >
                    View on GitHub
                  </a>
                  {selectedFile.download_url && (
                    <a
                      href={selectedFile.download_url}
                      download
                      className="btn btn-sm btn-primary"
                    >
                      Download
                    </a>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex-1 p-4 overflow-auto">
              {fileContent ? (
                <pre className="text-sm bg-base-200 p-4 rounded overflow-auto whitespace-pre-wrap">
                  {fileContent}
                </pre>
              ) : (
                <div className="flex justify-center py-8">
                  <div className="loading loading-spinner loading-sm"></div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Create File Modal */}
      {showCreateModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Create New File</h3>
            
            <div className="space-y-4">
              <div>
                <label className="label">
                  <span className="label-text">File name</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  placeholder="e.g., README.md"
                  value={createFileData.name}
                  onChange={(e) => setCreateFileData(prev => ({ ...prev, name: e.target.value }))}
                />
                {currentPath && (
                  <div className="label">
                    <span className="label-text-alt">Path: {currentPath}/{createFileData.name}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="label">
                  <span className="label-text">Commit message</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  value={createFileData.message}
                  onChange={(e) => setCreateFileData(prev => ({ ...prev, message: e.target.value }))}
                />
              </div>

              <div>
                <label className="label">
                  <span className="label-text">File content</span>
                </label>
                <textarea
                  className="textarea textarea-bordered w-full h-40"
                  placeholder="Enter file content..."
                  value={createFileData.content}
                  onChange={(e) => setCreateFileData(prev => ({ ...prev, content: e.target.value }))}
                />
              </div>
            </div>

            <div className="modal-action">
              <button 
                className="btn btn-ghost" 
                onClick={() => {
                  setShowCreateModal(false);
                  setCreateFileData({ name: "", content: "", message: "Create new file" });
                }}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleCreateFile}
                disabled={!createFileData.name.trim()}
              >
                Create File
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 