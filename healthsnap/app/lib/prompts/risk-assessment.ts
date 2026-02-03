// ===========================================
// RISK ASSESSMENT PROMPT
// ===========================================

import type { PatientContext, RiskAssessmentResult } from "../services/ai-analysis.types";

export const RISK_ASSESSMENT_SYSTEM_PROMPT = `You are a clinical decision support AI assistant helping to triage patient symptoms. Your role is to identify potential health risks from patient-reported symptoms to help prioritize care.

IMPORTANT DISCLAIMERS:
- You are NOT making a diagnosis
- You are identifying potential risks that warrant professional medical evaluation
- Always err on the side of caution - when uncertain, flag as higher risk
- Never dismiss concerning symptoms
- This is a screening tool, not a replacement for professional medical evaluation

ACUITY LEVELS:
- "emergent": Potentially life-threatening, needs immediate medical attention (ER/911)
- "urgent": Significant concern requiring prompt evaluation (same-day or next-day care)
- "routine": Can be addressed in scheduled appointment (within 1-2 weeks)

SEVERITY LEVELS for individual risks:
- "critical": Immediately dangerous, could be life-threatening
- "high": Serious concern requiring prompt attention
- "moderate": Notable concern that should be evaluated soon
- "low": Minor concern, monitor and address if persists

RED FLAGS to always escalate:
- Chest pain, especially with shortness of breath or radiating to arm/jaw
- Sudden severe headache ("worst headache of my life")
- Difficulty breathing or severe shortness of breath
- Signs of stroke (face drooping, arm weakness, speech difficulty)
- Severe abdominal pain
- Uncontrolled bleeding
- Loss of consciousness or altered mental status
- Suicidal ideation or self-harm thoughts
- Severe allergic reaction symptoms

Be thorough but conservative. Extract all mentioned symptoms accurately.`;

export function buildRiskAssessmentPrompt(
  transcript: string,
  patientContext?: PatientContext
): string {
  let contextSection = "";

  if (patientContext) {
    const contextParts: string[] = [];

    if (patientContext.age) {
      contextParts.push(`Age: ${patientContext.age} years`);
    }
    if (patientContext.sex) {
      contextParts.push(`Sex: ${patientContext.sex}`);
    }
    if (patientContext.knownConditions?.length) {
      contextParts.push(`Known conditions: ${patientContext.knownConditions.join(", ")}`);
    }
    if (patientContext.currentMedications?.length) {
      const meds = patientContext.currentMedications
        .map((m) => `${m.name}${m.dosage ? ` ${m.dosage}` : ""}`)
        .join(", ");
      contextParts.push(`Current medications: ${meds}`);
    }

    if (contextParts.length > 0) {
      contextSection = `

PATIENT CONTEXT:
${contextParts.join("\n")}`;
    }
  }

  return `Analyze the following patient symptom report and provide a structured risk assessment.
${contextSection}

PATIENT TRANSCRIPT:
"""
${transcript}
"""

Respond with a JSON object containing:

{
  "riskFlags": [
    {
      "flag": "Name of the risk/concern",
      "severity": "low|moderate|high|critical",
      "description": "Brief patient-friendly description",
      "clinicalRationale": "Clinical reasoning for this flag"
    }
  ],
  "symptomsExtracted": [
    {
      "symptom": "Symptom name",
      "duration": "How long (if mentioned)",
      "severity": "Patient-reported severity (if mentioned)",
      "location": "Body location (if applicable)",
      "frequency": "How often (if mentioned)",
      "aggravatingFactors": ["What makes it worse"],
      "relievingFactors": ["What makes it better"]
    }
  ],
  "vitalsMentioned": {
    "bloodPressure": "value or null",
    "heartRate": "value or null",
    "temperature": "value or null",
    "respiratoryRate": "value or null",
    "oxygenSaturation": "value or null",
    "bloodSugar": "value or null",
    "other": {}
  },
  "overallAcuity": "routine|urgent|emergent",
  "redFlags": ["List of any red flag symptoms identified"],
  "confidence": 0.85,
  "reasoning": "Brief explanation of overall assessment and acuity determination"
}

Be thorough in symptom extraction. If vitals aren't mentioned, set vitalsMentioned to null.
If no red flags, return empty array for redFlags.
Confidence should reflect certainty in the assessment (0.0-1.0).`;
}

export function parseRiskAssessmentResponse(content: string): RiskAssessmentResult {
  // Try to parse JSON from response
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("No valid JSON found in risk assessment response");
  }

  const parsed = JSON.parse(jsonMatch[0]);

  // Validate required fields
  if (!parsed.riskFlags || !Array.isArray(parsed.riskFlags)) {
    throw new Error("Invalid risk assessment: missing riskFlags array");
  }
  if (!parsed.symptomsExtracted || !Array.isArray(parsed.symptomsExtracted)) {
    throw new Error("Invalid risk assessment: missing symptomsExtracted array");
  }
  if (!["routine", "urgent", "emergent"].includes(parsed.overallAcuity)) {
    throw new Error("Invalid risk assessment: invalid overallAcuity value");
  }

  return {
    riskFlags: parsed.riskFlags,
    symptomsExtracted: parsed.symptomsExtracted,
    vitalsMentioned: parsed.vitalsMentioned || null,
    overallAcuity: parsed.overallAcuity,
    redFlags: parsed.redFlags || [],
    confidence: parsed.confidence || 0.75,
    reasoning: parsed.reasoning || "",
  };
}
