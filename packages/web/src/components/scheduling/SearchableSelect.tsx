import React, { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";

export interface SelectOption {
  value: number;
  label: string;
  sublabel?: string;
}

// Shared hook: filter options by a case-insensitive query over label + sublabel.
const useFilteredOptions = (options: SelectOption[], query: string) =>
  useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        (o.sublabel?.toLowerCase().includes(q) ?? false)
    );
  }, [options, query]);

// Close the dropdown when clicking outside of it.
const useOutsideClose = (
  ref: React.RefObject<HTMLDivElement>,
  isOpen: boolean,
  close: () => void
) => {
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ref, isOpen, close]);
};

const dropdownListClass =
  "absolute z-20 mt-1 w-full rounded-lg border border-cream-300 bg-white shadow-lg";
const searchRowClass =
  "flex items-center gap-2 border-b border-cream-200 px-3 py-2";
const optionRowClass = (active: boolean) =>
  `flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition-colors ${
    active ? "bg-primary-50 text-primary-700" : "text-dark hover:bg-cream-100"
  }`;

interface SearchableSelectProps {
  options: SelectOption[];
  value: number | null;
  onChange: (value: number | null) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyLabel?: string;
  footer?: React.ReactNode;
}

/**
 * Single-select searchable dropdown. Replaces tall scrolling tile grids: the
 * operator types to filter rather than scrolling through every team/venue.
 */
export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  emptyLabel = "No matches",
  footer,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const filtered = useFilteredOptions(options, query);
  useOutsideClose(containerRef, isOpen, () => setIsOpen(false));

  const selected = options.find((o) => o.value === value) || null;

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 rounded-lg border-2 border-cream-300 bg-white px-3 py-2.5 text-left transition-colors hover:border-cream-400"
      >
        <span
          className={`truncate text-sm ${
            selected ? "text-dark font-medium" : "text-dark-300"
          }`}
        >
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown className="h-4 w-4 flex-shrink-0 text-dark-300" />
      </button>

      {isOpen && (
        <div className={dropdownListClass}>
          <div className={searchRowClass}>
            <Search className="h-4 w-4 text-dark-300" />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>
          <div className="max-h-60 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="px-3 py-3 text-sm text-dark-300">{emptyLabel}</p>
            ) : (
              filtered.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => {
                    onChange(o.value);
                    setIsOpen(false);
                    setQuery("");
                  }}
                  className={optionRowClass(o.value === value)}
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{o.label}</span>
                    {o.sublabel && (
                      <span className="block truncate text-xs text-dark-300">
                        {o.sublabel}
                      </span>
                    )}
                  </span>
                  {o.value === value && (
                    <Check className="h-4 w-4 flex-shrink-0 text-primary-600" />
                  )}
                </button>
              ))
            )}
          </div>
          {footer && (
            <div className="border-t border-cream-200 p-2">{footer}</div>
          )}
        </div>
      )}
    </div>
  );
};

interface SearchableMultiSelectProps {
  options: SelectOption[];
  values: number[];
  onChange: (values: number[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyLabel?: string;
  footer?: React.ReactNode;
}

/**
 * Multi-select searchable dropdown with removable chips for the current
 * selection. Used for picking which teams/venues to include in a schedule.
 */
export const SearchableMultiSelect: React.FC<SearchableMultiSelectProps> = ({
  options,
  values,
  onChange,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  emptyLabel = "No matches",
  footer,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const filtered = useFilteredOptions(options, query);
  useOutsideClose(containerRef, isOpen, () => setIsOpen(false));

  const valueSet = new Set(values);
  const selectedOptions = options.filter((o) => valueSet.has(o.value));

  const toggle = (value: number) => {
    if (valueSet.has(value)) {
      onChange(values.filter((v) => v !== value));
    } else {
      onChange([...values, value]);
    }
  };

  const allSelected = options.length > 0 && values.length === options.length;

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 rounded-lg border-2 border-cream-300 bg-white px-3 py-2.5 text-left transition-colors hover:border-cream-400"
      >
        <span className="truncate text-sm text-dark-300">
          {values.length === 0
            ? placeholder
            : `${values.length} selected`}
        </span>
        <ChevronDown className="h-4 w-4 flex-shrink-0 text-dark-300" />
      </button>

      {/* Selected chips */}
      {selectedOptions.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {selectedOptions.map((o) => (
            <span
              key={o.value}
              className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700"
            >
              {o.label}
              <button
                type="button"
                onClick={() => toggle(o.value)}
                className="text-primary-400 hover:text-primary-700"
                aria-label={`Remove ${o.label}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {isOpen && (
        <div className={dropdownListClass}>
          <div className={searchRowClass}>
            <Search className="h-4 w-4 text-dark-300" />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>
          {options.length > 0 && (
            <button
              type="button"
              onClick={() =>
                onChange(allSelected ? [] : options.map((o) => o.value))
              }
              className="w-full border-b border-cream-200 px-3 py-2 text-left text-xs font-medium text-primary-600 hover:bg-cream-100"
            >
              {allSelected ? "Clear all" : "Select all"}
            </button>
          )}
          <div className="max-h-60 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="px-3 py-3 text-sm text-dark-300">{emptyLabel}</p>
            ) : (
              filtered.map((o) => {
                const checked = valueSet.has(o.value);
                return (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => toggle(o.value)}
                    className={optionRowClass(checked)}
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">
                        {o.label}
                      </span>
                      {o.sublabel && (
                        <span className="block truncate text-xs text-dark-300">
                          {o.sublabel}
                        </span>
                      )}
                    </span>
                    <span
                      className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border ${
                        checked
                          ? "border-primary-600 bg-primary-600 text-white"
                          : "border-cream-400"
                      }`}
                    >
                      {checked && <Check className="h-3 w-3" />}
                    </span>
                  </button>
                );
              })
            )}
          </div>
          {footer && (
            <div className="border-t border-cream-200 p-2">{footer}</div>
          )}
        </div>
      )}
    </div>
  );
};
