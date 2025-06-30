import { Repository } from "@/services/repository-service";

interface RepositoryCardProps {
  repository: Repository;
  selected: boolean;
  onSelect: (selected: boolean) => void;
}

export default function RepositoryCard({ repository, selected, onSelect }: RepositoryCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatSize = (size: number) => {
    if (size < 1024) return `${size} KB`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} MB`;
    return `${(size / (1024 * 1024)).toFixed(1)} GB`;
  };

  const getVisibilityIcon = () => {
    if (repository.private) {
      return (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
        </svg>
      );
    }
    return (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
      </svg>
    );
  };

  return (
    <div className={`card bg-base-100 shadow-sm border ${selected ? 'border-primary' : 'border-base-300'} hover:shadow-md transition-all duration-200`}>
      <div className="card-body p-4">
        <div className="flex items-start gap-3">
          {/* Selection Checkbox */}
          <label className="cursor-pointer mt-1">
            <input
              type="checkbox"
              className="checkbox checkbox-sm"
              checked={selected}
              onChange={(e) => onSelect(e.target.checked)}
            />
          </label>

          {/* Repository Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-lg truncate">
                <a 
                  href={`/repositories/${repository.owner.login}/${repository.name}`}
                  className="link link-hover"
                >
                  {repository.full_name}
                </a>
              </h3>
              
              <div className="flex items-center gap-1">
                {getVisibilityIcon()}
                <span className="text-xs text-base-content/60 capitalize">
                  {repository.private ? 'Private' : 'Public'}
                </span>
              </div>

              {repository.archived && (
                <div className="badge badge-warning badge-sm">Archived</div>
              )}
            </div>

            {repository.description && (
              <p className="text-sm text-base-content/70 mb-3 line-clamp-2">
                {repository.description}
              </p>
            )}

            {/* Repository Stats */}
            <div className="flex items-center gap-4 text-sm text-base-content/60 mb-3">
              {repository.language && (
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-primary"></div>
                  <span>{repository.language}</span>
                </div>
              )}
              
              {repository.stargazers_count > 0 && (
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                  <span>{repository.stargazers_count}</span>
                </div>
              )}

              {repository.forks_count > 0 && (
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 2a2 2 0 012 2v6.98l2 2V14a2 2 0 012 2v6a2 2 0 11-4 0v-6l-2-2zm8 0a2 2 0 012 2v6.98l-2 2V14a2 2 0 00-2-2H8.83l2.58-2.58c.78-.78.78-2.05 0-2.83-.78-.78-2.05-.78-2.83 0l-5.66 5.66c-.78.78-.78 2.05 0 2.83l5.66 5.66c.78.78 2.05.78 2.83 0 .78-.78.78-2.05 0-2.83L8.83 16H12v6a2 2 0 004 0v-6V4a2 2 0 00-2-2z"/>
                  </svg>
                  <span>{repository.forks_count}</span>
                </div>
              )}

              <div className="flex items-center gap-1">
                <span>Size: {formatSize(repository.size)}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center text-xs text-base-content/50">
              <span>Updated {formatDate(repository.updated_at)}</span>
              <span>Created {formatDate(repository.created_at)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="dropdown dropdown-end">
            <label tabIndex={0} className="btn btn-ghost btn-sm btn-circle">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
              </svg>
            </label>
            <ul tabIndex={0} className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52">
              <li>
                <a href={repository.html_url} target="_blank" rel="noopener noreferrer">
                  View on GitHub
                </a>
              </li>
              <li>
                <button>Edit Repository</button>
              </li>
              <li>
                <button className={repository.archived ? "text-success" : "text-warning"}>
                  {repository.archived ? "Unarchive" : "Archive"}
                </button>
              </li>
              {repository.permissions?.admin && (
                <li>
                  <button className="text-error">Delete Repository</button>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 