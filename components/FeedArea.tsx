import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../contexts/AppContext';
import FeedCard from './FeedCard';
import { TaskType } from '../types';
import { UZBEK_STRINGS } from '../constants';

const FeedArea: React.FC = () => {
  const context = useContext(AppContext);
  const [showScrollShadows, setShowScrollShadows] = useState({ top: false, bottom: false });

  if (!context) return null;

  const { feedItems, selectedTaskFilter, searchTerm } = context;

  // Filter feed items based on selected filter and search term
  const filteredItems = feedItems.filter(item => {
    const matchesFilter = !selectedTaskFilter || item.type === selectedTaskFilter;
    const matchesSearch = !searchTerm || 
      item.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.type === TaskType.BOOK_READING && 'bookTitle' in item && 
       item.bookTitle.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesFilter && matchesSearch;
  });

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const { scrollTop, scrollHeight, clientHeight } = element;
    
    setShowScrollShadows({
      top: scrollTop > 10,
      bottom: scrollTop < scrollHeight - clientHeight - 10
    });
  };

  useEffect(() => {
    // Initial shadow state check
    const feedContainer = document.getElementById('feed-container');
    if (feedContainer) {
      const { scrollTop, scrollHeight, clientHeight } = feedContainer;
      setShowScrollShadows({
        top: scrollTop > 10,
        bottom: scrollTop < scrollHeight - clientHeight - 10
      });
    }
  }, [filteredItems]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Search Bar */}
      <div className="p-4 border-b border-gray-200">
        <input
          type="text"
          placeholder={UZBEK_STRINGS.searchPlaceholder}
          value={searchTerm}
          onChange={(e) => context.setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
        />
      </div>

      {/* Feed Items */}
      <div 
        id="feed-container"
        className={`flex-1 overflow-y-auto scroll-shadow-container ${
          showScrollShadows.top ? 'show-top-shadow' : ''
        } ${showScrollShadows.bottom ? 'show-bottom-shadow' : ''}`}
        onScroll={handleScroll}
      >
        <div className="p-4 space-y-4">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                {searchTerm ? 'Hech narsa topilmadi' : 'Hozircha xabarlar yo\'q'}
              </p>
            </div>
          ) : (
            filteredItems.map(item => (
              <FeedCard key={item.id} feedItem={item} />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default FeedArea;