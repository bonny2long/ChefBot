// server.js (Ready for Railway Deployment - ES Modules)
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import recipesRouter from './routes/recipes.js';

// Load environment variables from root .env if not in production (or if needed)
// Assuming .env is in the root of the project (one level up)
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Define a regex for allowed origins
const allowedOriginRegex = /^https:\/\/(?:[a-zA-Z0-9-]+\.)?chefbonbon\.netlify\.app$/;

// CORS middleware
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (origin && origin.startsWith('http://localhost:')) {
      return callback(null, true);
    }
    if (allowedOriginRegex.test(origin)) {
      callback(null, true);
    } else {
      const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}. Allowed pattern: ${allowedOriginRegex}`;
      callback(new Error(msg), false);
    }
  }
}));

app.use(express.json());

// Use routes
app.use('/', recipesRouter);

app.listen(PORT, () => {
  console.log(`Railway Server is running on port ${PORT}`);
});
