// src/components/layout/Header.jsx
import React, { useState, useEffect } from "react";
import chefBot from "../../assets/images/chef-icon.png";

const getRecipeMode = () => {
  const stored = sessionStorage.getItem("recipeContext");
  if (!stored) return "food";

  try {
    const parsed = JSON.parse(stored);
    return parsed?.type === "drink" ? "drink" : "food";
  } catch {
    return stored === "drink" ? "drink" : "food";
  }
};

export default function Header({ userId, userName }) {
  const [greeting, setGreeting] = useState("");
  const [recipeMode, setRecipeMode] = useState(getRecipeMode);
  const name = userName || (userId ? "Guest" : "there");

  useEffect(() => {
    const getGreetingText = () => {
      const hour = new Date().getHours();
      if (hour >= 5 && hour < 12) return "Good morning";
      if (hour >= 12 && hour < 18) return "Good afternoon";
      return "Good evening";
    };

    setGreeting(getGreetingText());
    const id = setInterval(() => setGreeting(getGreetingText()), 60000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const syncRecipeMode = () => setRecipeMode(getRecipeMode());
    window.addEventListener("recipe-mode-reset", syncRecipeMode);
    window.addEventListener("recipe-mode-changed", syncRecipeMode);

    return () => {
      window.removeEventListener("recipe-mode-reset", syncRecipeMode);
      window.removeEventListener("recipe-mode-changed", syncRecipeMode);
    };
  }, []);

  const handleChangeMode = () => {
    sessionStorage.removeItem("recipeContext");
    setRecipeMode("food");
    window.dispatchEvent(new Event("recipe-mode-reset"));
  };

  return (
    <header className="w-full max-w-3xl bg-white px-6 pt-4 pb-3 shadow-md rounded-b-lg mx-auto relative">
      {/* CENTER — Logo */}
      <div className="flex justify-center items-center gap-2">
        <img src={chefBot} alt="robot chef" className="w-14 h-14" />
        <span className="text-2xl font-medium text-gray-900">
          Chef BonBon
        </span>
      </div>

      {/* BOTTOM ROW */}
      <div className="mt-3 flex items-end justify-between text-sm text-gray-600">
        {/* Bottom-left — Greeting */}
        <div>
          {greeting},{" "}
          <span className="font-semibold text-orange-600">
            {name}
          </span>
          !
        </div>

        {/* Bottom-right — Mode + change */}
        <div className="flex flex-col items-end gap-1 text-xs">
          <span
            className={`px-2 py-0.5 rounded-full border font-medium
              ${
                recipeMode === "drink"
                  ? "border-slate-400 text-slate-600 bg-slate-50"
                  : "border-orange-400 text-orange-700 bg-orange-50"
              }
            `}
          >
            {recipeMode === "drink" ? "Drink mode" : "Food mode"}
          </span>

          <button
            onClick={handleChangeMode}
            className="text-orange-600 hover:underline font-semibold"
          >
            Change mode
          </button>
        </div>
      </div>
    </header>
  );
}
