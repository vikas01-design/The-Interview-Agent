import React, { useState } from 'react'
import { NeuButton } from './neu/NeuButton'
import { NeuBadge } from './neu/NeuBadge'
import type { Mission, MissionStatus } from '../types'
import { updateMissionStatus } from '../utils/candidateStore'

interface DayDetailModalProps {
  userId: string
  userName: string
  mission: Mission
  onClose: () => void
  onUpdated: () => void
  onPracticeTopic: (topicTitle: string) => void
}

export const DayDetailModal: React.FC<DayDetailModalProps> = ({
  userId,
  userName,
  mission,
  onClose,
  onUpdated,
  onPracticeTopic,
}) => {
  const [currentStatus, setCurrentStatus] = useState<MissionStatus>(mission.status)

  const handleStatusChange = (newStatus: MissionStatus) => {
    setCurrentStatus(newStatus)
    updateMissionStatus(userId, userName, mission.day, newStatus)
    onUpdated()
  }

  const getStatusBadgeVariant = (status: MissionStatus) => {
    switch (status) {
      case 'COMPLETED': return 'green'
      case 'IN_PROGRESS': return 'yellow'
      case 'SKIPPED': return 'pink'
      case 'LOCKED': return 'black'
      default: return 'cyan'
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto font-mono">
      <div className="relative w-full max-w-2xl border-3 border-black bg-[#FFFDF6] p-6 shadow-neu-lg animate-in fade-in zoom-in duration-200 space-y-6">
        
        {/* Top Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b-3 border-black pb-4">
          <div className="flex items-center gap-3">
            <NeuBadge variant="black">DAY {mission.day} OF 31</NeuBadge>
            <span className="font-mono text-xs font-black bg-[#C0F7FE] border-2 border-black px-2 py-0.5 shadow-neu-sm">
              MODULE: {mission.module.toUpperCase()}
            </span>
          </div>

          <button
            onClick={onClose}
            className="neu-btn bg-white px-2.5 py-1 text-xs font-black hover:bg-[#FE90E8]"
          >
            ✕ CLOSE
          </button>
        </div>

        {/* Title & Status */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-black uppercase text-black leading-tight">
              {mission.title}
            </h2>
            <NeuBadge variant={getStatusBadgeVariant(currentStatus)}>
              {currentStatus}
            </NeuBadge>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-800">
            <span>ATTEMPTS: <span className="font-black text-black">{mission.attempts || 0}</span></span>
            {mission.bestScore !== undefined && (
              <span>BEST SCORE: <span className="font-black text-[#99E885] bg-black px-1.5 py-0.5">{mission.bestScore}%</span></span>
            )}
            {mission.completionDate && (
              <span>COMPLETED: <span className="font-black text-black">{mission.completionDate}</span></span>
            )}
          </div>
        </div>

        {/* Learning Objectives */}
        <div className="border-2 border-black bg-white p-4 space-y-2 shadow-neu-sm">
          <h4 className="font-black text-xs uppercase text-slate-800 border-b border-black pb-1">
            🎯 LEARNING OBJECTIVES
          </h4>
          <ul className="space-y-1.5 text-xs font-bold text-black">
            {mission.learningObjectives.map((obj, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-[#FE90E8] font-black">•</span>
                <span>{obj}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Key Topics & Tools */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="border-2 border-black bg-[#FFDC8B] p-4 space-y-2 shadow-neu-sm">
            <h4 className="font-black text-xs uppercase text-black border-b border-black pb-1">
              📚 TOPICS COVERED
            </h4>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {mission.topics.map((t, i) => (
                <span key={i} className="bg-white border border-black px-2 py-0.5 text-[11px] font-black">
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div className="border-2 border-black bg-[#C0F7FE] p-4 space-y-2 shadow-neu-sm">
            <h4 className="font-black text-xs uppercase text-black border-b border-black pb-1">
              🛠️ TOOLS & FRAMEWORKS
            </h4>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {mission.tools.map((tl, i) => (
                <span key={i} className="bg-black text-white border border-black px-2 py-0.5 text-[11px] font-black">
                  {tl}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Status Update Controls */}
        <div className="border-2 border-black bg-white p-4 space-y-3 shadow-neu-sm">
          <div className="flex justify-between items-center text-xs font-black uppercase">
            <span>UPDATE CURRICULUM STATUS:</span>
            <span className="text-slate-500 text-[10px]">SAVED TO USER STORE</span>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleStatusChange('COMPLETED')}
              className={`px-3 py-1.5 border-2 border-black text-xs font-black uppercase transition-all ${
                currentStatus === 'COMPLETED'
                  ? 'bg-[#99E885] text-black shadow-neu-sm'
                  : 'bg-white text-slate-700 hover:bg-slate-100'
              }`}
            >
              ✓ COMPLETED
            </button>

            <button
              onClick={() => handleStatusChange('IN_PROGRESS')}
              className={`px-3 py-1.5 border-2 border-black text-xs font-black uppercase transition-all ${
                currentStatus === 'IN_PROGRESS'
                  ? 'bg-[#F7CB46] text-black shadow-neu-sm'
                  : 'bg-white text-slate-700 hover:bg-slate-100'
              }`}
            >
              ● IN PROGRESS
            </button>

            <button
              onClick={() => handleStatusChange('SKIPPED')}
              className={`px-3 py-1.5 border-2 border-black text-xs font-black uppercase transition-all ${
                currentStatus === 'SKIPPED'
                  ? 'bg-[#FE90E8] text-black shadow-neu-sm'
                  : 'bg-white text-slate-700 hover:bg-slate-100'
              }`}
            >
              ⚠ SKIPPED
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t-2 border-black">
          <NeuButton variant="white" onClick={onClose}>
            BACK TO DASHBOARD
          </NeuButton>

          <NeuButton
            variant="yellow"
            className="px-6 py-3 text-sm shadow-neu-lg hover:-translate-y-0.5 transition"
            onClick={() => {
              onPracticeTopic(mission.title)
              onClose()
            }}
          >
            PRACTICE THIS TOPIC →
          </NeuButton>
        </div>

      </div>
    </div>
  )
}
