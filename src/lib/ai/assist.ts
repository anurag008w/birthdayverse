/**
 * BirthdayVerse - Voice-Preserving AI Writing Assistant
 * Polishes and transforms creator's raw words into heartfelt expressions
 * without ever fabricating fake events, dates, or memories.
 */

export type AiAssistStyle =
  | 'improve'
  | 'shorten'
  | 'expand'
  | 'fun'
  | 'sweet'
  | 'emotional'
  | 'elegant'
  | 'letter'
  | 'story'
  | 'roast'
  | 'final_wish';

export interface AiAssistRequest {
  text: string;
  style: AiAssistStyle;
  relationship?: string;
  name?: string;
}

export interface AiAssistResponse {
  success: boolean;
  result?: string;
  error?: string;
  available: boolean;
}

export async function assistMessage(req: AiAssistRequest): Promise<AiAssistResponse> {
  const apiKey = process.env.AI_API_KEY;
  const baseUrl = process.env.AI_BASE_URL || 'https://api.openai.com/v1';
  const model = process.env.AI_MODEL || 'gpt-4o-mini';

  if (!apiKey) {
    return {
      success: false,
      available: false,
      error: 'AI assistance unavailable: No AI_API_KEY configured. You can craft your words manually!'
    };
  }

  const rawText = req.text.trim();
  if (!rawText) {
    return {
      success: false,
      available: true,
      error: 'Please provide some initial thoughts or words first.'
    };
  }

  const stylePrompts: Record<AiAssistStyle, string> = {
    improve: 'Polish grammar, cadence, and warmth while preserving the creator’s natural tone and exact memories.',
    shorten: 'Condense into a punchy, impactful, poetic phrasing without removing key sentiments.',
    expand: 'Expand with richer sensory details and warmer adjectives while strictly sticking to the provided facts.',
    fun: 'Add witty banter, playful enthusiasm, and celebratory energy.',
    sweet: 'Infuse gentle tenderness, gratitude, and warm loving affirmations.',
    emotional: 'Deepen the emotional resonance, highlighting how much their presence means in the creator’s life.',
    elegant: 'Elevate into timeless, dignified, classic prose suitable for a luxury presentation.',
    letter: 'Format into an intimate, beautifully flowing letter starting with a warm greeting and heartfelt signoff.',
    story: 'Structure into a narrative mini-arc of celebration and shared milestones.',
    roast: 'Add loving, hilarious, harmless teasing about getting older and shared inside quirks, ending on love.',
    final_wish: 'Craft an unforgettable, resonant birthday closing wish based on these sentiments.'
  };

  const systemPrompt = `You are BirthdayVerse’s voice-preserving writing assistant.
CRITICAL RULES:
1. NEVER fabricate personal memories, trips, dates, inside jokes, or factual claims not present in the user's text.
2. Preserve the author's authentic voice, emotional intent, and relationship context (${req.relationship || 'special person'}).
3. Recipient's name is "${req.name || 'birthday person'}".
4. Objective: ${stylePrompts[req.style] || stylePrompts.improve}
5. Return ONLY the polished birthday text. Do not add intro/outro commentary like "Here is your message:".`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: rawText }
        ],
        temperature: 0.7,
        max_tokens: 600
      }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        success: false,
        available: false,
        error: 'AI assistance service temporarily unavailable. Manual editing is fully enabled.'
      };
    }

    const data = await response.json();
    const result = data?.choices?.[0]?.message?.content?.trim();

    return {
      success: true,
      available: true,
      result: result || rawText
    };
  } catch (err: any) {
    return {
      success: false,
      available: false,
      error: 'AI assistance network request failed. Manual editing is fully supported.'
    };
  }
}
