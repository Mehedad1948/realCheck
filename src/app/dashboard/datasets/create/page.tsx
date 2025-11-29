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

  // ✅ NEW STATE: Default to 2 as per schema
  const [requiredVotes, setRequiredVotes] = useState<number>(2);

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
    const MOCK_CLIENT_ID = "cmiis4nn200017yfjmvhkre56";

    try {
      const result = await createDataset({
        title,
        description,
        dataType,
        question,
        options: cleanOptions,
        clientId: MOCK_CLIENT_ID,
        // ✅ Pass the new value to server action
        requiredVotes: Number(requiredVotes)
      });

      if (result.success) {
        router.push(`/dashboard/datasets/${result.datasetId}/upload`);
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

      <div className="mb-8">
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

        {/* 2. Task Configuration */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-foreground border-b border-border pb-2">
            2. Task Configuration
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setDataType('TEXT')}
              className={`p-4 border rounded-lg text-center transition-all ${dataType === 'TEXT'
                  ? 'border-primary bg-primary/10 text-primary font-bold ring-2 ring-primary'
                  : 'border-border hover:border-muted-foreground/50 text-muted-foreground hover:text-foreground'
                }`}
            >
              📝 Text Analysis
            </button>
            <button
              type="button"
              onClick={() => setDataType('IMAGE')}
              className={`p-4 border rounded-lg text-center transition-all ${dataType === 'IMAGE'
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

          {/* ✅ NEW: Required Votes Input with Tooltip */}
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <label className="block text-sm font-medium text-muted-foreground">
                Required Votes per Task
              </label>

              {/* Tooltip (Same as before) */}
              <div className="group relative flex items-center justify-center cursor-help">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground hover:text-primary transition-colors">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M12 16v-4"></path>
                  <path d="M12 8h.01"></path>
                </svg>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-popover text-popover-foreground text-xs rounded-md shadow-lg border border-border invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all z-50 pointer-events-none">
                  <p className="font-semibold mb-1">Consensus Control</p>
                  This determines how many unique workers must answer a task before it is marked as <strong>Completed</strong>.
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-popover"></div>
                </div>
              </div>
            </div>

            {/* STEPPER COMPONENT */}
            <div className="flex items-center w-40 rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent transition-all overflow-hidden shadow-sm">

              {/* Decrement Button */}
              <button
                type="button"
                onClick={() => setRequiredVotes(prev => Math.max(1, prev - 1))}
                disabled={requiredVotes <= 1}
                className="px-3 py-2.5 bg-muted/30 hover:bg-muted text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors border-r border-border"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              </button>

              {/* Number Input */}
              <input
                type="number"
                required
                min={1}
                max={100}
                className="w-full p-2 text-center bg-transparent border-none outline-none text-foreground font-medium appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                value={requiredVotes}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (!isNaN(val)) setRequiredVotes(val);
                }}
              />

              {/* Increment Button */}
              <button
                type="button"
                onClick={() => setRequiredVotes(prev => Math.min(100, prev + 1))}
                disabled={requiredVotes >= 100}
                className="px-3 py-2.5 bg-muted/30 hover:bg-muted text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors border-l border-border"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              </button>
            </div>

            <p className="text-xs text-muted-foreground mt-2">
              Recommended: <span className="font-mono bg-muted px-1 rounded">2-3</span> for validation.
            </p>
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
