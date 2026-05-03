'use client';

import { type ReactNode } from 'react';

export default function Marquee({
  items,
  separator = '◆',
  className = '',
}: {
  items: ReactNode[];
  separator?: ReactNode;
  className?: string;
}) {
  const row = (
    <div className="flex shrink-0 items-center gap-12 pr-12">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-12">
          <span className="whitespace-nowrap">{item}</span>
          <span className="text-[#f5f3ee]/30">{separator}</span>
        </span>
      ))}
    </div>
  );

  return (
    <div className={`flex w-full overflow-hidden ${className}`} aria-hidden="true">
      <div className="marquee-track flex">
        {row}
        {row}
      </div>
    </div>
  );
}
