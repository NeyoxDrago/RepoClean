import { useState, useEffect } from "react";

interface TourStep {
  id: string;
  title: string;
  description: string;
  target: string;
  position: "top" | "bottom" | "left" | "right";
}

interface TourProps {
  isOpen: boolean;
  onClose: () => void;
}

const tourSteps: TourStep[] = [
  {
    id: "search",
    title: "Search Your Repositories",
    description: "Use the search bar to quickly find repositories by name or description. Hit Enter or use the search icon to search.",
    target: "search-input",
    position: "bottom"
  },
  {
    id: "filters",
    title: "Filter & Settings",
    description: "Use filters to narrow down your repositories by type, visibility, or other criteria. Access settings for customization.",
    target: "filter-button",
    position: "bottom"
  },
  {
    id: "stats",
    title: "Repository Statistics",
    description: "Monitor your repository statistics at a glance - total repositories, private repos, archived ones, and currently selected.",
    target: "stats-section",
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
    description: "Click checkboxes to select individual repositories or use the master checkbox to select all. Selected repositories will show up in the statistics.",
    target: "repo-list",
    position: "top"
  },
  {
    id: "batch-operations",
    title: "Batch Operations",
    description: "When you select repositories, powerful batch operations will appear here. You can archive, delete, change visibility, or merge multiple repositories at once.",
    target: "batch-operations",
    position: "top"
  },
  {
    id: "merge-repos",
    title: "Merge Repositories",
    description: "Use the merge functionality to combine multiple repositories. This is perfect for consolidating similar projects or combining forks.",
    target: "merge-button",
    position: "bottom"
  }
];

export default function Tour({ isOpen, onClose }: TourProps) {
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

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

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
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-60 z-40" onClick={handleSkip} />
      
      {/* Highlight */}
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

      {/* Tooltip */}
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
        {/* Progress */}
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

        {/* Content */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {currentTourStep.title}
          </h3>
          <p className="text-gray-600 text-sm leading-relaxed">
            {currentTourStep.description}
          </p>
        </div>

        {/* Navigation */}
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

        {/* Arrow */}
        <div
          className={`absolute w-3 h-3 bg-white border transform rotate-45 ${
            currentTourStep.position === "top" ? "bottom-0 border-b-0 border-r-0 translate-y-1/2" :
            currentTourStep.position === "bottom" ? "top-0 border-t-0 border-l-0 -translate-y-1/2" :
            currentTourStep.position === "left" ? "right-0 border-r-0 border-b-0 translate-x-1/2" :
            "left-0 border-l-0 border-t-0 -translate-x-1/2"
          }`}
          style={{
            left: currentTourStep.position === "top" || currentTourStep.position === "bottom" ? "50%" : undefined,
            top: currentTourStep.position === "left" || currentTourStep.position === "right" ? "50%" : undefined,
            marginLeft: currentTourStep.position === "top" || currentTourStep.position === "bottom" ? "-6px" : undefined,
            marginTop: currentTourStep.position === "left" || currentTourStep.position === "right" ? "-6px" : undefined,
          }}
        />
      </div>
    </>
  );
} 