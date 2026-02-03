"use client";

import { useState } from "react";
import { FileText, ChevronDown, ChevronUp, Minus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { cn } from "@/app/lib/utils";

interface ClinicalSummaryProps {
  chiefComplaint: string;
  summaryText: string;
  keyFindings: string[];
  pertinentNegatives: string[];
}

export function ClinicalSummary({
  summaryText,
  keyFindings,
  pertinentNegatives,
}: ClinicalSummaryProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Show first paragraph by default, rest on expand
  const paragraphs = summaryText.split("\n\n").filter(Boolean);
  const previewText = paragraphs[0] || summaryText.slice(0, 300);
  const hasMore = paragraphs.length > 1 || summaryText.length > 300;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          Clinical Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Text */}
        <div>
          <div
            className={cn(
              "prose prose-slate prose-sm max-w-none",
              !isExpanded && hasMore && "line-clamp-4"
            )}
          >
            {isExpanded ? (
              paragraphs.map((p, i) => (
                <p key={i} className="text-slate-700 leading-relaxed">
                  {p}
                </p>
              ))
            ) : (
              <p className="text-slate-700 leading-relaxed">{previewText}</p>
            )}
          </div>

          {hasMore && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-3 text-sm font-medium text-primary hover:text-primary/80 flex items-center gap-1"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  Read full summary
                </>
              )}
            </button>
          )}
        </div>

        {/* Key Findings */}
        {keyFindings.length > 0 && (
          <div>
            <h4 className="font-medium text-slate-700 mb-3">Key Findings</h4>
            <div className="flex flex-wrap gap-2">
              {keyFindings.map((finding, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="bg-teal-50 text-teal-700 border-teal-200"
                >
                  {finding}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Pertinent Negatives */}
        {pertinentNegatives.length > 0 && (
          <div className="pt-4 border-t">
            <h4 className="font-medium text-slate-700 mb-3 flex items-center gap-2">
              <Minus className="w-4 h-4" />
              Pertinent Negatives
            </h4>
            <p className="text-xs text-slate-500 mb-2">
              Important symptoms that were NOT reported
            </p>
            <div className="flex flex-wrap gap-2">
              {pertinentNegatives.map((negative, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="text-slate-600"
                >
                  {negative}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
