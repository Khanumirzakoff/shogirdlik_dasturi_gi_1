import React, { useContext, useState } from 'react';
import { AppContext } from '../contexts/AppContext';
import { UZBEK_STRINGS } from '../constants';

const LoginView: React.FC = () => {
  const context = useContext(AppContext);
  const [email, setEmail] = useState('demo@example.com');
  const [password, setPassword] = useState('demo123');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  if (!context) return null;

  const { setCurrentUser } = context;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);

    // Simulate login delay
    setTimeout(() => {
      if (email === 'demo@example.com' && password === 'demo123') {
        setCurrentUser({
          id: 'user123',
          name: 'Demo',
          surname: 'User'
        });
      } else {
        alert(UZBEK_STRINGS.loginError);
      }
      setIsLoggingIn(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {UZBEK_STRINGS.welcomeBack}
          </h1>
          <p className="text-gray-600">
            {UZBEK_STRINGS.loginTitle}
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {UZBEK_STRINGS.email}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {UZBEK_STRINGS.password}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoggingIn}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoggingIn ? UZBEK_STRINGS.loggingIn : UZBEK_STRINGS.loginButton}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Demo: demo@example.com / demo123
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginView;