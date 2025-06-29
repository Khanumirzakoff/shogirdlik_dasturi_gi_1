import React, { useContext, useMemo } from 'react';
import { AppContext } from '../contexts/AppContext';
import { getUserLevel } from '../utils';
import { UZBEK_STRINGS, ALL_ACHIEVEMENTS } from '../constants';
import FeedCard from './FeedCard';

interface UserProfileViewProps {
  userId: string;
  onClose: () => void;
}

const UserProfileView: React.FC<UserProfileViewProps> = ({ userId, onClose }) => {
  const context = useContext(AppContext);
  
  if (!context) return null;

  const { allUsers, feedItems, getUserRating, getUserAchievements } = context;

  const user = allUsers.find(u => u.id === userId);
  const userFeedItems = feedItems.filter(item => item.userId === userId);
  const totalPoints = getUserRating(userId);
  const userLevel = getUserLevel(totalPoints);
  const achievements = getUserAchievements(userId);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Foydalanuvchi topilmadi</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 p-4 z-10">
        <div className="flex items-center justify-between">
          <button
            onClick={onClose}
            className="p-2 text-gray-600 hover:text-black rounded-full hover:bg-gray-100 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-bold text-gray-900">{UZBEK_STRINGS.userProfileTitle}</h1>
          <div className="w-10"></div>
        </div>
      </div>

      {/* Profile Content */}
      <div className="flex-1 overflow-y-auto">
        {/* User Info */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4 mb-4">
            {user.profilePictureUrl ? (
              <img 
                src={user.profilePictureUrl} 
                alt={`${user.name} ${user.surname}`}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-gray-600 text-xl font-semibold">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {user.name} {user.surname}
              </h2>
              <p className="text-gray-600">
                {UZBEK_STRINGS.level} {userLevel.level} - {userLevel.name}
              </p>
              <p className="text-sm text-green-600 font-semibold">
                {totalPoints} ball
              </p>
            </div>
          </div>

          {/* Level Progress */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Daraja jarayoni</span>
              <span>{Math.round(userLevel.progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${userLevel.progress}%` }}
              />
            </div>
            {userLevel.nextLevelPoints && (
              <p className="text-xs text-gray-500 mt-1">
                {UZBEK_STRINGS.pointsToNextLevel(userLevel.nextLevelPoints - totalPoints)}
              </p>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-2xl font-bold text-gray-900">{userFeedItems.length}</p>
              <p className="text-sm text-gray-600">{UZBEK_STRINGS.tasks}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-2xl font-bold text-gray-900">{achievements.length}</p>
              <p className="text-sm text-gray-600">{UZBEK_STRINGS.achievements}</p>
            </div>
          </div>
        </div>

        {/* Achievements */}
        {achievements.length > 0 && (
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{UZBEK_STRINGS.achievements}</h3>
            <div className="grid grid-cols-2 gap-3">
              {achievements.map(userAchievement => {
                const achievement = ALL_ACHIEVEMENTS.find(a => a.id === userAchievement.achievementId);
                if (!achievement) return null;
                
                const IconComponent = achievement.icon;
                return (
                  <div key={achievement.id} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-2">
                      <IconComponent className="w-5 h-5 text-yellow-600" />
                      <h4 className="font-semibold text-sm text-gray-900">{achievement.name}</h4>
                    </div>
                    <p className="text-xs text-gray-600 mb-1">{achievement.description}</p>
                    <p className="text-xs text-yellow-600">
                      {UZBEK_STRINGS.unlockedOn} {userAchievement.unlockedAt.toLocaleDateString('uz-UZ')}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* User's Feed Items */}
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{UZBEK_STRINGS.userTasks}</h3>
          {userFeedItems.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">{UZBEK_STRINGS.noTasksCompleted}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {userFeedItems
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .map(item => (
                  <FeedCard key={item.id} feedItem={item} />
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfileView;