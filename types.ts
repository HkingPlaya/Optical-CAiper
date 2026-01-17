export interface ComparisonDimension {
  label: string;
  visualValue: number;
  officialValue?: number; // Optional, only if found online
  unit: string;
  visualConfidence: string;
  officialSource?: string; // E.g., "apple.com" or "amazon.in"
}

export interface RulerReading {
  dimensionLabel: string;
  startTick: string;
  endTick: string;
  calculationNote: string;
}

export interface CadFeature {
  feature: string;
  specification: string;
  source: 'Official Specs' | 'Visual Measurement';
}

export interface AnalysisResult {
  identifiedName: string; 
  isStandardProduct: boolean;
  dimensions: ComparisonDimension[];
  rulerReadings: RulerReading[]; 
  cadData: CadFeature[];
  analysisSummary: string;
}

export interface UploadedImage {
  file: File;
  previewUrl: string;
  base64Data: string; 
  mimeType: string;
}