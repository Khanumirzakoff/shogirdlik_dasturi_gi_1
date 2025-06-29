import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../contexts/AppContext';
import { TaskType, DailyPlanFeedItem, TodoItem } from '../types';
import { UZBEK_STRINGS, MANDATORY_TASK_TYPES_FOR_PLAN, DAILY_PLAN_SUBMISSION_HOUR_LIMIT } from '../constants';

interface AddTaskModalProps {
  onClose: () => void;
  planToEdit?: DailyPlanFeedItem | null;
}

const AddTaskModal: React.FC<AddTaskModalProps> = ({ onClose, planToEdit }) => {
  const context = useContext(AppContext);
  
  if (!context) return null;

  const { addFeedItem, updateDailyPlan, showToast } = context;
  
  const [planDate, setPlanDate] = useState<Date>(new Date());
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [newTodoText, setNewTodoText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = !!planToEdit;

  useEffect(() => {
    if (planToEdit) {
      setPlanDate(new Date(planToEdit.planDate));
      setTodos([...planToEdit.todos]);
    } else {
      // Initialize with mandatory tasks for new plans
      const mandatoryTodos: TodoItem[] = MANDATORY_TASK_TYPES_FOR_PLAN.map(taskType => ({
        id: `mandatory-${taskType}-${Date.now()}`,
        text: `${taskType} bajarish`,
        isCompleted: false,
        isMandatory: true,
        taskType
      }));
      setTodos(mandatoryTodos);
    }
  }, [planToEdit]);

  const addPersonalTodo = () => {
    if (!newTodoText.trim()) return;

    const newTodo: TodoItem = {
      id: `personal-${Date.now()}`,
      text: newTodoText.trim(),
      isCompleted: false,
      isMandatory: false
    };

    setTodos(prev => [...prev, newTodo]);
    setNewTodoText('');
  };

  const removeTodo = (todoId: string) => {
    setTodos(prev => prev.filter(todo => todo.id !== todoId));
  };

  const updateTodoText = (todoId: string, newText: string) => {
    setTodos(prev => prev.map(todo => 
      todo.id === todoId ? { ...todo, text: newText } : todo
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (todos.length === 0) {
      showToast(UZBEK_STRINGS.dailyPlanSubmissionError);
      return;
    }

    // Check time limit for new plans (not for edits)
    if (!isEditMode) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const selectedDate = new Date(planDate.getFullYear(), planDate.getMonth(), planDate.getDate());
      
      if (selectedDate.getTime() === today.getTime() && now.getHours() >= DAILY_PLAN_SUBMISSION_HOUR_LIMIT) {
        const timeLimit = `${DAILY_PLAN_SUBMISSION_HOUR_LIMIT}:00`;
        showToast(UZBEK_STRINGS.dailyPlanTimeError(timeLimit));
        return;
      }
    }

    setIsSubmitting(true);

    try {
      if (isEditMode && planToEdit) {
        updateDailyPlan(planToEdit.id, todos, planDate);
        showToast(UZBEK_STRINGS.updateSuccess);
      } else {
        addFeedItem({
          type: TaskType.DAILY_PLAN,
          todos,
          planDate,
          pointsAwarded: 5
        });
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving daily plan:', error);
      showToast('Xatolik yuz berdi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          {isEditMode ? UZBEK_STRINGS.editDailyPlanTitle : UZBEK_STRINGS.dailyPlanTitle}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Date Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reja sanasi
            </label>
            <input
              type="date"
              value={formatDateForInput(planDate)}
              onChange={(e) => setPlanDate(new Date(e.target.value))}
              min={formatDateForInput(new Date())}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Mandatory Tasks */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              {UZBEK_STRINGS.mandatoryTasks}
            </h3>
            <div className="space-y-2">
              {todos.filter(todo => todo.isMandatory).map(todo => (
                <div key={todo.id} className="flex items-center space-x-2 p-2 bg-blue-50 rounded-lg">
                  <input
                    type="checkbox"
                    checked={todo.isCompleted}
                    onChange={(e) => {
                      setTodos(prev => prev.map(t => 
                        t.id === todo.id ? { ...t, isCompleted: e.target.checked } : t
                      ));
                    }}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    value={todo.text}
                    onChange={(e) => updateTodoText(todo.id, e.target.value)}
                    className="flex-1 px-2 py-1 text-sm bg-transparent border-none focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Personal Tasks */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              {UZBEK_STRINGS.personalTasks}
            </h3>
            <div className="space-y-2">
              {todos.filter(todo => !todo.isMandatory).map(todo => (
                <div key={todo.id} className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                  <input
                    type="checkbox"
                    checked={todo.isCompleted}
                    onChange={(e) => {
                      setTodos(prev => prev.map(t => 
                        t.id === todo.id ? { ...t, isCompleted: e.target.checked } : t
                      ));
                    }}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    value={todo.text}
                    onChange={(e) => updateTodoText(todo.id, e.target.value)}
                    className="flex-1 px-2 py-1 text-sm bg-transparent border-none focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => removeTodo(todo.id)}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            {/* Add Personal Task */}
            <div className="flex space-x-2 mt-2">
              <input
                type="text"
                value={newTodoText}
                onChange={(e) => setNewTodoText(e.target.value)}
                placeholder={UZBEK_STRINGS.addTodoPlaceholder}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addPersonalTodo())}
              />
              <button
                type="button"
                onClick={addPersonalTodo}
                disabled={!newTodoText.trim()}
                className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {UZBEK_STRINGS.addTodoButton}
              </button>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
            >
              {UZBEK_STRINGS.cancel}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting 
                ? UZBEK_STRINGS.saving 
                : isEditMode 
                  ? UZBEK_STRINGS.updatePlan 
                  : UZBEK_STRINGS.saveAndShare
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTaskModal;