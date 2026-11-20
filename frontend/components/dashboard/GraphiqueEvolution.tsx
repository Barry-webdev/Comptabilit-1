'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { formatGNF } from '@/lib/utils';

type Mois = {
  mois: string;
  recettes: number;
  depenses: number;
};

type Props = {
  data: Mois[];
  couleurRecettes?: string;
  couleurDepenses?: string;
};

function formatMilliers(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}k`;
  return String(value);
}

export default function GraphiqueEvolution({
  data,
  couleurRecettes = '#6366f1',
  couleurDepenses = '#f87171',
}: Props) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="mois" tick={{ fontSize: 12 }} />
        <YAxis tickFormatter={formatMilliers} tick={{ fontSize: 12 }} />
        <Tooltip
          formatter={(value) =>
            typeof value === 'number' ? formatGNF(value) : value
          }
        />
        <Legend />
        <Bar dataKey="recettes" name="Recettes" fill={couleurRecettes} radius={[4, 4, 0, 0]} />
        <Bar dataKey="depenses" name="Dépenses" fill={couleurDepenses} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
