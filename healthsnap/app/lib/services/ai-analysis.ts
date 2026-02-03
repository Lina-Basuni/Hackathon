// ===========================================
// AI ANALYSIS ORCHESTRATOR SERVICE
// ===========================================

import Anthropic from "@anthropic-ai/sdk";
import type {
  AnalysisInput,
  FullAnalysisResult,
  RiskAssessmentResult,
  ClinicalSummaryResult,
  NextStepsResult,
  DoctorMatchingResult,
  DoctorForMatching,
  StageMetadata,
  AnalysisMetadata,
} from "./ai-analysis.types";

import {
  RISK_ASSESSMENT_SYSTEM_PROMPT,
  buildRiskAssessmentPrompt,
  parseRiskAssessmentResponse,
} from "../prompts/risk-assessment";

import {
  CLINICAL_SUMMARY_SYSTEM_PROMPT,
  buildClinicalSummaryPrompt,
  parseClinicalSummaryResponse,
} from "../prompts/clinical-summary";

import {
  NEXT_STEPS_SYSTEM_PROMPT,
  buildNextStepsPrompt,
  parseNextStepsResponse,
} from "../prompts/next-steps";

import {
  DOCTOR_MATCHING_SYSTEM_PROMPT,
  buildDoctorMatchingPrompt,
  parseDoctorMatchingResponse,
} from "../prompts/doctor-matching";

// Re-export types
export * from "./ai-analysis.types";

// ===========================================
// CONFIGURATION
// ===========================================

const MODEL = "claude-sonnet-4-20250514";
const MAX_TOKENS = 2000;

// Estimated cost per 1K tokens (Sonnet pricing)
const INPUT_COST_PER_1K = 0.003;
const OUTPUT_COST_PER_1K = 0.015;

// ===========================================
// MAIN ANALYSIS ORCHESTRATOR
// ===========================================

export async function runFullAnalysis(
  input: AnalysisInput,
  availableDoctors?: DoctorForMatching[]
): Promise<FullAnalysisResult> {
  const startTime = Date.now();
  const analysisId = generateAnalysisId();
  const stages: StageMetadata[] = [];
  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  // Initialize Anthropic client
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  try {
    // ===========================================
    // STAGE 1: Risk Assessment
    // ===========================================
    console.log(`[${analysisId}] Starting risk assessment...`);
    const riskStageStart = Date.now();

    const riskAssessment = await runStage<RiskAssessmentResult>(
      anthropic,
      RISK_ASSESSMENT_SYSTEM_PROMPT,
      buildRiskAssessmentPrompt(input.transcript, input.patientContext),
      parseRiskAssessmentResponse
    );

    const riskStageTokens = riskAssessment.usage;
    totalInputTokens += riskStageTokens.input;
    totalOutputTokens += riskStageTokens.output;

    stages.push({
      stage: "risk-assessment",
      tokensUsed: riskStageTokens.input + riskStageTokens.output,
      durationMs: Date.now() - riskStageStart,
      success: true,
    });

    console.log(`[${analysisId}] Risk assessment complete. Acuity: ${riskAssessment.result.overallAcuity}`);

    // ===========================================
    // STAGE 2: Clinical Summary
    // ===========================================
    console.log(`[${analysisId}] Starting clinical summary...`);
    const summaryStageStart = Date.now();

    const clinicalSummary = await runStage<ClinicalSummaryResult>(
      anthropic,
      CLINICAL_SUMMARY_SYSTEM_PROMPT,
      buildClinicalSummaryPrompt(riskAssessment.result, input.transcript),
      parseClinicalSummaryResponse
    );

    const summaryStageTokens = clinicalSummary.usage;
    totalInputTokens += summaryStageTokens.input;
    totalOutputTokens += summaryStageTokens.output;

    stages.push({
      stage: "clinical-summary",
      tokensUsed: summaryStageTokens.input + summaryStageTokens.output,
      durationMs: Date.now() - summaryStageStart,
      success: true,
    });

    console.log(`[${analysisId}] Clinical summary complete.`);

    // ===========================================
    // STAGE 3: Next Steps
    // ===========================================
    console.log(`[${analysisId}] Starting next steps...`);
    const nextStepsStageStart = Date.now();

    const nextSteps = await runStage<NextStepsResult>(
      anthropic,
      NEXT_STEPS_SYSTEM_PROMPT,
      buildNextStepsPrompt(riskAssessment.result, clinicalSummary.result),
      parseNextStepsResponse
    );

    const nextStepsStageTokens = nextSteps.usage;
    totalInputTokens += nextStepsStageTokens.input;
    totalOutputTokens += nextStepsStageTokens.output;

    stages.push({
      stage: "next-steps",
      tokensUsed: nextStepsStageTokens.input + nextStepsStageTokens.output,
      durationMs: Date.now() - nextStepsStageStart,
      success: true,
    });

    console.log(`[${analysisId}] Next steps complete. Urgency: ${nextSteps.result.urgencyTimeframe}`);

    // ===========================================
    // STAGE 4: Doctor Matching (Optional)
    // ===========================================
    let doctorMatching: DoctorMatchingResult | undefined;

    if (availableDoctors && availableDoctors.length > 0) {
      console.log(`[${analysisId}] Starting doctor matching...`);
      const doctorStageStart = Date.now();

      try {
        const doctorResult = await runStage<DoctorMatchingResult>(
          anthropic,
          DOCTOR_MATCHING_SYSTEM_PROMPT,
          buildDoctorMatchingPrompt(riskAssessment.result, nextSteps.result, availableDoctors),
          parseDoctorMatchingResponse
        );

        const doctorStageTokens = doctorResult.usage;
        totalInputTokens += doctorStageTokens.input;
        totalOutputTokens += doctorStageTokens.output;

        stages.push({
          stage: "doctor-matching",
          tokensUsed: doctorStageTokens.input + doctorStageTokens.output,
          durationMs: Date.now() - doctorStageStart,
          success: true,
        });

        doctorMatching = doctorResult.result;
        console.log(`[${analysisId}] Doctor matching complete. ${doctorMatching.matches.length} matches.`);
      } catch (error) {
        // Doctor matching is optional - don't fail the whole analysis
        console.error(`[${analysisId}] Doctor matching failed:`, error);
        stages.push({
          stage: "doctor-matching",
          tokensUsed: 0,
          durationMs: Date.now() - doctorStageStart,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // ===========================================
    // BUILD FINAL RESULT
    // ===========================================
    const totalTokens = totalInputTokens + totalOutputTokens;
    const estimatedCost =
      (totalInputTokens / 1000) * INPUT_COST_PER_1K +
      (totalOutputTokens / 1000) * OUTPUT_COST_PER_1K;

    const metadata: AnalysisMetadata = {
      analysisId,
      timestamp: new Date().toISOString(),
      modelUsed: MODEL,
      totalTokensUsed: totalTokens,
      estimatedCost: Math.round(estimatedCost * 10000) / 10000,
      processingTimeMs: Date.now() - startTime,
      stages,
    };

    console.log(
      `[${analysisId}] Analysis complete. Tokens: ${totalTokens}, Cost: $${metadata.estimatedCost}, Time: ${metadata.processingTimeMs}ms`
    );

    return {
      success: true,
      voiceNoteId: input.voiceNoteId,
      riskAssessment: riskAssessment.result,
      clinicalSummary: clinicalSummary.result,
      nextSteps: nextSteps.result,
      doctorMatching,
      metadata,
      disclaimer: MEDICAL_DISCLAIMER,
    };
  } catch (error) {
    console.error(`[${analysisId}] Analysis failed:`, error);

    throw error;
  }
}

// ===========================================
// STAGE RUNNER
// ===========================================

interface StageResult<T> {
  result: T;
  usage: { input: number; output: number };
}

async function runStage<T>(
  client: Anthropic,
  systemPrompt: string,
  userPrompt: string,
  parser: (content: string) => T,
  retries: number = 2
): Promise<StageResult<T>> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: userPrompt,
          },
        ],
      });

      // Extract text content
      const textContent = response.content.find((c) => c.type === "text");
      if (!textContent || textContent.type !== "text") {
        throw new Error("No text content in response");
      }

      // Parse the response
      const result = parser(textContent.text);

      return {
        result,
        usage: {
          input: response.usage.input_tokens,
          output: response.usage.output_tokens,
        },
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if retryable
      if (isRetryableError(error) && attempt < retries) {
        console.warn(`Stage attempt ${attempt + 1} failed, retrying...`);
        await sleep(1000 * (attempt + 1)); // Exponential backoff
        continue;
      }

      throw lastError;
    }
  }

  throw lastError || new Error("Stage failed after retries");
}

// ===========================================
// UTILITIES
// ===========================================

function generateAnalysisId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `analysis_${timestamp}_${random}`;
}

function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes("rate limit") ||
      message.includes("timeout") ||
      message.includes("overloaded") ||
      message.includes("529") ||
      message.includes("503")
    );
  }
  return false;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ===========================================
// DISCLAIMER
// ===========================================

const MEDICAL_DISCLAIMER = `IMPORTANT DISCLAIMER: This analysis is generated by an AI system and is intended for informational purposes only. It is NOT a medical diagnosis and should NOT replace professional medical advice, diagnosis, or treatment. Always consult with qualified healthcare providers for medical concerns. If you are experiencing a medical emergency, call emergency services (911) immediately.`;
