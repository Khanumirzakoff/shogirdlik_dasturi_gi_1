

import React, { useContext, useMemo, useState } from 'react';
import { AppContext } from '../contexts/AppContext';
import { User, FeedItem, TaskType, RunningFeedItem, UserAchievement } from '../types';
import { UZBEK_STRINGS, TASK_CATEGORIES } from '../constants';
import { XIcon } from './icons/XIcon'; 
import FeedCard from './FeedCard';
import MonthlyActivityChart from './MonthlyActivityChart'; 
import { getUserLevel } from '../utils'; 
import AchievementsSection from './AchievementsSection';
import { AllTasksIcon } from './icons/AllTasksIcon';

interface UserProfileViewProps {
  userId: string;
  onClose: () => void;
  onOpenEditProfile?: () => void; // This is no longer used but kept for type safety in App.tsx
}

const getMonthlyTaskTypeActivity = (items: FeedItem[], targetUserId: string): Record<string, Partial<Record<TaskType, number>>> => {
  const activity: Record<string, Partial<Record<TaskType, number>>> = {};
  items
    .filter(item => item.userId === targetUserId)
    .forEach(item => {
      const dateToUse = item.type === TaskType.RUNNING && (item as RunningFeedItem).eventTimestamp
        ? (item as RunningFeedItem).eventTimestamp
        : item.timestamp;
      const eventDate = new Date(dateToUse);
      const monthYear = `${UZBEK_STRINGS.months[eventDate.getMonth()]} ${eventDate.getFullYear()}`;

      if (!activity[monthYear]) {
        activity[monthYear] = {};
      }
      const currentTaskType = item.type;
      activity[monthYear][currentTaskType] = (activity[monthYear][currentTaskType] || 0) + 1;
    });
  return activity;
};


const UserProfileView: React.FC<UserProfileViewProps> = ({ userId, onClose, onOpenEditProfile }) => {
  const context = useContext(AppContext);
  const [profileSelectedTaskFilter, setProfileSelectedTaskFilter] = useState<TaskType | null>(null); 

  if (!context) {
    return <div className="flex items-center justify-center h-full bg-white text-slate-900 p-4">Yuklanmoqda...</div>;
  }

  const { allUsers, feedItems, getUserRating, currentUser, getUserAchievements } = context;

  const user = useMemo(() => allUsers.find(u => u.id === userId), [allUsers, userId]);
  
  const userFeedItems = useMemo(() => {
    let items = feedItems
      .filter(item => item.userId === userId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    if (profileSelectedTaskFilter) {
      items = items.filter(item => item.type === profileSelectedTaskFilter);
    }
    return items;
  }, [feedItems, userId, profileSelectedTaskFilter]);

  const userTotalRating = useMemo(() => getUserRating(userId, null), [getUserRating, userId, feedItems]);
  const userLevelData = useMemo(() => getUserLevel(userTotalRating), [userTotalRating]);
  
  const monthlyTaskTypeActivity = useMemo(() => getMonthlyTaskTypeActivity(feedItems, userId), [feedItems, userId]);
  
  const userAchievements = useMemo(() => {
    return getUserAchievements(userId);
  }, [getUserAchievements, userId]);


  const isCurrentUserProfile = currentUser?.id === userId;

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-slate-900 bg-white">
        <p>Foydalanuvchi topilmadi.</p>
        <button onClick={onClose} className="mt-4 px-4 py-2 bg-black text-white rounded-sm hover:bg-gray-800">
          {UZBEK_STRINGS.back}
        </button>
      </div>
    );
  }

  const filterButtonBaseClass = "px-3 py-1.5 text-xs font-medium rounded-full transition-colors duration-150 ease-in-out focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-black flex items-center space-x-1.5";
  const activeFilterClass = "bg-black text-white";
  const inactiveFilterClass = "bg-gray-100 text-gray-700 hover:bg-gray-200";

  return (
    <div className="flex flex-col h-full w-full bg-gray-50 rounded-none"> 
      <header className="sticky top-0 bg-white/80 backdrop-blur-md p-4 flex items-center justify-between z-30 border-b border-gray-200 rounded-none"> 
        <button onClick={onClose} className="p-2 text-gray-600 hover:text-black rounded-full hover:bg-gray-100 transition-colors">
          <XIcon className="w-6 h-6" /> 
        </button>
        <h1 className="text-xl font-semibold text-black">{isCurrentUserProfile ? UZBEK_STRINGS.myProgress : UZBEK_STRINGS.userProfileTitle}</h1>
        <div className="w-10 h-10"></div> {/* Placeholder for alignment */}
      </header>

      <div className="flex-grow overflow-y-auto p-4 md:p-6 space-y-6 no-scrollbar"> 
        <div className="bg-white p-5 rounded-none shadow-md border border-gray-200 flex flex-col items-center text-center">
          <img
            src={user.profilePictureUrl || `https://picsum.photos/seed/${user.id}/100/100`}
            alt={`${user.name} ${user.surname}`}
            className="w-24 h-24 rounded-full object-cover border-2 border-black mb-3" 
          />
          <h2 className="text-2xl font-bold text-black">{user.name} {user.surname}</h2>
          <p className="text-sky-600 font-semibold">{userTotalRating} ball</p>
          <div className="mt-2 w-full max-w-xs">
            <div className="flex justify-between text-xs text-gray-600 mb-0.5">
              <span>{UZBEK_STRINGS.level} {userLevelData.level} ({userLevelData.name})</span>
              {userLevelData.nextLevelPoints !== null && (
                <span>{userTotalRating} / {userLevelData.nextLevelPoints}</span>
              )}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-sky-500 h-2.5 rounded-full transition-all duration-500 ease-out" 
                style={{ width: `${userLevelData.progress}%` }}
                title={`${userLevelData.progress.toFixed(0)}%`}
              ></div>
            </div>
            {userLevelData.nextLevelPoints !== null && (
              <p className="text-xs text-gray-500 mt-0.5">
                {UZBEK_STRINGS.pointsToNextLevel(userLevelData.nextLevelPoints - userTotalRating)}
              </p>
            )}
            {userLevelData.nextLevelPoints === null && (
                <p className="text-xs text-sky-600 mt-1 font-medium">{UZBEK_STRINGS.maxLevelReached}</p>
            )}
          </div>
          {/* Redundant "Edit Profile" button removed from here. Editing is done via Sidebar. */}
        </div>

        <AchievementsSection achievements={userAchievements} />

        <div className="bg-white p-4 rounded-none shadow-md border border-gray-200">
          <h3 className="text-lg font-semibold text-black mb-3">{UZBEK_STRINGS.monthlyActivityGraphTitle}</h3>
          <MonthlyActivityChart data={monthlyTaskTypeActivity} />
        </div>
        
        <div>
          <h3 className="text-lg font-semibold text-black mb-3 px-1">{UZBEK_STRINGS.userTasks}</h3>
          
          <div className="w-full">
            <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar pb-2">
              <button 
                onClick={() => setProfileSelectedTaskFilter(null)}
                className={`${filterButtonBaseClass} ${profileSelectedTaskFilter === null ? activeFilterClass : inactiveFilterClass}`}
              >
                <AllTasksIcon className="w-4 h-4" />
                <span>{UZBEK_STRINGS.all}</span>
              </button>
              {TASK_CATEGORIES.map(category => {
                const isActive = profileSelectedTaskFilter === category.name;
                return (
                  <button
                    key={category.name}
                    onClick={() => setProfileSelectedTaskFilter(category.name)}
                    className={`${filterButtonBaseClass} ${isActive ? activeFilterClass : inactiveFilterClass}`}
                  >
                    <category.icon className="w-4 h-4" />
                    <span>{category.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
          
          {userFeedItems.length > 0 ? (
            <div className="space-y-4 mt-3">
              {userFeedItems.map(item => (
                <FeedCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <div className="bg-white p-6 rounded-none shadow-md border border-gray-200 mt-3">
              <p className="text-gray-500 text-sm text-center">{profileSelectedTaskFilter ? `${profileSelectedTaskFilter} bo'yicha vazifalar yo'q.` : UZBEK_STRINGS.noTasksCompleted}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfileView;