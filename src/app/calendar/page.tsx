"use client";

import { useState, useEffect, useCallback } from "react";

interface CalendarEvent {
  id: string;
  summary: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
  description?: string;
  location?: string;
  colorId?: string;
}

interface Calendar {
  id: string;
  summary: string;
  primary?: boolean;
  backgroundColor?: string;
}

export default function CalendarPage() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedCalendars, setSelectedCalendars] = useState<Set<string>>(new Set());
  const [showCalendarManager, setShowCalendarManager] = useState(false);
  const [creatingEvent, setCreatingEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({
    summary: '',
    start: '',
    end: '',
    description: '',
    location: ''
  });

  const fetchEvents = useCallback(async () => {
    try {
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 7);
      endOfWeek.setHours(23, 59, 59, 999);

      // Fetch events for each selected calendar
      const allEvents: CalendarEvent[] = [];
      for (const calendarId of selectedCalendars) {
        const res = await fetch(`/api/google/calendar?timeMin=${startOfWeek.toISOString()}&timeMax=${endOfWeek.toISOString()}&calendarId=${calendarId}`);
        if (res.ok) {
          const data = await res.json() as { items?: CalendarEvent[] };
          const calendarEvents = data.items || [];
          // Add calendar info to events
          const calendar = calendars.find(cal => cal.id === calendarId);
          calendarEvents.forEach(event => {
            event.colorId = calendar?.backgroundColor || '#4285f4';
          });
          allEvents.push(...calendarEvents);
        }
      }
      
      // Sort events by start time
      allEvents.sort((a, b) => {
        const aTime = a.start.dateTime || a.start.date || '';
        const bTime = b.start.dateTime || b.start.date || '';
        return new Date(aTime).getTime() - new Date(bTime).getTime();
      });
      
      setEvents(allEvents);
    } catch (err) {
      console.error('Failed to fetch events:', err);
    }
  }, [currentDate, selectedCalendars, calendars]);

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/google/calendar');
        if (res.status === 401) {
          setAuthenticated(false);
        } else {
          setAuthenticated(true);
          await fetchCalendars();
        }
      } catch {
        setError("Failed to check authentication");
        setAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Fetch events when date or selected calendars change
  useEffect(() => {
    if (authenticated && selectedCalendars.size > 0) {
      fetchEvents();
    }
  }, [authenticated, fetchEvents, selectedCalendars.size]);

  const handleConnect = () => {
    window.location.href = "/api/google/auth";
  };

  const fetchCalendars = async () => {
    try {
      const res = await fetch('/api/google/calendars');
      if (res.ok) {
        const data = await res.json() as { items?: Calendar[] };
        const calendarList = data.items || [];
        setCalendars(calendarList);
        // Auto-select primary calendar and first few calendars
        const primary = calendarList.find(cal => cal.primary);
        const initialSelection = new Set<string>();
        if (primary) initialSelection.add(primary.id);
        // Add first 3 calendars if not primary
        calendarList.slice(0, 3).forEach(cal => {
          if (!cal.primary) initialSelection.add(cal.id);
        });
        setSelectedCalendars(initialSelection);
      }
    } catch (err) {
      console.error('Failed to fetch calendars:', err);
    }
  };

  const createEvent = async () => {
    try {
      const eventData = {
        summary: newEvent.summary,
        description: newEvent.description,
        location: newEvent.location,
        start: {
          dateTime: newEvent.start,
          timeZone: 'America/Chicago'
        },
        end: {
          dateTime: newEvent.end,
          timeZone: 'America/Chicago'
        }
      };

      const res = await fetch('/api/google/calendar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventData)
      });

      if (res.ok) {
        setCreatingEvent(false);
        setNewEvent({ summary: '', start: '', end: '', description: '', location: '' });
        await fetchEvents(); // Refresh events
      } else {
        console.error('Failed to create event');
      }
    } catch (err) {
      console.error('Failed to create event:', err);
    }
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setDate(currentDate.getDate() - 7);
    } else {
      newDate.setDate(currentDate.getDate() + 7);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const formatTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getWeekDays = () => {
    const days = [];
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const getEventsForDay = (date: Date) => {
    return events.filter(event => {
      // Handle events with specific time (dateTime)
      if (event.start.dateTime) {
        const eventDate = new Date(event.start.dateTime).toDateString();
        return eventDate === date.toDateString();
      }
      
      // Handle all-day events (date)
      if (event.start.date) {
        const startDate = new Date(event.start.date);
        const endDate = event.end.date ? new Date(event.end.date) : new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
        
        // Check if the given date falls within the event's date range
        const givenDate = new Date(date);
        givenDate.setHours(0, 0, 0, 0);
        
        return givenDate >= startDate && givenDate < endDate;
      }
      
      return false;
    });
  };

  const getEventPosition = (event: CalendarEvent) => {
    // Handle all-day events (date)
    if (event.start.date) {
      return { top: 0, height: 60, isAllDay: true };
    }
    
    // Handle events with specific time (dateTime)
    if (!event.start.dateTime) return { top: 0, height: 60, isAllDay: false };
    
    const startTime = new Date(event.start.dateTime);
    const endTime = event.end.dateTime ? new Date(event.end.dateTime) : new Date(startTime.getTime() + 60 * 60 * 1000);
    
    const startHour = startTime.getHours() + startTime.getMinutes() / 60;
    const endHour = endTime.getHours() + endTime.getMinutes() / 60;
    const duration = endHour - startHour;
    
    const top = (startHour - 6) * 60; // Start at 6 AM
    const height = Math.max(duration * 60, 30); // Minimum height of 30px
    
    return { top, height, isAllDay: false };
  };

  const getCurrentTimePosition = () => {
    const now = new Date();
    const weekStart = new Date(currentDate);
    weekStart.setDate(currentDate.getDate() - currentDate.getDay());
    
    const daysDiff = Math.floor((now.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff < 0 || daysDiff > 6) return null;
    
    const currentHour = now.getHours() + now.getMinutes() / 60;
    const top = (currentHour - 6) * 60; // Start at 6 AM
    
    return { day: daysDiff, top };
  };

  const toggleCalendar = (calendarId: string) => {
    const newSelected = new Set(selectedCalendars);
    if (newSelected.has(calendarId)) {
      newSelected.delete(calendarId);
    } else {
      newSelected.add(calendarId);
    }
    setSelectedCalendars(newSelected);
  };

  const weekDays = getWeekDays();
  const currentTimePosition = getCurrentTimePosition();
  const hours = Array.from({ length: 18 }, (_, i) => i + 6); // 6 AM to 11 PM

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col">
      <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-700">
        <h1 className="text-2xl font-bold">Calendar</h1>
        {authenticated && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigateWeek('prev')}
                className="p-2 bg-gray-700 rounded hover:bg-gray-600"
              >
                ←
              </button>
              <button
                onClick={goToToday}
                className="px-3 py-1 bg-indigo-600 rounded hover:bg-indigo-700 text-sm"
              >
                Today
              </button>
              <button
                onClick={() => navigateWeek('next')}
                className="p-2 bg-gray-700 rounded hover:bg-gray-600"
              >
                →
              </button>
            </div>
            <div className="text-sm text-gray-400">
              {weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - 
              {weekDays[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
            <button
              onClick={() => setShowCalendarManager(!showCalendarManager)}
              className="px-3 py-1 bg-gray-700 rounded hover:bg-gray-600 text-sm"
            >
              {showCalendarManager ? 'Hide Calendars' : 'Manage Calendars'}
            </button>
            <button
              onClick={() => setCreatingEvent(true)}
              className="px-3 py-1 bg-green-600 rounded hover:bg-green-700 text-sm"
            >
              Create Event
            </button>
          </div>
        )}
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center">
        {loading && (
          <div className="flex items-center gap-2 text-gray-400">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
            Loading...
          </div>
        )}
        {error && <div className="text-red-400">{error}</div>}
        {authenticated === false && (
          <div className="text-center">
            <div className="text-lg mb-4">Connect to Google Calendar</div>
            <button
              onClick={handleConnect}
              className="px-6 py-3 bg-indigo-600 text-white rounded shadow hover:bg-indigo-700 font-semibold"
            >
              Connect Google Calendar
            </button>
          </div>
        )}
        {authenticated && (
          <div className="w-full h-full px-4 sm:px-6">
            {showCalendarManager && (
              <div className="mb-4 p-4 bg-gray-800 rounded-lg">
                <h3 className="text-lg font-semibold mb-3">Select Calendars:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {calendars.map((calendar) => (
                    <div key={calendar.id} className="flex items-center gap-2 p-2 bg-gray-700 rounded">
                      <input
                        type="checkbox"
                        checked={selectedCalendars.has(calendar.id)}
                        onChange={() => toggleCalendar(calendar.id)}
                        className="rounded"
                      />
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: calendar.backgroundColor || '#4285f4' }}
                      ></div>
                      <span className="text-sm">{calendar.summary}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {creatingEvent && (
              <div className="mb-4 p-4 bg-gray-800 rounded-lg">
                <h3 className="text-lg font-semibold mb-3">Create New Event</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Event title"
                    value={newEvent.summary}
                    onChange={(e) => setNewEvent({...newEvent, summary: e.target.value})}
                    className="p-2 bg-gray-700 rounded text-white"
                  />
                  <input
                    type="text"
                    placeholder="Location"
                    value={newEvent.location}
                    onChange={(e) => setNewEvent({...newEvent, location: e.target.value})}
                    className="p-2 bg-gray-700 rounded text-white"
                  />
                  <input
                    type="datetime-local"
                    value={newEvent.start}
                    onChange={(e) => setNewEvent({...newEvent, start: e.target.value})}
                    className="p-2 bg-gray-700 rounded text-white"
                  />
                  <input
                    type="datetime-local"
                    value={newEvent.end}
                    onChange={(e) => setNewEvent({...newEvent, end: e.target.value})}
                    className="p-2 bg-gray-700 rounded text-white"
                  />
                  <textarea
                    placeholder="Description"
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                    className="p-2 bg-gray-700 rounded text-white md:col-span-2"
                    rows={3}
                  />
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={createEvent}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Create Event
                  </button>
                  <button
                    onClick={() => setCreatingEvent(false)}
                    className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="h-full bg-gray-800 rounded-lg overflow-hidden flex flex-col">
              {/* All-Day Events Section */}
              <div className="bg-gray-700 border-b border-gray-600">
                <div className="grid grid-cols-8">
                  <div className="p-2 text-center font-semibold text-sm border-r border-gray-600">
                    All Day
                  </div>
                  {weekDays.map((day, index) => {
                    const dayEvents = getEventsForDay(day);
                    const allDayEvents = dayEvents.filter(event => {
                      const position = getEventPosition(event);
                      return position.isAllDay;
                    });
                    
                    return (
                      <div key={index} className="p-2 border-r border-gray-600 min-h-[60px] max-h-[120px] overflow-y-auto">
                        <div className="space-y-1">
                          {allDayEvents.map((event) => (
                            <div 
                              key={event.id}
                              className="rounded px-2 py-1 text-xs cursor-pointer hover:opacity-80 overflow-hidden border-2 border-current border-opacity-30 flex items-center"
                              style={{ 
                                backgroundColor: event.colorId || '#4285f4',
                                minHeight: '24px'
                              }}
                              title={`${event.summary} (All day)`}
                            >
                              <div className="font-medium truncate text-white flex-1">{event.summary}</div>
                            </div>
                          ))}
                          {allDayEvents.length === 0 && (
                            <div className="text-gray-500 text-xs italic">No all-day events</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Calendar Header */}
              <div className="grid grid-cols-8 bg-gray-700 border-b border-gray-600">
                <div className="p-3 text-center font-semibold text-sm border-r border-gray-600">
                  Time
                </div>
                {weekDays.map((day, index) => (
                  <div key={index} className="p-3 text-center font-semibold text-sm border-r border-gray-600">
                    <div>{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][index]}</div>
                    <div className="text-xs text-gray-400">{day.getDate()}</div>
                  </div>
                ))}
              </div>
              
              {/* Calendar Grid */}
              <div className="grid grid-cols-8 flex-1 relative">
                {/* Time column */}
                <div className="border-r border-gray-600">
                  {hours.map(hour => (
                    <div key={hour} className="h-15 border-b border-gray-600 flex items-center justify-end pr-2 text-xs text-gray-400">
                      {hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                    </div>
                  ))}
                </div>
                
                {/* Day columns */}
                {weekDays.map((day, dayIndex) => {
                  const dayEvents = getEventsForDay(day);
                  const timeSpecificEvents = dayEvents.filter(event => {
                    const position = getEventPosition(event);
                    return !position.isAllDay;
                  });
                  const isToday = day.toDateString() === new Date().toDateString();
                  
                  return (
                    <div 
                      key={dayIndex} 
                      className={`relative border-r border-gray-600 ${
                        isToday ? 'bg-indigo-900/10' : ''
                      }`}
                    >
                      {/* Hour grid lines */}
                      {hours.map(hour => (
                        <div key={hour} className="h-15 border-b border-gray-600"></div>
                      ))}
                      
                      {/* Current time indicator */}
                      {currentTimePosition && currentTimePosition.day === dayIndex && (
                        <div 
                          className="absolute left-0 right-0 z-10"
                          style={{ top: `${currentTimePosition.top}px` }}
                        >
                          <div className="h-0.5 bg-red-500 relative">
                            <div className="absolute -left-1 -top-1 w-3 h-3 bg-red-500 rounded-full"></div>
                          </div>
                        </div>
                      )}
                      
                      {/* Time-specific Events */}
                      {timeSpecificEvents.map(event => {
                        const position = getEventPosition(event);
                        return (
                          <div 
                            key={event.id}
                            className="absolute left-1 right-1 z-20 rounded px-2 py-1 text-xs cursor-pointer hover:opacity-80 overflow-hidden"
                            style={{ 
                              top: `${position.top}px`, 
                              height: `${position.height}px`,
                              backgroundColor: event.colorId || '#4285f4'
                            }}
                            title={`${event.summary} - ${formatTime(event.start.dateTime!)}`}
                          >
                            <div className="font-medium truncate">{event.summary}</div>
                            <div className="text-xs opacity-90">
                              {formatTime(event.start.dateTime!)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="mt-4 text-center text-xs text-gray-400">
              <p>Showing {events.length} events from {selectedCalendars.size} calendar{selectedCalendars.size !== 1 ? 's' : ''}</p>
              <p className="mt-1">Click &quot;Create Event&quot; to add new events, or &quot;Manage Calendars&quot; to select which calendars to display.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 