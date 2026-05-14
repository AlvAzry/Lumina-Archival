import { GoogleGenAI } from "@google/genai";

export const getGeminiModel = async (prompt: string, model: string = "gemini-3-flash-preview") => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not defined");
  }
  const ai = new GoogleGenAI({ apiKey });
  return ai.models.generateContent({ 
    model,
    contents: prompt
  });
};

export async function analyzeDamage(imageUrl: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return "API Key missing";

  const ai = new GoogleGenAI({ apiKey });
  
  // Convert URL to base64 if it's not already, or handle accordingly.
  // In a real app, you'd fetch the image. Here we might just pass the URL if it's accessible.
  // But Gemini usually expects base64 for inlineData.
  
  const prompt = `
    Analyze this archival photograph for digital conservation.
    Damage Profile:
    - Identify fungal colonization zones (clusters, irregular patterns).
    - Estimate percentage of information loss.
    - Identify key subjects obscured (faces, architectural details).
    - Suggest content-aware inpainting strategy focusing on neighbor pixel interpolation.
    - Prioritize archival authenticity (no fabrications).
    
    Output a structured report in Markdown.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          { text: prompt },
          // Note: In actual implementation, we'd need to provide the image data here.
          // For now, this is a placeholder for the logic.
        ]
      }
    });

    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error generating damage report.";
  }
}
