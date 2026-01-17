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
          calculationNote: { type: Type.STRING }
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
      You are a Dual-Mode Metrology Engine. You must perform two distinct tasks in parallel for every request.

      TASK 1: VISUAL MEASUREMENT (Mandatory)
      - Ignore any knowledge of the product's "real" size.
      - Look at the RULER in the image.
      - Count the ticks visually (Start Tick -> End Tick).
      - Calculate the 'visualValue'.
      - Record the 'startTick' and 'endTick' in 'rulerReadings'.

      CRITICAL EDGE DETECTION RULES (Avoiding "Bezel Error"):
      1. OUTERMOST SILHOUETTE ONLY: Measure the absolute physical extremities of the device. 
         - DO NOT measure to the edge of a screen, a display panel, a button, or a decorative insert.
         - EXAMPLE: If a power bank has a purple casing and a black screen, the edge is the PURPLE CASING, not where the black screen starts. 
         - CAUTION: Contrast changes (e.g., black screen vs purple case) are NOT object edges. You must find where the object meets the background table/mat.
      
      2. ALIGNMENT CHECK: 
         - Look at the Start Tick: Is it aligned with the casing tip or an internal feature? (Must be casing tip).
         - Look at the End Tick: Is it aligned with the casing tail or an internal feature? (Must be casing tail).
      
      3. MULTI-IMAGE SYNTHESIS: 
         - If multiple images are provided, use the one with the most "Top-Down" (orthogonal) view to read the ticks.
         - If close-up shots of the ends are provided, use them for higher precision.

      TASK 2: SPECIFICATION SEARCH (If Standard Product)
      - Identify the object (Brand, Model).
      - Search Google for its official specifications/dimensions.
      - If found, populate 'officialValue' and 'officialSource'.
      - If NOT found (custom object), leave 'officialValue' empty.

      COMPARISON:
      - Your output must include BOTH values if available. 
      - Do not overwrite the visual measurement with the official spec. We want to see the difference.
      - In 'analysisSummary', specifically mention if you detected any discrepancy between the visual edges and the official size (e.g. "Visual measurement of casing matched official specs, ignoring the screen bezel").
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

export const generateBlueprint = async (images: UploadedImage[]): Promise<string> => {
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

  const prompt = `
    Create a high-quality technical blueprint and engineering schematic on a dark blue grid background. 
    
    1. Identify the object. 
    2. Search for its OFFICIAL dimensions if it is a standard product.
    3. Use these OFFICIAL dimensions for the labels in the drawing to ensure maximum accuracy.

    Layout:
    Top-left: Front cross-section.
    Top-Right: Side view.
    Bottom-Left: Top view.
    Bottom-Right: Isometric 3D view.

    Style: Clean white lines, distinct dimension arrows, engineering font.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [...imageParts, { text: prompt }]
      },
      config: {
        tools: [{ googleSearch: {} }],
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