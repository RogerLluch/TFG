declare namespace YT {
    class Player {
      constructor(elementId: string, options: PlayerOptions);
      loadVideoById(videoId: string): void;
      playVideo(): void;
      pauseVideo(): void;
    }
  
    interface PlayerOptions {
      height?: string;
      width?: string;
      videoId?: string;
      events?: {
        onReady?: (event: PlayerEvent) => void;
        onStateChange?: (event: OnStateChangeEvent) => void;
      };
      playerVars?: PlayerVars;
    }
  
    interface PlayerVars {
      autoplay?: number;
      controls?: number;
      modestbranding?: number;
      showinfo?: number;
      rel?: number;
    }
  
    interface PlayerEvent {
      target: Player;
    }
  
    interface OnStateChangeEvent extends PlayerEvent {
      data: number;
    }
  
    const PlayerState: {
      ENDED: number;
      PLAYING: number;
      PAUSED: number;
      BUFFERING: number;
      CUED: number;
    };
  }