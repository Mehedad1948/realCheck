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
  
  // Options State (for multiple choice)
  const [options, setOptions] = useState<string[]>(['', '']); // Start with 2 empty options

  // Handle changing specific option text
  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  // Add a new option field
  const addOption = () => {
    setOptions([...options, '']);
  };

  // Remove an option field
  const removeOption = (index: number) => {
    const newOptions = options.filter((_, i) => i !== index);
    setOptions(newOptions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Filter out empty options if any
    const cleanOptions = options.filter(opt => opt.trim() !== '');

    // ⚠️ HARDCODED CLIENT ID FOR TESTING
    const MOCK_CLIENT_ID = "cmiis4nn200017yfjmvhkre56"; 

    const payload = {
      title,
      description,
      dataType,
      question,
      options: cleanOptions,
      clientId: MOCK_CLIENT_ID, 
    };

    try {
      const result = await createDataset(payload);

      if (result.success) {
        alert("Dataset Created Successfully!");
        // Redirect to the upload page for this new dataset
        router.push(`/client/dashboard/datasets/${result.datasetId}/upload`);
      } else {
        alert("Error creating dataset: " + result.error);
      }
    } catch (err) {
      console.error(err);
      alert("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm ">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Create New Dataset</h1>
        <p className="text-gray-500">Define the template for your data labeling task.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 rounded-xl max-w-3xl p-4 border border-gray-100">
        
        {/* 1. General Info */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 border-b pb-2">1. General Details</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dataset Title</label>
            <input 
              type="text" 
              required
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="e.g. Shoe Sentiment Analysis"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
            <textarea 
              required
              rows={3}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Briefly explain what the worker needs to do..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        {/* 2. Data Type Configuration */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 border-b pb-2">2. Task Configuration</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setDataType('TEXT')}
              className={`p-4 border rounded-lg text-center transition-all ${
                dataType === 'TEXT' 
                  ? 'border-blue-500 bg-blue-50 text-blue-700 font-bold ring-2 ring-blue-500' 
                  : 'border-gray-200 hover:border-gray-300 text-gray-600'
              }`}
            >
              📝 Text Analysis
            </button>
            <button
              type="button"
              onClick={() => setDataType('IMAGE')}
              className={`p-4 border rounded-lg text-center transition-all ${
                dataType === 'IMAGE' 
                  ? 'border-blue-500 bg-blue-50 text-blue-700 font-bold ring-2 ring-blue-500' 
                  : 'border-gray-200 hover:border-gray-300 text-gray-600'
              }`}
            >
              🖼️ Image Labeling
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Question</label>
            <input 
              type="text" 
              required
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder={dataType === 'TEXT' ? "e.g. Is this sentiment positive?" : "e.g. What object is in this image?"}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
          </div>
        </div>

        {/* 3. Define Options */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 border-b pb-2">3. Answer Options</h3>
          <p className="text-sm text-gray-500">Define the choices workers can select from.</p>

          {options.map((opt, idx) => (
            <div key={idx} className="flex gap-2 items-center">
              <span className="text-gray-400 text-sm font-mono w-6">{idx + 1}.</span>
              <input 
                type="text" 
                required
                className="flex-1 p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder={`Option ${idx + 1}`}
                value={opt}
                onChange={(e) => handleOptionChange(idx, e.target.value)}
              />
              {options.length > 1 && (
                <button 
                  type="button" 
                  onClick={() => removeOption(idx)}
                  className="text-red-400 hover:text-red-600 p-2"
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
            className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 mt-2"
          >
            + Add another option
          </button>
        </div>

        {/* Submit Button */}
        <div className="pt-6 border-t">
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating Dataset...' : 'Create Dataset & Continue to Upload →'}
          </button>
        </div>

      </form>
    </div>
  );
}
