import type { CrisisResult } from '../core/types.ts';

interface CrisisBannerProps {
  crisis: CrisisResult;
}

const tierConfig = {
  1: {
    bg: 'bg-crisis-yellow/10',
    border: 'border-crisis-yellow/30',
    text: 'text-crisis-yellow',
    label: 'Attention',
  },
  2: {
    bg: 'bg-crisis-orange/10',
    border: 'border-crisis-orange/30',
    text: 'text-crisis-orange',
    label: 'Elevated',
  },
  3: {
    bg: 'bg-crisis-red/10',
    border: 'border-crisis-red/30',
    text: 'text-crisis-red',
    label: 'Immediate',
  },
};

export function CrisisBanner({ crisis }: CrisisBannerProps) {
  if (!crisis.detected || !crisis.tier) return null;

  const config = tierConfig[crisis.tier];

  return (
    <div className={`${config.bg} ${config.border} border rounded-lg px-4 py-3 mb-4 mx-4`}>
      <div className="flex items-center gap-2">
        <span className={`${config.text} font-semibold text-sm`}>
          {config.label}
        </span>
        {crisis.indicators.length > 0 && (
          <span className="text-xs text-slate-400">
            {crisis.indicators.slice(0, 2).join(' | ')}
          </span>
        )}
      </div>
    </div>
  );
}
