"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Search, Loader2, UserX, Stethoscope } from "lucide-react";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { DoctorCard } from "@/app/components/doctors/DoctorCard";
import { DoctorFilters } from "@/app/components/doctors/DoctorFilters";
import { AIRecommendationBanner } from "@/app/components/doctors/AIRecommendationBanner";
import {
  type DoctorWithAvailability,
  type DoctorFiltersState,
  type AIRecommendation,
  DEFAULT_FILTERS,
} from "@/app/components/doctors/types";

interface DoctorsApiResponse {
  success: boolean;
  data?: {
    doctors: DoctorWithAvailability[];
    aiRecommendation: AIRecommendation | null;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasMore: boolean;
    };
  };
  error?: string;
}

export default function DoctorsPage() {
  const searchParams = useSearchParams();
  const reportId = searchParams.get("reportId");
  const initialSpecialty = searchParams.get("specialty");

  // State
  const [doctors, setDoctors] = useState<DoctorWithAvailability[]>([]);
  const [aiRecommendation, setAiRecommendation] = useState<AIRecommendation | null>(null);
  const [chiefComplaint, setChiefComplaint] = useState<string | undefined>();
  const [filters, setFilters] = useState<DoctorFiltersState>(() => ({
    ...DEFAULT_FILTERS,
    specialty: initialSpecialty || "all",
  }));
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
    hasMore: false,
  });

  // Fetch doctors
  const fetchDoctors = useCallback(async (page: number = 1) => {
    setIsLoading(true);
    setError(null);

    try {
      // Build query params
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", "12");

      if (filters.specialty !== "all") {
        params.set("specialty", filters.specialty);
      }
      if (filters.insurance !== "all") {
        params.set("insurance", filters.insurance);
      }
      if (filters.language !== "all") {
        params.set("language", filters.language);
      }
      if (filters.availability !== "all") {
        params.set("availability", filters.availability);
      }
      if (filters.minRating > 0) {
        params.set("minRating", filters.minRating.toString());
      }
      if (filters.sortBy) {
        params.set("sortBy", filters.sortBy);
      }
      if (searchQuery) {
        params.set("search", searchQuery);
      }
      if (reportId) {
        params.set("reportId", reportId);
      }

      const response = await fetch(`/api/doctors?${params.toString()}`);
      const data: DoctorsApiResponse = await response.json();

      if (!data.success || !data.data) {
        throw new Error(data.error || "Failed to fetch doctors");
      }

      setDoctors(data.data.doctors);
      setAiRecommendation(data.data.aiRecommendation);
      setPagination({
        page: data.data.pagination.page,
        totalPages: data.data.pagination.totalPages,
        total: data.data.pagination.total,
        hasMore: data.data.pagination.hasMore,
      });
    } catch (err) {
      console.error("Error fetching doctors:", err);
      setError(err instanceof Error ? err.message : "Failed to load doctors");
    } finally {
      setIsLoading(false);
    }
  }, [filters, searchQuery, reportId]);

  // Fetch chief complaint if reportId provided
  useEffect(() => {
    if (reportId) {
      fetch(`/api/reports/${reportId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data?.clinicalSummary?.chiefComplaint) {
            setChiefComplaint(data.data.clinicalSummary.chiefComplaint);
          }
        })
        .catch(() => {
          // Silently fail - chief complaint is optional
        });
    }
  }, [reportId]);

  // Fetch on mount and when filters change
  useEffect(() => {
    fetchDoctors(1);
  }, [fetchDoctors]);

  // Handle search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDoctors(1);
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    fetchDoctors(newPage);
    // Scroll to top of results
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Stethoscope className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Find a Doctor</h1>
            <p className="text-slate-600">
              {reportId
                ? "Doctors matched to your health report"
                : "Browse our network of qualified healthcare professionals"}
            </p>
          </div>
        </div>
      </div>

      {/* AI Recommendation Banner */}
      {aiRecommendation && (
        <div className="mb-6">
          <AIRecommendationBanner
            recommendation={aiRecommendation}
            chiefComplaint={chiefComplaint}
          />
        </div>
      )}

      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="mb-6">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              type="text"
              placeholder="Search by doctor name or hospital..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12"
            />
          </div>
          <Button type="submit" size="lg" className="px-6">
            Search
          </Button>
        </div>
      </form>

      {/* Main Content: Filters + Results */}
      <div className="flex gap-6">
        {/* Filters Sidebar */}
        <DoctorFilters
          filters={filters}
          onFiltersChange={setFilters}
          resultCount={pagination.total}
          hasAIRecommendation={!!aiRecommendation}
        />

        {/* Results Area */}
        <div className="flex-1 min-w-0">
          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
                <p className="text-slate-600">Finding the best doctors for you...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="py-12 text-center">
                <p className="text-red-600 font-medium mb-2">Unable to load doctors</p>
                <p className="text-red-500 text-sm mb-4">{error}</p>
                <Button variant="outline" onClick={() => fetchDoctors(1)}>
                  Try Again
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {!isLoading && !error && doctors.length === 0 && (
            <Card>
              <CardContent className="py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <UserX className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="font-semibold text-lg text-slate-800 mb-2">
                  No doctors found
                </h3>
                <p className="text-slate-600 mb-4">
                  Try adjusting your filters or search criteria to find more doctors.
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setFilters(DEFAULT_FILTERS);
                    setSearchQuery("");
                  }}
                >
                  Clear All Filters
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Doctor Cards Grid */}
          {!isLoading && !error && doctors.length > 0 && (
            <>
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                {doctors.map((doctor) => (
                  <DoctorCard
                    key={doctor.id}
                    doctor={doctor}
                    reportId={reportId || undefined}
                    showMatchScore={!!aiRecommendation}
                  />
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page <= 1}
                    onClick={() => handlePageChange(pagination.page - 1)}
                  >
                    Previous
                  </Button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      // Show pages around current page
                      let pageNum: number;
                      if (pagination.totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (pagination.page <= 3) {
                        pageNum = i + 1;
                      } else if (pagination.page >= pagination.totalPages - 2) {
                        pageNum = pagination.totalPages - 4 + i;
                      } else {
                        pageNum = pagination.page - 2 + i;
                      }

                      return (
                        <Button
                          key={pageNum}
                          variant={pagination.page === pageNum ? "default" : "outline"}
                          size="sm"
                          className="w-10"
                          onClick={() => handlePageChange(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!pagination.hasMore}
                    onClick={() => handlePageChange(pagination.page + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}

              {/* Results summary */}
              <p className="text-center text-sm text-slate-500 mt-4">
                Showing {(pagination.page - 1) * 12 + 1}-
                {Math.min(pagination.page * 12, pagination.total)} of {pagination.total} doctors
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
