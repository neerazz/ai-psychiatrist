export function TypingIndicator() {
  return (
    <div className="flex justify-start mb-4">
      <div className="bg-sterling-800/60 border border-slate-700/50 rounded-2xl rounded-bl-md px-4 py-3">
        <div className="text-xs text-sterling-500 font-medium mb-1">Dr. Sterling</div>
        <div className="flex gap-1.5 items-center h-5">
          <div className="typing-dot w-2 h-2 bg-sterling-500 rounded-full" />
          <div className="typing-dot w-2 h-2 bg-sterling-500 rounded-full" />
          <div className="typing-dot w-2 h-2 bg-sterling-500 rounded-full" />
        </div>
      </div>
    </div>
  );
}
