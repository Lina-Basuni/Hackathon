"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  User,
  FileText,
  Building2,
  Video,
  Phone,
  Copy,
  Check,
  Loader2,
  AlertCircle,
  CalendarPlus,
  X,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { cn } from "@/app/lib/utils";
import { getSpecialtyLabel } from "@/app/lib/utils";
import { format, addMinutes } from "date-fns";

interface AppointmentData {
  id: string;
  confirmationCode: string | null;
  reason: string;
  type: string;
  status: string;
  notes: string | null;
  createdAt: string;
  doctor: {
    id: string;
    name: string;
    specialty: string;
    hospital: string | null;
    location: string | null;
    imageUrl: string | null;
  };
  timeSlot: {
    date: string;
    startTime: string;
    endTime: string;
    duration: number;
  };
  patient: {
    name: string;
    email: string;
  };
  report?: {
    id: string;
    clinicalSummary?: {
      chiefComplaint: string;
    };
  } | null;
}

export default function BookingConfirmationPage() {
  const params = useParams();
  const router = useRouter();
  const appointmentId = params.id as string;

  const [appointment, setAppointment] = useState<AppointmentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // Fetch appointment details
  const fetchAppointment = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/appointments/${appointmentId}`);
      const data = await response.json();

      if (!data.success || !data.data) {
        throw new Error(data.error || "Appointment not found");
      }

      setAppointment(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load appointment");
    } finally {
      setIsLoading(false);
    }
  }, [appointmentId]);

  useEffect(() => {
    fetchAppointment();
  }, [fetchAppointment]);

  // Copy confirmation code
  const copyConfirmationCode = () => {
    if (appointment?.confirmationCode) {
      navigator.clipboard.writeText(appointment.confirmationCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  // Generate calendar links
  const generateCalendarLinks = () => {
    if (!appointment) return null;

    const startDate = new Date(appointment.timeSlot.date);
    const [hours, minutes] = appointment.timeSlot.startTime.split(":");
    startDate.setHours(parseInt(hours), parseInt(minutes), 0);

    const endDate = addMinutes(startDate, appointment.timeSlot.duration);

    const title = `Appointment with ${appointment.doctor.name}`;
    const description = `Reason: ${appointment.reason}${
      appointment.notes ? `\nNotes: ${appointment.notes}` : ""
    }\nConfirmation: ${appointment.confirmationCode || "N/A"}`;
    const location = appointment.doctor.hospital || appointment.doctor.location || "";

    // Google Calendar
    const googleParams = new URLSearchParams({
      action: "TEMPLATE",
      text: title,
      dates: `${format(startDate, "yyyyMMdd'T'HHmmss")}/${format(endDate, "yyyyMMdd'T'HHmmss")}`,
      details: description,
      location: location,
    });
    const googleUrl = `https://calendar.google.com/calendar/render?${googleParams.toString()}`;

    // Outlook Calendar
    const outlookParams = new URLSearchParams({
      path: "/calendar/action/compose",
      rru: "addevent",
      subject: title,
      startdt: startDate.toISOString(),
      enddt: endDate.toISOString(),
      body: description,
      location: location,
    });
    const outlookUrl = `https://outlook.live.com/calendar/0/deeplink/compose?${outlookParams.toString()}`;

    // ICS file for Apple Calendar
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:${format(startDate, "yyyyMMdd'T'HHmmss")}
DTEND:${format(endDate, "yyyyMMdd'T'HHmmss")}
SUMMARY:${title}
DESCRIPTION:${description.replace(/\n/g, "\\n")}
LOCATION:${location}
END:VEVENT
END:VCALENDAR`;
    const icsBlob = new Blob([icsContent], { type: "text/calendar" });
    const icsUrl = URL.createObjectURL(icsBlob);

    return { googleUrl, outlookUrl, icsUrl };
  };

  // Cancel appointment
  const handleCancel = async () => {
    setIsCancelling(true);
    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error);
      }

      setAppointment(data.data);
      setShowCancelModal(false);
    } catch (err) {
      console.error("Cancel error:", err);
    } finally {
      setIsCancelling(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Video className="w-4 h-4" />;
      case "phone":
        return <Phone className="w-4 h-4" />;
      default:
        return <Building2 className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "video":
        return "Video Call";
      case "phone":
        return "Phone Call";
      default:
        return "In-Person Visit";
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <div className="flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
      </div>
    );
  }

  // Error state
  if (error || !appointment) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-600 font-medium mb-4">{error || "Appointment not found"}</p>
            <Link href="/appointments">
              <Button>View All Appointments</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const calendarLinks = generateCalendarLinks();
  const isCancelled = appointment.status === "cancelled";

  return (
    <div className="max-w-2xl mx-auto">
      {/* Success Header */}
      <div className="text-center mb-8">
        <div
          className={cn(
            "w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4",
            isCancelled ? "bg-slate-100" : "bg-green-100"
          )}
        >
          {isCancelled ? (
            <X className="w-10 h-10 text-slate-500" />
          ) : (
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          )}
        </div>
        <h1 className="text-2xl font-bold text-slate-800">
          {isCancelled ? "Appointment Cancelled" : "Booking Confirmed!"}
        </h1>
        <p className="text-slate-600 mt-2">
          {isCancelled
            ? "This appointment has been cancelled"
            : "Your appointment has been successfully scheduled"}
        </p>
      </div>

      {/* Confirmation Code */}
      {appointment.confirmationCode && !isCancelled && (
        <Card className="mb-6 bg-primary/5 border-primary/20">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Confirmation Number</p>
                <p className="text-2xl font-mono font-bold text-primary">
                  {appointment.confirmationCode}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={copyConfirmationCode}
                className="flex items-center gap-2"
              >
                {copiedCode ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Appointment Details */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Appointment Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Doctor Info */}
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
              {appointment.doctor.imageUrl ? (
                <Image
                  src={appointment.doctor.imageUrl}
                  alt={appointment.doctor.name}
                  width={64}
                  height={64}
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xl font-bold text-slate-400">
                  {appointment.doctor.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
              )}
            </div>
            <div>
              <h3 className="font-semibold text-lg">{appointment.doctor.name}</h3>
              <p className="text-primary text-sm">
                {getSpecialtyLabel(appointment.doctor.specialty)}
              </p>
              {appointment.doctor.hospital && (
                <p className="text-sm text-slate-500 mt-1">
                  {appointment.doctor.hospital}
                </p>
              )}
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <Calendar className="w-5 h-5 text-primary" />
              <div>
                <p className="text-xs text-slate-500">Date</p>
                <p className="font-medium">
                  {format(new Date(appointment.timeSlot.date), "EEEE, MMMM d, yyyy")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <Clock className="w-5 h-5 text-primary" />
              <div>
                <p className="text-xs text-slate-500">Time</p>
                <p className="font-medium">
                  {appointment.timeSlot.startTime} - {appointment.timeSlot.endTime}
                </p>
              </div>
            </div>
          </div>

          {/* Appointment Type */}
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
            {getTypeIcon(appointment.type)}
            <div>
              <p className="text-xs text-slate-500">Appointment Type</p>
              <p className="font-medium">{getTypeLabel(appointment.type)}</p>
            </div>
          </div>

          {/* Reason */}
          <div>
            <p className="text-sm font-medium text-slate-700 mb-1">Reason for Visit</p>
            <p className="text-slate-600">{appointment.reason}</p>
          </div>

          {/* Report Attached */}
          {appointment.report && (
            <div className="flex items-start gap-3 p-3 bg-teal-50 rounded-lg border border-teal-200">
              <FileText className="w-5 h-5 text-teal-600 flex-shrink-0" />
              <div>
                <p className="font-medium text-teal-800">Health Report Attached</p>
                {appointment.report.clinicalSummary?.chiefComplaint && (
                  <p className="text-sm text-teal-600 mt-1">
                    {appointment.report.clinicalSummary.chiefComplaint}
                  </p>
                )}
                <Link
                  href={`/reports/${appointment.report.id}`}
                  className="text-sm text-teal-700 hover:underline mt-2 inline-block"
                >
                  View Full Report →
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add to Calendar */}
      {!isCancelled && calendarLinks && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarPlus className="w-5 h-5" />
              Add to Calendar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <a
                href={calendarLinks.googleUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="sm">
                  Google Calendar
                </Button>
              </a>
              <a
                href={calendarLinks.outlookUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="sm">
                  Outlook
                </Button>
              </a>
              <a href={calendarLinks.icsUrl} download="appointment.ics">
                <Button variant="outline" size="sm">
                  Apple Calendar
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>
      )}

      {/* What to Expect */}
      {!isCancelled && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">What to Expect</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium text-primary">1</span>
                </div>
                <p className="text-sm text-slate-600">
                  Arrive 10-15 minutes early to complete any paperwork
                </p>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium text-primary">2</span>
                </div>
                <p className="text-sm text-slate-600">
                  Bring a valid ID and insurance card (if applicable)
                </p>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium text-primary">3</span>
                </div>
                <p className="text-sm text-slate-600">
                  Prepare a list of questions or concerns you&apos;d like to discuss
                </p>
              </li>
              {appointment.report && (
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-teal-600" />
                  </div>
                  <p className="text-sm text-slate-600">
                    Your health report will be shared with the doctor before your visit
                  </p>
                </li>
              )}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link href="/appointments" className="flex-1">
          <Button variant="outline" className="w-full">
            View All Appointments
          </Button>
        </Link>
        {!isCancelled && (
          <Button
            variant="outline"
            className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => setShowCancelModal(true)}
          >
            Cancel Appointment
          </Button>
        )}
        <Link href="/" className="flex-1">
          <Button className="w-full">Back to Home</Button>
        </Link>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowCancelModal(false)}
          />
          <Card className="relative max-w-md w-full">
            <CardContent className="pt-6">
              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-6 h-6 text-amber-600" />
                </div>
                <h3 className="text-lg font-semibold">Cancel Appointment?</h3>
                <p className="text-sm text-slate-600 mt-2">
                  Are you sure you want to cancel this appointment? This action
                  cannot be undone.
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowCancelModal(false)}
                  disabled={isCancelling}
                >
                  Keep Appointment
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={handleCancel}
                  disabled={isCancelling}
                >
                  {isCancelling ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Yes, Cancel"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
