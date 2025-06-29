
import React from 'react';

// Generic Map Icon
export const MapIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.5-10.5v.75M9 15s-4.5-1.5-4.5-6V4.5L9 3l6 1.5v6.75L9 15zm0 0V9m6 6V9m0 6l6-1.5V4.5L15 3l-6 1.5" />
  </svg>
);
