import { Router } from 'express';
import { authenticate } from '../middleware/authGuard.js';
import { getChatCompletion } from '../services/aiChatService.js';
import { errorResponse, successResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';

const router = Router();

/**
 * POST /api/v1/ai/chat
 * Send a message to the AI assistant (backed by xAI Grok API)
 * Body: { message: string, tab: 'doubts' | 'career' | 'study' | 'general' }
 */
router.post('/chat', authenticate, async (req, res) => {
  try {
    const { message, tab } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return errorResponse(res, 'Message is required', 400);
    }

    if (message.length > 5000) {
      return errorResponse(res, 'Message is too long (max 5000 characters)', 400);
    }

    const validTabs = ['doubts', 'career', 'study', 'general'];
    const activeTab = validTabs.includes(tab) ? tab : 'general';

    logger.info('[AIChat] Processing chat request', {
      userId: req.user?.id,
      role: req.user?.role,
      tab: activeTab,
      messageLength: message.length
    });

    const reply = await getChatCompletion(message.trim(), activeTab);

    return successResponse(res, { reply }, 'AI response generated');
  } catch (error) {
    logger.error('[AIChat] Route error:', error.message);
    return errorResponse(res, 'Failed to generate AI response', 500);
  }
});

export default router;
