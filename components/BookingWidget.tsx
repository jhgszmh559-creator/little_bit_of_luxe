'use client';

import React, { useState, useEffect } from 'react';

interface BookingWidgetProps {
  hotelName: string;
  programName: string;
  programNotes: string;
  bookingLink?: string;
}

export default function BookingWidget({
  hotelName,
  programName,
  programNotes,
  bookingLink = 'https://www.qxtravel.io/search-hotels',
}: BookingWidgetProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [childAges, setChildAges] = useState<string[]>([]);
  const [roomType, setRoomType] = useState('Luxury Suite');
  const [notes, setNotes] = useState('');

  // UI States
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);

  // Date Boundaries
  const [todayStr, setTodayStr] = useState('');
  const [oneYearStr, setOneYearStr] = useState('');

  useEffect(() => {
    const today = new Date();
    const todayStrResolved = today.toISOString().split('T')[0];
    setTodayStr(todayStrResolved);

    const oneYear = new Date();
    oneYear.setFullYear(today.getFullYear() + 1);
    const oneYearStrResolved = oneYear.toISOString().split('T')[0];
    setOneYearStr(oneYearStrResolved);
  }, []);

  // Sync child ages array size with children count
  useEffect(() => {
    setChildAges(prev => {
      const next = [...prev];
      if (next.length < children) {
        while (next.length < children) next.push('8'); // Default to 8 years old
      } else if (next.length > children) {
        next.splice(children);
      }
      return next;
    });
  }, [children]);

  // Minimum check-out date is check-in + 1 day
  const getMinCheckOutDate = () => {
    if (!checkIn) return todayStr;
    const checkInDate = new Date(checkIn);
    checkInDate.setDate(checkInDate.getDate() + 1);
    return checkInDate.toISOString().split('T')[0];
  };

  const handleCheckInChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCheckIn(value);

    // If check-out is now before or same as check-in, reset check-out
    if (checkOut) {
      const inDate = new Date(value);
      const outDate = new Date(checkOut);
      if (outDate <= inDate) {
        setCheckOut('');
      }
    }
  };

  const handleChildAgeChange = (index: number, age: string) => {
    setChildAges(prev => {
      const next = [...prev];
      next[index] = age;
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Client-side validation checks
    if (!name.trim() || !email.trim() || !checkIn || !checkOut) {
      setErrorMsg('Please complete all required fields.');
      return;
    }

    const inDate = new Date(checkIn);
    const outDate = new Date(checkOut);

    if (inDate === outDate) {
      setErrorMsg('Check-out date cannot be the same as check-in date (minimum 1 night).');
      return;
    }

    if (outDate < inDate) {
      setErrorMsg('Check-out date must be after check-in date.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/booking-inquiry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          hotelName,
          checkIn,
          checkOut,
          adults,
          children,
          childAges: children > 0 ? childAges.map(Number) : [],
          roomType,
          notes,
          programName,
        }),
      });

      const resData = await response.json();
      if (response.ok) {
        setSuccess(true);
      } else {
        setErrorMsg(resData.error || 'Failed to submit booking inquiry. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('A network error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Convert notes into checklist benefits
  const parsedPerksList = programNotes
    .split(/[;.\n]/)
    .map(p => p.trim())
    .filter(p => p.length > 12); // Exclude very short chunks

  return (
    <div className="my-12 relative border border-white/10 bg-midnight text-sand p-8 md:p-10 shadow-2xl">
      {success ? (
        <div className="flex flex-col items-center justify-center text-center py-12 animate-fadeIn">
          <div className="w-16 h-16 rounded-full border border-sand flex items-center justify-center mb-6">
            <span className="text-sand text-2xl font-serif">✓</span>
          </div>
          <h3 className="lbl-h3 text-sand mb-4">Inquiry Received</h3>
          <p className="lbl-body text-sand/80 max-w-[440px] text-sm mb-6 leading-relaxed">
            Your booking inquiry for <strong>{hotelName}</strong> via the <strong>{programName}</strong> program has been dispatched.
          </p>
          <p className="text-xs text-sand-3 italic max-w-[360px] leading-relaxed">
            Our booking specialists at QX Travel will contact you at <strong>{email}</strong> shortly with your preferred rates and confirmed privileges.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div>
            <p className="lbl-eyebrow text-sand/70 mb-2 uppercase tracking-wider text-[10px]">
              THE PREFERRED PRIVILEGE &mdash; {programName}
            </p>
            <h3 className="lbl-h3 text-sand font-serif text-2xl mb-4">
              Book {hotelName} with Perks
            </h3>
            
            {parsedPerksList.length > 0 ? (
              <div className="flex flex-col gap-2 border-t border-b border-white/10 py-4 mb-6">
                <span className="text-[10px] tracking-wider uppercase text-sand-3 font-semibold mb-1">
                  EXCLUSIVE PRIVILEGES INCLUDED:
                </span>
                {parsedPerksList.map((perk, i) => (
                  <div key={i} className="flex items-start gap-3 text-xs text-sand/90">
                    <span className="text-sand shrink-0">✦</span>
                    <span>{perk}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="lbl-body text-sand/80 text-xs mb-6 leading-relaxed">
                {programNotes}
              </p>
            )}
          </div>

          {errorMsg && (
            <div className="p-4 bg-bordeaux/20 border border-bordeaux/40 text-sand text-xs">
              <strong>Error:</strong> {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* traveler details */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] tracking-wider uppercase text-sand-3 font-semibold">
                Full Name *
              </label>
              <input
                type="text"
                required
                disabled={isLoading}
                placeholder="e.g. Alexander Mercer"
                className="w-full text-sm bg-transparent border border-white/15 px-4 py-3 outline-none focus:border-sand text-sand rounded-none"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] tracking-wider uppercase text-sand-3 font-semibold">
                Email Address *
              </label>
              <input
                type="email"
                required
                disabled={isLoading}
                placeholder="e.g. alexander@mercer.com"
                className="w-full text-sm bg-transparent border border-white/15 px-4 py-3 outline-none focus:border-sand text-sand rounded-none"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Dates range picker */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] tracking-wider uppercase text-sand-3 font-semibold">
                Check-in Date *
              </label>
              <input
                type="date"
                required
                disabled={isLoading}
                min={todayStr}
                max={oneYearStr}
                className="w-full text-sm bg-transparent border border-white/15 px-4 py-3 outline-none focus:border-sand text-sand rounded-none"
                value={checkIn}
                onChange={handleCheckInChange}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] tracking-wider uppercase text-sand-3 font-semibold">
                Check-out Date *
              </label>
              <input
                type="date"
                required
                disabled={isLoading || !checkIn}
                min={getMinCheckOutDate()}
                max={oneYearStr}
                className="w-full text-sm bg-transparent border border-white/15 px-4 py-3 outline-none focus:border-sand text-sand rounded-none disabled:opacity-50"
                value={checkOut}
                onChange={e => setCheckOut(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* guest counts */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] tracking-wider uppercase text-sand-3 font-semibold">
                Adults
              </label>
              <select
                disabled={isLoading}
                className="w-full text-sm bg-midnight border border-white/15 px-4 py-3 outline-none focus:border-sand text-sand rounded-none"
                value={adults}
                onChange={e => setAdults(Number(e.target.value))}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                  <option key={n} value={n}>{n} Adult{n > 1 ? 's' : ''}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] tracking-wider uppercase text-sand-3 font-semibold">
                Children
              </label>
              <select
                disabled={isLoading}
                className="w-full text-sm bg-midnight border border-white/15 px-4 py-3 outline-none focus:border-sand text-sand rounded-none"
                value={children}
                onChange={e => setChildren(Number(e.target.value))}
              >
                {[0, 1, 2, 3, 4].map(n => (
                  <option key={n} value={n}>{n} Child{n > 1 ? 'ren' : ''}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] tracking-wider uppercase text-sand-3 font-semibold">
                Preferred Room Category
              </label>
              <input
                type="text"
                disabled={isLoading}
                placeholder="e.g. Grand Suite"
                className="w-full text-sm bg-transparent border border-white/15 px-4 py-3 outline-none focus:border-sand text-sand rounded-none"
                value={roomType}
                onChange={e => setRoomType(e.target.value)}
              />
            </div>
          </div>

          {/* Child age selectors */}
          {children > 0 && (
            <div className="flex flex-col gap-3 p-4 bg-white/5 border border-white/10 border-t-0 -mt-2 animate-fadeIn">
              <span className="text-[9px] tracking-wider uppercase text-sand-3 font-semibold">
                Please specify child ages (required to calculate benefits & room capacities):
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {childAges.map((age, idx) => (
                  <div key={idx} className="flex flex-col gap-1">
                    <label className="text-[9px] text-sand/80">Child {idx + 1} Age</label>
                    <select
                      disabled={isLoading}
                      className="text-xs bg-midnight border border-white/15 px-2 py-1.5 outline-none text-sand rounded-none"
                      value={age}
                      onChange={e => handleChildAgeChange(idx, e.target.value)}
                    >
                      {Array.from({ length: 18 }).map((_, a) => (
                        <option key={a} value={a}>{a} year{a !== 1 ? 's' : ''} old</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] tracking-wider uppercase text-sand-3 font-semibold">
              Special Requests &amp; Notes
            </label>
            <textarea
              disabled={isLoading}
              rows={3}
              placeholder="e.g. Requesting connecting rooms, early check-in, or celebrating an anniversary..."
              className="w-full text-sm bg-transparent border border-white/15 px-4 py-3 outline-none focus:border-sand text-sand rounded-none resize-none"
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-2">
            <p className="text-[9px] text-sand-3 italic leading-relaxed max-w-[320px]">
              * Rates correspond exactly to the hotel's best flexible rates. Loyalty program nights &amp; points will be fully recognized.
            </p>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto bg-sand text-midnight text-[10px] uppercase font-bold tracking-widest px-8 py-4 cursor-pointer hover:bg-white hover:text-midnight transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Submitting Inquiry...' : 'Submit Booking Request'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
