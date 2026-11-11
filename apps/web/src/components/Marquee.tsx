import { ReactNode } from 'react';

interface MarqueeProps {
  children: ReactNode;
  direction?: 'left' | 'right';
  speed?: number; // seconds for full cycle
  pauseOnHover?: boolean;
  className?: string;
}

export default function Marquee({
  children,
  direction = 'left',
  speed = 30,
  pauseOnHover = true,
  className = '',
}: MarqueeProps) {
  return (
    <div
      className={`group flex overflow-hidden select-none [mask-image:linear-gradient(to_right,transparent,white_10%,white_90%,transparent)] ${className}`}
    >
      <div
        className={`flex shrink-0 items-center justify-around gap-6 py-2 min-w-full ${
          direction === 'left' ? 'animate-marquee' : 'animate-marquee-reverse'
        } ${pauseOnHover ? 'group-hover:[animation-play-state:paused]' : ''}`}
        style={{ animationDuration: `${speed}s` }}
      >
        {children}
      </div>
      <div
        aria-hidden="true"
        className={`flex shrink-0 items-center justify-around gap-6 py-2 min-w-full ${
          direction === 'left' ? 'animate-marquee' : 'animate-marquee-reverse'
        } ${pauseOnHover ? 'group-hover:[animation-play-state:paused]' : ''}`}
        style={{ animationDuration: `${speed}s` }}
      >
        {children}
      </div>
    </div>
  );
}

