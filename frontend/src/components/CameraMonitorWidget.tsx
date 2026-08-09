import { useEffect, useRef, useState } from 'react'
import { NeuBadge } from './neu/NeuBadge'

export interface IntegrityEvent {
  id: string
  type: 'face_missing' | 'multiple_faces' | 'window_blur' | 'camera_disabled'
  severity: 'low' | 'medium' | 'high'
  timestamp: string
  duration?: number
  label: string
}

interface Props {
  stream: MediaStream | null
  onLogEvent: (event: IntegrityEvent) => void
}

export function CameraMonitorWidget({ stream, onLogEvent }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [activeStream, setActiveStream] = useState<MediaStream | null>(stream)
  const [minimized, setMinimized] = useState(false)
  const [activeAlert, setActiveAlert] = useState<string | null>(null)

  useEffect(() => {
    let localStream: MediaStream | null = stream

    async function ensureVideoPlaying() {
      if (localStream && localStream.getVideoTracks().length > 0 && localStream.getVideoTracks()[0].readyState === 'live') {
        setActiveStream(localStream)
      } else {
        try {
          localStream = await navigator.mediaDevices.getUserMedia({ video: true })
          setActiveStream(localStream)
        } catch (err) {
          console.error('CameraMonitorWidget fallback stream error:', err)
        }
      }

      if (videoRef.current && localStream) {
        videoRef.current.srcObject = localStream
        try {
          await videoRef.current.play()
        } catch (e) {
          console.error('Error playing video in CameraMonitorWidget:', e)
        }
      }
    }

    ensureVideoPlaying()
  }, [stream])

  // Track window blur / tab switching events
  useEffect(() => {
    let blurStartTime: number | null = null

    const handleBlur = () => {
      blurStartTime = Date.now()
      setActiveAlert('⚠ WINDOW INACTIVE')
    }

    const handleFocus = () => {
      if (blurStartTime) {
        const durationSec = Math.round((Date.now() - blurStartTime) / 1000)
        if (durationSec >= 2) {
          const event: IntegrityEvent = {
            id: `EVT-${Date.now().toString().slice(-4)}`,
            type: 'window_blur',
            severity: durationSec > 8 ? 'medium' : 'low',
            timestamp: new Date().toLocaleTimeString(),
            duration: durationSec,
            label: `Interview window inactive for ${durationSec} seconds`,
          }
          onLogEvent(event)
        }
        blurStartTime = null
      }
      setActiveAlert(null)
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleBlur()
      } else {
        handleFocus()
      }
    }

    window.addEventListener('blur', handleBlur)
    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('blur', handleBlur)
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [onLogEvent])

  if (!activeStream) return null

  return (
    <div className="fixed bottom-2 right-2 sm:bottom-4 sm:right-4 z-40 font-mono text-xs">
      <div className="border-2 sm:border-3 border-black bg-white shadow-neu overflow-hidden w-36 sm:w-64">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-black bg-[#C0F7FE] px-2 sm:px-3 py-1 font-black">
          <div className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 animate-ping rounded-full bg-[#99E885]"></span>
            <span className="text-[9px] sm:text-[10px] text-black">LIVE CAMERA</span>
          </div>

          <button
            type="button"
            onClick={() => setMinimized(!minimized)}
            className="text-[9px] sm:text-[10px] font-black hover:underline"
          >
            {minimized ? '[ + ]' : '[ — ]'}
          </button>
        </div>

        {/* Video Box */}
        {!minimized && (
          <div className="relative h-24 sm:h-40 bg-black">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              onLoadedMetadata={() => {
                videoRef.current?.play().catch(console.error)
              }}
              className="h-full w-full object-cover"
            />

            {activeAlert && (
              <div className="absolute inset-x-0 bottom-0 bg-[#FE90E8] p-0.5 sm:p-1 text-[8px] sm:text-[10px] font-black text-black text-center border-t border-black">
                {activeAlert}
              </div>
            )}
          </div>
        )}

        {/* Status Bar */}
        <div className="p-1 sm:p-2 bg-[#FFFDF6] border-t border-slate-200 flex items-center justify-between text-[8px] sm:text-[10px] font-bold">
          <span className="hidden sm:inline">INTEGRITY MONITOR:</span>
          <NeuBadge variant="green" className="text-[8px] sm:text-[9px] px-1 py-0.5">ACTIVE</NeuBadge>
        </div>

      </div>
    </div>
  )
}
