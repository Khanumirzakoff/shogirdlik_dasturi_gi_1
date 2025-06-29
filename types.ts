export enum TaskType {
  RUNNING = 'Yugurish',
  WAKE_UP = 'Erta Turish',
  DAILY_PLAN = 'Kunlik Reja',
  BOOK_READING = "Mutoalaa", // O'zgartirildi
}

export interface User {
  id: string;
  name: string;
  surname: string;
  profilePictureUrl?: string;
}

export interface UserComment {
  id: string;
  userId: string;
  userName: string;
  userProfilePic?: string;
  text: string;
  timestamp: Date;
}

export interface BaseFeedItem {
  id: string;
  userId: string;
  userName: string; 
  userProfilePic?: string; 
  timestamp: Date; 
  type: TaskType;
  pointsAwarded: number; 
  isOffline?: boolean; 
  likedBy: string[]; 
  comments: UserComment[]; 
  syncFailed?: boolean; // Added for sync error indication
}

export interface Point {
  lat: number;
  lng: number;
  speed: number; // km/h
}

export interface RunningFeedItem extends BaseFeedItem {
  type: TaskType.RUNNING;
  title?: string; 
  eventTimestamp?: Date; 
  distance: number; 
  duration: number; 
  pace?: string; 
  calories?: number; 
  elevationGain?: number; 
  avgHeartRate?: number; 
  pathPoints?: Point[]; 
  description?: string;
}

export interface WakeUpFeedItem extends BaseFeedItem {
  type: TaskType.WAKE_UP;
  videoBlob?: Blob; 
  description?: string;
}

export interface TodoItem {
  id: string;
  text: string;
  isCompleted: boolean;
  isMandatory?: boolean;
  taskType?: TaskType; // For mandatory items, to link back to the original task type
}

export interface DailyPlanFeedItem extends BaseFeedItem {
  type: TaskType.DAILY_PLAN;
  todos: TodoItem[];
  planDate: Date;
}

export interface BookReadingFeedItem extends BaseFeedItem {
  type: TaskType.BOOK_READING;
  bookTitle: string;
  pagesRead: number;
  review?: string;
  bookImageBase64?: string; 
  audioSummaryBlob?: Blob; 
}

export type FeedItem = RunningFeedItem | WakeUpFeedItem | DailyPlanFeedItem | BookReadingFeedItem;

export interface Task {
  id: string;
  title: string;
  type: TaskType;
  description?: string;
}

// Achievements
export interface Achievement {
  id: 'FIRST_10K' | 'BOOKWORM_5' | 'CONSISTENCY_7D' | 'MORNING_KNIGHT_20' | 'MARATHONER_100K';
  name: string;
  description: string;
  icon: React.ElementType;
  taskType?: TaskType;
}

export interface UserAchievement {
  achievementId: Achievement['id'];
  unlockedAt: Date;
}


type CommonFeedItemOmittedKeys = 'id' | 'timestamp' | 'userId' | 'userName' | 'userProfilePic' | 'isOffline' | 'likedBy' | 'comments' | 'syncFailed';

export type CreatableRunningFeedItem = Omit<RunningFeedItem, CommonFeedItemOmittedKeys | 'description'>;
export type CreatableWakeUpFeedItem = Omit<WakeUpFeedItem, CommonFeedItemOmittedKeys>;
export type CreatableDailyPlanFeedItem = Omit<DailyPlanFeedItem, CommonFeedItemOmittedKeys>;
export type CreatableBookReadingFeedItem = Omit<BookReadingFeedItem, CommonFeedItemOmittedKeys>;


export type CreatableFeedItem =
  | CreatableRunningFeedItem
  | CreatableWakeUpFeedItem
  | CreatableDailyPlanFeedItem
  | CreatableBookReadingFeedItem;

export enum SyncActionType {
  ADD_FEED_ITEM = 'addFeedItem',
  UPDATE_USER_PROFILE = 'updateUserProfile',
  UPDATE_FEED_ITEM = 'updateFeedItem', 
}

export interface SyncQueueItem {
  id: string; 
  actionType: SyncActionType;
  payload: any; 
  timestamp: number;
  itemId?: string; 
  retryCount?: number; // Added for sync retry logic
}


export interface AppContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void; // Modified to accept null
  allUsers: User[];
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  feedItems: FeedItem[];
  setFeedItems: React.Dispatch<React.SetStateAction<FeedItem[]>>;
  selectedTaskFilter: TaskType | null;
  setSelectedTaskFilter: React.Dispatch<React.SetStateAction<TaskType | null>>;
  addFeedItem: (item: CreatableFeedItem, options?: { showExistsError?: (message: string) => void }) => void; 
  updateUserProfile: (name: string, surname: string, profilePictureUrl?: string) => Promise<void>;
  activeRunningTask: boolean;
  setActiveRunningTask: React.Dispatch<React.SetStateAction<boolean>>;
  activeWakeUpTask: boolean;
  setActiveWakeUpTask: React.Dispatch<React.SetStateAction<boolean>>;
  getUserRating: (userId: string, taskType?: TaskType | null) => number; 
  viewingUserProfileId: string | null; 
  setViewingUserProfileId: React.Dispatch<React.SetStateAction<string | null>>;
  isOnline: boolean; 
  isLoading: boolean;
  currentView: 'home' | 'profilePage'; // Removed 'progress'
  setCurrentView: React.Dispatch<React.SetStateAction<'home' | 'profilePage'>>; // Removed 'progress'
  togglePersonalTodoCompletion: (planId: string, todoId: string) => void;
  initiateTaskFromPlan: (taskType: TaskType) => void;
  updateDailyPlan: (planId: string, newTodos: TodoItem[], newPlanDate: Date) => void;
  deleteFeedItem: (feedItemId: string) => Promise<void>;
  
  // Daily Plan Modal specific state and actions
  isDailyPlanModalOpen: boolean;
  editingDailyPlan: DailyPlanFeedItem | null;
  openDailyPlanModal: (planToEdit?: DailyPlanFeedItem | null) => void;
  closeDailyPlanModal: () => void;

  // Book Reading Modal
  isAddBookModalOpen: boolean;
  setIsAddBookModalOpen: React.Dispatch<React.SetStateAction<boolean>>;

  // Post Editing
  postToEdit: FeedItem | null;
  isEditPostModalOpen: boolean;
  openPostForEditing: (post: FeedItem) => void;
  closePostEditor: () => void;
  updateFeedItem: (updatedItem: FeedItem) => Promise<void>;

  // Toast notifications
  toastMessage: string | null;
  showToast: (message: string, duration?: number) => void;

  // Search
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;

  // Likes and Comments
  toggleLikeFeedItem: (feedItemId: string) => void;
  addCommentToFeedItem: (feedItemId: string, commentText: string) => void;
  
  // Achievements
  getUserAchievements: (userId: string) => UserAchievement[];

  // Authentication
  logoutUser: () => void;
}

// Props for LoginView (if needed, or can be managed internally)
export interface LoginViewProps {
  onLoginSuccess: (user: User) => void;
}