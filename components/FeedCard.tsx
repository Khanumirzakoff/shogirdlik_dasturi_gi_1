import React, { useContext, useState } from 'react';
import { AppContext } from '../contexts/AppContext';
import { FeedItem, TaskType, RunningFeedItem, WakeUpFeedItem, DailyPlanFeedItem, BookReadingFeedItem } from '../types';
import { UZBEK_STRINGS, TASK_TYPE_COLORS } from '../constants';
import { RunningManIcon } from './icons/RunningManIcon';
import { AlarmClockIcon } from './icons/AlarmClockIcon';
import { ChecklistIcon } from './icons/ChecklistIcon';
import { BookOpenIcon } from './icons/BookOpenIcon';

interface FeedCardProps {
  feedItem: FeedItem;
}

const FeedCard: React.FC<FeedCardProps> = ({ feedItem }) => {
  const context = useContext(AppContext);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);

  if (!context) return null;

  const { 
    currentUser, 
    toggleLikeFeedItem, 
    addCommentToFeedItem, 
    deleteFeedItem,
    openPostForEditing,
    togglePersonalTodoCompletion,
    initiateTaskFromPlan
  } = context;

  const isLiked = currentUser ? feedItem.likedBy.includes(currentUser.id) : false;
  const isOwner = currentUser?.id === feedItem.userId;

  const getTaskIcon = (taskType: TaskType) => {
    switch (taskType) {
      case TaskType.RUNNING: return RunningManIcon;
      case TaskType.WAKE_UP: return AlarmClockIcon;
      case TaskType.DAILY_PLAN: return ChecklistIcon;
      case TaskType.BOOK_READING: return BookOpenIcon;
      default: return ChecklistIcon;
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return UZBEK_STRINGS.today;
    if (diffDays === 1) return UZBEK_STRINGS.yesterday;
    
    return date.toLocaleDateString('uz-UZ', {
      day: 'numeric',
      month: 'long',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const handleLike = () => {
    if (currentUser) {
      toggleLikeFeedItem(feedItem.id);
    }
  };

  const handleCommentSubmit = async () => {
    if (!commentText.trim() || !currentUser) return;
    
    setIsSubmittingComment(true);
    addCommentToFeedItem(feedItem.id, commentText.trim());
    setCommentText('');
    setIsSubmittingComment(false);
  };

  const handleDelete = async () => {
    await deleteFeedItem(feedItem.id);
    setShowDeleteConfirm(false);
  };

  const handleEdit = () => {
    openPostForEditing(feedItem);
  };

  const renderTaskSpecificContent = () => {
    switch (feedItem.type) {
      case TaskType.RUNNING:
        const runningItem = feedItem as RunningFeedItem;
        return (
          <div className="mt-3 space-y-2">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">{UZBEK_STRINGS.distance}:</span>
                <span className="ml-2 font-semibold">{runningItem.distance.toFixed(2)} {UZBEK_STRINGS.km}</span>
              </div>
              <div>
                <span className="text-gray-600">{UZBEK_STRINGS.duration}:</span>
                <span className="ml-2 font-semibold">{Math.floor(runningItem.duration / 60)}:{(runningItem.duration % 60).toString().padStart(2, '0')}</span>
              </div>
              {runningItem.pace && (
                <div>
                  <span className="text-gray-600">{UZBEK_STRINGS.paceLabel}:</span>
                  <span className="ml-2 font-semibold">{runningItem.pace}</span>
                </div>
              )}
              {runningItem.calories && (
                <div>
                  <span className="text-gray-600">{UZBEK_STRINGS.caloriesLabel}:</span>
                  <span className="ml-2 font-semibold">{runningItem.calories} {UZBEK_STRINGS.caloriesUnit}</span>
                </div>
              )}
            </div>
            {runningItem.description && (
              <div className="mt-3">
                <p className="text-gray-700 text-sm">
                  {showFullDescription || runningItem.description.length <= 150 
                    ? runningItem.description 
                    : `${runningItem.description.substring(0, 150)}...`}
                </p>
                {runningItem.description.length > 150 && (
                  <button
                    onClick={() => setShowFullDescription(!showFullDescription)}
                    className="text-blue-600 text-sm mt-1 hover:underline"
                  >
                    {showFullDescription ? UZBEK_STRINGS.showLess : UZBEK_STRINGS.showMore}
                  </button>
                )}
              </div>
            )}
          </div>
        );

      case TaskType.WAKE_UP:
        const wakeUpItem = feedItem as WakeUpFeedItem;
        return (
          <div className="mt-3">
            {wakeUpItem.videoBlob && (
              <video 
                controls 
                className="w-full max-w-sm rounded-lg"
                style={{ maxHeight: '300px' }}
              >
                <source src={URL.createObjectURL(wakeUpItem.videoBlob)} type="video/webm" />
              </video>
            )}
            {wakeUpItem.description && (
              <p className="text-gray-700 text-sm mt-2">{wakeUpItem.description}</p>
            )}
          </div>
        );

      case TaskType.DAILY_PLAN:
        const planItem = feedItem as DailyPlanFeedItem;
        return (
          <div className="mt-3 space-y-3">
            {planItem.todos.map(todo => (
              <div key={todo.id} className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  checked={todo.isCompleted}
                  onChange={() => togglePersonalTodoCompletion(feedItem.id, todo.id)}
                  disabled={todo.isMandatory}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className={`flex-1 text-sm ${todo.isCompleted ? 'line-through text-gray-500' : 'text-gray-700'}`}>
                  {todo.text}
                </span>
                {todo.isMandatory && todo.taskType && (
                  <button
                    onClick={() => initiateTaskFromPlan(todo.taskType!)}
                    className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
                  >
                    Boshlash
                  </button>
                )}
              </div>
            ))}
          </div>
        );

      case TaskType.BOOK_READING:
        const bookItem = feedItem as BookReadingFeedItem;
        return (
          <div className="mt-3 space-y-3">
            <div className="flex items-start space-x-3">
              {bookItem.bookImageBase64 && (
                <img 
                  src={bookItem.bookImageBase64} 
                  alt={bookItem.bookTitle}
                  className="w-16 h-20 object-cover rounded"
                />
              )}
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">{bookItem.bookTitle}</h4>
                <p className="text-sm text-gray-600">
                  {bookItem.pagesRead} {UZBEK_STRINGS.pagesReadLabel.toLowerCase()}
                </p>
              </div>
            </div>
            {bookItem.review && (
              <div>
                <p className="text-gray-700 text-sm">
                  {showFullDescription || bookItem.review.length <= 150 
                    ? bookItem.review 
                    : `${bookItem.review.substring(0, 150)}...`}
                </p>
                {bookItem.review.length > 150 && (
                  <button
                    onClick={() => setShowFullDescription(!showFullDescription)}
                    className="text-blue-600 text-sm mt-1 hover:underline"
                  >
                    {showFullDescription ? UZBEK_STRINGS.showLess : UZBEK_STRINGS.showMore}
                  </button>
                )}
              </div>
            )}
            {bookItem.audioSummaryBlob && (
              <audio controls className="w-full">
                <source src={URL.createObjectURL(bookItem.audioSummaryBlob)} type="audio/webm" />
              </audio>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const TaskIcon = getTaskIcon(feedItem.type);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          {feedItem.userProfilePic ? (
            <img 
              src={feedItem.userProfilePic} 
              alt={feedItem.userName}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-gray-600 font-semibold text-sm">
                {feedItem.userName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <h3 className="font-semibold text-gray-900">{feedItem.userName}</h3>
            <p className="text-xs text-gray-500">{formatDate(feedItem.timestamp)}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <div 
            className="flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium"
            style={{ 
              backgroundColor: `${TASK_TYPE_COLORS[feedItem.type]}20`,
              color: TASK_TYPE_COLORS[feedItem.type]
            }}
          >
            <TaskIcon className="w-3 h-3" />
            <span>{feedItem.type}</span>
          </div>
          
          {isOwner && (
            <div className="relative">
              <button className="p-1 text-gray-400 hover:text-gray-600 rounded">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </button>
              <div className="absolute right-0 top-6 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-[120px]">
                <button
                  onClick={handleEdit}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  {UZBEK_STRINGS.editPost}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  {UZBEK_STRINGS.deletePost}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      {renderTaskSpecificContent()}

      {/* Points */}
      <div className="mt-3 text-sm text-gray-600">
        <span className="font-semibold text-green-600">+{feedItem.pointsAwarded}</span> ball
      </div>

      {/* Actions */}
      <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleLike}
            className={`flex items-center space-x-1 text-sm ${
              isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
            } transition-colors`}
          >
            <svg className="w-4 h-4" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span>{feedItem.likedBy.length > 0 ? `${feedItem.likedBy.length}` : UZBEK_STRINGS.like}</span>
          </button>
          
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center space-x-1 text-sm text-gray-500 hover:text-blue-500 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span>{feedItem.comments.length > 0 ? `${feedItem.comments.length}` : UZBEK_STRINGS.comment}</span>
          </button>
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="mt-4 border-t border-gray-100 pt-4">
          {/* Add Comment */}
          {currentUser && (
            <div className="flex space-x-2 mb-4">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={UZBEK_STRINGS.addCommentPlaceholder}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && handleCommentSubmit()}
              />
              <button
                onClick={handleCommentSubmit}
                disabled={!commentText.trim() || isSubmittingComment}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmittingComment ? UZBEK_STRINGS.sendingComment : UZBEK_STRINGS.sendComment}
              </button>
            </div>
          )}

          {/* Comments List */}
          <div className="space-y-3">
            {feedItem.comments.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">{UZBEK_STRINGS.noCommentsYet}</p>
            ) : (
              feedItem.comments.map(comment => (
                <div key={comment.id} className="flex space-x-2">
                  {comment.userProfilePic ? (
                    <img 
                      src={comment.userProfilePic} 
                      alt={comment.userName}
                      className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-gray-600 text-xs font-semibold">
                        {comment.userName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="bg-gray-100 rounded-lg px-3 py-2">
                      <p className="font-semibold text-sm text-gray-900">{comment.userName}</p>
                      <p className="text-sm text-gray-700">{comment.text}</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{formatDate(comment.timestamp)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {UZBEK_STRINGS.confirmDeletePostTitle}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {UZBEK_STRINGS.confirmDeletePostMessage}
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                {UZBEK_STRINGS.cancel}
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                {UZBEK_STRINGS.yesDelete}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedCard;