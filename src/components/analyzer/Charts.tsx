"use client";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatNumber, formatPercent } from "@/lib/formatters";
import { EmptyState } from "./Panel";
export interface ChartDatum {
  name: string;
  value: number;
  color?: string;
}
function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: readonly {
    name?: string | number;
    value?: string | number;
    payload?: { name?: string };
  }[];
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p>{payload[0].payload?.name}</p>
      <p>{formatNumber(Number(payload[0].value))}</p>
    </div>
  );
}
export function HorizontalChart({
  data,
  label,
  color = "#82c8d5",
  limit = 8,
}: {
  data: ChartDatum[];
  label: string;
  color?: string;
  limit?: number;
}) {
  const displayed = [...data]
    .filter((r) => r.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
  if (!displayed.length)
    return <EmptyState>Sem valores positivos para este gráfico.</EmptyState>;
  const height = Math.max(210, displayed.length * 35 + 20);
  return (
    <div
      className="chart-container"
      style={{ height }}
      role="img"
      aria-label={`${label}: ${displayed.map((r) => `${r.name}, ${formatNumber(r.value)}`).join("; ")}`}
    >
      <ResponsiveContainer
        width="100%"
        height="100%"
        minWidth={0}
        initialDimension={{ width: 500, height }}
      >
        <BarChart
          data={displayed}
          layout="vertical"
          margin={{ top: 8, right: 70, left: 0, bottom: 8 }}
          barSize={9}
        >
          <XAxis type="number" hide domain={[0, "dataMax"]} />
          <YAxis
            type="category"
            dataKey="name"
            width={122}
            axisLine={false}
            tickLine={false}
            tick={{
              fill: "#adbac8",
              fontSize: 10,
              fontFamily: "Manrope Variable",
            }}
            tickFormatter={(name) =>
              name.length > 19 ? `${name.slice(0, 17)}…` : name
            }
          />
          <Tooltip
            content={<ChartTooltip />}
            cursor={{ fill: "#25313d", opacity: 0.4 }}
          />
          <Bar
            dataKey="value"
            radius={[0, 3, 3, 0]}
            isAnimationActive={false}
            label={{
              position: "right",
              fill: "#b5c1cd",
              fontSize: 10,
              formatter: (v: unknown) => formatNumber(Number(v)),
            }}
          >
            {displayed.map((row) => (
              <Cell key={row.name} fill={row.color ?? color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
const chartColors = [
  "#82c8d5",
  "#a293ce",
  "#d7b978",
  "#8abb99",
  "#cf8da7",
  "#91a6b7",
];
export function SpendingChart({ data }: { data: ChartDatum[] }) {
  const positive = data
    .filter((r) => r.value > 0)
    .sort((a, b) => b.value - a.value);
  if (!positive.length)
    return <EmptyState>Nenhum gasto registrado.</EmptyState>;
  const displayed = positive.slice(0, 5);
  if (positive.length > 5)
    displayed.push({
      name: "Outros supplies",
      value: positive.slice(5).reduce((sum, r) => sum + r.value, 0),
    });
  const total = positive.reduce((sum, r) => sum + r.value, 0);
  return (
    <div className="panel-body flex flex-wrap items-center gap-7">
      <div
        className="h-52 w-52 shrink-0 mx-auto"
        role="img"
        aria-label="Distribuição dos gastos entre os supplies registrados"
      >
        <ResponsiveContainer
          width="100%"
          height="100%"
          initialDimension={{ width: 208, height: 208 }}
        >
          <PieChart>
            <Pie
              data={displayed}
              dataKey="value"
              nameKey="name"
              innerRadius={65}
              outerRadius={92}
              stroke="#141920"
              strokeWidth={4}
              isAnimationActive={false}
            >
              {displayed.map((row, index) => (
                <Cell
                  key={row.name}
                  fill={chartColors[index % chartColors.length]}
                />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
            <text
              x="50%"
              y="47%"
              textAnchor="middle"
              fill="#98a4b3"
              fontSize={10}
            >
              Gastos registrados
            </text>
            <text
              x="50%"
              y="58%"
              textAnchor="middle"
              fill="#edf1f5"
              fontSize={17}
              fontFamily="IBM Plex Mono"
            >
              {formatNumber(total)}
            </text>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="min-w-40 flex-1">
        {displayed.map((row, index) => (
          <div key={row.name} className="mini-row">
            <div className="name">
              <span
                className="h-2 w-2 shrink-0 rounded-sm"
                style={{ background: chartColors[index % chartColors.length] }}
              />
              {row.name}
            </div>
            <span className="value muted">
              {formatPercent((row.value / total) * 100)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
