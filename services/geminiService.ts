
import { GoogleGenAI, Type } from "@google/genai";

export const processChefPrompt = async (prompt: string, currentContext: any) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Analyze the following chef's command: "${prompt}". 
    Based on these selected ingredients: ${JSON.stringify(currentContext.selectedItems)}.
    Output a JSON object that describes:
    1. resultName: The name of the combined result.
    2. actionVerb: The specific action (grinding, mixing, etc).
    3. duration: Suggested duration in minutes.
    4. chefCategory: Suggested chef (Sous, Station, Trainee, Junior).
    5. quantity: Resulting quantity.
    6. actionType: Categorize action as 'cooking' (heat), 'resting' (chill/temp), 'waiting' (time), 'baking' (oven), or 'default'.
    7. imageKeyword: A specific keyword for searching an image of this RESULT.
    8. subSteps: An array of detailed instructions to reach this result (e.g. ["Chop ingredients", "Grind to paste"]). Each item should be an object: {instruction: string, duration?: number}.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          resultName: { type: Type.STRING },
          actionVerb: { type: Type.STRING },
          duration: { type: Type.NUMBER },
          chefCategory: { type: Type.STRING },
          quantity: { type: Type.STRING },
          actionType: { type: Type.STRING },
          imageKeyword: { type: Type.STRING },
          subSteps: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                instruction: { type: Type.STRING },
                duration: { type: Type.NUMBER }
              },
              required: ["instruction"]
            }
          }
        },
        required: ["resultName", "actionVerb", "duration", "chefCategory", "quantity", "actionType", "imageKeyword", "subSteps"]
      }
    }
  });

  return JSON.parse(response.text || '{}');
};

export const analyzeCookingVideo = async (videoBase64: string, mimeType: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  // Upgraded to gemini-3-pro-preview for complex multimodal analysis task
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: {
      parts: [
        { inlineData: { data: videoBase64, mimeType } },
        { text: `Analyze this cooking video and extract a structured culinary plan.` }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          meta: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              yield: { type: Type.STRING },
              domain_logic: { type: Type.STRING }
            },
            required: ["title", "yield", "domain_logic"]
          },
          inventory_initialization: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                name: { type: Type.STRING },
                qty: { type: Type.STRING },
                state: { type: Type.STRING }
              },
              required: ["id", "name", "qty", "state"]
            }
          },
          process_trace: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                step_id: { type: Type.INTEGER },
                timestamp: { type: Type.STRING },
                operation: { type: Type.STRING },
                inputs: { type: Type.ARRAY, items: { type: Type.STRING } },
                action: { type: Type.STRING },
                output_state: { type: Type.STRING },
                note: { type: Type.STRING },
                visual_cue: { type: Type.STRING }
              },
              required: ["step_id", "timestamp", "operation", "inputs", "action", "output_state", "note", "visual_cue"]
            }
          }
        },
        required: ["meta", "inventory_initialization", "process_trace"]
      }
    }
  });

  return JSON.parse(response.text || '{}');
};
