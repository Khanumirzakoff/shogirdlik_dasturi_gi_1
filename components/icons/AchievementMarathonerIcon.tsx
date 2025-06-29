import React from 'react';

interface IconProps {
  className?: string;
}

export const AchievementMarathonerIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12,2A2,2 0 0,1 14,4A2,2 0 0,1 12,6A2,2 0 0,1 10,4A2,2 0 0,1 12,2M21,9V7L15,13.5C14.8,13.8 14.4,14 14,14C13.6,14 13.2,13.8 13,13.5L10,9.5L6,13.5C5.8,13.8 5.4,14 5,14C4.6,14 4.2,13.8 4,13.5L3,12V14L4,15.5C4.2,15.8 4.6,16 5,16C5.4,16 5.8,15.8 6,15.5L10,11.5L13,15.5C13.2,15.8 13.6,16 14,16C14.4,16 14.8,15.8 15,15.5L21,9M15,18V16H9V18H15M15,22V20H9V22H15Z"/>
    </svg>
  );
};