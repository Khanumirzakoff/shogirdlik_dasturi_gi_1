
import React from 'react';
import { UserAchievement } from '../types';
import { UZBEK_STRINGS } from '../constants';
import AchievementBadge from './AchievementBadge';

interface AchievementsSectionProps {
  achievements: UserAchievement[];
}

const AchievementsSection: React.FC<AchievementsSectionProps> = ({ achievements }) => {
  // Sort achievements to show most recent first
  const sortedAchievements = [...achievements].sort((a, b) => new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime());

  return (
    <div className="bg-white p-4 rounded-none shadow-md border border-gray-200">
      <h3 className="text-lg font-semibold text-black mb-4">{UZBEK_STRINGS.achievements}</h3>
      {sortedAchievements.length > 0 ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-y-4 gap-x-2 md:gap-x-4">
          {sortedAchievements.map(ach => (
            <AchievementBadge key={ach.achievementId} userAchievement={ach} />
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-sm text-center py-4">{UZBEK_STRINGS.noAchievements}</p>
      )}
    </div>
  );
};

export default AchievementsSection;
