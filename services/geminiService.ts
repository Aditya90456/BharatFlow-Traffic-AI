import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { Intersection, TrafficStats, GeminiAnalysis, Incident, GeminiIncidentAnalysis, RealWorldIntel, GroundingChunk, AiSearchAction, Car, CongestedJunctionInfo, JunctionAnalysisResult } from "../types";

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
  congestedIntersections: CongestedJunctionInfo[],
  stats: TrafficStats,
): Promise<GeminiAnalysis> => {
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

export const analyzeJunction = async (junctionInfo: CongestedJunctionInfo): Promise<JunctionAnalysisResult> => {
    const prompt = `
      You are an AI traffic controller for the "${junctionInfo.label}" junction.
      Analyze the following live data and provide a tactical recommendation.
      
      Live Data:
      - North-South Queue: ${junctionInfo.nsQueue} vehicles
      - East-West Queue: ${junctionInfo.ewQueue} vehicles
      
      Tasks:
      1.  **analysis**: Provide a one-sentence analysis of the current situation at this specific junction.
      2.  **recommendation**: State a clear, single action. Examples: "Extend North-South green light", "Prioritize East-West flow", "Maintain current signal timing", "Slightly reduce North-South green time".
      3.  **reason**: Give a concise, one-sentence rationale for your recommendation.
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
                        analysis: { type: Type.STRING, description: "One-sentence analysis of the junction's status." },
                        recommendation: { type: Type.STRING, description: "A clear, single action to take." },
                        reason: { type: Type.STRING, description: "A concise, one-sentence rationale for the action." }
                    },
                    required: ["analysis", "recommendation", "reason"]
                }
            }
        });

        if (response.text) {
            return JSON.parse(response.text);
        }
        throw new Error("No response text from Gemini for junction analysis.");

    } catch (error) {
        console.error("Gemini Junction Analysis Failed:", error);
        return {
            analysis: "Failed to connect to AI for tactical analysis.",
            recommendation: "Operator vigilance advised.",
            reason: "The AI analysis module is currently unreachable. Follow standard operating procedure."
        };
    }
};


export const explainAiSuggestion = async (
  analysisInput: CongestedJunctionInfo[],
  suggestion: { intersectionId: string; newGreenDuration: number; reason: string },
  stats: TrafficStats,
): Promise<string> => {
  const targetJunction = analysisInput.find(j => j.id === suggestion.intersectionId);

  const prompt = `
    You are BharatFlow, an AI Traffic Control System.
    Your previous analysis of the traffic grid resulted in the following suggestion:
    - Junction: ${targetJunction?.label || suggestion.intersectionId}
    - Action: Change green light duration to ${suggestion.newGreenDuration} frames.
    - Your stated reason was: "${suggestion.reason}"

    The overall grid stats at the time were:
    - Congestion: ${stats.congestionLevel}%
    - Average Speed: ${stats.avgSpeed.toFixed(1)} px/f

    The specific data for the affected junction was:
    - North-South Queue: ${targetJunction?.nsQueue} vehicles
    - East-West Queue: ${targetJunction?.ewQueue} vehicles

    Task:
    Explain your reasoning for this specific suggestion in simple, clear terms for a human operator.
    Focus on the intended outcome and the "if-then" logic.
    Keep the explanation to 2-3 sentences.
  `;

  try {
    const client = getAIClient();
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      }
    });
    
    return response.text || "Unable to provide an explanation at this time.";

  } catch (error) {
    console.error("Gemini Suggestion Explanation Failed:", error);
    return "Explanation service is currently unavailable. Please try again later.";
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
  intersectionLabels: string[],
  location?: { latitude: number; longitude: number }
): Promise<RealWorldIntel> => {
  let locationContext = '';
  if (location) {
    locationContext = ` The user's current location is approximately latitude ${location.latitude.toFixed(4)}, longitude ${location.longitude.toFixed(4)}.`;
  }

  const prompt = `
    You are an AI assistant for a traffic control center.
    The user's query is about traffic conditions in ${city}, India: "${query}".
    ${locationContext}
    The known intersections in this city sector are: ${intersectionLabels.join(', ')}.

    Your task has two parts:
    1.  Provide a concise, one-paragraph summary for the operator based on real-time web search results. Focus on events, incidents, or conditions that would directly impact city traffic management.
    2.  After your summary, if and only if your search finds a specific, verifiable incident (like a major accident or significant roadwork) that is clearly located at one of the known intersections listed above, you MUST add a special data line at the very end of your response. This line must be on a new line and follow this exact format:
        INCIDENT::[INTERSECTION_LABEL]::[TYPE]::[DESCRIPTION]
        - [INTERSECTION_LABEL] must be an exact match from the provided list.
        - [TYPE] must be either ACCIDENT or CONSTRUCTION.
        - [DESCRIPTION] must be a very short summary (e.g., "Multi-vehicle collision").
        
    Example of a full response with an incident:
    Several roads in the city center are experiencing delays due to a planned marathon. Traffic is being rerouted around the main stadium, and public transport is advised. Expect delays of up to 30 minutes in the central district until 2 PM.
    INCIDENT::Hebbal Flyover::CONSTRUCTION::Lane closed for flyover maintenance.

    If no specific incident is found at a known intersection, do not add the INCIDENT line.
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

export const interpretSearchQuery = async (
  query: string,
  intersections: Intersection[],
  cars: Car[],
  incidents: Incident[],
): Promise<AiSearchAction[] | null> => {
  const selectObjectDeclaration: FunctionDeclaration = {
    name: 'select_object',
    description: 'Selects a specific object (intersection, vehicle, or road) on the map by its name or ID.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        type: { type: Type.STRING, enum: ['INTERSECTION', 'CAR', 'ROAD'] },
        name_or_id: { type: Type.STRING, description: 'The name (e.g., "Silk Board") or ID (e.g., "INT-0-0") of the object to select.' },
      },
      required: ['type', 'name_or_id'],
    },
  };

  const findMostCongestedDeclaration: FunctionDeclaration = {
    name: 'find_most_congested_junction',
    description: 'Finds and highlights the intersection with the highest current traffic congestion.',
    parameters: { type: Type.OBJECT, properties: {} },
  };

  const findAllUnitsDeclaration: FunctionDeclaration = {
    name: 'find_all_units_of_type',
    description: 'Finds and highlights all vehicles of a specific type (e.g., "police", "bus"), including broken down vehicles.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        type: { type: Type.STRING, enum: ['CAR', 'AUTO', 'BUS', 'POLICE', 'BROKEN_DOWN'] },
      },
      required: ['type'],
    },
  };

  const findIncidentsBySeverityDeclaration: FunctionDeclaration = {
    name: 'find_incidents_by_severity',
    description: 'Finds and highlights all incidents of a specific severity level (LOW, MEDIUM, or HIGH).',
    parameters: {
      type: Type.OBJECT,
      properties: {
        severity: { type: Type.STRING, enum: ['LOW', 'MEDIUM', 'HIGH'] },
      },
      required: ['severity'],
    },
  };

  const prompt = `
    You are the natural language interface for the BharatFlow traffic command center.
    The user has entered the following command: "${query}"

    The current simulation contains the following entities:
    - ${intersections.length} intersections with labels like: ${intersections.slice(0, 3).map(i => i.label).join(', ')}...
    - ${cars.length} vehicles, including types: CAR, AUTO, BUS, POLICE. Some might be broken down.
    - ${incidents.length} incidents with severities: LOW, MEDIUM, HIGH.

    Based on the user's command, call the appropriate function tool.
  `;
  
  try {
    const client = getAIClient();
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ functionDeclarations: [selectObjectDeclaration, findMostCongestedDeclaration, findAllUnitsDeclaration, findIncidentsBySeverityDeclaration] }],
      }
    });

    if (response.functionCalls) {
      return response.functionCalls as AiSearchAction[];
    }

    return null;

  } catch (error) {
    console.error("Gemini Search Interpretation Failed:", error);
    return null;
  }
};