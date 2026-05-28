import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface Point {
  coinCapacity: number;
  pouchRetention: number;
  reliability: number;
  system: string;
}

const COLORS = ["#1E3A8A", "#0891B2", "#16A34A", "#F97316", "#DC2626", "#64748B"];

export function CoinToPouchScatterChart({ data }: { data: Point[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <ScatterChart>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" dataKey="coinCapacity" name="扣电容量" unit=" mAh/g" />
        <YAxis type="number" dataKey="pouchRetention" name="软包保持率" unit="%" />
        <ZAxis type="number" dataKey="reliability" range={[50, 400]} />
        <Tooltip cursor={{ strokeDasharray: "3 3" }} formatter={(v: number, n: string) => [v, n]} />
        <Scatter data={data} name="样品">
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  );
}
