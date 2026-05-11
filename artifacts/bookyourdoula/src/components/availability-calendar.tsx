import { useState, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  isSameMonth,
  parseISO,
  isToday,
  isPast,
  startOfDay,
} from "date-fns";

interface DayAvailability {
  date: string;
  available: boolean;
}

interface AvailabilityCalendarProps {
  /** If true, days are clickable and toggle availability */
  editable?: boolean;
  /** Current availability entries from the API */
  availability: DayAvailability[];
  /** Called when a date is toggled (editable mode only) */
  onToggle?: (date: string, available: boolean) => void;
  /** Called when the visible month changes */
  onMonthChange?: (year: number, month: number) => void;
  /** Initial month to display (1-indexed) */
  initialYear?: number;
  initialMonth?: number;
  /** If true, only future available dates are highlightable (for booking) */
  bookingMode?: boolean;
  /** The currently selected date (for booking mode) */
  selectedDate?: string;
  /** Called when a date is selected (booking mode) */
  onSelectDate?: (date: string) => void;
}

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export function AvailabilityCalendar({
  editable = false,
  availability,
  onToggle,
  onMonthChange,
  initialYear,
  initialMonth,
  bookingMode = false,
  selectedDate,
  onSelectDate,
}: AvailabilityCalendarProps) {
  const today = new Date();
  const [year, setYear] = useState(initialYear ?? today.getFullYear());
  const [month, setMonth] = useState(initialMonth ?? today.getMonth() + 1);

  const availableSet = new Set(
    availability.filter((a) => a.available).map((a) => a.date)
  );

  const goToPrev = useCallback(() => {
    const prev = month === 1 ? { y: year - 1, m: 12 } : { y: year, m: month - 1 };
    setYear(prev.y);
    setMonth(prev.m);
    onMonthChange?.(prev.y, prev.m);
  }, [year, month, onMonthChange]);

  const goToNext = useCallback(() => {
    const next = month === 12 ? { y: year + 1, m: 1 } : { y: year, m: month + 1 };
    setYear(next.y);
    setMonth(next.m);
    onMonthChange?.(next.y, next.m);
  }, [year, month, onMonthChange]);

  const firstDay = startOfMonth(new Date(year, month - 1));
  const lastDay = endOfMonth(new Date(year, month - 1));
  const days = eachDayOfInterval({ start: firstDay, end: lastDay });
  const startOffset = getDay(firstDay);

  function handleDay(date: Date) {
    const dateStr = format(date, "yyyy-MM-dd");
    if (editable) {
      const current = availableSet.has(dateStr);
      onToggle?.(dateStr, !current);
    } else if (bookingMode) {
      if (availableSet.has(dateStr) && !isPast(startOfDay(date))) {
        onSelectDate?.(dateStr);
      }
    }
  }

  return (
    <div className="select-none">
      <div className="flex items-center justify-between mb-4">
        <Button type="button" variant="ghost" size="icon" onClick={goToPrev} className="h-8 w-8">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium text-foreground">
          {format(new Date(year, month - 1), "MMMM yyyy")}
        </span>
        <Button type="button" variant="ghost" size="icon" onClick={goToNext} className="h-8 w-8">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAYS.map((d) => (
          <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: startOffset }).map((_, i) => (
          <div key={`pad-${i}`} />
        ))}

        {days.map((date) => {
          const dateStr = format(date, "yyyy-MM-dd");
          const isAvailable = availableSet.has(dateStr);
          const isSelected = selectedDate === dateStr;
          const isTodayDate = isToday(date);
          const isPastDate = isPast(startOfDay(date)) && !isTodayDate;
          const inCurrentMonth = isSameMonth(date, new Date(year, month - 1));

          let className =
            "h-8 w-full rounded-lg text-xs font-medium transition-all flex items-center justify-center ";

          if (!inCurrentMonth) {
            className += "opacity-0 pointer-events-none ";
          } else if (bookingMode) {
            if (isSelected) {
              className += "bg-primary text-primary-foreground shadow-sm ";
            } else if (isAvailable && !isPastDate) {
              className += "bg-secondary/15 text-secondary border border-secondary/30 hover:bg-secondary/25 cursor-pointer ";
            } else if (isPastDate) {
              className += "text-muted-foreground/30 cursor-not-allowed ";
            } else {
              className += "text-muted-foreground/50 cursor-not-allowed ";
            }
          } else if (editable) {
            if (isAvailable) {
              className += "bg-secondary/20 text-secondary border border-secondary/30 hover:bg-secondary/30 cursor-pointer ";
            } else {
              className += "text-muted-foreground hover:bg-muted/60 cursor-pointer border border-transparent hover:border-border ";
            }
          } else {
            if (isAvailable) {
              className += "bg-secondary/15 text-secondary border border-secondary/20 ";
            } else {
              className += "text-muted-foreground/60 ";
            }
          }

          if (isTodayDate && !isSelected) {
            className += "ring-1 ring-primary/40 ";
          }

          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => handleDay(date)}
              className={className}
              title={
                bookingMode && !isAvailable && !isPastDate
                  ? "Not available on this date"
                  : undefined
              }
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>

      {editable && (
        <p className="text-xs text-muted-foreground mt-3 text-center">
          Click a day to mark it as available or unavailable
        </p>
      )}
      {bookingMode && (
        <p className="text-xs text-muted-foreground mt-3 text-center">
          Highlighted dates are when the doula is available
        </p>
      )}
    </div>
  );
}
