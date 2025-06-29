import React from 'react';

interface IconProps {
  className?: string;
}

export const AchievementFirst10kIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M5,16L3,5H1V3H4L6,14L7,10H9L11,14L12,10H14L15,14L17,3H19V5L17,16H15L14,12L13,16H11L10,12L9,16H5Z"/>
    </svg>
  );
};