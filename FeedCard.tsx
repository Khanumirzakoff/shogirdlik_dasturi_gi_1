


import React, { useEffect, useRef, useContext, useState } from 'react';
import { FeedItem, TaskType, RunningFeedItem, WakeUpFeedItem, DailyPlanFeedItem, BookReadingFeedItem, Point, TodoItem, UserComment } from '../types';
import { UZBEK_STRINGS, TASK_CATEGORIES } from '../constants';
import { ClockIcon } from './icons/ClockIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon'; 
import { CircleIcon } from './icons/CircleIcon'; 
import { PencilIcon } from './icons/PencilIcon';
import { AppContext } from '../contexts/AppContext';
import { PlayIcon } from './icons/PlayIcon';
import { PauseIcon } from './icons/PauseIcon';
import { HeartIcon } from './icons/HeartIcon'; 
import { ChatBubbleIcon } from './icons/ChatBubbleIcon'; 
import { SendIcon } from './icons/SendIcon';
import RunPathMap from './RunPathMap';
import { ExclamationCircleIcon } from './icons/ExclamationCircleIcon';
import { EllipsisVerticalIcon } from './icons/EllipsisVerticalIcon';
import { TrashIcon } from './icons/TrashIcon';

const formatFeedTimestamp = (date: Date): string => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const d = new Date(date);
  const targetDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const timeStr = d.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });

  if (targetDate.getTime() === today.getTime()) {
    return `${UZBEK_STRINGS.today}, ${timeStr}`;
  }
  if (targetDate.getTime() === yesterday.getTime()) {
    return `${UZBEK_STRINGS.yesterday}, ${timeStr}`;
  }
  return `${d.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long' })}, ${timeStr}`;
};


const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return `${diffInSeconds}s avval`;
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m avval`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}soat avval`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}kun avval`;
  
  return date.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short' });
};

const formatDurationHHMMSS = (totalSeconds: number | undefined): string => {
  if (totalSeconds === undefined || totalSeconds === null || totalSeconds < 0) return '00:00:00';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60); 

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};


const FeedCard: React.FC<{ item: FeedItem }> = ({ item }) => {
  const context = useContext(AppContext);
  const [confirmation, setConfirmation] = useState<{show: boolean; taskType?: TaskType; planId?: string; todoId?: string; todoText?: string}>({ show: false });
  const [isPlanExpanded, setIsPlanExpanded] = useState(false);
  const [isReviewExpanded, setIsReviewExpanded] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  
  // State for media playback in feed
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  
  const [isWakeUpVideoPlaying, setIsWakeUpVideoPlaying] = useState(false);
  const wakeUpVideoRef = useRef<HTMLVideoElement>(null);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);

  // State for more options menu and delete confirmation
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);


  const isOfflineItem = item.isOffline || item.id.startsWith('offline-');
  const isCurrentUserItemOwner = context?.currentUser?.id === item.userId;

  // Click outside listener for the dropdown menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  useEffect(() => {
    // Reset sources when item changes to avoid showing wrong media briefly
    setAudioSrc(null);
    setVideoSrc(null);
  
    if (item.type === TaskType.BOOK_READING) {
      const bookItem = item as BookReadingFeedItem;
      if (bookItem.audioSummaryBlob) {
        const url = URL.createObjectURL(bookItem.audioSummaryBlob);
        setAudioSrc(url);
        // Revoke the URL when the component unmounts or the item changes
        return () => URL.revokeObjectURL(url);
      }
    } else if (item.type === TaskType.WAKE_UP) {
      const wakeUpItem = item as WakeUpFeedItem;
      if (wakeUpItem.videoBlob) {
        const url = URL.createObjectURL(wakeUpItem.videoBlob);
        setVideoSrc(url);
        // Revoke the URL when the component unmounts or the item changes
        return () => URL.revokeObjectURL(url);
      }
    }
  }, [item]);
  
  const handleTodoClick = (plan: DailyPlanFeedItem, todo: TodoItem) => {
    if (!context || !context.currentUser || !context.showToast || item.userId !== context.currentUser.id) return; // <-- Check ownership

    if (todo.isCompleted) {
      if (!todo.isMandatory) { 
          context.togglePersonalTodoCompletion(plan.id, todo.id);
          context.showToast(todo.text + " belgilanmagan qilindi.", 2000);
      }
      return;
    }

    if (todo.isMandatory && todo.taskType) {
      setConfirmation({
        show: true,
        taskType: todo.taskType,
        planId: plan.id,
        todoId: todo.id,
        todoText: todo.text,
      });
    } else if (!todo.isMandatory) {
      setConfirmation({
        show: true,
        planId: plan.id,
        todoId: todo.id,
        todoText: todo.text
      });
    }
  };

  const handleConfirmAction = () => {
    if (!context || !confirmation.show || !context.showToast || !isCurrentUserItemOwner) return; // <-- Check ownership

    if (confirmation.taskType) { 
      context.initiateTaskFromPlan(confirmation.taskType);
      context.showToast(`${UZBEK_STRINGS.initiatingTask} "${confirmation.todoText}"`, 2000);
    } else if (confirmation.planId && confirmation.todoId) { 
      context.togglePersonalTodoCompletion(confirmation.planId, confirmation.todoId);
      context.showToast(`"${confirmation.todoText}" ${UZBEK_STRINGS.personalTaskCompleted}`, 2000);
    }
    setConfirmation({ show: false });
  };

  const handleCancelAction = () => {
    setConfirmation({ show: false });
  };

  const handleDeleteClick = () => {
      setIsMenuOpen(false);
      setShowDeleteConfirm(true);
  };
  
  const handleConfirmDelete = () => {
    if (context?.deleteFeedItem) {
      context.deleteFeedItem(item.id);
      setShowDeleteConfirm(false);
    }
  };

  const handleEditClick = () => {
    if(context?.openPostForEditing && isCurrentUserItemOwner) {
        setIsMenuOpen(false);
        context.openPostForEditing(item);
    }
  };


  const handleUserProfileClick = () => {
    if (context && context.setViewingUserProfileId) {
        context.setViewingUserProfileId(item.userId);
    }
  };

  const handleLikeClick = () => {
    if (context && context.toggleLikeFeedItem && context.currentUser) {
        context.toggleLikeFeedItem(item.id);
    }
  };

  const handleCommentSubmit = async () => {
    if (!context || !context.addCommentToFeedItem || !newCommentText.trim() || !context.currentUser) return;
    setIsSubmittingComment(true);
    try {
        await context.addCommentToFeedItem(item.id, newCommentText);
        setNewCommentText('');
    } catch (error) {
        console.error("Error submitting comment:", error);
        context.showToast("Izoh yuborishda xatolik.", 3000);
    } finally {
        setIsSubmittingComment(false);
    }
  };
  
  const toggleAudioPlayPause = () => {
      if (!audioRef.current) return;
      if (isAudioPlaying) {
          audioRef.current.pause();
      } else {
          audioRef.current.play().catch(() => context?.showToast(UZBEK_STRINGS.audioSummaryPlaybackError, 3000));
      }
  };

  const toggleWakeUpVideoPlayPause = () => {
    if (!wakeUpVideoRef.current) return;
    if (isWakeUpVideoPlaying) {
      wakeUpVideoRef.current.pause();
    } else {
      wakeUpVideoRef.current.play().catch(() => context?.showToast(UZBEK_STRINGS.audioSummaryPlaybackError, 3000));
    }
  };

  const isLikedByCurrentUser = context?.currentUser ? item.likedBy.includes(context.currentUser.id) : false;
  const likeCount = item.likedBy.length;
  const commentCount = item.comments.length;

  const dateToDisplay = item.type === TaskType.RUNNING && (item as RunningFeedItem).eventTimestamp 
    ? (item as RunningFeedItem).eventTimestamp 
    : item.timestamp;

  const renderSpecificContent = () => {
    switch (item.type) {
      case TaskType.RUNNING:
        const runningItem = item as RunningFeedItem;
        return (
          <div className="space-y-2">
             {runningItem.description && <p className="text-sm text-gray-700 py-1">{runningItem.description}</p>}
            <div className="flex items-start justify-between my-1">
              {/* Left side: Distance */}
              <div className="text-left">
                <p className="text-3xl md:text-4xl font-bold text-black tracking-tight leading-none">
                  {(runningItem.distance || 0).toFixed(2)}
                </p>
                <p className="text-xs text-gray-500 uppercase tracking-wider">
                  {UZBEK_STRINGS.km}
                </p>
              </div>
              {/* Right side: Duration & Pace */}
              <div className="text-right space-y-1.5">
                <div>
                  <p className="text-lg font-semibold text-black leading-tight">
                    {formatDurationHHMMSS(runningItem.duration)}
                  </p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide">
                    {UZBEK_STRINGS.duration}
                  </p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-black leading-tight">
                    {runningItem.pace || "--'--\""}
                  </p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide">
                    {UZBEK_STRINGS.avgPaceMinKm}
                  </p>
                </div>
              </div>
            </div>
            
            {runningItem.pathPoints && runningItem.pathPoints.length > 1 ? (
              <div className="mt-2">
                <RunPathMap pathPoints={runningItem.pathPoints} />
              </div>
            ) : (
                 <div className="h-auto py-2 flex items-center justify-center text-gray-400 text-xs bg-gray-50 rounded-none border border-gray-200 mt-2">
                  Yo'l ma'lumoti yo'q yoki juda qisqa.
                </div>
            )}
          </div>
        );
      case TaskType.WAKE_UP:
        const wakeUpItem = item as WakeUpFeedItem;
        return (
          <div className="mt-2 space-y-2">
             {wakeUpItem.description && <p className="text-sm text-gray-700 py-1">{wakeUpItem.description}</p>}
            {wakeUpItem.videoBlob && videoSrc ? (
              <div
                className="aspect-square bg-black rounded-none overflow-hidden relative group cursor-pointer"
                onClick={toggleWakeUpVideoPlayPause}
              >
                <video
                  ref={wakeUpVideoRef}
                  src={videoSrc}
                  loop
                  playsInline
                  onPlay={() => setIsWakeUpVideoPlaying(true)}
                  onPause={() => setIsWakeUpVideoPlaying(false)}
                  onEnded={() => setIsWakeUpVideoPlaying(false)}
                  className="w-full h-full object-cover"
                  title="Video tasdiqlash"
                ></video>
                <div
                  className={`absolute inset-0 flex items-center justify-center bg-black/30 transition-opacity duration-300
                              ${!isWakeUpVideoPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                >
                  <div className="p-3 bg-white/20 backdrop-blur-sm rounded-full text-white">
                    {isWakeUpVideoPlaying 
                      ? <PauseIcon className="w-8 h-8"/> 
                      : <PlayIcon className="w-8 h-8" />}
                  </div>
                </div>
              </div>
            ) : (
               <div className="aspect-square bg-gray-100 rounded-none flex items-center justify-center text-gray-500"> 
                Video yuklanmagan
              </div>
            )}
          </div>
        );
      case TaskType.DAILY_PLAN:
        const dailyPlanItem = item as DailyPlanFeedItem;
        const planDateStr = dailyPlanItem.planDate 
            ? new Date(dailyPlanItem.planDate).toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long' })
            : UZBEK_STRINGS.dailyPlanTitle;
        
        const renderTodoItem = (todo: TodoItem, plan: DailyPlanFeedItem) => {
          const canInteractWithTodo = isCurrentUserItemOwner && (!todo.isCompleted || !todo.isMandatory);
          return (
            <div 
              key={todo.id} 
              className={`flex items-center space-x-2 p-2 rounded-sm border focus:outline-none focus:ring-1 focus:ring-black
                          ${todo.isMandatory ? 'bg-gray-100/70 border-gray-200' : 'bg-white border-gray-200'}
                          ${canInteractWithTodo ? 'cursor-pointer hover:shadow-sm' : (isCurrentUserItemOwner ? 'opacity-70 cursor-default' : 'opacity-60 cursor-not-allowed')}
                          ${todo.isCompleted && todo.isMandatory && isCurrentUserItemOwner ? 'cursor-default' : ''} 
                          transition-all duration-150 text-sm`}
              onClick={() => canInteractWithTodo && handleTodoClick(plan, todo)}
              role={canInteractWithTodo ? "button" : undefined}
              tabIndex={canInteractWithTodo ? 0 : -1}
              onKeyDown={(e) => { if (canInteractWithTodo && (e.key === 'Enter' || e.key === ' ')) handleTodoClick(plan, todo);}}
              aria-pressed={todo.isCompleted}
              aria-label={`${todo.text} ${todo.isCompleted ? '(bajarilgan)' : '(bajarilmagan)'} ${todo.isMandatory ? '(majburiy)' : '(shaxsiy)'}${!isCurrentUserItemOwner ? ' (boshqa foydalanuvchiniki)' : ''}`}
            >
              {todo.isCompleted 
                ? <CheckCircleIcon className="w-4 h-4 flex-shrink-0 text-black" /> 
                : <CircleIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
              }
              <span className={`flex-grow ${todo.isCompleted ? 'line-through text-gray-500' : 'text-black'}`}>
                {todo.text}
              </span>
              {todo.isMandatory && (
                <span className="text-[10px] text-gray-500 font-medium ml-auto">(avtomatik)</span>
              )}
            </div>
          );
        };
        
        const allTodosInPlan = dailyPlanItem.todos || [];
        const TODOS_INITIAL_LIMIT = 3; 
        const itemsToActuallyRender = isPlanExpanded ? allTodosInPlan : allTodosInPlan.slice(0, TODOS_INITIAL_LIMIT);
        const displayedMandatoryTodos = itemsToActuallyRender.filter(t => t.isMandatory);
        const displayedPersonalTodos = itemsToActuallyRender.filter(t => !t.isMandatory);
        const totalTodosCount = allTodosInPlan.length;
        const canToggleExpansion = totalTodosCount > TODOS_INITIAL_LIMIT;

        return (
          <div className="mt-2">
            <h4 className="font-semibold text-base text-gray-800 mb-2">
                {UZBEK_STRINGS.planForDate(planDateStr)}
            </h4>
            <div className="space-y-1.5"> 
              {displayedMandatoryTodos.length > 0 && (
                <>
                  <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mt-1 mb-0.5">{UZBEK_STRINGS.mandatoryTasks}</p>
                  {displayedMandatoryTodos.map(todo => renderTodoItem(todo, dailyPlanItem))}
                </>
              )}
              {displayedPersonalTodos.length > 0 && (
                 <>
                  <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mt-2 mb-0.5">{UZBEK_STRINGS.personalTasks}</p>
                  {displayedPersonalTodos.map(todo => renderTodoItem(todo, dailyPlanItem))}
                 </>
              )}
              {allTodosInPlan.length === 0 && ( 
                <p className="text-xs text-gray-400 py-1">{UZBEK_STRINGS.noTodosYet}</p>
              )}
            </div>
            {canToggleExpansion && (
              <button
                onClick={() => setIsPlanExpanded(prev => !prev)}
                className="text-xs text-sky-600 hover:text-sky-700 mt-2.5 p-1.5 w-full text-left font-medium bg-gray-50 hover:bg-gray-100 rounded-sm border border-gray-200 transition-colors focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                {isPlanExpanded
                  ? 'Kamroq ko\'rsatish'
                  : `Barchasini ko\'rsatish (${totalTodosCount} ${UZBEK_STRINGS.tasks})`}
              </button>
            )}
          </div>
        );
      case TaskType.BOOK_READING:
        const bookItem = item as BookReadingFeedItem;
        const isReviewLong = bookItem.review && bookItem.review.length > 150;
        return (
          <div className="mt-2 flex items-start space-x-4">
            {bookItem.bookImageBase64 && (
                <div className="flex-shrink-0 w-24">
                     <img 
                        src={bookItem.bookImageBase64} 
                        alt={bookItem.bookTitle} 
                        className="w-full h-auto object-contain rounded-sm border border-gray-200"
                    />
                </div>
            )}
            <div className="flex-grow min-w-0 space-y-1.5">
                <p className="text-md font-semibold text-black">"{bookItem.bookTitle}"</p>
                <p className="text-sm text-gray-700">
                    <span className="font-medium">{bookItem.pagesRead}</span> sahifa o'qildi.
                </p>
                {bookItem.review && (
                <div 
                    className="text-xs text-gray-600 pt-1 italic cursor-pointer"
                    onClick={() => setIsReviewExpanded(!isReviewExpanded)}
                >
                    <p className={`${!isReviewExpanded && 'line-clamp-4'}`}>
                    <span className="font-semibold not-italic text-gray-700">Sharh: </span>{bookItem.review}
                    </p>
                    {isReviewLong && (
                    <span className="text-sky-600 font-semibold not-italic hover:underline mt-1 inline-block">
                        {isReviewExpanded ? UZBEK_STRINGS.showLess : UZBEK_STRINGS.showMore}
                    </span>
                    )}
                </div>
                )}
                {audioSrc && ( 
                    <div className="mt-2 flex items-center space-x-3 bg-gray-50 p-2 rounded-sm border border-gray-200">
                        <button onClick={toggleAudioPlayPause} className="p-2 bg-black text-white rounded-full hover:bg-gray-800 transition-colors">
                            {isAudioPlaying ? <PauseIcon className="w-4 h-4" /> : <PlayIcon className="w-4 h-4" />}
                        </button>
                        <p className="text-xs text-gray-700 font-medium">Audio Xulosa</p>
                        <audio
                            ref={audioRef}
                            src={audioSrc}
                            onPlay={() => setIsAudioPlaying(true)}
                            onPause={() => setIsAudioPlaying(false)}
                            onEnded={() => setIsAudioPlaying(false)}
                            className="hidden"
                            preload="metadata"
                        />
                    </div>
                )}
            </div>
          </div>
        );
      default:
        return null;
    }
  };
  
  const getActivityTitle = (itemType: TaskType): string => {
    return itemType; 
  };

  return (
    <div className={`bg-white p-4 rounded-none shadow-sm border-b border-gray-200 
                    ${isOfflineItem && !item.syncFailed ? 'border-l-4 border-l-amber-400' : ''} 
                    ${item.syncFailed ? 'border-l-4 border-l-red-500' : ''}
                    ${!isOfflineItem && !item.syncFailed ? 'border-l border-r border-t border-gray-200' : ''} 
                    relative`}> 
        <div className="flex items-start justify-between">
            <div 
                className="flex items-center space-x-3 mb-2 cursor-pointer flex-grow min-w-0"
                onClick={handleUserProfileClick}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleUserProfileClick(); }}
                aria-label={`${item.userName} profilini ko'rish`}
            >
                <img 
                src={item.userProfilePic || 'https://picsum.photos/seed/placeholder/40/40'} 
                alt={item.userName} 
                className="w-10 h-10 rounded-full object-cover border border-gray-300 flex-shrink-0" 
                />
                <div className="min-w-0">
                <h3 className="font-semibold text-sm text-black leading-tight truncate">{item.userName}</h3>
                <p className="text-xs text-gray-500 leading-tight flex items-center">
                    {formatFeedTimestamp(new Date(dateToDisplay))}
                    {isOfflineItem && !item.syncFailed && (
                    <span className="ml-1.5 text-amber-600 text-[9px] flex items-center" title={UZBEK_STRINGS.syncingOfflineItem}> 
                        <ClockIcon className="w-2.5 h-2.5 mr-0.5 animate-ping opacity-75" /> 
                        Offline
                    </span>
                    )}
                    {item.syncFailed && (
                    <span className="ml-1.5 text-red-600 text-[9px] flex items-center" title={UZBEK_STRINGS.syncFailedIndicatorTitle}>
                        <ExclamationCircleIcon className="w-3 h-3 mr-0.5" />
                        Xatolik
                    </span>
                    )}
                </p>
                </div>
            </div>
            
            {isCurrentUserItemOwner && (
                <div ref={menuRef} className="relative flex-shrink-0 -mr-2">
                    <button 
                        onClick={() => setIsMenuOpen(prev => !prev)}
                        className="p-2 text-gray-400 hover:text-black rounded-full transition-colors"
                        aria-label="Qo'shimcha amallar"
                        aria-haspopup="true"
                        aria-expanded={isMenuOpen}
                    >
                        <EllipsisVerticalIcon className="w-5 h-5"/>
                    </button>
                    {isMenuOpen && (
                        <div 
                            className="absolute top-full right-0 mt-1 w-36 bg-white border border-gray-200 shadow-lg rounded-sm z-20 py-1"
                            role="menu"
                            aria-orientation="vertical"
                            aria-labelledby="menu-button"
                        >
                            <button
                                onClick={handleEditClick}
                                className="flex items-center w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-black transition-colors"
                                role="menuitem"
                            >
                                <PencilIcon className="w-4 h-4 mr-2"/>
                                {UZBEK_STRINGS.editPost}
                            </button>
                            <button
                                onClick={handleDeleteClick}
                                className="flex items-center w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
                                role="menuitem"
                            >
                                <TrashIcon className="w-4 h-4 mr-2"/>
                                {UZBEK_STRINGS.deletePost}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>

      <h2 className="text-base font-semibold uppercase text-black mb-1.5 tracking-tight">
        {item.type === TaskType.RUNNING && (item as RunningFeedItem).title ? (item as RunningFeedItem).title : getActivityTitle(item.type)}
      </h2>

      {renderSpecificContent()}

      <div className="mt-3 pt-2 border-t border-gray-100 flex items-center space-x-4">
        <button 
          onClick={handleLikeClick}
          className={`flex items-center space-x-1.5 transition-colors duration-150 group
                      ${isLikedByCurrentUser ? 'text-rose-500' : 'text-gray-500 hover:text-rose-500'}`}
          aria-label={isLikedByCurrentUser ? "Yoqtirishni olib tashlash" : UZBEK_STRINGS.like}
          aria-pressed={isLikedByCurrentUser}
        >
          <HeartIcon filled={isLikedByCurrentUser} className="w-5 h-5 group-hover:scale-110 transition-transform" />
          {likeCount > 0 && <span className="text-xs font-medium">{likeCount}</span>}
        </button>
        <button 
            onClick={() => setShowComments(!showComments)}
            className="flex items-center space-x-1.5 text-gray-500 hover:text-sky-500 transition-colors group" 
            aria-label={showComments ? UZBEK_STRINGS.hideComments : UZBEK_STRINGS.showComments}
            aria-expanded={showComments}
        >
          <ChatBubbleIcon className="w-5 h-5 group-hover:scale-110 transition-transform"/>
          {commentCount > 0 && <span className="text-xs font-medium">{commentCount}</span>}
        </button>
        <span className="text-xs text-gray-400 uppercase ml-auto">
            {likeCount === 0 && commentCount === 0 ? UZBEK_STRINGS.firstLikePrompt : ''}
        </span>
      </div>

      {showComments && (
        <div className="mt-3 pt-3 border-t border-gray-100 space-y-3">
          {item.comments.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-2">{UZBEK_STRINGS.noCommentsYet}</p>
          ) : (
            item.comments.slice().sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()).map(comment => (
              <div key={comment.id} className="flex items-start space-x-2">
                <img 
                  src={comment.userProfilePic || 'https://picsum.photos/seed/commenter/32/32'} 
                  alt={comment.userName} 
                  className="w-7 h-7 rounded-full object-cover border border-gray-200 mt-0.5"
                />
                <div className="flex-1 bg-gray-50 p-2 rounded-md text-xs border border-gray-200">
                  <div className="flex items-baseline justify-between">
                    <span className="font-semibold text-black">{comment.userName}</span>
                    <span className="text-gray-400 text-[10px]">{formatRelativeTime(new Date(comment.timestamp))}</span>
                  </div>
                  <p className="text-gray-700 mt-0.5 whitespace-pre-wrap break-words">{comment.text}</p>
                </div>
              </div>
            ))
          )}
          <div className="flex items-center space-x-2">
            <input 
              type="text"
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              placeholder={UZBEK_STRINGS.addCommentPlaceholder}
              className="flex-grow bg-gray-100 border-gray-300 text-black text-xs rounded-sm p-2 focus:ring-1 focus:ring-black focus:border-black placeholder-gray-400"
              disabled={isSubmittingComment}
              onKeyPress={(e) => { if (e.key === 'Enter' && !isSubmittingComment) handleCommentSubmit(); }}
            />
            <button 
              onClick={handleCommentSubmit}
              disabled={isSubmittingComment || !newCommentText.trim()}
              className="p-2 bg-black text-white rounded-sm hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              aria-label={UZBEK_STRINGS.sendComment}
            >
              {isSubmittingComment 
                ? <ClockIcon className="w-4 h-4 animate-spin"/> 
                : <SendIcon className="w-4 h-4"/>
              }
            </button>
          </div>
        </div>
      )}

      {confirmation.show && (
        <div 
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4"
          role="dialog" 
          aria-modal="true" 
          aria-labelledby="confirmationDialogTitle"
        > 
          <div className="bg-white p-5 rounded-none shadow-xl max-w-sm w-full border border-gray-300"> 
            <h4 id="confirmationDialogTitle" className="text-md font-semibold text-gray-800 mb-1">
                {confirmation.taskType ? UZBEK_STRINGS.confirmTaskExecutionPrompt : UZBEK_STRINGS.confirmMarkAsCompleted }
            </h4>
            <p className="text-sm text-gray-600 mb-4 break-words">"{confirmation.todoText}"</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCancelAction}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-sm transition-colors"
              >
                {UZBEK_STRINGS.no}
              </button>
              <button
                onClick={handleConfirmAction}
                className="px-4 py-2 text-sm font-medium text-white bg-black hover:bg-gray-800 rounded-sm transition-colors"
              >
                {UZBEK_STRINGS.yes}
              </button>
            </div>
          </div>
        </div>
      )}

    {showDeleteConfirm && (
        <div 
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-[101] p-4"
          role="dialog" 
          aria-modal="true" 
          aria-labelledby="deleteConfirmDialogTitle"
        > 
          <div 
            className="bg-white p-5 md:p-6 rounded-none shadow-xl max-w-xs w-full border border-gray-300"
          >
            <h4 id="deleteConfirmDialogTitle" className="text-lg font-semibold text-gray-900 mb-2">
              {UZBEK_STRINGS.confirmDeletePostTitle}
            </h4>
            <p className="text-sm text-gray-600 mb-5">
              {UZBEK_STRINGS.confirmDeletePostMessage}
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-sm transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1"
              >
                {UZBEK_STRINGS.cancel}
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-rose-500 hover:bg-rose-600 rounded-sm transition-colors focus:outline-none focus:ring-2 focus:ring-rose-400 focus:ring-offset-1"
                autoFocus
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