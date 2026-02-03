// Risk assessment types
export type RiskLevel = "low" | "moderate" | "high" | "critical";

export interface RiskFlag {
  name: string;
  severity: RiskLevel;
  description: string;
  indicators: string[];
}

export interface RecommendedAction {
  action: string;
  priority: "immediate" | "soon" | "routine";
  timeframe: string;
}

export interface AnalysisResult {
  riskFlags: RiskFlag[];
  overallRisk: RiskLevel;
  clinicalSummary: string;
  patientSummary: string;
  recommendedActions: RecommendedAction[];
  suggestedSpecialties: string[];
  confidenceScore: number;
}

// Voice recording types
export interface VoiceRecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  audioBlob: Blob | null;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Doctor types
export interface Doctor {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  specialty: string;
  qualifications: string;
  experience: number;
  bio: string | null;
  hospital: string | null;
  address: string | null;
  city: string | null;
  consultationFee: number | null;
  rating: number;
  reviewCount: number;
  imageUrl: string | null;
  isAvailable: boolean;
}

// Time slot types
export interface TimeSlot {
  id: string;
  doctorId: string;
  date: Date;
  startTime: string;
  endTime: string;
  isBooked: boolean;
  isBlocked: boolean;
}

// Appointment types
export type AppointmentStatus = "pending" | "confirmed" | "completed" | "cancelled" | "no-show";
export type AppointmentType = "in-person" | "video" | "phone";

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  timeSlotId: string;
  reportId: string | null;
  reason: string;
  notes: string | null;
  status: AppointmentStatus;
  type: AppointmentType;
  confirmedAt: Date | null;
  doctor?: Doctor;
  timeSlot?: TimeSlot;
}
