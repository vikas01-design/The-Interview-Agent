import { NeuCard } from '../neu/NeuCard'
import { NeuBadge } from '../neu/NeuBadge'

export function SettingsView() {
  return (
    <div className="max-w-5xl mx-auto space-y-10 md:space-y-12 pb-12">
      {/* Header */}
      <div className="space-y-2 border-b-3 border-black pb-4">
        <NeuBadge variant="black">SYSTEM CONFIG</NeuBadge>
        <h1 className="text-3xl md:text-5xl font-black uppercase text-black">
          SYSTEM SETTINGS
        </h1>
        <p className="text-sm font-bold text-slate-700">
          Environment configuration, LLM service status, and retrieval engine parameters.
        </p>
      </div>

      {/* Settings Grid */}
      <div className="space-y-6">
        <NeuCard color="white" className="space-y-4">
          <h3 className="font-black text-lg uppercase border-b-2 border-black pb-2">1. LLM SERVICE PROVIDER</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-mono font-black uppercase text-slate-800 mb-1">Active LLM API</label>
              <input
                type="text"
                disabled
                value="Google Gemini 2.5 Flash / Pro"
                className="w-full border-2 border-black bg-slate-100 p-2.5 font-mono text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-mono font-black uppercase text-slate-800 mb-1">Fallback Guardrails</label>
              <input
                type="text"
                disabled
                value="Active (Deterministic Candidate Graph Fallback)"
                className="w-full border-2 border-black bg-slate-100 p-2.5 font-mono text-xs font-bold"
              />
            </div>
          </div>
        </NeuCard>

        <NeuCard color="cyan" className="space-y-4">
          <h3 className="font-black text-lg uppercase border-b-2 border-black pb-2">2. THEBREETH GRAPH RETRIEVAL ENGINE</h3>
          <div className="space-y-2 font-mono text-xs font-bold">
            <div className="flex justify-between p-2 bg-white border-2 border-black">
              <span>STATUS:</span>
              <span className="font-black text-[#99E885]">● ONLINE</span>
            </div>
            <div className="flex justify-between p-2 bg-white border-2 border-black">
              <span>INGESTED CURRICULUM DAYS:</span>
              <span className="font-black">31 / 31 DAYS</span>
            </div>
            <div className="flex justify-between p-2 bg-white border-2 border-black">
              <span>INGESTED CANDIDATES:</span>
              <span className="font-black">20 CANDIDATES</span>
            </div>
          </div>
        </NeuCard>
      </div>
    </div>
  )
}
