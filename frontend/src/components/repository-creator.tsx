import { useState } from "react";
import { repositoryService, CreateRepositoryRequest } from "@/services/repository-service";

interface RepositoryCreatorProps {
  onComplete: () => void;
  onClose: () => void;
}

export default function RepositoryCreator({ onComplete, onClose }: RepositoryCreatorProps) {
  const [formData, setFormData] = useState<CreateRepositoryRequest>({
    name: "",
    description: "",
    homepage: "",
    private: false,
    visibility: "public",
    has_issues: true,
    has_projects: true,
    has_wiki: true,
    auto_init: true,
    gitignore_template: "",
    license_template: "",
  });
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);

  const validateRepoName = (name: string) => {
    if (!name) {
      setNameError("Repository name is required");
      return false;
    }
    if (name.length < 1 || name.length > 100) {
      setNameError("Repository name must be between 1 and 100 characters");
      return false;
    }
    if (!/^[a-zA-Z0-9._-]+$/.test(name)) {
      setNameError("Repository name can only contain letters, numbers, dots, hyphens, and underscores");
      return false;
    }
    if (name.startsWith(".") || name.endsWith(".")) {
      setNameError("Repository name cannot start or end with a period");
      return false;
    }
    setNameError(null);
    return true;
  };

  const handleInputChange = (field: keyof CreateRepositoryRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (field === "name") {
      validateRepoName(value);
    }
  };

  const handleCreate = async () => {
    if (!validateRepoName(formData.name)) return;

    setIsCreating(true);
    setError(null);

    try {
      // Clean up the form data - remove empty optional fields
      const cleanedData: CreateRepositoryRequest = {
        name: formData.name,
        private: formData.private,
        visibility: formData.visibility,
        has_issues: formData.has_issues,
        has_projects: formData.has_projects,
        has_wiki: formData.has_wiki,
        auto_init: formData.auto_init,
      };

      // Only add optional fields if they have values
      if (formData.description && formData.description.trim()) {
        cleanedData.description = formData.description.trim();
      }
      if (formData.homepage && formData.homepage.trim()) {
        cleanedData.homepage = formData.homepage.trim();
      }
      if (formData.gitignore_template && formData.gitignore_template.trim()) {
        cleanedData.gitignore_template = formData.gitignore_template.trim();
      }
      if (formData.license_template && formData.license_template.trim()) {
        cleanedData.license_template = formData.license_template.trim();
      }

      await repositoryService.createRepository(cleanedData);
      onComplete();
      onClose();
    } catch (err) {
      console.error("Failed to create repository:", err);
      setError(err instanceof Error ? err.message : "Failed to create repository");
    } finally {
      setIsCreating(false);
    }
  };

  const gitignoreTemplates = [
    "", "Node", "Python", "Java", "C++", "C", "C#", "Go", "Rust", "PHP", "Ruby", "Swift", "Kotlin", "Scala", "R", "Julia", "Dart", "TypeScript", "React", "Vue", "Angular", "Svelte", "Next.js", "Nuxt.js", "Django", "Flask", "Rails", "Laravel", "Spring", "Android", "iOS", "Unity", "Unreal", "Godot", "Visual Studio", "Xcode", "IntelliJ", "Eclipse", "VSCode", "Sublime", "Vim", "Emacs", "macOS", "Windows", "Linux", "Docker", "Terraform", "Ansible", "Vagrant", "Jekyll", "Hugo", "Gatsby", "Eleventy"
  ];

  const licenseTemplates = [
    { value: "", label: "No license" },
    { value: "mit", label: "MIT License" },
    { value: "apache-2.0", label: "Apache License 2.0" },
    { value: "gpl-3.0", label: "GNU General Public License v3.0" },
    { value: "bsd-2-clause", label: "BSD 2-Clause \"Simplified\" License" },
    { value: "bsd-3-clause", label: "BSD 3-Clause \"New\" or \"Revised\" License" },
    { value: "isc", label: "ISC License" },
    { value: "lgpl-3.0", label: "GNU Lesser General Public License v3.0" },
    { value: "mpl-2.0", label: "Mozilla Public License 2.0" },
    { value: "unlicense", label: "The Unlicense" },
  ];

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="font-bold text-lg mb-6">📁 Create New Repository</h3>

        {error && (
          <div className="alert alert-error mb-6">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label className="label">
              <span className="label-text font-medium">Repository name *</span>
            </label>
            <input
              type="text"
              className={`input input-bordered w-full ${nameError ? 'input-error' : ''}`}
              placeholder="my-awesome-project"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
            />
            {nameError && (
              <div className="label">
                <span className="label-text-alt text-error">{nameError}</span>
              </div>
            )}
          </div>

          <div>
            <label className="label">
              <span className="label-text font-medium">Description (optional)</span>
            </label>
            <textarea
              className="textarea textarea-bordered w-full"
              placeholder="A short description of your repository"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              rows={3}
            />
          </div>

          <div>
            <label className="label">
              <span className="label-text font-medium">Homepage (optional)</span>
            </label>
            <input
              type="url"
              className="input input-bordered w-full"
              placeholder="https://example.com"
              value={formData.homepage}
              onChange={(e) => handleInputChange("homepage", e.target.value)}
            />
          </div>

          <div>
            <label className="label">
              <span className="label-text font-medium">Visibility</span>
            </label>
            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  className="radio radio-primary mt-1"
                  name="visibility"
                  checked={!formData.private}
                  onChange={() => {
                    handleInputChange("private", false);
                    handleInputChange("visibility", "public");
                  }}
                />
                <div>
                  <div className="font-semibold">🌍 Public</div>
                  <div className="text-sm text-base-content/70">Anyone on the internet can see this repository</div>
                </div>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  className="radio radio-primary mt-1"
                  name="visibility"
                  checked={formData.private}
                  onChange={() => {
                    handleInputChange("private", true);
                    handleInputChange("visibility", "private");
                  }}
                />
                <div>
                  <div className="font-semibold">🔒 Private</div>
                  <div className="text-sm text-base-content/70">Only you can see this repository</div>
                </div>
              </label>
            </div>
          </div>

          <div>
            <label className="label">
              <span className="label-text font-medium">Initialize this repository with:</span>
            </label>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="checkbox checkbox-primary"
                  checked={formData.auto_init}
                  onChange={(e) => handleInputChange("auto_init", e.target.checked)}
                />
                <span>Add a README file</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="checkbox checkbox-primary"
                  checked={formData.has_issues}
                  onChange={(e) => handleInputChange("has_issues", e.target.checked)}
                />
                <span>Issues - Track bugs and feature requests</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="checkbox checkbox-primary"
                  checked={formData.has_projects}
                  onChange={(e) => handleInputChange("has_projects", e.target.checked)}
                />
                <span>Projects - Organize and track work</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="checkbox checkbox-primary"
                  checked={formData.has_wiki}
                  onChange={(e) => handleInputChange("has_wiki", e.target.checked)}
                />
                <span>Wiki - Create documentation</span>
              </label>
            </div>
          </div>

          <div>
            <label className="label">
              <span className="label-text font-medium">.gitignore template</span>
            </label>
            <select
              className="select select-bordered w-full"
              value={formData.gitignore_template}
              onChange={(e) => handleInputChange("gitignore_template", e.target.value)}
            >
              <option value="">None</option>
              {gitignoreTemplates.filter(Boolean).map(template => (
                <option key={template} value={template}>
                  {template}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">
              <span className="label-text font-medium">License</span>
            </label>
            <select
              className="select select-bordered w-full"
              value={formData.license_template}
              onChange={(e) => handleInputChange("license_template", e.target.value)}
            >
              {licenseTemplates.map(license => (
                <option key={license.value} value={license.value}>
                  {license.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="modal-action">
          <button className="btn btn-ghost" onClick={onClose} disabled={isCreating}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleCreate}
            disabled={isCreating || !formData.name || !!nameError}
          >
            {isCreating ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                Creating...
              </>
            ) : (
              "📁 Create Repository"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
