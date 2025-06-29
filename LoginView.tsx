


import React, { useContext, useState } from 'react';
import { AppContext } from '../contexts/AppContext';
import { UZBEK_STRINGS } from '../constants';
import { GoogleIcon } from './icons/GoogleIcon';

const LoginView: React.FC = () => {
  const context = useContext(AppContext);
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!context) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <p>Context yuklanmoqda...</p>
      </div>
    );
  }

  const { allUsers, setCurrentUser, showToast } = context;

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    setIsSubmitting(true);

    // DEMO LOGIC: For this version, any input will log in the first available user.
    // In a real app, you would validate credentials or create a new user here.
    const userToLogin = allUsers[0]; 
    if (userToLogin) {
      setTimeout(() => {
        setCurrentUser(userToLogin);
        showToast(`${UZBEK_STRINGS.welcomeBack}, ${userToLogin.name}!`, 2000);
        // No need to setIsSubmitting(false) because the component will unmount
      }, 700); // Simulate network delay
    } else {
        showToast(UZBEK_STRINGS.userNotFound, 3000);
        setIsSubmitting(false);
    }
  };

  const handleFeatureNotAvailable = () => {
    showToast(UZBEK_STRINGS.featureNotAvailable, 2500);
  }

  const renderLoginForm = () => (
    <>
      <h1 className="text-2xl font-bold text-black text-center mb-2">Shogirdlik dasturi</h1>
      <p className="text-sm text-gray-500 text-center mb-6">{UZBEK_STRINGS.loginTitle}</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email-login" className="block text-sm font-medium text-gray-700 mb-1">
            {UZBEK_STRINGS.email}
          </label>
          <input
            type="email"
            id="email-login"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-gray-100 border-gray-300 text-black rounded-sm p-3 focus:ring-1 focus:ring-black focus:border-black placeholder-gray-500"
            placeholder="example@gmail.com"
            required
            disabled={isSubmitting}
          />
        </div>
        <div>
          <div className="flex justify-between items-baseline">
            <label htmlFor="password-login" className="block text-sm font-medium text-gray-700 mb-1">
              {UZBEK_STRINGS.password}
            </label>
            <button 
              type="button" 
              onClick={handleFeatureNotAvailable}
              className="text-xs text-sky-600 hover:text-sky-800 font-medium"
            >
              {UZBEK_STRINGS.forgotPassword}
            </button>
          </div>
          <input
            type="password"
            id="password-login"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-gray-100 border-gray-300 text-black rounded-sm p-3 focus:ring-1 focus:ring-black focus:border-black placeholder-gray-500"
            placeholder="••••••••"
            required
            disabled={isSubmitting}
          />
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex justify-center items-center bg-black text-white font-semibold py-3 px-4 rounded-sm hover:bg-gray-800 disabled:bg-gray-400 transition-colors duration-150"
        >
          {isSubmitting ? `${UZBEK_STRINGS.loggingIn}...` : UZBEK_STRINGS.loginButton}
        </button>
      </form>
       <div className="flex items-center my-6">
          <div className="flex-grow border-t border-gray-200"></div>
          <span className="flex-shrink mx-4 text-xs text-gray-400 uppercase">{UZBEK_STRINGS.or}</span>
          <div className="flex-grow border-t border-gray-200"></div>
        </div>
      <button
        onClick={() => handleSubmit()}
        disabled={isSubmitting}
        className="w-full flex items-center justify-center space-x-3 p-3 bg-white border border-gray-300 rounded-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-1 transition-colors duration-150"
        aria-label={UZBEK_STRINGS.loginWithGoogle}
      >
        <GoogleIcon className="w-5 h-5" />
        <span className="text-sm font-medium text-gray-700">{UZBEK_STRINGS.loginWithGoogle}</span>
      </button>
      <p className="text-center text-sm text-gray-600 mt-8">
        {UZBEK_STRINGS.noAccount}{' '}
        <button type="button" onClick={() => setMode('signup')} className="font-semibold text-sky-600 hover:text-sky-800">
          {UZBEK_STRINGS.signUp}
        </button>
      </p>
    </>
  );

  const renderSignUpForm = () => (
    <>
      <h1 className="text-2xl font-bold text-black text-center mb-6">{UZBEK_STRINGS.signUpTitle}</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex space-x-4">
            <div className="flex-1">
                <label htmlFor="name-signup" className="block text-sm font-medium text-gray-700 mb-1">{UZBEK_STRINGS.name}</label>
                <input type="text" id="name-signup" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-gray-100 border-gray-300 text-black rounded-sm p-3 focus:ring-1 focus:ring-black focus:border-black placeholder-gray-500" required disabled={isSubmitting} />
            </div>
            <div className="flex-1">
                <label htmlFor="surname-signup" className="block text-sm font-medium text-gray-700 mb-1">{UZBEK_STRINGS.surname}</label>
                <input type="text" id="surname-signup" value={surname} onChange={(e) => setSurname(e.target.value)} className="w-full bg-gray-100 border-gray-300 text-black rounded-sm p-3 focus:ring-1 focus:ring-black focus:border-black placeholder-gray-500" required disabled={isSubmitting} />
            </div>
        </div>
        <div>
          <label htmlFor="email-signup" className="block text-sm font-medium text-gray-700 mb-1">{UZBEK_STRINGS.email}</label>
          <input type="email" id="email-signup" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-gray-100 border-gray-300 text-black rounded-sm p-3 focus:ring-1 focus:ring-black focus:border-black placeholder-gray-500" required disabled={isSubmitting} />
        </div>
        <div>
          <label htmlFor="password-signup" className="block text-sm font-medium text-gray-700 mb-1">{UZBEK_STRINGS.password}</label>
          <input type="password" id="password-signup" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-gray-100 border-gray-300 text-black rounded-sm p-3 focus:ring-1 focus:ring-black focus:border-black placeholder-gray-500" required disabled={isSubmitting} />
        </div>
        <button type="submit" disabled={isSubmitting} className="w-full flex justify-center items-center bg-black text-white font-semibold py-3 px-4 rounded-sm hover:bg-gray-800 disabled:bg-gray-400 transition-colors duration-150">
          {isSubmitting ? `${UZBEK_STRINGS.loggingIn}...` : UZBEK_STRINGS.signUp}
        </button>
      </form>
      <p className="text-center text-sm text-gray-600 mt-8">
        {UZBEK_STRINGS.haveAccount}{' '}
        <button type="button" onClick={() => setMode('login')} className="font-semibold text-sky-600 hover:text-sky-800">
          {UZBEK_STRINGS.loginLink}
        </button>
      </p>
    </>
  );


  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50 p-4">
      <div className="bg-white p-6 md:p-8 rounded-none shadow-2xl w-full max-w-sm border border-gray-200">
        {mode === 'login' ? renderLoginForm() : renderSignUpForm()}
      </div>
      <footer className="mt-8 text-center">
        <p className="text-xs text-gray-400">Vazifa Trekeri &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
};

export default LoginView;