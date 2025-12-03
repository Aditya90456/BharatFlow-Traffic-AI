import { GoogleGenAI, Type } from "@google/genai";
import { Intersection, TrafficStats, GeminiAnalysis } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
You are BharatFlow, India's advanced AI Traffic Control System. 
Your goal is to optimize traffic flow in a high-density Indian metropolitan grid.
You manage chaotic junctions, considering heavy congestion typical of cities like Bengaluru, Mumbai, and Delhi.
Traffic moves on the LEFT (Left-Hand Traffic).
Output concise, authoritative traffic directives.
Use Indian English terminology (e.g., "Junction", "Signal", "Gridlock", "Lakhs" if relevant).
`;

export const analyzeTraffic = async (
  intersections: Intersection[],
  stats: TrafficStats,
  laneQueues: Record<string, number>
): Promise<GeminiAnalysis> => {
  
  // Construct a lean payload
  const snapshot = {
    cityStatus: stats.congestionLevel > 80 ? "CRITICAL GRIDLOCK" : "FLOWING",
    avgSpeed: `${stats.avgSpeed.toFixed(1)} px/frame`,
    intersections: intersections.map(i => ({
      name: i.label,
      id: i.id,
      currentGreen: i.greenDuration,
      queues: {
        northSouth: (laneQueues[`${i.id}_N`] || 0) + (laneQueues[`${i.id}_S`] || 0),
        eastWest: (laneQueues[`${i.id}_E`] || 0) + (laneQueues[`${i.id}_W`] || 0),
      }
    }))
  };

  const prompt = `
    Analyze this traffic snapshot from the Smart City Grid.
    
    Data: ${JSON.stringify(snapshot)}
    
    Provide:
    1. A situation report identifying the worst affected junctions (max 2 sentences).
    2. Recommended signal adjustments (frames). Base: 150. Max: 300 (for heavy junctions like Silk Board). Min: 60.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            analysis: { type: Type.STRING },
            suggestedChanges: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  intersectionId: { type: Type.STRING },
                  newGreenDuration: { type: Type.NUMBER },
                  reason: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });

    if (response.text) {
      const data = JSON.parse(response.text);
      return {
        timestamp: Date.now(),
        analysis: data.analysis,
        suggestedChanges: data.suggestedChanges
      };
    }
    
    throw new Error("No response text");
  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    return {
      timestamp: Date.now(),
      analysis: "Connection to Central Command Server interrupted. Local fallback active.",
      suggestedChanges: []
    };
  }
};