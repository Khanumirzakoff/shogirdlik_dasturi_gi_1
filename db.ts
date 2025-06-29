
import { DBSchema, IDBPDatabase, openDB } from 'idb';
import { User, FeedItem, SyncQueueItem, TaskType, RunningFeedItem, WakeUpFeedItem, DailyPlanFeedItem, BookReadingFeedItem } from '../types';
import { DB_NAME, DB_VERSION, STORE_CURRENT_USER, STORE_ALL_USERS, STORE_FEED_ITEMS, STORE_SYNC_QUEUE, CURRENT_USER_KEY } from '../constants';
import { ensureDateObjectsInFeedItem } from '../utils'; 

interface AppDB extends DBSchema {
  [STORE_CURRENT_USER]: {
    key: string;
    value: User;
  };
  [STORE_ALL_USERS]: {
    key: string;
    value: User;
    indexes: { 'id': string };
  };
  [STORE_FEED_ITEMS]: {
    key: string;
    value: FeedItem;
    indexes: { 'timestamp': number, 'userId': string };
  };
  [STORE_SYNC_QUEUE]: {
    key: string;
    value: SyncQueueItem;
    indexes: { 'timestamp': number };
  };
}

let dbPromise: Promise<IDBPDatabase<AppDB>> | null = null;

const initDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<AppDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion, transaction) {
        console.log(`Upgrading DB from version ${oldVersion} to ${newVersion}`);
        if (oldVersion < 1) {
          if (!db.objectStoreNames.contains(STORE_CURRENT_USER)) {
            db.createObjectStore(STORE_CURRENT_USER);
            // console.log(`Object store ${STORE_CURRENT_USER} created.`);
          }
          if (!db.objectStoreNames.contains(STORE_ALL_USERS)) {
            const userStore = db.createObjectStore(STORE_ALL_USERS, { keyPath: 'id' });
            userStore.createIndex('id', 'id', { unique: true });
            // console.log(`Object store ${STORE_ALL_USERS} with index 'id' created.`);
          }
          if (!db.objectStoreNames.contains(STORE_FEED_ITEMS)) {
            const feedStore = db.createObjectStore(STORE_FEED_ITEMS, { keyPath: 'id' });
            feedStore.createIndex('timestamp', 'timestamp'); 
            feedStore.createIndex('userId', 'userId');
            // console.log(`Object store ${STORE_FEED_ITEMS} with indexes 'timestamp', 'userId' created.`);
          }
          if (!db.objectStoreNames.contains(STORE_SYNC_QUEUE)) {
            const syncStore = db.createObjectStore(STORE_SYNC_QUEUE, { keyPath: 'id' });
            syncStore.createIndex('timestamp', 'timestamp');
            // console.log(`Object store ${STORE_SYNC_QUEUE} with index 'timestamp' created.`);
          }
        }
        // console.log("DB upgrade complete.");
      },
    });
  }
  return dbPromise;
};

// Current User operations
export const getCurrentUserDB = async (): Promise<User | undefined> => {
  try {
    const db = await initDB();
    return await db.get(STORE_CURRENT_USER, CURRENT_USER_KEY);
  } catch (error) {
    console.error("Error getting current user from DB:", error);
    return undefined;
  }
};

export const setCurrentUserDB = async (user: User): Promise<void> => {
  try {
    const db = await initDB();
    await db.put(STORE_CURRENT_USER, user, CURRENT_USER_KEY);
  } catch (error) {
    console.error("Error setting current user in DB:", error);
  }
};

export const clearCurrentUserDB = async (): Promise<void> => {
  try {
    const db = await initDB();
    await db.delete(STORE_CURRENT_USER, CURRENT_USER_KEY);
  } catch (error) {
    console.error("Error clearing current user from DB:", error);
  }
};

// All Users operations
export const getAllUsersDB = async (): Promise<User[]> => {
  try {
    const db = await initDB();
    return await db.getAll(STORE_ALL_USERS);
  } catch (error) {
    console.error("Error getting all users from DB:", error);
    return [];
  }
};

export const setAllUsersDB = async (users: User[]): Promise<void> => {
  try {
    const db = await initDB();
    const tx = db.transaction(STORE_ALL_USERS, 'readwrite');
    await tx.store.clear();
    await Promise.all(users.map(user => tx.store.put(user)));
    await tx.done;
  } catch (error) {
    console.error("Error setting all users in DB:", error);
  }
};

export const updateUserInAllUsersDB = async (user: User): Promise<void> => {
  try {
    const db = await initDB();
    await db.put(STORE_ALL_USERS, user);
  } catch (error) {
    console.error("Error updating user in all users DB:", error);
  }
};


// Feed Items operations
export const getAllFeedItemsDB = async (): Promise<FeedItem[]> => {
  try {
    const db = await initDB();
    const items = await db.getAll(STORE_FEED_ITEMS);
    return items.map(ensureDateObjectsInFeedItem).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  } catch (error) {
    console.error("Error getting all feed items from DB:", error);
    return [];
  }
};

export const setFeedItemsDB = async (feedItems: FeedItem[]): Promise<void> => {
  try {
    const db = await initDB();
    const tx = db.transaction(STORE_FEED_ITEMS, 'readwrite');
    await tx.store.clear();
    await Promise.all(feedItems.map(item => tx.store.put(item)));
    await tx.done;
  } catch (error) {
    console.error("Error setting feed items in DB:", error);
  }
};

export const addFeedItemDB = async (feedItem: FeedItem): Promise<void> => {
  try {
    const db = await initDB();
    await db.put(STORE_FEED_ITEMS, feedItem);
  } catch (error) {
    console.error("Error adding feed item to DB:", error);
  }
};

export const getFeedItemDB = async (id: string): Promise<FeedItem | undefined> => {
  try {
    const db = await initDB();
    const item = await db.get(STORE_FEED_ITEMS, id);
    if (item) {
      return ensureDateObjectsInFeedItem(item);
    }
    return undefined;
  } catch (error) {
    console.error(`Error getting feed item with id ${id} from DB:`, error);
    return undefined;
  }
};

export const deleteFeedItemDB = async (id: string): Promise<void> => {
  try {
    const db = await initDB();
    await db.delete(STORE_FEED_ITEMS, id);
  } catch (error) {
    console.error(`Error deleting feed item with id ${id} from DB:`, error);
  }
};


// Sync Queue operations
export const getSyncQueueDB = async (): Promise<SyncQueueItem[]> => {
  try {
    const db = await initDB();
    return await db.getAllFromIndex(STORE_SYNC_QUEUE, 'timestamp');
  } catch (error) {
    console.error("Error getting sync queue from DB:", error);
    return [];
  }
};

export const addSyncQueueItemDB = async (item: SyncQueueItem): Promise<void> => {
  try {
    const db = await initDB();
    await db.put(STORE_SYNC_QUEUE, item);
  } catch (error) {
    console.error("Error adding item to sync queue DB:", error);
  }
};

export const deleteSyncQueueItemDB = async (id: string): Promise<void> => {
  try {
    const db = await initDB();
    await db.delete(STORE_SYNC_QUEUE, id);
  } catch (error) {
    console.error(`Error deleting item with id ${id} from sync queue DB:`, error);
  }
};

export const clearSyncQueueDB = async (): Promise<void> => {
  try {
    const db = await initDB();
    await db.clear(STORE_SYNC_QUEUE);
  } catch (error) {
    console.error("Error clearing sync queue DB:", error);
  }
};

// Initialize DB on module load
initDB().then(() => {
  // console.log("VazifaTrekeriDB initialized");
}).catch(err => {
  console.error("Error initializing VazifaTrekeriDB:", err);
});