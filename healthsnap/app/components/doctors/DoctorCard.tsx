"use client";

import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import {
  Star,
  MapPin,
  Clock,
  Calendar,
  Languages,
  Award,
  Sparkles,
  Building2,
  Shield,
} from "lucide-react";
import { Card, CardContent } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { cn } from "@/app/lib/utils";
import { getSpecialtyLabel } from "@/app/lib/utils";
import type { DoctorWithAvailability } from "./types";

interface DoctorCardProps {
  doctor: DoctorWithAvailability;
  reportId?: string;
  showMatchScore?: boolean;
}

export function DoctorCard({ doctor, reportId, showMatchScore = true }: DoctorCardProps) {
  const hasMatchScore = showMatchScore && doctor.matchScore !== undefined;
  const bookingUrl = reportId
    ? `/doctors/${doctor.id}?reportId=${reportId}`
    : `/doctors/${doctor.id}`;

  return (
    <Card className={cn(
      "overflow-hidden transition-all hover:shadow-lg",
      hasMatchScore && doctor.matchScore! >= 0.8 && "ring-2 ring-teal-200"
    )}>
      <CardContent className="p-0">
        {/* Match Score Banner */}
        {hasMatchScore && doctor.matchScore! >= 0.7 && (
          <div className="bg-gradient-to-r from-teal-500 to-teal-600 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2 text-white">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">AI Recommended</span>
            </div>
            <Badge className="bg-white/20 text-white border-white/30">
              {Math.round(doctor.matchScore! * 100)}% Match
            </Badge>
          </div>
        )}

        <div className="p-5">
          {/* Header: Photo + Basic Info */}
          <div className="flex gap-4">
            {/* Photo */}
            <div className="flex-shrink-0">
              <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100">
                {doctor.imageUrl ? (
                  <Image
                    src={doctor.imageUrl}
                    alt={doctor.name}
                    width={80}
                    height={80}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-slate-400">
                    {doctor.name.split(" ").map(n => n[0]).join("")}
                  </div>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg text-slate-800 truncate">
                {doctor.name}
              </h3>
              <p className="text-primary font-medium text-sm">
                {getSpecialtyLabel(doctor.specialty)}
              </p>

              {/* Rating + Experience */}
              <div className="flex items-center gap-3 mt-2 text-sm">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span className="font-medium">{doctor.rating.toFixed(1)}</span>
                </div>
                <div className="flex items-center gap-1 text-slate-500">
                  <Award className="w-4 h-4" />
                  <span>{doctor.yearsExperience} yrs exp</span>
                </div>
              </div>
            </div>
          </div>

          {/* Match Reasons */}
          {hasMatchScore && doctor.matchReasons && doctor.matchReasons.length > 0 && (
            <div className="mt-4 p-3 bg-teal-50 rounded-lg border border-teal-100">
              <p className="text-xs font-medium text-teal-700 mb-1">Why this match:</p>
              <ul className="text-xs text-teal-600 space-y-0.5">
                {doctor.matchReasons.slice(0, 2).map((reason, i) => (
                  <li key={i} className="flex items-start gap-1">
                    <span className="text-teal-500 mt-0.5">•</span>
                    {reason}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Details Grid */}
          <div className="mt-4 space-y-2">
            {/* Hospital */}
            {doctor.hospital && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Building2 className="w-4 h-4 text-slate-400" />
                <span className="truncate">{doctor.hospital}</span>
              </div>
            )}

            {/* Location */}
            {doctor.location && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span>{doctor.location}</span>
              </div>
            )}

            {/* Languages */}
            {doctor.languages.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Languages className="w-4 h-4 text-slate-400" />
                <span>{doctor.languages.slice(0, 3).join(", ")}</span>
                {doctor.languages.length > 3 && (
                  <span className="text-slate-400">+{doctor.languages.length - 3}</span>
                )}
              </div>
            )}
          </div>

          {/* Insurance Badges */}
          {doctor.acceptedInsurance.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center gap-1 mb-2 text-xs text-slate-500">
                <Shield className="w-3 h-3" />
                <span>Accepts:</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {doctor.acceptedInsurance.slice(0, 3).map((ins) => (
                  <Badge key={ins} variant="secondary" className="text-xs">
                    {ins}
                  </Badge>
                ))}
                {doctor.acceptedInsurance.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{doctor.acceptedInsurance.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Availability Preview */}
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <div>
                {doctor.nextAvailableSlot ? (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-green-500" />
                    <span className="text-slate-600">Next available:</span>
                    <span className="font-medium text-green-600">
                      {format(new Date(doctor.nextAvailableSlot), "EEE, MMM d")}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Clock className="w-4 h-4" />
                    <span>Check availability</span>
                  </div>
                )}
                {doctor.availableSlotsCount > 0 && (
                  <p className="text-xs text-slate-500 mt-1">
                    {doctor.availableSlotsCount} slots available this week
                  </p>
                )}
              </div>
            </div>

            {/* Book Button */}
            <Link href={bookingUrl} className="block mt-3">
              <Button className="w-full">
                Book Appointment
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
