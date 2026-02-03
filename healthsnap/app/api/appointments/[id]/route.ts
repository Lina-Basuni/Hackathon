import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/appointments/[id] - Get appointment details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        doctor: true,
        timeSlot: true,
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        report: {
          select: {
            id: true,
            status: true,
            clinicalSummary: {
              select: {
                chiefComplaint: true,
                summaryText: true,
              },
            },
            riskAssessment: {
              select: {
                overallAcuity: true,
              },
            },
          },
        },
      },
    });

    if (!appointment) {
      return NextResponse.json(
        { success: false, error: "Appointment not found" },
        { status: 404 }
      );
    }

    // Parse doctor JSON fields
    const doctorData = {
      ...appointment.doctor,
      languages: appointment.doctor.languages
        ? JSON.parse(appointment.doctor.languages)
        : [],
      acceptedInsurance: appointment.doctor.acceptedInsurance
        ? JSON.parse(appointment.doctor.acceptedInsurance)
        : [],
    };

    return NextResponse.json({
      success: true,
      data: {
        ...appointment,
        doctor: doctorData,
      },
    });
  } catch (error) {
    console.error("Error fetching appointment:", error);

    return NextResponse.json(
      { success: false, error: "Failed to fetch appointment" },
      { status: 500 }
    );
  }
}

// PATCH /api/appointments/[id] - Update appointment (cancel, reschedule, etc.)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, notes, newTimeSlotId } = body;

    // Fetch current appointment
    const currentAppointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        timeSlot: true,
      },
    });

    if (!currentAppointment) {
      return NextResponse.json(
        { success: false, error: "Appointment not found" },
        { status: 404 }
      );
    }

    // Handle cancellation
    if (status === "cancelled") {
      const appointment = await prisma.$transaction(async (tx) => {
        // Free up the time slot
        await tx.timeSlot.update({
          where: { id: currentAppointment.timeSlotId },
          data: { isBooked: false },
        });

        // Update appointment status
        return tx.appointment.update({
          where: { id },
          data: {
            status: "cancelled",
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
        message: "Appointment cancelled successfully",
      });
    }

    // Handle rescheduling
    if (newTimeSlotId) {
      // Check new slot availability
      const newSlot = await prisma.timeSlot.findUnique({
        where: { id: newTimeSlotId },
      });

      if (!newSlot || newSlot.isBooked || newSlot.isBlocked) {
        return NextResponse.json(
          { success: false, error: "New time slot is not available" },
          { status: 400 }
        );
      }

      const appointment = await prisma.$transaction(async (tx) => {
        // Free up old time slot
        await tx.timeSlot.update({
          where: { id: currentAppointment.timeSlotId },
          data: { isBooked: false },
        });

        // Book new time slot
        await tx.timeSlot.update({
          where: { id: newTimeSlotId },
          data: { isBooked: true },
        });

        // Update appointment
        return tx.appointment.update({
          where: { id },
          data: {
            timeSlotId: newTimeSlotId,
            status: "pending", // Reset to pending after reschedule
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
        message: "Appointment rescheduled successfully",
      });
    }

    // Handle other updates (notes, status changes)
    const updateData: Record<string, unknown> = {};
    if (status && ["pending", "confirmed", "completed"].includes(status)) {
      updateData.status = status;
    }
    if (notes !== undefined) {
      updateData.notes = notes;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: "No valid update fields provided" },
        { status: 400 }
      );
    }

    const appointment = await prisma.appointment.update({
      where: { id },
      data: updateData,
      include: {
        doctor: true,
        timeSlot: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: appointment,
    });
  } catch (error) {
    console.error("Error updating appointment:", error);

    return NextResponse.json(
      { success: false, error: "Failed to update appointment" },
      { status: 500 }
    );
  }
}

// DELETE /api/appointments/[id] - Delete appointment (admin only, or use PATCH to cancel)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const appointment = await prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment) {
      return NextResponse.json(
        { success: false, error: "Appointment not found" },
        { status: 404 }
      );
    }

    // Delete appointment and free up slot in a transaction
    await prisma.$transaction(async (tx) => {
      // Free up the time slot
      await tx.timeSlot.update({
        where: { id: appointment.timeSlotId },
        data: { isBooked: false },
      });

      // Delete the appointment
      await tx.appointment.delete({
        where: { id },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Appointment deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting appointment:", error);

    return NextResponse.json(
      { success: false, error: "Failed to delete appointment" },
      { status: 500 }
    );
  }
}
