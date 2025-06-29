


import React, { createContext, useState, useEffect, useCallback, useRef } from 'react';
import { User, Task, FeedItem, AppContextType, TaskType, CreatableFeedItem, RunningFeedItem, BookReadingFeedItem, SyncQueueItem, SyncActionType, DailyPlanFeedItem, WakeUpFeedItem, Point, TodoItem, UserComment, UserAchievement } from '../types';
import { DEFAULT_USER_ID, UZBEK_STRINGS, MANDATORY_TASK_TYPES_FOR_PLAN, MAX_SYNC_RETRIES, SYNC_RETRY_DELAY_MS } from '../constants';
import * as db from '../services/db';
import { ensureDateObjectsInFeedItem, calculatePoints, calculateUserAchievements } from '../utils'; 

const initialUserFallback: User = { // This user can be an option on the Login screen
  id: DEFAULT_USER_ID,
  name: 'Ali',
  surname: 'Valiyev',
  profilePictureUrl: 'https://picsum.photos/seed/user123/100/100',
};

const sampleUsersFallback: User[] = [
  initialUserFallback,
  { id: 'user124', name: 'Vali', surname: 'Aliyev', profilePictureUrl: 'https://picsum.photos/seed/valialiyev/100/100' },
  { id: 'user125', name: 'Salima', surname: 'Qosimova', profilePictureUrl: 'https://picsum.photos/seed/salima/100/100' },
  { id: 'user126', name: 'Husan', surname: 'Karimov', profilePictureUrl: 'https://picsum.photos/seed/husan/100/100' },
  { id: 'user127', name: 'Laylo', surname: 'Rustamova', profilePictureUrl: 'https://picsum.photos/seed/laylo/100/100' },
];

const initialTasks: Task[] = [
  { id: 'task1', title: 'Tonggi Yugurish', type: TaskType.RUNNING, description: "Har kuni 5 km yugurish." },
  { id: 'task2', title: 'Erta Uyg\'onish', type: TaskType.WAKE_UP, description: "Har kuni soat 6:00 da uyg'onish va tasdiqlash." },
  { id: 'task3', title: 'Kunlik Reja Tuzish', type: TaskType.DAILY_PLAN, description: "Har kuni ertalab kunlik rejalarni yozish." },
  { id: 'task4', title: "Asar Mutolaasi", type: TaskType.BOOK_READING, description: "Har kuni 30 bet mutolaa qilish." },
];

const now = Date.now();
const samplePathPoints: Point[] = [
  { lat: 41.2995, lng: 69.2401, speed: 10 },
  { lat: 41.3000, lng: 69.2405, speed: 11 },
  { lat: 41.3005, lng: 69.2410, speed: 9 },
  { lat: 41.3000, lng: 69.2415, speed: 10 },
];

const sampleTodos: TodoItem[] = [
    { id: 'todo1', text: 'Ertalabki mashqlar', isCompleted: true, isMandatory: true, taskType: TaskType.RUNNING },
    { id: 'todo2', text: 'Yangi mavzuni o\'rganish', isCompleted: false },
    { id: 'todo3', text: 'Kitob o\'qish (50 bet)', isCompleted: true, isMandatory: true, taskType: TaskType.BOOK_READING },
];

const sampleComments: UserComment[] = [
    { 
        id: 'comment1', 
        userId: 'user125', 
        userName: 'Salima Qosimova', 
        userProfilePic: 'https://picsum.photos/seed/salima/100/100', 
        text: 'Zo\'r natija! 👍', 
        timestamp: new Date(now - 1000 * 60 * 20) 
    }
];


const initialFeedItemsFallback: FeedItem[] = [
   {
    id: 'feed1', userId: 'user124', userName: 'Vali Aliyev', userProfilePic: 'https://picsum.photos/seed/valialiyev/100/100',
    timestamp: new Date(now - 1000 * 60 * 30), type: TaskType.RUNNING, title: "Kechki Salqin Yugurish",
    eventTimestamp: new Date(now - 1000 * 60 * 60 * 2), distance: 5.2, duration: 30 * 60 + 15, pace: "5'49\" /km",
    calories: 350, elevationGain: 25, avgHeartRate: 155, pathPoints: samplePathPoints,
    pointsAwarded: calculatePoints({type: TaskType.RUNNING, distance: 5.2} as CreatableFeedItem),
    likedBy: ['user123', 'user125'],
    comments: sampleComments,
    isOffline: false,
    syncFailed: false,
  } as RunningFeedItem,
  {
    id: 'feed2', userId: DEFAULT_USER_ID, userName: 'Ali Valiyev', userProfilePic: 'https://picsum.photos/seed/user123/100/100',
    timestamp: new Date(now - 1000 * 60 * 60 * 5), type: TaskType.WAKE_UP, 
    pointsAwarded: calculatePoints({type: TaskType.WAKE_UP} as CreatableFeedItem),
    likedBy: [],
    comments: [],
    isOffline: false,
    syncFailed: false,
  },
   {
    id: 'feed3', userId: 'user125', userName: 'Salima Qosimova', userProfilePic: 'https://picsum.photos/seed/salima/100/100',
    timestamp: new Date(now - 1000 * 60 * 60 * 8), type: TaskType.DAILY_PLAN,
    planDate: new Date(now - 1000 * 60 * 60 * 8), // Match timestamp for sample
    todos: sampleTodos,
    pointsAwarded: calculatePoints({type: TaskType.DAILY_PLAN, todos: sampleTodos, planDate: new Date(now - 1000 * 60 * 60 * 8)} as CreatableFeedItem),
    likedBy: [DEFAULT_USER_ID],
    comments: [],
    isOffline: false,
    syncFailed: false,
  } as DailyPlanFeedItem,
];

export const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUserInternal] = useState<User | null>(null); // Initialize as null
  const [allUsers, setAllUsersInternal] = useState<User[]>([]);
  const [tasks, setTasksInternal] = useState<Task[]>(initialTasks); 
  const [feedItems, setFeedItemsInternal] = useState<FeedItem[]>([]);
  const [selectedTaskFilter, setSelectedTaskFilterInternal] = useState<TaskType | null>(null);
  const [activeRunningTask, setActiveRunningTaskInternal] = useState<boolean>(false);
  const [activeWakeUpTask, setActiveWakeUpTaskInternal] = useState<boolean>(false);
  const [viewingUserProfileId, setViewingUserProfileIdInternal] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentView, setCurrentViewInternal] = useState<'home' | 'profilePage'>('home'); // Removed 'progress'
  
  // Modal State
  const [isDailyPlanModalOpen, setIsDailyPlanModalOpen] = useState(false);
  const [editingDailyPlan, setEditingDailyPlan] = useState<DailyPlanFeedItem | null>(null);
  const [isAddBookModalOpen, setIsAddBookModalOpen] = useState(false);
  const [isEditPostModalOpen, setIsEditPostModalOpen] = useState(false);
  const [postToEdit, setPostToEdit] = useState<FeedItem | null>(null);

  // Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  // Search State
  const [searchTerm, setSearchTermInternal] = useState<string>('');


  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const dbUser = await db.getCurrentUserDB();
        // If there's a user in DB, set them. Otherwise, currentUser remains null (forcing login).
        if (dbUser) {
            setCurrentUserInternal(dbUser);
        } else {
            setCurrentUserInternal(null); // Ensure currentUser is null to trigger LoginView
        }

        const dbAllUsers = await db.getAllUsersDB();
        setAllUsersInternal(dbAllUsers && dbAllUsers.length > 0 ? dbAllUsers : sampleUsersFallback);
        if (!dbAllUsers || dbAllUsers.length === 0) await db.setAllUsersDB(sampleUsersFallback);

        const dbFeedItems = await db.getAllFeedItemsDB();
        const itemsToSet = (dbFeedItems && dbFeedItems.length > 0 
            ? dbFeedItems 
            : initialFeedItemsFallback).map(item => ({ 
                ...ensureDateObjectsInFeedItem(item),
                likedBy: item.likedBy || [],
                comments: (item.comments || []).map(c => ({...c, timestamp: new Date(c.timestamp)})),
                pointsAwarded: item.pointsAwarded || calculatePoints(item as CreatableFeedItem),
                isOffline: item.isOffline || false,
                syncFailed: item.syncFailed || false,
            }));

        setFeedItemsInternal(itemsToSet);

        if (!dbFeedItems || dbFeedItems.length === 0) await db.setFeedItemsDB(itemsToSet);
        
      } catch (error) {
        console.error("Error loading data from IndexedDB:", error);
        setCurrentUserInternal(null); // Default to null on error to force login
        setAllUsersInternal(sampleUsersFallback);
        setFeedItemsInternal(initialFeedItemsFallback.map(item => ({
            ...ensureDateObjectsInFeedItem(item),
            likedBy: item.likedBy || [],
            comments: (item.comments || []).map(c => ({...c, timestamp: new Date(c.timestamp)})),
            pointsAwarded: item.pointsAwarded || calculatePoints(item as CreatableFeedItem),
            isOffline: item.isOffline || false,
            syncFailed: item.syncFailed || false,
        })));
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

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
  
  const showToast = useCallback((message: string, duration: number = 3000) => {
    setToastMessage(message);
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage(null);
    }, duration);
  }, []);

  const synchronizePendingTasks = useCallback(async () => {
    if (!isOnline) return;
    try {
      const queue = await db.getSyncQueueDB();
      if (queue.length === 0) return;
      
      let itemsChangedInLoop = false;
      let newFeedItemsState = [...feedItems]; 

      for (const syncItem of queue) {
        await new Promise(resolve => setTimeout(resolve, SYNC_RETRY_DELAY_MS)); 
        
        try {
          const currentRetryCount = syncItem.retryCount || 0;

          if (currentRetryCount >= MAX_SYNC_RETRIES) {
            // Permanent failure
            const itemName = syncItem.itemId || syncItem.payload?.id || syncItem.payload?.bookTitle || syncItem.payload?.type || 'Noma\'lum element';
            showToast(UZBEK_STRINGS.itemSyncFailedPermanently(itemName), 5000);
            
            if (syncItem.itemId) {
              const itemIndexInState = newFeedItemsState.findIndex(fi => fi.id === syncItem.itemId);
              if (itemIndexInState !== -1) {
                newFeedItemsState[itemIndexInState] = { ...newFeedItemsState[itemIndexInState], syncFailed: true, isOffline: true };
                await db.addFeedItemDB(newFeedItemsState[itemIndexInState]);
                itemsChangedInLoop = true;
              } else if (syncItem.payload && syncItem.payload.id === syncItem.itemId) {
                // If not in state, try to update directly in DB if payload is the item
                 await db.addFeedItemDB({ ...syncItem.payload, syncFailed: true, isOffline: true });
              }
            }
            await db.deleteSyncQueueItemDB(syncItem.id); // Remove from queue
            continue; // Move to the next item in the queue
          }

          // Actual sync logic based on actionType
          let successfullySynced = false;
          if (syncItem.actionType === SyncActionType.ADD_FEED_ITEM && syncItem.itemId) {
            const temporaryOrRealId = syncItem.itemId;
            const itemPayload = syncItem.payload as FeedItem;

            const existingItemIndex = newFeedItemsState.findIndex(fi => fi.id === temporaryOrRealId);
            
            if (existingItemIndex !== -1) {
                const newId = temporaryOrRealId.startsWith('offline-') 
                              ? temporaryOrRealId.substring('offline-'.length) 
                              : `synced-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
                
                await db.deleteFeedItemDB(temporaryOrRealId);
                const syncedItem = ensureDateObjectsInFeedItem({ 
                    ...newFeedItemsState[existingItemIndex], 
                    id: newId, 
                    isOffline: false,
                    syncFailed: false,
                });
                await db.addFeedItemDB(syncedItem);
                newFeedItemsState.splice(existingItemIndex, 1, syncedItem);
                successfullySynced = true;
            } else if (itemPayload) { 
                const newId = itemPayload.id.startsWith('offline-') 
                              ? itemPayload.id.substring('offline-'.length) 
                              : `synced-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
                await db.deleteFeedItemDB(itemPayload.id); // Delete old one if it existed by its original ID
                const syncedItem = ensureDateObjectsInFeedItem({ ...itemPayload, id: newId, isOffline: false, syncFailed: false });
                await db.addFeedItemDB(syncedItem);
                newFeedItemsState.push(syncedItem); // Add to state if it wasn't there
                successfullySynced = true;
            }
          } else if (syncItem.actionType === SyncActionType.UPDATE_FEED_ITEM && syncItem.itemId) {
            const itemPayload = syncItem.payload as FeedItem;
            const existingItemIndex = newFeedItemsState.findIndex(fi => fi.id === syncItem.itemId);

            if (existingItemIndex !== -1 || itemPayload) {
                const itemToUpdateWith = itemPayload || newFeedItemsState[existingItemIndex];
                const syncedItem = ensureDateObjectsInFeedItem({ 
                    ...itemToUpdateWith, 
                    isOffline: false,
                    syncFailed: false,
                });
                await db.addFeedItemDB(syncedItem); 
                if(existingItemIndex !== -1) {
                    newFeedItemsState[existingItemIndex] = syncedItem;
                } else { 
                    newFeedItemsState = newFeedItemsState.filter(fi => fi.id !== syncedItem.id);
                    newFeedItemsState.push(syncedItem);
                }
                successfullySynced = true;
            }
          } else if (syncItem.actionType === SyncActionType.UPDATE_USER_PROFILE) {
            // This is primarily for backend sync, local DB is already updated.
            // For simulation, assume success.
            successfullySynced = true;
          }
          
          if (successfullySynced) {
            await db.deleteSyncQueueItemDB(syncItem.id);
            itemsChangedInLoop = true; // Mark that state might have changed
          } else {
             // This case should ideally not be hit if all sync actions are covered
             // or if item was unidentifiable. Treat as failure to be safe.
             throw new Error("Sync action type not fully handled or item unidentifiable.");
          }

        } catch (error) {
          console.error(`Failed to sync item ${syncItem.id} (type: ${syncItem.actionType}, itemId: ${syncItem.itemId}):`, error);
          const nextRetryCount = (syncItem.retryCount || 0) + 1;
          await db.addSyncQueueItemDB({ ...syncItem, retryCount: nextRetryCount });
          const itemName = syncItem.itemId || syncItem.payload?.id || syncItem.payload?.bookTitle || syncItem.payload?.type || 'Noma\'lum element';
          showToast(UZBEK_STRINGS.itemSyncFailedAttempt(itemName, nextRetryCount, MAX_SYNC_RETRIES), 4000);
        }
      }
      if(itemsChangedInLoop) { // Only update state if something actually changed
         setFeedItemsInternal(newFeedItemsState.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      }
    } catch (error) {
      console.error("Error processing sync queue:", error);
      showToast("Sinxronizatsiya jarayonida umumiy xatolik.", 5000);
    }
  }, [isOnline, feedItems, showToast]); 

  useEffect(() => {
    if (isOnline) {
      synchronizePendingTasks();
    }
  }, [isOnline, synchronizePendingTasks]);


  const setCurrentUser = useCallback(async (user: User | null) => {
    setCurrentUserInternal(user);
    if (user) {
      await db.setCurrentUserDB(user);
    } else {
      // If user is null (e.g., during logout process before clearCurrentUserDB is called by logoutUser),
      // we might not want to store 'null' in DB, or handle it specifically.
      // For now, logoutUser will handle clearing.
    }
  }, []);

  const logoutUser = useCallback(async () => {
    setCurrentUserInternal(null);
    await db.clearCurrentUserDB();
    // Reset other relevant states if necessary
    setViewingUserProfileIdInternal(null);
    setCurrentViewInternal('home'); 
    showToast("Tizimdan chiqdingiz.", 2000);
  }, [showToast]);

  const setAllUsers = useCallback(async (usersUpdater: React.SetStateAction<User[]>) => {
    const oldUsers = allUsers; 
    const newUsers = typeof usersUpdater === 'function' ? usersUpdater(oldUsers) : usersUpdater;
    setAllUsersInternal(newUsers);
    await db.setAllUsersDB(newUsers);
  }, [allUsers]);

  const setFeedItems = useCallback(async (itemsUpdater: React.SetStateAction<FeedItem[]>) => {
      const oldItems = feedItems; 
      const newItemsRaw = typeof itemsUpdater === 'function' ? itemsUpdater(oldItems) : itemsUpdater;
      const processedItems = newItemsRaw.map(item => ({
        ...ensureDateObjectsInFeedItem(item),
        likedBy: item.likedBy || [], 
        comments: (item.comments || []).map(c => ({...c, timestamp: new Date(c.timestamp)})), 
        isOffline: item.isOffline || false,
        syncFailed: item.syncFailed || false,
      })).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setFeedItemsInternal(processedItems);
      await db.setFeedItemsDB(processedItems);
  }, [feedItems]);

  const setSelectedTaskFilter = useCallback((filterUpdater: React.SetStateAction<TaskType | null>) => {
    setSelectedTaskFilterInternal(filterUpdater);
  }, []);

  const setCurrentView = useCallback((viewUpdater: React.SetStateAction<'home' | 'profilePage'>) => { // Removed 'progress'
    setCurrentViewInternal(viewUpdater);
  }, []);

  const setSearchTerm = useCallback((termUpdater: React.SetStateAction<string>) => {
    setSearchTermInternal(termUpdater);
  }, []);

  const setTasks = useCallback((tasksUpdater: React.SetStateAction<Task[]>) => {
    setTasksInternal(tasksUpdater);
  }, []);

  const setActiveRunningTask = useCallback((value: React.SetStateAction<boolean>) => {
    setActiveRunningTaskInternal(value);
  }, []);

  const setActiveWakeUpTask = useCallback((value: React.SetStateAction<boolean>) => {
    setActiveWakeUpTaskInternal(value);
  }, []);
  
  const setViewingUserProfileId = useCallback((value: React.SetStateAction<string | null>) => {
    setViewingUserProfileIdInternal(value);
    // If a user ID is being set, switch the view to the profile page.
    if (value) {
      setCurrentViewInternal('profilePage');
    }
    // Note: The logic to return to the 'home' view is handled in the onClose callback
    // in App.tsx, which is the correct place for it.
  }, []);

  const addFeedItem = useCallback(async (itemData: CreatableFeedItem, options?: { showExistsError?: (message: string) => void }) => {
    if (!currentUser) return;

    const submissionTimestamp = new Date();

    if (itemData.type === TaskType.DAILY_PLAN) {
        const planDate = (itemData as DailyPlanFeedItem).planDate; 
        const planDateString = new Date(planDate).toDateString();
        const existingPlan = feedItems.find(
            (fi) =>
                fi.type === TaskType.DAILY_PLAN &&
                fi.userId === currentUser.id &&
                new Date((fi as DailyPlanFeedItem).planDate).toDateString() === planDateString
        );
        if (existingPlan) {
            const errorMessage = UZBEK_STRINGS.dailyPlanExistsError(new Date(planDate).toLocaleDateString('uz-UZ'));
            if (options?.showExistsError) {
                 options.showExistsError(errorMessage);
            } else {
                showToast(errorMessage, 4000); 
            }
            return; 
        }
    }

    if (itemData.type === TaskType.WAKE_UP) {
        const todayString = submissionTimestamp.toDateString();
        const existingWakeUp = feedItems.find(
            (fi) =>
                fi.type === TaskType.WAKE_UP &&
                fi.userId === currentUser.id &&
                new Date(fi.timestamp).toDateString() === todayString
        );
        if (existingWakeUp) {
            const errorMessage = UZBEK_STRINGS.wakeUpExistsError(submissionTimestamp.toLocaleDateString('uz-UZ'));
            if (options?.showExistsError) {
                options.showExistsError(errorMessage);
            } else {
                showToast(errorMessage, 4000); 
            }
            return; 
        }
    }
    
    const baseId = submissionTimestamp.getTime();
    const temporaryId = `offline-${baseId}-${Math.random().toString(36).substr(2, 5)}`;
    const onlineId = `feed-${baseId}-${Math.random().toString(36).substr(2, 5)}`;
    const points = calculatePoints(itemData);

    const newFeedItem: FeedItem = ensureDateObjectsInFeedItem({
        ...itemData,
        id: isOnline ? onlineId : temporaryId,
        timestamp: submissionTimestamp,
        userId: currentUser.id,
        userName: `${currentUser.name} ${currentUser.surname}`,
        userProfilePic: currentUser.profilePictureUrl,
        isOffline: !isOnline,
        pointsAwarded: points,
        likedBy: [], 
        comments: [], 
        syncFailed: false,
    } as FeedItem); 

    setFeedItems(prevItems => {
        let updatedItems = [...prevItems];

        if (MANDATORY_TASK_TYPES_FOR_PLAN.includes(newFeedItem.type) && newFeedItem.userId === currentUser.id) {
            const submittedTaskDate = newFeedItem.type === TaskType.RUNNING && (newFeedItem as RunningFeedItem).eventTimestamp
                ? new Date((newFeedItem as RunningFeedItem).eventTimestamp!) 
                : new Date(newFeedItem.timestamp);
            const submittedTaskDateString = submittedTaskDate.toDateString();

            updatedItems = updatedItems.map(fi => {
                if (fi.type === TaskType.DAILY_PLAN && fi.userId === currentUser.id) {
                    const plan = fi as DailyPlanFeedItem;
                    const planDateObject = plan.planDate instanceof Date ? plan.planDate : new Date(plan.planDate);
                    
                    if (planDateObject.toDateString() === submittedTaskDateString) {
                        let planWasModified = false;
                        const updatedTodos = plan.todos.map(todo => {
                            if (todo.isMandatory && todo.taskType === newFeedItem.type && !todo.isCompleted) {
                                planWasModified = true;
                                return { ...todo, isCompleted: true };
                            }
                            return todo;
                        });
                        if (planWasModified) {
                            return { ...plan, todos: updatedTodos };
                        }
                    }
                }
                return fi; 
            });
        }
        return [newFeedItem, ...updatedItems].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    });


    if (!isOnline) {
        const syncItem: SyncQueueItem = {
            id: `sync-add-${Date.now()}-${newFeedItem.id}`, 
            actionType: SyncActionType.ADD_FEED_ITEM,
            payload: newFeedItem, 
            timestamp: Date.now(),
            itemId: newFeedItem.id, 
            retryCount: 0,
        };
        await db.addSyncQueueItemDB(syncItem);
    }
  }, [currentUser, isOnline, setFeedItems, feedItems, showToast]); 

  const updateDailyPlan = useCallback(async (planId: string, newTodos: TodoItem[], newPlanDate: Date) => {
    let updatedPlanForSync: DailyPlanFeedItem | null = null;
    
    setFeedItems(prevItems => {
      const updatedItems = prevItems.map(item => {
        if (item.id === planId && item.type === TaskType.DAILY_PLAN) {
          const existingPlan = item as DailyPlanFeedItem;
          updatedPlanForSync = ensureDateObjectsInFeedItem({
            ...existingPlan,
            todos: newTodos,
            planDate: newPlanDate, 
            isOffline: !isOnline, 
            syncFailed: existingPlan.syncFailed || !isOnline, // Preserve syncFailed status or set if offline
          }) as DailyPlanFeedItem;
          return updatedPlanForSync;
        }
        return item;
      });
      return updatedItems.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    });

    if (!isOnline && updatedPlanForSync) {
        const syncItem: SyncQueueItem = {
            id: `sync-update-${Date.now()}-${planId}`,
            actionType: SyncActionType.UPDATE_FEED_ITEM,
            payload: updatedPlanForSync, 
            timestamp: Date.now(),
            itemId: planId,
            retryCount: 0,
        };
        await db.addSyncQueueItemDB(syncItem);
    } else if (isOnline && updatedPlanForSync) { 
        await db.addFeedItemDB(updatedPlanForSync); // Save to DB if online (will mark isOffline false)
    } else if (!isOnline && !updatedPlanForSync) {
         console.error("Could not find item in feedItems to create sync payload for UPDATE_FEED_ITEM during updateDailyPlan", planId);
    }
  }, [setFeedItems, isOnline]);
  
  const updateFeedItem = useCallback(async (updatedItem: FeedItem) => {
    const finalItem = ensureDateObjectsInFeedItem({
        ...updatedItem,
        isOffline: !isOnline,
        syncFailed: updatedItem.syncFailed || !isOnline,
    });
    
    setFeedItems(prevItems => {
        const newItems = prevItems.map(item => (item.id === finalItem.id ? finalItem : item));
        return newItems.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    });

    if (!isOnline) {
        const syncItem: SyncQueueItem = {
            id: `sync-update-${Date.now()}-${finalItem.id}`,
            actionType: SyncActionType.UPDATE_FEED_ITEM,
            payload: finalItem,
            timestamp: Date.now(),
            itemId: finalItem.id,
            retryCount: 0,
        };
        await db.addSyncQueueItemDB(syncItem);
    } else {
        await db.addFeedItemDB(finalItem);
    }
  }, [setFeedItems, isOnline]);


  const updateUserProfile = useCallback(async (name: string, surname: string, profilePictureUrl?: string): Promise<void> => {
    if (!currentUser) return;

    const updatedUserData = { 
      ...currentUser, 
      name, 
      surname, 
      profilePictureUrl: profilePictureUrl ?? currentUser.profilePictureUrl 
    };

    setCurrentUserInternal(updatedUserData); 
    await db.setCurrentUserDB(updatedUserData);
    
    setAllUsersInternal(prevAllUsers => {
        const newAllUsers = prevAllUsers.map(u => u.id === updatedUserData.id ? updatedUserData : u);
        db.setAllUsersDB(newAllUsers); 
        return newAllUsers;
    });

    setFeedItemsInternal(prevFeedItems => {
        const newFeedItems = prevFeedItems.map(item => 
          item.userId === currentUser.id 
          ? ensureDateObjectsInFeedItem({ ...item, userName: `${updatedUserData.name} ${updatedUserData.surname}`, userProfilePic: updatedUserData.profilePictureUrl }) 
          : ensureDateObjectsInFeedItem(item) 
        );
        db.setFeedItemsDB(newFeedItems); 
        return newFeedItems;
    });
    
    if (!isOnline) {
      const syncItem: SyncQueueItem = {
        id: `sync-profile-${Date.now()}`,
        actionType: SyncActionType.UPDATE_USER_PROFILE,
        payload: updatedUserData,
        timestamp: Date.now(),
        itemId: updatedUserData.id, 
        retryCount: 0,
      };
      await db.addSyncQueueItemDB(syncItem);
    }
  }, [currentUser, isOnline]); 

  const getUserRating = useCallback((userId: string, taskType: TaskType | null = null): number => {
    return feedItems.reduce((totalPoints, item) => {
      if (item.userId === userId) {
        if (taskType === null || item.type === taskType) { 
          return totalPoints + (item.pointsAwarded || 0); 
        }
      }
      return totalPoints;
    }, 0);
  }, [feedItems]);

  const togglePersonalTodoCompletion = useCallback(async (planId: string, todoId: string) => {
    let updatedPlanForSync: DailyPlanFeedItem | null = null;

    setFeedItems(prevItems => {
      const updatedItems = prevItems.map(item => {
        if (item.id === planId && item.type === TaskType.DAILY_PLAN) {
          const plan = item as DailyPlanFeedItem;
          const updatedTodos = plan.todos.map(todo => {
            if (todo.id === todoId && !todo.isMandatory) { 
              return { ...todo, isCompleted: !todo.isCompleted };
            }
            return todo;
          });
          
          updatedPlanForSync = ensureDateObjectsInFeedItem({ 
              ...plan, 
              todos: updatedTodos, 
              isOffline: !isOnline,
              syncFailed: plan.syncFailed || !isOnline, 
            }) as DailyPlanFeedItem;
          return updatedPlanForSync;
        }
        return item;
      });
      return updatedItems.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()); 
    });

    if (!isOnline && updatedPlanForSync) {
      const syncItem: SyncQueueItem = {
        id: `sync-update-todo-${Date.now()}-${planId}-${todoId}`,
        actionType: SyncActionType.UPDATE_FEED_ITEM,
        payload: updatedPlanForSync, 
        timestamp: Date.now(),
        itemId: planId,
        retryCount: 0,
      };
      await db.addSyncQueueItemDB(syncItem);
    } else if (isOnline && updatedPlanForSync) {
        await db.addFeedItemDB(updatedPlanForSync);
    } else if (!isOnline && !updatedPlanForSync) {
        console.error("Could not find plan to create sync payload for togglePersonalTodoCompletion", planId);
    }
  }, [setFeedItems, isOnline]); 
  
  const navigateToHomeAndSetFilterInternal = useCallback((filter: TaskType | null) => {
    setCurrentViewInternal('home');
    setSelectedTaskFilterInternal(filter);
    if (viewingUserProfileId) { 
        setViewingUserProfileIdInternal(null);
    }
  }, [viewingUserProfileId]); 

  const initiateTaskFromPlan = useCallback((taskType: TaskType) => {
    navigateToHomeAndSetFilterInternal(taskType);
  }, [navigateToHomeAndSetFilterInternal]);

  const deleteFeedItem = useCallback(async (feedItemId: string) => {
      try {
        // Remove from the main feed items store in DB
        await db.deleteFeedItemDB(feedItemId);
        
        // If the item was created offline, it might have an entry in the sync queue. Remove it.
        const queue = await db.getSyncQueueDB();
        const syncItemToDelete = queue.find(item => item.itemId === feedItemId);
        if (syncItemToDelete) {
          await db.deleteSyncQueueItemDB(syncItemToDelete.id);
        }

        // Update the state to reflect the change in the UI
        setFeedItemsInternal(prev => prev.filter(item => item.id !== feedItemId));
        
        showToast("Xabar muvaffaqiyatli o'chirildi.", 2000);
      } catch (error) {
        console.error("Failed to delete feed item:", error);
        showToast("Xabarni o'chirishda xatolik yuz berdi.", 3000);
      }
  }, [showToast]);

  // Daily Plan Modal
  const openDailyPlanModal = useCallback((planToEdit?: DailyPlanFeedItem | null) => {
    setEditingDailyPlan(planToEdit || null);
    if(planToEdit) setPostToEdit(planToEdit);
    setIsDailyPlanModalOpen(true);
  }, []);

  const closeDailyPlanModal = useCallback(() => {
    setIsDailyPlanModalOpen(false);
    setEditingDailyPlan(null);
    if(postToEdit?.type === TaskType.DAILY_PLAN) setPostToEdit(null);
  }, [postToEdit]);

  // Generic Post Editing
  const openPostForEditing = useCallback((post: FeedItem) => {
    setPostToEdit(post);
    if (post.type === TaskType.RUNNING || post.type === TaskType.WAKE_UP) {
        setIsEditPostModalOpen(true);
    } else if (post.type === TaskType.BOOK_READING) {
        setIsAddBookModalOpen(true);
    } else if (post.type === TaskType.DAILY_PLAN) {
        openDailyPlanModal(post as DailyPlanFeedItem);
    }
  }, [openDailyPlanModal]);

  const closePostEditor = useCallback(() => {
    setPostToEdit(null);
    setIsEditPostModalOpen(false);
    // Note: Other modals handle their own closing flags (e.g., AddBook modal), but we ensure the edit context is cleared.
    if (isAddBookModalOpen) setIsAddBookModalOpen(false);
    if (isDailyPlanModalOpen) closeDailyPlanModal();
  }, [isAddBookModalOpen, isDailyPlanModalOpen, closeDailyPlanModal]);


  const toggleLikeFeedItem = useCallback(async (feedItemId: string) => {
    if (!currentUser) return;
    let updatedItemForSync: FeedItem | null = null;

    setFeedItems(prevItems => {
        const newItems = prevItems.map(item => {
            if (item.id === feedItemId) {
                const likedByCurrentUser = item.likedBy.includes(currentUser.id);
                const newLikedBy = likedByCurrentUser
                    ? item.likedBy.filter(uid => uid !== currentUser.id)
                    : [...item.likedBy, currentUser.id];
                updatedItemForSync = ensureDateObjectsInFeedItem({
                    ...item,
                    likedBy: newLikedBy,
                    isOffline: !isOnline,
                    syncFailed: item.syncFailed || !isOnline,
                });
                return updatedItemForSync;
            }
            return item;
        });
        return newItems.sort((a, b) => new Date(b.timestamp).getTime() - new Date(b.timestamp).getTime());
    });

    if (updatedItemForSync) {
        if (!isOnline) {
            const syncItem: SyncQueueItem = {
                id: `sync-like-${Date.now()}-${feedItemId}`,
                actionType: SyncActionType.UPDATE_FEED_ITEM,
                payload: updatedItemForSync,
                timestamp: Date.now(),
                itemId: feedItemId,
                retryCount: 0,
            };
            await db.addSyncQueueItemDB(syncItem);
        } else {
             await db.addFeedItemDB(updatedItemForSync); 
        }
    }
  }, [currentUser, isOnline, setFeedItems]);

  const addCommentToFeedItem = useCallback(async (feedItemId: string, commentText: string) => {
    if (!currentUser || !commentText.trim()) return;
    let updatedItemForSync: FeedItem | null = null;

    setFeedItems(prevItems => {
        const newItems = prevItems.map(item => {
            if (item.id === feedItemId) {
                const newComment: UserComment = {
                    id: `comment-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                    userId: currentUser.id,
                    userName: `${currentUser.name} ${currentUser.surname}`,
                    userProfilePic: currentUser.profilePictureUrl,
                    text: commentText.trim(),
                    timestamp: new Date(),
                };
                updatedItemForSync = ensureDateObjectsInFeedItem({
                    ...item,
                    comments: [...item.comments, newComment],
                    isOffline: !isOnline,
                    syncFailed: item.syncFailed || !isOnline,
                });
                return updatedItemForSync;
            }
            return item;
        });
        return newItems.sort((a, b) => new Date(b.timestamp).getTime() - new Date(b.timestamp).getTime());
    });

    if (updatedItemForSync) {
        if (!isOnline) {
            const syncItem: SyncQueueItem = {
                id: `sync-comment-${Date.now()}-${feedItemId}`,
                actionType: SyncActionType.UPDATE_FEED_ITEM,
                payload: updatedItemForSync,
                timestamp: Date.now(),
                itemId: feedItemId,
                retryCount: 0,
            };
            await db.addSyncQueueItemDB(syncItem);
        } else {
            await db.addFeedItemDB(updatedItemForSync); 
        }
    }
  }, [currentUser, isOnline, setFeedItems]);

  const getUserAchievements = useCallback((userId: string): UserAchievement[] => {
    const realAchievements = calculateUserAchievements(userId, feedItems);

    // --- DEMO LOGIC for main user ---
    // If the user is the default user and has no real achievements, show some samples.
    if (userId === DEFAULT_USER_ID && realAchievements.length === 0) {
      return [
        { achievementId: 'FIRST_10K', unlockedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10) },
        { achievementId: 'BOOKWORM_5', unlockedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5) },
        { achievementId: 'CONSISTENCY_7D', unlockedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2) },
      ];
    }
    // --- END DEMO LOGIC ---

    return realAchievements;
  }, [feedItems]);


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
    
    // Daily Plan Modal
    isDailyPlanModalOpen,
    editingDailyPlan,
    openDailyPlanModal,
    closeDailyPlanModal,

    // Book Reading Modal
    isAddBookModalOpen,
    setIsAddBookModalOpen,

    // Post Editing
    postToEdit,
    isEditPostModalOpen,
    openPostForEditing,
    closePostEditor,
    updateFeedItem,

    // Toast
    toastMessage,
    showToast,

    // Search
    searchTerm,
    setSearchTerm,

    // Likes and Comments
    toggleLikeFeedItem,
    addCommentToFeedItem,

    // Achievements
    getUserAchievements,

    // Authentication
    logoutUser,
  };
  
  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
};