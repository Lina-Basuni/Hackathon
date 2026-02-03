import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { generateConfirmationCode } from "@/app/components/appointments/types";

// GET - List appointments for a patient
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get("patientId") || "demo-patient";
    const status = searchParams.get("status"); // Optional status filter

    const where: Record<string, unknown> = { patientId };
    if (status) {
      where.status = status;
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        doctor: true,
        timeSlot: true,
        report: {
          select: {
            id: true,
            status: true,
            clinicalSummary: {
              select: {
                chiefComplaint: true,
              },
            },
          },
        },
      },
      orderBy: [
        { timeSlot: { date: "asc" } },
        { timeSlot: { startTime: "asc" } },
      ],
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
        { success: false, error: "Missing required fields: doctorId, timeSlotId, and reason are required" },
        { status: 400 }
      );
    }

    // Check if slot is available (with locking to prevent race conditions)
    const slot = await prisma.timeSlot.findUnique({
      where: { id: timeSlotId },
    });

    if (!slot) {
      return NextResponse.json(
        { success: false, error: "Time slot not found" },
        { status: 404 }
      );
    }

    if (slot.isBooked) {
      return NextResponse.json(
        { success: false, error: "This time slot has already been booked. Please select another time." },
        { status: 409 }
      );
    }

    if (slot.isBlocked) {
      return NextResponse.json(
        { success: false, error: "This time slot is not available" },
        { status: 400 }
      );
    }

    // Verify report exists and is valid if provided
    if (reportId) {
      const report = await prisma.report.findUnique({
        where: { id: reportId },
      });

      if (!report) {
        return NextResponse.json(
          { success: false, error: "Report not found" },
          { status: 404 }
        );
      }
    }

    // Generate unique confirmation code
    let confirmationCode = generateConfirmationCode();
    let attempts = 0;
    while (attempts < 5) {
      const existing = await prisma.appointment.findUnique({
        where: { confirmationCode },
      });
      if (!existing) break;
      confirmationCode = generateConfirmationCode();
      attempts++;
    }

    // Create appointment and mark slot as booked in a transaction
    const appointment = await prisma.$transaction(async (tx) => {
      // Double-check slot availability (race condition protection)
      const currentSlot = await tx.timeSlot.findUnique({
        where: { id: timeSlotId },
      });

      if (!currentSlot || currentSlot.isBooked) {
        throw new Error("SLOT_UNAVAILABLE");
      }

      // Mark slot as booked
      await tx.timeSlot.update({
        where: { id: timeSlotId },
        data: { isBooked: true },
      });

      // Update report status to 'sent' if attached
      if (reportId) {
        await tx.report.update({
          where: { id: reportId },
          data: {
            status: "sent",
            sentToDoctor: doctorId,
            sentAt: new Date(),
          },
        });
      }

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
          confirmationCode,
        },
        include: {
          doctor: true,
          timeSlot: true,
          report: {
            select: {
              id: true,
              status: true,
              clinicalSummary: {
                select: {
                  chiefComplaint: true,
                },
              },
            },
          },
        },
      });
    });

    return NextResponse.json({
      success: true,
      data: appointment,
    });
  } catch (error) {
    console.error("Error creating appointment:", error);

    // Handle specific errors
    if (error instanceof Error && error.message === "SLOT_UNAVAILABLE") {
      return NextResponse.json(
        { success: false, error: "This time slot is no longer available. Please select another time." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to create appointment" },
      { status: 500 }
    );
  }
}
