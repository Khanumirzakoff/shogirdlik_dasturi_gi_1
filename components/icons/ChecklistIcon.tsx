import React from 'react';

interface IconProps {
  className?: string;
}

export const ChecklistIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M14,10H2V12H14V10M14,6H2V8H14V6M2,16H10V14H2V16M21.5,11.5L23,13L16,20L11.5,15.5L13,14L16,17L21.5,11.5Z"/>
    </svg>
  );
};