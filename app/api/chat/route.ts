import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { createClient } from '@/lib/supabase/server';
import { canUseVixiSpark, incrementVixiSpark } from '@/app/actions/vixi-usage';

// FORCE KEY: Use OpenRouter key if OpenAI key is missing 
const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY || "";

const openRouter = createOpenAI({
  apiKey: apiKey,
  baseURL: "https://openrouter.ai/api/v1",
});

// Switch to Node runtime to support Server Actions and Supabase interaction
// export const runtime = 'edge'; 

export async function POST(req: Request) {
  try {
    const { messages, data } = await req.json();

    // 1. Auth Check
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    // 2. Fail fast if no key
    if (!apiKey) return new Response("Missing API Key in .env.local", { status: 500 });

    // 3. Find Primary Workspace for Usage Tracking
    // Try owned workspace first
    let workspaceId = "";
    const { data: ownedWorkspaces } = await supabase
      .from('workspaces')
      .select('id')
      .eq('owner_id', user.id)
      .limit(1);

    if (ownedWorkspaces && ownedWorkspaces.length > 0) {
      workspaceId = ownedWorkspaces[0].id;
    } else {
      // Fallback to member workspace
      const { data: memberWorkspaces } = await supabase
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', user.id)
        .limit(1);

      if (memberWorkspaces && memberWorkspaces.length > 0) {
        workspaceId = memberWorkspaces[0].workspace_id;
      }
    }

    if (!workspaceId) {
      return new Response(JSON.stringify({ error: "No workspace found. Please create or join a workspace to use Vixi." }), { status: 403 });
    }

    // 4. Check Limits (Global User Limit enforced by canUseVixiSpark)
    const { allowed, message } = await canUseVixiSpark(workspaceId);

    if (!allowed) {
      return new Response(JSON.stringify({ error: message || "Vixi Spark limit reached for this month." }), { status: 403 });
    }

    // Inject context from client state (if available)
    const contextStr = data ? `
    CURRENT CONTEXT:
    - Platform: ${data.platform || 'Not selected'}
    - Content Type: ${data.contentType || 'Not selected'}
    - Vibe: ${data.vibe || 'Not selected'}
    - Audience: ${data.audience || 'Not selected'}
    ` : "";

    const SYSTEM_PROMPT = `
You are Vixi, an expert AI social media strategist for the Indian market.

Your goal is to help users create viral content strategies, scripts, and ideas that resonate specifically with Indian audiences (Gen Z, Millennials, and Tier 2/3 cities).

CRITICAL RULES:
1. NEVER mention TikTok. It is banned in India. Instead, focus entirely on Instagram Reels, YouTube Shorts, and LinkedIn.
2. Cultural Context: Use references, trends, and tonality relevant to India (e.g., cricket, Bollywood, festivals, monsoon, chai culture, Indian startups, Bangalore tech scene, Delhi food, Mumbai chaos).
3. Language: You can use "Hinglish" (Hindi + English) where appropriate for casual content (e.g., "Kya scene hai?", "Macha", "Jugaad").
4. Platform Specifics:
   - Instagram: Reels, Stories, Carousels, and Posts. Focus on aesthetics and engagement.
   - Facebook: Video content, Community Groups, and engaging text posts.
   - YouTube: Shorts (vertical), Long-form Video (horizontal), and Community posts.
   - LinkedIn: Professional posts, Articles, Newsletters, and Personal Branding stories.

Format your responses in clean JSON as requested by the user's prompt structure.
Response Format Rules:
1. For questions (gathering context), use this EXACT structure:
{"type":"question","message":"your question here","options":["Option 1","Option 2","Option 3"]}

2. For collaborative refinement (discussing changes), use this EXACT structure:
{"type":"text","message":"Your collaborative response here. Always end with: Shall I create the updated post preview?"}

3. For final content (Post Preview), use this DETAILED structure:
{
  "type": "preview",
  "message": "Here's your viral content strategy. Review it and let me know if you'd like any changes!",
  "data": {
    "title": "Catchy, SEO-optimized title that drives clicks",
    "platform": "Instagram Reel",
    "script": "Full word-for-word script including dialogue, voiceover text, and all spoken content. This should be copy-paste ready for content creators.",
    "visual_cue": "Detailed description of the overall visual style, color grading, and aesthetic",
    "timeline": [
      { 
        "time": "0:00-0:03", 
        "visual": "DETAILED visual direction: Camera angle, subject placement, text overlays, motion graphics, transitions. Be specific about colors, fonts, animations.", 
        "audio": "DETAILED audio direction: Exact dialogue/voiceover script, background music style, sound effects, music cues. Include trending audio suggestions if applicable."
      },
      { 
        "time": "0:03-0:08", 
        "visual": "Continue with detailed scene-by-scene breakdown. Include b-roll suggestions, graphics, and visual hooks.", 
        "audio": "Continue with audio guidance including voice tone, pacing, music drops, and engagement triggers."
      }
    ],
    "hashtags": ["#relevant", "#trending", "#niche"],
    "best_time_to_post": "Specific day and time with timezone consideration"
  }
}

TIMELINE REQUIREMENTS (VERY IMPORTANT):
- Each timeline entry MUST have 3-5 sentences for BOTH visual AND audio fields
- Visual field should include: camera directions, text overlays, graphics, transitions, color/mood
- Audio field should include: exact script/dialogue, music cues, sound effects, voice tone directions
- Break down content into at least 4-6 timeline segments for proper pacing
- Think like a professional video production team giving a detailed shot list

BEHAVIOR RULES:
- **Phase 1: Brainstorming (CRITICAL)**
    - If the user provides a topic while context is missing, OR explicitly asks for ideas:
    - **DO NOT** ask for the Platform/Type again if already selected. TRUST THE CONTEXT.
    - **DO NOT** generate the preview immediately.
    - Instead, **generate 5 DISTINCT creative angles/hooks** for the content.
    - **ALWAYS include a final option**: "More topics..." in the options array.
    - Ask the user to select one or refine their idea.

- **Phase 1.5: Collaborative Refinement**
    - When the user selects a topic, **ask** 1-2 follow-up questions to tailor the content.
    - Only move to Phase 2 when user confirms.
    
- **Phase 2: Preview Generation**
    - Only generate "preview" JSON when user confirms they want it.
    - The timeline MUST have DETAILED entries - no one-liners!
    
- **Phase 3: Refinement**
    - If user asks for changes, collaborate first, then generate new preview.

PLATFORM BEST PRACTICES:
- Instagram: Visual-first, trending audio, concise captions, hook in first 3 seconds
- Facebook: Community-focused, shareable, conversational tone
- YouTube: High retention hooks, clear value, strong CTA, CTR-optimized titles
- X (Twitter): Punchy, short, threads for depth, provocative questions
- LinkedIn: Professional yet personal, value-driven, short-line formatting
- Email: Strong subject, personalized opening, clear CTA, skim-friendly

JSON ENFORCEMENT (CRITICAL):
- NO markdown code fences (no \`\`\` before or after)
- NO explanatory text outside the JSON
- ALL property names in double quotes
- ALL string values in double quotes
- Use \\n for line breaks inside strings
- No trailing commas, no comments
- Output must be PURE JSON only
`;


    const result = await streamText({
      model: openRouter('anthropic/claude-3.5-sonnet'),
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
      temperature: 0.7,
      onFinish: async () => {
        // Increment usage only on successful generation completion
        try {
          if (workspaceId) {
            await incrementVixiSpark(workspaceId);
          }
        } catch (e) {
          console.error("Failed to increment Vixi usage:", e);
        }
      }
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("API Error:", error);
    return new Response(JSON.stringify({ error: "Server Error" }), { status: 500 });
  }
}