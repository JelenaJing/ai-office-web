import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface Curve {
  name: string;
  data: { cycle: number; capacity: number }[];
}

const COLORS = ["#1E3A8A", "#0891B2", "#F97316"];

export function BatteryCycleLineChart({ curves }: { curves: Curve[] }) {
  const merged: Record<string, number | string>[] = [];
  const cycles = curves[0]?.data.map((d) => d.cycle) ?? [];
  cycles.forEach((cycle) => {
    const row: Record<string, number | string> = { cycle };
    curves.forEach((c) => {
      const pt = c.data.find((d) => d.cycle === cycle);
      row[c.name] = pt?.capacity ?? 0;
    });
    merged.push(row);
  });

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={merged}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="cycle" label={{ value: "循环圈数", position: "insideBottom", offset: -5 }} />
        <YAxis label={{ value: "比容量 mAh/g", angle: -90, position: "insideLeft" }} />
        <Tooltip />
        <Legend />
        {curves.map((c, i) => (
          <Line key={c.name} type="monotone" dataKey={c.name} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={false} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
