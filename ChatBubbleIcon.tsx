import React from 'react';

export const ChatBubbleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193l-3.72 3.72a.75.75 0 01-1.06 0l-3.72-3.72C9.347 17.039 8.5 16.175 8.5 15v-4.285c0-.97.616-1.813 1.5-2.097m6.75 0c0-2.445-2.25-4.193-4.75-4.193S7.5 6.066 7.5 8.511m6.75 0H12" />
  </svg>
);