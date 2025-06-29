

import React, { useState, useContext, useEffect, useCallback, useMemo } from 'react';
import { AppContext } from '../contexts/AppContext';
import { TaskType, CreatableDailyPlanFeedItem, TodoItem, DailyPlanFeedItem } from '../types';
import { UZBEK_STRINGS, TASK_POINTS, MANDATORY_TASK_TYPES_FOR_PLAN, DAILY_PLAN_SUBMISSION_HOUR_LIMIT, TASK_CATEGORIES } from '../constants';
import { XIcon } from './icons/XIcon';
import { PlusIcon } from './icons/PlusIcon'; 
import { TrashIcon } from './icons/TrashIcon'; 

interface AddTaskModalProps {
  onClose: () => void;
  planToEdit?: DailyPlanFeedItem | null; 
}

const getLocalDateString = (date: Date): string => {
  return date.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long' });
};

const AddTaskModal: React.FC<AddTaskModalProps> = ({ onClose, planToEdit }) => {
  const context = useContext(AppContext);
  
  const [targetDate, setTargetDate] = useState(() => {
    return planToEdit ? new Date(planToEdit.planDate) : new Date();
  });

  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [newTodoText, setNewTodoText] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const isEditing = !!planToEdit;

  const isPlanForToday = useMemo(() => {
    const today = new Date();
    return targetDate.getFullYear() === today.getFullYear() &&
           targetDate.getMonth() === today.getMonth() &&
           targetDate.getDate() === today.getDate();
  }, [targetDate]);

  const canSubmitForToday = useMemo(() => {
    if (isEditing && planToEdit && new Date(planToEdit.planDate).toDateString() === new Date().toDateString()) {
        // If editing today's plan, submission is always allowed (for edits)
        return true;
    }
    if (!isPlanForToday) return true; // Can always submit for tomorrow or other future/past dates (if allowed by other logic)
    // For new plans for today, check the time limit
    return new Date().getHours() < DAILY_PLAN_SUBMISSION_HOUR_LIMIT;
  }, [isPlanForToday, isEditing, planToEdit]);

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  const initializeTodos = useCallback(() => {
    if (isEditing && planToEdit) {
      setTodos(planToEdit.todos.map(todo => ({...todo}))); // Deep copy todos for editing
    } else {
      // Create new list of mandatory todos
      const mandatoryDefaultTodos = MANDATORY_TASK_TYPES_FOR_PLAN.map((taskType, index) => {
        const category = TASK_CATEGORIES.find(cat => cat.name === taskType);
        return {
          id: `mandatory-${taskType}-${Date.now()}-${index}`, // Unique ID for new todos
          text: category ? category.name : taskType,
          isCompleted: false,
          isMandatory: true,
          taskType: taskType,
        };
      });
      setTodos(mandatoryDefaultTodos);
    }
  }, [isEditing, planToEdit]);

  useEffect(() => {
    initializeTodos();
    if (planToEdit) {
      setTargetDate(new Date(planToEdit.planDate));
    }
  }, [initializeTodos, planToEdit]);


  if (!context) return null;
  const { addFeedItem, updateDailyPlan, currentUser, showToast } = context;

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const handleAddCustomTodo = () => {
    if (!newTodoText.trim()) return;
    setTodos(prevTodos => [
      ...prevTodos,
      {
        id: `custom-${Date.now()}-${Math.random().toString(16).slice(2)}`, 
        text: newTodoText.trim(),
        isCompleted: false,
        isMandatory: false,
      }
    ]);
    setNewTodoText('');
  };

  const handleToggleTodo = (id: string) => {
    setTodos(prevTodos =>
      prevTodos.map(todo =>
        todo.id === id && !todo.isMandatory ? { ...todo, isCompleted: !todo.isCompleted } : todo
      )
    );
  };

  const handleDeleteCustomTodo = (id: string) => {
    setTodos(prevTodos => prevTodos.filter(todo => todo.id !== id)); 
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null); // Clear previous error

    if (!currentUser) {
      setErrorMessage("Foydalanuvchi topilmadi. Iltimos, qayta kiring.");
      return;
    }

    // Check submission time limit for new plans for today
    if (!isEditing && isPlanForToday && !canSubmitForToday) {
      setErrorMessage(UZBEK_STRINGS.dailyPlanTimeError(`${DAILY_PLAN_SUBMISSION_HOUR_LIMIT}:00`));
      return;
    }
    
    setIsSubmitting(true);

    let submissionErrorOccurred = false;

    if (isEditing && planToEdit && updateDailyPlan) {
      updateDailyPlan(planToEdit.id, todos, targetDate);
      showToast("Reja muvaffaqiyatli yangilandi!", 2000);
    } else {
      const newItemData: CreatableDailyPlanFeedItem = {
        type: TaskType.DAILY_PLAN,
        todos: todos, 
        planDate: targetDate,
        pointsAwarded: TASK_POINTS[TaskType.DAILY_PLAN], // Base points, could be recalculated
      };
      // addFeedItem now uses showToast internally for "existsError"
      addFeedItem(newItemData, { 
        showExistsError: (msg) => {
          setErrorMessage(msg);
          submissionErrorOccurred = true; // Mark that an error handled by the modal occurred
        }
      });
      if (!submissionErrorOccurred) { // Only show success if no specific error was set by addFeedItem
         showToast(UZBEK_STRINGS.taskSuccessfullyAdded, 2000);
      }
    }
    
    setIsSubmitting(false); // Reset submitting state regardless of outcome of addFeedItem/update
    
    // Close modal only if no error message is set locally (or by addFeedItem's callback)
    if (!submissionErrorOccurred && !errorMessage) { 
        handleClose();
    }
    // If errorMessage was set by time limit check before this block, it remains, and modal doesn't close.
  };

  const commonLabelClass = "block text-sm font-medium text-gray-700 mb-1";
  const buttonBaseClass = "px-5 py-2.5 text-sm font-medium rounded-sm shadow-sm transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-1";


  return (
    <div 
      className={`fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 transition-opacity duration-300 ease-in-out ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="addTaskModalTitle"
    >
      <div className={`bg-white p-5 rounded-none shadow-xl w-full max-w-md lg:max-w-lg border border-gray-300 transform transition-all duration-300 ease-in-out flex flex-col h-[90vh] md:h-auto md:max-h-[85vh] ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
          <h2 id="addTaskModalTitle" className="text-xl font-semibold text-black">{isEditing ? UZBEK_STRINGS.editDailyPlanTitle : UZBEK_STRINGS.dailyPlanTitle}</h2>
          <button 
            onClick={handleClose} 
            className="text-gray-500 hover:text-black p-1 rounded-full"
            aria-label={UZBEK_STRINGS.cancel}
          >
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-4 flex space-x-2 flex-shrink-0">
          <button
            onClick={() => setTargetDate(new Date())}
            disabled={isEditing} // Cannot change date when editing an existing plan
            className={`${buttonBaseClass} flex-1 ${isPlanForToday ? 'bg-black text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'} ${isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {UZBEK_STRINGS.todaysPlan}
          </button>
          <button
            onClick={() => {
              const tomorrow = new Date();
              tomorrow.setDate(new Date().getDate() + 1);
              setTargetDate(tomorrow);
            }}
            disabled={isEditing} // Cannot change date when editing
            className={`${buttonBaseClass} flex-1 ${!isPlanForToday ? 'bg-black text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'} ${isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {UZBEK_STRINGS.tomorrowsPlan}
          </button>
        </div>
        <p className="text-center text-sm text-gray-600 mb-3 flex-shrink-0">
            {UZBEK_STRINGS.planForDate(getLocalDateString(targetDate))}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 flex-grow overflow-y-auto no-scrollbar pr-1">
          <div>
            <h3 className={`${commonLabelClass} text-gray-800 font-semibold`}>{UZBEK_STRINGS.mandatoryTasks}</h3>
            <div className="space-y-2 mt-1">
              {todos.filter(t => t.isMandatory).map(todo => (
                <label 
                  key={todo.id} 
                  className="flex items-center space-x-3 p-2.5 bg-sky-50 rounded-sm border border-sky-200 cursor-not-allowed opacity-80"
                >
                  <input
                    type="checkbox"
                    checked={todo.isCompleted}
                    disabled={true}
                    className="h-5 w-5 text-black rounded-sm border-gray-400 focus:ring-black disabled:opacity-70 disabled:cursor-not-allowed"
                    aria-label={`${todo.text} (majburiy)`}
                  />
                  <span className={`text-sm ${todo.isCompleted ? 'line-through text-gray-500' : 'text-black'}`}>
                    {todo.text}
                  </span>
                  {todo.isMandatory && (
                    <span className="text-xs text-sky-600 ml-auto font-medium">(avtomatik)</span>
                  )}
                </label>
              ))}
            </div>
          </div>

          <div>
            <h3 className={`${commonLabelClass} text-gray-800 font-semibold mt-3`}>{UZBEK_STRINGS.personalTasks}</h3>
            <div className="space-y-2 mt-1">
              {todos.filter(t => !t.isMandatory).map(todo => (
                <div key={todo.id} className="flex items-center space-x-2 p-2.5 bg-gray-50 rounded-sm border border-gray-200 group">
                  <input
                    type="checkbox"
                    checked={todo.isCompleted}
                    onChange={() => handleToggleTodo(todo.id)}
                    className="h-5 w-5 text-black rounded-sm border-gray-400 focus:ring-black flex-shrink-0 cursor-pointer"
                    aria-label={`${todo.text} (shaxsiy)`}
                  />
                  <span 
                    className={`text-sm flex-grow cursor-pointer ${todo.isCompleted ? 'line-through text-gray-500' : 'text-black'}`}
                    onClick={() => handleToggleTodo(todo.id)} // Allow clicking text to toggle
                  >
                    {todo.text}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteCustomTodo(todo.id)}
                    className="text-gray-400 hover:text-red-500 p-1 opacity-50 group-hover:opacity-100 transition-opacity rounded-sm"
                    aria-label={`${UZBEK_STRINGS.addTodoButton} ${todo.text}`}
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {todos.filter(t => !t.isMandatory).length === 0 && (
                <p className="text-xs text-gray-400 text-center py-2">{UZBEK_STRINGS.noTodosYet}</p>
              )}
            </div>
             <div className="mt-3 bg-gray-100 p-3 rounded-sm border border-gray-200">
                <input
                    type="text"
                    value={newTodoText}
                    onChange={(e) => setNewTodoText(e.target.value)}
                    placeholder={UZBEK_STRINGS.addTodoPlaceholder}
                    className="w-full bg-white border-gray-300 text-black rounded-sm p-2.5 focus:ring-1 focus:ring-black focus:border-black placeholder-gray-500 text-sm"
                    autoFocus={!isEditing}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddCustomTodo();
                        }
                    }}
                />
                <button
                    type="button"
                    onClick={handleAddCustomTodo}
                    disabled={!newTodoText.trim()}
                    className={`${buttonBaseClass} w-full mt-2 bg-black text-white hover:bg-gray-800 focus:ring-black disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2`}
                    aria-label={UZBEK_STRINGS.addPersonalTask}
                >
                    <PlusIcon className="w-4 h-4"/>
                    <span>{UZBEK_STRINGS.addPersonalTask}</span>
                </button>
            </div>
          </div>
        </form>
        
        <div className="mt-auto pt-4 flex-shrink-0">
            {errorMessage && (
                <p className="text-sm text-red-600 bg-red-50 p-3 rounded-sm border border-red-300 mb-3" role="alert">{errorMessage}</p>
            )}
            {/* Show time limit warning if applicable, but don't duplicate if errorMessage is already set for it */}
            {!errorMessage && !isEditing && isPlanForToday && !canSubmitForToday && (
                 <p className="text-sm text-amber-700 bg-amber-50 p-3 rounded-sm border border-amber-300 mb-3" role="alert">
                    {UZBEK_STRINGS.dailyPlanTimeError(`${DAILY_PLAN_SUBMISSION_HOUR_LIMIT}:00`)}
                 </p>
            )}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className={`${buttonBaseClass} bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-400`}
            >
              {UZBEK_STRINGS.cancel}
            </button>
            <button
              type="submit"
              onClick={handleSubmit} // Let form's onSubmit handle it
              disabled={isSubmitting || (!isEditing && isPlanForToday && !canSubmitForToday)}
              className={`${buttonBaseClass} bg-black text-white hover:bg-gray-800 focus:ring-black disabled:bg-gray-400 disabled:cursor-not-allowed`}
            >
              {isSubmitting ? UZBEK_STRINGS.uploading : (isEditing ? UZBEK_STRINGS.updatePlan : UZBEK_STRINGS.saveAndShare)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddTaskModal;