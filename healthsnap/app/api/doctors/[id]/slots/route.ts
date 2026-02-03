import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get("date");

    const where: Record<string, unknown> = {
      doctorId: id,
      isBooked: false,
      isBlocked: false,
    };

    if (dateStr) {
      const date = new Date(dateStr);
      date.setHours(0, 0, 0, 0);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      where.date = {
        gte: date,
        lt: nextDay,
      };
    } else {
      // Default to future slots
      where.date = {
        gte: new Date(),
      };
    }

    const slots = await prisma.timeSlot.findMany({
      where,
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
      take: 50,
    });

    return NextResponse.json({
      success: true,
      data: slots,
    });
  } catch (error) {
    console.error("Error fetching slots:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch time slots",
      },
      { status: 500 }
    );
  }
}
