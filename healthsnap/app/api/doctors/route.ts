import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const specialty = searchParams.get("specialty");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = {
      isAvailable: true,
    };

    if (specialty && specialty !== "all") {
      where.specialty = specialty;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { specialty: { contains: search } },
        { hospital: { contains: search } },
      ];
    }

    const doctors = await prisma.doctor.findMany({
      where,
      orderBy: [{ rating: "desc" }, { experience: "desc" }],
    });

    return NextResponse.json({
      success: true,
      data: doctors,
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
