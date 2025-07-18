Chef BonBon: AI-Powered Recipe Generator
Chef BonBon is a modern web application that leverages AI to generate unique recipes based on user-provided ingredients. Users can explore a public feed of shared recipes, save their favorite recipes, like recipes, and manage their own culinary creations. The application features robust user authentication, including anonymous browsing and persistent user profiles.

✨ Features
AI Recipe Generation: Input a list of ingredients, and Chef BonBon (powered by the Anthropic API) will generate a creative recipe.

User Authentication:

Anonymous Browsing: Users can explore the app and generate recipes without creating an account.

Email/Password Login & Signup: Registered users can create and log into their accounts.

Persistent Usernames: Usernames (from signup or email fallback) persist across sessions and refreshes.

Personal Recipe Management: Authenticated users can save their generated recipes to a private collection.

Public Recipe Feed: Discover recipes shared by other users in a public feed.

Recipe Liking: Users can "like" recipes in the public feed.

Responsive Design: Optimized for a seamless experience across various devices (mobile, tablet, desktop).

Modern UI: Built with React and styled with Tailwind CSS for a clean and intuitive user interface.

🚀 Technologies Used
Frontend:

React: A JavaScript library for building user interfaces.

Vite: A fast build tool for modern web projects.

Tailwind CSS: A utility-first CSS framework for rapid UI development.

Backend/API:

Node.js: JavaScript runtime environment.

Express.js: Fast, unopinionated, minimalist web framework for Node.js (used for API proxy).

Anthropic API: The AI model used for generating recipes.

Database & Authentication:

Firebase Authentication: For user management (email/password, anonymous).

Firestore: A NoSQL cloud database for storing user recipes, public recipes, likes, and user profiles.

🛠️ Setup and Installation
Follow these steps to get Chef BonBon up and running on your local machine.

Prerequisites
Node.js (LTS version recommended)

npm or Yarn (npm is used in these instructions)

A Google Firebase Project

An Anthropic API Key

1. Clone the Repository
git clone <your-repository-url>
cd ChefBonBon

2. Environment Variables
Create a file named .env.local in the root directory of your project (the same level as package.json). This file will store your sensitive API keys and Firebase configuration.

# Firebase Project Configuration (YOU MUST FILL IN THESE VALUES)
VITE_FIREBASE_API_KEY="YOUR_ACTUAL_FIREBASE_API_KEY"
VITE_FIREBASE_AUTH_DOMAIN="YOUR_ACTUAL_FIREBASE_AUTH_DOMAIN"
VITE_FIREBASE_PROJECT_ID="YOUR_ACTUAL_FIREBASE_PROJECT_ID"
VITE_FIREBASE_STORAGE_BUCKET="YOUR_ACTUAL_FIREBASE_STORAGE_BUCKET"
VITE_FIREBASE_MESSAGING_SENDER_ID="YOUR_ACTUAL_FIREBASE_MESSAGING_SENDER_ID"
VITE_FIREBASE_APP_ID="YOUR_ACTUAL_FIREBASE_APP_ID"
VITE_FIREBASE_MEASUREMENT_ID="YOUR_ACTUAL_FIREBASE_MEASUREMENT_ID" # This might be optional

# Anthropic API Key (Replace with your actual key)
VITE_ANTHROPIC_API_KEY="YOUR_ACTUAL_ANTHROPIC_API_KEY"

Important: Never commit your .env.local file to version control (Git). Your .gitignore file should already prevent this.

3. Firebase Project Setup
To ensure the application functions correctly with Firebase, you need to configure your Firebase project:

Create a Firebase Project: If you don't have one, go to the Firebase Console and create a new project.

Add a Web App: In your Firebase project, add a web app (look for the </> icon). Follow the steps to get your firebaseConfig object. Copy these values into your .env.local file.

Enable Authentication Methods:

In the Firebase Console, navigate to Authentication -> Sign-in method.

Enable Email/Password provider.

Enable Anonymous provider.

(Optional) Enable Google provider if you want to use Google Sign-In.

Set up Firestore Database:

In the Firebase Console, navigate to Firestore Database.

Create a new database in "production mode".

Update Security Rules: Go to the "Rules" tab and replace the default rules with the following to manage access to recipes and user profiles:

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Global artifacts collection for your app
    match /artifacts/{appId} {

      // User-specific data (private recipes and profiles)
      // Allows read/write only if authenticated user's UID matches userId in path
      match /users/{userId}/{document=**} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }

      // Public data (public recipes, likes, comments)
      // Anyone can read public data
      // Only authenticated users can write/interact (share, like, comment)
      match /public/data/{document=**} {
        allow read: if true;
        allow write: if request.auth != null;
      }
    }
  }
}

Publish these rules.

4. Install Dependencies
Install dependencies for both the client (React app) and the server (Node.js proxy).

# Install client dependencies
npm install

# Install server dependencies (from the root directory)
cd .. # If you are in ChefBonBon folder, go back to the root
npm install

5. Run the Development Server
You need to run both the Node.js proxy server and the React development server concurrently.

# In your project root directory, start the Node.js proxy server
npm run server

# In a new terminal, from your project root directory, start the React development server
npm run dev

The application should now be accessible at http://localhost:5173.

📂 Project Structure
ChefBonBon/
├── public/
├── src/
│   ├── assets/
│   │   └── images/
│   │       └── chef-icon.png
│   ├── components/
│   │   ├── AuthModal.jsx
│   │   ├── BurgerMenu.jsx
│   │   ├── Header.jsx
│   │   ├── IngredientsList.jsx
│   │   ├── LikedRecipes.jsx
│   │   ├── Main.jsx
│   │   ├── MessageModal.jsx
│   │   ├── PublicFeed.jsx
│   │   └── SavedRecipes.jsx
│   ├── utils/
│   │   └── getRecipeFromClaude.js
│   ├── App.jsx
│   ├── firebase.js
│   └── main.jsx
├── .env.local             # Environment variables (local dev)
├── .gitignore
├── index.html
├── package.json
├── server.js              # Node.js proxy server for Anthropic API
└── tailwind.config.js

💡 Usage
Generate Recipes: On the home page, enter ingredients into the text area and click "Generate Recipe".

Save Recipes: After generating a recipe, if logged in, you can save it to "My Recipes".

Public Feed: Navigate to the "Public Feed" from the Burger Menu to see recipes shared by others.

Like Recipes: Click the heart icon on any public recipe to like it. Your liked recipes appear in "Liked Recipes".

Authentication: Use the Burger Menu to "Login" or "Sign Up". Anonymous users will see "Guest" in the header. Registered users will see their chosen username.

🔒 Authentication Details
Anonymous Users: When the app loads and no registered user is detected, a temporary anonymous session is created. These users can generate recipes and browse the public feed, but cannot save or like recipes. Their header will display "Guest".

Registered Users: Users can sign up with an email and password, providing a custom username. This username is stored in Firestore and will be displayed in the header, persisting across sessions.

Logout: Logging out clears the current user session. Upon refreshing the page, a new anonymous session will be initiated.

🗃️ Firestore Data Model
/artifacts/{appId}/users/{userId}/recipes/{recipeId}: Stores private recipes for each user.

/artifacts/{appId}/users/{userId}/profile/data: Stores the user's chosen username and other profile information.

/artifacts/{appId}/public/data/recipes/{recipeId}: Stores recipes that have been shared publicly.

/artifacts/{appId}/public/data/recipes/{recipeId}/likes/{likeId}: Stores likes for public recipes, linking to the userId who liked it.

🚀 Deployment
This project uses Vite for the frontend and a simple Node.js/Express server for the API proxy. For deployment, you would typically:

Frontend: Build the React app (npm run build) and deploy the dist folder to a static hosting service (e.g., Netlify, Vercel, Firebase Hosting).

Backend: Deploy the server.js (Express app) to a platform that supports Node.js (e.g., Render, Heroku, Google Cloud Run, AWS Lambda). Ensure your environment variables are set correctly on the hosting platform.

Firebase: Firebase services (Authentication, Firestore) are cloud-based and require no separate deployment once configured.

🤝 Contributing
Feel free to fork this repository, open issues, and submit pull requests.

