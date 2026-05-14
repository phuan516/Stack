import type { SummaryStats } from '../packing/types';

interface Props {
  summary: SummaryStats;
}

export function SummaryBar({ summary }: Props) {
  const fillClass = summary.avgFill >= 0.6 ? 'good' : summary.avgFill >= 0.3 ? 'warn' : 'bad';

  return (
    <div className="summary">
      <div className="stat">
        <span className="k">Fill</span>
        <span className={`v ${fillClass}`}>{Math.round(summary.avgFill * 100)}%</span>
      </div>
      <div className="summary-sep" />
      <div className="stat">
        <span className="k">Boxes used</span>
        <span className="v">{summary.boxesUsed} / {summary.totalBoxes}</span>
      </div>
      <div className="summary-sep" />
      <div className="stat">
        <span className="k">Items packed</span>
        <span className="v">{summary.totalItems}</span>
      </div>
      {summary.unpacked > 0 && (
        <>
          <div className="summary-sep" />
          <div className="stat">
            <span className="k">Unpacked</span>
            <span className="v bad">{summary.unpacked}</span>
          </div>
        </>
      )}
    </div>
  );
}
