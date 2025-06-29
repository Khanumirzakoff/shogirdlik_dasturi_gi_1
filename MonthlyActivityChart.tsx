
import React from 'react';
import { TaskType } from '../types';
import { UZBEK_STRINGS, TASK_TYPE_COLORS, TASK_CATEGORIES } from '../constants';

interface MonthlyActivityChartProps {
  data: Record<string, Partial<Record<TaskType, number>>>; // { "Yanvar 2024": { "Yugurish": 5, ... }, ... }
}

const MonthlyActivityChart: React.FC<MonthlyActivityChartProps> = ({ data }) => {
  if (Object.keys(data).length === 0) {
    return <p className="text-gray-500 text-sm">{UZBEK_STRINGS.noTasksCompleted}</p>;
  }

  const sortedMonths = Object.keys(data).map(monthYear => ({
    monthYear,
    date: new Date(parseInt(monthYear.split(" ")[1]), UZBEK_STRINGS.months.indexOf(monthYear.split(" ")[0]))
  })).sort((a, b) => b.date.getTime() - a.date.getTime());

  let maxCountOverall = 0;
  sortedMonths.forEach(({ monthYear }) => {
    Object.values(data[monthYear]).forEach(count => {
      if (count && count > maxCountOverall) {
        maxCountOverall = count;
      }
    });
  });
  
  const maxBarHeightVh = 15; 

  return (
    <div className="space-y-6">
      {sortedMonths.map(({ monthYear }) => {
        const monthData = data[monthYear];
        const taskEntries = Object.entries(monthData)
          .map(([type, count]) => ({ type: type as TaskType, count: count || 0 }))
          .filter(entry => entry.count > 0)
          .sort((a,b) => TASK_CATEGORIES.findIndex(c => c.name === a.type) - TASK_CATEGORIES.findIndex(c => c.name === b.type));


        if (taskEntries.length === 0) return null;

        return (
          <div key={monthYear} className="bg-gray-50 p-3 rounded-none border border-gray-200">
            <h4 className="text-sm font-semibold text-black mb-3">{monthYear}</h4>
            <div className="flex items-end space-x-2 h-[22vh] overflow-x-auto pb-1 no-scrollbar"> 
              {taskEntries.map(({ type, count }) => {
                const barHeightPercentage = maxCountOverall > 0 ? (count / maxCountOverall) * 100 : 0;
                const barHeightStyle = `${(barHeightPercentage / 100) * maxBarHeightVh}vh`;
                const taskCategory = TASK_CATEGORIES.find(tc => tc.name === type);
                const TaskIcon = taskCategory?.icon;
                
                let taskShortName: string;
                if (type === TaskType.DAILY_PLAN) {
                    taskShortName = "Reja";
                } else if (type === TaskType.BOOK_READING) {
                    taskShortName = "Mutolaa"; 
                } else if (type === TaskType.WAKE_UP) {
                    taskShortName = "Uyg'onish";
                } else {
                    taskShortName = type; 
                }

                const barLabel = `${monthYear}, ${type}: ${count} ${UZBEK_STRINGS.tasks.split(' ')[0]}`;

                return (
                  <div 
                    key={type} 
                    className="flex flex-col items-center min-w-[45px] md:min-w-[50px] group relative" 
                    title={`${type}: ${count} ${UZBEK_STRINGS.tasks.split(' ')[0]}`}
                    role="graphics-symbol" // Added ARIA role
                    aria-label={barLabel} // Added ARIA label
                  >
                    <div
                      className="w-6 md:w-7 rounded-t-none hover:opacity-80 transition-all duration-150 ease-out" 
                      style={{ 
                        height: barHeightStyle, 
                        minHeight: '4px', 
                        backgroundColor: TASK_TYPE_COLORS[type] || '#CCCCCC' 
                      }}
                    >
                       <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1.5 px-2 py-1 text-xs bg-black text-white rounded-sm shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap pointer-events-none z-10">
                        {count} {UZBEK_STRINGS.tasks.split(' ')[0]}
                      </span>
                    </div>
                    {TaskIcon && <TaskIcon className="w-4 h-4 mt-1.5" style={{ color: TASK_TYPE_COLORS[type] || '#CCCCCC' }} aria-hidden="true" />}
                    <span className="text-[10px] text-gray-600 mt-0.5 text-center break-words w-full" aria-hidden="true">{taskShortName}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MonthlyActivityChart;