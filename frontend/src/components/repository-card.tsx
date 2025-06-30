import { Repository } from "@/services/repository-service";

interface RepositoryCardProps {
  repository: Repository;
  selected: boolean;
  onSelect: (selected: boolean) => void;
}

export default function RepositoryCard({ repository, selected, onSelect }: RepositoryCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getLanguageColor = (language: string | null) => {
    const colors: { [key: string]: string } = {
      JavaScript: '#f1e05a',
      TypeScript: '#2b7489',
      Python: '#3572A5',
      Java: '#b07219',
      'C++': '#f34b7d',
      C: '#555555',
      HTML: '#e34c26',
      CSS: '#563d7c',
      PHP: '#4F5D95',
      Ruby: '#701516',
      Go: '#00ADD8',
      Rust: '#dea584',
      Swift: '#fa7343',
      Kotlin: '#F18E33'
    };
    return colors[language || ''] || '#8b5cf6';
  };

  return (
    <div className={`p-4 hover:bg-gray-50 transition-colors ${selected ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}>
      <div className="flex items-start space-x-3">
        {/* Selection Checkbox */}
        <div className="flex items-center mt-1">
          <input
            type="checkbox"
            checked={selected}
            onChange={(e) => onSelect(e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
        </div>

        {/* Repository Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-3 mb-2">
            {/* Repository Name */}
            <h3 className="text-lg font-semibold text-blue-600 hover:text-blue-800 transition-colors">
              <a href={`/repositories/${repository.owner.login}/${repository.name}`}>
                {repository.name}
              </a>
            </h3>

            {/* Visibility Badge */}
            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              repository.private 
                ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' 
                : 'bg-green-100 text-green-800 border border-green-200'
            }`}>
              {repository.private ? (
                <>
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  Private
                </>
              ) : (
                <>
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 3.314-2.686 6-6 6s-6-2.686-6-6a4.75 4.75 0 01.332-1.973z" clipRule="evenodd" />
                  </svg>
                  Public
                </>
              )}
            </div>

            {/* Language Tag */}
            {repository.language && (
              <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                <div 
                  className="w-2 h-2 rounded-full mr-1"
                  style={{ backgroundColor: getLanguageColor(repository.language) }}
                ></div>
                {repository.language}
              </div>
            )}

            {/* Archived Badge */}
            {repository.archived && (
              <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                Archived
              </div>
            )}
          </div>

          {/* Description */}
          {repository.description && (
            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
              {repository.description}
            </p>
          )}

          {/* Repository Stats */}
          <div className="flex items-center space-x-6 text-sm text-gray-500">
            {repository.stargazers_count > 0 && (
              <div className="flex items-center space-x-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span>{repository.stargazers_count}</span>
              </div>
            )}

            {repository.forks_count > 0 && (
              <div className="flex items-center space-x-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414L2.586 7a2 2 0 010-2.828l3.707-3.707a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>{repository.forks_count}</span>
              </div>
            )}

            <span>Updated {formatDate(repository.updated_at)}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => window.open(repository.html_url, '_blank')}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            title="View on GitHub"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.25 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h5a.75.75 0 010 1.5h-5z" clipRule="evenodd" />
              <path fillRule="evenodd" d="M6.194 12.753a.75.75 0 001.06.053L16.5 4.44v2.81a.75.75 0 001.5 0v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 000 1.5h2.553l-9.056 8.194a.75.75 0 00-.053 1.06z" clipRule="evenodd" />
            </svg>
          </button>

          <button
            onClick={() => navigator.clipboard.writeText(repository.clone_url)}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            title="Copy clone URL"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2M8 12h8m0 0a2 2 0 012 2v6a2 2 0 01-2 2H10a2 2 0 01-2-2v-6a2 2 0 012-2z" />
            </svg>
          </button>

          <button
            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
            title="Delete repository"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>

          {/* More Options Dropdown */}
          <div className="relative">
            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 