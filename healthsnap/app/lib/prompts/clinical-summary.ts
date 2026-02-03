// ===========================================
// CLINICAL SUMMARY PROMPT
// ===========================================

import type { RiskAssessmentResult, ClinicalSummaryResult } from "../services/ai-analysis.types";

export const CLINICAL_SUMMARY_SYSTEM_PROMPT = `You are a clinical documentation AI assistant helping to create concise, professional summaries of patient symptom reports for healthcare providers.

Your summaries should:
- Be written in professional clinical language
- Follow standard medical documentation conventions
- Be concise yet comprehensive
- Highlight clinically relevant information
- Include pertinent negatives when important
- Note timeline and progression of symptoms
- Be objective and factual

IMPORTANT:
- This is a preliminary summary based on patient self-report
- Should not be used as sole basis for clinical decisions
- Healthcare provider should conduct their own assessment`;

export function buildClinicalSummaryPrompt(
  riskAssessment: RiskAssessmentResult,
  transcript: string
): string {
  const symptomsFormatted = riskAssessment.symptomsExtracted
    .map((s) => {
      let desc = s.symptom;
      if (s.duration) desc += ` (${s.duration})`;
      if (s.severity) desc += ` - ${s.severity}`;
      if (s.location) desc += ` in ${s.location}`;
      return `- ${desc}`;
    })
    .join("\n");

  const risksFormatted = riskAssessment.riskFlags
    .map((r) => `- ${r.flag} (${r.severity}): ${r.clinicalRationale}`)
    .join("\n");

  return `Based on the patient symptom report and risk assessment, create a professional clinical summary.

ORIGINAL TRANSCRIPT:
"""
${transcript}
"""

EXTRACTED SYMPTOMS:
${symptomsFormatted}

IDENTIFIED RISKS:
${risksFormatted}

OVERALL ACUITY: ${riskAssessment.overallAcuity}
${riskAssessment.redFlags.length > 0 ? `RED FLAGS: ${riskAssessment.redFlags.join(", ")}` : ""}

Generate a clinical summary in JSON format:

{
  "chiefComplaint": "Primary reason for visit in standard CC format (e.g., '3-day history of persistent headache')",
  "summaryText": "2-3 paragraph professional clinical summary suitable for a healthcare provider. Include HPI-style narrative.",
  "keyFindings": [
    "Important clinical finding 1",
    "Important clinical finding 2"
  ],
  "timeline": "Description of symptom onset and progression",
  "pertinentNegatives": [
    "Relevant symptoms patient denied or didn't mention that would be clinically significant"
  ],
  "differentialConsiderations": [
    "Condition that should be considered based on presentation"
  ],
  "confidence": 0.85
}

GUIDELINES:
- chiefComplaint should be concise (one line)
- summaryText should be professional but readable
- keyFindings should be specific and actionable
- pertinentNegatives are symptoms NOT reported that would change clinical thinking
- differentialConsiderations are NOT diagnoses, just conditions to consider
- confidence reflects completeness of available information`;
}

export function parseClinicalSummaryResponse(content: string): ClinicalSummaryResult {
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("No valid JSON found in clinical summary response");
  }

  const parsed = JSON.parse(jsonMatch[0]);

  if (!parsed.chiefComplaint || !parsed.summaryText) {
    throw new Error("Invalid clinical summary: missing required fields");
  }

  return {
    chiefComplaint: parsed.chiefComplaint,
    summaryText: parsed.summaryText,
    keyFindings: parsed.keyFindings || [],
    timeline: parsed.timeline || "",
    pertinentNegatives: parsed.pertinentNegatives || [],
    differentialConsiderations: parsed.differentialConsiderations || [],
    confidence: parsed.confidence || 0.75,
  };
}
