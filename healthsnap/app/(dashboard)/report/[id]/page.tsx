import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import prisma from "@/app/lib/prisma";
import {
  ReportHeader,
  RiskFlagsSection,
  SymptomsTimeline,
  ClinicalSummary,
  NextStepsSection,
  ReportActions,
  type ReportData,
  type RiskFlag,
  type ExtractedSymptom,
  type VitalsMentioned,
} from "@/app/components/report";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ReportPage({ params }: PageProps) {
  const { id } = await params;

  // Fetch report with all related data
  const report = await prisma.report.findUnique({
    where: { id },
    include: {
      patient: true,
      riskAssessment: true,
      clinicalSummary: true,
      nextSteps: true,
    },
  });

  if (!report || !report.riskAssessment || !report.clinicalSummary || !report.nextSteps) {
    notFound();
  }

  // Transform database data to component format
  const reportData: ReportData = {
    id: report.id,
    createdAt: report.createdAt,
    status: report.status,
    patient: {
      id: report.patient.id,
      name: report.patient.name,
      dateOfBirth: report.patient.dateOfBirth,
      sex: report.patient.sex,
    },
    riskAssessment: {
      id: report.riskAssessment.id,
      overallAcuity: report.riskAssessment.overallAcuity,
      confidence: report.riskAssessment.confidence,
      riskFlags: safeJsonParse<RiskFlag[]>(report.riskAssessment.riskFlags, []),
      symptomsExtracted: safeJsonParse<ExtractedSymptom[]>(
        report.riskAssessment.symptomsExtracted,
        []
      ),
      vitalsMentioned: report.riskAssessment.vitalsMentioned
        ? safeJsonParse<VitalsMentioned>(report.riskAssessment.vitalsMentioned, null)
        : null,
      redFlags: safeJsonParse<string[]>(report.riskAssessment.redFlags || "[]", []),
    },
    clinicalSummary: {
      id: report.clinicalSummary.id,
      chiefComplaint: report.clinicalSummary.chiefComplaint,
      summaryText: report.clinicalSummary.summaryText,
      keyFindings: safeJsonParse<string[]>(report.clinicalSummary.keyFindings, []),
      timeline: report.clinicalSummary.timeline,
      pertinentNegatives: safeJsonParse<string[]>(
        report.clinicalSummary.pertinentNegatives || "[]",
        []
      ),
    },
    nextSteps: {
      id: report.nextSteps.id,
      recommendedAction: report.nextSteps.recommendedAction,
      urgencyTimeframe: report.nextSteps.urgencyTimeframe,
      reasoning: report.nextSteps.reasoning,
      patientInstructions: safeJsonParse<string[]>(
        report.nextSteps.patientInstructions,
        []
      ),
      warningSigns: safeJsonParse<string[]>(report.nextSteps.warningSigns, []),
      selfCareRecommendations: safeJsonParse<string[]>(
        report.nextSteps.selfCareRecommendations || "[]",
        []
      ),
      specialistTypeRecommended: report.nextSteps.specialistTypeRecommended,
    },
  };

  return (
    <div className="max-w-4xl mx-auto pb-12">
      {/* Back Navigation */}
      <Link
        href="/reports"
        className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Reports
      </Link>

      {/* Report Content */}
      <div className="space-y-6">
        {/* Header */}
        <ReportHeader report={reportData} />

        {/* Risk Assessment */}
        <RiskFlagsSection
          riskFlags={reportData.riskAssessment.riskFlags}
          redFlags={reportData.riskAssessment.redFlags}
          confidence={reportData.riskAssessment.confidence}
        />

        {/* Symptoms Timeline */}
        <SymptomsTimeline
          symptoms={reportData.riskAssessment.symptomsExtracted}
          vitalsMentioned={reportData.riskAssessment.vitalsMentioned}
          timeline={reportData.clinicalSummary.timeline}
        />

        {/* Clinical Summary */}
        <ClinicalSummary
          chiefComplaint={reportData.clinicalSummary.chiefComplaint}
          summaryText={reportData.clinicalSummary.summaryText}
          keyFindings={reportData.clinicalSummary.keyFindings}
          pertinentNegatives={reportData.clinicalSummary.pertinentNegatives}
        />

        {/* Next Steps */}
        <NextStepsSection
          recommendedAction={reportData.nextSteps.recommendedAction}
          urgencyTimeframe={reportData.nextSteps.urgencyTimeframe}
          reasoning={reportData.nextSteps.reasoning}
          patientInstructions={reportData.nextSteps.patientInstructions}
          warningSigns={reportData.nextSteps.warningSigns}
          selfCareRecommendations={reportData.nextSteps.selfCareRecommendations}
          specialistTypeRecommended={reportData.nextSteps.specialistTypeRecommended}
        />

        {/* Action Buttons */}
        <ReportActions
          reportId={report.id}
          specialistRecommended={reportData.nextSteps.specialistTypeRecommended}
        />
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          nav,
          .no-print {
            display: none !important;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .shadow-sm,
          .shadow-md {
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
}

// Helper function to safely parse JSON
function safeJsonParse<T>(json: string | null | undefined, fallback: T): T {
  if (!json) return fallback;
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}
