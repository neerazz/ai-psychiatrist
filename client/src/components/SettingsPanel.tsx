import { useState } from 'react';
import type { AIProvider, AppSettings } from '../core/types.ts';

interface SettingsPanelProps {
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
  onClose: () => void;
}

const MODELS: Record<AIProvider, string[]> = {
  anthropic: ['claude-opus-4-6', 'claude-sonnet-4-5', 'claude-haiku-4-5'],
  openai: ['gpt-5.2', 'gpt-5.3-codex', 'gpt-5.2-codex'],
  google: ['gemini-3-pro-preview', 'gemini-3-flash-preview', 'gemini-2.5-flash'],
};

export function SettingsPanel({ settings, onSave, onClose }: SettingsPanelProps) {
  const [provider, setProvider] = useState<AIProvider>(settings.provider);
  const [model, setModel] = useState(settings.model);
  const [apiKey, setApiKey] = useState(settings.apiKey);
  const [voiceEnabled, setVoiceEnabled] = useState(settings.voiceEnabled);

  const handleProviderChange = (p: AIProvider) => {
    setProvider(p);
    setModel(MODELS[p][0]);
  };

  const handleSave = () => {
    onSave({ provider, model, apiKey, voiceEnabled });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-sterling-900 border border-slate-700 rounded-xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-white">Settings</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl">
            &times;
          </button>
        </div>

        {/* Provider */}
        <div className="mb-4">
          <label className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wide">
            Provider
          </label>
          <div className="flex gap-2">
            {(['anthropic', 'openai', 'google'] as AIProvider[]).map(p => (
              <button
                key={p}
                onClick={() => handleProviderChange(p)}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  provider === p
                    ? 'bg-sterling-600 text-white'
                    : 'bg-sterling-800/50 text-slate-400 hover:text-white hover:bg-sterling-800'
                }`}
              >
                {p === 'anthropic' ? 'Anthropic' : p === 'openai' ? 'OpenAI' : 'Google'}
              </button>
            ))}
          </div>
        </div>

        {/* Model */}
        <div className="mb-4">
          <label className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wide">
            Model
          </label>
          <select
            value={model}
            onChange={e => setModel(e.target.value)}
            className="w-full bg-sterling-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sterling-500"
          >
            {MODELS[provider].map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        {/* API Key */}
        <div className="mb-4">
          <label className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wide">
            API Key
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder="sk-..."
            className="w-full bg-sterling-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sterling-500"
          />
          <p className="text-xs text-slate-500 mt-1">
            Stored locally in your browser. Never sent to our servers.
          </p>
        </div>

        {/* Voice */}
        <div className="mb-6">
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                voiceEnabled ? 'bg-sterling-600' : 'bg-slate-600'
              }`}
            >
              <div
                className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${
                  voiceEnabled ? 'left-5.5' : 'left-0.5'
                }`}
              />
            </div>
            <span className="text-sm text-slate-300">Voice input & output</span>
          </label>
        </div>

        <button
          onClick={handleSave}
          disabled={!apiKey.trim()}
          className="w-full bg-sterling-600 hover:bg-sterling-500 disabled:bg-slate-700 disabled:text-slate-500 text-white py-2.5 rounded-lg font-medium transition-colors"
        >
          Save Settings
        </button>
      </div>
    </div>
  );
}
