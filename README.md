# 🍳 ChefBot - Your AI-Powered Culinary Companion

**ChefBot** is an intelligent recipe generator that transforms your available ingredients into delicious culinary creations! Powered by Claude AI, this modern web application helps you discover what to cook with whatever you have on hand, while building a community around shared culinary experiences.

![ChefBot Demo](https://img.shields.io/badge/Status-Live-brightgreen) ![React](https://img.shields.io/badge/React-18+-blue) ![Tailwind](https://img.shields.io/badge/Tailwind-CSS-38B2AC)

## 🎯 What is ChefBot?

ChefBot solves the everyday problem: **"I have these ingredients, but what can I cook?"** 

Simply add your ingredients, and our AI chef "Chef BonBon" will create personalized recipes just for you. Whether you're a cooking novice or a seasoned chef, ChefBot makes meal planning effortless and inspiring.

## ✨ Key Features

### 🤖 **Smart Recipe Generation**
- **AI-Powered**: Uses Claude AI to generate creative, unique recipes
- **Ingredient-Based**: Add any ingredients you have on hand
- **Flexible Input**: Works with any combination of ingredients
- **Creative Suggestions**: Get recipes you never would have thought of

### 👤 **User Experience**
- **No Account Required**: Try ChefBot instantly as a guest
- **Smart Ingredient Management**: 
  - Add ingredients one by one
  - Delete individual ingredients with X buttons
  - Clean, card-based ingredient display
- **Mobile-First Design**: Perfect experience on any device
- **Fast & Responsive**: Built with modern React and Vite

### 🔐 **User Accounts & Authentication**
- **Flexible Access**: Use as guest or create an account
- **Email/Password Signup**: Secure Firebase authentication
- **Custom Usernames**: Choose your own display name
- **Persistent Sessions**: Stay logged in across visits

### 📚 **Recipe Management**
- **Save Favorites**: Keep your best recipes in "My Recipes"
- **Public Sharing**: Share your creations with the community
- **Recipe Feed**: Discover what others are cooking
- **Like System**: Heart your favorite community recipes
- **Personal Collections**: Access your saved and liked recipes anytime

### 🌐 **Community Features**
- **Public Feed**: Browse recipes shared by other users
- **Social Interaction**: Like and discover popular recipes
- **Recipe Inspiration**: Get ideas from the community's creations
- **Share Your Success**: Make your recipes public for others to try

## 🛠️ Technologies

### Frontend
- **React 18+** - Modern component-based UI
- **Vite** - Lightning-fast development and building
- **Tailwind CSS** - Utility-first styling for responsive design

### Backend & AI
- **Node.js + Express** - API proxy server
- **Claude AI (Anthropic)** - Advanced language model for recipe generation
- **Custom API Integration** - Seamless AI communication

### Database & Authentication
- **Firebase Authentication** - Secure user management
- **Cloud Firestore** - Real-time NoSQL database
- **Secure Data Model** - Protected user data with proper access controls

## 🚀 Live Demo

**Try ChefBot now**: [Your Deployment URL Here]

### Quick Start - No Installation Required!
1. Visit the live app
2. Add some ingredients (e.g., "chicken", "rice", "tomatoes")
3. Click "Get Recipe!" when you have 4+ ingredients
4. Watch Chef BonBon create your personalized recipe!

## 💻 Local Development

### Prerequisites
- Node.js (LTS version)
- Firebase project
- Anthropic API key

### Quick Setup
```bash
# Clone the repository
git clone [your-repo-url]
cd ChefBot

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local
# Add your API keys to .env.local

# Start development servers
npm run dev        # Frontend (http://localhost:5173)
npm run start      # Backend (http://localhost:3000)
```

### Environment Variables
Create `.env.local` with:
```env
# Firebase Configuration
VITE_FIREBASE_API_KEY="your-firebase-api-key"
VITE_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="your-project-id"
VITE_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
VITE_FIREBASE_APP_ID="your-app-id"

# Anthropic API
ANTHROPIC_API_KEY="sk-..."
```

## 📱 User Journey

### For Guests
1. **Instant Access** - No signup required
2. **Add Ingredients** - Type in what you have
3. **Generate Recipes** - Get AI-powered suggestions
4. **Browse Community** - See what others are making

### For Registered Users
1. **All Guest Features** +
2. **Save Recipes** - Build your personal cookbook
3. **Share Creations** - Contribute to the community
4. **Like & Collect** - Curate your favorite discoveries
5. **Persistent Profile** - Your data stays with you

## 🎨 Design Features

- **Intuitive Interface** - Clean, modern design
- **Responsive Layout** - Works perfectly on mobile, tablet, desktop
- **Accessibility** - Proper ARIA labels and keyboard navigation
- **Loading States** - Beautiful animations while generating recipes
- **Error Handling** - Graceful error messages and recovery

## 🔒 Privacy & Security

- **Secure Authentication** - Firebase-backed user accounts
- **Data Protection** - Personal recipes are private by default
- **Optional Sharing** - You control what gets shared publicly
- **No Tracking** - No unnecessary data collection

## 🌟 What Makes ChefBot Special?

1. **AI-Powered Creativity** - Not just database lookups, but truly creative recipe generation
2. **Community-Driven** - Learn from other home cooks and share your discoveries
3. **Zero Friction** - Works immediately without barriers
4. **Ingredient-Focused** - Solves the real problem of "what to cook with what I have"
5. **Mobile-Optimized** - Perfect for use while shopping or in the kitchen

## 📂 Project Structure

```
ChefBot/
├── src/
│   ├── components/        # React components
│   │   ├── Main.jsx       # Home page & recipe generation
│   │   ├── PublicFeed.jsx # Community recipes
│   │   ├── SavedRecipes.jsx # Personal recipe collection
│   │   └── ...
│   ├── utils/
│   │   └── getRecipeFromClaude.js # AI integration
│   ├── firebase.js       # Database configuration
│   └── App.jsx           # Main application
├── server.js             # API proxy server
├── server-local.cjs      # Local development server
└── package.json
```

## 🤝 Contributing

We welcome contributions! Here are some ways to get involved:

- 🐛 Report bugs or request features via Issues
- 🎨 Suggest UI/UX improvements
- 💡 Propose new features
- 📝 Improve documentation
- 🧪 Add tests

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---



*