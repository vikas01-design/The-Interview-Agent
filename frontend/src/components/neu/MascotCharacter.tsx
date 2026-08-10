import React from 'react'

export type MascotState =
  | 'excited'
  | 'nervous'
  | 'thinking'
  | 'focused'
  | 'learning'
  | 'motivated'
  | 'confident'
  | 'success'

interface MascotCharacterProps {
  state: MascotState
  className?: string
  showDoodles?: boolean
}

export const MascotCharacter: React.FC<MascotCharacterProps> = ({
  state,
  className = '',
  showDoodles = true,
}) => {
  // Common visual brand style: Black ink stroke, white/light blue fill, hoodie details
  return (
    <div className={`relative inline-flex flex-col items-center justify-center select-none ${className}`}>
      
      {/* Dynamic Hand-drawn Speech / Thought Doodle Bubble in Whitespace */}
      {showDoodles && (
        <div className="absolute -top-8 right-0 md:-right-6 z-10 pointer-events-none transition-all duration-300 transform hover:scale-105">
          {state === 'excited' && (
            <div className="border-2 border-black bg-[#C0F7FE] px-3 py-1 text-xs font-mono font-black uppercase text-black shadow-neu-sm rotate-3">
              LET'S DO THIS! ⚡
            </div>
          )}
          {state === 'nervous' && (
            <div className="border-2 border-black bg-[#FFFDF6] px-3 py-1 text-xs font-mono font-black uppercase text-black shadow-neu-sm -rotate-2">
              WILL I BE ABLE TO EXPLAIN? 💦
            </div>
          )}
          {state === 'thinking' && (
            <div className="border-2 border-black bg-[#FFDC8B] px-3 py-1 text-xs font-mono font-black uppercase text-black shadow-neu-sm rotate-2 flex items-center gap-1">
              <span>💡 Q1</span>
              <span>→</span>
              <span>EVALUATE</span>
              <span>→</span>
              <span>Q1.1</span>
            </div>
          )}
          {state === 'focused' && (
            <div className="border-2 border-black bg-[#FE90E8] px-3 py-1 text-xs font-mono font-black uppercase text-black shadow-neu-sm -rotate-3">
              "I would evaluate retrieval quality..." 🎙️
            </div>
          )}
          {state === 'learning' && (
            <div className="border-2 border-black bg-[#99E885] px-3 py-1 text-xs font-mono font-black uppercase text-black shadow-neu-sm rotate-1">
              AHA! 78/100 → IMPROVING ✨
            </div>
          )}
          {state === 'motivated' && (
            <div className="border-2 border-black bg-[#C0F7FE] px-3 py-1 text-xs font-mono font-black uppercase text-black shadow-neu-sm -rotate-1">
              GROWTH CURVE 📈 +24%
            </div>
          )}
          {state === 'confident' && (
            <div className="border-2 border-black bg-[#F7CB46] px-3 py-1 text-xs font-mono font-black uppercase text-black shadow-neu-sm rotate-2">
              ROLE MATCH: 94% 🎯
            </div>
          )}
          {state === 'success' && (
            <div className="border-2 border-black bg-[#99E885] px-3 py-1 text-xs font-mono font-black uppercase text-black shadow-neu-sm animate-bounce">
              YOU GOT THIS! 🎉
            </div>
          )}
        </div>
      )}

      {/* Free-Floating SVG Mascot Character — Pure Black Ink Hand-Drawn Editorial Style */}
      <svg
        viewBox="0 0 400 400"
        className="w-full h-auto max-w-[340px] sm:max-w-[400px] drop-shadow-sm overflow-visible transition-transform duration-500"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Subtle Neo-Brutalist Hatch / Accent Gradients */}
          <linearGradient id="hoodieGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#F3F4F6" />
          </linearGradient>
          <filter id="shadow">
            <feDropShadow dx="3" dy="3" stdDeviation="0" floodColor="#000000" />
          </filter>
        </defs>

        {/* --- BASE MASCOT BODY (SAME IDENTITY FOR ALL 8 EMOTIONAL POSES) --- */}

        {/* 1. STATE: EXCITED (Hero) */}
        {state === 'excited' && (
          <g id="mascot-excited">
            {/* Sitting cross-legged with laptop */}
            {/* Legs */}
            <path
              d="M 100 320 C 120 360 280 360 300 320 C 310 300 270 290 250 300 L 150 300 C 130 290 90 300 100 320 Z"
              fill="#FFFFFF"
              stroke="#000000"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Sneakers */}
            <ellipse cx="110" cy="340" rx="25" ry="14" fill="#FFFFFF" stroke="#000000" strokeWidth="3.5" />
            <path d="M 95 340 L 125 340" stroke="#000000" strokeWidth="2.5" />
            <ellipse cx="290" cy="340" rx="25" ry="14" fill="#FFFFFF" stroke="#000000" strokeWidth="3.5" />
            <path d="M 275 340 L 305 340" stroke="#000000" strokeWidth="2.5" />

            {/* Torso / Hoodie */}
            <path
              d="M 140 200 C 135 240 130 280 145 300 L 255 300 C 270 280 265 240 260 200 Z"
              fill="url(#hoodieGrad)"
              stroke="#000000"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Hoodie Pocket & Strings */}
            <path d="M 165 250 L 235 250 L 245 285 L 155 285 Z" fill="#FFFFFF" stroke="#000000" strokeWidth="3" />
            <path d="M 185 195 L 185 225 M 215 195 L 215 225" stroke="#000000" strokeWidth="3" strokeLinecap="round" />

            {/* Laptop in lap */}
            <rect x="170" y="220" width="80" height="55" rx="6" fill="#1E293B" stroke="#000000" strokeWidth="3.5" />
            <rect x="195" y="235" width="30" height="20" rx="3" fill="#3B82F6" stroke="#000000" strokeWidth="2" />
            <text x="202" y="249" fill="#FFFFFF" fontSize="10" fontFamily="monospace" fontWeight="900">AI</text>
            <path d="M 150 275 L 270 275 C 275 275 275 282 270 282 L 150 282 C 145 282 145 275 150 275 Z" fill="#000000" />

            {/* Arms resting on laptop */}
            <path d="M 140 210 Q 155 245 175 245" fill="none" stroke="#000000" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M 260 210 Q 245 245 225 245" fill="none" stroke="#000000" strokeWidth="3.5" strokeLinecap="round" />

            {/* Head & Neck */}
            <rect x="185" y="175" width="30" height="25" fill="#FFFDF6" stroke="#000000" strokeWidth="3" />
            {/* Face Oval */}
            <path
              d="M 150 120 C 150 70 250 70 250 120 C 250 170 150 170 150 120 Z"
              fill="#FFFDF6"
              stroke="#000000"
              strokeWidth="3.5"
              strokeLinecap="round"
            />

            {/* Ears */}
            <circle cx="148" cy="125" r="10" fill="#FFFDF6" stroke="#000000" strokeWidth="3" />
            <circle cx="252" cy="125" r="10" fill="#FFFDF6" stroke="#000000" strokeWidth="3" />

            {/* Signature Messy Hair (Identical across all states) */}
            <path
              d="M 145 115 C 135 85 160 55 190 50 C 210 45 240 55 255 75 C 265 90 255 115 255 115 C 245 80 215 70 195 75 C 170 80 155 95 145 115 Z"
              fill="#000000"
            />
            {/* Extra hair tufts */}
            <path d="M 175 52 Q 170 38 185 45 M 215 48 Q 225 35 230 48" stroke="#000000" strokeWidth="3.5" strokeLinecap="round" />

            {/* Excited Expression: Happy Curved Eyes & Wide Smile */}
            <circle cx="178" cy="118" r="4" fill="#000000" />
            <circle cx="222" cy="118" r="4" fill="#000000" />
            {/* Eyebrows (Upbeat) */}
            <path d="M 170 106 Q 178 100 186 106" fill="none" stroke="#000000" strokeWidth="3" strokeLinecap="round" />
            <path d="M 214 106 Q 222 100 230 106" fill="none" stroke="#000000" strokeWidth="3" strokeLinecap="round" />
            {/* Smile */}
            <path d="M 182 135 Q 200 155 218 135 Z" fill="#000000" />
            {/* Rosy Cheeks */}
            <ellipse cx="168" cy="130" rx="7" ry="4" fill="#FE90E8" />
            <ellipse cx="232" cy="130" rx="7" ry="4" fill="#FE90E8" />

            {/* Surrounding Plant Prop */}
            <path d="M 310 290 L 330 290 L 325 320 L 315 320 Z" fill="#FFFFFF" stroke="#000000" strokeWidth="3" />
            <path d="M 320 290 Q 310 265 305 275 M 320 290 Q 320 255 323 270 M 320 290 Q 330 265 335 275" stroke="#000000" strokeWidth="3" strokeLinecap="round" />
          </g>
        )}

        {/* 2. STATE: NERVOUS (The Problem) */}
        {state === 'nervous' && (
          <g id="mascot-nervous">
            {/* Sitting slightly hunched at desk */}
            <path
              d="M 140 200 C 130 240 125 285 140 310 L 260 310 C 275 285 270 240 260 200 Z"
              fill="url(#hoodieGrad)"
              stroke="#000000"
              strokeWidth="3.5"
            />
            {/* Desk Surface */}
            <line x1="60" y1="310" x2="340" y2="310" stroke="#000000" strokeWidth="4" strokeLinecap="round" />

            {/* Open Laptop */}
            <rect x="160" y="240" width="80" height="65" rx="4" fill="#1E293B" stroke="#000000" strokeWidth="3.5" />
            <rect x="180" y="255" width="40" height="25" fill="#38BDF8" stroke="#000000" strokeWidth="2" />

            {/* Tense Hands near laptop */}
            <path d="M 140 215 Q 145 260 165 275" fill="none" stroke="#000000" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M 260 215 Q 255 260 235 275" fill="none" stroke="#000000" strokeWidth="3.5" strokeLinecap="round" />

            {/* Head & Neck */}
            <rect x="185" y="175" width="30" height="25" fill="#FFFDF6" stroke="#000000" strokeWidth="3" />
            <path d="M 150 120 C 150 70 250 70 250 120 C 250 170 150 170 150 120 Z" fill="#FFFDF6" stroke="#000000" strokeWidth="3.5" />
            <circle cx="148" cy="125" r="10" fill="#FFFDF6" stroke="#000000" strokeWidth="3" />
            <circle cx="252" cy="125" r="10" fill="#FFFDF6" stroke="#000000" strokeWidth="3" />

            {/* Hair */}
            <path d="M 145 115 C 135 85 160 55 190 50 C 210 45 240 55 255 75 C 265 90 255 115 255 115 C 245 80 215 70 195 75 C 170 80 155 95 145 115 Z" fill="#000000" />

            {/* Nervous Expression: Wide Worried Eyes & Wavy Mouth */}
            <circle cx="178" cy="118" r="6" fill="#000000" />
            <circle cx="176" cy="116" r="2" fill="#FFFFFF" />
            <circle cx="222" cy="118" r="6" fill="#000000" />
            <circle cx="220" cy="116" r="2" fill="#FFFFFF" />
            {/* Worried Eyebrows tilted up in center */}
            <path d="M 168 102 L 186 108" stroke="#000000" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M 232 102 L 214 108" stroke="#000000" strokeWidth="3.5" strokeLinecap="round" />
            {/* Wavy Mouth */}
            <path d="M 182 142 Q 192 135 200 142 T 218 140" fill="none" stroke="#000000" strokeWidth="3.5" strokeLinecap="round" />
            {/* Sweat Drop Doodle */}
            <path d="M 258 100 Q 266 110 262 118 A 5 5 0 0 1 254 114 Z" fill="#38BDF8" stroke="#000000" strokeWidth="2.5" />
            {/* Coffee Mug on desk */}
            <rect x="270" y="275" width="22" height="30" rx="3" fill="#FFFFFF" stroke="#000000" strokeWidth="3" />
            <path d="M 292 282 C 300 282 300 298 292 298" fill="none" stroke="#000000" strokeWidth="3" />
          </g>
        )}

        {/* 3. STATE: THINKING (Adaptive AI) */}
        {state === 'thinking' && (
          <g id="mascot-thinking">
            {/* Torso */}
            <path d="M 140 200 C 130 240 125 285 140 320 L 260 320 C 275 285 270 240 260 200 Z" fill="url(#hoodieGrad)" stroke="#000000" strokeWidth="3.5" />
            
            {/* Hand resting under chin */}
            <path d="M 140 215 Q 165 240 195 165" fill="none" stroke="#000000" strokeWidth="4" strokeLinecap="round" />
            <circle cx="195" cy="160" r="8" fill="#FFFDF6" stroke="#000000" strokeWidth="3" />

            {/* Head & Neck */}
            <rect x="185" y="175" width="30" height="25" fill="#FFFDF6" stroke="#000000" strokeWidth="3" />
            <path d="M 150 120 C 150 70 250 70 250 120 C 250 170 150 170 150 120 Z" fill="#FFFDF6" stroke="#000000" strokeWidth="3.5" />
            <circle cx="148" cy="125" r="10" fill="#FFFDF6" stroke="#000000" strokeWidth="3" />
            <circle cx="252" cy="125" r="10" fill="#FFFDF6" stroke="#000000" strokeWidth="3" />

            {/* Hair */}
            <path d="M 145 115 C 135 85 160 55 190 50 C 210 45 240 55 255 75 C 265 90 255 115 255 115 C 245 80 215 70 195 75 C 170 80 155 95 145 115 Z" fill="#000000" />

            {/* Thinking Expression: Looking up & to the right */}
            <ellipse cx="182" cy="112" rx="4" ry="5" fill="#000000" />
            <ellipse cx="226" cy="112" rx="4" ry="5" fill="#000000" />
            {/* Raised eyebrow on one side */}
            <path d="M 172 102 Q 182 94 190 102" fill="none" stroke="#000000" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M 216 96 Q 226 88 234 96" fill="none" stroke="#000000" strokeWidth="3.5" strokeLinecap="round" />
            {/* Pensive mouth (side pursed) */}
            <path d="M 188 138 Q 200 136 210 142" fill="none" stroke="#000000" strokeWidth="3.5" strokeLinecap="round" />

            {/* Floating Thought Bubble Doodles */}
            <circle cx="270" cy="80" r="6" fill="#FFFDF6" stroke="#000000" strokeWidth="2" />
            <circle cx="285" cy="65" r="10" fill="#FFFDF6" stroke="#000000" strokeWidth="2.5" />
            <rect x="290" y="20" width="75" height="40" rx="6" fill="#FFFDF6" stroke="#000000" strokeWidth="3" />
            <text x="300" y="44" fill="#000000" fontSize="11" fontFamily="monospace" fontWeight="900">IF ELSE?</text>
          </g>
        )}

        {/* 4. STATE: FOCUSED (Voice Interview) */}
        {state === 'focused' && (
          <g id="mascot-focused">
            {/* Torso */}
            <path d="M 140 200 C 130 240 125 285 140 320 L 260 320 C 275 285 270 240 260 200 Z" fill="url(#hoodieGrad)" stroke="#000000" strokeWidth="3.5" />

            {/* Headphones Prop */}
            <path d="M 140 125 C 135 60 265 60 260 125" fill="none" stroke="#000000" strokeWidth="6" strokeLinecap="round" />
            <rect x="136" y="110" width="16" height="30" rx="5" fill="#1E293B" stroke="#000000" strokeWidth="3" />
            <rect x="248" y="110" width="16" height="30" rx="5" fill="#1E293B" stroke="#000000" strokeWidth="3" />

            {/* Microphone on Stand */}
            <line x1="290" y1="230" x2="290" y2="290" stroke="#000000" strokeWidth="4" />
            <line x1="270" y1="290" x2="310" y2="290" stroke="#000000" strokeWidth="4" strokeLinecap="round" />
            <rect x="282" y="200" width="16" height="32" rx="8" fill="#1E293B" stroke="#000000" strokeWidth="3" />
            {/* Sound waves from mic */}
            <path d="M 310 208 C 318 212 318 220 310 224" fill="none" stroke="#2563EB" strokeWidth="3" strokeLinecap="round" />
            <path d="M 316 202 C 328 210 328 226 316 230" fill="none" stroke="#2563EB" strokeWidth="3" strokeLinecap="round" />

            {/* Gesturing arm speaking into mic */}
            <path d="M 260 215 Q 275 230 250 250" fill="none" stroke="#000000" strokeWidth="4" strokeLinecap="round" />
            <circle cx="250" cy="252" r="7" fill="#FFFDF6" stroke="#000000" strokeWidth="3" />

            {/* Head & Face */}
            <rect x="185" y="175" width="30" height="25" fill="#FFFDF6" stroke="#000000" strokeWidth="3" />
            <path d="M 150 120 C 150 70 250 70 250 120 C 250 170 150 170 150 120 Z" fill="#FFFDF6" stroke="#000000" strokeWidth="3.5" />
            <path d="M 145 115 C 135 85 160 55 190 50 C 210 45 240 55 255 75 C 265 90 255 115 255 115 C 245 80 215 70 195 75 C 170 80 155 95 145 115 Z" fill="#000000" />

            {/* Speaking Expression: Confident Eyes & Speaking Mouth */}
            <circle cx="178" cy="118" r="4" fill="#000000" />
            <circle cx="222" cy="118" r="4" fill="#000000" />
            <path d="M 170 106 Q 178 102 186 106" fill="none" stroke="#000000" strokeWidth="3" />
            <path d="M 214 106 Q 222 102 230 106" fill="none" stroke="#000000" strokeWidth="3" />
            {/* Open Speaking Mouth */}
            <ellipse cx="200" cy="138" rx="10" ry="7" fill="#000000" />
          </g>
        )}

        {/* 5. STATE: LEARNING / SURPRISED (Feedback) */}
        {state === 'learning' && (
          <g id="mascot-learning">
            {/* Torso */}
            <path d="M 140 200 C 130 240 125 285 140 320 L 260 320 C 275 285 270 240 260 200 Z" fill="url(#hoodieGrad)" stroke="#000000" strokeWidth="3.5" />

            {/* Holding Feedback Score Paper loosely */}
            <rect x="250" y="160" width="85" height="110" rx="4" fill="#FFFDF6" stroke="#000000" strokeWidth="3.5" filter="url(#shadow)" />
            <text x="268" y="195" fill="#000000" fontSize="22" fontFamily="monospace" fontWeight="900">78</text>
            <text x="296" y="195" fill="#64748B" fontSize="12" fontFamily="monospace" fontWeight="700">/100</text>
            <line x1="265" y1="210" x2="320" y2="210" stroke="#000000" strokeWidth="2.5" />
            <text x="265" y="228" fill="#166534" fontSize="9" fontFamily="sans-serif" fontWeight="800">✓ RELEVANCE</text>
            <text x="265" y="245" fill="#B45309" fontSize="9" fontFamily="sans-serif" fontWeight="800">⚠ DEPTH</text>

            {/* Arm holding paper */}
            <path d="M 260 215 Q 275 200 255 190" fill="none" stroke="#000000" strokeWidth="4" strokeLinecap="round" />

            {/* Head & Face */}
            <rect x="185" y="175" width="30" height="25" fill="#FFFDF6" stroke="#000000" strokeWidth="3" />
            <path d="M 150 120 C 150 70 250 70 250 120 C 250 170 150 170 150 120 Z" fill="#FFFDF6" stroke="#000000" strokeWidth="3.5" />
            <path d="M 145 115 C 135 85 160 55 190 50 C 210 45 240 55 255 75 C 265 90 255 115 255 115 C 245 80 215 70 195 75 C 170 80 155 95 145 115 Z" fill="#000000" />

            {/* Surprised / Learning "Aha!" Expression */}
            <circle cx="178" cy="116" r="6" fill="#000000" />
            <circle cx="176" cy="114" r="2" fill="#FFFFFF" />
            <circle cx="222" cy="116" r="6" fill="#000000" />
            <circle cx="220" cy="114" r="2" fill="#FFFFFF" />
            {/* Raised eyebrow */}
            <path d="M 168 98 Q 178 90 188 98" fill="none" stroke="#000000" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M 214 104 Q 222 98 230 104" fill="none" stroke="#000000" strokeWidth="3" strokeLinecap="round" />
            {/* Small 'O' mouth */}
            <circle cx="200" cy="140" r="7" fill="#000000" />
            {/* Sparkle doodle next to head */}
            <path d="M 130 90 L 140 90 M 135 85 L 135 95" stroke="#F7CB46" strokeWidth="3" strokeLinecap="round" />
          </g>
        )}

        {/* 6. STATE: MOTIVATED (Performance Insights) */}
        {state === 'motivated' && (
          <g id="mascot-motivated">
            {/* Torso with rolled-up hoodie sleeves */}
            <path d="M 140 200 C 130 240 125 285 140 320 L 260 320 C 275 285 270 240 260 200 Z" fill="url(#hoodieGrad)" stroke="#000000" strokeWidth="3.5" />
            
            {/* Laptop & Upward Growth Bar Graph doodle */}
            <rect x="70" y="240" width="100" height="65" rx="4" fill="#1E293B" stroke="#000000" strokeWidth="3.5" />
            <path d="M 85 285 L 105 270 L 125 275 L 150 250" fill="none" stroke="#99E885" strokeWidth="3.5" strokeLinecap="round" />

            {/* Determined hands typing at laptop */}
            <path d="M 140 215 Q 120 250 110 260" fill="none" stroke="#000000" strokeWidth="4" strokeLinecap="round" />

            {/* Head & Face */}
            <rect x="185" y="175" width="30" height="25" fill="#FFFDF6" stroke="#000000" strokeWidth="3" />
            <path d="M 150 120 C 150 70 250 70 250 120 C 250 170 150 170 150 120 Z" fill="#FFFDF6" stroke="#000000" strokeWidth="3.5" />
            <path d="M 145 115 C 135 85 160 55 190 50 C 210 45 240 55 255 75 C 265 90 255 115 255 115 C 245 80 215 70 195 75 C 170 80 155 95 145 115 Z" fill="#000000" />

            {/* Motivated / Determined Expression: Focused Eyebrows & Firm Grin */}
            <circle cx="178" cy="118" r="4" fill="#000000" />
            <circle cx="222" cy="118" r="4" fill="#000000" />
            <path d="M 168 108 L 186 102" stroke="#000000" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M 232 108 L 214 102" stroke="#000000" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M 184 136 Q 200 144 216 136" fill="none" stroke="#000000" strokeWidth="3.5" strokeLinecap="round" />
          </g>
        )}

        {/* 7. STATE: CONFIDENT (Resume AI) */}
        {state === 'confident' && (
          <g id="mascot-confident">
            {/* Standing upright confident posture */}
            <path d="M 140 190 C 130 230 130 280 145 330 L 255 330 C 270 280 270 230 260 190 Z" fill="url(#hoodieGrad)" stroke="#000000" strokeWidth="3.5" />

            {/* Holding Resume Document in hand */}
            <rect x="90" y="180" width="70" height="90" rx="3" fill="#FFFDF6" stroke="#000000" strokeWidth="3" filter="url(#shadow)" />
            <line x1="102" y1="198" x2="148" y2="198" stroke="#000000" strokeWidth="3" />
            <line x1="102" y1="212" x2="140" y2="212" stroke="#64748B" strokeWidth="2" />
            <line x1="102" y1="224" x2="135" y2="224" stroke="#64748B" strokeWidth="2" />
            <circle cx="140" cy="245" r="10" fill="#F7CB46" stroke="#000000" strokeWidth="2" />
            <text x="136" y="249" fill="#000000" fontSize="10" fontWeight="900">✓</text>

            {/* Other arm crossed or on hip */}
            <path d="M 260 205 Q 280 235 250 255" fill="none" stroke="#000000" strokeWidth="4" strokeLinecap="round" />

            {/* Head & Face */}
            <rect x="185" y="165" width="30" height="25" fill="#FFFDF6" stroke="#000000" strokeWidth="3" />
            <path d="M 150 110 C 150 60 250 60 250 110 C 250 160 150 160 150 110 Z" fill="#FFFDF6" stroke="#000000" strokeWidth="3.5" />
            <path d="M 145 105 C 135 75 160 45 190 40 C 210 35 240 45 255 65 C 265 80 255 105 255 105 C 245 70 215 60 195 65 C 170 70 155 85 145 105 Z" fill="#000000" />

            {/* Confident Expression: Calm Eyes & Proud Smile */}
            <circle cx="178" cy="108" r="4" fill="#000000" />
            <circle cx="222" cy="108" r="4" fill="#000000" />
            <path d="M 170 98 Q 178 94 186 98" fill="none" stroke="#000000" strokeWidth="3" />
            <path d="M 214 98 Q 222 94 230 98" fill="none" stroke="#000000" strokeWidth="3" />
            <path d="M 182 124 Q 200 138 218 124" fill="none" stroke="#000000" strokeWidth="3.5" strokeLinecap="round" />
          </g>
        )}

        {/* 8. STATE: SUCCESS (Final CTA) */}
        {state === 'success' && (
          <g id="mascot-success">
            {/* Celebrating Torso with Raised Arms */}
            <path d="M 140 190 C 130 230 130 280 145 330 L 255 330 C 270 280 270 230 260 190 Z" fill="url(#hoodieGrad)" stroke="#000000" strokeWidth="3.5" />

            {/* Raised Fist Arm 1 */}
            <path d="M 140 200 Q 110 160 120 120" fill="none" stroke="#000000" strokeWidth="4.5" strokeLinecap="round" />
            <circle cx="120" cy="115" r="10" fill="#FFFDF6" stroke="#000000" strokeWidth="3.5" />

            {/* Raised Fist Arm 2 */}
            <path d="M 260 200 Q 290 160 280 120" fill="none" stroke="#000000" strokeWidth="4.5" strokeLinecap="round" />
            <circle cx="280" cy="115" r="10" fill="#FFFDF6" stroke="#000000" strokeWidth="3.5" />

            {/* Head & Face */}
            <rect x="185" y="165" width="30" height="25" fill="#FFFDF6" stroke="#000000" strokeWidth="3" />
            <path d="M 150 110 C 150 60 250 60 250 110 C 250 160 150 160 150 110 Z" fill="#FFFDF6" stroke="#000000" strokeWidth="3.5" />
            <path d="M 145 105 C 135 75 160 45 190 40 C 210 35 240 45 255 65 C 265 80 255 105 255 105 C 245 70 215 60 195 65 C 170 70 155 85 145 105 Z" fill="#000000" />

            {/* Joyful Victory Expression: Happy Curved Eyes & Wide Smile */}
            <path d="M 172 106 Q 178 98 184 106" fill="none" stroke="#000000" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M 216 106 Q 222 98 228 106" fill="none" stroke="#000000" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M 180 122 Q 200 148 220 122 Z" fill="#000000" />

            {/* Confetti & Star Sparkles around mascot */}
            <path d="M 90 80 L 100 80 M 95 75 L 95 85" stroke="#F7CB46" strokeWidth="3" strokeLinecap="round" />
            <path d="M 300 80 L 310 80 M 305 75 L 305 85" stroke="#FE90E8" strokeWidth="3" strokeLinecap="round" />
            <circle cx="105" cy="140" r="4" fill="#38BDF8" />
            <circle cx="295" cy="140" r="4" fill="#99E885" />
          </g>
        )}

      </svg>
    </div>
  )
}
