import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ImageUploader from './components/ImageUploader';
import ResultsDisplay from './components/ResultsDisplay';
import { UploadedImage, AnalysisResult } from './types';
import { analyzeImages, generateBlueprint } from './services/geminiService';
import { Sparkles, AlertCircle, Compass, Download, Key, ArrowRight, ShieldCheck, ExternalLink } from 'lucide-react';

const App: React.FC = () => {
  const [apiKeySelected, setApiKeySelected] = useState(false);
  const [images, setImages] = useState<UploadedImage[]>([]);
  
  // Dimensions Analysis State
  const [loadingDimensions, setLoadingDimensions] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  
  // Blueprint Generation State
  const [loadingBlueprint, setLoadingBlueprint] = useState(false);
  const [blueprintUrl, setBlueprintUrl] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkKey = async () => {
      // Cast window to any to avoid TypeScript conflict with global AIStudio type
      const aistudio = (window as any).aistudio;
      if (aistudio) {
        const has = await aistudio.hasSelectedApiKey();
        setApiKeySelected(has);
      } else {
        // Fallback for dev environments outside of IDX/AI Studio context
        setApiKeySelected(true);
      }
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    const aistudio = (window as any).aistudio;
    if (aistudio) {
      try {
        await aistudio.openSelectKey();
        setApiKeySelected(true);
      } catch (e) {
        console.error("Key selection cancelled or failed", e);
      }
    }
  };

  const handleApiError = async (err: any) => {
    const errorMessage = err.message || "An error occurred";
    setError(errorMessage);
    
    const aistudio = (window as any).aistudio;
    // Handle race condition/expired key specifically for "Requested entity was not found"
    if (errorMessage.includes("Requested entity was not found") && aistudio) {
      setApiKeySelected(false);
      try {
        await aistudio.openSelectKey();
        setApiKeySelected(true);
        setError(null); // Clear error if re-selection is initiated
      } catch (e) {
         console.error("Re-selection failed", e);
      }
    }
  };

  const handleGenerateDimensions = async () => {
    if (images.length === 0) return;
    setLoadingDimensions(true);
    setError(null);
    setResult(null);
    try {
      const analysisData = await analyzeImages(images);
      setResult(analysisData);
    } catch (err: any) {
      await handleApiError(err);
    } finally {
      setLoadingDimensions(false);
    }
  };

  const handleGenerateBlueprint = async () => {
    if (images.length === 0) return;
    setLoadingBlueprint(true);
    setError(null);
    setBlueprintUrl(null); 
    try {
      const url = await generateBlueprint(images);
      setBlueprintUrl(url);
    } catch (err: any) {
      await handleApiError(err);
    } finally {
      setLoadingBlueprint(false);
    }
  };

  const clearAll = () => {
    setImages([]);
    setResult(null);
    setBlueprintUrl(null);
    setError(null);
  };

  if (!apiKeySelected) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
          
          {/* Left Side: Context */}
          <div className="bg-indigo-600 p-8 text-white md:w-2/5 flex flex-col justify-between">
            <div>
              <ShieldCheck className="w-12 h-12 mb-4 opacity-90" />
              <h2 className="text-2xl font-bold mb-2">Pro Features Required</h2>
              <p className="text-indigo-100 text-sm leading-relaxed">
                You have enabled the <strong>Nano Banana Pro</strong> models (Gemini 3 Pro & Imagen). These advanced tools require a billing-enabled Google Cloud Project.
              </p>
            </div>
            <div className="mt-8 text-xs text-indigo-200 border-t border-indigo-500 pt-4">
              <p>Don't have a project yet?</p>
              <a 
                href="https://console.cloud.google.com" 
                target="_blank" 
                rel="noreferrer" 
                className="flex items-center gap-1 text-white font-semibold hover:underline mt-1"
              >
                Go to Google Cloud Console <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Right Side: Action */}
          <div className="p-8 md:w-3/5 bg-white flex flex-col justify-center">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Setup Guide</h3>
            
            <ol className="list-decimal pl-5 space-y-3 text-sm text-gray-600 mb-8">
              <li>Create a <strong>New Project</strong> in Google Cloud Console.</li>
              <li>Go to <strong>Billing</strong> and link a billing account.</li>
              <li>Return here and click the button below.</li>
              <li>Select your new project from the list.</li>
            </ol>

            <button
              onClick={handleSelectKey}
              className="w-full py-3 px-6 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg"
            >
              <Key className="w-4 h-4" />
              Connect Google Cloud Project
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50 font-sans text-slate-900">
      <Sidebar />
      
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center shrink-0">
          <h2 className="text-xl font-semibold text-gray-800">Workspace</h2>
          <div className="text-sm text-gray-500">
            {images.length} image{images.length !== 1 ? 's' : ''} loaded
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 scroll-smooth">
          <div className="max-w-5xl mx-auto space-y-10 pb-20">
            
            {/* Upload Section */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-800">1. Upload Source Images</h3>
                {images.length > 0 && (
                   <button 
                   onClick={clearAll}
                   className="text-sm text-red-500 hover:text-red-700 font-medium"
                 >
                   Clear all
                 </button>
                )}
              </div>
              <ImageUploader images={images} setImages={setImages} />
            </section>

            {/* Actions Section */}
            <section className="flex flex-col sm:flex-row justify-center items-center gap-4 py-4">
              {/* Generate Dimensions Button */}
              <button
                onClick={handleGenerateDimensions}
                disabled={images.length === 0 || loadingDimensions || loadingBlueprint}
                className={`
                  relative overflow-hidden group px-8 py-4 rounded-full font-bold text-lg shadow-lg flex items-center gap-3 transition-all min-w-[280px] justify-center
                  ${images.length === 0 || loadingDimensions || loadingBlueprint
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-blue-500/30 hover:scale-105 active:scale-95'}
                `}
              >
                {loadingDimensions ? (
                  <span className="animate-pulse">Analyzing...</span>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Generate Dimensions
                  </>
                )}
              </button>

              {/* Generate Diagram Button */}
              <button
                onClick={handleGenerateBlueprint}
                disabled={images.length === 0 || loadingDimensions || loadingBlueprint}
                className={`
                  relative overflow-hidden group px-8 py-4 rounded-full font-bold text-lg shadow-lg flex items-center gap-3 transition-all min-w-[280px] justify-center
                  ${images.length === 0 || loadingDimensions || loadingBlueprint
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : 'bg-indigo-900 text-white hover:bg-indigo-800 hover:shadow-indigo-900/30 hover:scale-105 active:scale-95'}
                `}
              >
                 {loadingBlueprint ? (
                  <span className="animate-pulse">Drawing...</span>
                ) : (
                  <>
                    <Compass className="w-5 h-5" />
                    Generate Diagram
                  </>
                )}
              </button>
            </section>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3 animate-fade-in">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {/* Results Section */}
            {(result || loadingDimensions) && (
              <section className="space-y-4 animate-fade-in">
                <h3 className="text-lg font-bold text-gray-800">2. Measurement Results</h3>
                <ResultsDisplay result={result} loading={loadingDimensions} />
              </section>
            )}

            {/* Blueprint Display Section */}
            {(blueprintUrl || loadingBlueprint) && (
              <section className="space-y-4 animate-fade-in scroll-mt-10">
                <h3 className="text-lg font-bold text-gray-800">3. Technical Diagram</h3>
                <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-200 overflow-hidden relative min-h-[400px]">
                  {loadingBlueprint ? (
                     <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-10 backdrop-blur-sm">
                       <Compass className="w-12 h-12 text-indigo-900 animate-spin mb-4" />
                       <p className="text-indigo-900 font-medium">Generating Technical Blueprint...</p>
                       <p className="text-xs text-gray-500 mt-1">Rendering 2K Engineering Schematic...</p>
                     </div>
                  ) : null}
                  
                  {blueprintUrl && (
                    <div className="relative group">
                       <img 
                         src={blueprintUrl} 
                         alt="Generated Blueprint" 
                         className="w-full h-auto rounded-xl border border-slate-100"
                       />
                       <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <a 
                           href={blueprintUrl} 
                           download="gemini_blueprint.png"
                           className="bg-white/90 hover:bg-white text-gray-800 p-2 rounded-lg shadow-lg border border-gray-200 transition-transform hover:scale-105 flex items-center gap-2 text-sm font-medium"
                         >
                           <Download className="w-4 h-4" />
                           Download PNG
                         </a>
                       </div>
                    </div>
                  )}
                </div>
              </section>
            )}

          </div>
        </div>
      </main>
    </div>
  );
};

export default App;