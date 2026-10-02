import path from 'path';
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
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.use(morgan('dev'));
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded static files (profile photos, etc.)
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

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
