"use client";

import { useState } from "react";
import { Filter, X, ChevronDown, Star } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { cn } from "@/app/lib/utils";
import {
  type DoctorFiltersState,
  type SortOption,
  SPECIALTIES,
  INSURANCE_OPTIONS,
  LANGUAGE_OPTIONS,
  AVAILABILITY_OPTIONS,
  SORT_OPTIONS,
  DEFAULT_FILTERS,
} from "./types";

interface DoctorFiltersProps {
  filters: DoctorFiltersState;
  onFiltersChange: (filters: DoctorFiltersState) => void;
  resultCount: number;
  hasAIRecommendation?: boolean;
}

export function DoctorFilters({
  filters,
  onFiltersChange,
  resultCount,
  hasAIRecommendation = false,
}: DoctorFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const updateFilter = <K extends keyof DoctorFiltersState>(
    key: K,
    value: DoctorFiltersState[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const resetFilters = () => {
    onFiltersChange(DEFAULT_FILTERS);
  };

  const activeFilterCount = Object.entries(filters).filter(([key, value]) => {
    if (key === "sortBy") return false;
    if (key === "minRating") return value > 0;
    return value !== "all" && value !== "";
  }).length;

  return (
    <>
      {/* Mobile Filter Toggle */}
      <div className="lg:hidden mb-4 flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2"
        >
          <Filter className="w-4 h-4" />
          Filters
          {activeFilterCount > 0 && (
            <Badge className="ml-1">{activeFilterCount}</Badge>
          )}
        </Button>

        <p className="text-sm text-slate-500">
          {resultCount} doctor{resultCount !== 1 ? "s" : ""} found
        </p>
      </div>

      {/* Mobile Slide-out Drawer */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-white shadow-xl overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
              <h3 className="font-semibold">Filters</h3>
              <button onClick={() => setIsOpen(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <FilterContent
                filters={filters}
                updateFilter={updateFilter}
                resetFilters={resetFilters}
                activeFilterCount={activeFilterCount}
                hasAIRecommendation={hasAIRecommendation}
              />
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-72 flex-shrink-0">
        <div className="sticky top-24 bg-white rounded-xl border p-5 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Filters</h3>
            {activeFilterCount > 0 && (
              <button
                onClick={resetFilters}
                className="text-sm text-primary hover:underline"
              >
                Reset all
              </button>
            )}
          </div>

          <FilterContent
            filters={filters}
            updateFilter={updateFilter}
            resetFilters={resetFilters}
            activeFilterCount={activeFilterCount}
            hasAIRecommendation={hasAIRecommendation}
          />

          <div className="pt-4 border-t text-sm text-slate-500">
            {resultCount} doctor{resultCount !== 1 ? "s" : ""} found
          </div>
        </div>
      </div>
    </>
  );
}

interface FilterContentProps {
  filters: DoctorFiltersState;
  updateFilter: <K extends keyof DoctorFiltersState>(
    key: K,
    value: DoctorFiltersState[K]
  ) => void;
  resetFilters: () => void;
  activeFilterCount: number;
  hasAIRecommendation: boolean;
}

function FilterContent({
  filters,
  updateFilter,
  hasAIRecommendation,
}: FilterContentProps) {
  return (
    <div className="space-y-5">
      {/* Sort By */}
      <FilterSection label="Sort By">
        <select
          value={filters.sortBy}
          onChange={(e) => updateFilter("sortBy", e.target.value as SortOption)}
          className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
              {opt.value === "best-match" && hasAIRecommendation && " (AI)"}
            </option>
          ))}
        </select>
      </FilterSection>

      {/* Specialty */}
      <FilterSection label="Specialty">
        <select
          value={filters.specialty}
          onChange={(e) => updateFilter("specialty", e.target.value)}
          className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {SPECIALTIES.map((spec) => (
            <option key={spec.value} value={spec.value}>
              {spec.label}
            </option>
          ))}
        </select>
      </FilterSection>

      {/* Availability */}
      <FilterSection label="Availability">
        <select
          value={filters.availability}
          onChange={(e) => updateFilter("availability", e.target.value)}
          className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {AVAILABILITY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </FilterSection>

      {/* Insurance */}
      <FilterSection label="Insurance">
        <select
          value={filters.insurance}
          onChange={(e) => updateFilter("insurance", e.target.value)}
          className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {INSURANCE_OPTIONS.map((ins) => (
            <option key={ins.value} value={ins.value}>
              {ins.label}
            </option>
          ))}
        </select>
      </FilterSection>

      {/* Language */}
      <FilterSection label="Language">
        <select
          value={filters.language}
          onChange={(e) => updateFilter("language", e.target.value)}
          className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {LANGUAGE_OPTIONS.map((lang) => (
            <option key={lang.value} value={lang.value}>
              {lang.label}
            </option>
          ))}
        </select>
      </FilterSection>

      {/* Minimum Rating */}
      <FilterSection label="Minimum Rating">
        <div className="flex gap-1">
          {[0, 3, 3.5, 4, 4.5].map((rating) => (
            <button
              key={rating}
              onClick={() => updateFilter("minRating", rating)}
              className={cn(
                "flex-1 px-2 py-2 rounded-lg text-sm border transition-colors",
                filters.minRating === rating
                  ? "bg-primary text-white border-primary"
                  : "bg-white hover:bg-slate-50"
              )}
            >
              {rating === 0 ? (
                "Any"
              ) : (
                <span className="flex items-center justify-center gap-0.5">
                  {rating}
                  <Star className="w-3 h-3 fill-current" />
                </span>
              )}
            </button>
          ))}
        </div>
      </FilterSection>
    </div>
  );
}

function FilterSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">
        {label}
      </label>
      {children}
    </div>
  );
}
