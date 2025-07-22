"use client";

import { useState, useEffect } from "react";

const VIEWS = ["Day", "Week", "Month", "Year"] as const;
type ViewType = typeof VIEWS[number];

type GoogleCalendarEvent = {
  id: string;
  summary?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
};

export default function CalendarPage() {
  const [view, setView] = useState<ViewType>("Week");
  const [events, setEvents] = useState<GoogleCalendarEvent[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch("/api/google/calendar")
      .then(async (res) => {
        if (res.status === 401) {
          setAuthenticated(false);
          setEvents(null);
          setLoading(false);
          return;
        }
        setAuthenticated(true);
        const data = await res.json() as { items?: GoogleCalendarEvent[] };
        setEvents(data.items || []);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load events");
        setLoading(false);
      });
  }, []);

  const handleConnect = () => {
    window.location.href = "/api/google/auth";
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-8">
      <h1 className="text-2xl font-bold mb-6">Calendar</h1>
      <div className="flex gap-2 mb-8 justify-center">
        {VIEWS.map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-4 py-2 rounded font-semibold transition-colors border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              view === v
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            }`}
          >
            {v}
          </button>
        ))}
      </div>
      <div className="flex flex-col items-center justify-center min-h-[300px]">
        {loading && <div>Loading events...</div>}
        {error && <div className="text-red-400">{error}</div>}
        {authenticated === false && (
          <button
            onClick={handleConnect}
            className="px-6 py-3 bg-indigo-600 text-white rounded shadow hover:bg-indigo-700 font-semibold"
          >
            Connect Google Calendar
          </button>
        )}
        {authenticated && events && events.length === 0 && <div>No events found.</div>}
        {authenticated && events && events.length > 0 && (
          <ul className="w-full max-w-xl divide-y divide-gray-800">
            {events.map((event) => (
              <li key={event.id} className="py-4">
                <div className="font-semibold">{event.summary || "(No title)"}</div>
                <div className="text-gray-400 text-sm">
                  {event.start?.dateTime || event.start?.date || ""} - {event.end?.dateTime || event.end?.date || ""}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
} 