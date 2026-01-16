import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { NextRequest, NextResponse } from 'next/server';

const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY || "";

const openRouter = createOpenAI({
    apiKey: apiKey,
    baseURL: "https://openrouter.ai/api/v1",
});

export async function POST(req: NextRequest) {
    try {
        const { text, projectName } = await req.json();

        if (!apiKey) {
            return NextResponse.json({ error: "Missing API Key" }, { status: 500 });
        }

        if (!text || text.trim().length < 10) {
            return NextResponse.json({ tags: [] });
        }

        const prompt = `Analyze this project brief and extract 3-5 relevant tags/categories. Return ONLY a JSON array of lowercase tag strings, nothing else.

Project Name: ${projectName || 'Untitled'}

Project Brief:
${text}

Example output: ["marketing", "video production", "social media", "q3 campaign"]

Return ONLY the JSON array, no other text:`;

        const result = await generateText({
            model: openRouter('anthropic/claude-3.5-sonnet'),
            prompt,
            temperature: 0.3,
            maxTokens: 150,
        });

        // Parse the JSON array from response
        const responseText = result.text.trim();

        // Try to extract JSON array from response
        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            const tags = JSON.parse(jsonMatch[0]);
            // Clean and validate tags
            const cleanedTags = tags
                .filter((t: any) => typeof t === 'string' && t.length > 0)
                .map((t: string) => t.toLowerCase().trim())
                .slice(0, 5);

            return NextResponse.json({ tags: cleanedTags });
        }

        return NextResponse.json({ tags: [] });
    } catch (error) {
        console.error("Tag generation error:", error);
        return NextResponse.json({ tags: [] });
    }
}
