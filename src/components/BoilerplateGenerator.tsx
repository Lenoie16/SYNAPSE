import React, { useState } from 'react';
import { BoilerplateConfig } from '@/types';
import { Icons } from '@/components/Icons';


export const BoilerplateGenerator: React.FC = () => {
  const [config, setConfig] = useState<BoilerplateConfig>({
    stack: 'Next.js',
    features: {
      auth: true,
      db: false,
      tailwind: true,
      docker: false
    }
  });

  const [generatedPreview, setGeneratedPreview] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const toggleFeature = (key: keyof typeof config.features) => {
    setConfig(prev => ({
      ...prev,
      features: { ...prev.features, [key]: !prev.features[key] }
    }));
  };

  const handleGenerate = async () => {
    setLoading(true);
    setGeneratedPreview("AI feature is currently disabled.");
    // const result = await generateBoilerplateStructure(config);
    // setGeneratedPreview(result);
    setLoading(false);
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([generatedPreview || "Empty Project"], {type: 'text/markdown'});
    element.href = URL.createObjectURL(file);
    element.download = "project-structure.md";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="h-full grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="bg-hack-surface p-6 rounded-lg border border-hack-border">
        <h2 className="text-2xl font-bold mb-6 text-hack-secondary flex items-center gap-2">
          <Icons.Zap className="w-6 h-6" /> Stack Config
        </h2>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-bold mb-2 text-hack-muted">Tech Stack</label>
            <div className="grid grid-cols-2 gap-2">
              {['MERN', 'Flask+React', 'Next.js', 'Go+Vue'].map((s) => (
                <button
                  key={s}
                  onClick={() => setConfig(prev => ({ ...prev, stack: s as any }))}
                  className={`p-3 rounded border text-sm font-mono transition-all ${
                    config.stack === s 
                    ? 'bg-hack-secondary text-white border-hack-secondary' 
                    : 'bg-hack-bg border-hack-border hover:border-hack-secondary'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold mb-2 text-hack-muted">Features</label>
            <div className="space-y-2">
              {Object.entries(config.features).map(([key, active]) => (
                <div 
                  key={key}
                  onClick={() => toggleFeature(key as any)}
                  className={`flex items-center justify-between p-3 rounded cursor-pointer border ${
                    active ? 'border-hack-primary bg-hack-primary/10' : 'border-hack-border bg-hack-bg'
                  }`}
                >
                  <span className="capitalize">{key}</span>
                  <div className={`w-4 h-4 rounded-full ${active ? 'bg-hack-primary' : 'bg-gray-700'}`} />
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full bg-white text-black font-bold py-3 rounded hover:bg-gray-200 transition-colors flex justify-center items-center gap-2"
          >
            {loading ? 'Designing...' : 'Generate Architecture'}
          </button>
        </div>
      </div>

      <div className="bg-hack-surface p-6 rounded-lg border border-hack-border flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-hack-muted">Preview</h2>
          {generatedPreview && (
            <button onClick={handleDownload} className="text-hack-primary hover:text-white flex items-center gap-1 text-sm">
               <Icons.Download className="w-4 h-4"/> Download Plan
            </button>
          )}
        </div>
        <div className="flex-1 bg-hack-bg p-4 rounded border border-hack-border font-mono text-sm overflow-auto text-green-400 whitespace-pre">
            {generatedPreview || "// Select stack and generate to see file structure..."}
        </div>
      </div>
    </div>
  );
};