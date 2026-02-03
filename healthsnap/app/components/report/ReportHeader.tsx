"use client";

import { format } from "date-fns";
import { FileText, Calendar, User, Clock } from "lucide-react";
import { Badge } from "@/app/components/ui/badge";
import { cn } from "@/app/lib/utils";
import { type ReportData, getAcuityConfig, calculateAge } from "./types";

interface ReportHeaderProps {
  report: ReportData;
}

export function ReportHeader({ report }: ReportHeaderProps) {
  const acuityConfig = getAcuityConfig(report.riskAssessment.overallAcuity);
  const age = calculateAge(report.patient.dateOfBirth);

  return (
    <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
      {/* Acuity Banner */}
      <div
        className={cn(
          "px-6 py-3 flex items-center justify-between",
          acuityConfig.bgColor,
          acuityConfig.borderColor,
          "border-b"
        )}
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">{acuityConfig.icon}</span>
          <span className={cn("font-semibold", acuityConfig.color)}>
            {acuityConfig.label} Priority
          </span>
        </div>
        <div className={cn("text-sm", acuityConfig.color)}>
          {Math.round(report.riskAssessment.confidence * 100)}% confidence
        </div>
      </div>

      {/* Main Header Content */}
      <div className="p-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          {/* Left: Report Info */}
          <div className="space-y-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
                Health Assessment Report
              </h1>
              <p className="text-slate-500 mt-1 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Report #{report.id.slice(-8).toUpperCase()}
              </p>
            </div>

            {/* Patient Info */}
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-2 text-slate-600">
                <User className="w-4 h-4" />
                <span className="font-medium">{report.patient.name}</span>
                {age && <span className="text-slate-400">({age} years old)</span>}
                {report.patient.sex && (
                  <Badge variant="secondary" className="capitalize">
                    {report.patient.sex}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Right: Timestamp */}
          <div className="flex flex-col items-start md:items-end gap-2 text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{format(new Date(report.createdAt), "MMMM d, yyyy")}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{format(new Date(report.createdAt), "h:mm a")}</span>
            </div>
            <Badge
              variant={report.status === "final" ? "default" : "secondary"}
              className="mt-1"
            >
              {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
            </Badge>
          </div>
        </div>

        {/* Chief Complaint Banner */}
        <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
            Chief Complaint
          </p>
          <p className="text-lg font-medium text-slate-800">
            {report.clinicalSummary.chiefComplaint}
          </p>
        </div>
      </div>
    </div>
  );
}
