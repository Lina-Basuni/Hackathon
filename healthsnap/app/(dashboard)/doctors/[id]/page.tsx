"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Star,
  MapPin,
  Award,
  Languages,
  Shield,
  Building2,
  GraduationCap,
  BadgeCheck,
  Calendar,
  Loader2,
  AlertCircle,
  Clock,
  Quote,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { cn } from "@/app/lib/utils";
import { getSpecialtyLabel } from "@/app/lib/utils";
import { TimeSlotSelector } from "@/app/components/appointments/TimeSlotSelector";
import { BookingConfirmationModal } from "@/app/components/appointments/BookingConfirmationModal";
import {
  type TimeSlot,
  type DoctorProfile,
  type AppointmentType,
} from "@/app/components/appointments/types";
import { format } from "date-fns";

interface DoctorApiResponse {
  success: boolean;
  data?: DoctorProfile;
  error?: string;
}

interface SlotsApiResponse {
  success: boolean;
  data?: {
    slots: TimeSlot[];
    doctor: { id: string; name: string };
  };
  error?: string;
}

interface ReportSummary {
  chiefComplaint: string;
  acuity: string;
}

export default function DoctorProfilePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const doctorId = params.id as string;
  const reportId = searchParams.get("reportId");

  // State
  const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [reportSummary, setReportSummary] = useState<ReportSummary | null>(null);
  const [isLoadingDoctor, setIsLoadingDoctor] = useState(true);
  const [isLoadingSlots, setIsLoadingSlots] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"slots" | "reviews">("slots");

  // Fetch doctor profile
  const fetchDoctor = useCallback(async () => {
    try {
      setIsLoadingDoctor(true);
      const response = await fetch(`/api/doctors/${doctorId}`);
      const data: DoctorApiResponse = await response.json();

      if (!data.success || !data.data) {
        throw new Error(data.error || "Failed to fetch doctor");
      }

      setDoctor(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load doctor");
    } finally {
      setIsLoadingDoctor(false);
    }
  }, [doctorId]);

  // Fetch available slots
  const fetchSlots = useCallback(async () => {
    try {
      setIsLoadingSlots(true);
      const response = await fetch(`/api/doctors/${doctorId}/slots`);
      const data: SlotsApiResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch slots");
      }

      setSlots(data.data?.slots || []);
    } catch (err) {
      console.error("Error fetching slots:", err);
      setSlots([]);
    } finally {
      setIsLoadingSlots(false);
    }
  }, [doctorId]);

  // Fetch report summary if reportId provided
  const fetchReportSummary = useCallback(async () => {
    if (!reportId) return;

    try {
      const response = await fetch(`/api/reports/${reportId}`);
      const data = await response.json();

      if (data.success && data.data?.clinicalSummary) {
        setReportSummary({
          chiefComplaint: data.data.clinicalSummary.chiefComplaint,
          acuity: data.data.riskAssessment?.overallAcuity || "routine",
        });
      }
    } catch (err) {
      console.error("Error fetching report:", err);
    }
  }, [reportId]);

  // Initial data fetch
  useEffect(() => {
    fetchDoctor();
    fetchSlots();
    fetchReportSummary();
  }, [fetchDoctor, fetchSlots, fetchReportSummary]);

  // Handle booking confirmation
  const handleBookingConfirm = async (data: {
    reason: string;
    type: AppointmentType;
    notes: string;
  }) => {
    if (!selectedSlot || !doctor) return;

    const response = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        doctorId: doctor.id,
        timeSlotId: selectedSlot.id,
        reportId: reportId || undefined,
        reason: data.reason,
        type: data.type,
        notes: data.notes || undefined,
      }),
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || "Failed to book appointment");
    }

    // Redirect to confirmation page
    router.push(`/appointments/${result.data.id}/confirmation`);
  };

  // Loading state
  if (isLoadingDoctor) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
      </div>
    );
  }

  // Error state
  if (error || !doctor) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-600 font-medium mb-2">
              Unable to load doctor profile
            </p>
            <p className="text-red-500 text-sm mb-4">{error}</p>
            <Link href="/doctors">
              <Button variant="outline">Back to Doctors</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back Button */}
      <Link
        href={reportId ? `/doctors?reportId=${reportId}` : "/doctors"}
        className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to doctors
      </Link>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Doctor Header Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-6">
                {/* Photo */}
                <div className="flex-shrink-0">
                  <div className="w-32 h-32 rounded-2xl overflow-hidden bg-slate-100">
                    {doctor.imageUrl ? (
                      <Image
                        src={doctor.imageUrl}
                        alt={doctor.name}
                        width={128}
                        height={128}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-slate-400">
                        {doctor.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-slate-800">
                    {doctor.name}
                  </h1>
                  <p className="text-primary font-medium text-lg">
                    {getSpecialtyLabel(doctor.specialty)}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 mt-3">
                    <div className="flex items-center gap-1">
                      <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                      <span className="font-semibold">{doctor.rating.toFixed(1)}</span>
                      <span className="text-slate-500 text-sm">
                        ({doctor.reviews?.length || 0} reviews)
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-600">
                      <Award className="w-4 h-4" />
                      <span>{doctor.yearsExperience} years experience</span>
                    </div>
                  </div>

                  {doctor.hospital && (
                    <div className="flex items-center gap-2 mt-3 text-slate-600">
                      <Building2 className="w-4 h-4" />
                      <span>{doctor.hospital}</span>
                    </div>
                  )}

                  {doctor.location && (
                    <div className="flex items-center gap-2 mt-1 text-slate-600">
                      <MapPin className="w-4 h-4" />
                      <span>{doctor.location}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bio */}
          {doctor.bio && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">About</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 leading-relaxed">{doctor.bio}</p>
              </CardContent>
            </Card>
          )}

          {/* Education & Certifications */}
          {(doctor.education?.length > 0 || doctor.certifications?.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Education & Credentials</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {doctor.education?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-slate-700 flex items-center gap-2 mb-2">
                      <GraduationCap className="w-4 h-4" />
                      Education
                    </h4>
                    <ul className="space-y-1">
                      {doctor.education.map((edu, i) => (
                        <li key={i} className="text-sm text-slate-600">
                          {edu.degree} - {edu.institution} ({edu.year})
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {doctor.certifications?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-slate-700 flex items-center gap-2 mb-2">
                      <BadgeCheck className="w-4 h-4" />
                      Certifications
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {doctor.certifications.map((cert, i) => (
                        <Badge key={i} variant="secondary">
                          {cert}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Tabs: Time Slots / Reviews */}
          <Card>
            <div className="border-b">
              <div className="flex">
                <button
                  onClick={() => setActiveTab("slots")}
                  className={cn(
                    "flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                    activeTab === "slots"
                      ? "border-primary text-primary"
                      : "border-transparent text-slate-500 hover:text-slate-700"
                  )}
                >
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Book Appointment
                </button>
                <button
                  onClick={() => setActiveTab("reviews")}
                  className={cn(
                    "flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                    activeTab === "reviews"
                      ? "border-primary text-primary"
                      : "border-transparent text-slate-500 hover:text-slate-700"
                  )}
                >
                  <Star className="w-4 h-4 inline mr-2" />
                  Reviews ({doctor.reviews?.length || 0})
                </button>
              </div>
            </div>

            <CardContent className="p-6">
              {activeTab === "slots" && (
                <TimeSlotSelector
                  slots={slots}
                  selectedSlot={selectedSlot}
                  onSlotSelect={setSelectedSlot}
                  isLoading={isLoadingSlots}
                />
              )}

              {activeTab === "reviews" && (
                <div className="space-y-4">
                  {doctor.reviews && doctor.reviews.length > 0 ? (
                    doctor.reviews.map((review) => (
                      <div
                        key={review.id}
                        className="p-4 bg-slate-50 rounded-lg"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-slate-800">
                            {review.author}
                          </span>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={cn(
                                  "w-4 h-4",
                                  i < review.rating
                                    ? "text-amber-500 fill-amber-500"
                                    : "text-slate-300"
                                )}
                              />
                            ))}
                          </div>
                        </div>
                        {review.comment && (
                          <p className="text-sm text-slate-600 flex items-start gap-2">
                            <Quote className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                            {review.comment}
                          </p>
                        )}
                        <p className="text-xs text-slate-400 mt-2">
                          {format(new Date(review.createdAt), "MMMM d, yyyy")}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Star className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500">No reviews yet</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Info Card */}
          <Card className="sticky top-24">
            <CardContent className="p-5 space-y-4">
              {/* Languages */}
              {doctor.languages && doctor.languages.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-slate-700 flex items-center gap-2 mb-2">
                    <Languages className="w-4 h-4" />
                    Languages
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {doctor.languages.map((lang) => (
                      <Badge key={lang} variant="outline" className="text-xs">
                        {lang}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Insurance */}
              {doctor.acceptedInsurance && doctor.acceptedInsurance.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-slate-700 flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4" />
                    Accepted Insurance
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {doctor.acceptedInsurance.slice(0, 5).map((ins) => (
                      <Badge key={ins} variant="secondary" className="text-xs">
                        {ins}
                      </Badge>
                    ))}
                    {doctor.acceptedInsurance.length > 5 && (
                      <Badge variant="outline" className="text-xs">
                        +{doctor.acceptedInsurance.length - 5} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Next Available */}
              {slots.length > 0 && (
                <div className="pt-4 border-t">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-green-500" />
                    <span className="text-slate-600">Next available:</span>
                  </div>
                  <p className="font-medium text-green-600 mt-1">
                    {format(new Date(slots[0].date), "EEE, MMM d")} at{" "}
                    {slots[0].startTime}
                  </p>
                </div>
              )}

              {/* Book Button */}
              <Button
                className="w-full"
                size="lg"
                disabled={!selectedSlot}
                onClick={() => setShowBookingModal(true)}
              >
                {selectedSlot ? "Continue Booking" : "Select a Time Slot"}
              </Button>

              {selectedSlot && (
                <p className="text-xs text-center text-slate-500">
                  {format(new Date(selectedSlot.date), "EEEE, MMMM d")} at{" "}
                  {selectedSlot.startTime}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Report Attached Notice */}
          {reportId && reportSummary && (
            <Card className="bg-teal-50 border-teal-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <BadgeCheck className="w-5 h-5 text-teal-600 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-teal-800 text-sm">
                      Health Report Will Be Attached
                    </p>
                    <p className="text-xs text-teal-600 mt-1">
                      &quot;{reportSummary.chiefComplaint}&quot;
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Booking Confirmation Modal */}
      {doctor && selectedSlot && (
        <BookingConfirmationModal
          isOpen={showBookingModal}
          onClose={() => setShowBookingModal(false)}
          onConfirm={handleBookingConfirm}
          doctor={doctor}
          selectedSlot={selectedSlot}
          reportId={reportId || undefined}
          reportSummary={reportSummary || undefined}
        />
      )}
    </div>
  );
}
