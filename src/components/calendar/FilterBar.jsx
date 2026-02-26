import React from 'react';
import { Sun, Sunset, Moon, CalendarDays, Calendar } from 'lucide-react';
import { cn } from "@/lib/utils";

const SHIFTS = [
  { id: 'morning', label: 'Manhã', icon: Sun, start: '07:00', end: '12:00', color: 'bg-amber-500' },
  { id: 'afternoon', label: 'Tarde', icon: Sunset, start: '13:00', end: '18:00', color: 'bg-orange-500' },
  { id: 'evening', label: 'Noite', icon: Moon, start: '18:30', end: '22:30', color: 'bg-indigo-500' },
];

export default function FilterBar({ 
  selectedShifts, 
  onShiftsChange, 
  viewMode, 
  onViewChange 
}) {
  const toggleShift = (shiftId) => {
    if (selectedShifts.includes(shiftId)) {
      // Remove se já está selecionado (mas mantém pelo menos um ou permite todos desmarcados)
      const newShifts = selectedShifts.filter(s => s !== shiftId);
      onShiftsChange(newShifts);
    } else {
      // Adiciona à seleção
      onShiftsChange([...selectedShifts, shiftId]);
    }
  };

  return (
    <div className="bg-gray-50 border-b border-gray-200 px-4 lg:px-6 py-2.5">
      <div className="flex items-center justify-between">
        {/* Toggle Chips de Turno - Seleção Múltipla */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500 mr-2">Turnos:</span>
          <div className="flex items-center gap-1.5">
            {SHIFTS.map((shift) => {
              const Icon = shift.icon;
              const isSelected = selectedShifts.includes(shift.id);
              return (
                <button
                  key={shift.id}
                  onClick={() => toggleShift(shift.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
                    isSelected 
                      ? "bg-white border-gray-300 shadow-sm text-gray-800" 
                      : "bg-transparent border-transparent text-gray-500 hover:bg-white hover:border-gray-200"
                  )}
                >
                  <div className={cn(
                    "w-2 h-2 rounded-full transition-all",
                    isSelected ? shift.color : "bg-gray-300"
                  )} />
                  <span>{shift.label}</span>
                  <span className="text-[10px] text-gray-400">
                    {shift.start.slice(0, 2)}-{shift.end.slice(0, 2)}h
                  </span>
                </button>
              );
            })}
          </div>
          
          {selectedShifts.length === 0 && (
            <span className="text-xs text-gray-400 ml-2">(todos os horários)</span>
          )}
        </div>

        {/* Toggle de Visualização */}
        <div className="flex items-center bg-white rounded-lg border border-gray-200 p-0.5">
          <button
            onClick={() => onViewChange('day')}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
              viewMode === 'day' 
                ? "bg-[#009541] text-white shadow-sm" 
                : "text-gray-600 hover:bg-gray-50"
            )}
          >
            <Calendar className="h-3.5 w-3.5" />
            <span>Dia</span>
          </button>
          <button
            onClick={() => onViewChange('week')}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
              viewMode === 'week' 
                ? "bg-[#009541] text-white shadow-sm" 
                : "text-gray-600 hover:bg-gray-50"
            )}
          >
            <CalendarDays className="h-3.5 w-3.5" />
            <span>Semana</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export { SHIFTS };