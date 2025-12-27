# ⚠️ IMPORTANT: Supabase Setup Required

Your app is experiencing issues because **Supabase is not fully configured**. Here's what you need to do:

## Step 1: Add Supabase Credentials to `.env`

Add these two lines to your `.env` file:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### How to Get These Values:

1. Go to [supabase.com](https://supabase.com) and sign in
2. Select your project (or create a new one)
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon/public key** → `VITE_SUPABASE_ANON_KEY`

## Step 2: Create Database Tables

Once you have your Supabase project, you need to create the database tables. 

Go to your Supabase dashboard → **SQL Editor** and run ALL the SQL commands from `SUPABASE_SETUP.md` in order:

1. User Profiles Table
2. Private Recipes Table  
3. Public Recipes Table
4. Recipe Likes Table
5. Recipe Comments Table
6. Database Functions and Triggers

## Step 3: Restart Your Dev Server

After adding the environment variables:

```bash
# Stop your current dev server (Ctrl+C)
# Then restart it:
npm run dev
```

## Current Issues (Will Be Fixed After Setup):

- ✅ **Modal closes now** after signup/login
- ❌ **Username shows email** - Because Supabase can't fetch from `user_profiles` table (doesn't exist yet)
- ❌ **Infinite loading** on SavedRecipes - Because `private_recipes` table doesn't exist
- ❌ **Infinite loading** on LikedRecipes - Because `recipe_likes` table doesn't exist

## After You Complete These Steps:

1. The username will display correctly ("bonny" instead of "bmakaniankhondo@icstars.org")
2. SavedRecipes page will load properly
3. LikedRecipes page will load properly
4. You'll be able to save and share recipes

---

**Need help?** Check `SUPABASE_SETUP.md` for detailed instructions!
