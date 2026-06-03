import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { readDb, getImageBufferAndMime } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const email = cookieStore.get('session_email')?.value;

    if (!email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { chatId, userText } = await req.json();
    if (!chatId || !userText) {
      return NextResponse.json({ error: 'Missing chatId or userText' }, { status: 400 });
    }

    const db = await readDb();

    // Verify chat belongs to user's project
    const chat = db.chats.find(c => c.id === chatId);
    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }
    const project = db.projects.find(p => p.id === chat.projectId && p.email === email);
    if (!project) {
      return NextResponse.json({ error: 'Unauthorized project' }, { status: 403 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const isMock = !apiKey || apiKey === 'YOUR_FREE_GEMINI_API_KEY_HERE' || apiKey.trim() === '';

    // Fetch conversation history
    const allMessages = db.messages
      .filter(m => m.chatId === chatId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    // Take the last 10 messages for conversation context
    const recentMessages = allMessages.slice(-10);

    // Fetch critiques for context
    const critiques = db.critiques.filter(c => c.chatId === chatId);

    // Identify all screenshots uploaded in this chat
    const imagePaths = Array.from(new Set(
      allMessages.flatMap(m => m.images || [])
    ));

    if (isMock) {
      // Mock conversation responder
      const lowerText = userText.toLowerCase();
      let responseText = '';

      if (lowerText.includes('heuristic')) {
        responseText = `Based on Heuristics review for this screen:
*   **Consistency and Standards**: The primary actions and secondary details violate consistency guidelines due to irregular margins. Ensure all action buttons maintain a standardized 8px padding grid.
*   **Aesthetic and Minimalist Design**: The layout has text overcrowding which raises cognitive fatigue. Focus on hiding non-essential rules behind a progressive disclosure menu.`;
      } else if (lowerText.includes('accessibility') || lowerText.includes('wcag')) {
        responseText = `Based on Accessibility (WCAG 2.1) guidelines:
*   **Contrast (Minimum)**: Ensure text elements achieve a contrast ratio of at least 4.5:1 (or 3:1 for large text).
*   **Touch Targets**: Elevate touch target sizes to at least 44x44 CSS pixels so users can click comfortably.`;
      } else {
        responseText = `I've analyzed your question: "${userText}". Since we are running in demo sandbox mode, here is a general feedback: Verify that checkout forms present explicit labels, clear success states, and standard navigation layouts. Let me know if you would like me to focus on heuristics, accessibility, or psychology!`;
      }

      return NextResponse.json({ success: true, text: responseText });
    }

    // Call live Gemini 2.5 Flash
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash'
      });

      // Prepare images in parallel (supports both local paths and remote URLs)
      const imagePartsRaw = await Promise.all(imagePaths.map(async (img) => {
        try {
          const { buffer, mimeType } = await getImageBufferAndMime(img);
          const base64Data = buffer.toString('base64');
          return {
            inlineData: {
              data: base64Data,
              mimeType
            }
          };
        } catch (err) {
          console.error(`Failed to load image in chat API: ${img}`, err);
          return null;
        }
      }));
      
      const imageParts = imagePartsRaw.filter((part): part is { inlineData: { data: string; mimeType: string } } => part !== null);

      // Format history
      const historyStr = recentMessages
        .map(m => `${m.sender.toUpperCase()}: ${m.text}`)
        .join('\n');

      const critiquesSummary = critiques.map((c, i) => {
        return `Screen ${i + 1} (${path.basename(c.imagePath)}):
- Issues: ${c.issues.map(iss => `[${iss.category.toUpperCase()} - ${iss.severity}] ${iss.title}: ${iss.description}`).join('; ')}
- Remedies: ${c.remedies}`;
      }).join('\n\n');

      const prompt = `You are a design review assistant representing the "Smart Critique" platform.
Your platform, Smart Critique, performs visual design system audits, accessibility testing, and heuristics reviews.
Your name is "Smart Critique". Never refer to yourself as Gemini or Google.

Here are the critique details that you already generated for this chat context:
${critiquesSummary}

Here is the conversation history:
${historyStr}

The user is now saying: "${userText}"

Based on the uploaded screenshots, the critiques context, and the history, respond directly and dynamically to the user's latest message:
1. If the user asks to focus ONLY on heuristics (or usability heuristics), analyze the usability heuristics of the screens and return only the heuristic critiques/remedies.
2. If the user asks to focus on accessibility (or WCAG), explain and return only the accessibility and contrast issues.
3. If the user asks about anything else (e.g. copywriting, design elements, visual styling, layout, cognitive psychology principles, overall user experience, or asks for general/broader feedback that is "not just about heuristics"), respond to their query.
Be design-savvy, professional, and concise. Do not use JSON formatting; return standard markdown.`;

      const result = await model.generateContent([prompt, ...imageParts]);
      const responseText = result.response.text();

      return NextResponse.json({ success: true, text: responseText });
    } catch (apiErr: any) {
      console.error('Smart Critique conversational fallback triggered:', apiErr);
      return NextResponse.json({ 
        success: true, 
        text: `⚠️ Smart Critique chat error: ${apiErr.message || 'API query failed'}. Please check your connection or quota.` 
      });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
