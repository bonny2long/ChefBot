// src/components/Header.jsx
import React, { useState, useEffect } from 'react';
import chefBot from '../assets/images/chef-icon.png';

export default function Header({ userId, userName }) {
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const getGreetingText = () => {
      const currentHour = new Date().getHours();
      if (currentHour >= 5 && currentHour < 12) {
        return 'Good morning';
      } else if (currentHour >= 12 && currentHour < 18) {
        return 'Good afternoon';
      } else {
        return 'Good evening';
      }
    };

    setGreeting(getGreetingText());
    const intervalId = setInterval(() => {
      setGreeting(getGreetingText());
    }, 60 * 1000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <header className="w-full max-w-3xl h-28 bg-white p-4 flex items-center justify-center shadow-md rounded-b-lg mx-auto relative">
      <nav className="flex items-center gap-3">
        <img src={chefBot} alt="robot chef png" className="w-10 h-auto rounded-full" />
        <span className="text-2xl font-medium text-gray-900 font-sans">Chef BonBon</span>
      </nav>

      {userId && (
        <div className="absolute bottom-2 right-4 text-gray-600 text-sm">
          {greeting},{' '}
          <span className="font-semibold text-orange-600">
            {userName || 'Guest'}
          </span>
          !
        </div>
      )}
    </header>
  );
}
