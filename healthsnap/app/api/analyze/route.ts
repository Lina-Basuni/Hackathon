import { NextRequest, NextResponse } from "next/server";
import { runFullAnalysis, type DoctorForMatching } from "@/app/lib/services/ai-analysis";
import prisma from "@/app/lib/prisma";

// ===========================================
// POST /api/analyze
// Full analysis pipeline: transcript → risk → summary → next steps → doctor matching
// ===========================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      transcript,
      voiceNoteId,
      patientId,
      patientContext,
      includeDoctorMatching = true,
    } = body;

    // Validate required fields
    if (!transcript || typeof transcript !== "string") {
      return NextResponse.json(
        { success: false, error: "Transcript is required" },
        { status: 400 }
      );
    }

    if (transcript.length < 10) {
      return NextResponse.json(
        { success: false, error: "Transcript is too short for analysis" },
        { status: 400 }
      );
    }

    // Check for API key
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { success: false, error: "AI service not configured" },
        { status: 503 }
      );
    }

    // Fetch patient context from database if patientId provided
    let enrichedPatientContext = patientContext;
    if (patientId && !patientContext) {
      const patient = await prisma.patient.findUnique({
        where: { id: patientId },
      });

      if (patient) {
        enrichedPatientContext = {
          name: patient.name,
          age: patient.dateOfBirth
            ? Math.floor(
                (Date.now() - patient.dateOfBirth.getTime()) /
                  (365.25 * 24 * 60 * 60 * 1000)
              )
            : undefined,
          sex: patient.sex || undefined,
          knownConditions: patient.knownConditions
            ? JSON.parse(patient.knownConditions)
            : undefined,
          currentMedications: patient.medications
            ? JSON.parse(patient.medications)
            : undefined,
        };
      }
    }

    // Fetch available doctors for matching
    let availableDoctors: DoctorForMatching[] | undefined;
    if (includeDoctorMatching) {
      const doctors = await prisma.doctor.findMany({
        where: { available: true },
        include: {
          timeSlots: {
            where: {
              isBooked: false,
              datetime: { gte: new Date() },
            },
          },
        },
      });

      availableDoctors = doctors.map((d) => ({
        id: d.id,
        name: d.name,
        specialty: d.specialty,
        yearsExperience: d.yearsExperience,
        rating: d.rating,
        location: d.location || undefined,
        languages: d.languages ? JSON.parse(d.languages) : undefined,
        availableSlots: d.timeSlots.length,
      }));
    }

    // Run the full analysis pipeline
    const result = await runFullAnalysis(
      {
        transcript,
        voiceNoteId,
        patientId,
        patientContext: enrichedPatientContext,
      },
      availableDoctors
    );

    // Save results to database
    if (voiceNoteId && patientId) {
      try {
        await saveAnalysisToDatabase(voiceNoteId, patientId, result);
      } catch (dbError) {
        console.error("Failed to save analysis to database:", dbError);
        // Continue - analysis succeeded, just database save failed
      }
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Analysis API error:", error);

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes("API key")) {
        return NextResponse.json(
          { success: false, error: "AI service authentication failed" },
          { status: 503 }
        );
      }
      if (error.message.includes("rate limit")) {
        return NextResponse.json(
          { success: false, error: "Service temporarily busy. Please try again." },
          { status: 429 }
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Analysis failed",
      },
      { status: 500 }
    );
  }
}

// ===========================================
// SAVE ANALYSIS TO DATABASE
// ===========================================

interface AnalysisResult {
  riskAssessment: {
    riskFlags: unknown[];
    symptomsExtracted: unknown[];
    vitalsMentioned: unknown;
    overallAcuity: string;
    redFlags: string[];
    confidence: number;
  };
  clinicalSummary: {
    chiefComplaint: string;
    summaryText: string;
    keyFindings: string[];
    timeline: string;
    pertinentNegatives: string[];
    confidence: number;
  };
  nextSteps: {
    recommendedAction: string;
    urgencyTimeframe: string;
    reasoning: string;
    patientInstructions: string[];
    warningSigns: string[];
    selfCareRecommendations: string[];
    specialistTypeRecommended: string | null;
    confidence: number;
  };
}

async function saveAnalysisToDatabase(
  voiceNoteId: string,
  patientId: string,
  result: AnalysisResult
) {
  // Create risk assessment
  const riskAssessment = await prisma.riskAssessment.create({
    data: {
      voiceNoteId,
      riskFlags: JSON.stringify(result.riskAssessment.riskFlags),
      symptomsExtracted: JSON.stringify(result.riskAssessment.symptomsExtracted),
      vitalsMentioned: result.riskAssessment.vitalsMentioned
        ? JSON.stringify(result.riskAssessment.vitalsMentioned)
        : null,
      overallAcuity: result.riskAssessment.overallAcuity,
      redFlags: JSON.stringify(result.riskAssessment.redFlags),
      confidence: result.riskAssessment.confidence,
    },
  });

  // Create clinical summary
  const clinicalSummary = await prisma.clinicalSummary.create({
    data: {
      riskAssessmentId: riskAssessment.id,
      chiefComplaint: result.clinicalSummary.chiefComplaint,
      summaryText: result.clinicalSummary.summaryText,
      keyFindings: JSON.stringify(result.clinicalSummary.keyFindings),
      timeline: result.clinicalSummary.timeline,
      pertinentNegatives: JSON.stringify(result.clinicalSummary.pertinentNegatives),
    },
  });

  // Create next steps
  const nextSteps = await prisma.nextSteps.create({
    data: {
      riskAssessmentId: riskAssessment.id,
      recommendedAction: result.nextSteps.recommendedAction,
      urgencyTimeframe: result.nextSteps.urgencyTimeframe,
      reasoning: result.nextSteps.reasoning,
      patientInstructions: JSON.stringify(result.nextSteps.patientInstructions),
      warningSigns: JSON.stringify(result.nextSteps.warningSigns),
      selfCareRecommendations: JSON.stringify(result.nextSteps.selfCareRecommendations),
      specialistTypeRecommended: result.nextSteps.specialistTypeRecommended,
    },
  });

  // Create report
  await prisma.report.create({
    data: {
      patientId,
      riskAssessmentId: riskAssessment.id,
      clinicalSummaryId: clinicalSummary.id,
      nextStepsId: nextSteps.id,
      status: "draft",
    },
  });
}

// ===========================================
// GET /api/analyze (Health Check)
// ===========================================

export async function GET() {
  const hasApiKey = !!process.env.ANTHROPIC_API_KEY;

  return NextResponse.json({
    status: "ok",
    service: "ai-analysis",
    configured: hasApiKey,
    model: "claude-sonnet-4-20250514",
    capabilities: [
      "risk-assessment",
      "clinical-summary",
      "next-steps",
      "doctor-matching",
    ],
  });
}
