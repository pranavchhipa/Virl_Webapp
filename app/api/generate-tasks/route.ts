import { createOpenAI } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

const openrouter = createOpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY,
});

export async function POST(req: Request) {
    try {
        console.log('[generate-tasks] Starting...');

        if (!process.env.OPENROUTER_API_KEY) {
            console.error('[generate-tasks] OPENROUTER_API_KEY is not set');
            return new Response(JSON.stringify({ error: 'API key not configured' }), { status: 500 });
        }

        const { projectId, projectTitle, projectDescription } = await req.json();
        console.log('[generate-tasks] Project:', projectId, projectTitle);

        if (!projectId) {
            return new Response(JSON.stringify({ error: 'Project ID required' }), { status: 400 });
        }

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }

        const prompt = `
You are Vixi, an expert Viral Video Producer and Social Media Content Strategist.

PROJECT CONTEXT:
- Project Name: ${projectTitle}
- Brief: ${projectDescription || 'No description provided - generate general viral video production tasks.'}

YOUR MISSION:
Generate 5 highly specific, actionable production tasks tailored to make this video project go viral.
Each task should be unique and cover different aspects of video production:
1. One task about content/scripting strategy
2. One task about visual/cinematography
3. One task about talent/casting/collaboration
4. One task about audio/music/sound
5. One task about distribution/optimization

GUIDELINES:
- Be specific to the project theme, not generic
- Focus on Instagram Reels, YouTube Shorts, YouTube, and Facebook
- Do NOT mention TikTok (not available in target market)
- Focus on what makes content go viral
- Make titles punchy and action-oriented (max 50 chars)
- Descriptions should be 1-2 sentences with specific details
`;

        const { object } = await generateObject({
            model: openrouter('anthropic/claude-3.5-sonnet'),
            schema: z.object({
                tasks: z.array(z.object({
                    title: z.string().describe('Short, action-oriented task title'),
                    description: z.string().describe('Specific details with actionable steps')
                })).length(5)
            }),
            prompt: prompt,
        });

        // Batch insert tasks - no assigned_to so they show Vixi badge
        const tasksToInsert = (object as any).tasks.map((t: any) => ({
            project_id: projectId,
            title: t.title,
            description: t.description,
            status: 'idea'
        }));

        const { error } = await supabase.from('tasks').insert(tasksToInsert);

        if (error) {
            console.error('DB Insert Error:', error);
            throw error;
        }

        return new Response(JSON.stringify({ success: true, count: tasksToInsert.length }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error("[generate-tasks] API error:", error?.message || error);
        console.error("[generate-tasks] Full error:", JSON.stringify(error, null, 2));
        return new Response(JSON.stringify({
            error: 'Failed to generate tasks',
            details: error?.message || 'Unknown error'
        }), { status: 500 });
    }
}
