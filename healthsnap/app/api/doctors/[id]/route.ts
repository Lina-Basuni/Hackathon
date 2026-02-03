import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/doctors/[id] - Get doctor profile with reviews
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const doctor = await prisma.doctor.findUnique({
      where: { id },
      include: {
        reviews: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!doctor) {
      return NextResponse.json(
        { success: false, error: "Doctor not found" },
        { status: 404 }
      );
    }

    // Parse JSON fields
    const languages: string[] = doctor.languages
      ? JSON.parse(doctor.languages)
      : [];
    const acceptedInsurance: string[] = doctor.acceptedInsurance
      ? JSON.parse(doctor.acceptedInsurance)
      : [];
    const education = doctor.education
      ? JSON.parse(doctor.education)
      : [];
    const certifications: string[] = doctor.certifications
      ? JSON.parse(doctor.certifications)
      : [];

    // Transform response
    const doctorProfile = {
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
      education,
      certifications,
      available: (doctor as Record<string, unknown>).available ??
                 (doctor as Record<string, unknown>).isAvailable ?? true,
      reviews: doctor.reviews.map((review) => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        author: review.author,
        createdAt: review.createdAt,
      })),
    };

    return NextResponse.json({
      success: true,
      data: doctorProfile,
    });
  } catch (error) {
    console.error("Error fetching doctor:", error);

    return NextResponse.json(
      { success: false, error: "Failed to fetch doctor profile" },
      { status: 500 }
    );
  }
}
