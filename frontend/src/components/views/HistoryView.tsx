import { NeuCard } from '../neu/NeuCard'
import { NeuBadge } from '../neu/NeuBadge'
import type { Candidate } from '../../types'
import { loadUserCandidateData } from '../../utils/candidateStore'

interface Props {
  candidate: Candidate
  onStartInterviewClick: () => void
}

export function HistoryView({ candidate, onStartInterviewClick }: Props) {
  const userData = loadUserCandidateData(candidate.member.id, candidate.member.name)
  const sessions = userData.sessions

  return (
    <div className="max-w-7xl mx-auto space-y-10 md:space-y-12 pb-12">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-3 border-black pb-4">
        <div className="space-y-2">
          <NeuBadge variant="cyan">ARCHIVE</NeuBadge>
          <h1 className="text-3xl md:text-5xl font-black uppercase text-black">
            INTERVIEW HISTORY
          </h1>
          <p className="text-sm font-bold text-slate-700">
            Historical technical interview records and report logs for candidate {candidate.member.name}.
          </p>
        </div>

        <button
          onClick={onStartInterviewClick}
          className="neu-btn bg-[#F7CB46] text-black px-6 py-3 font-black text-sm uppercase self-start md:self-auto"
        >
          START NEW INTERVIEW →
        </button>
      </div>

      {/* History Table */}
      <NeuCard color="white" className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-[#FFFDF6] border-b-3 border-black font-black uppercase text-black">
              <tr>
                <th className="p-4">DATE</th>
                <th className="p-4">TARGET ROLE</th>
                <th className="p-4">QUESTIONS</th>
                <th className="p-4">TECH SCORE</th>
                <th className="p-4">MATCH SCORE</th>
                <th className="p-4">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-black">
              {sessions.map((s) => (
                <tr key={s.id} className="hover:bg-[#C0F7FE]/30 font-bold">
                  <td className="p-4 font-black">{s.date}</td>
                  <td className="p-4 uppercase">{s.role}</td>
                  <td className="p-4">{s.questionsCount || 10} Qs</td>
                  <td className="p-4">{s.technicalKnowledge}%</td>
                  <td className="p-4 font-black text-base">
                    <span className={s.score >= 80 ? 'text-[#99E885]' : s.score >= 70 ? 'text-black' : 'text-[#FE90E8]'}>
                      {s.score}%
                    </span>
                  </td>
                  <td className="p-4">
                    <NeuBadge variant="green">COMPLETED</NeuBadge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </NeuCard>
    </div>
  )
}
