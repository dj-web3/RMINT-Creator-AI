
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
    7. imageKeyword: A specific keyword for searching an image of this RESULT.`,
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
          imageKeyword: { type: Type.STRING }
        },
        required: ["resultName", "actionVerb", "duration", "chefCategory", "quantity", "actionType", "imageKeyword"]
      }
    }
  });

  return JSON.parse(response.text || '{}');
};

export const analyzeCookingVideo = async (videoBase64: string, mimeType: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { data: videoBase64, mimeType } },
        { text: "Analyze this cooking video and extract a structured culinary plan. Provide: 1. Ingredients list (accurate images keywords). 2. Flowchart nodes (positions x,y distributed logically in a sequence). 3. Connections with specific action verbs. 4. Method steps with durations and chef categories. Ensure all coordinates (x,y) are spaced out (e.g., x increases for each subsequent step). Return ONLY JSON." }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          ingredients: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                name: { type: Type.STRING },
                image: { type: Type.STRING },
                quantity: { type: Type.STRING }
              }
            }
          },
          nodes: {
             type: Type.ARRAY,
             items: {
               type: Type.OBJECT,
               properties: {
                 id: { type: Type.STRING },
                 type: { type: Type.STRING },
                 label: { type: Type.STRING },
                 quantity: { type: Type.STRING },
                 image: { type: Type.STRING },
                 duration: { type: Type.NUMBER },
                 x: { type: Type.NUMBER },
                 y: { type: Type.NUMBER }
               }
             }
          },
          edges: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                sourceId: { type: Type.STRING },
                targetId: { type: Type.STRING },
                action: { type: Type.STRING },
                iconType: { type: Type.STRING }
              }
            }
          },
          steps: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                stepNumber: { type: Type.NUMBER },
                action: { type: Type.STRING },
                ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
                durationMinutes: { type: Type.NUMBER },
                startTime: { type: Type.STRING },
                chef: { type: Type.STRING },
                resultLabel: { type: Type.STRING }
              }
            }
          }
        }
      }
    }
  });

  return JSON.parse(response.text || '{}');
};
