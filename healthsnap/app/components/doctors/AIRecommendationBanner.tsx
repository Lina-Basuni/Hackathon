"use client";

import { Sparkles, ArrowRight, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { cn } from "@/app/lib/utils";
import { getSpecialtyLabel } from "@/app/lib/utils";
import type { AIRecommendation } from "./types";

interface AIRecommendationBannerProps {
  recommendation: AIRecommendation;
  chiefComplaint?: string;
}

export function AIRecommendationBanner({
  recommendation,
  chiefComplaint,
}: AIRecommendationBannerProps) {
  const isUrgent =
    recommendation.urgencyNote.toLowerCase().includes("urgent") ||
    recommendation.urgencyNote.toLowerCase().includes("immediate") ||
    recommendation.urgencyNote.toLowerCase().includes("emergency");

  return (
    <Card
      className={cn(
        "overflow-hidden",
        isUrgent ? "border-amber-200" : "border-teal-200"
      )}
    >
      <div
        className={cn(
          "px-5 py-3",
          isUrgent
            ? "bg-gradient-to-r from-amber-500 to-orange-500"
            : "bg-gradient-to-r from-teal-500 to-teal-600"
        )}
      >
        <div className="flex items-center gap-2 text-white">
          <Sparkles className="w-5 h-5" />
          <span className="font-semibold">AI-Powered Recommendations</span>
        </div>
      </div>

      <CardContent className="p-5">
        <div className="space-y-4">
          {/* Chief Complaint Context */}
          {chiefComplaint && (
            <div className="text-sm text-slate-600">
              <span className="font-medium">Based on your symptoms:</span>{" "}
              <span className="italic">&quot;{chiefComplaint}&quot;</span>
            </div>
          )}

          {/* Main Recommendation */}
          <div
            className={cn(
              "p-4 rounded-xl",
              isUrgent ? "bg-amber-50" : "bg-teal-50"
            )}
          >
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                  isUrgent ? "bg-amber-100" : "bg-teal-100"
                )}
              >
                <ArrowRight
                  className={cn(
                    "w-5 h-5",
                    isUrgent ? "text-amber-600" : "text-teal-600"
                  )}
                />
              </div>
              <div>
                <p className="font-medium text-slate-800">
                  We recommend seeing a{" "}
                  <Badge
                    className={cn(
                      "ml-1",
                      isUrgent
                        ? "bg-amber-100 text-amber-700"
                        : "bg-teal-100 text-teal-700"
                    )}
                  >
                    {getSpecialtyLabel(recommendation.recommendedSpecialty)}
                  </Badge>
                </p>
                <p className="text-sm text-slate-600 mt-1">
                  {recommendation.urgencyNote}
                </p>
              </div>
            </div>
          </div>

          {/* Match Stats */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-teal-500" />
              <span className="text-slate-600">
                <strong>{recommendation.matches.length}</strong> highly matched
                doctors found
              </span>
            </div>
            {recommendation.matches.length > 0 && (
              <div className="text-slate-500">
                Top match:{" "}
                <strong>
                  {Math.round(recommendation.matches[0].matchScore * 100)}%
                </strong>
              </div>
            )}
          </div>

          {/* Urgency Warning */}
          {isUrgent && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">
                Based on your symptoms, we recommend scheduling an appointment
                promptly. If symptoms worsen, seek immediate medical attention.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
