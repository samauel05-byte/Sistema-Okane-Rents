// Validated (dark surface #1a1a19): blue vs orange clears CVD + contrast
// checks as a 2-series categorical pair — see the dataviz skill's palette.
const COLOR_COLLECTED = "#3987e5";
const COLOR_EXPENSES = "#d95926";

type MonthDatum = { label: string; collected: number; expenses: number };

export default function MonthlyBarChart({ data }: { data: MonthDatum[] }) {
  const width = 640;
  const height = 220;
  const paddingLeft = 8;
  const paddingRight = 8;
  const paddingTop = 16;
  const paddingBottom = 28;
  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;
  const baseY = paddingTop + chartHeight;

  const max = Math.max(1, ...data.flatMap((d) => [d.collected, d.expenses]));
  const groupWidth = chartWidth / Math.max(1, data.length);
  const barWidth = Math.min(28, (groupWidth - 16) / 2);
  const barGap = 3;

  const barHeight = (value: number) => (value / max) * chartHeight;

  return (
    <div>
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full min-w-[480px]"
          role="img"
          aria-label="Cobros y eventualidades por mes, en pesos dominicanos"
        >
          {[0, 0.25, 0.5, 0.75, 1].map((t) => (
            <line
              key={t}
              x1={paddingLeft}
              x2={width - paddingRight}
              y1={paddingTop + chartHeight * (1 - t)}
              y2={paddingTop + chartHeight * (1 - t)}
              stroke="#2c2c2a"
              strokeWidth={1}
            />
          ))}
          <line
            x1={paddingLeft}
            x2={width - paddingRight}
            y1={baseY}
            y2={baseY}
            stroke="#383835"
            strokeWidth={1}
          />

          {data.map((d, i) => {
            const centerX = paddingLeft + i * groupWidth + groupWidth / 2;
            const collectedH = barHeight(d.collected);
            const expensesH = barHeight(d.expenses);
            return (
              <g key={`${d.label}-${i}`}>
                <rect
                  x={centerX - barWidth - barGap / 2}
                  y={baseY - collectedH}
                  width={barWidth}
                  height={Math.max(collectedH, 1)}
                  rx={2}
                  fill={COLOR_COLLECTED}
                >
                  <title>
                    {d.label} — Cobrado: {d.collected.toLocaleString("es-DO")}
                  </title>
                </rect>
                <rect
                  x={centerX + barGap / 2}
                  y={baseY - expensesH}
                  width={barWidth}
                  height={Math.max(expensesH, 1)}
                  rx={2}
                  fill={COLOR_EXPENSES}
                >
                  <title>
                    {d.label} — Eventualidades: {d.expenses.toLocaleString("es-DO")}
                  </title>
                </rect>
                <text
                  x={centerX}
                  y={height - 8}
                  textAnchor="middle"
                  fontSize={11}
                  fill="#898781"
                >
                  {d.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <div className="mt-2 flex items-center gap-4 text-xs text-slate-400">
        <span className="flex items-center gap-1.5">
          <span
            className="h-2.5 w-2.5 rounded-sm"
            style={{ background: COLOR_COLLECTED }}
          />
          Cobrado
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="h-2.5 w-2.5 rounded-sm"
            style={{ background: COLOR_EXPENSES }}
          />
          Eventualidades
        </span>
      </div>
    </div>
  );
}
