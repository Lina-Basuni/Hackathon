// Doctor Component Types

export interface DoctorWithAvailability {
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
  available: boolean;
  nextAvailableSlot: Date | null;
  availableSlotsCount: number;
  // AI matching
  matchScore?: number;
  matchReasons?: string[];
  specialtyRelevance?: string;
}

export interface DoctorFiltersState {
  specialty: string;
  location: string;
  insurance: string;
  language: string;
  availability: string;
  minRating: number;
  sortBy: SortOption;
}

export type SortOption =
  | "best-match"
  | "soonest-available"
  | "highest-rated"
  | "most-experienced";

export interface AIRecommendation {
  recommendedSpecialty: string;
  urgencyNote: string;
  matches: Array<{
    doctorId: string;
    matchScore: number;
    matchReasons: string[];
    specialtyRelevance: string;
  }>;
}

export const SPECIALTIES = [
  { value: "all", label: "All Specialties" },
  { value: "primary-care", label: "Primary Care" },
  { value: "cardiology", label: "Cardiology" },
  { value: "pulmonology", label: "Pulmonology" },
  { value: "gastroenterology", label: "Gastroenterology" },
  { value: "neurology", label: "Neurology" },
  { value: "endocrinology", label: "Endocrinology" },
  { value: "orthopedics", label: "Orthopedics" },
  { value: "dermatology", label: "Dermatology" },
  { value: "psychiatry", label: "Psychiatry" },
  { value: "infectious-disease", label: "Infectious Disease" },
] as const;

export const INSURANCE_OPTIONS = [
  { value: "all", label: "All Insurance" },
  { value: "Aetna", label: "Aetna" },
  { value: "Blue Cross Blue Shield", label: "Blue Cross Blue Shield" },
  { value: "Cigna", label: "Cigna" },
  { value: "United Healthcare", label: "United Healthcare" },
  { value: "Kaiser Permanente", label: "Kaiser Permanente" },
  { value: "Medicare", label: "Medicare" },
  { value: "Medicaid", label: "Medicaid" },
] as const;

export const LANGUAGE_OPTIONS = [
  { value: "all", label: "All Languages" },
  { value: "English", label: "English" },
  { value: "Spanish", label: "Spanish" },
  { value: "Mandarin", label: "Mandarin" },
  { value: "Hindi", label: "Hindi" },
  { value: "Korean", label: "Korean" },
  { value: "Japanese", label: "Japanese" },
  { value: "Portuguese", label: "Portuguese" },
  { value: "French", label: "French" },
] as const;

export const AVAILABILITY_OPTIONS = [
  { value: "all", label: "Any Time" },
  { value: "today", label: "Today" },
  { value: "tomorrow", label: "Tomorrow" },
  { value: "this-week", label: "This Week" },
  { value: "next-week", label: "Next Week" },
] as const;

export const SORT_OPTIONS = [
  { value: "best-match", label: "Best Match" },
  { value: "soonest-available", label: "Soonest Available" },
  { value: "highest-rated", label: "Highest Rated" },
  { value: "most-experienced", label: "Most Experienced" },
] as const;

export const DEFAULT_FILTERS: DoctorFiltersState = {
  specialty: "all",
  location: "",
  insurance: "all",
  language: "all",
  availability: "all",
  minRating: 0,
  sortBy: "best-match",
};
