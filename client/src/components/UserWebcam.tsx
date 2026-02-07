import { useEffect, useRef, useState } from 'react';

export function UserWebcam() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCamera, setHasCamera] = useState(true);

  useEffect(() => {
    let stream: MediaStream | null = null;

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: false })
      .then(s => {
        stream = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
        }
      })
      .catch(() => {
        setHasCamera(false);
      });

    return () => {
      stream?.getTracks().forEach(t => t.stop());
    };
  }, []);

  if (!hasCamera) {
    return (
      <div className="absolute bottom-4 right-4 w-[140px] h-[105px] rounded-xl bg-sterling-800 border border-slate-600 flex items-center justify-center z-10">
        <div className="text-center">
          <div className="w-8 h-8 rounded-full bg-sterling-700 flex items-center justify-center mx-auto mb-1">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-slate-400">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
          </div>
          <span className="text-xs text-slate-500">You</span>
        </div>
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      autoPlay
      muted
      playsInline
      className="absolute bottom-4 right-4 w-[140px] h-[105px] rounded-xl border-2 border-slate-600 object-cover z-10 shadow-lg"
      style={{ transform: 'scaleX(-1)' }}
    />
  );
}
