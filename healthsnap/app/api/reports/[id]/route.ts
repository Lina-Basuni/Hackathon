import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/reports/[id]
// Fetches a complete report with all related data
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const report = await prisma.report.findUnique({
      where: { id },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
            dateOfBirth: true,
            sex: true,
          },
        },
        riskAssessment: {
          include: {
            voiceNote: {
              select: {
                id: true,
                transcript: true,
                duration: true,
                createdAt: true,
              },
            },
          },
        },
        clinicalSummary: true,
        nextSteps: true,
      },
    });

    if (!report) {
      return NextResponse.json(
        {
          success: false,
          error: "Report not found",
        },
        { status: 404 }
      );
    }

    // Parse JSON fields
    const riskFlags = report.riskAssessment
      ? JSON.parse(report.riskAssessment.riskFlags || "[]")
      : [];
    const symptomsExtracted = report.riskAssessment
      ? JSON.parse(report.riskAssessment.symptomsExtracted || "[]")
      : [];
    const vitalsMentioned = report.riskAssessment?.vitalsMentioned
      ? JSON.parse(report.riskAssessment.vitalsMentioned)
      : null;
    const redFlags = report.riskAssessment?.redFlags
      ? JSON.parse(report.riskAssessment.redFlags)
      : [];
    const keyFindings = report.clinicalSummary
      ? JSON.parse(report.clinicalSummary.keyFindings || "[]")
      : [];
    const pertinentNegatives = report.clinicalSummary?.pertinentNegatives
      ? JSON.parse(report.clinicalSummary.pertinentNegatives)
      : [];
    const patientInstructions = report.nextSteps
      ? JSON.parse(report.nextSteps.patientInstructions || "[]")
      : [];
    const warningSigns = report.nextSteps
      ? JSON.parse(report.nextSteps.warningSigns || "[]")
      : [];
    const selfCareRecommendations = report.nextSteps?.selfCareRecommendations
      ? JSON.parse(report.nextSteps.selfCareRecommendations)
      : [];

    // Transform response
    const responseData = {
      id: report.id,
      status: report.status,
      createdAt: report.createdAt,
      sentToDoctor: report.sentToDoctor,
      sentAt: report.sentAt,
      patient: report.patient,
      voiceNote: report.riskAssessment?.voiceNote || null,
      riskAssessment: report.riskAssessment
        ? {
            id: report.riskAssessment.id,
            overallAcuity: report.riskAssessment.overallAcuity,
            confidence: report.riskAssessment.confidence,
            riskFlags,
            symptomsExtracted,
            vitalsMentioned,
            redFlags,
            createdAt: report.riskAssessment.createdAt,
          }
        : null,
      clinicalSummary: report.clinicalSummary
        ? {
            id: report.clinicalSummary.id,
            chiefComplaint: report.clinicalSummary.chiefComplaint,
            summaryText: report.clinicalSummary.summaryText,
            timeline: report.clinicalSummary.timeline,
            keyFindings,
            pertinentNegatives,
            createdAt: report.clinicalSummary.createdAt,
          }
        : null,
      nextSteps: report.nextSteps
        ? {
            id: report.nextSteps.id,
            recommendedAction: report.nextSteps.recommendedAction,
            urgencyTimeframe: report.nextSteps.urgencyTimeframe,
            reasoning: report.nextSteps.reasoning,
            specialistTypeRecommended: report.nextSteps.specialistTypeRecommended,
            patientInstructions,
            warningSigns,
            selfCareRecommendations,
            createdAt: report.nextSteps.createdAt,
          }
        : null,
    };

    return NextResponse.json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error("Error fetching report:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch report",
      },
      { status: 500 }
    );
  }
}
