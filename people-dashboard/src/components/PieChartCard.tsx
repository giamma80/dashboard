import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { PieChart as PieChartIcon } from 'lucide-react';

// Funzione helper per posizionare le label all'interno delle fette
const renderInsidePieLabel = (entry: any) => {
  const percent = (entry.percent * 100).toFixed(1);
  if (parseFloat(percent) < 5) return ''; // Non mostrare percentuali troppo piccole
  return `${percent}%`;
};

export interface PieChartData {
  name: string;
  value: number;
  color?: string;
}

interface PieChartCardProps {
  title: string;
  data: PieChartData[];
  iconColor?: string;
  height?: number;
  outerRadius?: number;
  innerRadius?: number;
  showLegend?: boolean;
  generateColors?: boolean;
  colorSeed?: number;
  className?: string;
}

const PieChartCard: React.FC<PieChartCardProps> = ({
  title,
  data,
  iconColor = 'text-blue-500',
  height = 360,
  outerRadius = 100,
  innerRadius = 0,
  showLegend = true,
  generateColors = true,
  colorSeed = 0,
  className = ''
}) => {
  const generateColor = (index: number) => {
    if (!generateColors && data[index]?.color) {
      return data[index].color;
    }
    return `hsl(${(index * 60 + colorSeed) % 360}, 70%, 60%)`;
  };

  return (
    <div className={`bg-white rounded-lg shadow-md p-8 ${className}`}>
      <h4 className="font-medium text-gray-900 mb-6 flex items-center gap-2">
        <PieChartIcon className={`w-4 h-4 ${iconColor}`} />
        {title}
      </h4>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            cx="50%"
            cy="50%"
            outerRadius={outerRadius}
            innerRadius={innerRadius}
            paddingAngle={2}
            label={renderInsidePieLabel}
            labelLine={false}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={generateColor(index)} />
            ))}
          </Pie>
          <Tooltip />
          {showLegend && (
            <Legend 
              wrapperStyle={{ fontSize: '12px', paddingTop: '15px' }}
              iconSize={8}
            />
          )}
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

// Varianti predefinite per diversi tipi di grafici
export const StatusPieChart: React.FC<{ data: Record<string, number> }> = ({ data }) => (
  <PieChartCard
    title="Stati Progetti"
    iconColor="text-blue-500"
    data={Object.entries(data).map(([name, value]) => ({ name, value }))}
    colorSeed={0}
  />
);

export const PriorityPieChart: React.FC<{ data: Record<string, number> }> = ({ data }) => (
  <PieChartCard
    title="Priorità Progetti"
    iconColor="text-red-500"
    data={Object.entries(data).map(([name, value]) => ({ name, value }))}
    colorSeed={20}
  />
);

export const StreamPieChart: React.FC<{ data: Array<{ stream: string; projects: number; color: string }> }> = ({ data }) => (
  <PieChartCard
    title="Distribuzione Stream"
    iconColor="text-purple-500"
    data={data.map(item => ({ name: item.stream, value: item.projects, color: item.color }))}
    generateColors={false}
  />
);

export const TypePieChart: React.FC<{ data: Record<string, number> }> = ({ data }) => (
  <PieChartCard
    title="Tipi Progetti"
    iconColor="text-orange-500"
    data={Object.entries(data).map(([name, value]) => ({ name, value }))}
    colorSeed={40}
  />
);

export default PieChartCard;
