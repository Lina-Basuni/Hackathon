// Report Component Types

export interface ReportData {
  id: string;
  createdAt: Date;
  status: string;
  patient: {
    id: string;
    name: string;
    dateOfBirth: Date | null;
    sex: string | null;
  };
  riskAssessment: {
    id: string;
    overallAcuity: string;
    confidence: number;
    riskFlags: RiskFlag[];
    symptomsExtracted: ExtractedSymptom[];
    vitalsMentioned: VitalsMentioned | null;
    redFlags: string[];
  };
  clinicalSummary: {
    id: string;
    chiefComplaint: string;
    summaryText: string;
    keyFindings: string[];
    timeline: string | null;
    pertinentNegatives: string[];
  };
  nextSteps: {
    id: string;
    recommendedAction: string;
    urgencyTimeframe: string;
    reasoning: string;
    patientInstructions: string[];
    warningSigns: string[];
    selfCareRecommendations: string[];
    specialistTypeRecommended: string | null;
  };
}

export interface RiskFlag {
  flag: string;
  severity: "low" | "moderate" | "high" | "critical";
  description: string;
  clinicalRationale?: string;
}

export interface ExtractedSymptom {
  symptom: string;
  duration?: string;
  severity?: string;
  location?: string;
  frequency?: string;
}

export interface VitalsMentioned {
  bloodPressure?: string;
  heartRate?: string;
  temperature?: string;
  respiratoryRate?: string;
  oxygenSaturation?: string;
  bloodSugar?: string;
  [key: string]: string | undefined;
}

export type AcuityLevel = "routine" | "urgent" | "emergent";

export function getAcuityConfig(acuity: string): {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
} {
  switch (acuity.toLowerCase()) {
    case "emergent":
      return {
        label: "Emergent",
        color: "text-red-700",
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
        icon: "🚨",
      };
    case "urgent":
      return {
        label: "Urgent",
        color: "text-amber-700",
        bgColor: "bg-amber-50",
        borderColor: "border-amber-200",
        icon: "⚠️",
      };
    case "routine":
    default:
      return {
        label: "Routine",
        color: "text-green-700",
        bgColor: "bg-green-50",
        borderColor: "border-green-200",
        icon: "✓",
      };
  }
}

export function getSeverityConfig(severity: string): {
  label: string;
  color: string;
  bgColor: string;
} {
  switch (severity.toLowerCase()) {
    case "critical":
      return {
        label: "Critical",
        color: "text-red-700",
        bgColor: "bg-red-100",
      };
    case "high":
      return {
        label: "High",
        color: "text-orange-700",
        bgColor: "bg-orange-100",
      };
    case "moderate":
      return {
        label: "Moderate",
        color: "text-amber-700",
        bgColor: "bg-amber-100",
      };
    case "low":
    default:
      return {
        label: "Low",
        color: "text-green-700",
        bgColor: "bg-green-100",
      };
  }
}

export function calculateAge(dateOfBirth: Date | null): number | null {
  if (!dateOfBirth) return null;
  const today = new Date();
  const birth = new Date(dateOfBirth);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}
