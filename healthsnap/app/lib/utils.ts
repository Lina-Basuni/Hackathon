import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function getRiskColor(risk: string): string {
  switch (risk.toLowerCase()) {
    case "low":
      return "text-health-low bg-health-low/10 border-health-low/20";
    case "moderate":
      return "text-health-moderate bg-health-moderate/10 border-health-moderate/20";
    case "high":
      return "text-health-high bg-health-high/10 border-health-high/20";
    case "critical":
      return "text-health-critical bg-health-critical/10 border-health-critical/20";
    default:
      return "text-muted-foreground bg-muted border-border";
  }
}

export function getRiskBadgeColor(risk: string): string {
  switch (risk.toLowerCase()) {
    case "low":
      return "bg-green-500";
    case "moderate":
      return "bg-amber-500";
    case "high":
      return "bg-orange-500";
    case "critical":
      return "bg-red-500";
    default:
      return "bg-gray-500";
  }
}

export function getSpecialtyLabel(specialty: string): string {
  const labels: Record<string, string> = {
    "primary-care": "Primary Care",
    cardiology: "Cardiology",
    pulmonology: "Pulmonology",
    gastroenterology: "Gastroenterology",
    endocrinology: "Endocrinology",
    neurology: "Neurology",
    "infectious-disease": "Infectious Disease",
    orthopedics: "Orthopedics",
    dermatology: "Dermatology",
    psychiatry: "Psychiatry",
    // Legacy
    general: "General Medicine",
    nephrology: "Nephrology",
  };
  return labels[specialty] || specialty.charAt(0).toUpperCase() + specialty.slice(1);
}

export function generateShareToken(): string {
  return `hs_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 15)}`;
}
