import type { TopicBucket, TopicItem, TopicDepth } from '../core/types.ts';

interface TopicBucketPanelProps {
  bucket: TopicBucket;
  isVisible: boolean;
  onClose: () => void;
}

const DEPTH_COLORS: Record<TopicDepth, { bg: string; border: string; label: string }> = {
  mentioned: { bg: 'bg-slate-700/60', border: 'border-slate-500/40', label: 'New' },
  exploring: { bg: 'bg-blue-900/60', border: 'border-blue-500/50', label: 'Exploring' },
  deep: { bg: 'bg-indigo-900/60', border: 'border-indigo-400/50', label: 'Deep' },
  resolved: { bg: 'bg-emerald-900/40', border: 'border-emerald-500/30', label: 'Covered' },
};

function TopicBubble({ topic, animationDelay }: { topic: TopicItem; animationDelay: number }) {
  const style = DEPTH_COLORS[topic.depth];
  const sizeClass = topic.depth === 'deep'
    ? 'px-3 py-2'
    : topic.depth === 'exploring'
    ? 'px-3 py-1.5'
    : 'px-2.5 py-1';

  return (
    <div
      className={`bucket-bubble ${style.bg} ${style.border} border rounded-full ${sizeClass} 
        text-xs leading-tight flex items-center gap-1.5 max-w-full transition-all duration-500`}
      style={{ animationDelay: `${animationDelay}ms` }}
      title={topic.notes || undefined}
    >
      <span className="truncate text-slate-200">{topic.topic}</span>
      {topic.carryOver && (
        <span className="text-[10px] text-amber-400/80 shrink-0">prev</span>
      )}
      <span className={`text-[10px] shrink-0 ${
        topic.depth === 'deep' ? 'text-indigo-300' :
        topic.depth === 'exploring' ? 'text-blue-300' :
        'text-slate-400'
      }`}>
        {style.label}
      </span>
    </div>
  );
}

function SectionHeader({ label, count }: { label: string; count: number }) {
  if (count === 0) return null;
  return (
    <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-1.5 mt-3 first:mt-0">
      {label} <span className="text-slate-600">({count})</span>
    </div>
  );
}

export function TopicBucketPanel({ bucket, isVisible, onClose }: TopicBucketPanelProps) {
  if (!isVisible) return null;

  const hasContent = bucket.active.length > 0 || bucket.pending.length > 0 || bucket.resolved.length > 0;

  return (
    <div className="bucket-panel w-64 bg-sterling-900/95 border border-slate-700/50 rounded-xl backdrop-blur-md shadow-xl overflow-hidden flex flex-col max-h-[60vh]">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-700/30">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-400 bucket-pulse" />
          <span className="text-xs font-medium text-slate-300">Session Topics</span>
          <span className="text-[10px] text-slate-500">Turn {bucket.turnCount}</span>
        </div>
        <button
          onClick={onClose}
          className="text-slate-500 hover:text-slate-300 transition-colors text-sm leading-none"
          aria-label="Close topic panel"
        >
          &times;
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {!hasContent && (
          <div className="text-xs text-slate-500 italic py-4 text-center">
            Topics will appear as the conversation flows...
          </div>
        )}

        {/* Active topics */}
        <SectionHeader label="In Focus" count={bucket.active.length} />
        <div className="flex flex-wrap gap-1.5">
          {bucket.active.map((t, i) => (
            <TopicBubble key={t.id} topic={t} animationDelay={i * 80} />
          ))}
        </div>

        {/* Pending topics */}
        <SectionHeader label="Coming Up" count={bucket.pending.length} />
        <div className="flex flex-wrap gap-1.5">
          {bucket.pending.map((t, i) => (
            <TopicBubble key={t.id} topic={t} animationDelay={(bucket.active.length + i) * 80} />
          ))}
        </div>

        {/* Resolved */}
        {bucket.resolved.length > 0 && (
          <>
            <SectionHeader label="Covered" count={bucket.resolved.length} />
            <div className="flex flex-wrap gap-1.5 opacity-50">
              {bucket.resolved.filter(t => !t.carryOver).map((t, i) => (
                <TopicBubble key={t.id} topic={t} animationDelay={0} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Footer — emotional arc + insights */}
      {(bucket.emotionalArc || bucket.sessionInsights.length > 0) && (
        <div className="border-t border-slate-700/30 px-3 py-2 space-y-1">
          {bucket.emotionalArc && (
            <div className="text-[10px] text-slate-400 leading-tight">
              <span className="text-slate-500">Arc:</span> {bucket.emotionalArc}
            </div>
          )}
          {bucket.sessionInsights.length > 0 && (
            <div className="text-[10px] text-slate-400 leading-tight">
              <span className="text-slate-500">Insight:</span> {bucket.sessionInsights[bucket.sessionInsights.length - 1]}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
