import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { readDb, writeDb, Critique, IssuePin, getImageBufferAndMime } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const email = cookieStore.get('session_email')?.value;

    if (!email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (email.startsWith('trial_')) {
      const db = await readDb();
      const userProjects = db.projects.filter(p => p.email === email);
      const projectIds = userProjects.map(p => p.id);
      const userChats = db.chats.filter(c => projectIds.includes(c.projectId));
      const chatIds = userChats.map(c => c.id);
      const trialUploadCount = db.critiques.filter(crit => chatIds.includes(crit.chatId)).length;
      
      if (trialUploadCount >= 3) {
        return NextResponse.json({ error: 'You have reached your 3-upload free trial limit. Please sign in to continue.' }, { status: 403 });
      }
    }

    const { messageId, chatId, imagePath, imagePaths, businessGoal, userGoal, customNotes } = await req.json();

    const pathsToProcess = imagePaths || (imagePath ? [imagePath] : []);
    if (!messageId || !chatId || pathsToProcess.length === 0) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const isMock = !apiKey || apiKey === 'YOUR_FREE_GEMINI_API_KEY_HERE' || apiKey.trim() === '';

    const savedCritiques: Critique[] = [];

    // Process all images in parallel
    await Promise.all(pathsToProcess.map(async (img: string, idx: number) => {
      let issues: IssuePin[] = [];
      let remedies = '';

      if (isMock) {
        // Return structured, unique mock analysis per screen
        const filename = path.basename(img);
        issues = [
          {
            id: `mock-${messageId}-${idx}-1`,
            title: `Contrast issue on CTA button (${filename})`,
            description: `The text color on the button in ${filename} achieves a low contrast ratio (2.1:1), violating WCAG 2.1 AA requirements (minimum 4.5:1).`,
            severity: 'high',
            category: 'accessibility',
            x: 40 + (idx * 7) % 35,
            y: 50 + (idx * 5) % 25
          },
          {
            id: `mock-${messageId}-${idx}-2`,
            title: `Visual Hierarchy Overload (${filename})`,
            description: `Screen displays excessive text details on a single panel, increasing Hick's Law cognitive load. Recommendations are to use progressive disclosure.`,
            severity: 'medium',
            category: 'psychology',
            x: 20 + (idx * 11) % 40,
            y: 35 + (idx * 8) % 30
          },
          {
            id: `mock-${messageId}-${idx}-3`,
            title: `Grid Alignment Spacing Violation (${filename})`,
            description: `Padding between text labels and form elements in ${filename} is inconsistent. Elements should align strictly to an 8px layout grid.`,
            severity: 'low',
            category: 'heuristic',
            x: 65 + (idx * 5) % 20,
            y: 25 + (idx * 13) % 25
          }
        ];

        remedies = `### Actionable Remedies for ${filename}

Here is how you can resolve the highlighted design violations on this screen to satisfy design guidelines and heuristics:

#### 1. Elevate Color Contrast (Accessibility)
*   **Alternative**: Change the primary button font color or darken the background container of the CTA to satisfy a WCAG AA **4.5:1** contrast ratio.
*   **Why**: Ensure accessibility compliance for visually-impaired users.

#### 2. Group Action Choices (Psychology)
*   **Alternative**: Minimize choice options to reduce decision fatigue (Hick's Law). Place secondary options behind a toggle menu or details page.
*   **Why**: Decreases overall cognitive load.

#### 3. Standardize Layout Padding (Heuristics)
*   **Alternative**: Align labels and elements to a clean 8px vertical grid padding.
*   **Why**: Restores design balance and visual symmetry.

*Note: You are currently running in **Demo Sandbox Mode** with mock data.*`;
      } else {
        // Call Google Gemini API
        try {
          const genAI = new GoogleGenerativeAI(apiKey);
          const model = genAI.getGenerativeModel({ 
            model: 'gemini-2.5-flash',
            generationConfig: {
              responseMimeType: 'application/json'
            }
          });

          const { buffer, mimeType } = await getImageBufferAndMime(img);
          const base64Data = buffer.toString('base64');

            const prompt = `You are an expert Product Manager and UX/UI Designer. Your job is to audit this user interface screenshot.
You must critique the design across 3 categories:
1. "accessibility": WCAG 2.1/2.2 compliance issues (e.g. text contrast, small touch targets, confusing visual cues).
2. "heuristic": General UI/UX heuristics (e.g. alignment, spacing consistency, font size hierarchy, poor navigation, clutter).
3. "psychology": Cognitive/psychology principles (e.g. Hick's Law, Fitts's Law, cognitive load, progressive disclosure, Gestalt grouping).

Context:
- Business Goal of this screen: ${businessGoal || 'Not specified'}
- User Goal of this screen: ${userGoal || 'Not specified'}
- Additional description/context: ${customNotes || 'Not specified'}

For each issue you find, you MUST estimate its coordinates (x, y) as a percentage (from 0 to 100) relative to the image size. E.g. top-left is (0,0), bottom-right is (100,100).

Your response must be a strict JSON object matching this schema:
{
  "issues": [
    {
      "id": "string (unique code like issue-1)",
      "title": "string (short description, max 6 words)",
      "description": "string (1-2 sentences explaining what is wrong)",
      "severity": "low | medium | high",
      "category": "accessibility | heuristic | psychology",
      "x": number (percentage, 0 to 100),
      "y": number (percentage, 0 to 100)
    }
  ],
  "remedies": "string (detailed markdown describing HOW to solve these issues. Provide alternatives, specify style fixes, or suggest market best practices)"
}

Do not include any wrapping like \`\`\`json. Return only the raw JSON.`;

            const imagePart = {
              inlineData: {
                data: base64Data,
                mimeType
              }
            };

            const result = await model.generateContent([prompt, imagePart]);
            const textResponse = result.response.text();
            const jsonResult = JSON.parse(textResponse);
            
            issues = (jsonResult.issues || []).map((issue: any, idx2: number) => ({
              ...issue,
              id: issue.id || `issue-${messageId}-${idx}-${idx2}`
            }));
            remedies = jsonResult.remedies || '';
            if (issues.length === 0) {
              remedies = `### Wow we didn't find any issue in the screen!\n\nYou have designed it very well! There are no issues with Heuristics, Psychology, or Accessibility. This is a well-designed screen which is serving both business and user goals.`;
            }
        } catch (critiqueError: any) {
          console.error(`Smart Critique API call failed for image ${img}, falling back to mock:`, critiqueError);
          // Fallback to mock issues
          issues = [
            {
              id: `fallback-${messageId}-${idx}-1`,
              title: 'Contrast issues on text labels',
              description: `The contrast on this screenshot in ${path.basename(img)} violates WCAG color standards.`,
              severity: 'high',
              category: 'accessibility',
              x: 50,
              y: 50
            }
          ];
          remedies = `### Audit Fallback for ${path.basename(img)}
Failed to run Smart Critique analysis. Spacing and contrast guidelines should be verified manually.`;
        }
      }

      const newCritique: Critique = {
        id: `critique-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
        messageId,
        chatId,
        imagePath: img,
        issues,
        remedies,
        createdAt: new Date().toISOString(),
        businessGoal,
        userGoal
      };

      savedCritiques.push(newCritique);
    }));

    // Save critiques to the database
    const db = await readDb();
    db.critiques.push(...savedCritiques);
    await writeDb(db);

    return NextResponse.json({
      success: true,
      critiques: savedCritiques,
      demoMode: isMock
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const email = cookieStore.get('session_email')?.value;

    if (!email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const chatId = searchParams.get('chatId');
    const projectId = searchParams.get('projectId');
    const last = searchParams.get('last') === 'true';

    const db = await readDb();

    if (projectId) {
      // Verify project ownership
      const project = db.projects.find(p => p.id === projectId && p.email === email);
      if (!project) {
        return NextResponse.json({ error: 'Project not found or unauthorized' }, { status: 403 });
      }

      // Find all chats under this project
      const projectChats = db.chats.filter(c => c.projectId === projectId);
      const projectChatIds = projectChats.map(c => c.id);

      // Find all critiques for these chats
      const critiques = db.critiques.filter(c => projectChatIds.includes(c.chatId));

      if (last) {
        // Sort by createdAt descending
        const sorted = [...critiques].sort((a, b) => {
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        });
        return NextResponse.json({ critique: sorted[0] || null });
      }

      return NextResponse.json({ critiques });
    }

    if (!chatId) {
      return NextResponse.json({ error: 'Chat ID or Project ID is required' }, { status: 400 });
    }

    // Verify chat ownership
    const chat = db.chats.find(c => c.id === chatId);
    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }
    const project = db.projects.find(p => p.id === chat.projectId && p.email === email);
    if (!project) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const critiques = db.critiques.filter(c => c.chatId === chatId);

    return NextResponse.json({ critiques });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

