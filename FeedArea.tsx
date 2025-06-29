

import React, { useContext, useMemo } from 'react';
import { AppContext } from '../contexts/AppContext';
import FeedCard from './FeedCard';
import { FeedItem, TaskType, BookReadingFeedItem, DailyPlanFeedItem, WakeUpFeedItem, RunningFeedItem } from '../types';
import { UZBEK_STRINGS } from '../constants';


const FeedArea: React.FC = () => {
  const context = useContext(AppContext);

  if (!context) {
    return <p>Context yuklanmoqda...</p>;
  }

  const { feedItems, selectedTaskFilter, searchTerm } = context;

  const filteredFeedItems = useMemo(() => {
    let itemsToDisplay = feedItems;

    if (selectedTaskFilter) {
      itemsToDisplay = itemsToDisplay.filter(item => item.type === selectedTaskFilter);
    }

    if (searchTerm && searchTerm.trim() !== '') {
      const lowerSearchTerm = searchTerm.toLowerCase();
      itemsToDisplay = itemsToDisplay.filter(item => {
        // Search in user name
        if (item.userName.toLowerCase().includes(lowerSearchTerm)) return true;
        // Search in task type (localized name)
        if (item.type.toLowerCase().includes(lowerSearchTerm)) return true;

        switch (item.type) {
          case TaskType.RUNNING:
            const runningItem = item as RunningFeedItem;
            if (runningItem.title && runningItem.title.toLowerCase().includes(lowerSearchTerm)) return true;
            break;
          case TaskType.WAKE_UP:
            const wakeUpItem = item as WakeUpFeedItem;
            if (wakeUpItem.description && wakeUpItem.description.toLowerCase().includes(lowerSearchTerm)) return true;
            break;
          case TaskType.DAILY_PLAN:
            const dailyPlanItem = item as DailyPlanFeedItem;
            if (dailyPlanItem.todos.some(todo => todo.text.toLowerCase().includes(lowerSearchTerm))) return true;
            const planDateStr = dailyPlanItem.planDate 
                ? new Date(dailyPlanItem.planDate).toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long' })
                : "";
            if (UZBEK_STRINGS.planForDate(planDateStr).toLowerCase().includes(lowerSearchTerm)) return true;
            break;
          case TaskType.BOOK_READING:
            const bookItem = item as BookReadingFeedItem;
            if (bookItem.bookTitle.toLowerCase().includes(lowerSearchTerm)) return true;
            if (bookItem.review && bookItem.review.toLowerCase().includes(lowerSearchTerm)) return true;
            break;
          default:
            break;
        }
        return false;
      });
    }

    return itemsToDisplay;
  }, [feedItems, selectedTaskFilter, searchTerm]);

  if (filteredFeedItems.length === 0) {
    let message = UZBEK_STRINGS.noTasksCompleted; // Default if no filter and no search
    if (searchTerm) {
        message = `"${searchTerm}" bo'yicha natijalar topilmadi.`;
    } else if (selectedTaskFilter) {
        message = `${selectedTaskFilter} bo'yicha xabarlar yo'q.`;
    }
    return (
      <div className="flex-grow flex items-center justify-center p-6 text-gray-500">
        <p>{message}</p>
      </div>
    );
  }

  return (
    <main className="flex-grow overflow-y-auto bg-white no-scrollbar pb-24">
      {filteredFeedItems.map((item: FeedItem) => (
        <FeedCard key={item.id} item={item} />
      ))}
    </main>
  );
};

export default FeedArea;