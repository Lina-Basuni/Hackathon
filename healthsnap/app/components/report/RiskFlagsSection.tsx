"use client";

import { useState } from "react";
import { AlertTriangle, ChevronDown, ChevronUp, Shield, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Progress } from "@/app/components/ui/progress";
import { cn } from "@/app/lib/utils";
import { type RiskFlag, getSeverityConfig } from "./types";

interface RiskFlagsSectionProps {
  riskFlags: RiskFlag[];
  redFlags: string[];
  confidence: number;
}

export function RiskFlagsSection({
  riskFlags,
  redFlags,
  confidence,
}: RiskFlagsSectionProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Risk Assessment
          </CardTitle>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span>Confidence:</span>
            <div className="w-24 flex items-center gap-2">
              <Progress value={confidence * 100} className="h-2" />
              <span className="font-medium">{Math.round(confidence * 100)}%</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Red Flags Alert */}
        {redFlags.length > 0 && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-red-800">
                  Red Flags Identified
                </h4>
                <ul className="mt-2 space-y-1">
                  {redFlags.map((flag, i) => (
                    <li key={i} className="text-sm text-red-700 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                      {flag}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Risk Flag Cards */}
        <div className="grid gap-3">
          {riskFlags.map((flag, index) => (
            <RiskFlagCard key={index} flag={flag} />
          ))}
        </div>

        {riskFlags.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            <Info className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No significant risk flags identified.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RiskFlagCard({ flag }: { flag: RiskFlag }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const severityConfig = getSeverityConfig(flag.severity);

  return (
    <div
      className={cn(
        "border rounded-xl overflow-hidden transition-all",
        isExpanded ? "shadow-md" : "shadow-sm"
      )}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-start justify-between text-left hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "w-2 h-2 rounded-full mt-2 flex-shrink-0",
              flag.severity === "critical" && "bg-red-500",
              flag.severity === "high" && "bg-orange-500",
              flag.severity === "moderate" && "bg-amber-500",
              flag.severity === "low" && "bg-green-500"
            )}
          />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-semibold text-slate-800">{flag.flag}</h4>
              <Badge
                className={cn(
                  "text-xs",
                  severityConfig.bgColor,
                  severityConfig.color
                )}
              >
                {severityConfig.label}
              </Badge>
            </div>
            <p className="text-sm text-slate-600 mt-1">{flag.description}</p>
          </div>
        </div>
        {flag.clinicalRationale && (
          <div className="ml-4 flex-shrink-0">
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </div>
        )}
      </button>

      {/* Expanded Content */}
      {isExpanded && flag.clinicalRationale && (
        <div className="px-4 pb-4 border-t bg-slate-50">
          <div className="pt-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
              Clinical Rationale
            </p>
            <p className="text-sm text-slate-700">{flag.clinicalRationale}</p>
          </div>
        </div>
      )}
    </div>
  );
}
