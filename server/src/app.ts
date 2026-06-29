import express from 'express';
import cors from 'cors';
import path from 'path';
import { config } from './config';
import { initDatabase } from './database';
import { cleanupTransientActivities } from './services/activity.service';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth.routes';
import movieRoutes from './routes/movie.routes';
import bookRoutes from './routes/book.routes';
import musicRoutes from './routes/music.routes';
import collectionRoutes from './routes/collection.routes';
import socialRoutes from './routes/social.routes';
import adminRoutes from './routes/admin.routes';
import recommendRoutes from './routes/recommend.routes';
import aiRoutes from './routes/ai.routes';

initDatabase();
cleanupTransientActivities();

const app = express();

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));
app.use(express.json());

app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

app.use((req, _res, next) => {
  console.log(`[REQ] ${req.method} ${req.originalUrl}`);
  next();
});

app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'MuseHub API is running', timestamp: Date.now() });
});

app.use('/api/auth', authRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/music', musicRoutes);
app.use('/api/collection', collectionRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/recommend', recommendRoutes);
app.use('/api/ai', aiRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

async function startNeteaseApi() {
  try {
    const { server } = require('NeteaseCloudMusicApi');
    const neteasePort = 3002;
    await server.serveNcmApi({ port: neteasePort, host: '127.0.0.1' });
    console.log(`🎵 NeteaseCloudMusicApi running at http://localhost:${neteasePort}`);
  } catch (err: any) {
    console.warn(`⚠️  NeteaseCloudMusicApi 启动失败: ${err.message}`);
    console.warn('   音乐模块数据将不可用，但其他模块正常工作');
  }
}

app.listen(config.port, async () => {
  console.log(`🚀 MuseHub API Server running at http://localhost:${config.port}`);
  console.log(`📡 Health check: http://localhost:${config.port}/api/health`);
  await startNeteaseApi();
  console.log('✅ All services started');
});

export default app;
