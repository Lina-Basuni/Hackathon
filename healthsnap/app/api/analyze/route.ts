import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import prisma from "@/app/lib/prisma";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const ANALYSIS_PROMPT = `You are a medical AI assistant helping to analyze patient symptom descriptions.
Analyze the following patient transcript and provide a structured risk assessment.

IMPORTANT: This is for informational purposes only and NOT a medical diagnosis. Always recommend professional medical consultation.

Based on the transcript, provide:
1. Risk flags (potential health concerns with severity levels)
2. Clinical summary (professional summary for healthcare providers)
3. Patient-friendly summary (easy to understand explanation)
4. Recommended actions with priority and timeframe
5. Suggested medical specialties that may be relevant

Respond in the following JSON format ONLY (no markdown, no code blocks):
{
  "riskFlags": [
    {
      "name": "flag name",
      "severity": "low|moderate|high|critical",
      "description": "brief description",
      "indicators": ["symptom1", "symptom2"]
    }
  ],
  "overallRisk": "low|moderate|high|critical",
  "clinicalSummary": "professional clinical summary",
  "patientSummary": "patient-friendly explanation",
  "recommendedActions": [
    {
      "action": "action description",
      "priority": "immediate|soon|routine",
      "timeframe": "timeframe description"
    }
  ],
  "suggestedSpecialties": ["specialty1", "specialty2"],
  "confidenceScore": 75
}`;

export async function POST(request: NextRequest) {
  try {
    const { voiceNoteId, transcript } = await request.json();

    if (!transcript) {
      return NextResponse.json(
        { success: false, error: "Transcript is required" },
        { status: 400 }
      );
    }

    // Update voice note status
    if (voiceNoteId) {
      await prisma.voiceNote.update({
        where: { id: voiceNoteId },
        data: { status: "analyzing" },
      });
    }

    // Call Claude API for analysis
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: `${ANALYSIS_PROMPT}\n\nPatient Transcript:\n"${transcript}"`,
        },
      ],
    });

    // Extract text content from response
    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Parse the JSON response
    let analysis;
    try {
      analysis = JSON.parse(responseText);
    } catch {
      // Try to extract JSON from response if it has markdown code blocks
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Failed to parse AI response");
      }
    }

    // Save risk assessment to database
    if (voiceNoteId) {
      await prisma.riskAssessment.create({
        data: {
          voiceNoteId,
          riskFlags: JSON.stringify(analysis.riskFlags),
          overallRisk: analysis.overallRisk,
          clinicalSummary: analysis.clinicalSummary,
          patientSummary: analysis.patientSummary,
          recommendedActions: JSON.stringify(analysis.recommendedActions),
          suggestedSpecialties: JSON.stringify(analysis.suggestedSpecialties),
          confidenceScore: analysis.confidenceScore || 75,
          rawResponse: responseText,
        },
      });

      // Update voice note status
      await prisma.voiceNote.update({
        where: { id: voiceNoteId },
        data: { status: "completed" },
      });
    }

    return NextResponse.json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    console.error("Analysis error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Analysis failed",
      },
      { status: 500 }
    );
  }
}
