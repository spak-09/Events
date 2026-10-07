import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatDate(date, options = {}) {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...options,
  }).format(d);
}

export function formatTime(date) {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(d);
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount || 0);
}

export function truncate(str, length = 30) {
  if (!str) return '';
  return str.length > length ? str.substring(0, length) + '…' : str;
}

export function getResourceId(resource) {
  if (!resource) return undefined;
  return resource.id ?? resource._id ?? undefined;
}

export function getTicketAvailability(ticket, eventStatus, now = Date.now()) {
  const remaining = Math.max(0, Number(ticket?.capacity || 0) - Number(ticket?.sold || 0));
  const salesStart = ticket?.salesWindow?.start ? new Date(ticket.salesWindow.start).getTime() : null;
  const salesEnd = ticket?.salesWindow?.end ? new Date(ticket.salesWindow.end).getTime() : null;
  const eventIsOpen = ['published', 'live'].includes(eventStatus);

  if (!eventIsOpen) {
    return { canRegister: false, isWaitlist: false, remaining, reason: 'Registration is not open for this event.' };
  }
  if (salesStart !== null && now < salesStart) {
    return { canRegister: false, isWaitlist: false, remaining, reason: 'Ticket sales have not opened yet.' };
  }
  if (salesEnd !== null && now > salesEnd) {
    return { canRegister: false, isWaitlist: false, remaining, reason: 'Ticket sales have ended.' };
  }

  return {
    canRegister: true,
    isWaitlist: remaining === 0,
    remaining,
    reason: remaining === 0 ? 'Sold out — join the waitlist.' : `${remaining} passes remaining.`,
  };
}
