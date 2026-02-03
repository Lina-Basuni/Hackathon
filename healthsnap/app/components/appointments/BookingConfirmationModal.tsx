"use client";

import { useState } from "react";
import Image from "next/image";
import {
  X,
  Calendar,
  Clock,
  MapPin,
  FileText,
  Building2,
  Video,
  Phone,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Checkbox } from "@/app/components/ui/checkbox";
import { cn } from "@/app/lib/utils";
import { getSpecialtyLabel } from "@/app/lib/utils";
import {
  type TimeSlot,
  type DoctorProfile,
  type AppointmentType,
  APPOINTMENT_TYPES,
  formatTimeSlot,
} from "./types";
import { format } from "date-fns";

interface BookingConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: {
    reason: string;
    type: AppointmentType;
    notes: string;
  }) => Promise<void>;
  doctor: DoctorProfile;
  selectedSlot: TimeSlot;
  reportId?: string;
  reportSummary?: {
    chiefComplaint: string;
    acuity: string;
  };
}

export function BookingConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  doctor,
  selectedSlot,
  reportId,
  reportSummary,
}: BookingConfirmationModalProps) {
  const [appointmentType, setAppointmentType] =
    useState<AppointmentType>("in-person");
  const [reason, setReason] = useState(reportSummary?.chiefComplaint || "");
  const [notes, setNotes] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!reason.trim()) {
      setError("Please provide a reason for your visit");
      return;
    }
    if (!agreedToTerms) {
      setError("Please agree to the terms and conditions");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await onConfirm({
        reason: reason.trim(),
        type: appointmentType,
        notes: notes.trim(),
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to book appointment"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTypeIcon = (type: AppointmentType) => {
    switch (type) {
      case "in-person":
        return <Building2 className="w-4 h-4" />;
      case "video":
        return <Video className="w-4 h-4" />;
      case "phone":
        return <Phone className="w-4 h-4" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b bg-white rounded-t-2xl">
          <h2 className="text-xl font-semibold text-slate-800">
            Confirm Booking
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Doctor Summary */}
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
              {doctor.imageUrl ? (
                <Image
                  src={doctor.imageUrl}
                  alt={doctor.name}
                  width={64}
                  height={64}
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xl font-bold text-slate-400">
                  {doctor.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
              )}
            </div>
            <div>
              <h3 className="font-semibold text-lg text-slate-800">
                {doctor.name}
              </h3>
              <p className="text-primary font-medium text-sm">
                {getSpecialtyLabel(doctor.specialty)}
              </p>
              {doctor.hospital && (
                <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                  <MapPin className="w-3 h-3" />
                  {doctor.hospital}
                </p>
              )}
            </div>
          </div>

          {/* Selected Time */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800">
                    {format(new Date(selectedSlot.date), "EEEE, MMMM d, yyyy")}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Clock className="w-4 h-4" />
                    {formatTimeSlot(selectedSlot.startTime, selectedSlot.endTime)}
                    <Badge variant="secondary" className="text-xs">
                      {selectedSlot.duration} min
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Report Attachment */}
          {reportId && reportSummary && (
            <Card className="bg-teal-50 border-teal-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-teal-800">
                      Health Report Attached
                    </p>
                    <p className="text-sm text-teal-600 mt-1">
                      Your health report will be automatically shared with the
                      doctor for this appointment.
                    </p>
                    <div className="mt-2 p-2 bg-white/50 rounded-lg">
                      <p className="text-xs text-teal-700">
                        <span className="font-medium">Chief Complaint:</span>{" "}
                        {reportSummary.chiefComplaint}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Appointment Type */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Appointment Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {APPOINTMENT_TYPES.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setAppointmentType(type.value)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-3 rounded-lg border transition-all",
                    appointmentType === type.value
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-slate-200 hover:border-slate-300"
                  )}
                >
                  {getTypeIcon(type.value)}
                  <span className="text-xs font-medium">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Reason for Visit */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Reason for Visit <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Briefly describe the reason for your visit..."
              rows={2}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Additional Notes for Doctor (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional information you'd like the doctor to know..."
              rows={2}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          {/* Terms Agreement */}
          <label className="flex items-start gap-3 cursor-pointer">
            <Checkbox
              checked={agreedToTerms}
              onCheckedChange={(checked) =>
                setAgreedToTerms(checked as boolean)
              }
              className="mt-1"
            />
            <span className="text-sm text-slate-600">
              I agree to the{" "}
              <a href="#" className="text-primary hover:underline">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="text-primary hover:underline">
                Privacy Policy
              </a>
              . I understand that this appointment may be subject to
              cancellation fees if not cancelled 24 hours in advance.
            </span>
          </label>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !agreedToTerms || !reason.trim()}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Booking...
                </>
              ) : (
                "Confirm Booking"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
