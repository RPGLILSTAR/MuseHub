import { Router, Request, Response } from 'express';
import { authRequired } from '../middleware/auth';
import { streamChat, listConversations, getConversationMessages, deleteConversation } from '../services/ai.service';

const router = Router();

router.post('/chat', authRequired, async (req: Request, res: Response) => {
  const { message, conversationId } = req.body;
  if (!message?.trim()) {
    return res.status(400).json({ success: false, message: '消息不能为空' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  try {
    for await (const event of streamChat(req.user!.userId, message.trim(), conversationId)) {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    }
  } catch (err: any) {
    console.error('[AI Route] SSE error:', err.message);
    res.write(`data: ${JSON.stringify({ type: 'error', data: '服务异常，请稍后再试' })}\n\n`);
  }

  res.write('data: [DONE]\n\n');
  res.end();
});

router.get('/conversations', authRequired, (req: Request, res: Response) => {
  const list = listConversations(req.user!.userId);
  res.json({ success: true, data: list });
});

router.get('/conversations/:id/messages', authRequired, (req: Request, res: Response) => {
  const messages = getConversationMessages(req.user!.userId, req.params.id as string);
  if (!messages) return res.status(404).json({ success: false, message: '对话不存在' });
  res.json({ success: true, data: messages });
});

router.delete('/conversations/:id', authRequired, (req: Request, res: Response) => {
  const deleted = deleteConversation(req.user!.userId, req.params.id as string);
  if (!deleted) return res.status(404).json({ success: false, message: '对话不存在' });
  res.json({ success: true, message: '已删除' });
});

export default router;
