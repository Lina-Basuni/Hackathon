// Appointment Components Barrel Export

export { TimeSlotSelector } from "./TimeSlotSelector";
export { BookingConfirmationModal } from "./BookingConfirmationModal";

// Types
export type {
  TimeSlot,
  DoctorProfile,
  DoctorReview,
  Education,
  Appointment,
  AppointmentType,
  AppointmentStatus,
  BookingFormData,
  SlotsByDate,
  CalendarDay,
  CalendarWeek,
  SlotsApiResponse,
  BookingApiResponse,
  DoctorProfileApiResponse,
} from "./types";

// Utilities
export {
  APPOINTMENT_TYPES,
  generateConfirmationCode,
  formatTimeSlot,
  groupSlotsByDate,
} from "./types";
