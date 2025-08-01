/**
 * WorkPressureGauge - Componente gauge per visualizzare la pressione di lavoro
 */

interface WorkPressureGaugeProps {
  value: number;
  maxValue?: number;
  size?: number;
  title: string;
}

export const WorkPressureGauge = ({ 
  value, 
  maxValue = 200, 
  size = 120, 
  title 
}: WorkPressureGaugeProps) => {
  // Calcola la percentuale reale del valore rispetto al range 0-maxValue
  const valuePercentage = Math.min((value / maxValue) * 100, 100);
  
  // L'arco va da -90° a +90° (180° totali)
  // 0% = -90°, 100% = +90°
  const needleAngle = -90 + (valuePercentage / 100) * 180;
  
  const getColor = (val: number) => {
    if (val < 80) return '#10B981'; // Verde (sotto 80%)
    if (val <= 100) return '#F59E0B'; // Giallo (80-100%)
    return '#EF4444'; // Rosso (sopra 100%)
  };

  const radius = size / 2 - 20;
  const centerX = size / 2;
  const centerY = size / 2;
  
  // Calcola la lunghezza dell'arco da colorare
  const arcLength = (valuePercentage / 100) * Math.PI * radius;
  const totalArcLength = Math.PI * radius;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size / 2 + 20 }}>
        {/* Sfondo gauge - arco completo grigio */}
        <svg width={size} height={size / 2 + 20} className="absolute">
          {/* Arco di sfondo */}
          <path
            d={`M 20 ${centerY} A ${radius} ${radius} 0 0 1 ${size - 20} ${centerY}`}
            fill="none"
            stroke="#E5E7EB"
            strokeWidth="8"
            strokeLinecap="round"
          />
          
          {/* Arco colorato - deve partire da sinistra */}
          <path
            d={`M 20 ${centerY} A ${radius} ${radius} 0 0 1 ${size - 20} ${centerY}`}
            fill="none"
            stroke={getColor(value)}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${arcLength} ${totalArcLength}`}
            strokeDashoffset="0"
          />
        </svg>
        
        {/* Ago - ruotato dall'angolo calcolato */}
        <div 
          className="absolute bg-gray-800 origin-bottom rounded-full"
          style={{
            width: '2px',
            height: radius - 15,
            left: centerX - 1,
            bottom: 20,
            transform: `rotate(${needleAngle}deg)`,
            transformOrigin: 'bottom center'
          }}
        />
        
        {/* Centro - punto di rotazione */}
        <div 
          className="absolute w-4 h-4 bg-gray-800 rounded-full border-2 border-white"
          style={{
            left: centerX - 8,
            bottom: 12
          }}
        />
      </div>
      
      <div className="text-center mt-2">
        <div className="text-sm font-medium text-gray-900">{title}</div>
        <div className="text-xs text-gray-600">
          {Math.round(value)}% {value > 200 ? '(Max 200%)' : value > 100 ? '(Overtime)' : ''}
        </div>
        <div className="text-xs text-gray-400 mt-1">
          Ore effettive / Ore disponibili
        </div>
      </div>
    </div>
  );
};
