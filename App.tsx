


import React, { useState, useContext, useEffect } from 'react';
import { AppContext }  from './contexts/AppContext';
import FeedArea from './components/FeedArea';
import TaskFilterButtons from './components/TaskFilterButtons';
import AddTaskModal from './components/AddTaskModal'; // This is the DailyPlan modal
import ProfileModal from './components/ProfileModal';
import AddBookReadingModal from './components/AddBookReadingModal';
import EditPostModal from './components/EditPostModal';
import RunningTracker from './components/RunningTracker';
import WakeUpRecorder from './components/WakeUpRecorder';
import Leaderboard from './components/Leaderboard';
import UserProfileView from './components/UserProfileView';
import LoginView from './components/LoginView'; // Import LoginView
import { TaskType } from './types';
import { UZBEK_STRINGS } from './constants';
import { WifiOffIcon } from './components/icons/WifiOffIcon';
import FloatingActionButton from './components/FloatingActionButton'; 
import Sidebar from './components/Sidebar';
import { MenuIcon } from './components/icons/MenuIcon';

const App: React.FC = () => {
  const context = useContext(AppContext);

  // Fallback for context loading
  if (!context) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <svg className="animate-spin h-10 w-10 text-black mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-lg text-gray-700">Context yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  const {
    currentUser,
    isLoading,
    currentView,
    setCurrentView,
    selectedTaskFilter,
    setSelectedTaskFilter,
    activeRunningTask,
    setActiveRunningTask,
    activeWakeUpTask,
    setActiveWakeUpTask,
    viewingUserProfileId,
    setViewingUserProfileId,
    isDailyPlanModalOpen,
    editingDailyPlan,
    openDailyPlanModal,
    closeDailyPlanModal,
    isOnline,
    toastMessage,
    logoutUser,
    isAddBookModalOpen,
    setIsAddBookModalOpen,
    isEditPostModalOpen,
    closePostEditor,
    postToEdit
  } = context;

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleOpenAddTaskModal = () => {
    if (selectedTaskFilter === TaskType.RUNNING) {
      setActiveRunningTask(true);
      setCurrentView('home'); // Ensure view is home for FAB context
    } else if (selectedTaskFilter === TaskType.WAKE_UP) {
      setActiveWakeUpTask(true);
      setCurrentView('home'); // Ensure view is home
    } else if (selectedTaskFilter === TaskType.BOOK_READING) {
      setIsAddBookModalOpen(true);
    } else if (selectedTaskFilter === TaskType.DAILY_PLAN || selectedTaskFilter === null) { 
      openDailyPlanModal();
    } else {
      openDailyPlanModal(); 
    }
  };

  const requestLogout = () => {
    // This function is now initiated from the Sidebar, but the confirmation modal logic remains here.
    setIsSidebarOpen(false); // Close sidebar before showing confirmation
    setTimeout(() => setShowLogoutConfirm(true), 150);
  };

  const confirmLogout = () => {
    if (logoutUser) {
      logoutUser();
      setIsProfileModalOpen(false); 
      setShowLogoutConfirm(false);
    }
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  const LoadingPage: React.FC = () => (
    <div className="flex items-center justify-center h-full"> {/* Changed to h-full to fit parent */}
      <div className="text-center">
        <svg className="animate-spin h-10 w-10 text-black mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-lg text-gray-700">Yuklanmoqda...</p>
      </div>
    </div>
  );

  const getPageContent = () => {
    if (isLoading) return <LoadingPage />;
    if (!currentUser) return <LoginView />; // LoginView is already full-page
    if (activeRunningTask) return <RunningTracker onClose={() => {
      setActiveRunningTask(false);
      if (selectedTaskFilter === TaskType.RUNNING) setSelectedTaskFilter(null);
      setCurrentView('home');
    }} />; // Full-page
    if (activeWakeUpTask) return <WakeUpRecorder onClose={() => {
      setActiveWakeUpTask(false);
      if (selectedTaskFilter === TaskType.WAKE_UP) setSelectedTaskFilter(null);
      setCurrentView('home');
    }} />; // Full-page

    // Viewing another user's profile OR current user's profile via 'profilePage' view
    if (viewingUserProfileId && currentView === 'profilePage') {
      return (
        <UserProfileView
          userId={viewingUserProfileId}
          onClose={() => {
              setViewingUserProfileId(null);
              setCurrentView('home'); // Always return to home after closing any profile view
          }}
        />
      );
    }

    // Standard page (home)
    return (
      <div className="flex flex-col flex-grow overflow-hidden"> {/* Wrapper for standard page content */}
        <header className="sticky top-0 bg-white/90 backdrop-blur-md z-20 shadow-sm rounded-none">
            <div className="px-4 py-2.5 flex items-center justify-between border-b border-gray-200 relative">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 text-gray-600 hover:text-black rounded-full hover:bg-gray-100 transition-colors -ml-2"
                aria-label="Menyuni ochish"
              >
                <MenuIcon className="w-6 h-6" />
              </button>
              <h1 className="text-lg font-bold text-black tracking-wide absolute left-1/2 -translate-x-1/2">SHOGIRDLIK DASTURI</h1>
              <div className="w-10 h-10"></div> {/* Placeholder for alignment */}
            </div>
            {currentView === 'home' && <TaskFilterButtons />}
        </header>
        <div className="flex flex-grow overflow-hidden"> {/* Main content area for FeedArea/Leaderboard */}
          {currentView === 'home' && <FeedArea />}
          {currentView === 'home' && (
            <div className="w-44 md:w-52 lg:w-56 flex-shrink-0"> 
              <Leaderboard />
            </div>
          )}
        </div>
      </div>
    );
  };
  
  const shouldShowFAB = !isLoading && currentUser && currentView === 'home' &&
                        selectedTaskFilter !== null &&
                        !activeRunningTask &&
                        !activeWakeUpTask &&
                        !viewingUserProfileId &&
                        !isDailyPlanModalOpen &&
                        !isProfileModalOpen &&
                        !isAddBookModalOpen &&
                        !isEditPostModalOpen;

  return (
    <div className="h-screen flex flex-col max-w-6xl mx-auto bg-white shadow-2xl rounded-none">
       {currentUser && <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} onLogoutRequest={requestLogout}/>}

      {getPageContent()}

      {shouldShowFAB && (
        <FloatingActionButton
          onClick={handleOpenAddTaskModal}
          selectedTaskFilter={selectedTaskFilter}
        />
      )}

      {isDailyPlanModalOpen && (
        <AddTaskModal
          onClose={closeDailyPlanModal}
          planToEdit={editingDailyPlan}
        />
      )}
      {isProfileModalOpen && <ProfileModal onClose={() => setIsProfileModalOpen(false)} />}
      {isAddBookModalOpen && <AddBookReadingModal onClose={() => {
        setIsAddBookModalOpen(false);
        // If it was open for editing, clear the postToEdit state
        if (postToEdit) {
            closePostEditor();
        }
      }} />}
      
      {isEditPostModalOpen && <EditPostModal />}

      {toastMessage && (
        <div
            className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-black text-white px-6 py-3 rounded-sm shadow-lg z-[100] text-sm animate-fadeInOut"
            role="alert"
            aria-live="assertive"
        >
          {toastMessage}
        </div>
      )}

      {!isOnline && (
        <div
            className="fixed top-0 left-0 right-0 bg-amber-500 text-black px-4 py-2 text-xs font-semibold text-center z-[200] flex items-center justify-center space-x-2 shadow-lg"
            role="status"
        >
            <WifiOffIcon className="w-4 h-4"/>
            <span>{UZBEK_STRINGS.offlineModeMessage}</span>
        </div>
      )}

      {showLogoutConfirm && (
        <div 
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-[101] p-4"
          role="dialog" 
          aria-modal="true" 
          aria-labelledby="logoutConfirmDialogTitle"
          onClick={cancelLogout} 
        > 
          <div 
            className="bg-white p-5 md:p-6 rounded-none shadow-xl max-w-xs w-full border border-gray-300"
            onClick={(e) => e.stopPropagation()} 
          >
            <h4 id="logoutConfirmDialogTitle" className="text-lg font-semibold text-gray-900 mb-2">
              {UZBEK_STRINGS.confirmLogoutTitle}
            </h4>
            <p className="text-sm text-gray-600 mb-5">
              {UZBEK_STRINGS.confirmLogoutMessage}
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelLogout}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-sm transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1"
              >
                {UZBEK_STRINGS.noCancel}
              </button>
              <button
                onClick={confirmLogout}
                className="px-4 py-2 text-sm font-medium text-white bg-rose-500 hover:bg-rose-600 rounded-sm transition-colors focus:outline-none focus:ring-2 focus:ring-rose-400 focus:ring-offset-1"
                autoFocus
              >
                {UZBEK_STRINGS.yesLogout}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;