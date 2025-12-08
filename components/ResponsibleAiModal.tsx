import React, { useState } from 'react';
import { GeminiAnalysis, CongestedJunctionInfo, TrafficStats } from '../types';
import { XMarkIcon, ShieldCheckIcon, LightBulbIcon, ChatBubbleLeftRightIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { explainAiSuggestion } from '../services/geminiService';

interface ResponsibleAiModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysis: GeminiAnalysis | null;
  analysisInput: CongestedJunctionInfo[] | null;
  stats: TrafficStats;
}

const SuggestionExplainer: React.FC<{
  suggestion: GeminiAnalysis['suggestedChanges'][0];
  analysisInput: CongestedJunctionInfo[];
  stats: TrafficStats;
}> = ({ suggestion, analysisInput, stats }) => {
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleExplain = async () => {
    if (isLoading || explanation) return;
    setIsLoading(true);
    const result = await explainAiSuggestion(analysisInput, suggestion, stats);
    setExplanation(result);
    setIsLoading(false);
  };

  return (
    <div className="mt-2 pl-4 border-l-2 border-surfaceHighlight">
      {!explanation && !isLoading && (
        <button onClick={handleExplain} className="flex items-center gap-1.5 text-xs text-accent hover:text-cyan-300 transition-colors">
          <SparklesIcon className="w-3 h-3" />
          Explain Rationale
        </button>
      )}
      {isLoading && <p className="text-xs text-gray-500 animate-pulse">AI is thinking...</p>}
      {explanation && (
        <div className="text-xs text-gray-400 mt-1 p-2 bg-background rounded-md animate-in fade-in">
          <p><strong className="text-accent">AI Rationale:</strong> {explanation}</p>
        </div>
      )}
    </div>
  );
};

export const ResponsibleAiModal: React.FC<ResponsibleAiModalProps> = ({ isOpen, onClose, analysis, analysisInput, stats }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-surface rounded-2xl border border-border w-full max-w-3xl max-h-[90vh] flex flex-col glass">
        <header className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <ShieldCheckIcon className="w-6 h-6 text-green-400" />
            <h2 className="text-lg font-tech font-bold text-white">AI Responsibility & Ethics</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-gray-500 hover:bg-surfaceHighlight hover:text-white transition-colors">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </header>

        <main className="flex-1 p-6 overflow-y-auto space-y-6">
          {/* Principles Section */}
          <section>
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-3">Core Principles</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-3 bg-surfaceHighlight rounded-lg">
                <div className="font-bold text-lg text-accent">1.</div>
                <div>
                  <h4 className="font-bold text-white">Human Oversight</h4>
                  <p className="text-xs text-gray-400">The AI provides suggestions, but the human operator always has the final authority to approve and implement changes.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-surfaceHighlight rounded-lg">
                <div className="font-bold text-lg text-accent">2.</div>
                <div>
                  <h4 className="font-bold text-white">Transparency</h4>
                  <p className="text-xs text-gray-400">All data used by the AI for its analysis is clearly presented, ensuring the operator understands the 'why' behind each suggestion.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Analysis Breakdown Section */}
          <section>
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-3">Latest Grid Analysis Breakdown</h3>
            <div className="space-y-4 p-4 rounded-lg bg-background border border-border">
              <div>
                <h4 className="text-xs font-mono text-purple-400 mb-2">INPUT: Data provided to AI</h4>
                {analysisInput && analysisInput.length > 0 ? (
                  <ul className="text-sm text-gray-300 font-mono list-disc list-inside">
                    {analysisInput.map(j => (
                      <li key={j.id}>{j.label}: NSQ={j.nsQueue}, EWQ={j.ewQueue}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500 italic">No significant congestion data was fed to the AI in the last analysis.</p>
                )}
              </div>

              <div className="border-t border-border my-4"></div>

              <div>
                <h4 className="text-xs font-mono text-green-400 mb-2">OUTPUT: AI-generated analysis & suggestions</h4>
                {analysis ? (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                        <ChatBubbleLeftRightIcon className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0"/>
                        <p className="text-sm text-gray-200 italic">"{analysis.analysis}"</p>
                    </div>
                    {analysis.suggestedChanges.length > 0 ? (
                        analysis.suggestedChanges.map(suggestion => (
                           <div key={suggestion.intersectionId} className="p-3 bg-surfaceHighlight rounded-lg">
                                <div className="flex items-start gap-3">
                                    <LightBulbIcon className="w-4 h-4 text-yellow-400 mt-1 flex-shrink-0"/>
                                    <div>
                                        <p className="text-sm font-bold text-white">Suggestion for <span className="text-accent">{analysisInput?.find(j => j.id === suggestion.intersectionId)?.label}</span></p>
                                        <p className="text-xs text-gray-400">{suggestion.reason}</p>
                                    </div>
                                </div>
                                <SuggestionExplainer
                                  suggestion={suggestion}
                                  analysisInput={analysisInput || []}
                                  stats={stats}
                                />
                           </div>
                        ))
                    ) : <p className="text-sm text-gray-500 italic">No operational changes were suggested.</p>}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">No analysis has been run yet.</p>
                )}
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};
