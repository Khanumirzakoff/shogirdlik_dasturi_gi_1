

import React from 'react';
import { PlusIcon } from './components/icons/PlusIcon';
import { UZBEK_STRINGS } from './constants';
import { TaskType } from './types';
import { RunningManIcon } from './components/icons/RunningManIcon';
import { AlarmClockIcon } from './components/icons/AlarmClockIcon';
import { BookOpenIcon } from './components/icons/BookOpenIcon';
import { ChecklistIcon } from './components/icons/ChecklistIcon';

interface FloatingActionButtonProps {
  onClick: () => void;
  selectedTaskFilter: TaskType | null;
  className?: string;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ onClick, selectedTaskFilter, className = '' }) => {
  let IconComponent = PlusIcon;
  let label = UZBEK_STRINGS.addTask;

  if (selectedTaskFilter === TaskType.RUNNING) {
    label = UZBEK_STRINGS.startRunning;
    IconComponent = RunningManIcon;
  } else if (selectedTaskFilter === TaskType.WAKE_UP) {
    label = UZBEK_STRINGS.startWakeUpConfirmation;
    IconComponent = AlarmClockIcon;
  } else if (selectedTaskFilter === TaskType.BOOK_READING) {
    label = UZBEK_STRINGS.addReadingEntry;
    IconComponent = BookOpenIcon;
  } else if (selectedTaskFilter === TaskType.DAILY_PLAN) {
    label = UZBEK_STRINGS.addNewPlan;
    IconComponent = ChecklistIcon;
  } else if (selectedTaskFilter === null) {
    // When no filter is selected, show a generic "Add Task" button.
    IconComponent = PlusIcon;
    label = UZBEK_STRINGS.addTask;
  }

  const showLabel = selectedTaskFilter !== null;

  return (
    <button
      onClick={onClick}
      className={`fixed bottom-6 right-4 md:right-5 lg:bottom-8 lg:right-10 z-40 flex items-center justify-center 
                  bg-black text-white rounded-full shadow-xl 
                  hover:bg-gray-800 active:bg-gray-700 active:scale-95
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black
                  transition-all duration-200 ease-in-out
                  ${showLabel ? 'pl-4 pr-5 py-3 h-12' : 'w-14 h-14 p-0'} ${className}`}
      aria-label={label}
    >
      <IconComponent className={`flex-shrink-0 ${showLabel ? 'w-5 h-5 mr-2.5' : 'w-7 h-7'}`} />
      {showLabel && <span className="text-sm font-medium whitespace-nowrap">{label}</span>}
    </button>
  );
};

export default FloatingActionButton;