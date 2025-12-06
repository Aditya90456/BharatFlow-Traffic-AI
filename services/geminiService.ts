import { GoogleGenAI, Type } from "@google/genai";
import { Intersection, TrafficStats, GeminiAnalysis, Incident, GeminiIncidentAnalysis, RealWorldIntel, GroundingChunk } from "../types";

// Lazy initialization singleton
let ai: GoogleGenAI | null = null;

const SYSTEM_INSTRUCTION = `
You are BharatFlow, India's advanced AI Traffic Control System. 
Your goal is to optimize traffic flow and ensure safety in a high-density Indian metropolitan grid.
You analyze live data and provide tactical recommendations.
Traffic moves on the LEFT (Left-Hand Traffic).
Output concise, authoritative traffic directives.
Use Indian English terminology (e.g., "Junction", "Signal", "Gridlock").
`;

const getAIClient = () => {
  if (!ai) {
    const key = process.env.API_KEY;
    if (!key) {
      throw new Error("Gemini API Key is missing from environment variables.");
    }
    ai = new GoogleGenAI({ apiKey: key });
  }
  return ai;
};

export const analyzeTraffic = async (
  intersections: Intersection[],
  stats: TrafficStats,
  queueMap: Record<string, number>
): Promise<GeminiAnalysis> => {
  const congestedIntersections = intersections.filter(i => {
    const nsQueue = queueMap[`${i.id}_N`] || 0 + queueMap[`${i.id}_S`] || 0;
    const ewQueue = queueMap[`${i.id}_E`] || 0 + queueMap[`${i.id}_W`] || 0;
    return (nsQueue + ewQueue) > 8; // Threshold for being "congested"
  }).map(i => ({
      id: i.id,
      label: i.label,
      nsQueue: queueMap[`${i.id}_N`] || 0 + queueMap[`${i.id}_S`] || 0,
      ewQueue: queueMap[`${i.id}_E`] || 0 + queueMap[`${i.id}_W`] || 0
  }));
  
  const prompt = `
    Analyze this traffic snapshot.
    
    Overall Stats:
    - Congestion: ${stats.congestionLevel}%
    - Average Speed: ${stats.avgSpeed.toFixed(1)} px/f
    
    Congested Junctions:
    ${congestedIntersections.length > 0 ? congestedIntersections.map(i => `- ${i.label}: NSQ=${i.nsQueue}, EWQ=${i.ewQueue}`).join('\n') : 'None'}
    
    Task:
    1. Provide a concise, one-sentence city-wide status report.
    2. Identify up to TWO junctions that require immediate signal timing changes. 
    3. For each, suggest a new 'greenDuration' (current is 150 frames, max 300) and provide a tactical reason.
    If no changes are needed, return an empty array for suggestedChanges.
  `;

  try {
    const client = getAIClient();
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            analysis: { type: Type.STRING, description: "A one-sentence city-wide status report." },
            suggestedChanges: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  intersectionId: { type: Type.STRING },
                  newGreenDuration: { type: Type.INTEGER },
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
      return { timestamp: Date.now(), ...data };
    }
    
    throw new Error("No response text");
  } catch (error) {
    console.error("Gemini City Analysis Failed:", error);
    return {
      timestamp: Date.now(),
      analysis: "Central Command uplink unstable. Operating on local protocols.",
      suggestedChanges: []
    };
  }
};

export const analyzeIncident = async (
  incident: Incident,
  nearbyUnits: number
): Promise<GeminiIncidentAnalysis> => {
    const prompt = `
    Analyze this field incident report and provide tactical advice.
    
    Incident Details:
    - Type: ${incident.type}
    - Severity: ${incident.severity}
    - Location Description: ${incident.description}
    - Nearby Police Units: ${nearbyUnits}
    
    Provide a concise assessment and a recommended course of action.
    `;

    try {
        const client = getAIClient();
        const response = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction: SYSTEM_INSTRUCTION,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        assessment: { type: Type.STRING, description: "A brief, 2-sentence assessment of the situation's impact." },
                        recommended_action: { type: Type.STRING, description: "A clear, single-sentence action for the operator." }
                    }
                }
            }
        });

        if (response.text) {
            const data = JSON.parse(response.text);
            return { timestamp: Date.now(), ...data };
        }
        throw new Error("No response text from Gemini for incident analysis.");

    } catch (error) {
        console.error("Gemini Incident Analysis Failed:", error);
        return {
            timestamp: Date.now(),
            assessment: "Failed to connect to AI for tactical analysis.",
            recommended_action: "Dispatch nearest unit and follow standard operating procedure."
        };
    }
};

export const getRealWorldIntel = async (
  query: string,
  city: string,
  location?: { latitude: number; longitude: number }
): Promise<RealWorldIntel> => {
  let locationContext = '';
  if (location) {
    locationContext = ` The user's current location is approximately latitude ${location.latitude.toFixed(4)}, longitude ${location.longitude.toFixed(4)}.`;
  }

  const prompt = `
    Query regarding traffic conditions in ${city}, India: "${query}".
    ${locationContext}
    Provide a concise, one-paragraph summary based on real-time web search results.
    Focus on events, incidents, or conditions that would directly impact city traffic management.
  `;

  try {
    const client = getAIClient();
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }],
      },
    });
    
    const text = response.text || "No textual response received.";
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.filter(c => c.web) || [];

    return {
      timestamp: Date.now(),
      intel: text,
      sources: sources as GroundingChunk[],
    };

  } catch (error) {
    console.error("Gemini Real-World Intel Failed:", error);
    return {
      timestamp: Date.now(),
      intel: "Failed to retrieve real-world intelligence. The search-grounding module may be offline or unreachable.",
      sources: [],
    };
  }
};