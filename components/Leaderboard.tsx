import React, { useContext, useMemo } from 'react';
import { AppContext } from '../contexts/AppContext';
import { getUserLevel } from '../utils';
import { UZBEK_STRINGS } from '../constants';

const Leaderboard: React.FC = () => {
  const context = useContext(AppContext);
  
  if (!context) return null;

  const { allUsers, getUserRating, currentUser, setViewingUserProfileId, setCurrentView } = context;

  const leaderboardData = useMemo(() => {
    return allUsers
      .map(user => ({
        user,
        totalPoints: getUserRating(user.id),
        level: getUserLevel(getUserRating(user.id))
      }))
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .slice(0, 10); // Top 10
  }, [allUsers, getUserRating]);

  const handleUserClick = (userId: string) => {
    setViewingUserProfileId(userId);
    setCurrentView('profilePage');
  };

  return (
    <div className="bg-white border-l border-gray-200 p-4 overflow-y-auto">
      <h2 className="text-lg font-bold text-gray-900 mb-4">Reyting</h2>
      
      <div className="space-y-3">
        {leaderboardData.map((entry, index) => (
          <div
            key={entry.user.id}
            onClick={() => handleUserClick(entry.user.id)}
            className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
              entry.user.id === currentUser?.id 
                ? 'bg-blue-50 border border-blue-200' 
                : 'hover:bg-gray-50'
            }`}
          >
            {/* Rank */}
            <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              index === 0 ? 'bg-yellow-400 text-yellow-900' :
              index === 1 ? 'bg-gray-300 text-gray-700' :
              index === 2 ? 'bg-orange-400 text-orange-900' :
              'bg-gray-100 text-gray-600'
            }`}>
              {index + 1}
            </div>

            {/* Profile Picture */}
            {entry.user.profilePictureUrl ? (
              <img 
                src={entry.user.profilePictureUrl} 
                alt={`${entry.user.name} ${entry.user.surname}`}
                className="w-8 h-8 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-gray-600 text-xs font-semibold">
                  {entry.user.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}

            {/* User Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {entry.user.name} {entry.user.surname}
              </p>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500">
                  {UZBEK_STRINGS.level} {entry.level.level}
                </span>
                <span className="text-xs font-semibold text-green-600">
                  {entry.totalPoints} ball
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {leaderboardData.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500 text-sm">Hozircha ma'lumot yo'q</p>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;