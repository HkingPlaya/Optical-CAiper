import React from 'react';
import { Ruler, Camera, Box, Info, Cpu, CheckCircle2, Zap, Layers, Files, ScanLine } from 'lucide-react';

const Sidebar: React.FC = () => {
  return (
    <aside className="w-full md:w-80 bg-slate-900 text-slate-50 flex-shrink-0 flex flex-col h-auto md:h-screen sticky top-0 overflow-y-auto border-r border-slate-800">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl shadow-lg shadow-blue-900/20">
            <Ruler className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">AI Caliper</h1>
            <p className="text-xs text-slate-400 font-medium">Optical Measurement Tool</p>
          </div>
        </div>

        {/* Model Status Indicator */}
        <div className="mb-8 p-4 bg-slate-800/60 rounded-xl border border-slate-700/60 backdrop-blur-sm">
           <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
             <Cpu className="w-3.5 h-3.5" /> Active Models
           </h2>
           <div className="space-y-3">
             <div className="flex items-center justify-between group">
               <span className="text-sm text-slate-300 font-medium group-hover:text-white transition-colors">Analysis</span>
               <span className="flex items-center gap-1.5 text-emerald-400 font-semibold text-[10px] uppercase tracking-wide bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20">
                 <Zap className="w-3 h-3 fill-current" /> Gemini 3 Pro
               </span>
             </div>
             <div className="flex items-center justify-between group">
               <span className="text-sm text-slate-300 font-medium group-hover:text-white transition-colors">Blueprint</span>
               <span className="flex items-center gap-1.5 text-indigo-400 font-semibold text-[10px] uppercase tracking-wide bg-indigo-500/10 px-2 py-1 rounded-md border border-indigo-500/20">
                 <CheckCircle2 className="w-3 h-3" /> Banana Pro
               </span>
             </div>
           </div>
        </div>

        <div className="space-y-8">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
              <Info className="w-3.5 h-3.5" /> Instructions for Accuracy
            </h2>
            <ul className="space-y-4 text-sm text-slate-300">
               <li className="flex gap-3 group">
                <div className="mt-0.5 p-1 bg-slate-800 rounded-md group-hover:bg-blue-600/20 group-hover:text-blue-400 transition-colors">
                  <Files className="w-4 h-4 text-green-400" /> 
                </div>
                <span className="leading-relaxed">
                  <strong className="text-green-400">MULTIPLE PHOTOS:</strong> Providing 2-3 images significantly improves accuracy. Include close-ups of where the object starts and ends on the ruler.
                </span>
              </li>
              <li className="flex gap-3 group">
                <div className="mt-0.5 p-1 bg-slate-800 rounded-md group-hover:bg-blue-600/20 group-hover:text-blue-400 transition-colors">
                  <ScanLine className="w-4 h-4" />
                </div>
                <span className="leading-relaxed">
                  <strong className="text-slate-200">Outer Edges Only:</strong> The AI looks for the silhouette. Ensure the background has good contrast so the object's true edge is visible.
                </span>
              </li>
              <li className="flex gap-3 group">
                <div className="mt-0.5 p-1 bg-slate-800 rounded-md group-hover:bg-blue-600/20 group-hover:text-blue-400 transition-colors">
                  <Camera className="w-4 h-4" />
                </div>
                <span className="leading-relaxed">
                  <strong className="text-slate-200">Orthographic View:</strong> Take the photo from directly above (90° angle) to avoid parallax errors.
                </span>
              </li>
              <li className="flex gap-3 group">
                <div className="mt-0.5 p-1 bg-slate-800 rounded-md group-hover:bg-blue-600/20 group-hover:text-blue-400 transition-colors">
                  <Layers className="w-4 h-4" />
                </div>
                <span className="leading-relaxed">
                  <strong className="text-slate-200">Ruler Placement:</strong> Place the ruler ON TOP or flush against the object if possible.
                </span>
              </li>
            </ul>
          </div>

          <div className="p-4 bg-gradient-to-br from-yellow-500/10 to-transparent rounded-xl border border-yellow-500/20">
            <h3 className="font-semibold text-yellow-500 text-sm mb-1">Pro Tip</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              If the object has a screen (like a phone or power bank), ensure the AI measures the casing, not the screen bezel. High contrast backgrounds help here.
            </p>
          </div>
        </div>
      </div>
      
      <div className="mt-auto p-6 border-t border-slate-800 bg-slate-900/50">
        <p className="text-[10px] text-slate-500 text-center uppercase tracking-widest font-semibold">
          Powered by Gemini 3
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;