'use client';

import React, { useState, useEffect, useRef } from 'react';

interface HotelComboBoxProps {
  hotels: string[];
  selectedValue: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export default function HotelComboBox({
  hotels,
  selectedValue,
  onChange,
  placeholder = 'Search hotel...',
  disabled = false,
}: HotelComboBoxProps) {
  const [query, setQuery] = useState(selectedValue);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync state with parent changes
  useEffect(() => {
    setQuery(selectedValue);
  }, [selectedValue]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter hotels based on query
  const filteredHotels = query.trim() === ''
    ? hotels
    : hotels.filter(hotel => 
        hotel.toLowerCase().includes(query.toLowerCase())
      );

  const handleSelect = (hotelName: string) => {
    onChange(hotelName);
    setQuery(hotelName);
    setIsOpen(false);
    setActiveIndex(-1);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    onChange(val); // Update parent state in real-time for custom text
    setIsOpen(true);
    setActiveIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        return;
      }
      setActiveIndex(prev => 
        prev < filteredHotels.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (isOpen && activeIndex >= 0 && activeIndex < filteredHotels.length) {
        handleSelect(filteredHotels[activeIndex]);
      } else {
        // Submit what is typed as a custom value
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <input
        type="text"
        disabled={disabled}
        placeholder={placeholder}
        className="w-full text-sm bg-transparent border border-white/15 px-4 py-3 outline-none focus:border-sand text-sand rounded-none"
        value={query}
        onChange={handleInputChange}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        aria-autocomplete="list"
        aria-expanded={isOpen}
        role="combobox"
      />
      {isOpen && filteredHotels.length > 0 && (
        <ul className="absolute z-50 left-0 right-0 max-h-60 overflow-y-auto bg-midnight border border-white/15 text-sand mt-1 shadow-2xl divide-y divide-white/5">
          {filteredHotels.slice(0, 50).map((hotel, idx) => {
            const isActive = idx === activeIndex;
            return (
              <li
                key={idx}
                onClick={() => handleSelect(hotel)}
                className={`px-4 py-3 text-xs cursor-pointer transition-colors ${
                  isActive 
                    ? 'bg-sand text-midnight font-medium' 
                    : 'hover:bg-white/5 text-sand/90'
                }`}
              >
                {hotel}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
