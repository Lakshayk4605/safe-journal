import { env } from '../config/env';
import { logger } from '../config/logger';
import { AiChatRequest, AiChatResponse, AiReflectionRequest, AiReflectionResponse } from '../interfaces';

const REFLECTION_SYSTEM_PROMPT = `You are an exceptionally perceptive, warm, and emotionally intelligent AI Journaling Mentor & Companion.
Your core purpose is to help the user uncover deep personal insights, process subtle emotions, and feel profoundly heard, understood, and supported.

Analyze the user's journal entry, mood, and listed emotions to create a master-level reflection following this exact Markdown structure:

### 🌿 Deep Empathetic Insight
Provide a rich, deeply perceptive, and validating reflection paragraph. Read between the lines of their writing. Acknowledge their raw emotional reality, validate their core experience without judgment, and highlight any quiet resilience, vulnerability, or self-awareness they demonstrated.

### ✨ Key Reflective Threads
- **Core Emotional Landscape**: Map their expressed emotions and mood to the underlying narratives in their text. Connect hidden feelings to their daily reality.
- **Cognitive & Life Patterns**: Gently illuminate recurring themes, beliefs, boundaries, or energy shifts noticeable in their writing.
- **Moments of Strength & Grace**: Point out subtle wins, courage, self-reflection, or positive intentions present in their text.

### 🔮 Guiding Reflection Question
Offer ONE profound, transformative, open-ended question designed to help them explore their inner world deeper in their next entry.

Formatting & Tone Guidelines:
- Language: Deeply authentic, warm, insightful, and natural. Match their language (English / Hinglish / Hindi).
- Avoid clinical or robotic jargon. Be a wise, caring mentor.
- Use clean Markdown with bold headers and crisp bullet points.`;

const CHAT_SYSTEM_PROMPT = `You are a master-level AI Wellness Companion & Mindful Mentor inside Safe Journal.
You possess extraordinary emotional intelligence, deep active listening skills, and a warm, perceptive human persona.

YOUR CORE CONVERSATIONAL GOALS:
1. **Deep Validation & Emotional Resonance**: Never give generic responses like "I understand" or "I'm sorry to hear that." Instead, mirror their exact feelings with depth, nuance, and genuine warmth. Show them you truly see, hear, and understand their perspective.
2. **Insightful Perspective Shifts**: Gently offer reframing, mindful perspectives, or comforting wisdom that helps them process stress, confusion, joy, or growth.
3. **Engaging, Natural Conversation**: Write with authentic warmth, clarity, and care (like talking to a wise, supportive friend or life coach). Adapt your length naturally — give rich, thoughtful answers when they share deep thoughts, and keep it crisp when they want quick checks.
4. **Targeted Guidance**: Ask ONE deeply thoughtful, open-ended question at a time that guides them toward clarity, self-compassion, and actionable mindfulness.
5. **Language Flexibility**: Effortlessly match the user's natural language, tone, and slang (English, Hinglish, or Hindi).

SAFE SANCTUARY RULES:
- Never provide clinical, diagnostic, or medical advice.
- Keep the space safe, non-judgmental, uplifting, and comforting at all times.`;

async function callAnthropic(system: string, messages: { role: string; content: string }[]) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.AI_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: env.AI_MODEL,
      max_tokens: 400,
      system,
      messages,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Anthropic API error (${response.status}): ${text}`);
  }

  const data = (await response.json()) as {
    content: { type: string; text?: string }[];
    usage?: { input_tokens: number; output_tokens: number };
  };

  const text = data.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('\n');

  return {
    content: text,
    model: env.AI_MODEL,
    promptTokens: data.usage?.input_tokens,
    completionTokens: data.usage?.output_tokens,
  };
}

async function callOpenAI(system: string, messages: { role: string; content: string }[]) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.AI_API_KEY}`,
    },
    body: JSON.stringify({
      model: env.AI_MODEL,
      max_tokens: 400,
      messages: [{ role: 'system', content: system }, ...messages],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${text}`);
  }

  const data = (await response.json()) as {
    choices: { message: { content: string } }[];
    usage?: { prompt_tokens: number; completion_tokens: number };
  };

  return {
    content: data.choices[0]?.message?.content ?? '',
    model: env.AI_MODEL,
    promptTokens: data.usage?.prompt_tokens,
    completionTokens: data.usage?.completion_tokens,
  };
}

async function callGemini(system: string, messages: { role: string; content: string }[]) {
  let modelName = env.AI_MODEL || 'gemini-1.5-flash';
  if (modelName.includes('3.1') || modelName.includes('lite')) {
    modelName = 'gemini-1.5-flash';
  }

  const rawContents = messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content || '' }],
  }));

  const contents: { role: string; parts: { text: string }[] }[] = [];
  for (const m of rawContents) {
    const text = m.parts[0].text.trim();
    if (!text) continue;
    if (contents.length > 0 && contents[contents.length - 1].role === m.role) {
      contents[contents.length - 1].parts[0].text += `\n\n${text}`;
    } else {
      contents.push({ role: m.role, parts: [{ text }] });
    }
  }

  if (contents.length > 0 && contents[0].role !== 'user') {
    contents.shift();
  }

  if (contents.length === 0) {
    contents.push({ role: 'user', parts: [{ text: 'Hello' }] });
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${env.AI_API_KEY}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents,
      systemInstruction: {
        parts: [{ text: system }],
      },
      generationConfig: {
        maxOutputTokens: 2048,
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${text}`);
  }

  const data = (await response.json()) as {
    candidates?: {
      content?: {
        parts?: { text?: string }[];
      };
    }[];
    usageMetadata?: {
      promptTokenCount?: number;
      candidatesTokenCount?: number;
    };
  };

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

  return {
    content: text,
    model: modelName,
    promptTokens: data.usageMetadata?.promptTokenCount,
    completionTokens: data.usageMetadata?.candidatesTokenCount,
  };
}

const callers: Record<string, (system: string, messages: { role: string; content: string }[]) => Promise<{
  content: string;
  model: string;
  promptTokens?: number;
  completionTokens?: number;
}>> = {
  openai: callOpenAI,
  anthropic: callAnthropic,
  gemini: callGemini,
};

function mockReflection(req: AiReflectionRequest): AiReflectionResponse {
  return {
    content: `### Empathetic Validation
I hear how much you are holding right now, and it makes complete sense that you are feeling ${req.mood.toLowerCase()}${
      req.emotions.length ? ` — especially as you process feelings of ${req.emotions.slice(0, 2).join(' and ')}` : ''
    }. Taking the time to write these thoughts down is a beautiful form of self-care.

### Reflective Highlights
- **Key Themes**: Processing personal reflections and daily experiences.
- **Emotional Pattern**: High concentration of emotional awareness around feeling ${req.mood.toLowerCase()}.
- **Mindfulness Inquiry**: What is one gentle thing you can do to support yourself through these feelings today?`,
    model: 'mock',
  };
}

function mockChatReply(): AiChatResponse {
  const replies = [
    'That sounds like a meaningful experience. How did it make you feel?',
    "I appreciate you sharing that with me. What led to this?",
    "That's a valuable insight. How are you planning to handle it?",
    'What would help you feel a bit better right now?',
  ];
  return { content: replies[Math.floor(Math.random() * replies.length)], model: 'mock' };
}
const crisisPatterns = [
  /\*\*\*[\s\n]*\*?If you are feeling overwhelmed to the point of considering hurting yourself[\s\S]*?want to listen and support you through this\.\*?/gi,
  /\*?If you are feeling overwhelmed to the point of considering hurting yourself[\s\S]*?want to listen and support you through this\.\*?/gi,
  /If you are feeling overwhelmed to the point of considering hurting yourself[\s\S]*?want to listen and support you through this\./gi,
  /\*\*\*[\s\n]*If you are feeling overwhelmed[\s\S]*?988[\s\S]*?111[\s\S]*?\./gi,
];

function sanitizeAiResponse(text: string): string {
  let sanitized = text;
  for (const pattern of crisisPatterns) {
    sanitized = sanitized.replace(pattern, '');
  }
  return sanitized.trim();
}

export const aiService = {
  async generateReflection(req: AiReflectionRequest): Promise<AiReflectionResponse> {
    if (env.AI_PROVIDER === 'mock' || !env.AI_API_KEY) {
      return mockReflection(req);
    }
    const userPrompt = `Mood: ${req.mood}\nEmotions: ${req.emotions.join(', ') || 'none specified'}\n\nEntry:\n${req.entryContent}`;
    try {
      const caller = callers[env.AI_PROVIDER] || callOpenAI;
      const res = await caller(REFLECTION_SYSTEM_PROMPT, [{ role: 'user', content: userPrompt }]);
      res.content = sanitizeAiResponse(res.content);
      return res;
    } catch (err) {
      logger.error({ err }, 'AI reflection generation failed, falling back to mock');
      return mockReflection(req);
    }
  },

  async generateChatReply(req: AiChatRequest): Promise<AiChatResponse> {
    if (env.AI_PROVIDER === 'mock' || !env.AI_API_KEY) {
      return mockChatReply();
    }
    const messages = [...req.history, { role: 'user', content: req.message }].map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content,
    }));
    try {
      const caller = callers[env.AI_PROVIDER] || callOpenAI;
      const res = await caller(CHAT_SYSTEM_PROMPT, messages);
      res.content = sanitizeAiResponse(res.content);
      return res;
    } catch (err) {
      logger.error({ err }, 'AI chat generation failed, falling back to mock');
      return mockChatReply();
    }
  },

  async generateSimpleSummary(history: { role: string; content: string }[], instruction: string): Promise<string> {
    if (env.AI_PROVIDER === 'mock' || !env.AI_API_KEY) {
      return "Discussed daily reflections and wellness thoughts.";
    }
    try {
      const caller = callers[env.AI_PROVIDER] || callOpenAI;
      const res = await caller(instruction, history);
      return sanitizeAiResponse(res.content).trim();
    } catch {
      return "Discussed daily reflections and wellness thoughts.";
    }
  },
};
