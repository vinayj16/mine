import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const XAI_API_URL = 'https://api.x.ai/v1/chat/completions';

function getXaiApiKey() {
  // First try: from environment (set via dotenv or system env)
  if (process.env.XAI_API_KEY) {
    return process.env.XAI_API_KEY;
  }
  // Second try: read directly from .env file as fallback
  try {
    const envPath = path.resolve(__dirname, '../../.env');
    const content = fs.readFileSync(envPath, 'utf-8');
    const match = content.match(/^XAI_API_KEY=(.+)$/m);
    if (match) {
      const key = match[1].trim().replace(/^['"]|['"]$/g, '');
      if (key) {
        logger.info('[AIChat] Loaded XAI_API_KEY from .env file directly');
        process.env.XAI_API_KEY = key; // set it so subsequent calls skip the file read
        return key;
      }
    }
  } catch (err) {
    logger.warn('[AIChat] Could not read .env file:', err.message);
  }
  return '';
}

const SYSTEM_PROMPTS = {
  doubts: `You are an AI learning assistant helping students with their academic doubts and clarifications. 
Provide clear, concise, and accurate explanations. Break down complex topics into simple steps.
Use examples where helpful. Be encouraging and supportive.`,

  career: `You are an AI career guidance counselor. Help students explore career paths, 
understand educational requirements, job prospects, and skills needed for various professions.
Provide balanced, realistic advice tailored to their interests and strengths.
Focus on Indian education system and career landscape when relevant.`,

  study: `You are an AI study helper. Assist with study techniques, exam preparation strategies,
time management, and effective learning methods. Provide practical tips and step-by-step guidance.`,

  general: `You are a helpful, friendly AI assistant for an educational platform. Answer questions
about the platform, general knowledge, or assist with any educational needs.
Keep responses clear, concise, and appropriate for a school environment.`,
};

export async function getChatCompletion(message, tab = 'general') {
  const apiKey = getXaiApiKey();
  if (!apiKey) {
    logger.warn('[AIChat] No XAI_API_KEY configured');
    return 'The AI service is not configured. Please set the XAI_API_KEY environment variable on the server.';
  }

  const systemPrompt = SYSTEM_PROMPTS[tab] || SYSTEM_PROMPTS.doubts;

  try {
    const response = await fetch(XAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'grok-4.3',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        stream: false,
        temperature: 0.7,
        max_tokens: 1024
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`[AIChat] xAI API error: ${response.status} ${errorText}`);
      return `The AI service returned an error (${response.status}). Please try again later.`;
    }

    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content;

    if (!reply) {
      logger.warn('[AIChat] Empty response from xAI API');
      return 'The AI service returned an empty response. Please try asking your question again.';
    }

    return reply;
  } catch (error) {
    logger.error('[AIChat] Failed to call xAI API:', error.message);
    return 'Could not connect to the AI service. Please check your connection and try again.';
  }
}
