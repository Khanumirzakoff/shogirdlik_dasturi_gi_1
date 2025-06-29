import React from 'react';

interface IconProps {
  className?: string;
}

export const WifiOffIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M2.28 3L1 4.27l2.78 2.78C2.61 7.31 1.78 7.44 1 8.27L12 19.27l3.28-3.28L21.72 22 23 20.73 2.28 3zM7.76 8.46l2.05 2.05-.81.81L7.76 8.46zm8.48 8.48L12 21.18 3.27 12.45c.78-.78 1.61-.91 2.78-1.17l2.05 2.05-.81.81 4.95 4.95 4.95-4.95-.95-.95zm5.49-5.49L12 21.18l-2.24-2.24 2.05-2.05L12 16.73l9.73-9.73c-.78-.78-1.61-.91-2.78-1.17z"/>
    </svg>
  );
};