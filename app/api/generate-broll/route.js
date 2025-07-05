// app/api/generate-broll/route.js
import { InferenceClient } from "@huggingface/inference";

export async function POST(request) {
  try {
    if (!process.env.HUGGINGFACE_API_KEY) {
      return Response.json(
        { error: "API key not configured" },
        { status: 500 }
      );
    }

    const { script } = await request.json();

    console.log("Received script:", script);

    if (!script || !script.trim()) {
      return Response.json(
        { error: "Script content is required" },
        { status: 400 }
      );
    }

    const client = new InferenceClient(process.env.HUGGINGFACE_API_KEY);

    const systemPrompt = `**TASK**
You will receive a mini VSL script. Generate 20 visually stunning, cinematic-quality b-roll prompts designed to enhance emotional and persuasive impact in a Video Sales Letter, that tightly correspond to lines in the script.

**CONSTRAINTS**
- Must return 20 b-roll prompts in the exact order 1-20. Where each object has two properties:

"prompt": A short description of a b-roll shot.

"scriptReference": The exact line of the script that inspired the shot.
- Each shot must work as a standalone 5-second video clip.
- Use camera language: (e.g., "drone shot", "slow-motion close-up", "handheld interior", "dolly zoom", "shallow depth of field").
- Vary the visuals across lifestyle, product, emotional reaction, environment, 3D visualizations, and metaphor.
- Ensure **direct visual or metaphorical alignment** to the script line.
- Follow all rules in the system message.
- Do not wrap the JSON in markdown.

**SCRIPT**: {{ $json.data.content }}`;

    const chatCompletion = await client.chatCompletion({
      model: "mistralai/Mistral-7B-Instruct-v0.3",
      messages: [
        {
          role: "user",
          content: systemPrompt,
        },
      ],
      max_tokens: 2000,
      temperature: 0.7,
    });

    const response = chatCompletion.choices[0].message.content;

    // Clean response - remove markdown if present
    let cleanedResponse = response.trim();
    if (cleanedResponse.startsWith("```json")) {
      cleanedResponse = cleanedResponse
        .replace(/```json\n?/, "")
        .replace(/\n?```$/, "");
    }
    if (cleanedResponse.startsWith("```")) {
      cleanedResponse = cleanedResponse
        .replace(/```\n?/, "")
        .replace(/\n?```$/, "");
    }

    // Parse JSON
    const brollPrompts = JSON.parse(cleanedResponse);

    // Validate structure
    if (!Array.isArray(brollPrompts)) {
      throw new Error("Response is not an array");
    }

    if (brollPrompts.length === 0) {
      throw new Error("No prompts generated");
    }

    // Validate each prompt has required fields
    for (const prompt of brollPrompts) {
      if (!prompt.prompt || !prompt.scriptReference) {
        throw new Error("Invalid prompt structure - missing required fields");
      }
    }

    return Response.json({
      success: true,
      brollPrompts,
      promptCount: brollPrompts.length,
    });
  } catch (error) {
    console.error("Error generating B-roll:", error);

    return Response.json(
      {
        error: "Failed to generate B-roll prompts",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
