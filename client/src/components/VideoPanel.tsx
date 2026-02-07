import { SterlingAvatar3D } from './SterlingAvatar3D.tsx';
import { UserWebcam } from './UserWebcam.tsx';

interface VideoPanelProps {
  isSpeaking: boolean;
}

export function VideoPanel({ isSpeaking }: VideoPanelProps) {
  return (
    <div className="relative h-[50vh] min-h-[300px] bg-gradient-to-b from-sterling-900 via-sterling-800/50 to-sterling-900 border-b border-slate-800">
      <SterlingAvatar3D isSpeaking={isSpeaking} />
      <UserWebcam />

      {/* Name overlay */}
      <div className="absolute top-3 left-4 z-10">
        <div className="flex items-center gap-2 bg-sterling-900/70 px-3 py-1.5 rounded-lg backdrop-blur-sm">
          <div className="w-5 h-5 rounded-full bg-sterling-600/30 flex items-center justify-center">
            <span className="text-sterling-500 text-[10px] font-bold">DS</span>
          </div>
          <span className="text-xs text-white font-medium">Dr. Sterling</span>
        </div>
      </div>
    </div>
  );
}
