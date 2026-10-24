import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, CheckCircle, Flame } from 'lucide-react';

export default function CountdownBadge({ expiryDateTime, status }) {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  function calculateTimeLeft() {
    if (status === 'expired') {
      return { expired: true, text: 'Expired', state: 'expired' };
    }
    if (status === 'delivered') {
      return { expired: false, text: 'Completed', state: 'completed' };
    }

    const diff = new Date(expiryDateTime) - new Date();
    if (diff <= 0) {
      return { expired: true, text: 'Expired', state: 'expired' };
    }

    const totalMinutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const seconds = Math.floor((diff / 1000) % 60);

    let state = 'fresh';
    if (totalMinutes <= 120) {
      state = 'urgent';
    } else if (totalMinutes <= 240) {
      state = 'soon';
    }

    const pad = (n) => String(n).padStart(2, '0');
    const text = hours > 0 
      ? `${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`
      : `${pad(minutes)}m ${pad(seconds)}s`;

    return { expired: false, text, totalMinutes, state };
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    return () => clearInterval(timer);
  }, [expiryDateTime, status]);

  if (status === 'delivered') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
        <CheckCircle className="w-3.5 h-3.5" />
        Delivered
      </span>
    );
  }

  if (timeLeft.expired || timeLeft.state === 'expired') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-300">
        <Clock className="w-3.5 h-3.5" />
        Expired
      </span>
    );
  }

  if (timeLeft.state === 'urgent') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-300 shadow-sm animate-urgent">
        <Flame className="w-3.5 h-3.5 text-rose-600 fill-rose-500 animate-pulse" />
        <span className="uppercase tracking-wider">Urgent:</span>
        <span className="font-mono">{timeLeft.text}</span>
      </span>
    );
  }

  if (timeLeft.state === 'soon') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
        <span>Expiring:</span>
        <span className="font-mono">{timeLeft.text}</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
      <Clock className="w-3.5 h-3.5 text-emerald-600" />
      <span>Safe for:</span>
      <span className="font-mono">{timeLeft.text}</span>
    </span>
  );
}
