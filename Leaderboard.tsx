

import React, { useContext, useMemo, useRef } from 'react';
import { AppContext } from '../contexts/AppContext';
import { User, TaskType } from '../types'; 
import { useScrollAffordance } from '../hooks/useScrollAffordance'; // Import the hook

const Leaderboard: React.FC = () => {
  const context = useContext(AppContext);
  const scrollableAreaRef = useRef<HTMLDivElement>(null);
  const { showTopShadow, showBottomShadow } = useScrollAffordance(scrollableAreaRef);


  if (!context) {
    return (
      <aside className="w-full h-full bg-white border-l border-gray-200 p-3 rounded-none">
        <p className="text-gray-500 text-sm">Yuklanmoqda...</p>
      </aside>
    );
  }

  const { allUsers, getUserRating, selectedTaskFilter, setViewingUserProfileId, currentUser } = context;

  const usersWithRatings = useMemo(() => {
    return allUsers
      .map(user => ({
        ...user,
        displayRating: getUserRating(user.id, selectedTaskFilter),
      }))
      .sort((a, b) => b.displayRating - a.displayRating);
  }, [allUsers, getUserRating, selectedTaskFilter]);


  const handleUserClick = (userId: string) => {
    if (setViewingUserProfileId) {
      setViewingUserProfileId(userId);
    }
  };

  return (
    <aside className="w-full h-full bg-white flex flex-col overflow-hidden border-l border-gray-200 rounded-none">
      <h3 className="text-md font-semibold text-black sticky top-0 bg-white/80 backdrop-blur-md p-3 z-10 border-b border-gray-200 shadow-sm rounded-none">
        Reyting {selectedTaskFilter ? `(${selectedTaskFilter})` : ''}
      </h3>
      <div 
        ref={scrollableAreaRef}
        className={`flex-grow overflow-y-auto no-scrollbar p-2 space-y-1 scroll-shadow-container ${showTopShadow ? 'show-top-shadow' : ''} ${showBottomShadow ? 'show-bottom-shadow' : ''}`}
      >
        {usersWithRatings.map((user, index) => {
          const isCurrentUser = user.id === currentUser?.id;
          const shortSurname = user.surname ? `${user.surname.charAt(0)}.` : '';

          return (
            <button
              key={user.id}
              onClick={() => handleUserClick(user.id)}
              className={`flex items-center gap-2 p-1.5 rounded-sm transition-colors duration-150 hover:bg-gray-100 w-full text-left
                          ${isCurrentUser ? 'bg-gray-100 ring-1 ring-black' : ''}`}
              aria-label={`${user.name} ${user.surname} profilini ko'rish`}
            >
              <span className={`text-sm font-mono w-6 text-right ${isCurrentUser ? 'text-black font-semibold' : 'text-gray-500'}`}>
                {index + 1}.
              </span>
              <img 
                src={user.profilePictureUrl || `https://picsum.photos/seed/${user.id}/40/40`} 
                alt={user.name} 
                className="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-gray-300"
              />
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-medium truncate ${isCurrentUser ? 'text-black font-semibold' : 'text-gray-800'}`}>
                  <span className="md:hidden">{user.name} {shortSurname}</span>
                  <span className="hidden md:inline">{user.name} {user.surname}</span>
                </p>
                <p className={`text-xs ${isCurrentUser ? 'text-gray-700 font-medium' : 'text-sky-600'}`}>
                  {user.displayRating} ball
                </p>
              </div>
            </button>
          )
        })}
      </div>
    </aside>
  );
};

export default Leaderboard;