import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AnalysisResult, UploadedImage } from "../types";

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    identifiedName: { type: Type.STRING, description: "The identified brand and model name of the object." },
    isStandardProduct: { type: Type.BOOLEAN, description: "True if the object is a known commercial product." },
    dimensions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          label: { type: Type.STRING, description: "Dimension name (Length, Width, Height)" },
          visualValue: { type: Type.NUMBER, description: "The value calculated strictly by reading the ruler ticks." },
          officialValue: { type: Type.NUMBER, description: "The value found in official specs online (if available)." },
          unit: { type: Type.STRING, description: "Unit (cm/mm)" },
          visualConfidence: { type: Type.STRING, description: "High/Medium/Low based on image clarity" },
          officialSource: { type: Type.STRING, description: "The domain/website where the official spec was found." }
        },
        required: ["label", "visualValue", "unit", "visualConfidence"],
      },
    },
    rulerReadings: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          dimensionLabel: { type: Type.STRING },
          startTick: { type: Type.STRING },
          endTick: { type: Type.STRING },
          calculationNote: { type: Type.STRING, description: "Describe the Major Mark + Minor Ticks counting process." }
        },
        required: ["dimensionLabel", "startTick", "endTick", "calculationNote"],
      },
    },
    cadData: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          feature: { type: Type.STRING },
          specification: { type: Type.STRING },
          source: { type: Type.STRING, enum: ["Official Specs", "Visual Measurement"] }
        },
        required: ["feature", "specification", "source"],
      },
    },
    analysisSummary: {
      type: Type.STRING,
      description: "Brief comparison of visual findings vs official specs."
    }
  },
  required: ["identifiedName", "isStandardProduct", "dimensions", "rulerReadings", "cadData", "analysisSummary"],
};

export const analyzeImages = async (images: UploadedImage[]): Promise<AnalysisResult> => {
  if (images.length === 0) {
    throw new Error("No images provided for analysis.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const imageParts = images.map((img) => ({
    inlineData: {
      mimeType: img.mimeType,
      data: img.base64Data,
    },
  }));

  const textPart = {
    text: `
      You are a Precision Metrology Engine. You must perform two distinct tasks in parallel.

      TASK 1: VISUAL MEASUREMENT (STRICT TICK COUNTING PROTOCOL)
      The user has reported inaccuracy in previous readings. You must be extremely pedantic about reading the ruler.
      
      Do NOT guess a float value like "15.7". You must derive it:
      1. **Identify the Scale**: Confirm if the ruler is CM or Inches.
      2. **Locate Start Edge**: 
         - Find exactly where the object starts. 
         - Identify the *Nearest Lower Integer Number* on the ruler (e.g., "10").
         - Count the *Minor Ticks* (mm lines) passed that number (e.g., "4 small ticks").
         - Result: 10.4.
      3. **Locate End Edge**:
         - Find exactly where the object ends (Silhoutte only! Ignore screen bezels).
         - Identify the *Nearest Lower Integer Number*.
         - Count the *Minor Ticks*.
      4. **Calculate**: End - Start = Length.

      **PARALLAX WARNING**: 
      - If the camera is at an angle, the "top" of the object might align with a different mark than the "bottom". 
      - Use the object's BASE (where it touches the table/ruler) for the most accurate measurement, not the top surface.

      TASK 2: SPECIFICATION SEARCH (Ground Truth)
      - Identify the object (Brand, Model).
      - Search Google for its official specifications/dimensions.
      - If found, populate 'officialValue'.

      OUTPUT REQUIREMENT:
      - In 'rulerReadings', your 'calculationNote' MUST follow this format: "Start: [Major]+[Ticks]mm, End: [Major]+[Ticks]mm".
      - Example: "Start: 10cm + 3mm ticks (10.3), End: 25cm + 8mm ticks (25.8). Delta: 15.5cm"
    `,
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview", 
      contents: {
        parts: [...imageParts, textPart],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        tools: [{ googleSearch: {} }], 
        thinkingConfig: {
          thinkingBudget: 16384 
        }
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response received from Gemini.");
    }

    return JSON.parse(text) as AnalysisResult;
  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    throw error;
  }
};

export const generateBlueprint = async (images: UploadedImage[], existingAnalysis?: AnalysisResult | null): Promise<string> => {
  if (images.length === 0) {
    throw new Error("No images provided for blueprint generation.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const imageParts = images.map((img) => ({
    inlineData: {
      mimeType: img.mimeType,
      data: img.base64Data,
    },
  }));

  // Inject the previously calculated dimensions to ensure consistency
  let dimensionContext = "";
  if (existingAnalysis) {
    const dimString = existingAnalysis.dimensions
      .map(d => `${d.label}: ${d.officialValue || d.visualValue}${d.unit}`)
      .join(", ");
    
    dimensionContext = `
      CRITICAL CONSTRAINT: You must use the following PRE-CALCULATED DIMENSIONS for the labels. 
      Do NOT estimate from the image again. 
      The dimensions are: [ ${dimString} ].
      The object name is: ${existingAnalysis.identifiedName}.
    `;
  } else {
    dimensionContext = "Identify dimensions from the image first, then label them.";
  }

  const prompt = `
    Create a high-quality technical blueprint and engineering schematic on a dark blue grid background.
    
    ${dimensionContext}

    Layout:
    Top-left: Front cross-section.
    Top-Right: Side view.
    Bottom-Left: Top view.
    Bottom-Right: Isometric 3D view.

    Style: Clean white lines, distinct dimension arrows, engineering font. 
    Ensure the numbers written on the blueprint MATCH the critical constraints provided above exactly.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [...imageParts, { text: prompt }]
      },
      config: {
        tools: [{ googleSearch: {} }], // Keep search enabled in case it needs to look up shape details
        imageConfig: {
          aspectRatio: "4:3",
          imageSize: "2K"
        }
      }
    });

    if (response.candidates && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }
    
    throw new Error("No image data found in the response.");
  } catch (error) {
    console.error("Blueprint Generation Failed:", error);
    throw error;
  }
};