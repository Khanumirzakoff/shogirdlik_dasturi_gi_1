
import React from 'react';
import { HomeSolidIcon } from './icons/HomeSolidIcon'; 
// import { TrophyIcon } from './icons/TrophyIcon'; // No longer needed
import { UserCircleIcon } from './icons/UserCircleIcon'; 
import { UZBEK_STRINGS } from '../constants';

interface BottomNavProps {
  currentView: 'home' | 'profilePage'; // Removed 'progress'
  setCurrentView: (view: 'home' | 'profilePage') => void; // Removed 'progress'
}

const BottomNav: React.FC<BottomNavProps> = ({ currentView, setCurrentView }) => {
  const navItems = [
    { id: 'home', name: UZBEK_STRINGS.home, icon: HomeSolidIcon, view: 'home' as const, action: () => setCurrentView('home') },
    // "Natijalar" (progress) button is removed.
    { id: 'profilePage', name: UZBEK_STRINGS.profile, icon: UserCircleIcon, view: 'profilePage' as const, action: () => setCurrentView('profilePage') }, 
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-md lg:max-w-6xl mx-auto bg-white/90 backdrop-blur-md border-t border-gray-200 rounded-none z-30">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = item.view && currentView === item.view;
          
          return (
            <button
              key={item.id}
              onClick={item.action}
              className={`flex flex-col items-center justify-center p-2 rounded-none transition-colors duration-200 flex-1 // Use flex-1 for equal width
                          ${isActive ? 'text-black bg-gray-100' : 'text-gray-500 hover:text-black'}
                          `} 
              aria-label={item.name}
              aria-current={isActive ? 'page' : undefined}
            >
              <item.icon className="w-7 h-7" />
              <span 
                className={`text-xs mt-1 ${isActive ? 'font-semibold' : ''}`}
              >
                {item.name} 
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;