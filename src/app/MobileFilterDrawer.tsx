
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import "./MobileFilterDrawer.css";

export interface Filters {
  category: string;
  experience: string;
  availability: string;
  rating: string;
}

interface Props {
  initialFilters?: Filters;
  onApply: (filters: Filters) => void;
}

const DEFAULT_FILTERS: Filters = {
  category: "",
  experience: "",
  availability: "",
  rating: "",
};

export default function MobileFilterDrawer({
  initialFilters = DEFAULT_FILTERS,
  onApply,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [draftFilters, setDraftFilters] =
    useState<Filters>(initialFilters);

  const drawerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const openDrawer = useCallback(() => {
    previousFocusRef.current =
      document.activeElement as HTMLElement;

    setDraftFilters(filters);
    setIsOpen(true);
  }, [filters]);

  const closeDrawer = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Focus management and keyboard handling
  useEffect(() => {
    if (!isOpen) return;

    const drawer = drawerRef.current;
    if (!drawer) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const getFocusableElements = () =>
      Array.from(
        drawer.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter((element) => element.getAttribute("aria-hidden") !== "true");

    getFocusableElements()[0]?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeDrawer();
      }

      if (event.key === "Tab") {
        const elements = getFocusableElements();

        if (elements.length === 0) {
          event.preventDefault();
          drawer.focus();
          return;
        }

        const first = elements[0];
        const last = elements[elements.length - 1];

        if (
          event.shiftKey &&
          document.activeElement === first
        ) {
          event.preventDefault();
          last.focus();
        } else if (
          !event.shiftKey &&
          document.activeElement === last
        ) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);

      const target =
        previousFocusRef.current ?? triggerRef.current;

      if (target?.isConnected) {
        target.focus();
      }
    };
  }, [isOpen, closeDrawer]);

  const updateFilter = (
    key: keyof Filters,
    value: string
  ) => {
    setDraftFilters((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const applyFilters = () => {
    setFilters(draftFilters);
    onApply(draftFilters);
    closeDrawer();
  };

  const clearFilters = () => {
    setDraftFilters(DEFAULT_FILTERS);
  };

  const handleBackdropClick = (
    event: React.MouseEvent<HTMLDivElement>
  ) => {
    if (event.target === event.currentTarget) {
      closeDrawer();
    }
  };

  return (
    <>
      <button
        ref={triggerRef}
        className="filter-open-button"
        onClick={openDrawer}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <span aria-hidden="true">☰</span>
        Filters
      </button>

      {isOpen && (
        <div
          className="filter-backdrop"
          onMouseDown={handleBackdropClick}
        >
          <div
            ref={drawerRef}
            className="filter-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="filter-title"
            tabIndex={-1}
          >
            <header className="filter-header">
              <h2 id="filter-title">Filters</h2>

              <button
                type="button"
                className="filter-close-button"
                onClick={closeDrawer}
                aria-label="Close filters"
              >
                ✕
              </button>
            </header>

            <div className="filter-content">
              <div className="filter-group">
                <label htmlFor="category">
                  Mentor Category
                </label>

                <select
                  id="category"
                  value={draftFilters.category}
                  onChange={(e) =>
                    updateFilter("category", e.target.value)
                  }
                >
                  <option value="">All Categories</option>
                  <option value="technology">Technology</option>
                  <option value="business">Business</option>
                  <option value="design">Design</option>
                  <option value="marketing">Marketing</option>
                </select>
              </div>

              <div className="filter-group">
                <label htmlFor="experience">
                  Experience Level
                </label>

                <select
                  id="experience"
                  value={draftFilters.experience}
                  onChange={(e) =>
                    updateFilter("experience", e.target.value)
                  }
                >
                  <option value="">Any Experience</option>
                  <option value="junior">1–3 Years</option>
                  <option value="mid">3–5 Years</option>
                  <option value="senior">5–10 Years</option>
                  <option value="expert">10+ Years</option>
                </select>
              </div>

              <div className="filter-group">
                <label htmlFor="availability">
                  Availability
                </label>

                <select
                  id="availability"
                  value={draftFilters.availability}
                  onChange={(e) =>
                    updateFilter("availability", e.target.value)
                  }
                >
                  <option value="">Any Availability</option>
                  <option value="available">Available Now</option>
                  <option value="weekends">Weekends</option>
                  <option value="weekdays">Weekdays</option>
                </select>
              </div>

              <div className="filter-group">
                <label htmlFor="rating">
                  Minimum Rating
                </label>

                <select
                  id="rating"
                  value={draftFilters.rating}
                  onChange={(e) =>
                    updateFilter("rating", e.target.value)
                  }
                >
                  <option value="">Any Rating</option>
                  <option value="3">3+ Stars</option>
                  <option value="4">4+ Stars</option>
                  <option value="4.5">4.5+ Stars</option>
                </select>
              </div>
            </div>

            <footer className="filter-footer">
              <button
                type="button"
                className="clear-filter-button"
                onClick={clearFilters}
              >
                Clear All
              </button>

              <button
                type="button"
                className="apply-filter-button"
                onClick={applyFilters}
              >
                Apply Filters
              </button>
            </footer>
          </div>
        </div>
      )}
    </>
  );
}
