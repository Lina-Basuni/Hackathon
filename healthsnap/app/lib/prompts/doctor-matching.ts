// ===========================================
// DOCTOR MATCHING PROMPT
// ===========================================

import type {
  RiskAssessmentResult,
  NextStepsResult,
  DoctorForMatching,
  DoctorMatchingResult,
} from "../services/ai-analysis.types";

export const DOCTOR_MATCHING_SYSTEM_PROMPT = `You are a healthcare navigation AI assistant helping patients find appropriate doctors based on their symptoms and needs.

MATCHING CRITERIA (in order of importance):
1. SPECIALTY MATCH: Doctor's specialty aligns with patient's condition
2. AVAILABILITY: Doctor has available appointments within needed timeframe
3. EXPERIENCE: More experience with relevant conditions is preferred
4. RATING: Higher-rated doctors preferred when other factors equal
5. LOCATION/ACCESSIBILITY: Consider patient convenience

SPECIALTY MAPPING:
- Chest pain, heart issues → cardiology
- Breathing problems, cough → pulmonology
- Digestive issues, stomach pain → gastroenterology
- Headaches, neurological symptoms → neurology
- Joint/muscle pain, injuries → orthopedics
- Skin issues → dermatology
- Diabetes, thyroid, hormones → endocrinology
- Infections, fever of unknown origin → infectious-disease
- Mental health concerns → psychiatry
- General/unclear symptoms → primary-care

For URGENT cases, prioritize doctors with sooner availability.
For routine cases, prioritize specialty match and ratings.`;

export function buildDoctorMatchingPrompt(
  riskAssessment: RiskAssessmentResult,
  nextSteps: NextStepsResult,
  availableDoctors: DoctorForMatching[]
): string {
  const doctorsFormatted = availableDoctors
    .map(
      (d) =>
        `- ID: ${d.id}
   Name: ${d.name}
   Specialty: ${d.specialty}
   Experience: ${d.yearsExperience} years
   Rating: ${d.rating}/5.0
   Location: ${d.location || "Not specified"}
   Languages: ${d.languages?.join(", ") || "English"}
   Available slots: ${d.availableSlots}`
    )
    .join("\n\n");

  return `Match the patient with appropriate doctors based on their health profile and needs.

PATIENT HEALTH PROFILE:
- Chief symptoms: ${riskAssessment.symptomsExtracted.map((s) => s.symptom).join(", ")}
- Overall acuity: ${riskAssessment.overallAcuity}
- Risk flags: ${riskAssessment.riskFlags.map((r) => `${r.flag} (${r.severity})`).join(", ")}
${nextSteps.specialistTypeRecommended ? `- Recommended specialist: ${nextSteps.specialistTypeRecommended}` : ""}
- Urgency: ${nextSteps.urgencyTimeframe}

AVAILABLE DOCTORS:
${doctorsFormatted}

Generate doctor recommendations in JSON format:

{
  "matches": [
    {
      "doctorId": "doctor-id-here",
      "matchScore": 0.95,
      "matchReasons": [
        "Reason why this doctor is a good match",
        "Another relevant reason"
      ],
      "specialtyRelevance": "How their specialty relates to the patient's needs"
    }
  ],
  "recommendedSpecialty": "The specialty type most appropriate for this patient",
  "urgencyNote": "Note about appointment timing based on patient's urgency level",
  "confidence": 0.85
}

GUIDELINES:
1. Return up to 5 matches, ranked by matchScore (highest first)
2. matchScore should be 0.0-1.0 based on overall fit
3. Include at least 2 matchReasons per doctor
4. If recommended specialty isn't available, suggest closest alternative
5. urgencyNote should align with the patient's acuity level
6. For emergent cases, note that ER may be more appropriate than scheduled appointment`;
}

export function parseDoctorMatchingResponse(content: string): DoctorMatchingResult {
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("No valid JSON found in doctor matching response");
  }

  const parsed = JSON.parse(jsonMatch[0]);

  if (!parsed.matches || !Array.isArray(parsed.matches)) {
    throw new Error("Invalid doctor matching: missing matches array");
  }

  return {
    matches: parsed.matches.map((m: Record<string, unknown>) => ({
      doctorId: m.doctorId as string,
      matchScore: (m.matchScore as number) || 0.5,
      matchReasons: (m.matchReasons as string[]) || [],
      specialtyRelevance: (m.specialtyRelevance as string) || "",
    })),
    recommendedSpecialty: parsed.recommendedSpecialty || "primary-care",
    urgencyNote: parsed.urgencyNote || "",
    confidence: parsed.confidence || 0.75,
  };
}
