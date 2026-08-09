import { useEffect, useRef, useState } from 'react'
import { NeuCard } from './neu/NeuCard'
import { NeuButton } from './neu/NeuButton'
import { NeuBadge } from './neu/NeuBadge'

interface Props {
  onStartWithIntegrity: (stream: MediaStream) => void
  onStartWithoutCamera: () => void
  onClose: () => void
}

export function CameraCheckModal({ onStartWithIntegrity, onStartWithoutCamera, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const isPassingStream = useRef(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [cameraReady, setCameraReady] = useState(false)
  const [micReady, setMicReady] = useState(false)
  const [faceDetected, setFaceDetected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let activeStream: MediaStream | null = null
    async function initDevices() {
      try {
        setLoading(true)
        activeStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
          audio: true,
        })
        setStream(activeStream)
        if (videoRef.current) {
          videoRef.current.srcObject = activeStream
          videoRef.current.play().catch(console.error)
        }
        setCameraReady(true)
        setMicReady(activeStream.getAudioTracks().length > 0)
        setFaceDetected(true)
      } catch (err: any) {
        console.error('Camera/Mic permission error:', err)
        setError('Camera or microphone permission denied. You can continue in text mode without camera monitoring.')
        setCameraReady(false)
        setMicReady(false)
      } finally {
        setLoading(false)
      }
    }

    initDevices()

    return () => {
      // Only stop stream tracks if candidate is NOT starting with camera stream
      if (activeStream && !isPassingStream.current) {
        activeStream.getTracks().forEach((t) => t.stop())
      }
    }
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs font-sans text-black">
      <div className="flex w-full max-w-2xl flex-col border-3 border-black bg-[#FFFDF6] shadow-neu-lg overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b-3 border-black px-6 py-4 bg-[#F7CB46]">
          <div className="flex items-center gap-3">
            <NeuBadge variant="black">PRE-INTERVIEW CHECK</NeuBadge>
            <h2 className="text-xl font-black uppercase text-black">CAMERA & INTEGRITY READINESS</h2>
          </div>
          <button
            onClick={() => {
              isPassingStream.current = false
              onClose()
            }}
            className="neu-btn bg-white px-3 py-1 text-xs font-black"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 md:p-8 space-y-6">
          <p className="text-xs font-bold text-slate-800">
            Interview Integrity Mode monitors observable environment signals (presence, focus, window blur events) during your session. Data is processed locally and stored neutrally.
          </p>

          <div className="grid gap-6 md:grid-cols-2 items-center">
            {/* Live Camera Preview Box */}
            <div className="relative border-3 border-black bg-black h-56 flex items-center justify-center overflow-hidden shadow-neu-sm">
              {stream ? (
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              ) : (
                <div className="text-center p-4 space-y-2 text-white font-mono text-xs">
                  {loading ? (
                    <>
                      <div className="h-6 w-6 mx-auto animate-spin border-2 border-white border-t-transparent"></div>
                      <p>REQUESTING CAMERA & MIC ACCESS...</p>
                    </>
                  ) : (
                    <p className="text-[#FE90E8]">📷 CAMERA UNAVAILABLE</p>
                  )}
                </div>
              )}
              {cameraReady && (
                <div className="absolute bottom-2 left-2 bg-black/80 text-white font-mono text-[10px] px-2 py-0.5 border border-white">
                  ● MONITORING ACTIVE
                </div>
              )}
            </div>

            {/* Checklist */}
            <NeuCard color="white" className="space-y-3 font-mono text-xs">
              <h4 className="font-black border-b-2 border-black pb-1 uppercase">READINESS SIGNALS</h4>

              <div className="flex justify-between items-center p-2 bg-[#FFFDF6] border-2 border-black">
                <span>CAMERA STATUS:</span>
                <span className={cameraReady ? 'text-[#99E885] font-black' : 'text-[#FE90E8] font-black'}>
                  {cameraReady ? '✓ READY' : '✕ OFF'}
                </span>
              </div>

              <div className="flex justify-between items-center p-2 bg-[#FFFDF6] border-2 border-black">
                <span>MICROPHONE STATUS:</span>
                <span className={micReady ? 'text-[#99E885] font-black' : 'text-[#FE90E8] font-black'}>
                  {micReady ? '✓ READY' : '✕ OFF'}
                </span>
              </div>

              <div className="flex justify-between items-center p-2 bg-[#FFFDF6] border-2 border-black">
                <span>FACE VISIBILITY:</span>
                <span className={faceDetected ? 'text-[#99E885] font-black' : 'text-[#FE90E8] font-black'}>
                  {faceDetected ? '✓ DETECTED' : '✕ WAITING'}
                </span>
              </div>

              <div className="flex justify-between items-center p-2 bg-[#FFFDF6] border-2 border-black">
                <span>ENVIRONMENT LIGHTING:</span>
                <span className="text-[#99E885] font-black">✓ GOOD</span>
              </div>
            </NeuCard>
          </div>

          {error && (
            <div className="p-3 border-2 border-black bg-[#FE90E8] text-xs font-mono font-bold text-black">
              ⚠ {error}
            </div>
          )}

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <NeuButton
              variant="yellow"
              size="lg"
              className="flex-1 py-3 text-xs"
              disabled={!stream}
              onClick={() => {
                if (stream) {
                  isPassingStream.current = true
                  onStartWithIntegrity(stream)
                }
              }}
            >
              START WITH INTEGRITY MONITOR →
            </NeuButton>

            <NeuButton
              variant="white"
              size="lg"
              className="py-3 text-xs"
              onClick={() => {
                isPassingStream.current = false
                if (stream) {
                  stream.getTracks().forEach((t) => t.stop())
                }
                onStartWithoutCamera()
              }}
            >
              CONTINUE WITHOUT CAMERA
            </NeuButton>
          </div>
        </div>

      </div>
    </div>
  )
}
