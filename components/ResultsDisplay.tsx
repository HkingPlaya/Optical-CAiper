import React from 'react';
import { AnalysisResult } from '../types';
import { FileText, Cuboid, Activity, Download, Ruler, ArrowRight, Globe, ScanSearch, CheckCircle2, AlertTriangle, Link } from 'lucide-react';

interface ResultsDisplayProps {
  result: AnalysisResult | null;
  loading: boolean;
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ result, loading }) => {
  if (loading) {
    return (
      <div className="w-full h-96 flex flex-col items-center justify-center bg-white rounded-2xl border border-dashed border-gray-300 animate-pulse">
        <Activity className="w-10 h-10 text-blue-500 mb-4 animate-spin" />
        <h3 className="text-lg font-medium text-gray-700">Analyzing & Searching...</h3>
        <p className="text-sm text-gray-500 mt-2">Running dual-mode analysis: Visual Metrology + Spec Search.</p>
        <div className="mt-4 flex gap-2 text-xs text-blue-600 font-mono bg-blue-50 px-3 py-1 rounded-full">
           <span className="animate-bounce">Scanning Ruler</span>
           <span className="animate-bounce delay-100">...</span>
           <span className="animate-bounce delay-200">Google Search</span>
           <span className="animate-bounce delay-300">...</span>
           <span className="animate-bounce delay-500">Comparing</span>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="w-full h-96 flex flex-col items-center justify-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400">
        <Cuboid className="w-12 h-12 mb-3 opacity-20" />
        <p className="font-medium">No measurements generated yet.</p>
        <p className="text-sm">Upload images and click "Generate Dimensions" to start.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Product Identity Card */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 relative overflow-hidden">
        <div className={`absolute top-0 right-0 p-4 opacity-10 ${result.isStandardProduct ? 'text-green-500' : 'text-blue-500'}`}>
           {result.isStandardProduct ? <Globe className="w-24 h-24" /> : <Ruler className="w-24 h-24" />}
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1">
              <ScanSearch className="w-3.5 h-3.5" /> Identified Object
            </h3>
            {result.isStandardProduct && (
              <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Standard Product
              </span>
            )}
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{result.identifiedName}</h2>
          <p className="text-gray-600 leading-relaxed text-sm border-t border-gray-100 pt-3 mt-1">
            {result.analysisSummary}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Comparison Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
            <h3 className="font-bold text-gray-800">Dimensions Comparison</h3>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-6 py-3 font-medium">Dimension</th>
                <th className="px-6 py-3 font-medium text-blue-600">Visual Measure</th>
                <th className="px-6 py-3 font-medium text-green-600">Official Spec</th>
                <th className="px-6 py-3 font-medium text-right">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {result.dimensions.map((dim, idx) => {
                const hasDiscrepancy = dim.officialValue && Math.abs(dim.visualValue - dim.officialValue) > 0.5; // 0.5 unit tolerance
                
                return (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{dim.label}</td>
                    
                    {/* Visual Column */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-blue-600 font-mono font-bold text-base">
                          {dim.visualValue} <span className="text-xs font-normal text-gray-400">{dim.unit}</span>
                        </span>
                        {hasDiscrepancy && (
                          <span className="text-[10px] text-orange-500 flex items-center gap-1 mt-1">
                            <AlertTriangle className="w-3 h-3" /> Differs
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Official Column */}
                    <td className="px-6 py-4">
                      {dim.officialValue ? (
                        <span className="text-green-600 font-mono font-bold text-base bg-green-50 px-2 py-1 rounded-md">
                          {dim.officialValue} <span className="text-xs font-normal text-green-400">{dim.unit}</span>
                        </span>
                      ) : (
                        <span className="text-gray-300 italic text-xs">Not found</span>
                      )}
                    </td>

                    {/* Source Column */}
                    <td className="px-6 py-4 text-right">
                      {dim.officialSource ? (
                        <div className="flex items-center justify-end gap-1 text-gray-500 hover:text-blue-600 transition-colors cursor-pointer" title={`Source: ${dim.officialSource}`}>
                          <span className="text-xs font-medium max-w-[80px] truncate">{dim.officialSource}</span>
                          <Link className="w-3 h-3" />
                        </div>
                      ) : (
                        <span className="text-xs text-gray-300">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Visual Evidence Section */}
          {result.rulerReadings && result.rulerReadings.length > 0 && (
            <div className="border-t border-gray-100 bg-slate-50 p-4">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1">
                <Ruler className="w-3 h-3" /> Visual Calculation Logic
              </h4>
              <div className="space-y-2">
                {result.rulerReadings.map((reading, idx) => (
                  <div key={idx} className="text-xs flex flex-wrap items-center gap-2 bg-white p-2 rounded border border-slate-200 shadow-sm">
                    <span className="font-semibold text-slate-700 w-16">{reading.dimensionLabel}:</span>
                    <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">Start: {reading.startTick}</span>
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                    <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">End: {reading.endTick}</span>
                    <span className="text-blue-600 font-mono ml-auto font-medium">
                      ({reading.calculationNote})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* CAD Ready Data */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
            <h3 className="font-bold text-gray-800">CAD Feature Specs</h3>
            <button className="p-1 hover:bg-gray-200 rounded text-gray-500 transition-colors" title="Copy to clipboard">
              <Download className="w-4 h-4" />
            </button>
          </div>
          <div className="overflow-x-auto flex-1">
             <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-6 py-3 font-medium">Feature</th>
                <th className="px-6 py-3 font-medium">Specification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {result.cadData.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3 font-medium text-gray-900">{item.feature}</td>
                  <td className="px-6 py-3 font-mono text-gray-600 flex items-center justify-between">
                    {item.specification}
                    {item.source === 'Official Specs' && <Globe className="w-3 h-3 text-green-400 opacity-50" />}
                  </td>
                </tr>
              ))}
              {result.cadData.length === 0 && (
                <tr>
                    <td colSpan={2} className="px-6 py-8 text-center text-gray-400 italic">No specific feature details extracted.</td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsDisplay;