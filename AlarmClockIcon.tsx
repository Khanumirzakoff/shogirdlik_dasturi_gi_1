
import React from 'react';

// Using Tabler Icons: alarm
export const AlarmClockIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
    <circle cx="12" cy="13" r="7" />
    <polyline points="12 10 12 13 14 13" />
    <line x1="7" y1="4" x2="4.25" y2="6" />
    <line x1="17" y1="4" x2="19.75" y2="6" />
  </svg>
);