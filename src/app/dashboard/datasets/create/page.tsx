'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createDataset } from '@/app/actions/datasets';

export default function CreateDatasetPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dataType, setDataType] = useState<'TEXT' | 'IMAGE'>('TEXT');
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const addOption = () => setOptions([...options, '']);
  const removeOption = (index: number) => setOptions(options.filter((_, i) => i !== index));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const cleanOptions = options.filter(opt => opt.trim() !== '');
    // ⚠️ HARDCODED CLIENT ID FOR TESTING
    const MOCK_CLIENT_ID = "cmiis4nn200017yfjmvhkre56"; 

    try {
      const result = await createDataset({
        title, description, dataType, question, options: cleanOptions, clientId: MOCK_CLIENT_ID, 
      });

      if (result.success) {
        router.push(`/client/dashboard/datasets/${result.datasetId}/upload`);
      } else {
        alert("Error: " + result.error);
      }
    } catch (err) {
      alert("Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background min-h-screen p-4 md:p-6 transition-colors duration-300">
      
      <div className="max-w-3xl mx-auto mb-8">
        <h1 className="text-2xl font-bold text-foreground">Create New Dataset</h1>
        <p className="text-muted-foreground mt-1">Define the template for your data labeling task.</p>
      </div>

      <form 
        onSubmit={handleSubmit} 
        className="space-y-8 rounded-xl max-w-3xl p-6 border border-border shadow-sm bg-card"
      >
        
        {/* 1. General Info */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-foreground border-b border-border pb-2">
            1. General Details
          </h3>
          
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Dataset Title</label>
            <input 
              type="text" 
              required
              className="w-full p-2 bg-background border border-input rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-foreground placeholder-muted-foreground/50 transition-all"
              placeholder="e.g. Shoe Sentiment Analysis"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Instructions</label>
            <textarea 
              required
              rows={3}
              className="w-full p-2 bg-background border border-input rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-foreground placeholder-muted-foreground/50 transition-all"
              placeholder="Briefly explain what the worker needs to do..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        {/* 2. Data Type Configuration */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-foreground border-b border-border pb-2">
            2. Task Configuration
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setDataType('TEXT')}
              className={`p-4 border rounded-lg text-center transition-all ${
                dataType === 'TEXT' 
                  ? 'border-primary bg-primary/10 text-primary font-bold ring-2 ring-primary' 
                  : 'border-border hover:border-muted-foreground/50 text-muted-foreground hover:text-foreground'
              }`}
            >
              📝 Text Analysis
            </button>
            <button
              type="button"
              onClick={() => setDataType('IMAGE')}
              className={`p-4 border rounded-lg text-center transition-all ${
                dataType === 'IMAGE' 
                  ? 'border-primary bg-primary/10 text-primary font-bold ring-2 ring-primary' 
                  : 'border-border hover:border-muted-foreground/50 text-muted-foreground hover:text-foreground'
              }`}
            >
              🖼️ Image Labeling
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Question</label>
            <input 
              type="text" 
              required
              className="w-full p-2 bg-background border border-input rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-foreground placeholder-muted-foreground/50 transition-all"
              placeholder={dataType === 'TEXT' ? "e.g. Is this sentiment positive?" : "e.g. What object is in this image?"}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
          </div>
        </div>

        {/* 3. Define Options */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-foreground border-b border-border pb-2">
            3. Answer Options
          </h3>
          <p className="text-sm text-muted-foreground">Define the choices workers can select from.</p>

          {options.map((opt, idx) => (
            <div key={idx} className="flex gap-2 items-center">
              <span className="text-muted-foreground text-sm font-mono w-6">{idx + 1}.</span>
              <input 
                type="text" 
                required
                className="flex-1 p-2 bg-background border border-input rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-foreground placeholder-muted-foreground/50 transition-all"
                placeholder={`Option ${idx + 1}`}
                value={opt}
                onChange={(e) => handleOptionChange(idx, e.target.value)}
              />
              {options.length > 1 && (
                <button 
                  type="button" 
                  onClick={() => removeOption(idx)}
                  className="text-destructive hover:text-destructive/80 p-2 transition-colors"
                  title="Remove option"
                >
                  ✕
                </button>
              )}
            </div>
          ))}

          <button 
            type="button"
            onClick={addOption}
            className="text-sm text-primary hover:brightness-110 font-medium flex items-center gap-1 mt-2 transition-all"
          >
            + Add another option
          </button>
        </div>

        {/* Submit Button */}
        <div className="pt-6 border-t border-border">
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-medium hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {loading ? 'Creating Dataset...' : 'Create Dataset & Continue to Upload →'}
          </button>
        </div>

      </form>
    </div>
  );
}
