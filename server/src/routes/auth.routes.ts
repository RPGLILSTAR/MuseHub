import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import db from '../database';
import { generateToken, authRequired } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuid } from 'uuid';

const router = Router();

const uploadDir = path.resolve(__dirname, '../../uploads/avatars');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => cb(null, `${uuid()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: (_req, file, cb) => {
  if (/^image\/(jpeg|png|gif|webp)$/.test(file.mimetype)) cb(null, true);
  else cb(new Error('只支持 jpg/png/gif/webp 格式'));
}});

router.post('/register', (req: Request, res: Response) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ success: false, message: '用户名、邮箱和密码不能为空' });
  }
  if (password.length < 6) {
    return res.status(400).json({ success: false, message: '密码至少6位' });
  }
  const existing = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email);
  if (existing) {
    return res.status(409).json({ success: false, message: '用户名或邮箱已被注册' });
  }
  const hash = bcrypt.hashSync(password, 10);
  const result = db.prepare('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)').run(username, email, hash);
  const userId = result.lastInsertRowid as number;

  const token = generateToken({ userId, role: 'user' });
  const user = db.prepare('SELECT id, username, email, avatar, bio, role, created_at FROM users WHERE id = ?').get(userId);
  res.status(201).json({ success: true, data: { token, user } });
});

router.post('/login', (req: Request, res: Response) => {
  const { account, password } = req.body;
  if (!account || !password) {
    return res.status(400).json({ success: false, message: '账号和密码不能为空' });
  }
  const user: any = db.prepare('SELECT * FROM users WHERE username = ? OR email = ?').get(account, account);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ success: false, message: '账号或密码错误' });
  }
  if (user.disabled) {
    return res.status(403).json({ success: false, message: '账号已被禁用' });
  }
  const token = generateToken({ userId: user.id, role: user.role });
  const { password_hash, disabled, ...safeUser } = user;
  res.json({ success: true, data: { token, user: safeUser } });
});

router.get('/me', authRequired, (req: Request, res: Response) => {
  const user = db.prepare('SELECT id, username, email, avatar, bio, role, created_at, updated_at FROM users WHERE id = ?').get(req.user!.userId);
  if (!user) return res.status(404).json({ success: false, message: '用户不存在' });
  res.json({ success: true, data: user });
});

router.put('/me', authRequired, (req: Request, res: Response) => {
  const { username, bio, email } = req.body;
  const userId = req.user!.userId;
  if (username) {
    const dup = db.prepare('SELECT id FROM users WHERE username = ? AND id != ?').get(username, userId);
    if (dup) return res.status(409).json({ success: false, message: '用户名已被占用' });
  }
  db.prepare(`UPDATE users SET 
    username = COALESCE(?, username), bio = COALESCE(?, bio), email = COALESCE(?, email), updated_at = CURRENT_TIMESTAMP
    WHERE id = ?`).run(username || null, bio ?? null, email || null, userId);
  const user = db.prepare('SELECT id, username, email, avatar, bio, role, created_at, updated_at FROM users WHERE id = ?').get(userId);
  res.json({ success: true, data: user });
});

router.post('/me/avatar', authRequired, upload.single('avatar'), (req: Request, res: Response) => {
  if (!req.file) return res.status(400).json({ success: false, message: '请选择头像文件' });
  const avatarUrl = `/uploads/avatars/${req.file.filename}`;
  db.prepare('UPDATE users SET avatar = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(avatarUrl, req.user!.userId);
  res.json({ success: true, data: { avatar: avatarUrl } });
});

router.put('/me/password', authRequired, (req: Request, res: Response) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) return res.status(400).json({ success: false, message: '请提供旧密码和新密码' });
  if (newPassword.length < 6) return res.status(400).json({ success: false, message: '新密码至少6位' });
  const user: any = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.user!.userId);
  if (!bcrypt.compareSync(oldPassword, user.password_hash)) {
    return res.status(401).json({ success: false, message: '旧密码错误' });
  }
  db.prepare('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(bcrypt.hashSync(newPassword, 10), req.user!.userId);
  res.json({ success: true, message: '密码修改成功' });
});

export default router;
