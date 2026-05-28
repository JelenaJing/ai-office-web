import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface Props {
  data: { month: string; score: number }[];
}

export function ReproducibilityTrendChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
        <YAxis domain={[50, 100]} tick={{ fontSize: 11 }} />
        <Tooltip />
        <Line type="monotone" dataKey="score" stroke="#0891B2" strokeWidth={2} dot={{ r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
