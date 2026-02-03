import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/doctors/[id]/slots
// Query params:
//   - startDate: string (ISO date, default today)
//   - endDate: string (ISO date, default 2 weeks from start)
//   - date: string (specific date to filter)
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);

    // Get date range parameters
    const dateParam = searchParams.get("date");
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    // Calculate date range
    let startDate: Date;
    let endDate: Date;

    if (dateParam) {
      // Specific date requested
      startDate = new Date(dateParam);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
    } else {
      // Date range
      startDate = startDateParam ? new Date(startDateParam) : new Date();
      startDate.setHours(0, 0, 0, 0);

      endDate = endDateParam
        ? new Date(endDateParam)
        : new Date(startDate.getTime() + 14 * 24 * 60 * 60 * 1000); // 2 weeks default
    }

    // Verify doctor exists
    const doctor = await prisma.doctor.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        // Note: After running `npx prisma generate`, this will be `available`
        // Using type assertion for forward compatibility with schema update
      },
    });

    if (!doctor) {
      return NextResponse.json(
        { success: false, error: "Doctor not found" },
        { status: 404 }
      );
    }

    // Check availability (handles both old `isAvailable` and new `available` field names)
    const isAvailable = (doctor as Record<string, unknown>).available ??
                        (doctor as Record<string, unknown>).isAvailable ?? true;
    if (!isAvailable) {
      return NextResponse.json({
        success: true,
        data: {
          slots: [],
          doctor: { id: doctor.id, name: doctor.name },
          message: "Doctor is currently not accepting appointments",
        },
      });
    }

    // Fetch available slots
    const slots = await prisma.timeSlot.findMany({
      where: {
        doctorId: id,
        isBooked: false,
        isBlocked: false,
        date: {
          gte: startDate,
          lt: endDate,
        },
      },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    });

    // Filter out past slots for today
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(
      now.getMinutes()
    ).padStart(2, "0")}`;

    const filteredSlots = slots.filter((slot) => {
      const slotDate = new Date(slot.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // If slot is today, check if time hasn't passed
      if (slotDate.getTime() === today.getTime()) {
        return slot.startTime > currentTime;
      }
      return true;
    });

    return NextResponse.json({
      success: true,
      data: {
        slots: filteredSlots,
        doctor: { id: doctor.id, name: doctor.name },
      },
    });
  } catch (error) {
    console.error("Error fetching slots:", error);

    return NextResponse.json(
      { success: false, error: "Failed to fetch time slots" },
      { status: 500 }
    );
  }
}
