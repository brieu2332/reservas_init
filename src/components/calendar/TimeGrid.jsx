import React, { useEffect, useRef, useState } from 'react';
import { cn } from "@/lib/utils";

const HOURS = [];
for (let h = 7; h <= 22; h++) {
  HOURS.push(`${h.toString().padStart(2, '0')}:00`);
  if (h < 22) HOURS.push(`${h.toString().padStart(2, '0')}:30`);
}

export default function TimeGrid({ children }) {
  const [currentTimePosition, setCurrentTimePosition] = useState(null);
  const gridRef = useRef(null);

  useEffect(() => {
    const updateCurrentTime = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      
      if (hours >= 7 && hours < 23) {
        const totalMinutes = (hours - 7) * 60 + minutes;
        const totalGridMinutes = 16 * 60; // 7:00 to 23:00
        const percentage = (totalMinutes / totalGridMinutes) * 100;
        setCurrentTimePosition(percentage);
      } else {
        setCurrentTimePosition(null);
      }
    };

    updateCurrentTime();
    const interval = setInterval(updateCurrentTime, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Coluna de Horários */}
      <div className="w-16 flex-shrink-0 border-r border-gray-200 bg-gray-50/50">
        {HOURS.map((time, index) => (
          <div 
            key={time} 
            className={cn(
              "h-12 flex items-start justify-end pr-2 pt-0",
              index % 2 === 0 ? "text-xs text-gray-500 font-medium" : "text-[10px] text-gray-400"
            )}
          >
            {time}
          </div>
        ))}
      </div>

      {/* Grid Principal */}
      <div className="flex-1 relative overflow-x-auto" ref={gridRef}>
        {/* Linhas de Grade */}
        <div className="absolute inset-0 pointer-events-none">
          {HOURS.map((time, index) => (
            <div 
              key={time}
              className={cn(
                "h-12 border-b",
                index % 2 === 0 ? "border-gray-200" : "border-gray-100"
              )}
            />
          ))}
        </div>

        {/* Linha do Horário Atual */}
        {currentTimePosition !== null && (
          <div 
            className="absolute left-0 right-0 z-20 pointer-events-none"
            style={{ top: `${currentTimePosition}%` }}
          >
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-red-500 -ml-1.5" />
              <div className="flex-1 h-0.5 bg-red-500" />
            </div>
          </div>
        )}

        {/* Conteúdo (Reservas) */}
        <div className="relative min-w-full">
          {children}
        </div>
      </div>
    </div>
  );
}