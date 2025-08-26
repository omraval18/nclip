import React, { useRef, useCallback, useMemo, useReducer, useEffect } from 'react';
import { FastForwardIcon, PauseIcon, PlayIcon } from '@phosphor-icons/react';
import { Button } from './ui/button';
import { formatRemainingTime, formatTime } from '@/lib/utils';

const PLAYBACK_RATES = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0] as const;
const CONTROLS_HIDE_DELAY = 3000;
const SKIP_SECONDS = 10;

interface VideoPlayerProps {
  src: string;
  className?: string;
  name?: string;
  onError?: (error: Error) => void;
}

interface VideoState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackRate: number;
  isLoading: boolean;
  showControls: boolean;
  isDragging: boolean;
}

type VideoAction =
  | { type: 'SET_PLAYING'; payload: boolean }
  | { type: 'SET_TIME'; payload: number }
  | { type: 'SET_DURATION'; payload: number }
  | { type: 'SET_PLAYBACK_RATE'; payload: number }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_CONTROLS'; payload: boolean }
  | { type: 'SET_DRAGGING'; payload: boolean }
  | { type: 'RESET' };

const videoReducer = (state: VideoState, action: VideoAction): VideoState => {
  switch (action.type) {
    case 'SET_PLAYING':
      return { ...state, isPlaying: action.payload };
    case 'SET_TIME':
      return { ...state, currentTime: action.payload };
    case 'SET_DURATION':
      return { ...state, duration: action.payload };
    case 'SET_PLAYBACK_RATE':
      return { ...state, playbackRate: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_CONTROLS':
      return { ...state, showControls: action.payload };
    case 'SET_DRAGGING':
      return { ...state, isDragging: action.payload };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
};

const initialState: VideoState = {
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  playbackRate: 1.0,
  isLoading: true,
  showControls: true,
  isDragging: false,
};


export const VideoPlayer: React.FC<VideoPlayerProps> = ({ 
  src, 
  className = '',
  name,
  onError 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const hideControlsTimeoutRef = useRef<number>(null);
  const animationFrameRef = useRef<number>(null);
  
  const [state, dispatch] = useReducer(videoReducer, initialState);

  const progressPercentage = useMemo(() => {
    if (state.duration <= 0) return 0;
    return (state.currentTime / state.duration) * 100;
  }, [state.currentTime, state.duration]);

  const nextPlaybackRate = useMemo(() => {
    const currentIndex = PLAYBACK_RATES.indexOf(state.playbackRate as typeof PLAYBACK_RATES[number]);
    return PLAYBACK_RATES[(currentIndex + 1) % PLAYBACK_RATES.length];
  }, [state.playbackRate]);

  const resetHideControlsTimer = useCallback(() => {
    if (hideControlsTimeoutRef.current) {
      clearTimeout(hideControlsTimeoutRef.current);
    }
    
    dispatch({ type: 'SET_CONTROLS', payload: true });
    
    if (state.isPlaying && !state.isDragging) {
      hideControlsTimeoutRef.current = window.setTimeout(() => {
        dispatch({ type: 'SET_CONTROLS', payload: false });
      }, CONTROLS_HIDE_DELAY);
    }
  }, [state.isPlaying, state.isDragging]);

  const togglePlayPause = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    
    if (video.paused) {
      video.play().catch((error) => {
        console.error('Failed to play video:', error);
        onError?.(error);
      });
    } else {
      video.pause();
    }
  }, [onError]);

  const skipTime = useCallback((seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    
    const newTime = Math.max(0, Math.min(video.currentTime + seconds, state.duration));
    video.currentTime = newTime;
    
    dispatch({ type: 'SET_TIME', payload: newTime });
  }, [state.duration]);

  const changePlaybackRate = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    
    dispatch({ type: 'SET_PLAYBACK_RATE', payload: nextPlaybackRate });
    video.playbackRate = nextPlaybackRate;
  }, [nextPlaybackRate]);

  const handleProgressInteraction = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    
    const video = videoRef.current;
    const progressBar = progressRef.current;
    if (!video || !progressBar) return;
    
    const rect = progressBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = percentage * state.duration;
    
    video.currentTime = newTime;
    dispatch({ type: 'SET_TIME', payload: newTime });
  }, [state.duration]);

  const handleProgressMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    dispatch({ type: 'SET_DRAGGING', payload: true });
    handleProgressInteraction(e);
    
    const handleMouseMove = (e: MouseEvent) => {
      const progressBar = progressRef.current;
      const video = videoRef.current;
      if (!progressBar || !video) return;
      
      const rect = progressBar.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, clickX / rect.width));
      const newTime = percentage * state.duration;
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      animationFrameRef.current = requestAnimationFrame(() => {
        video.currentTime = newTime;
        dispatch({ type: 'SET_TIME', payload: newTime });
      });
    };
    
    const handleMouseUp = () => {
      dispatch({ type: 'SET_DRAGGING', payload: false });
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [handleProgressInteraction, state.duration]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlers = {
      loadedmetadata: () => {
        dispatch({ type: 'SET_DURATION', payload: video.duration });
        dispatch({ type: 'SET_LOADING', payload: false });
      },
      timeupdate: () => {
        if (!state.isDragging) {
          dispatch({ type: 'SET_TIME', payload: video.currentTime });
        }
      },
      play: () => {
        dispatch({ type: 'SET_PLAYING', payload: true });
        resetHideControlsTimer();
      },
      pause: () => {
        dispatch({ type: 'SET_PLAYING', payload: false });
        dispatch({ type: 'SET_CONTROLS', payload: true });
      },
      ended: () => {
        dispatch({ type: 'SET_PLAYING', payload: false });
        dispatch({ type: 'SET_CONTROLS', payload: true });
      },
      waiting: () => dispatch({ type: 'SET_LOADING', payload: true }),
      canplay: () => dispatch({ type: 'SET_LOADING', payload: false }),
      error: () => {
        dispatch({ type: 'SET_LOADING', payload: false });
        onError?.(new Error('Video failed to load'));
      }
    };

    Object.entries(handlers).forEach(([event, handler]) => {
      video.addEventListener(event, handler);
    });

    return () => {
      Object.entries(handlers).forEach(([event, handler]) => {
        video.removeEventListener(event, handler);
      });
    };
  }, [state.isDragging, resetHideControlsTimer, onError]);

  useEffect(() => {
    return () => {
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
      <div
          className={`aspect-[9/16] w-full rounded-2xl overflow-hidden bg-black relative group ${className}`}
          onMouseMove={resetHideControlsTimer}
          onMouseEnter={() => dispatch({ type: "SET_CONTROLS", payload: true })}
          onMouseLeave={() => {
              if (state.isPlaying && !state.isDragging) {
                  hideControlsTimeoutRef.current = window.setTimeout(() => {
                      dispatch({ type: "SET_CONTROLS", payload: false });
                  }, 1000);
              }
          }}
          onClick={togglePlayPause}
      >
          <video
              ref={videoRef}
              className="h-full w-full object-cover cursor-pointer rounded-2xl"
              src={src}
              preload="metadata"
              playsInline
          />

          <div
              className={`absolute bottom-5 left-5 right-5 px-4 py-2 transition-opacity duration-300 rounded-3xl glass-card ease-[cubic-bezier(0.65,0,0.35,1)] ${
                  state.showControls ? "opacity-100" : "opacity-0 pointer-events-none"
              }`}
              onClick={(e) => e.stopPropagation()}
          >
              <div className="text-sm font-medium truncate py-2">{name}</div>
              <div>
                  <div
                      ref={progressRef}
                      className="h-1.5 bg-white/30 rounded-full cursor-pointer relative group/progress"
                      onClick={handleProgressInteraction}
                      onMouseDown={handleProgressMouseDown}
                  >
                      <div
                          className="h-full bg-white rounded-full relative transition-all duration-150"
                          style={{
                              width: `${progressPercentage}%`,
                              transition: state.isDragging ? "none" : "width 150ms",
                          }}
                      >
                          <div
                              className={`absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg transition-opacity ${
                                  state.isDragging
                                      ? "opacity-100 scale-125"
                                      : "opacity-0 group-hover/progress:opacity-100"
                              }`}
                          />
                      </div>
                  </div>
              </div>

              <div className="flex justify-between items-center mb-3">
                  <span className="text-white text-sm font-medium tabular-nums">
                      {formatTime(state.currentTime)}
                  </span>
                  <Button
                      onClick={(e) => {
                          e.stopPropagation();
                          changePlaybackRate();
                      }}
                      variant={"ghost"}
                      size={"icon"}
                      className="text-white text-sm font-medium px-2 py-1 rounded-full transition-colors"
                      aria-label={`Playback speed: ${state.playbackRate}x`}
                  >
                      {state.playbackRate}x
                  </Button>
                  <span className="text-white text-sm font-medium tabular-nums">
                      {formatRemainingTime(state.currentTime, state.duration)}
                  </span>
              </div>

              <div className="flex items-center justify-center space-x-6 mb-2">
                  <Button
                      onClick={(e) => {
                          e.stopPropagation();
                          skipTime(-SKIP_SECONDS);
                      }}
                      variant="ghost"
                      size="icon"
                      className="text-white hover:text-white/80 transition-colors p-2"
                      aria-label={`Rewind ${SKIP_SECONDS} seconds`}
                  >
                      <FastForwardIcon className="size-5 rotate-180" weight="fill" />
                  </Button>

                  <Button
                      onClick={(e) => {
                          e.stopPropagation();
                          togglePlayPause();
                      }}
                      variant="ghost"
                      size="icon"
                      className="text-white hover:text-white/80 transition-colors bg-white/15 rounded-full p-3 backdrop-blur-sm hover:bg-white/25"
                      aria-label={state.isPlaying ? "Pause" : "Play"}
                  >
                      {state.isPlaying ? (
                          <PauseIcon className="size-5" weight="fill" />
                      ) : (
                          <PlayIcon className="size-5" weight="fill" />
                      )}
                  </Button>

                  <Button
                      onClick={(e) => {
                          e.stopPropagation();
                          skipTime(SKIP_SECONDS);
                      }}
                      variant="ghost"
                      size="icon"
                      className="text-white hover:text-white/80 transition-colors p-2"
                      aria-label={`Forward ${SKIP_SECONDS} seconds`}
                  >
                      <FastForwardIcon className="size-5" weight="fill" />
                  </Button>
              </div>
          </div>

          {state.isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 pointer-events-none">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
              </div>
          )}
      </div>
  );
};