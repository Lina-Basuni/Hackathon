"use client";

import { Activity, Clock, MapPin, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { cn } from "@/app/lib/utils";
import { type ExtractedSymptom, type VitalsMentioned } from "./types";

interface SymptomsTimelineProps {
  symptoms: ExtractedSymptom[];
  vitalsMentioned: VitalsMentioned | null;
  timeline: string | null;
}

export function SymptomsTimeline({
  symptoms,
  vitalsMentioned,
  timeline,
}: SymptomsTimelineProps) {
  const hasVitals = vitalsMentioned && Object.values(vitalsMentioned).some(Boolean);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          Symptoms & Timeline
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Timeline Description */}
        {timeline && (
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
            <p className="text-xs font-medium text-blue-600 uppercase tracking-wide mb-1">
              Symptom Progression
            </p>
            <p className="text-sm text-blue-800">{timeline}</p>
          </div>
        )}

        {/* Symptoms List */}
        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200" />

          <div className="space-y-4">
            {symptoms.map((symptom, index) => (
              <div key={index} className="relative pl-10">
                {/* Timeline Dot */}
                <div
                  className={cn(
                    "absolute left-2.5 w-3 h-3 rounded-full border-2 border-white shadow",
                    symptom.severity === "severe"
                      ? "bg-red-500"
                      : symptom.severity === "moderate"
                      ? "bg-amber-500"
                      : "bg-teal-500"
                  )}
                />

                <div className="bg-white border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-800 capitalize">
                        {symptom.symptom}
                      </h4>

                      <div className="flex flex-wrap gap-2 mt-2">
                        {symptom.duration && (
                          <Badge variant="secondary" className="text-xs">
                            <Clock className="w-3 h-3 mr-1" />
                            {symptom.duration}
                          </Badge>
                        )}
                        {symptom.location && (
                          <Badge variant="secondary" className="text-xs">
                            <MapPin className="w-3 h-3 mr-1" />
                            {symptom.location}
                          </Badge>
                        )}
                        {symptom.severity && (
                          <Badge
                            className={cn(
                              "text-xs",
                              symptom.severity === "severe"
                                ? "bg-red-100 text-red-700"
                                : symptom.severity === "moderate"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-green-100 text-green-700"
                            )}
                          >
                            <TrendingUp className="w-3 h-3 mr-1" />
                            {symptom.severity}
                          </Badge>
                        )}
                        {symptom.frequency && (
                          <Badge variant="outline" className="text-xs">
                            {symptom.frequency}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {symptoms.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No specific symptoms extracted.</p>
          </div>
        )}

        {/* Vitals Mentioned */}
        {hasVitals && (
          <div className="mt-6 pt-6 border-t">
            <h4 className="font-medium text-slate-700 mb-3">Vitals Mentioned</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {vitalsMentioned?.bloodPressure && (
                <VitalBadge label="Blood Pressure" value={vitalsMentioned.bloodPressure} />
              )}
              {vitalsMentioned?.heartRate && (
                <VitalBadge label="Heart Rate" value={vitalsMentioned.heartRate} />
              )}
              {vitalsMentioned?.temperature && (
                <VitalBadge label="Temperature" value={vitalsMentioned.temperature} />
              )}
              {vitalsMentioned?.respiratoryRate && (
                <VitalBadge label="Respiratory Rate" value={vitalsMentioned.respiratoryRate} />
              )}
              {vitalsMentioned?.oxygenSaturation && (
                <VitalBadge label="O2 Saturation" value={vitalsMentioned.oxygenSaturation} />
              )}
              {vitalsMentioned?.bloodSugar && (
                <VitalBadge label="Blood Sugar" value={vitalsMentioned.bloodSugar} />
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function VitalBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 bg-slate-50 rounded-lg border">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="font-semibold text-slate-800">{value}</p>
    </div>
  );
}
