import Link from "next/link";
import { Calendar, Clock, MapPin, User, FileText, Plus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import prisma from "@/app/lib/prisma";
import { format } from "date-fns";
import { getSpecialtyLabel } from "@/app/lib/utils";

export default async function AppointmentsPage() {
  const appointments = await prisma.appointment.findMany({
    include: {
      doctor: true,
      timeSlot: true,
      report: true,
    },
    orderBy: [
      { timeSlot: { date: "asc" } },
      { timeSlot: { startTime: "asc" } },
    ],
  });

  const upcomingAppointments = appointments.filter(
    (apt) => apt.status === "pending" || apt.status === "confirmed"
  );
  const pastAppointments = appointments.filter(
    (apt) => apt.status === "completed" || apt.status === "cancelled"
  );

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Your Appointments</h1>
          <p className="text-muted-foreground mt-2">
            Manage your healthcare appointments.
          </p>
        </div>
        <Link href="/doctors">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Book New
          </Button>
        </Link>
      </div>

      {appointments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">No Appointments</h3>
            <p className="text-muted-foreground mb-4">
              You haven&apos;t booked any appointments yet.
            </p>
            <Link href="/doctors">
              <Button>Find a Doctor</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Upcoming Appointments */}
          {upcomingAppointments.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-4">Upcoming</h2>
              <div className="space-y-4">
                {upcomingAppointments.map((apt) => (
                  <AppointmentCard key={apt.id} appointment={apt} />
                ))}
              </div>
            </section>
          )}

          {/* Past Appointments */}
          {pastAppointments.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-4 text-muted-foreground">
                Past Appointments
              </h2>
              <div className="space-y-4 opacity-75">
                {pastAppointments.map((apt) => (
                  <AppointmentCard key={apt.id} appointment={apt} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function AppointmentCard({
  appointment,
}: {
  appointment: {
    id: string;
    reason: string;
    status: string;
    type: string;
    doctor: {
      name: string;
      specialty: string;
      hospital: string | null;
      imageUrl: string | null;
    };
    timeSlot: {
      date: Date;
      startTime: string;
      endTime: string;
    };
    report: { id: string } | null;
  };
}) {
  const statusColors: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700",
    confirmed: "bg-green-100 text-green-700",
    completed: "bg-blue-100 text-blue-700",
    cancelled: "bg-gray-100 text-gray-700",
  };

  const typeLabels: Record<string, string> = {
    "in-person": "In-Person",
    video: "Video Call",
    phone: "Phone Call",
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <User className="w-6 h-6 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold">{appointment.doctor.name}</h3>
                <Badge
                  variant="outline"
                  className={statusColors[appointment.status]}
                >
                  {appointment.status.charAt(0).toUpperCase() +
                    appointment.status.slice(1)}
                </Badge>
              </div>
              <p className="text-sm text-primary">
                {getSpecialtyLabel(appointment.doctor.specialty)}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {appointment.reason}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-start md:items-end gap-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              {format(new Date(appointment.timeSlot.date), "EEEE, MMMM d, yyyy")}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-4 h-4" />
              {appointment.timeSlot.startTime} - {appointment.timeSlot.endTime}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{typeLabels[appointment.type]}</Badge>
              {appointment.report && (
                <Link href={`/reports/${appointment.report.id}`}>
                  <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                    <FileText className="w-3 h-3 mr-1" />
                    Report Attached
                  </Badge>
                </Link>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
