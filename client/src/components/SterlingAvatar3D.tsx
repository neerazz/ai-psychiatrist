interface SterlingAvatar3DProps {
  isSpeaking: boolean;
}

export function SterlingAvatar3D({ isSpeaking }: SterlingAvatar3DProps) {
  return (
    <div className="w-full h-full flex items-center justify-center">
      {/* Outer glow ring when speaking */}
      <div className="relative">
        {/* Pulsing ring */}
        <div
          className={`absolute inset-0 rounded-full transition-all duration-300 ${
            isSpeaking
              ? 'ring-4 ring-sterling-500/50 animate-pulse shadow-[0_0_40px_rgba(76,110,245,0.3)]'
              : 'ring-2 ring-slate-700/50'
          }`}
          style={{ borderRadius: '50%' }}
        />

        {/* Avatar image */}
        <img
          src="/images/dr-sterling.png"
          alt="Dr. Sterling"
          className="w-56 h-56 rounded-full object-cover shadow-2xl border-2 border-slate-700/50"
        />

        {/* Speaking indicator dot */}
        {isSpeaking && (
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-sterling-800/90 px-3 py-1 rounded-full backdrop-blur-sm border border-slate-700/50">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-slate-300">Speaking</span>
          </div>
        )}
      </div>
    </div>
  );
}
