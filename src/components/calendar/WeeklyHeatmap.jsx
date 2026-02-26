import React from 'react';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from "@/lib/utils";
import { SHIFTS } from './FilterBar';

const ROOMS = ['Lab 1', 'Lab 2', 'Lab 3', 'Sala 101', 'Sala 102', 'Sala 103', 'Auditório', 'Sala de Reuniões'];

function getShiftHours(selectedShifts) {
  if (!selectedShifts || selectedShifts.length === 0) return { start: 7, end: 22.5 };
  
  let minStart = 24;
  let maxEnd = 0;
  
  selectedShifts.forEach(shiftId => {
    const shift = SHIFTS.find(s => s.id === shiftId);
    if (shift) {
      const [startH, startM] = shift.start.split(':').map(Number);
      const [endH, endM] = shift.end.split(':').map(Number);
      minStart = Math.min(minStart, startH + startM/60);
      maxEnd = Math.max(maxEnd, endH + endM/60);
    }
  });
  
  return { start: minStart, end: maxEnd };
}

function timeToDecimal(time) {
  const [h, m] = time.split(':').map(Number);
  return h + m/60;
}

function isInShifts(reservation, selectedShifts) {
  if (!selectedShifts || selectedShifts.length === 0) return true;
  
  const resStart = timeToDecimal(reservation.start_time);
  const resEnd = timeToDecimal(reservation.end_time);
  
  return selectedShifts.some(shiftId => {
    const shift = SHIFTS.find(s => s.id === shiftId);
    if (!shift) return false;
    
    const [startH, startM] = shift.start.split(':').map(Number);
    const [endH, endM] = shift.end.split(':').map(Number);
    const start = startH + startM/60;
    const end = endH + endM/60;
    
    return resStart < end && resEnd > start;
  });
}

function OccupationBar({ reservations, selectedShifts }) {
  const { start: shiftStart, end: shiftEnd } = getShiftHours(selectedShifts);
  
  const filteredRes = reservations.filter(r => isInShifts(r, selectedShifts));
  
  return (
    <div className="h-6 bg-gray-100 rounded-md relative overflow-hidden flex">
      {filteredRes.map((res, idx) => {
        const resStart = Math.max(timeToDecimal(res.start_time), shiftStart);
        const resEnd = Math.min(timeToDecimal(res.end_time), shiftEnd);
        
        const leftPercent = ((resStart - shiftStart) / (shiftEnd - shiftStart)) * 100;
        const widthPercent = ((resEnd - resStart) / (shiftEnd - shiftStart)) * 100;
        
        return (
          <div
            key={res.id || idx}
            className="absolute h-full rounded-sm"
            style={{
              left: `${leftPercent}%`,
              width: `${Math.max(widthPercent, 2)}%`,
              backgroundColor: res.color || '#009541',
              opacity: 0.85
            }}
            title={`${res.title} (${res.start_time}-${res.end_time})`}
          />
        );
      })}
      {filteredRes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-[10px] text-gray-400">
          Livre
        </div>
      )}
    </div>
  );
}

function OccupationSummary({ reservations, selectedShifts }) {
  const { start: shiftStart, end: shiftEnd } = getShiftHours(selectedShifts);
  const totalMinutes = (shiftEnd - shiftStart) * 60;
  
  const filteredRes = reservations.filter(r => isInShifts(r, selectedShifts));
  
  let occupiedMinutes = 0;
  filteredRes.forEach(res => {
    const resStart = Math.max(timeToDecimal(res.start_time), shiftStart);
    const resEnd = Math.min(timeToDecimal(res.end_time), shiftEnd);
    occupiedMinutes += (resEnd - resStart) * 60;
  });
  
  const occupationPercent = Math.round((occupiedMinutes / totalMinutes) * 100);
  
  return (
    <div className="text-[10px] text-gray-500 mt-1 text-center">
      {filteredRes.length > 0 ? `${occupationPercent}% ocupado` : ''}
    </div>
  );
}

export default function WeeklyHeatmap({ 
  reservations, 
  currentDate, 
  selectedShifts = [],
  onCellClick 
}) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 5 }, (_, i) => addDays(weekStart, i));
  const today = new Date();

  const getReservationsForRoomAndDay = (room, date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return reservations.filter(r => r.room === room && r.date === dateStr);
  };

  const getRoomOccupationLevel = (room) => {
    let totalFreeSlots = 0;
    weekDays.forEach(day => {
      const dayReservations = getReservationsForRoomAndDay(room, day);
      const filtered = dayReservations.filter(r => isInShifts(r, selectedShifts));
      if (filtered.length === 0) totalFreeSlots++;
    });
    return totalFreeSlots;
  };

  const sortedRooms = [...ROOMS].sort((a, b) => getRoomOccupationLevel(b) - getRoomOccupationLevel(a));

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50/80 border-b border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-700">Visão Geral da Semana - Ocupação por Sala</h3>
        <p className="text-xs text-gray-500 mt-1">
          Salas ordenadas por disponibilidade {selectedShifts.length > 0 ? `(${selectedShifts.length} turno${selectedShifts.length > 1 ? 's' : ''} selecionado${selectedShifts.length > 1 ? 's' : ''})` : '(todos os turnos)'}
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left text-xs font-semibold text-gray-600 p-3 w-36 bg-gray-50/50">
                Ambiente
              </th>
              {weekDays.map((day) => {
                const isToday = isSameDay(day, today);
                return (
                  <th 
                    key={day.toISOString()} 
                    className={cn(
                      "text-center text-xs font-semibold p-3",
                      isToday ? "bg-[#009541]/5 text-[#009541]" : "text-gray-600"
                    )}
                  >
                    <div className="capitalize">{format(day, 'EEE', { locale: ptBR })}</div>
                    <div className={cn(
                      "mt-1 text-sm",
                      isToday && "w-7 h-7 rounded-full bg-[#009541] text-white flex items-center justify-center mx-auto"
                    )}>
                      {format(day, 'd')}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {sortedRooms.map((room, idx) => {
              const freeSlots = getRoomOccupationLevel(room);
              return (
                <tr 
                  key={room} 
                  className={cn(
                    "border-b border-gray-100 hover:bg-gray-50/50 transition-colors",
                    idx === 0 && freeSlots > 0 && "bg-green-50/30"
                  )}
                >
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">{room}</span>
                      {freeSlots >= 4 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">
                          + disponível
                        </span>
                      )}
                    </div>
                  </td>
                  {weekDays.map((day) => {
                    const dayReservations = getReservationsForRoomAndDay(room, day);
                    const isToday = isSameDay(day, today);
                    return (
                      <td 
                        key={day.toISOString()} 
                        className={cn(
                          "p-2 cursor-pointer hover:bg-gray-50 transition-colors",
                          isToday && "bg-[#009541]/5"
                        )}
                        onClick={() => onCellClick(room, day)}
                      >
                        <OccupationBar 
                          reservations={dayReservations} 
                          selectedShifts={selectedShifts} 
                        />
                        <OccupationSummary 
                          reservations={dayReservations} 
                          selectedShifts={selectedShifts} 
                        />
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="p-3 bg-gray-50/50 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-3 rounded bg-gray-100" />
            <span>Livre</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-3 rounded bg-[#009541]/80" />
            <span>Ocupado</span>
          </div>
        </div>
        <span>Clique em uma célula para ver detalhes do dia</span>
      </div>
    </div>
  );
}