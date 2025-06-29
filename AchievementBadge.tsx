

import React from 'react';
import { UserAchievement, TaskType } from '../types';
import { ALL_ACHIEVEMENTS, UZBEK_STRINGS, TASK_CATEGORIES } from '../constants';

interface AchievementBadgeProps {
  userAchievement: UserAchievement;
}

const AchievementBadge: React.FC<AchievementBadgeProps> = ({ userAchievement }) => {
  const achievementDetails = ALL_ACHIEVEMENTS.find(a => a.id === userAchievement.achievementId);

  if (!achievementDetails) return null;

  const Icon = achievementDetails.icon;
  const taskCategory = TASK_CATEGORIES.find(cat => cat.name === achievementDetails.taskType);
  const TaskIcon = taskCategory?.icon;

  const unlockedDate = new Date(userAchievement.unlockedAt).toLocaleDateString('uz-UZ', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const tooltipText = `${achievementDetails.description} (${UZBEK_STRINGS.unlockedOn} ${unlockedDate})`;

  return (
    <div
      className="flex flex-col items-center text-center group"
      title={tooltipText}
    >
      <div className="relative">
        <div
          className="w-20 h-20 md:w-24 md:h-24 flex items-center justify-center 
                     bg-gradient-to-br from-sky-400 to-indigo-600 
                     transition-all duration-300 ease-in-out 
                     group-hover:-translate-y-1.5 group-hover:drop-shadow-lg"
          style={{
            clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
          }}
        >
          <Icon className="w-9 h-9 md:w-11 md:h-11 text-white" />
        </div>
        {TaskIcon && (
          <div className="absolute -top-1 -right-1 bg-white p-0.5 rounded-full shadow-md z-10 transition-transform group-hover:scale-110">
            <TaskIcon className="w-4 h-4" style={{color: achievementDetails.taskType ? TASK_CATEGORIES.find(c => c.name === achievementDetails.taskType)?.icon ? "black" : "gray" : "gray"}} />
          </div>
        )}
      </div>
      <p className="text-xs font-semibold text-gray-800 mt-3 max-w-[100px] break-words">
        {achievementDetails.name}
      </p>
    </div>
  );
};

export default AchievementBadge;