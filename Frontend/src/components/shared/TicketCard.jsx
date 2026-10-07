import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Calendar, MapPin, Download, XCircle, Clock } from 'lucide-react';
import { formatDate, formatTime } from '../../lib/utils';

export function TicketCard({
  registration,
  onCancel,
  showActions = true,
  className,
}) {
  const event = registration.event || {};
  const ticketType = registration.ticketType || {};
  const user = registration.user || {};
  const qrToken = registration.qrToken || registration._id || '';
  const status = registration.status;

  const downloadCalendar = () => {
    const title = event.title || 'EventForge Conference';
    const start = event.startDate ? new Date(event.startDate).toISOString().replace(/-|:|\.\d\d\d/g, '') : '';
    const end = event.endDate ? new Date(event.endDate).toISOString().replace(/-|:|\.\d\d\d/g, '') : '';
    const location = typeof event.venue === 'object' ? event.venue.name : 'Event Venue';
    const description = `Ticket: ${ticketType.name || 'General Admission'}\\nQR Token: ${qrToken}`;

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//EventForge//Event Ticket//EN',
      'BEGIN:VEVENT',
      `SUMMARY:${title}`,
      `DESCRIPTION:${description}`,
      `LOCATION:${location}`,
      start ? `DTSTART:${start}` : '',
      end ? `DTEND:${end}` : '',
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR',
    ].filter(Boolean).join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `${title.replace(/\s+/g, '_')}_ticket.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'checked_in':
        return <Badge variant="success">✓ Checked In</Badge>;
      case 'approved':
        return <Badge variant="accent">Approved</Badge>;
      case 'waitlisted':
        return (
          <Badge variant="warning">
            Waitlisted #{registration.waitlistPosition || '1'}
          </Badge>
        );
      case 'pending':
        return <Badge variant="secondary">Pending Review</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div
      className={`relative flex flex-col md:flex-row rounded-3xl border border-border bg-card shadow-card overflow-hidden ${className || ''}`}
    >
      {/* Left / Main Section */}
      <div className="flex-1 p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-3 mb-2">
            <span className="text-xs font-semibold tracking-wider uppercase text-primary">
              {event.category || 'Conference Pass'}
            </span>
            {getStatusBadge()}
          </div>

          <h2 className="text-xl font-bold tracking-tight text-foreground">{event.title}</h2>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {event.description || 'Welcome to EventForge.'}
          </p>

          <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-border/60">
            <div className="flex items-center gap-2 text-xs">
              <Calendar className="h-4 w-4 text-primary shrink-0" />
              <div>
                <div className="font-medium text-foreground">{formatDate(event.startDate)}</div>
                <div className="text-[11px] text-muted-foreground">{formatTime(event.startDate)}</div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <MapPin className="h-4 w-4 text-primary shrink-0" />
              <div className="truncate">
                <div className="font-medium text-foreground truncate">
                  {typeof event.venue === 'object' ? event.venue.name : 'Main Venue'}
                </div>
                <div className="text-[11px] text-muted-foreground">Main Hall</div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-xs">
            <div>
              <span className="text-[10px] uppercase text-muted-foreground tracking-wider block">
                Attendee
              </span>
              <span className="font-medium">{user.name || 'Attendee'}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase text-muted-foreground tracking-wider block">
                Tier
              </span>
              <span className="font-medium text-primary">{ticketType.name || 'Standard'}</span>
            </div>
          </div>
        </div>

        {showActions && status !== 'cancelled' && (
          <div className="flex items-center gap-2 mt-6 pt-4 border-t border-border/50">
            <Button variant="outline" size="sm" onClick={downloadCalendar} className="gap-1.5">
              <Download className="h-3.5 w-3.5" />
              Add to Calendar
            </Button>
            {onCancel && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onCancel(registration._id || registration.id)}
                className="text-destructive hover:bg-destructive/10 gap-1.5 ml-auto"
              >
                <XCircle className="h-3.5 w-3.5" />
                Cancel Ticket
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Perforated Divider */}
      <div className="relative flex md:flex-col items-center justify-center">
        <div className="hidden md:block w-px h-full border-r-2 border-dashed border-border" />
        <div className="md:hidden h-px w-full border-b-2 border-dashed border-border" />
        {/* Top & Bottom cutout circles */}
        <div className="hidden md:block absolute -top-3 w-6 h-6 rounded-full bg-background border border-border" />
        <div className="hidden md:block absolute -bottom-3 w-6 h-6 rounded-full bg-background border border-border" />
      </div>

      {/* Right / QR Stub Section */}
      <div className="w-full md:w-64 p-6 bg-muted/20 flex flex-col items-center justify-center text-center">
        <div className="p-3 bg-white rounded-2xl shadow-sm border border-border/50">
          <QRCodeSVG value={qrToken} size={130} level="M" />
        </div>
        <div className="mt-3 font-mono text-[11px] text-muted-foreground tracking-widest uppercase">
          {qrToken.substring(0, 16)}...
        </div>
        <div className="text-[10px] text-muted-foreground mt-1">
          Scan at registration desk
        </div>
      </div>
    </div>
  );
}
