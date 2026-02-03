import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import type { DoctorWithAvailability, AIRecommendation } from "@/app/components/doctors/types";

// ===========================================
// GET /api/doctors
// Query params:
//   - specialty: string (filter by specialty)
//   - insurance: string (filter by insurance)
//   - language: string (filter by language)
//   - availability: string (today|tomorrow|this-week|next-week)
//   - minRating: number (minimum rating filter)
//   - sortBy: string (best-match|soonest-available|highest-rated|most-experienced)
//   - search: string (search by name/hospital)
//   - reportId: string (to include AI match scores)
//   - page: number (for pagination, default 1)
//   - limit: number (items per page, default 20)
// ===========================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query params
    const specialty = searchParams.get("specialty");
    const insurance = searchParams.get("insurance");
    const language = searchParams.get("language");
    const availability = searchParams.get("availability");
    const minRating = searchParams.get("minRating");
    const sortBy = searchParams.get("sortBy") || "best-match";
    const search = searchParams.get("search");
    const reportId = searchParams.get("reportId");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")));

    // Build where clause
    const where: Record<string, unknown> = {
      available: true,
    };

    // Specialty filter
    if (specialty && specialty !== "all") {
      where.specialty = specialty;
    }

    // Minimum rating filter
    if (minRating && parseFloat(minRating) > 0) {
      where.rating = {
        gte: parseFloat(minRating),
      };
    }

    // Search filter (name or hospital)
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { hospital: { contains: search } },
      ];
    }

    // Get availability date range
    const dateRange = getAvailabilityDateRange(availability);

    // Fetch doctors with time slots
    const doctors = await prisma.doctor.findMany({
      where,
      include: {
        timeSlots: {
          where: {
            isBooked: false,
            isBlocked: false,
            date: dateRange ? {
              gte: dateRange.start,
              lt: dateRange.end,
            } : {
              gte: new Date(),
            },
          },
          orderBy: [
            { date: "asc" },
            { startTime: "asc" },
          ],
          take: 20, // Limit slots for performance
        },
      },
    });

    // Filter and transform doctors
    let transformedDoctors: DoctorWithAvailability[] = doctors
      .map((doctor) => {
        // Parse JSON fields
        const languages: string[] = doctor.languages ? JSON.parse(doctor.languages) : [];
        const acceptedInsurance: string[] = doctor.acceptedInsurance ? JSON.parse(doctor.acceptedInsurance) : [];

        // Filter by language if specified
        if (language && language !== "all") {
          if (!languages.some(l => l.toLowerCase() === language.toLowerCase())) {
            return null;
          }
        }

        // Filter by insurance if specified
        if (insurance && insurance !== "all") {
          if (!acceptedInsurance.some(i => i.toLowerCase().includes(insurance.toLowerCase()))) {
            return null;
          }
        }

        // Filter by availability if specified
        if (availability && availability !== "all" && doctor.timeSlots.length === 0) {
          return null;
        }

        // Compute nextAvailableSlot from date and startTime
        let nextAvailableSlot: Date | null = null;
        if (doctor.timeSlots[0]) {
          const slot = doctor.timeSlots[0];
          nextAvailableSlot = new Date(slot.date);
          // Parse startTime (e.g., "09:00") and apply to date
          const [hours, minutes] = slot.startTime.split(":").map(Number);
          nextAvailableSlot.setHours(hours, minutes, 0, 0);
        }

        return {
          id: doctor.id,
          name: doctor.name,
          specialty: doctor.specialty,
          hospital: doctor.hospital,
          location: doctor.location,
          languages,
          acceptedInsurance,
          rating: doctor.rating,
          yearsExperience: doctor.yearsExperience,
          bio: doctor.bio,
          imageUrl: doctor.imageUrl,
          available: doctor.available,
          nextAvailableSlot,
          availableSlotsCount: doctor.timeSlots.length,
        };
      })
      .filter((d): d is DoctorWithAvailability => d !== null);

    // Fetch AI recommendation if reportId provided
    let aiRecommendation: AIRecommendation | null = null;

    if (reportId) {
      const report = await getReportWithAnalysis(reportId);
      if (report) {
        // Get AI doctor matches from the analysis
        aiRecommendation = await computeAIMatches(transformedDoctors, report);

        // Apply AI match scores to doctors
        if (aiRecommendation) {
          transformedDoctors = transformedDoctors.map((doctor) => {
            const match = aiRecommendation!.matches.find(m => m.doctorId === doctor.id);
            if (match) {
              return {
                ...doctor,
                matchScore: match.matchScore,
                matchReasons: match.matchReasons,
                specialtyRelevance: match.specialtyRelevance,
              };
            }
            return doctor;
          });
        }
      }
    }

    // Sort doctors
    transformedDoctors = sortDoctors(transformedDoctors, sortBy, !!aiRecommendation);

    // Pagination
    const total = transformedDoctors.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const paginatedDoctors = transformedDoctors.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      data: {
        doctors: paginatedDoctors,
        aiRecommendation,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasMore: page < totalPages,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching doctors:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch doctors",
      },
      { status: 500 }
    );
  }
}

// ===========================================
// HELPER FUNCTIONS
// ===========================================

function getAvailabilityDateRange(availability: string | null): { start: Date; end: Date } | null {
  if (!availability || availability === "all") {
    return null;
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (availability) {
    case "today": {
      const endOfDay = new Date(today);
      endOfDay.setDate(endOfDay.getDate() + 1);
      return { start: now, end: endOfDay };
    }
    case "tomorrow": {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfter = new Date(tomorrow);
      dayAfter.setDate(dayAfter.getDate() + 1);
      return { start: tomorrow, end: dayAfter };
    }
    case "this-week": {
      const endOfWeek = new Date(today);
      endOfWeek.setDate(endOfWeek.getDate() + (7 - today.getDay()));
      return { start: now, end: endOfWeek };
    }
    case "next-week": {
      const startOfNextWeek = new Date(today);
      startOfNextWeek.setDate(startOfNextWeek.getDate() + (7 - today.getDay()));
      const endOfNextWeek = new Date(startOfNextWeek);
      endOfNextWeek.setDate(endOfNextWeek.getDate() + 7);
      return { start: startOfNextWeek, end: endOfNextWeek };
    }
    default:
      return null;
  }
}

function sortDoctors(
  doctors: DoctorWithAvailability[],
  sortBy: string,
  hasAIRecommendation: boolean
): DoctorWithAvailability[] {
  const sorted = [...doctors];

  switch (sortBy) {
    case "best-match":
      if (hasAIRecommendation) {
        // Sort by match score (highest first), then by rating
        sorted.sort((a, b) => {
          const scoreA = a.matchScore ?? 0;
          const scoreB = b.matchScore ?? 0;
          if (scoreB !== scoreA) return scoreB - scoreA;
          return b.rating - a.rating;
        });
      } else {
        // Without AI recommendation, sort by rating and experience
        sorted.sort((a, b) => {
          if (b.rating !== a.rating) return b.rating - a.rating;
          return b.yearsExperience - a.yearsExperience;
        });
      }
      break;

    case "soonest-available":
      sorted.sort((a, b) => {
        // Doctors with availability first
        if (!a.nextAvailableSlot && b.nextAvailableSlot) return 1;
        if (a.nextAvailableSlot && !b.nextAvailableSlot) return -1;
        if (!a.nextAvailableSlot && !b.nextAvailableSlot) return 0;
        return new Date(a.nextAvailableSlot!).getTime() - new Date(b.nextAvailableSlot!).getTime();
      });
      break;

    case "highest-rated":
      sorted.sort((a, b) => b.rating - a.rating);
      break;

    case "most-experienced":
      sorted.sort((a, b) => b.yearsExperience - a.yearsExperience);
      break;

    default:
      // Default to rating
      sorted.sort((a, b) => b.rating - a.rating);
  }

  return sorted;
}

interface ReportWithAnalysis {
  chiefComplaint: string;
  overallAcuity: string;
  specialistTypeRecommended: string | null;
  symptomsExtracted: string[];
  urgencyTimeframe: string;
}

async function getReportWithAnalysis(reportId: string): Promise<ReportWithAnalysis | null> {
  try {
    const report = await prisma.report.findUnique({
      where: { id: reportId },
      include: {
        riskAssessment: true,
        clinicalSummary: true,
        nextSteps: true,
      },
    });

    if (!report || !report.clinicalSummary || !report.riskAssessment || !report.nextSteps) {
      return null;
    }

    // Parse symptoms from JSON
    let symptoms: string[] = [];
    try {
      const symptomsData = JSON.parse(report.riskAssessment.symptomsExtracted || "[]");
      symptoms = symptomsData.map((s: { symptom: string }) => s.symptom);
    } catch {
      symptoms = [];
    }

    return {
      chiefComplaint: report.clinicalSummary.chiefComplaint,
      overallAcuity: report.riskAssessment.overallAcuity,
      specialistTypeRecommended: report.nextSteps.specialistTypeRecommended,
      symptomsExtracted: symptoms,
      urgencyTimeframe: report.nextSteps.urgencyTimeframe,
    };
  } catch (error) {
    console.error("Error fetching report:", error);
    return null;
  }
}

async function computeAIMatches(
  doctors: DoctorWithAvailability[],
  report: ReportWithAnalysis
): Promise<AIRecommendation | null> {
  try {
    // Compute match scores based on specialty and other factors
    const recommendedSpecialty = report.specialistTypeRecommended || "primary-care";

    const matches = doctors
      .map((doctor) => {
        let matchScore = 0;
        const matchReasons: string[] = [];

        // Specialty match (40%)
        if (doctor.specialty === recommendedSpecialty) {
          matchScore += 0.4;
          matchReasons.push(`Specialist in ${formatSpecialty(doctor.specialty)}`);
        } else if (doctor.specialty === "primary-care") {
          matchScore += 0.2;
          matchReasons.push("General practice can evaluate initial concerns");
        }

        // Rating score (20%)
        const ratingScore = (doctor.rating / 5) * 0.2;
        matchScore += ratingScore;
        if (doctor.rating >= 4.5) {
          matchReasons.push(`Highly rated (${doctor.rating.toFixed(1)} stars)`);
        }

        // Experience score (15%)
        const expScore = Math.min(doctor.yearsExperience / 20, 1) * 0.15;
        matchScore += expScore;
        if (doctor.yearsExperience >= 10) {
          matchReasons.push(`${doctor.yearsExperience} years of experience`);
        }

        // Availability score (15%)
        if (doctor.nextAvailableSlot) {
          const daysUntilAvailable = Math.ceil(
            (new Date(doctor.nextAvailableSlot).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          );
          if (daysUntilAvailable <= 1) {
            matchScore += 0.15;
            matchReasons.push("Available today or tomorrow");
          } else if (daysUntilAvailable <= 3) {
            matchScore += 0.1;
            matchReasons.push("Available within 3 days");
          } else if (daysUntilAvailable <= 7) {
            matchScore += 0.05;
          }
        }

        // Available slots bonus (10%)
        if (doctor.availableSlotsCount >= 5) {
          matchScore += 0.1;
          matchReasons.push("Multiple appointment times available");
        } else if (doctor.availableSlotsCount > 0) {
          matchScore += 0.05;
        }

        // Determine specialty relevance
        let specialtyRelevance = "Not directly related to your condition";
        if (doctor.specialty === recommendedSpecialty) {
          specialtyRelevance = "Specialist recommended for your symptoms";
        } else if (doctor.specialty === "primary-care") {
          specialtyRelevance = "Can provide initial evaluation and referral if needed";
        }

        return {
          doctorId: doctor.id,
          matchScore: Math.min(matchScore, 1), // Cap at 1.0
          matchReasons: matchReasons.slice(0, 3), // Top 3 reasons
          specialtyRelevance,
        };
      })
      .filter((m) => m.matchScore >= 0.3) // Only include reasonable matches
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 10); // Top 10 matches

    // Build urgency note based on acuity
    let urgencyNote = "Schedule at your convenience";
    if (report.overallAcuity === "emergent") {
      urgencyNote = "Seek immediate medical attention - consider emergency services";
    } else if (report.overallAcuity === "urgent") {
      urgencyNote = report.urgencyTimeframe || "Schedule within 24-48 hours";
    } else {
      urgencyNote = report.urgencyTimeframe || "Schedule within the next week";
    }

    return {
      recommendedSpecialty,
      urgencyNote,
      matches,
    };
  } catch (error) {
    console.error("Error computing AI matches:", error);
    return null;
  }
}

function formatSpecialty(specialty: string): string {
  const specialtyMap: Record<string, string> = {
    "primary-care": "Primary Care",
    "cardiology": "Cardiology",
    "pulmonology": "Pulmonology",
    "gastroenterology": "Gastroenterology",
    "neurology": "Neurology",
    "endocrinology": "Endocrinology",
    "orthopedics": "Orthopedics",
    "dermatology": "Dermatology",
    "psychiatry": "Psychiatry",
    "infectious-disease": "Infectious Disease",
  };
  return specialtyMap[specialty] || specialty;
}
