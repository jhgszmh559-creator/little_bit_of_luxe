'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Headphones, Pause, Square } from 'lucide-react';

interface AudioPlayerProps {
  /** Raw text content of the article (stripped of markdown/HTML) */
  articleText: string;
}

export default function AudioPlayer({ articleText }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [supported, setSupported] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    setSupported(typeof window !== 'undefined' && 'speechSynthesis' in window);
  }, []);

  const handlePlay = useCallback(() => {
    if (!supported) return;

    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsPlaying(true);
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(articleText);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.lang = 'en-US';

    // Try to pick a natural-sounding voice
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v => v.name.includes('Samantha')) 
      || voices.find(v => v.name.includes('Karen'))
      || voices.find(v => v.lang.startsWith('en') && v.localService);
    if (preferred) utterance.voice = preferred;

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
    setIsPaused(false);
  }, [articleText, isPaused, supported]);

  const handlePause = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.pause();
    setIsPaused(true);
    setIsPlaying(false);
  }, [supported]);

  const handleStop = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
  }, [supported]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  if (!supported) return null;

  return (
    <div className="audio-player">
      {!isPlaying && !isPaused && (
        <button onClick={handlePlay} className="audio-player__btn" aria-label="Listen to article">
          <Headphones className="w-4 h-4" />
          <span>Listen</span>
        </button>
      )}
      {isPlaying && (
        <div className="audio-player__controls">
          <button onClick={handlePause} className="audio-player__btn audio-player__btn--active" aria-label="Pause">
            <Pause className="w-4 h-4" />
            <span>Listening…</span>
          </button>
          <button onClick={handleStop} className="audio-player__btn-stop" aria-label="Stop">
            <Square className="w-3 h-3" />
          </button>
        </div>
      )}
      {isPaused && (
        <div className="audio-player__controls">
          <button onClick={handlePlay} className="audio-player__btn" aria-label="Resume">
            <Headphones className="w-4 h-4" />
            <span>Resume</span>
          </button>
          <button onClick={handleStop} className="audio-player__btn-stop" aria-label="Stop">
            <Square className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}
