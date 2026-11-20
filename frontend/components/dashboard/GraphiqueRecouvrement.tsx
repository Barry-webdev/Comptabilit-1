'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LabelList,
} from 'recharts';

type Donnee = {
  classe: string;
  taux: number;
  paye: number;
  attendu: number;
};

type Props = { data: Donnee[] };

function couleurBarre(taux: number): string {
  if (taux >= 80) return '#176B45';
  if (taux >= 50) return '#D97706';
  return '#DC2626';
}

export default function GraphiqueRecouvrement({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 48, left: 8, bottom: 4 }}
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
        <XAxis
          type="number"
          domain={[0, 100]}
          tickFormatter={(v) => `${v}%`}
          tick={{ fontSize: 11, fill: '#64748B' }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          type="category"
          dataKey="classe"
          tick={{ fontSize: 11, fill: '#172B4D' }}
          tickLine={false}
          axisLine={false}
          width={56}
        />
        <Tooltip
          formatter={(value) => [`${value ?? 0}%`, 'Taux de recouvrement']}
          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E2E8F0' }}
        />
        <Bar dataKey="taux" radius={[0, 6, 6, 0]} maxBarSize={28}>
          {data.map((entry, index) => (
            <Cell key={index} fill={couleurBarre(entry.taux)} />
          ))}
          <LabelList
            dataKey="taux"
            position="right"
            formatter={(v: unknown) => `${v}%`}
            style={{ fontSize: 11, fontWeight: 700, fill: '#172B4D' }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
