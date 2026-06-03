import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';

function getMimeType(filePath: string): string {
  if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
    return 'image/jpeg';
  }
  return 'image/png';
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const email = cookieStore.get('session_email')?.value;

    if (!email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { imagePath, userDescription } = await req.json();
    if (!imagePath) {
      return NextResponse.json({ error: 'Missing imagePath' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const isMock = !apiKey || apiKey === 'YOUR_FREE_GEMINI_API_KEY_HERE' || apiKey.trim() === '';

    let screenType = '';
    let suggestedBusinessGoals: string[] = [];
    let suggestedUserGoals: string[] = [];
    
    let businessGoalDefined = false;
    let extractedBusinessGoal = '';
    let userGoalDefined = false;
    let extractedUserGoal = '';

    if (isMock) {
      const lowerPath = imagePath.toLowerCase();
      
      // Parse description for business goals or user goals in mock mode
      if (userDescription) {
        const descLower = userDescription.toLowerCase();
        
        // Try to find business goal patterns
        const bizRegexes = [
          /(?:business\s+goal|biz\s+goal|business\s+objective)\s*[:=]\s*([^.\n]+)/i,
          /business\s+goal\s+is\s+to\s+([^.\n]+)/i,
          /goal\s+is\s+to\s+increase\s+([^.\n]+)/i,
          /goals\s*[:=]\s*([^.\n]+)/i
        ];

        for (const regex of bizRegexes) {
          const match = userDescription.match(regex);
          if (match && match[1]) {
            businessGoalDefined = true;
            extractedBusinessGoal = match[1].trim();
            break;
          }
        }

        // Fallback for business keywords if no explicit pattern matches
        if (!businessGoalDefined) {
          if (
            descLower.includes('business goal') || 
            descLower.includes('goal :') || 
            descLower.includes('goals :') || 
            descLower.includes('increase') || 
            descLower.includes('conversion') || 
            descLower.includes('build immediate trust') ||
            descLower.includes('adoption') ||
            descLower.includes('introduce the pocketvet')
          ) {
            businessGoalDefined = true;
            extractedBusinessGoal = userDescription;
          }
        }

        // Try to find user goal patterns
        const userRegexes = [
          /(?:user\s+goal|customer\s+goal|user\s+objective)\s*[:=]\s*([^.\n]+)/i,
          /user\s+goal\s+is\s+to\s+([^.\n]+)/i,
          /user\s+needs\s+to\s+([^.\n]+)/i
        ];

        for (const regex of userRegexes) {
          const match = userDescription.match(regex);
          if (match && match[1]) {
            userGoalDefined = true;
            extractedUserGoal = match[1].trim();
            break;
          }
        }

        // Fallback for user keywords if no explicit pattern matches
        if (!userGoalDefined) {
          if (
            descLower.includes('user goal') || 
            descLower.includes('farmer need') || 
            descLower.includes('farmers need') || 
            descLower.includes('vet instantly') || 
            descLower.includes('choose the language') || 
            descLower.includes('comfortable speaking') ||
            descLower.includes('cattle health') ||
            descLower.includes('pay securely')
          ) {
            userGoalDefined = true;
            extractedUserGoal = userDescription;
          }
        }
      }

      if (lowerPath.includes('vet') || lowerPath.includes('consult') || lowerPath.includes('nitara') || lowerPath.includes('cattle') || lowerPath.includes('r4lx')) {
        screenType = 'PocketVet Consultation Page';
        suggestedBusinessGoals = [
          'Introduce PocketVet and build immediate trust with rural farmers',
          'Drive farmers to click "Connect with Vet instantly" to start a call',
          'Clearly explain benefits (24/7 access, digital prescription) to drive adoption'
        ];
        suggestedUserGoals = [
          'Understand that they can get veterinary guidance quickly for cattle health',
          'Choose the language they are most comfortable speaking',
          'Start a consultation with a certified veterinarian without travel delays'
        ];
      } else if (lowerPath.includes('success') || lowerPath.includes('confirm') || lowerPath.includes('done') || lowerPath.includes('yrmoiys')) {
        screenType = 'Success/Confirmation Page';
        suggestedBusinessGoals = [
          'Confirm transaction completion and reduce post-checkout anxiety',
          'Encourage user satisfaction sharing or onboarding continuation',
          'Provide clear, immediate next steps to reduce customer support queries'
        ];
        suggestedUserGoals = [
          'Verify that their veterinary consultation or payment was successfully booked',
          'Know exactly how and when the vet will contact them',
          'Easily navigate back to the home screen or cattle health records'
        ];
      } else {
        screenType = 'Product Checkout Screen';
        suggestedBusinessGoals = [
          'Increase checkout conversion rate and reduce cart abandonment',
          'Promote express delivery or shipping protection plans',
          'Minimize choice overload during payment selection'
        ];
        suggestedUserGoals = [
          'Complete payment securely in under 30 seconds with saved details',
          'Select standard or express shipping option with transparent pricing',
          'Apply discount or promo code successfully before purchase'
        ];
      }
    } else {
      // Live Gemini vision pre-analysis with userDescription checking
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
          model: 'gemini-2.5-flash',
          generationConfig: {
            responseMimeType: 'application/json'
          }
        });

        const absoluteImagePath = path.join(process.cwd(), 'public', imagePath);
        if (!fs.existsSync(absoluteImagePath)) {
          return NextResponse.json({ error: 'Image not found' }, { status: 404 });
        }

        const imageBuffer = fs.readFileSync(absoluteImagePath);
        const base64Data = imageBuffer.toString('base64');
        const mimeType = getMimeType(imagePath);

        const prompt = `Analyze this user interface screenshot and the user's provided description/context:
Description: "${userDescription || 'None'}"

Identify:
1. What type of screen/page it is (e.g. "Checkout Page", "Onboarding/Signup Page").
2. 3 suggested business goals and 3 suggested user goals that a product manager would typically focus on.
3. Check the user's description:
   - Does the user already clearly specify the Business/Product Goal of this screen? If yes, set "businessGoalDefined" to true and extract/summarize it in "extractedBusinessGoal". Otherwise, set "businessGoalDefined" to false.
   - Does the user already clearly specify the User's Goal of this screen? If yes, set "userGoalDefined" to true and extract/summarize it in "extractedUserGoal". Otherwise, set "userGoalDefined" to false.

Return a JSON object matching this schema:
{
  "screenType": "string (name of the screen type, max 4 words)",
  "suggestedBusinessGoals": ["string (goal 1)", "string (goal 2)", "string (goal 3)"],
  "suggestedUserGoals": ["string (goal 1)", "string (goal 2)", "string (goal 3)"],
  "businessGoalDefined": boolean,
  "extractedBusinessGoal": "string",
  "userGoalDefined": boolean,
  "extractedUserGoal": "string"
}

Do not include markdown code block formatting. Return only raw JSON.`;

        const imagePart = {
          inlineData: {
            data: base64Data,
            mimeType
          }
        };

        const result = await model.generateContent([prompt, imagePart]);
        const text = result.response.text();
        const json = JSON.parse(text);

        screenType = json.screenType || 'Product Screenshot';
        suggestedBusinessGoals = json.suggestedBusinessGoals || [];
        suggestedUserGoals = json.suggestedUserGoals || [];
        businessGoalDefined = !!json.businessGoalDefined;
        extractedBusinessGoal = json.extractedBusinessGoal || '';
        userGoalDefined = !!json.userGoalDefined;
        extractedUserGoal = json.extractedUserGoal || '';
      } catch (err: any) {
        console.error('Gemini pre-analyze failed, falling back to static:', err);
        screenType = 'Product Screen';
        suggestedBusinessGoals = [
          'Improve visual hierarchy and checkout flow conversion',
          'Reduce form-completion friction and text field drop-off',
          'Establish brand trust through consistent UI styling'
        ];
        suggestedUserGoals = [
          'Scan the screen information and understand the next primary action',
          'Submit the required input fields with clear error validations',
          'Complete the checkout or onboarding process efficiently'
        ];
      }
    }

    return NextResponse.json({
      success: true,
      screenType,
      suggestedBusinessGoals,
      suggestedUserGoals,
      businessGoalDefined,
      extractedBusinessGoal,
      userGoalDefined,
      extractedUserGoal,
      demoMode: isMock
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
