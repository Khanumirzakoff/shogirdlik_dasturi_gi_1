


import { TaskType, Achievement } from './types';
import { RunningManIcon } from './components/icons/RunningManIcon'; // Yangi
import { AlarmClockIcon } from './components/icons/AlarmClockIcon'; // Yangi
import { ChecklistIcon } from './components/icons/ChecklistIcon';   // Yangi
import { BookOpenIcon } from './components/icons/BookOpenIcon'; 
import React from 'react';
import { AchievementFirst10kIcon } from './components/icons/AchievementFirst10kIcon';
import { AchievementBookwormIcon } from './components/icons/AchievementBookwormIcon';
import { AchievementConsistencyIcon } from './components/icons/AchievementConsistencyIcon';
import { AchievementMorningKnightIcon } from './components/icons/AchievementMorningKnightIcon';
import { AchievementMarathonerIcon } from './components/icons/AchievementMarathonerIcon';


export const DEFAULT_USER_ID = 'user123';

export const TASK_CATEGORIES: { name: TaskType; icon: React.ElementType }[] = [
  { name: TaskType.RUNNING, icon: RunningManIcon },
  { name: TaskType.WAKE_UP, icon: AlarmClockIcon },
  { name: TaskType.DAILY_PLAN, icon: ChecklistIcon },
  { name: TaskType.BOOK_READING, icon: BookOpenIcon }, 
];

// These task types will be pre-filled as mandatory todos in the Daily Plan
export const MANDATORY_TASK_TYPES_FOR_PLAN: TaskType[] = [
  TaskType.RUNNING,
  TaskType.WAKE_UP,
  TaskType.BOOK_READING,
];


export const TASK_POINTS = {
  [TaskType.RUNNING]: 10, 
  [TaskType.WAKE_UP]: 15, 
  [TaskType.DAILY_PLAN]: 5,  
  [TaskType.BOOK_READING]: 8, 
};

export const TASK_TYPE_COLORS: Record<TaskType, string> = {
  [TaskType.RUNNING]: '#3B82F6', // blue-500
  [TaskType.WAKE_UP]: '#F59E0B', // amber-500
  [TaskType.DAILY_PLAN]: '#10B981', // emerald-500
  [TaskType.BOOK_READING]: '#8B5CF6', // violet-500
};

export const USER_LEVELS = [
  { points: 0, name: "Boshlovchi", level: 1 },
  { points: 100, name: "O'rganuvchi", level: 2 },
  { points: 250, name: "Faol Ishtirokchi", level: 3 },
  { points: 500, name: "Tajribali", level: 4 },
  { points: 1000, name: "Ekspert", level: 5 },
  { points: 2000, name: "Chempion", level: 6 },
  { points: 5000, name: "Afsona", level: 7 },
];


export const UZBEK_STRINGS = {
  home: 'Bosh Sahifa',
  addTask: "Vazifa Qo'shish",
  progress: 'Natijalar', // Changed from 'Progress'
  profile: 'Profil',
  editProfile: 'Profilni Tahrirlash', 
  settings: 'Sozlamalar',
  startRunning: 'Yugurishni Boshlash',
  startWakeUpConfirmation: "Uyg'onishni Tasdiqlash", // Changed
  startBookReading: "Mutolaani Tasdiqlash", // Changed
  addBookReadingTitle: "Mutolaa Qaydnomasi", // Changed
  addReadingEntry: "Mutolaa Qo'shish", // New FAB text for Book Reading
  km: 'KM',
  duration: 'Davomiyligi', 
  time: 'Vaqt', 
  description: 'Tavsif',
  submit: 'Yuborish',
  cancel: 'Bekor Qilish',
  name: 'Ism',
  surname: 'Familiya',
  save: 'Saqlash',
  saving: 'Saqlanmoqda...',
  uploadImage: "Rasm Yuklash",
  taskTitle: "Vazifa Sarlavhasi",
  taskType: "Vazifa Turi",
  taskDescription: "Vazifa Tavsifi",
  dailyPlanPlaceholder: "Bugungi rejalarim...", 
  confirm: "Tasdiqlash",
  pause: "PAUZA", // Changed from TO'XTATISH
  finish: "FINISH", // Changed from YAKUNLASH
  distance: "Masofa",
  speed: "Tezlik",
  elapsedTime: "O'tgan Vaqt",
  stopRecording: "Yozishni To'xtatish",
  startRecording: "Yozishni Boshlash",
  uploading: "Yuklanmoqda...",
  videoPreview: "Video Ko'rish",
  taskSuccessfullyAdded: "Vazifa muvaffaqiyatli kiritildi!", // Changed
  wakeUpPrompt: "Erta turganingizni tasdiqlash uchun yuzingizni videoga oling.",
  wakeUpDescriptionPlaceholder: "Kayfiyatingiz yoki kuningiz haqida qisqacha yozing... (ixtiyoriy)",
  runningPrompt: "GPS yoqilganligiga ishonch hosil qiling.",
  
  paceLabel: "Temp",
  caloriesLabel: "Kaloriya",
  elevationGainLabel: "Balandlik",
  avgHeartRateLabel: "O'rt. Yurak Ur.",
  activityTimeLabel: "Vaqt", 

  paceUnit: "/km",
  caloriesUnit: "kkal",
  elevationGainUnit: "m",
  heartRateUnit: "bpm",

  today: "Bugun",
  yesterday: "Kecha",
  months: ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentyabr", "Oktyabr", "Noyabr", "Dekabr"],

  // User Profile View
  userProfileTitle: "Foydalanuvchi Profili",
  userTasks: "Foydalanuvchi Vazifalari", // Slightly changed
  monthlyActivity: "Oylik Faollik",
  monthlyActivityGraphTitle: "Oylik Faollik (Grafik)",
  noTasksCompleted: "Hozircha bajarilgan vazifalar yo'q.", // Changed
  back: "Ortga",
  tasks: "ta vazifa",
  level: "Daraja",
  pointsToNextLevel: (points: number) => `${points} ball keyingi darajaga`,
  maxLevelReached: "Maksimal darajaga erishgansiz!",
  all: "Barchasi",

  // Progress Tab
  myProgress: "Mening Natijalarim", // Changed
  activityByType: "Turlar Bo'yicha Faollik", // Changed

  // Book Reading Task
  bookTitleLabel: "Asar Sarlavhasi", 
  pagesReadLabel: "O'qilgan Sahifalar",
  reviewLabel: "Sharh/Qaydlar (ixtiyoriy)",
  bookReadingPlaceholder: "Asar nomi...", 
  pagesReadPlaceholder: "Sahifalar soni...",
  reviewPlaceholder: "Qisqacha sharh yozing...",
  selectTaskType: "Vazifa Turini Belgilang", 
  uploadBookImage: "Kitob Muqovasini Yuklash",
  recordAudioSummary: "Audio Xulosa Yozish",
  stopAudioSummary: "Yozishni To'xtatish",
  playAudioSummary: "Xulosani Eshitish",
  deleteAudioSummary: "Audioni o'chirish", // Yangi
  redoAudioSummary: "Qayta yozish",
  audioSummaryPlaybackError: "Audio xulosani o'ynatishda xatolik.",
  audioRecordingNotSupported: "Audio yozish ushbu brauzerda qo'llab-quvvatlanmaydi.",
  audioAccessDenied: "Mikrofonga ruxsat berilmadi.",
  audioRecordingError: "Audio yozishda xatolik.",


  // Offline and Syncing
  offlineModeMessage: "Oflayn rejim. Ma'lumotlar saqlandi va ulanish tiklangach sinxronlanadi.",
  syncingOfflineItem: "Sinxronlanmoqda...",
  itemSyncFailedAttempt: (itemName: string, attempt: number, maxAttempts: number) => `"${itemName}" sinxronlashda xatolik (urinish ${attempt}/${maxAttempts}).`,
  itemSyncFailedPermanently: (itemName: string) => `"${itemName}" serverga yuborishda doimiy xatolik. Ma'lumotlar qurilmangizda saqlangan.`,
  syncFailedIndicatorTitle: "Sinxronlashda xatolik",


  // RunningTracker specific
  avgPaceMinKm: "O'rt. Temp (daq/km)",
  musicTab: "Musiqa",
  mapTab: "Xarita",
  statsTab: "Statistika",
  settingsTab: "Sozlamalar",
  unlockScreen: "Ekran qulfini ochish",
  lockScreenControls: "Ekran boshqaruvini qulflash",
  gpsSearching: "GPS Izlanmoqda...",
  gpsError: "GPS Xato",
  gpsReady: "GPS Tayyor",
  gpsActive: "GPS Faol",
  gpsLabel: "GPS",
  errorPermissionDenied: "Geolokatsiyaga ruxsat berilmadi.",
  errorPositionUnavailable: "Joylashuvni aniqlab bo'lmadi.",
  errorTimeout: "Joylashuvni aniqlash uchun vaqt tugadi.",
  errorBrowserNoGeo: "Brauzer geolokatsiyani qo'llab-quvvatlamaydi.",
  errorPermissionPolicy: "Geolokatsiyaga ruxsat siyosat bilan bloklangan. Brauzer/qurilma sozlamalarini tekshiring.",
  gpsAccuracyLow: "GPS aniqligi past:", 
  resume: "DAVOM ETTIRISH", 
  start: "BOSHLASH",  
  recenterMap: "Markazga qaytarish",
  confirmExitRunningTitle: "Yugurishni To'xtatish?",
  confirmExitRunningMessage: "Yugurish natijalarini saqlashni yoki o'chirib yuborishni xohlaysizmi?",
  saveRunAndExit: "Saqlash va Chiqish",
  discardRunAndExit: "O'chirish va Chiqish",
  dialogCancel: "Ortga", // "Cancel" for dialogs, distinct from general "Bekor Qilish"


  // Daily Plan Todo Specific
  dailyPlanTitle: "Kunlik Reja",
  editDailyPlanTitle: "Rejani Tahrirlash", // Added
  addNewPlan: "Yangi Reja Kiritish", 
  planForDate: (date: string) => `${date} uchun reja`,
  todaysPlan: "Bugungi Reja",
  tomorrowsPlan: "Ertangi Reja",
  mandatoryTasks: "Majburiy Vazifalar",
  personalTasks: "Shaxsiy Vazifalar",
  addTodoPlaceholder: "Yangi vazifa matni...",
  addTodoButton: "Qo'shish",
  addPersonalTask: "Shaxsiy vazifa qo'shish", // New
  saveAndShare: "Saqlash va Yuborish", 
  updatePlan: "Rejani Yangilash", // Added for edit mode
  dailyPlanSubmissionError: "Reja matnini kiriting.",
  dailyPlanTimeError: (time: string) => `Bugungi reja uchun vaqt o'tib ketdi (${time} gacha edi). Ertangi kun uchun reja tuzishingiz mumkin.`,
  noTodosYet: "Hozircha topshiriqlar kiritilmagan. Qo'shing!", 
  confirmTaskExecutionPrompt: "Mazkur vazifani bajarishni istaysizmi?", 
  yes: "Ha",
  no: "Yo'q",
  personalTaskCompleted: "Shaxsiy vazifa bajarildi!",
  initiatingTask: "Vazifa boshlanmoqda...", 
  markAsCompleted: "Bajarildi deb belgilash",
  confirmMarkAsCompleted: "Ushbu shaxsiy vazifani bajarilgan deb belgilaysizmi?",
  dailyPlanExistsError: (date: string) => `${date} uchun kunlik reja allaqachon mavjud. Bir kunda faqat bitta reja topshirishingiz mumkin.`,
  wakeUpExistsError: (date: string) => `${date} uchun uyg'onish tasdiqnomasi allaqachon mavjud.`,

  // FeedCard specific
  deletePost: "O'chirish",
  editPost: "Tahrirlash",
  confirmDeletePostTitle: "Xabarni O'chirish",
  confirmDeletePostMessage: "Haqiqatan ham bu xabarni o'chirmoqchimisiz? Bu amalni orqaga qaytarib bo'lmaydi.",
  yesDelete: "Ha, O'chirish",
  firstLikePrompt: "Birinchi yoqtirish sizdan bo'lsin!",
  like: "Yoqdi",
  likes: "ta yoqtirish",
  comment: "Izoh",
  comments: "Izohlar",
  addCommentPlaceholder: "Izohingizni yozing...",
  sendComment: "Yuborish",
  noCommentsYet: "Hali izohlar yo'q. Birinchi bo'lib yozing!",
  showComments: "Izohlarni ko'rsatish",
  hideComments: "Izohlarni yashirish",
  sendingComment: "Yuborilmoqda...",
  showMore: "Ko'proq ko'rsatish",
  showLess: "Kamroq ko'rsatish",
  editPostTitle: "Xabarni Tahrirlash",
  editPostDescriptionLabel: "Tavsif",
  saveChanges: "Saqlash",
  updateSuccess: "Muvaffaqiyatli yangilandi",

  // Search
  searchPlaceholder: "Qidirish...",

  // Achievements
  achievements: 'Yutuqlar',
  noAchievements: "Hozircha yutuqlar yo'q. Faol bo'ling!",
  unlockedOn: 'Qulfdan ochildi:',

  // Authentication
  loginTitle: "Tizimga Kirish",
  logoutButton: "Chiqish",
  selectUserPrompt: "Foydalanuvchini tanlang:",
  loggingIn: "Kirilmoqda...",
  confirmLogoutTitle: "Chiqishni Tasdiqlash",
  confirmLogoutMessage: "Haqiqatan ham tizimdan chiqmoqchimisiz?",
  yesLogout: "Ha, Chiqish",
  noCancel: "Yo'q, Bekor Qilish",
  email: "Email",
  password: "Parol",
  loginButton: "Kirish",
  loginWithGoogle: "Google bilan kirish",
  forgotPassword: "Parolni unutdingizmi?",
  noAccount: "Akkauntingiz yo'qmi?",
  signUp: "Ro'yxatdan o'tish",
  featureNotAvailable: "Bu funksiya hozircha mavjud emas.",
  or: "yoki",
  welcomeBack: "Xush kelibsiz!",
  loginError: "Email yoki parol xato. (Demo)",
  userNotFound: "Kirish uchun foydalanuvchi topilmadi.",
  signUpTitle: "Ro'yxatdan O'tish",
  haveAccount: "Akkauntingiz bormi?",
  loginLink: "Kirish",
};

export const ALL_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'FIRST_10K',
    name: "Birinchi 10 km",
    description: "Birinchi marta 10 km yoki undan ko'p masofani bosib o'tish.",
    icon: AchievementFirst10kIcon,
    taskType: TaskType.RUNNING,
  },
  {
    id: 'BOOKWORM_5',
    name: "Kitobxon",
    description: "5 ta yoki undan ko'p kitob mutolaasi haqida qayd kiritish.",
    icon: AchievementBookwormIcon,
    taskType: TaskType.BOOK_READING,
  },
  {
    id: 'CONSISTENCY_7D',
    name: "Barqarorlik",
    description: "7 kun ketma-ket (har kuni) vazifa bajarish.",
    icon: AchievementConsistencyIcon,
    // No specific task type for this
  },
  {
    id: 'MORNING_KNIGHT_20',
    name: "Tong Ritsari",
    description: "Bir kalendar oyida 20 marta yoki undan ko'p erta uyg'onishni tasdiqlash.",
    icon: AchievementMorningKnightIcon,
    taskType: TaskType.WAKE_UP,
  },
  {
    id: 'MARATHONER_100K',
    name: "Marafonech",
    description: "Bir kalendar oyida jami 100 km yoki undan ko'p masofaga yugurish.",
    icon: AchievementMarathonerIcon,
    taskType: TaskType.RUNNING,
  },
];


export const INITIAL_FEED_ITEMS_COUNT = 5;
export const MIN_SPEED_GREEN = 5; // km/h
export const MAX_SPEED_GREEN = 20; // km/h
export const AUTO_FINISH_SPEED_THRESHOLD = 3; // km/h
export const AUTO_FINISH_DURATION = 10 * 60 * 1000; // 10 minutes in milliseconds
export const RECENTER_DISTANCE_THRESHOLD_METERS = 75; // Meters

// IndexedDB
export const DB_NAME = 'VazifaTrekeriDB';
export const DB_VERSION = 1; // Keep version 1, new fields in FeedItem are additive
export const STORE_CURRENT_USER = 'currentUser';
export const STORE_ALL_USERS = 'allUsers';
export const STORE_FEED_ITEMS = 'feedItems';
export const STORE_SYNC_QUEUE = 'syncQueue';
export const CURRENT_USER_KEY = 'currentUserData';

export const DAILY_PLAN_SUBMISSION_HOUR_LIMIT = 8; // Submit by 8 AM

// Leaflet Map Defaults
export const DEFAULT_MAP_CENTER: [number, number] = [41.2995, 69.2401]; // Tashkent
export const DEFAULT_MAP_ZOOM = 13;

// Sync Constants
export const MAX_SYNC_RETRIES = 3;
export const SYNC_RETRY_DELAY_MS = 500; // Delay between processing items in the queue