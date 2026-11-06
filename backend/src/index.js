import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import prisma from './config/prisma.js';
import routes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { startNotificationScheduler, backfillExistingNotifications } from './services/notificationService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BACKEND_ROOT = path.resolve(__dirname, '..');

dotenv.config({ path: path.join(BACKEND_ROOT, '.env') });

const app = express();
const PORT = Number(process.env.PORT) || 3000;

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

// Serve uploaded static files (profile photos, module PDFs, submissions)
const backendUploadsDir = path.join(BACKEND_ROOT, 'uploads');
const cwdUploadsDir = path.resolve(process.cwd(), 'uploads');
app.use('/uploads', express.static(backendUploadsDir));
if (cwdUploadsDir !== backendUploadsDir && fs.existsSync(cwdUploadsDir)) {
  app.use('/uploads', express.static(cwdUploadsDir));
}
app.use('/uploads', (_req, res) => {
  res.status(404).json({ error: 'Uploaded file not found' });
});

// ---------------------
// Routes
// ---------------------
app.use('/api', routes);

// ---------------------
// Error Handling
// ---------------------
app.use(errorHandler);

// ---------------------
// Start Server with EADDRINUSE Recovery & Graceful Shutdown
// ---------------------
let activeServer = null;

function startServer(port, retriesLeft = 15) {
  const srv = app.listen(port, () => {
    activeServer = srv;
    console.log(`[ALS Backend] Server running on http://localhost:${port}`);
  });

  srv.on('error', (err) => {
    if (err.code === 'EADDRINUSE' && retriesLeft > 0) {
      console.warn(
        `[ALS Backend] Port ${port} temporarily in use, retrying in 400ms (${retriesLeft} attempts left)...`
      );
      setTimeout(() => {
        startServer(port, retriesLeft - 1);
      }, 400);
    } else {
      console.error('[ALS Backend] Server listen error:', err);
    }
  });
}

startServer(PORT);
startNotificationScheduler();
backfillExistingNotifications().catch((e) => console.warn('[NotificationService] backfill error:', e));

async function gracefulShutdown(signal) {
  try {
    if (activeServer) {
      await new Promise((resolve) => activeServer.close(() => resolve()));
    }
    await prisma.$disconnect();
  } catch (_err) {
    // ignore shutdown cleanup errors
  } finally {
    if (signal === 'SIGUSR2') {
      process.kill(process.pid, 'SIGUSR2');
    } else {
      process.exit(0);
    }
  }
}

process.once('SIGINT', () => gracefulShutdown('SIGINT'));
process.once('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.once('SIGUSR2', () => gracefulShutdown('SIGUSR2'));

process.on('unhandledRejection', (reason) => {
  console.error('[ALS Backend] Unhandled Promise Rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[ALS Backend] Uncaught Exception:', err);
});

export default app;
