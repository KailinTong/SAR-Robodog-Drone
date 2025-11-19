import { GoogleGenAI, Type } from "@google/genai";
import { RobotState, Task } from "../types";

// Note: In a real app, this key comes from env. 
// The prompt explicitly forbids asking for it, assuming process.env.API_KEY exists.
const apiKey = process.env.API_KEY || '';

const ai = new GoogleGenAI({ apiKey });

export const generateMissionPlan = async (
  userPrompt: string,
  robots: RobotState[]
): Promise<{ tasks: any[]; reasoning: string; safetyChecks: string[] }> => {
  
  if (!apiKey) {
    console.error("API Key not found");
    return { tasks: [], reasoning: "API Key Missing", safetyChecks: [] };
  }

  const robotContext = robots.map(r => 
    `${r.name} (${r.type}): Status=${r.status}, Battery=${r.battery}%, Position=(${r.position.x.toFixed(1)}, ${r.position.y.toFixed(1)}, ${r.position.z.toFixed(1)})`
  ).join('\n');

  const systemInstruction = `
    You are an expert Multi-Robot Coordinator for a Tunnel Search & Rescue system using ROS2, Nav2, and LOVON.
    
    Your goal is to parse natural language commands and generate structured JSON task assignments.
    
    Capabilities:
    1. LOVON Integration: If the user asks to "find" or "search for" a specific object (e.g. "backpack", "survivor"), use the 'SEARCH' task type and include the object name in the description.
    2. Decompose high-level commands (e.g., "Search sector A") into actionable tasks.
    3. Assign tasks to the most suitable robot (UAV for quick scan/high altitude, Go2 for ground details/obstacles).
    4. Enforce Safety: UAV stays > 1m altitude. Go2 max speed 0.5m/s in unknown areas.
    
    Current Robot Fleet Status:
    ${robotContext}

    Output Format:
    Return a JSON object with:
    - "reasoning": A brief text explanation of the plan.
    - "safetyChecks": An array of strings listing safety constraints applied.
    - "tasks": An array of task objects with fields: "description", "assignedTo" (robot name), "type", "priority" (HIGH/MED/LOW), and "targetCoordinates" (x, y, z).
  `;

  try {
    const model = 'gemini-2.5-flash';
    const response = await ai.models.generateContent({
      model,
      contents: userPrompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reasoning: { type: Type.STRING },
            safetyChecks: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            tasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  description: { type: Type.STRING },
                  assignedTo: { type: Type.STRING },
                  type: { type: Type.STRING, enum: ['SEARCH', 'INSPECT', 'WAIT', 'RETURN'] },
                  priority: { type: Type.STRING, enum: ['HIGH', 'MEDIUM', 'LOW'] },
                  targetCoordinates: {
                    type: Type.OBJECT,
                    properties: {
                      x: { type: Type.NUMBER },
                      y: { type: Type.NUMBER },
                      z: { type: Type.NUMBER }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");
    
    return JSON.parse(text);

  } catch (error) {
    console.error("Gemini Planning Error:", error);
    return {
      tasks: [],
      reasoning: "Failed to generate plan due to AI error.",
      safetyChecks: ["Emergency Stop triggered due to planner failure."]
    };
  }
};