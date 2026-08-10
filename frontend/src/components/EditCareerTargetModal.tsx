import React, { useState } from 'react'
import { NeuButton } from './neu/NeuButton'
import { NeuBadge } from './neu/NeuBadge'
import { updateUserProfile } from '../utils/candidateStore'

interface EditCareerTargetModalProps {
  userId: string
  userName: string
  currentRole: string
  currentExperience: number
  currentJobDescription?: string
  onClose: () => void
  onSaved: () => void
}

const PRESET_ROLES = [
  'AI Engineer',
  'Senior Data Engineer',
  'ML Engineer',
  'Backend Engineer',
  'Software Engineer',
  'DevOps Engineer',
]

export const EditCareerTargetModal: React.FC<EditCareerTargetModalProps> = ({
  userId,
  userName,
  currentRole,
  currentExperience,
  currentJobDescription = '',
  onClose,
  onSaved,
}) => {
  const [targetRole, setTargetRole] = useState(currentRole)
  const [yearsExperience, setYearsExperience] = useState(currentExperience)
  const [jobDescription, setJobDescription] = useState(currentJobDescription)
  const [saving, setSaving] = useState(false)

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      updateUserProfile(userId, userName, {
        targetRole: targetRole.trim() || 'AI Engineer',
        yearsExperience: Math.max(0, Number(yearsExperience) || 0),
        jobDescription: jobDescription.trim(),
      })
      onSaved()
      onClose()
    } catch (err) {
      console.error('Error saving career target:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl border-3 border-black bg-[#FFFDF6] p-6 shadow-neu-lg animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b-3 border-black pb-4 mb-6">
          <div className="flex items-center gap-2">
            <NeuBadge variant="yellow">CAREER TARGET</NeuBadge>
            <h3 className="font-mono text-xl font-black uppercase text-black">EDIT CAREER TARGET</h3>
          </div>
          <button
            onClick={onClose}
            className="neu-btn bg-white px-2.5 py-1 text-xs font-black hover:bg-[#FE90E8]"
          >
            ✕ CLOSE
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-5 font-mono">
          
          {/* Target Role Field */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-black block">
              TARGET ROLE <span className="text-[#FE90E8]">*</span>
            </label>

            {/* Role Preset Quick Pills */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {PRESET_ROLES.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setTargetRole(r)}
                  className={`text-[11px] font-black px-2.5 py-1 border-2 border-black transition-all ${
                    targetRole === r
                      ? 'bg-[#F7CB46] text-black shadow-neu-sm'
                      : 'bg-white text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            <input
              type="text"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g. AI Engineer or Senior Data Engineer"
              className="w-full border-2 border-black bg-white p-3 font-mono text-sm font-bold text-black focus:outline-none focus:ring-2 focus:ring-[#F7CB46] shadow-neu-sm"
              required
            />
          </div>

          {/* Years of Experience Field */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-black block">
              EXPERIENCE (YEARS)
            </label>
            <input
              type="number"
              min="0"
              max="40"
              value={yearsExperience}
              onChange={(e) => setYearsExperience(Number(e.target.value))}
              className="w-full border-2 border-black bg-white p-3 font-mono text-sm font-bold text-black focus:outline-none focus:ring-2 focus:ring-[#F7CB46] shadow-neu-sm"
            />
          </div>

          {/* Optional Target Job Description */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-black block flex justify-between">
              <span>OPTIONAL JOB DESCRIPTION</span>
              <span className="text-slate-500 text-[10px]">PASTE TARGET REQUIREMENTS</span>
            </label>
            <textarea
              rows={4}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste raw Job Description text here to evaluate candidates or customize interview questions specifically against job requirements..."
              className="w-full border-2 border-black bg-white p-3 font-mono text-xs font-bold text-black focus:outline-none focus:ring-2 focus:ring-[#F7CB46] shadow-neu-sm leading-relaxed"
            />
          </div>

          {/* Alert Notice */}
          <div className="border-2 border-black bg-[#C0F7FE] p-3 text-xs font-bold text-black shadow-neu-sm flex items-center gap-2">
            <span className="text-base">⚡</span>
            <span>Updating your Target Role dynamically recalibrates your Resume AI score, skill analytics, and interview questions.</span>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t-2 border-black">
            <NeuButton type="button" variant="white" onClick={onClose}>
              CANCEL
            </NeuButton>
            <NeuButton type="submit" variant="yellow" disabled={saving} className="px-6">
              {saving ? 'SAVING...' : 'SAVE CHANGES →'}
            </NeuButton>
          </div>

        </form>

      </div>
    </div>
  )
}
