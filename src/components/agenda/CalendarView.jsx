import React, { useState, useMemo } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addMonths, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './calendar-styles.css';

// Components
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Setup the localizer for react-big-calendar
const locales = {
  'es': es,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { locale: es }),
  getDay,
  locales,
});

// Custom event style getter
const eventStyleGetter = (event) => {
  let backgroundColor = '#3174ad';

  // Color by event type
  switch (event.eventType) {
    case 'EVALUACION':
      backgroundColor = '#3b82f6'; // blue
      break;
    case 'REUNION':
      backgroundColor = '#8b5cf6'; // purple
      break;
    case 'FORMACION':
      backgroundColor = '#10b981'; // green
      break;
    case 'OTRO':
      backgroundColor = '#64748b'; // slate
      break;
  }

  // Override color by approval status
  if (event.approvalStatus === 'CANCELLED') {
    backgroundColor = '#ef4444'; // red
  } else if (event.approvalStatus === 'PENDING_APPROVAL') {
    backgroundColor = '#eab308'; // yellow
  }

  return {
    style: {
      backgroundColor,
      borderRadius: '5px',
      opacity: 0.9,
      color: 'white',
      border: '0px',
      display: 'block',
    }
  };
};

// Custom toolbar component
const CustomToolbar = ({ onNavigate, onView, view, label }) => {
  return (
    <div className="rbc-toolbar">
      <div className="rbc-btn-group">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onNavigate('PREV')}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onNavigate('TODAY')}
        >
          Hoy
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onNavigate('NEXT')}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      <span className="rbc-toolbar-label text-lg font-semibold">{label}</span>

      <div className="rbc-btn-group">
        <Select value={view} onValueChange={onView}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="month">Mes</SelectItem>
            <SelectItem value="week">Semana</SelectItem>
            <SelectItem value="day">Día</SelectItem>
            <SelectItem value="agenda">Agenda</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default function CalendarView({ events, onSelectEvent, onSelectSlot }) {
  const [currentView, setCurrentView] = useState('month');

  // Transform events to calendar format
  const calendarEvents = useMemo(() => {
    return events.map(event => ({
      id: event.id,
      title: event.title,
      start: new Date(event.startDate),
      end: new Date(event.endDate),
      resource: event,
      eventType: event.eventType,
      approvalStatus: event.approvalStatus,
      priority: event.priority,
    }));
  }, [events]);

  const handleSelectEvent = (event) => {
    if (onSelectEvent) {
      onSelectEvent(event.resource);
    }
  };

  const handleSelectSlot = (slotInfo) => {
    if (onSelectSlot) {
      onSelectSlot(slotInfo);
    }
  };

  // Custom event component
  const EventComponent = ({ event }) => (
    <div className="flex items-center gap-1 text-xs">
      <span className="font-medium truncate">{event.title}</span>
      {event.priority === 'URGENTE' && (
        <span className="text-red-200">⚠️</span>
      )}
    </div>
  );

  // Custom agenda event component
  const AgendaEvent = ({ event }) => (
    <div className="flex items-center gap-2">
      <Badge className={
        event.eventType === 'EVALUACION' ? 'bg-blue-100 text-blue-800' :
        event.eventType === 'REUNION' ? 'bg-purple-100 text-purple-800' :
        event.eventType === 'FORMACION' ? 'bg-green-100 text-green-800' :
        'bg-slate-100 text-slate-800'
      }>
        {event.eventType}
      </Badge>
      <span className="font-medium">{event.title}</span>
    </div>
  );

  const messages = {
    allDay: 'Todo el día',
    previous: 'Anterior',
    next: 'Siguiente',
    today: 'Hoy',
    month: 'Mes',
    week: 'Semana',
    day: 'Día',
    agenda: 'Agenda',
    date: 'Fecha',
    time: 'Hora',
    event: 'Evento',
    noEventsInRange: 'No hay eventos en este rango',
    showMore: (total) => `+ Ver más (${total})`,
  };

  return (
    <div className="h-[calc(100vh-300px)] bg-white rounded-lg p-4 calendar-container">
      <Calendar
        localizer={localizer}
        events={calendarEvents}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '100%' }}
        onSelectEvent={handleSelectEvent}
        onSelectSlot={handleSelectSlot}
        selectable
        view={currentView}
        onView={setCurrentView}
        eventPropGetter={eventStyleGetter}
        components={{
          toolbar: CustomToolbar,
          event: EventComponent,
          agenda: {
            event: AgendaEvent,
          },
        }}
        messages={messages}
        culture="es"
        views={['month', 'week', 'day', 'agenda']}
        step={30}
        showMultiDayTimes
        popup
      />
    </div>
  );
}
