# Supabase Migration Setup Guide

This guide will help you set up your Supabase database schema and Row Level Security (RLS) policies for the ChefBot application.

## Prerequisites

1. Create a Supabase account at https://supabase.com
2. Create a new project
3. Get your project URL and anon key from Settings > API

## Environment Variables

Add these to your `.env` file:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## Database Schema

Run these SQL commands in your Supabase SQL Editor (Database > SQL Editor):

### 1. User Profiles Table

```sql
-- Create user_profiles table
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  username TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
-- Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON user_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own profile
CREATE POLICY "Users can create own profile"
  ON user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

### 2. Private Recipes Table

```sql
-- Create private_recipes table
CREATE TABLE private_recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  ingredients TEXT,
  instructions TEXT,
  cuisine_type TEXT,
  cooking_time TEXT,
  difficulty TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster user queries
CREATE INDEX idx_private_recipes_user_id ON private_recipes(user_id);

-- Enable RLS
ALTER TABLE private_recipes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for private_recipes
-- Users can only see their own recipes
CREATE POLICY "Users can view own recipes"
  ON private_recipes
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own recipes
CREATE POLICY "Users can create own recipes"
  ON private_recipes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own recipes
CREATE POLICY "Users can update own recipes"
  ON private_recipes
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own recipes
CREATE POLICY "Users can delete own recipes"
  ON private_recipes
  FOR DELETE
  USING (auth.uid() = user_id);
```

### 3. Public Recipes Table

```sql
-- Create public_recipes table
CREATE TABLE public_recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  username TEXT,
  title TEXT NOT NULL,
  ingredients TEXT,
  instructions TEXT,
  cuisine_type TEXT,
  cooking_time TEXT,
  difficulty TEXT,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_public_recipes_user_id ON public_recipes(user_id);
CREATE INDEX idx_public_recipes_created_at ON public_recipes(created_at DESC);

-- Enable RLS
ALTER TABLE public_recipes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for public_recipes
-- Everyone can view public recipes (even anonymous users)
CREATE POLICY "Anyone can view public recipes"
  ON public_recipes
  FOR SELECT
  USING (true);

-- Authenticated users can create public recipes
CREATE POLICY "Authenticated users can create public recipes"
  ON public_recipes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own public recipes
CREATE POLICY "Users can update own public recipes"
  ON public_recipes
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own public recipes
CREATE POLICY "Users can delete own public recipes"
  ON public_recipes
  FOR DELETE
  USING (auth.uid() = user_id);
```

### 4. Recipe Likes Table

```sql
-- Create recipe_likes table (for tracking who liked what)
CREATE TABLE recipe_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  recipe_id UUID REFERENCES public_recipes(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, recipe_id)
);

-- Create indexes
CREATE INDEX idx_recipe_likes_user_id ON recipe_likes(user_id);
CREATE INDEX idx_recipe_likes_recipe_id ON recipe_likes(recipe_id);

-- Enable RLS
ALTER TABLE recipe_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for recipe_likes
-- Users can view all likes (to see like counts)
CREATE POLICY "Anyone can view likes"
  ON recipe_likes
  FOR SELECT
  USING (true);

-- Users can only create likes for themselves
CREATE POLICY "Users can create own likes"
  ON recipe_likes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own likes
CREATE POLICY "Users can delete own likes"
  ON recipe_likes
  FOR DELETE
  USING (auth.uid() = user_id);
```

### 5. Recipe Comments Table

```sql
-- Create recipe_comments table
CREATE TABLE recipe_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID REFERENCES public_recipes(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  username TEXT,
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_recipe_comments_recipe_id ON recipe_comments(recipe_id);
CREATE INDEX idx_recipe_comments_user_id ON recipe_comments(user_id);
CREATE INDEX idx_recipe_comments_created_at ON recipe_comments(created_at DESC);

-- Enable RLS
ALTER TABLE recipe_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for recipe_comments
-- Anyone can view comments
CREATE POLICY "Anyone can view comments"
  ON recipe_comments
  FOR SELECT
  USING (true);

-- Authenticated users can create comments
CREATE POLICY "Authenticated users can create comments"
  ON recipe_comments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete own comments"
  ON recipe_comments
  FOR DELETE
  USING (auth.uid() = user_id);
```

### 6. Database Functions and Triggers

```sql
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_private_recipes_updated_at BEFORE UPDATE ON private_recipes
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_public_recipes_updated_at BEFORE UPDATE ON public_recipes
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Function to update like count when likes are added/removed
CREATE OR REPLACE FUNCTION update_recipe_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public_recipes
    SET likes_count = likes_count + 1
    WHERE id = NEW.recipe_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public_recipes
    SET likes_count = likes_count - 1
    WHERE id = OLD.recipe_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ language 'plpgsql';

-- Triggers for like count
CREATE TRIGGER update_likes_count_on_insert
  AFTER INSERT ON recipe_likes
  FOR EACH ROW EXECUTE PROCEDURE update_recipe_likes_count();

CREATE TRIGGER update_likes_count_on_delete
  AFTER DELETE ON recipe_likes
  FOR EACH ROW EXECUTE PROCEDURE update_recipe_likes_count();
```

## Enable Realtime (Optional)

If you want real-time updates for recipes, enable Realtime for these tables:

1. Go to Database > Replication
2. Enable replication for: `private_recipes`, `public_recipes`, `recipe_likes`

## Authentication Settings

1. Go to Authentication > Providers
2. Enable Email provider
3. Disable email confirmation for faster testing (optional):
   - Go to Authentication > Settings
   - Under "Email Auth", uncheck "Confirm email"
4. Anonymous sign-ins are automatically supported

## Security Notes

- The `VITE_SUPABASE_ANON_KEY` is safe to expose in your frontend - it's designed for this
- Row Level Security policies ensure users can only access their own data
- All CRUD operations are protected by RLS policies
- The anon key has limited permissions defined by your RLS policies

## Testing Your Setup

After running the SQL commands:

1. Check that all tables exist in Database > Table Editor
2. Verify RLS is enabled (shield icon should be visible on each table)
3. Test authentication by creating a user
4. Try creating/reading recipes to verify RLS policies work

## Migration from Firebase

Your Firebase data structure:
- `artifacts/{appId}/users/{userId}/recipes` → `private_recipes` table with `user_id` column
- `artifacts/{appId}/public/data/recipes` → `public_recipes` table

You'll need to export your Firebase data and import it to Supabase. Contact me if you need help with data migration scripts.
