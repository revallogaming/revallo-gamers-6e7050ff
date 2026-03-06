"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2 } from "lucide-react";
import { Slider } from "@/components/ui/slider";

interface AudioPlayerProps {
  src: string;
  isOwn?: boolean;
}

export function AudioPlayer({ src, isOwn }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const onLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const onTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const onEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className={`flex items-center gap-3 p-3 rounded-2xl min-w-[200px] ${isOwn ? "bg-primary/20" : "bg-white/5"}`}>
      <audio
        ref={audioRef}
        src={src}
        onLoadedMetadata={onLoadedMetadata}
        onTimeUpdate={onTimeUpdate}
        onEnded={onEnded}
      />
      
      <button
        onClick={togglePlay}
        className={`h-10 w-10 flex items-center justify-center rounded-xl transition-all ${
          isOwn ? "bg-primary text-black" : "bg-primary text-black"
        }`}
      >
        {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-1" />}
      </button>

      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between gap-4">
           <Slider
            value={[currentTime]}
            max={duration}
            step={0.1}
            onValueChange={(val) => {
              if (audioRef.current) {
                audioRef.current.currentTime = val[0];
              }
            }}
            className="flex-1"
          />
        </div>
        <div className="flex justify-between text-[10px] font-black uppercase italic opacity-60">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
      
      <div className="flex items-center gap-1 opacity-40">
        <Volume2 size={12} />
      </div>
    </div>
  );
}
