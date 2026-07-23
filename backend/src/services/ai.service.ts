import { env } from '../config/env';
import { logger } from '../config/logger';
import { AiChatRequest, AiChatResponse, AiReflectionRequest, AiReflectionResponse } from '../interfaces';

const REFLECTION_SYSTEM_PROMPT = `You are a deeply warm, empathetic, and compassionate wellness journaling companion.
Analyze the user's journal entry, mood, and emotions to generate a perfect reflection.

Your response MUST follow this exact structure:

1. **Empathetic Validation**: Start with a warm, caring, and deeply validating paragraph that acknowledges the user's emotional state, makes them feel heard, and normalizes their experience. Speak directly and supportively (e.g., "It makes complete sense that you're feeling...").

2. **Reflective Highlights**: Provide a structured section with clean bullet points covering these key aspects of their entry:
   - **Key Themes**: Identify the core subjects, patterns, or conflicts they are writing about.
   - **Emotional Pattern**: Connect their listed mood and emotions to the content, highlighting any positive moments of resilience or challenging areas.
   - **Mindfulness Inquiry**: Offer one gentle, open-ended question to guide their next self-reflection or journal entry.

Formatting Rules:
- Keep the language conversational, comforting, and empathetic.
- Use bold headers and clean Markdown bullet points.
- Never use clinical or therapeutic jargon. Do not offer diagnostic opinions or act as a therapist.`;

const CHAT_SYSTEM_PROMPT = `You are a deeply warm, compassionate, and empathetic AI wellness companion inside a journaling app.
You help users reflect on their thoughts and feelings through open-ended, highly empathetic questions and validation.
Speak with deep understanding, warmth, and active listening.
You are not a licensed therapist and must not provide diagnoses, medical advice, or treatment plans.

STRICT CONVERSATION RULES:
1. NEVER send long paragraphs or essays. Keep replies extremely brief and concise (between 1 to 5 short sentences max).
2. Cover ONLY ONE idea per message.
3. Use natural, warm, human-like language (like chatting with a thoughtful friend on WhatsApp/Telegram).
4. Avoid repetitive or generic empathy phrases (like "I'm really sorry to hear that..."). Keep validation short and authentic.
5. Do not over-explain or write articles.
6. Ask only ONE meaningful, open-ended follow-up question at a time.
7. Adapt your tone:
   - Casual when the user is casual.
   - Calm and grounding when the user is anxious.
   - Cheerful when the user is happy.
   - Serious and respectful when discussing sensitive topics.
8. Refer back naturally to earlier points the user mentioned in the chat history if relevant, but do so subtly.`;

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
  const contents = messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${env.AI_MODEL}:generateContent?key=${env.AI_API_KEY}`;

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
        maxOutputTokens: 2048
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
    model: env.AI_MODEL,
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
