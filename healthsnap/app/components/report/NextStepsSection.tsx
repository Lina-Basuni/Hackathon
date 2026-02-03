"use client";

import { useState } from "react";
import {
  ArrowRight,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Heart,
  ChevronDown,
  ChevronUp,
  Stethoscope,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/app/components/ui/alert";
import { cn } from "@/app/lib/utils";
import { getSpecialtyLabel } from "@/app/lib/utils";

interface NextStepsSectionProps {
  recommendedAction: string;
  urgencyTimeframe: string;
  reasoning: string;
  patientInstructions: string[];
  warningSigns: string[];
  selfCareRecommendations: string[];
  specialistTypeRecommended: string | null;
}

export function NextStepsSection({
  recommendedAction,
  urgencyTimeframe,
  reasoning,
  patientInstructions,
  warningSigns,
  selfCareRecommendations,
  specialistTypeRecommended,
}: NextStepsSectionProps) {
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());
  const [showSelfCare, setShowSelfCare] = useState(false);

  const toggleItem = (index: number) => {
    const newChecked = new Set(checkedItems);
    if (newChecked.has(index)) {
      newChecked.delete(index);
    } else {
      newChecked.add(index);
    }
    setCheckedItems(newChecked);
  };

  const isUrgent =
    urgencyTimeframe.toLowerCase().includes("immediate") ||
    urgencyTimeframe.toLowerCase().includes("hour") ||
    urgencyTimeframe.toLowerCase().includes("emergency");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowRight className="w-5 h-5 text-primary" />
          Recommended Next Steps
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Primary Action Card */}
        <div
          className={cn(
            "p-5 rounded-xl border-2",
            isUrgent
              ? "bg-red-50 border-red-200"
              : "bg-teal-50 border-teal-200"
          )}
        >
          <div className="flex items-start gap-4">
            <div
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0",
                isUrgent ? "bg-red-100" : "bg-teal-100"
              )}
            >
              <Stethoscope
                className={cn(
                  "w-6 h-6",
                  isUrgent ? "text-red-600" : "text-teal-600"
                )}
              />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <h3
                  className={cn(
                    "font-semibold text-lg",
                    isUrgent ? "text-red-800" : "text-teal-800"
                  )}
                >
                  {recommendedAction}
                </h3>
              </div>
              <Badge
                className={cn(
                  "mb-3",
                  isUrgent
                    ? "bg-red-100 text-red-700"
                    : "bg-teal-100 text-teal-700"
                )}
              >
                <Clock className="w-3 h-3 mr-1" />
                {urgencyTimeframe}
              </Badge>
              <p
                className={cn(
                  "text-sm",
                  isUrgent ? "text-red-700" : "text-teal-700"
                )}
              >
                {reasoning}
              </p>

              {specialistTypeRecommended && (
                <div className="mt-3 pt-3 border-t border-current/10">
                  <p className="text-xs font-medium uppercase tracking-wide opacity-70 mb-1">
                    Recommended Specialist
                  </p>
                  <Badge variant="secondary" className="text-sm">
                    {getSpecialtyLabel(specialistTypeRecommended)}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Warning Signs */}
        {warningSigns.length > 0 && (
          <Alert variant="warning">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>When to Seek Immediate Care</AlertTitle>
            <AlertDescription>
              <p className="mb-2 text-sm">
                Go to the emergency room or call 911 if you experience:
              </p>
              <ul className="space-y-1">
                {warningSigns.map((sign, index) => (
                  <li key={index} className="text-sm flex items-start gap-2">
                    <span className="text-amber-600 mt-1">•</span>
                    {sign}
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Patient Instructions Checklist */}
        {patientInstructions.length > 0 && (
          <div>
            <h4 className="font-medium text-slate-700 mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              Your Action Items
            </h4>
            <div className="space-y-2">
              {patientInstructions.map((instruction, index) => (
                <label
                  key={index}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                    checkedItems.has(index)
                      ? "bg-green-50 border-green-200"
                      : "bg-white hover:bg-slate-50"
                  )}
                >
                  <Checkbox
                    checked={checkedItems.has(index)}
                    onCheckedChange={() => toggleItem(index)}
                    className="mt-0.5"
                  />
                  <span
                    className={cn(
                      "text-sm",
                      checkedItems.has(index)
                        ? "text-green-700 line-through"
                        : "text-slate-700"
                    )}
                  >
                    {instruction}
                  </span>
                </label>
              ))}
            </div>
            {patientInstructions.length > 0 && (
              <p className="text-xs text-slate-500 mt-2">
                {checkedItems.size} of {patientInstructions.length} completed
              </p>
            )}
          </div>
        )}

        {/* Self-Care Recommendations (Collapsible) */}
        {selfCareRecommendations.length > 0 && (
          <div className="border rounded-xl overflow-hidden">
            <button
              onClick={() => setShowSelfCare(!showSelfCare)}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-pink-500" />
                <span className="font-medium text-slate-700">
                  Self-Care Recommendations
                </span>
                <Badge variant="secondary" className="text-xs">
                  {selfCareRecommendations.length}
                </Badge>
              </div>
              {showSelfCare ? (
                <ChevronUp className="w-5 h-5 text-slate-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-400" />
              )}
            </button>

            {showSelfCare && (
              <div className="px-4 pb-4 border-t bg-slate-50">
                <ul className="mt-3 space-y-2">
                  {selfCareRecommendations.map((rec, index) => (
                    <li
                      key={index}
                      className="text-sm text-slate-600 flex items-start gap-2"
                    >
                      <span className="text-pink-500 mt-1">♥</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
