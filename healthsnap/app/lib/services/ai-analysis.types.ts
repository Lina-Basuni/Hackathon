// ===========================================
// AI ANALYSIS SERVICE TYPES
// ===========================================

// Input Types
// ===========================================

export interface PatientContext {
  name?: string;
  age?: number;
  sex?: string;
  knownConditions?: string[];
  currentMedications?: Array<{
    name: string;
    dosage?: string;
    frequency?: string;
  }>;
}

export interface AnalysisInput {
  transcript: string;
  patientContext?: PatientContext;
  voiceNoteId?: string;
  patientId?: string;
}

export interface DoctorForMatching {
  id: string;
  name: string;
  specialty: string;
  yearsExperience: number;
  rating: number;
  location?: string;
  languages?: string[];
  availableSlots: number;
}

// Output Types
// ===========================================

export type AcuityLevel = "routine" | "urgent" | "emergent";
export type RiskSeverity = "low" | "moderate" | "high" | "critical";

export interface RiskFlag {
  flag: string;
  severity: RiskSeverity;
  description: string;
  clinicalRationale: string;
}

export interface ExtractedSymptom {
  symptom: string;
  duration?: string;
  severity?: string;
  location?: string;
  frequency?: string;
  aggravatingFactors?: string[];
  relievingFactors?: string[];
}

export interface VitalsMentioned {
  bloodPressure?: string;
  heartRate?: string;
  temperature?: string;
  respiratoryRate?: string;
  oxygenSaturation?: string;
  bloodSugar?: string;
  weight?: string;
  other?: Record<string, string>;
}

export interface RiskAssessmentResult {
  riskFlags: RiskFlag[];
  symptomsExtracted: ExtractedSymptom[];
  vitalsMentioned: VitalsMentioned | null;
  overallAcuity: AcuityLevel;
  redFlags: string[];
  confidence: number;
  reasoning: string;
}

export interface ClinicalSummaryResult {
  chiefComplaint: string;
  summaryText: string;
  keyFindings: string[];
  timeline: string;
  pertinentNegatives: string[];
  differentialConsiderations: string[];
  confidence: number;
}

export interface NextStepsResult {
  recommendedAction: string;
  urgencyTimeframe: string;
  reasoning: string;
  patientInstructions: string[];
  warningSigns: string[];
  selfCareRecommendations: string[];
  specialistTypeRecommended: string | null;
  followUpRecommendation: string;
  confidence: number;
}

export interface DoctorMatch {
  doctorId: string;
  matchScore: number;
  matchReasons: string[];
  specialtyRelevance: string;
}

export interface DoctorMatchingResult {
  matches: DoctorMatch[];
  recommendedSpecialty: string;
  urgencyNote: string;
  confidence: number;
}

// Combined Analysis Result
// ===========================================

export interface FullAnalysisResult {
  success: boolean;
  voiceNoteId?: string;
  riskAssessment: RiskAssessmentResult;
  clinicalSummary: ClinicalSummaryResult;
  nextSteps: NextStepsResult;
  doctorMatching?: DoctorMatchingResult;
  metadata: AnalysisMetadata;
  disclaimer: string;
}

export interface AnalysisMetadata {
  analysisId: string;
  timestamp: string;
  modelUsed: string;
  totalTokensUsed: number;
  estimatedCost: number;
  processingTimeMs: number;
  stages: StageMetadata[];
}

export interface StageMetadata {
  stage: string;
  tokensUsed: number;
  durationMs: number;
  success: boolean;
  error?: string;
}

// Error Types
// ===========================================

export interface AnalysisError {
  stage: string;
  message: string;
  retryable: boolean;
}

// API Response Types
// ===========================================

export interface AnalyzeApiResponse {
  success: boolean;
  data?: FullAnalysisResult;
  error?: string;
}
