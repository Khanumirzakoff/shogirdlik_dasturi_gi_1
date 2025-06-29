import React from 'react';

export const WifiOffIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12.75 15l3-3m0 0l-3-3m3 3h-7.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.031 8.657l1.453 1.453A7.501 7.501 0 0012 19.5a7.5 7.5 0 006.516-9.39l1.453-1.453M9.75 12.75L14.25 8.25" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.969 8.657L18.516 10.11M4.031 15.343L5.484 13.89m13.032 0L17.063 12m-4.032 4.5l-1.453 1.453" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
  </svg>
);
// Note: This is a more complex WifiOffIcon than a simple line-through.
// A simpler version might be:
// <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
//   <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 4.5l7.5 7.5-7.5 7.5" />  // Example part for wifi signal
//   <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" /> // Line through
// </svg>
// I've used a more standard one above for better recognizability.
