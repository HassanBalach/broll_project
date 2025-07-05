import { InferenceClient } from "@huggingface/inference";

export async function POST(request) {
  try {
    if (!process.env.HUGGINGFACE_API_KEY) {
      return Response.json(
        { error: "HUGGINGFACE_API_KEY not configured" },
        { status: 500 }
      );
    }

    const { script } = await request.json();
    
    if (!script || !script.trim()) {
      return Response.json(
        { error: "Script content is required" },
        { status: 400 }
      );
    }

    const client = new InferenceClient(process.env.HUGGINGFACE_API_KEY);

    const systemPrompt = `**TASK**
You will receive a mini VSL script. Generate 10 visually stunning, cinematic-quality b-roll prompts designed to enhance emotional and persuasive impact in a Video Sales Letter, that tightly correspond to lines in the script.

**CONSTRAINTS**
- Must return 10 b-roll prompts in the exact order 1-10. Where each object has two properties:
  "prompt": A short description of a b-roll shot.
  "scriptReference": The exact line of the script that inspired the shot.
- Each shot must work as a standalone 5-second video clip.
- Use camera language: (e.g., "drone shot", "close-up", "slow-motion", "handheld", "dolly zoom", "shallow depth of field").
- Vary the visuals across lifestyle, product, emotional reaction, environment, 3D visualizations, and metaphor.
- Ensure **direct visual or metaphorical alignment** to the script line.
- Do not wrap the JSON in markdown.

**SCRIPT**: ${script}

Return ONLY the JSON array. No text, no explanations, no markdown. Start with [ and end with ]:`;

    let brollPrompts = [];
    let attempts = 0;
    const maxAttempts = 3;

    while (brollPrompts.length < 10 && attempts < maxAttempts) {
      attempts++;
      const chatCompletion = await client.chatCompletion({
        model: "mistralai/Mistral-7B-Instruct-v0.3",
        messages: [{ role: "user", content: systemPrompt }],
        max_tokens: 2000, // Reduced to match 10 prompts
        temperature: 0.4,
        stop: ["**", "Human:", "Assistant:", "\n\n"]
      });

      let response = chatCompletion.choices[0].message.content.trim();
      console.log('Raw API response:', response.substring(0, 200) + '...');
      
      response = response.replace(/^\*\*ASSISTANT\*\*:?\s*/i, '')
                       .replace(/^Assistant:?\s*/i, '')
                       .replace(/^\*\*.*?\*\*:?\s*/i, '')
                       .replace(/```json\n?/, '')
                       .replace(/\n?```$/, '');
      
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.error(`Attempt ${attempts}: No valid JSON array found`);
        continue;
      }
      
      response = jsonMatch[0];
      
      try {
        brollPrompts = JSON.parse(response);
        
        if (!Array.isArray(brollPrompts)) throw new Error("Response is not an array");
        if (brollPrompts.length !== 10) {
          console.warn(`Attempt ${attempts}: Only ${brollPrompts.length} prompts generated`);
          continue;
        }
        
        const visualTypes = new Set();
        for (let i = 0; i < brollPrompts.length; i++) {
          const prompt = brollPrompts[i];
          if (!prompt.prompt || !prompt.scriptReference) {
            throw new Error(`Prompt ${i + 1} missing required fields`);
          }
          if (!/(drone shot|close-up|slow-motion|handheld|dolly|shallow depth|wide shot|tracking shot|pan|tilt)/i.test(prompt.prompt)) {
            throw new Error(`Prompt ${i + 1} lacks camera language`);
          }
          const type = prompt.prompt.includes("lifestyle") ? "lifestyle" :
                       prompt.prompt.includes("product") ? "product" :
                       prompt.prompt.includes("emotion") ? "emotional reaction" :
                       prompt.prompt.includes("environment") ? "environment" :
                       prompt.prompt.includes("3D") ? "3D visualization" : "metaphor";
          visualTypes.add(type);
        }
        
        if (visualTypes.size < 3) throw new Error("Insufficient variety in visual types");
        
        break;
      } catch (parseError) {
        console.error(`Attempt ${attempts}: Parse/validation error - ${parseError.message}`);
      }
    }

    if (brollPrompts.length !== 10) {
      return Response.json(
        { error: "Failed to generate exactly 10 B-roll prompts", details: `Generated ${brollPrompts.length} prompts after ${maxAttempts} attempts` },
        { status: 500 }
      );
    }

    return Response.json({ success: true, brollPrompts, promptCount: brollPrompts.length });

  } catch (error) {
    console.error("Error generating B-roll:", error);
    return Response.json({ error: "Failed to generate B-roll prompts", details: error.message }, { status: 500 });
  }
}