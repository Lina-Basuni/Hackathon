"use client";

import { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Calendar as CalendarIcon,
  Globe,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { cn } from "@/app/lib/utils";
import {
  type TimeSlot,
  type SlotsByDate,
  groupSlotsByDate,
  formatTimeSlot,
} from "./types";
import {
  format,
  addDays,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  isToday,
  isBefore,
  startOfDay,
  addWeeks,
  subWeeks,
} from "date-fns";

interface TimeSlotSelectorProps {
  slots: TimeSlot[];
  selectedSlot: TimeSlot | null;
  onSlotSelect: (slot: TimeSlot) => void;
  isLoading?: boolean;
}

export function TimeSlotSelector({
  slots,
  selectedSlot,
  onSlotSelect,
  isLoading = false,
}: TimeSlotSelectorProps) {
  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 0 })
  );
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Group slots by date
  const slotsByDate = useMemo(() => groupSlotsByDate(slots), [slots]);

  // Get days in current week
  const weekDays = useMemo(() => {
    const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: currentWeekStart, end: weekEnd });
  }, [currentWeekStart]);

  // Get timezone
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Navigate weeks
  const goToPreviousWeek = () => {
    setCurrentWeekStart(subWeeks(currentWeekStart, 1));
  };

  const goToNextWeek = () => {
    setCurrentWeekStart(addWeeks(currentWeekStart, 1));
  };

  // Check if a date has available slots
  const getDateSlots = (date: Date): TimeSlot[] => {
    const dateKey = format(date, "yyyy-MM-dd");
    return slotsByDate[dateKey] || [];
  };

  // Get slots for selected date
  const slotsForSelectedDate = selectedDate ? getDateSlots(selectedDate) : [];

  // Determine if previous week button should be disabled
  const canGoPrevious = !isBefore(currentWeekStart, startOfDay(new Date()));

  return (
    <div className="space-y-6">
      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={goToPreviousWeek}
          disabled={!canGoPrevious}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        <div className="text-center">
          <h3 className="font-semibold text-slate-800">
            {format(currentWeekStart, "MMMM yyyy")}
          </h3>
          <p className="text-xs text-slate-500">
            {format(currentWeekStart, "MMM d")} -{" "}
            {format(addDays(currentWeekStart, 6), "MMM d")}
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={goToNextWeek}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Calendar Week View */}
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day) => {
          const daySlots = getDateSlots(day);
          const hasSlots = daySlots.length > 0;
          const isPast = isBefore(day, startOfDay(new Date()));
          const isSelected = selectedDate && isSameDay(day, selectedDate);

          return (
            <button
              key={day.toISOString()}
              onClick={() => !isPast && hasSlots && setSelectedDate(day)}
              disabled={isPast || !hasSlots}
              className={cn(
                "flex flex-col items-center p-2 rounded-lg border transition-all",
                isPast && "opacity-40 cursor-not-allowed",
                !isPast && !hasSlots && "opacity-50 cursor-not-allowed",
                !isPast &&
                  hasSlots &&
                  !isSelected &&
                  "hover:border-primary hover:bg-primary/5 cursor-pointer",
                isSelected && "border-primary bg-primary/10",
                isToday(day) && !isSelected && "border-teal-300 bg-teal-50"
              )}
            >
              <span className="text-xs text-slate-500 uppercase">
                {format(day, "EEE")}
              </span>
              <span
                className={cn(
                  "text-lg font-semibold mt-1",
                  isSelected && "text-primary",
                  isToday(day) && !isSelected && "text-teal-600"
                )}
              >
                {format(day, "d")}
              </span>
              {hasSlots && (
                <Badge
                  variant="secondary"
                  className={cn(
                    "mt-1 text-xs px-1.5 py-0",
                    isSelected && "bg-primary/20 text-primary"
                  )}
                >
                  {daySlots.length}
                </Badge>
              )}
            </button>
          );
        })}
      </div>

      {/* Time Slots for Selected Date */}
      {selectedDate && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <CalendarIcon className="w-4 h-4 text-primary" />
              <span className="font-medium text-slate-800">
                {format(selectedDate, "EEEE, MMMM d, yyyy")}
              </span>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="h-10 bg-slate-100 animate-pulse rounded-lg"
                  />
                ))}
              </div>
            ) : slotsForSelectedDate.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                {slotsForSelectedDate.map((slot) => {
                  const isSlotSelected = selectedSlot?.id === slot.id;
                  return (
                    <button
                      key={slot.id}
                      onClick={() => onSlotSelect(slot)}
                      className={cn(
                        "flex items-center justify-center gap-1 px-3 py-2 rounded-lg border text-sm font-medium transition-all",
                        isSlotSelected
                          ? "border-primary bg-primary text-white"
                          : "border-slate-200 hover:border-primary hover:bg-primary/5"
                      )}
                    >
                      <Clock className="w-3 h-3" />
                      {slot.startTime}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-slate-500 py-4">
                No available slots for this date
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* No date selected prompt */}
      {!selectedDate && (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <CalendarIcon className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600">
              Select a date above to see available time slots
            </p>
          </CardContent>
        </Card>
      )}

      {/* Selected Slot Summary */}
      {selectedSlot && (
        <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Selected appointment:</p>
              <p className="font-semibold text-primary">
                {format(new Date(selectedSlot.date), "EEEE, MMMM d")} at{" "}
                {formatTimeSlot(selectedSlot.startTime, selectedSlot.endTime)}
              </p>
            </div>
            <Badge className="bg-primary/10 text-primary border-primary/20">
              {selectedSlot.duration} min
            </Badge>
          </div>
        </div>
      )}

      {/* Timezone indicator */}
      <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
        <Globe className="w-3 h-3" />
        <span>Times shown in {timezone}</span>
      </div>
    </div>
  );
}
