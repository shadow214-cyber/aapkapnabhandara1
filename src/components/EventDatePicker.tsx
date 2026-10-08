"use client";

import { useEffect, useRef, useState } from "react";

type EventDatePickerProps = {
  language: "en" | "hi";
  value: string;
  onChange: (value: string) => void;
  error?: string;
};

const isoDate = (date: Date) => [
  date.getFullYear(),
  String(date.getMonth() + 1).padStart(2, "0"),
  String(date.getDate()).padStart(2, "0"),
].join("-");

function parseDate(value: string) {
  if (!value) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function EventDatePicker({ language, value, onChange, error }: EventDatePickerProps) {
  const today = new Date();
  const selectedDate = parseDate(value);
  const [open, setOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const containerRef = useRef<HTMLDivElement>(null);
  const locale = language === "hi" ? "hi-IN" : "en-IN";
  const months = Array.from({ length: 12 }, (_, month) => ({
    value: month,
    label: new Intl.DateTimeFormat(locale, { month: "long" }).format(new Date(2024, month, 1)),
  }));
  const firstAvailableYear = Math.max(2026, today.getFullYear());
  const years = Array.from({ length: 21 }, (_, index) => firstAvailableYear + index);
  if (!years.includes(visibleMonth.getFullYear())) years.push(visibleMonth.getFullYear());
  years.sort((left, right) => left - right);
  const weekdays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(2024, 0, 1 + index);
    return new Intl.DateTimeFormat(locale, { weekday: "short" }).format(date);
  });
  const firstWeekday = (new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1).getDay() + 6) % 7;
  const daysInMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0).getDate();
  const calendarCells: Array<number | null> = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];

  useEffect(() => {
    if (!open) return;
    function closeOnOutsideClick(event: MouseEvent) {
      if (event.target instanceof Node && !containerRef.current?.contains(event.target)) setOpen(false);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  function showCalendar() {
    const date = selectedDate ?? today;
    setVisibleMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    setOpen((current) => !current);
  }

  return (
    <div className="event-date-field" ref={containerRef}>
      <span className="event-date-label">{language === "hi" ? "आयोजन की तारीख़" : "Event date"}</span>
      <input type="hidden" name="date" value={value} />
      <button
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-describedby={error ? "event-date-error" : undefined}
        aria-label={selectedDate
          ? new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(selectedDate)
          : language === "hi" ? "तारीख़ चुनें" : "Choose a date"}
        className={`event-date-trigger${value ? " event-date-selected" : ""}${error ? " event-date-invalid" : ""}`}
        onClick={showCalendar}
        type="button"
      >
        <span>{selectedDate
          ? new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(selectedDate)
          : language === "hi" ? "तारीख़ चुनें" : "Choose event date"}</span>
        <span aria-hidden="true" className="event-date-icon">▦</span>
      </button>
      {error && <span className="event-date-error" id="event-date-error" role="alert">{error}</span>}
      {open && <div aria-label={language === "hi" ? "आयोजन की तारीख़ चुनें" : "Choose event date"} className="event-calendar" role="dialog">
        <div className="event-calendar-heading">
          <label><span>{language === "hi" ? "महीना" : "Month"}</span><select aria-label={language === "hi" ? "महीना चुनें" : "Select month"} onChange={(event) => setVisibleMonth((current) => new Date(current.getFullYear(), Number(event.target.value), 1))} value={visibleMonth.getMonth()}>{months.map((month) => <option key={month.value} value={month.value}>{month.label}</option>)}</select></label>
          <label><span>{language === "hi" ? "साल" : "Year"}</span><select aria-label={language === "hi" ? "साल चुनें" : "Select year"} onChange={(event) => setVisibleMonth((current) => new Date(Number(event.target.value), current.getMonth(), 1))} value={visibleMonth.getFullYear()}>{years.map((year) => <option key={year} value={year}>{year}</option>)}</select></label>
        </div>
        <div className="event-calendar-grid" role="grid">
          {weekdays.map((weekday, index) => <span aria-label={weekday} className="event-calendar-weekday" key={`weekday-${index}`} role="columnheader">{weekday}</span>)}
          {calendarCells.map((day, index) => {
            if (day === null) return <span aria-hidden="true" className="event-calendar-empty" key={`empty-${index}`} />;
            const date = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), day);
            const dateValue = isoDate(date);
            const isToday = dateValue === isoDate(today);
            const isSelected = dateValue === value;
            return <button
              aria-label={new Intl.DateTimeFormat(locale, { dateStyle: "full" }).format(date)}
              aria-selected={isSelected}
              className={`event-calendar-day${isToday ? " event-calendar-today" : ""}${isSelected ? " event-calendar-day-selected" : ""}`}
              key={dateValue}
              onClick={() => { onChange(dateValue); setOpen(false); }}
              role="gridcell"
              type="button"
            >{new Intl.NumberFormat(locale).format(day)}</button>;
          })}
        </div>
        <button className="event-calendar-today-action" onClick={() => { onChange(isoDate(today)); setOpen(false); }} type="button">
          {language === "hi" ? "आज चुनें" : "Select today"}
        </button>
      </div>}
    </div>
  );
}
