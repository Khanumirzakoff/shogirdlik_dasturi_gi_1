import React, { useContext } from 'react';
import { AppContext } from '../contexts/AppContext';
import { TASK_CATEGORIES } from '../constants';
import { TaskType } from '../types';

const TaskFilterButtons: React.FC = () => {
  const context = useContext(AppContext);
  
  if (!context) return null;

  const { selectedTaskFilter, setSelectedTaskFilter } = context;

  return (
    <div className="px-4 py-3 border-b border-gray-200">
      <div className="flex space-x-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setSelectedTaskFilter(null)}
          className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            selectedTaskFilter === null
              ? 'bg-black text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Barchasi
        </button>
        {TASK_CATEGORIES.map(({ name, icon: Icon }) => (
          <button
            key={name}
            onClick={() => setSelectedTaskFilter(name)}
            className={`flex-shrink-0 flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedTaskFilter === name
                ? 'bg-black text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default TaskFilterButtons;