import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

// GET - List appointments for a patient
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get("patientId") || "demo-patient";

    const appointments = await prisma.appointment.findMany({
      where: { patientId },
      include: {
        doctor: true,
        timeSlot: true,
        report: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: appointments,
    });
  } catch (error) {
    console.error("Error fetching appointments:", error);

    return NextResponse.json(
      { success: false, error: "Failed to fetch appointments" },
      { status: 500 }
    );
  }
}

// POST - Create new appointment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { patientId, doctorId, timeSlotId, reportId, reason, type, notes } = body;

    // Validate required fields
    if (!doctorId || !timeSlotId || !reason) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if slot is available
    const slot = await prisma.timeSlot.findUnique({
      where: { id: timeSlotId },
    });

    if (!slot || slot.isBooked || slot.isBlocked) {
      return NextResponse.json(
        { success: false, error: "Time slot is not available" },
        { status: 400 }
      );
    }

    // Create appointment and mark slot as booked in a transaction
    const appointment = await prisma.$transaction(async (tx) => {
      // Mark slot as booked
      await tx.timeSlot.update({
        where: { id: timeSlotId },
        data: { isBooked: true },
      });

      // Create appointment
      return tx.appointment.create({
        data: {
          patientId: patientId || "demo-patient",
          doctorId,
          timeSlotId,
          reportId: reportId || null,
          reason,
          type: type || "in-person",
          notes: notes || null,
          status: "pending",
        },
        include: {
          doctor: true,
          timeSlot: true,
        },
      });
    });

    return NextResponse.json({
      success: true,
      data: appointment,
    });
  } catch (error) {
    console.error("Error creating appointment:", error);

    return NextResponse.json(
      { success: false, error: "Failed to create appointment" },
      { status: 500 }
    );
  }
}
