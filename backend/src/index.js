import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import routes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ---------------------
// Middleware
// ---------------------
app.use(helmet());
app.use(morgan('dev'));
app.use(
  cors({
    origin: [
      'http://localhost:5173', // admin-portal
      'http://localhost:5174', // teacher-portal
      'http://localhost:5175', // learner-portal
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ---------------------
// Routes
// ---------------------
app.use('/api', routes);

// ---------------------
// Error Handling
// ---------------------
app.use(errorHandler);

// ---------------------
// Start Server
// ---------------------
app.listen(PORT, () => {
  console.log(`[ALS Backend] Server running on http://localhost:${PORT}`);
});

export default app;
