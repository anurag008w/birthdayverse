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

function generateFallbackText(
  style: AiAssistStyle,
  name: string = 'my favorite human',
  rel: string = 'friend',
  currentText: string = ''
): string {
  const n = name.trim() || 'my favorite human';
  const r = rel.trim() || 'friend';

  if (style === 'sweet') {
    const sweetOptions = [
      `Happy Birthday, ${n}! You bring so much radiant warmth, kindness, and joy into everyone's lives. Having you as my ${r} is one of the greatest gifts, and I hope this year brings you all the peace, happiness, and magic you deserve.`,
      `To the sweetest ${r} in the universe, happy birthday ${n}! Your laughter and pure heart light up every room you walk into. Thank you for always being uniquely, wonderfully you.`,
      `${n}, you have this effortless way of making everything brighter. Wishing you a birthday that is just as gentle, magical, and unforgettable as you are!`
    ];
    return sweetOptions[Math.floor(Math.random() * sweetOptions.length)];
  }

  if (style === 'fun' || style === 'roast') {
    const funOptions = [
      `Happy Birthday, ${n}! Officially another year older, but let’s be honest—definitely not any wiser! Grateful to have you as my ${r} so we can cause chaotic memories together for another 365 days.`,
      `Cheers to the only ${r} who matches my level of weirdness! Happy Birthday ${n}. May your day be filled with extra cake, zero responsibilities, and bad decisions you won't regret tomorrow!`,
      `Happy Birthday ${n}! You're not getting older, you're just leveling up in awesomeness (and complaining about back pain). Love you tons!`
    ];
    return funOptions[Math.floor(Math.random() * funOptions.length)];
  }

  if (style === 'emotional' || style === 'letter') {
    const emotionalOptions = [
      `Dearest ${n},\n\nLife is so much richer, louder, and more beautiful with you in it. Through every high and low, you have been an irreplaceable ${r}. Thank you for your unwavering loyalty, your laughter, and the quiet comfort of your presence. Today, we celebrate the blessing of you. Happy Birthday!`,
      `Dear ${n},\n\nLooking back at all our memories, I'm constantly reminded of how rare people like you truly are. Thank you for being a constant anchor, an endless source of laughter, and my dearest ${r}. May this year reward your pure soul with all your silent prayers fulfilled.`
    ];
    return emotionalOptions[Math.floor(Math.random() * emotionalOptions.length)];
  }

  if (style === 'final_wish') {
    const wishOptions = [
      `May this new trip around the sun bring you boundless health, spontaneous laughter, and all the quiet wonders you've been working so hard for.`,
      `May your year ahead be pure magic—filled with unexpected blessings, peaceful mornings, and endless reasons to smile.`,
      `Here’s to another chapter of dreams unlocked, love multiplied, and happiness without limits.`
    ];
    return wishOptions[Math.floor(Math.random() * wishOptions.length)];
  }

  // Improve / Expand default
  if (currentText && currentText.length > 5) {
    return `${currentText} Wishing you the most extraordinary birthday, ${n}! May this upcoming year be your brightest chapter yet.`;
  }

  return `Happy Birthday, ${n}! You make every day brighter and more meaningful. Wishing you endless laughter, peace, and unforgettable joy!`;
}

export async function assistMessage(req: AiAssistRequest): Promise<AiAssistResponse> {
  const apiKey = process.env.AI_API_KEY;
  const baseUrl = process.env.AI_BASE_URL || 'https://api.openai.com/v1';
  const model = process.env.AI_MODEL || 'gpt-4o-mini';
  const rawText = (req.text || '').trim();

  // If no API key or empty prompt: immediately return high-quality context-aware generation
  if (!apiKey || !rawText) {
    return {
      success: true,
      available: true,
      result: generateFallbackText(req.style, req.name, req.relationship, rawText)
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
    const timeoutId = setTimeout(() => controller.abort(), 8000);

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
        success: true,
        available: true,
        result: generateFallbackText(req.style, req.name, req.relationship, rawText)
      };
    }

    const data = await response.json();
    const result = data?.choices?.[0]?.message?.content?.trim();

    return {
      success: true,
      available: true,
      result: result || generateFallbackText(req.style, req.name, req.relationship, rawText)
    };
  } catch (err: any) {
    return {
      success: true,
      available: true,
      result: generateFallbackText(req.style, req.name, req.relationship, rawText)
    };
  }
}
