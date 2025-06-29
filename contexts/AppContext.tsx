import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  User, 
  FeedItem, 
  Task, 
  TaskType, 
  AppContextType, 
  CreatableFeedItem,
  DailyPlanFeedItem,
  TodoItem,
  UserAchievement
} from '../types';
import { 
  DB_NAME, 
  DB_VERSION, 
  STORE_CURRENT_USER, 
  STORE_ALL_USERS, 
  STORE_FEED_ITEMS,
  CURRENT_USER_KEY,
  DEFAULT_USER_ID
} from '../constants';
import { calculatePoints, ensureDateObjectsInFeedItem, calculateUserAchievements } from '../utils';

export const AppContext = createContext<AppContextType | null>(null);

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [selectedTaskFilter, setSelectedTaskFilter] = useState<TaskType | null>(null);
  const [activeRunningTask, setActiveRunningTask] = useState(false);
  const [activeWakeUpTask, setActiveWakeUpTask] = useState(false);
  const [viewingUserProfileId, setViewingUserProfileId] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'home' | 'profilePage'>('home');
  const [isDailyPlanModalOpen, setIsDailyPlanModalOpen] = useState(false);
  const [editingDailyPlan, setEditingDailyPlan] = useState<DailyPlanFeedItem | null>(null);
  const [isAddBookModalOpen, setIsAddBookModalOpen] = useState(false);
  const [postToEdit, setPostToEdit] = useState<FeedItem | null>(null);
  const [isEditPostModalOpen, setIsEditPostModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Initialize with default user
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Create default user if none exists
        const defaultUser: User = {
          id: DEFAULT_USER_ID,
          name: 'Demo',
          surname: 'User'
        };
        
        setCurrentUser(defaultUser);
        setAllUsers([defaultUser]);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to initialize app:', error);
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const addFeedItem = (item: CreatableFeedItem, options?: { showExistsError?: (message: string) => void }) => {
    if (!currentUser) return;

    const newFeedItem: FeedItem = {
      ...item,
      id: Date.now().toString(),
      userId: currentUser.id,
      userName: `${currentUser.name} ${currentUser.surname}`,
      userProfilePic: currentUser.profilePictureUrl,
      timestamp: new Date(),
      pointsAwarded: calculatePoints(item),
      likedBy: [],
      comments: [],
      isOffline: !isOnline
    };

    setFeedItems(prev => [newFeedItem, ...prev]);
    showToast('Vazifa muvaffaqiyatli kiritildi!');
  };

  const updateUserProfile = async (name: string, surname: string, profilePictureUrl?: string) => {
    if (!currentUser) return;

    const updatedUser: User = {
      ...currentUser,
      name,
      surname,
      profilePictureUrl
    };

    setCurrentUser(updatedUser);
    setAllUsers(prev => prev.map(user => user.id === currentUser.id ? updatedUser : user));
  };

  const getUserRating = (userId: string, taskType?: TaskType | null): number => {
    const userItems = feedItems.filter(item => 
      item.userId === userId && 
      (!taskType || item.type === taskType)
    );
    
    return userItems.reduce((total, item) => total + item.pointsAwarded, 0);
  };

  const togglePersonalTodoCompletion = (planId: string, todoId: string) => {
    setFeedItems(prev => prev.map(item => {
      if (item.id === planId && item.type === TaskType.DAILY_PLAN) {
        const planItem = item as DailyPlanFeedItem;
        return {
          ...planItem,
          todos: planItem.todos.map(todo => 
            todo.id === todoId ? { ...todo, isCompleted: !todo.isCompleted } : todo
          )
        };
      }
      return item;
    }));
  };

  const initiateTaskFromPlan = (taskType: TaskType) => {
    if (taskType === TaskType.RUNNING) {
      setActiveRunningTask(true);
    } else if (taskType === TaskType.WAKE_UP) {
      setActiveWakeUpTask(true);
    } else if (taskType === TaskType.BOOK_READING) {
      setIsAddBookModalOpen(true);
    }
  };

  const updateDailyPlan = (planId: string, newTodos: TodoItem[], newPlanDate: Date) => {
    setFeedItems(prev => prev.map(item => {
      if (item.id === planId && item.type === TaskType.DAILY_PLAN) {
        return {
          ...item,
          todos: newTodos,
          planDate: newPlanDate
        } as DailyPlanFeedItem;
      }
      return item;
    }));
  };

  const deleteFeedItem = async (feedItemId: string) => {
    setFeedItems(prev => prev.filter(item => item.id !== feedItemId));
    showToast('Xabar o\'chirildi');
  };

  const openDailyPlanModal = (planToEdit?: DailyPlanFeedItem | null) => {
    setEditingDailyPlan(planToEdit || null);
    setIsDailyPlanModalOpen(true);
  };

  const closeDailyPlanModal = () => {
    setIsDailyPlanModalOpen(false);
    setEditingDailyPlan(null);
  };

  const openPostForEditing = (post: FeedItem) => {
    setPostToEdit(post);
    if (post.type === TaskType.BOOK_READING) {
      setIsAddBookModalOpen(true);
    } else {
      setIsEditPostModalOpen(true);
    }
  };

  const closePostEditor = () => {
    setPostToEdit(null);
    setIsEditPostModalOpen(false);
  };

  const updateFeedItem = async (updatedItem: FeedItem) => {
    setFeedItems(prev => prev.map(item => 
      item.id === updatedItem.id ? updatedItem : item
    ));
    showToast('Muvaffaqiyatli yangilandi');
  };

  const showToast = (message: string, duration: number = 3000) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), duration);
  };

  const toggleLikeFeedItem = (feedItemId: string) => {
    if (!currentUser) return;

    setFeedItems(prev => prev.map(item => {
      if (item.id === feedItemId) {
        const isLiked = item.likedBy.includes(currentUser.id);
        return {
          ...item,
          likedBy: isLiked 
            ? item.likedBy.filter(id => id !== currentUser.id)
            : [...item.likedBy, currentUser.id]
        };
      }
      return item;
    }));
  };

  const addCommentToFeedItem = (feedItemId: string, commentText: string) => {
    if (!currentUser) return;

    const newComment = {
      id: Date.now().toString(),
      userId: currentUser.id,
      userName: `${currentUser.name} ${currentUser.surname}`,
      userProfilePic: currentUser.profilePictureUrl,
      text: commentText,
      timestamp: new Date()
    };

    setFeedItems(prev => prev.map(item => {
      if (item.id === feedItemId) {
        return {
          ...item,
          comments: [...item.comments, newComment]
        };
      }
      return item;
    }));
  };

  const getUserAchievements = (userId: string): UserAchievement[] => {
    return calculateUserAchievements(userId, feedItems);
  };

  const logoutUser = () => {
    setCurrentUser(null);
    setFeedItems([]);
    setCurrentView('home');
    setViewingUserProfileId(null);
  };

  const contextValue: AppContextType = {
    currentUser,
    setCurrentUser,
    allUsers,
    tasks,
    setTasks,
    feedItems,
    setFeedItems,
    selectedTaskFilter,
    setSelectedTaskFilter,
    addFeedItem,
    updateUserProfile,
    activeRunningTask,
    setActiveRunningTask,
    activeWakeUpTask,
    setActiveWakeUpTask,
    getUserRating,
    viewingUserProfileId,
    setViewingUserProfileId,
    isOnline,
    isLoading,
    currentView,
    setCurrentView,
    togglePersonalTodoCompletion,
    initiateTaskFromPlan,
    updateDailyPlan,
    deleteFeedItem,
    isDailyPlanModalOpen,
    editingDailyPlan,
    openDailyPlanModal,
    closeDailyPlanModal,
    isAddBookModalOpen,
    setIsAddBookModalOpen,
    postToEdit,
    isEditPostModalOpen,
    openPostForEditing,
    closePostEditor,
    updateFeedItem,
    toastMessage,
    showToast,
    searchTerm,
    setSearchTerm,
    toggleLikeFeedItem,
    addCommentToFeedItem,
    getUserAchievements,
    logoutUser
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};