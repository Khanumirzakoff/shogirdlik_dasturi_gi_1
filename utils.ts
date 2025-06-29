

import { FeedItem, RunningFeedItem, DailyPlanFeedItem, TaskType, CreatableFeedItem, CreatableRunningFeedItem, CreatableDailyPlanFeedItem, CreatableBookReadingFeedItem, UserComment, UserAchievement } from './types';
import { TASK_POINTS, USER_LEVELS } from './constants';


/**
 * Ensures that timestamp, eventTimestamp (for RunningFeedItem), planDate (for DailyPlanFeedItem),
 * and comment timestamps are Date objects.
 * @param item The FeedItem to process.
 * @returns A new FeedItem object with timestamps converted to Date objects.
 */
export const ensureDateObjectsInFeedItem = (item: FeedItem): FeedItem => {
  const newItem = { ...item };

  if (newItem.timestamp && !(newItem.timestamp instanceof Date)) {
    newItem.timestamp = new Date(newItem.timestamp);
  }

  if (newItem.type === TaskType.RUNNING) {
    const runningItem = newItem as RunningFeedItem;
    if (runningItem.eventTimestamp && !(runningItem.eventTimestamp instanceof Date)) {
      runningItem.eventTimestamp = new Date(runningItem.eventTimestamp);
    }
  }

  if (newItem.type === TaskType.DAILY_PLAN) {
    const dailyPlanItem = newItem as DailyPlanFeedItem;
    if (dailyPlanItem.planDate && !(dailyPlanItem.planDate instanceof Date)) {
      dailyPlanItem.planDate = new Date(dailyPlanItem.planDate);
    }
  }

  if (newItem.comments && Array.isArray(newItem.comments)) {
    newItem.comments = newItem.comments.map((comment: UserComment) => ({
        ...comment,
        timestamp: comment.timestamp instanceof Date ? comment.timestamp : new Date(comment.timestamp),
    }));
  } else {
    newItem.comments = []; // Ensure comments is always an array
  }

  if (!newItem.likedBy) {
    newItem.likedBy = []; // Ensure likedBy is always an array
  }

  return newItem;
};


/**
 * Calculates points for a given feed item based on its type and specific metrics.
 * @param itemData The creatable feed item data.
 * @returns The calculated points for the item.
 */
export const calculatePoints = (itemData: CreatableFeedItem): number => {
  switch (itemData.type) {
      case TaskType.RUNNING:
          return TASK_POINTS[TaskType.RUNNING] + Math.round((itemData as CreatableRunningFeedItem).distance || 0);
      case TaskType.WAKE_UP:
          return TASK_POINTS[TaskType.WAKE_UP];
      case TaskType.DAILY_PLAN:
          return (itemData as CreatableDailyPlanFeedItem).pointsAwarded || TASK_POINTS[TaskType.DAILY_PLAN];
      case TaskType.BOOK_READING:
          return TASK_POINTS[TaskType.BOOK_READING] + Math.floor(((itemData as CreatableBookReadingFeedItem).pagesRead || 0) / 10);
      default:
          // This case should ideally not be reached if all types are handled.
          // Adding a log for safety during development if new types are added without updating this function.
          const exhaustiveCheck: never = itemData;
          console.warn("Unhandled task type in calculatePoints, returning 0 points. Item: ", exhaustiveCheck);
          return 0;
  }
};

/**
 * Determines the user's level based on their total points.
 * @param totalPoints The user's total accumulated points.
 * @returns An object containing the current level, name, progress percentage to the next level,
 *          points needed for the next level, and the minimum points for the current level.
 */
export const getUserLevel = (totalPoints: number): {
  level: number,
  name: string,
  progress: number,
  nextLevelPoints: number | null,
  currentLevelMinPoints: number
} => {
  let currentLevel = USER_LEVELS[0].level;
  let currentLevelName = USER_LEVELS[0].name;
  let currentLevelMinPoints = USER_LEVELS[0].points;
  let nextLevelPoints: number | null = null;
  let progress = 0;

  for (let i = 0; i < USER_LEVELS.length; i++) {
    if (totalPoints >= USER_LEVELS[i].points) {
      currentLevel = USER_LEVELS[i].level;
      currentLevelName = USER_LEVELS[i].name;
      currentLevelMinPoints = USER_LEVELS[i].points;
      if (i < USER_LEVELS.length - 1) {
        nextLevelPoints = USER_LEVELS[i + 1].points;
      } else {
        nextLevelPoints = null; // Max level
      }
    } else {
      break;
    }
  }

  if (nextLevelPoints !== null) {
    const pointsInCurrentLevel = nextLevelPoints - currentLevelMinPoints;
    const pointsEarnedInLevel = totalPoints - currentLevelMinPoints;
    progress = pointsInCurrentLevel > 0 ? (pointsEarnedInLevel / pointsInCurrentLevel) * 100 : 100;
  } else {
    progress = 100; // Max level reached
  }

  return {
    level: currentLevel,
    name: currentLevelName,
    progress: Math.max(0, Math.min(progress, 100)), // Ensure progress is between 0 and 100
    nextLevelPoints,
    currentLevelMinPoints,
  };
};

/**
 * Analyzes a user's feed items to determine which achievements they have unlocked.
 * @param userId The ID of the user to check.
 * @param feedItems The list of all feed items.
 * @returns An array of UserAchievement objects for the given user.
 */
export const calculateUserAchievements = (userId: string, feedItems: FeedItem[]): UserAchievement[] => {
  const userItems = feedItems.filter(item => item.userId === userId)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  if (userItems.length === 0) return [];

  const unlockedAchievements: UserAchievement[] = [];

  // --- Achievement 1: First 10k Run ---
  const first10kRun = userItems.find(item => item.type === TaskType.RUNNING && (item as RunningFeedItem).distance >= 10) as RunningFeedItem | undefined;
  if (first10kRun) {
    unlockedAchievements.push({ achievementId: 'FIRST_10K', unlockedAt: new Date(first10kRun.timestamp) });
  }

  // --- Achievement 2: Bookworm (5 books) ---
  const bookItems = userItems.filter(item => item.type === TaskType.BOOK_READING);
  if (bookItems.length >= 5) {
    // Unlocked on the date of the 5th book reading entry
    unlockedAchievements.push({ achievementId: 'BOOKWORM_5', unlockedAt: new Date(bookItems[4].timestamp) });
  }

  // --- Achievement 3: Consistency (7 consecutive days) ---
  const taskDates = [...new Set(userItems.map(item => new Date(item.timestamp).toDateString()))]
    .map(dateStr => new Date(dateStr).getTime())
    .sort((a, b) => a - b);
  
  if (taskDates.length >= 7) {
    const oneDay = 24 * 60 * 60 * 1000;
    for (let i = 0; i <= taskDates.length - 7; i++) {
      let isConsecutive = true;
      for (let j = 0; j < 6; j++) {
        const diff = taskDates[i + j + 1] - taskDates[i + j];
        // Check if the difference is exactly one day (with a small tolerance for DST changes etc.)
        if (diff > oneDay + (2 * 60 * 60 * 1000) || diff < oneDay - (2 * 60 * 60 * 1000)) {
          isConsecutive = false;
          break;
        }
      }
      if (isConsecutive) {
        unlockedAchievements.push({ achievementId: 'CONSISTENCY_7D', unlockedAt: new Date(taskDates[i + 6]) });
        break; // Award only once
      }
    }
  }

  // --- Group items by month for monthly achievements ---
  const itemsByMonth: Record<string, FeedItem[]> = {};
  userItems.forEach(item => {
    const monthYear = `${new Date(item.timestamp).getFullYear()}-${new Date(item.timestamp).getMonth()}`;
    if (!itemsByMonth[monthYear]) {
      itemsByMonth[monthYear] = [];
    }
    itemsByMonth[monthYear].push(item);
  });
  
  // --- Achievement 4: Morning Knight (20 wake-ups in a month) ---
  for (const month in itemsByMonth) {
    const monthlyWakeUps = itemsByMonth[month].filter(item => item.type === TaskType.WAKE_UP);
    if (monthlyWakeUps.length >= 20) {
      unlockedAchievements.push({ achievementId: 'MORNING_KNIGHT_20', unlockedAt: new Date(monthlyWakeUps[19].timestamp) }); // 20th item
      break; 
    }
  }

  // --- Achievement 5: Marathoner (100km in a month) ---
  for (const month in itemsByMonth) {
    const runningItemsInMonth = itemsByMonth[month]
      .filter(item => item.type === TaskType.RUNNING)
      .sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()) as RunningFeedItem[];

    const totalDistance = runningItemsInMonth.reduce((sum, item) => sum + item.distance, 0);

    if (totalDistance >= 100) {
      let distanceAccumulator = 0;
      for (const run of runningItemsInMonth) {
        distanceAccumulator += run.distance;
        if (distanceAccumulator >= 100) {
          unlockedAchievements.push({ achievementId: 'MARATHONER_100K', unlockedAt: new Date(run.timestamp) });
          break; 
        }
      }
      break; 
    }
  }

  // Return unique achievements by ID
  const uniqueAchievements = Array.from(new Map(unlockedAchievements.map(item => [item.achievementId, item])).values());
  return uniqueAchievements;
};