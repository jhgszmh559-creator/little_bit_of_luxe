'use client';

import React, { useState } from 'react';
import { Play } from 'lucide-react';

interface VideoTheatreProps {
  youtubeId: string;
  title: string;
  coverImage: string;
}

export default function VideoTheatre({ youtubeId, title, coverImage }: VideoTheatreProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  if (isPlaying) {
    return (
      <div className="relative w-full h-full aspect-video bg-black">
        <iframe
          src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full border-none"
        />
      </div>
    );
  }

  return (
    <div 
      className="relative w-full h-full cursor-pointer group overflow-hidden bg-midnight"
      onClick={() => setIsPlaying(true)}
    >
      <img
        src={coverImage || "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80"}
        alt={title}
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
      />
      {/* Branded Overlay */}
      <div className="absolute inset-0 bg-midnight/35 group-hover:bg-midnight/45 transition-colors flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-full border border-sand bg-midnight/80 flex items-center justify-center text-sand group-hover:bg-sand group-hover:text-midnight transition-all duration-300 transform group-hover:scale-110 shadow-lg" style={{ borderRadius: '999px' }}>
            <Play className="w-6 h-6 fill-current translate-x-[2px]" />
          </div>
          <span className="lbl-eyebrow text-sand text-[10px] tracking-[0.2em] opacity-90 group-hover:opacity-100 transition-opacity">
            Play Inspection Film
          </span>
        </div>
      </div>
    </div>
  );
}
