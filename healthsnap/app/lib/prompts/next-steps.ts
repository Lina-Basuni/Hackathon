// ===========================================
// NEXT STEPS PROMPT
// ===========================================

import type {
  RiskAssessmentResult,
  ClinicalSummaryResult,
  NextStepsResult,
} from "../services/ai-analysis.types";

export const NEXT_STEPS_SYSTEM_PROMPT = `You are a patient care navigation AI assistant helping to provide appropriate next-step recommendations based on symptom analysis.

IMPORTANT PRINCIPLES:
1. SAFETY FIRST: When in doubt, recommend more urgent care rather than less
2. PATIENT EMPOWERMENT: Provide clear, actionable instructions patients can follow
3. APPROPRIATE ESCALATION: Always include warning signs that warrant immediate care
4. NO SELF-TREATMENT FOR SERIOUS CONDITIONS: Don't suggest managing concerning symptoms at home
5. CLEAR COMMUNICATION: Use plain language patients can understand

URGENCY TIMEFRAMES:
- "Immediately / Call 911": Life-threatening emergencies
- "Within hours": Urgent symptoms requiring same-day evaluation
- "Within 24 hours": Prompt care needed but not immediately dangerous
- "Within 2-3 days": Soon, but can wait for scheduled appointment
- "Within 1-2 weeks": Routine care, schedule at convenience
- "As needed": Monitor and seek care if worsens

SPECIALIST TYPES (use standard terms):
- primary-care
- cardiology
- pulmonology
- gastroenterology
- neurology
- orthopedics
- dermatology
- endocrinology
- infectious-disease
- psychiatry
- urgent-care
- emergency-medicine`;

export function buildNextStepsPrompt(
  riskAssessment: RiskAssessmentResult,
  clinicalSummary: ClinicalSummaryResult
): string {
  return `Based on the risk assessment and clinical summary, provide appropriate next-step recommendations for the patient.

CHIEF COMPLAINT: ${clinicalSummary.chiefComplaint}

OVERALL ACUITY: ${riskAssessment.overallAcuity}

KEY FINDINGS:
${clinicalSummary.keyFindings.map((f) => `- ${f}`).join("\n")}

RISK FLAGS:
${riskAssessment.riskFlags.map((r) => `- ${r.flag} (${r.severity})`).join("\n")}

${riskAssessment.redFlags.length > 0 ? `RED FLAGS PRESENT:\n${riskAssessment.redFlags.map((r) => `- ${r}`).join("\n")}` : "No immediate red flags identified."}

DIFFERENTIAL CONSIDERATIONS:
${clinicalSummary.differentialConsiderations.map((d) => `- ${d}`).join("\n")}

Generate next-step recommendations in JSON format:

{
  "recommendedAction": "Primary recommendation (e.g., 'Schedule appointment with primary care physician' or 'Seek emergency care immediately')",
  "urgencyTimeframe": "When to take action (use standard timeframes)",
  "reasoning": "Brief explanation of why this level of urgency is recommended",
  "patientInstructions": [
    "Specific action item 1 the patient should do",
    "Specific action item 2",
    "Keep these practical and actionable"
  ],
  "warningSigns": [
    "Symptom that should trigger immediate medical attention",
    "Include specific, recognizable symptoms"
  ],
  "selfCareRecommendations": [
    "Safe self-care measure (only if appropriate for acuity level)",
    "Should not replace medical evaluation for concerning symptoms"
  ],
  "specialistTypeRecommended": "specialty-type or null if primary care sufficient",
  "followUpRecommendation": "When and how to follow up after initial evaluation",
  "confidence": 0.85
}

CRITICAL RULES:
1. For "emergent" acuity: recommendedAction MUST include seeking emergency care
2. For red flags present: urgencyTimeframe MUST be "Immediately" or "Within hours"
3. warningSigns should always include at least 3 specific symptoms
4. selfCareRecommendations should be empty or minimal for high-acuity situations
5. Be specific in patientInstructions (what to bring to appointment, what to track, etc.)`;
}

export function parseNextStepsResponse(content: string): NextStepsResult {
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("No valid JSON found in next steps response");
  }

  const parsed = JSON.parse(jsonMatch[0]);

  if (!parsed.recommendedAction || !parsed.urgencyTimeframe) {
    throw new Error("Invalid next steps: missing required fields");
  }

  return {
    recommendedAction: parsed.recommendedAction,
    urgencyTimeframe: parsed.urgencyTimeframe,
    reasoning: parsed.reasoning || "",
    patientInstructions: parsed.patientInstructions || [],
    warningSigns: parsed.warningSigns || [],
    selfCareRecommendations: parsed.selfCareRecommendations || [],
    specialistTypeRecommended: parsed.specialistTypeRecommended || null,
    followUpRecommendation: parsed.followUpRecommendation || "",
    confidence: parsed.confidence || 0.75,
  };
}
