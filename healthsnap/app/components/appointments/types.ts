// ===========================================
// APPOINTMENT BOOKING TYPES
// ===========================================

export interface TimeSlot {
  id: string;
  doctorId: string;
  date: Date;
  startTime: string;
  endTime: string;
  duration: number;
  isBooked: boolean;
  isBlocked: boolean;
}

export interface DoctorProfile {
  id: string;
  name: string;
  specialty: string;
  hospital: string | null;
  location: string | null;
  languages: string[];
  acceptedInsurance: string[];
  rating: number;
  yearsExperience: number;
  bio: string | null;
  imageUrl: string | null;
  education: Education[];
  certifications: string[];
  available: boolean;
  reviews: DoctorReview[];
}

export interface Education {
  degree: string;
  institution: string;
  year: number;
}

export interface DoctorReview {
  id: string;
  rating: number;
  comment: string | null;
  author: string;
  createdAt: Date;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  timeSlotId: string;
  reportId: string | null;
  reason: string;
  type: AppointmentType;
  status: AppointmentStatus;
  notes: string | null;
  confirmationCode: string | null;
  createdAt: Date;
  updatedAt: Date;
  doctor?: DoctorProfile;
  timeSlot?: TimeSlot;
}

export type AppointmentType = "in-person" | "video" | "phone";
export type AppointmentStatus = "pending" | "confirmed" | "completed" | "cancelled";

export interface BookingFormData {
  doctorId: string;
  timeSlotId: string;
  reportId?: string;
  reason: string;
  type: AppointmentType;
  notes?: string;
  agreedToTerms: boolean;
}

export interface SlotsByDate {
  [date: string]: TimeSlot[];
}

// API Response Types
export interface SlotsApiResponse {
  success: boolean;
  data?: {
    slots: TimeSlot[];
    doctor: {
      id: string;
      name: string;
    };
  };
  error?: string;
}

export interface BookingApiResponse {
  success: boolean;
  data?: Appointment;
  error?: string;
}

export interface DoctorProfileApiResponse {
  success: boolean;
  data?: DoctorProfile;
  error?: string;
}

// Calendar Types
export interface CalendarDay {
  date: Date;
  isToday: boolean;
  isSelected: boolean;
  isCurrentMonth: boolean;
  hasSlots: boolean;
  slotsCount: number;
}

export interface CalendarWeek {
  days: CalendarDay[];
}

// Appointment type options
export const APPOINTMENT_TYPES: { value: AppointmentType; label: string; icon: string }[] = [
  { value: "in-person", label: "In-Person Visit", icon: "Building2" },
  { value: "video", label: "Video Call", icon: "Video" },
  { value: "phone", label: "Phone Call", icon: "Phone" },
];

// Generate confirmation code
export function generateConfirmationCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "HS-";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Format time slot for display
export function formatTimeSlot(startTime: string, endTime: string): string {
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };
  return `${formatTime(startTime)} - ${formatTime(endTime)}`;
}

// Group slots by date
export function groupSlotsByDate(slots: TimeSlot[]): SlotsByDate {
  return slots.reduce((acc, slot) => {
    const dateKey = new Date(slot.date).toISOString().split("T")[0];
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(slot);
    return acc;
  }, {} as SlotsByDate);
}
