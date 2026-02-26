import React from 'react';
import { cn } from "@/lib/utils";
import ReservationCard from './ReservationCard';
import { SHIFTS } from './FilterBar';

const ROOMS = ['Lab 1', 'Lab 2', 'Lab 3', 'Sala 101', 'Sala 102', 'Sala 103', 'Auditório', 'Sala de Reuniões'];

function generateHours(selectedShifts) {
  // Se nenhum turno selecionado, mostra todos os horários
  if (!selectedShifts || selectedShifts.length === 0) {
    const hours = [];
    for (let h = 7; h <= 22; h++) {
      hours.push(`${h.toString().padStart(2, '0')}:00`);
      if (h < 22) hours.push(`${h.toString().padStart(2, '0')}:30`);
    }
    return hours;
  }
  
  // Combina os turnos selecionados
  let minStart = 24;
  let maxEnd = 0;
  
  selectedShifts.forEach(shiftId => {
    const shift = SHIFTS.find(s => s.id === shiftId);
    if (shift) {
      const [startH] = shift.start.split(':').map(Number);
      const [endH, endM] = shift.end.split(':').map(Number);
      minStart = Math.min(minStart, startH);
      maxEnd = Math.max(maxEnd, endH + (endM > 0 ? 1 : 0));
    }
  });
  
  const hours = [];
  for (let h = minStart; h <= maxEnd - 1; h++) {
    hours.push(`${h.toString().padStart(2, '0')}:00`);
    hours.push(`${h.toString().padStart(2, '0')}:30`);
  }
  return hours;
}

const SLOT_HEIGHT = 48;

function getReservationPosition(startTime, endTime, selectedShifts) {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  let baseHour = 7;
  if (selectedShifts && selectedShifts.length > 0) {
    let minStart = 24;
    selectedShifts.forEach(shiftId => {
      const shift = SHIFTS.find(s => s.id === shiftId);
      if (shift) {
        const [startH] = shift.start.split(':').map(Number);
        minStart = Math.min(minStart, startH);
      }
    });
    baseHour = minStart;
  }
  
  const startMinutes = (startHour - baseHour) * 60 + startMin;
  const endMinutes = (endHour - baseHour) * 60 + endMin;
  
  const top = (startMinutes / 30) * SLOT_HEIGHT;
  const height = ((endMinutes - startMinutes) / 30) * SLOT_HEIGHT;
  
  return { top, height: Math.max(height, SLOT_HEIGHT / 2) };
}

function isInShifts(reservation, selectedShifts) {
  if (!selectedShifts || selectedShifts.length === 0) return true;
  
  const [resStartH, resStartM] = reservation.start_time.split(':').map(Number);
  const [resEndH, resEndM] = reservation.end_time.split(':').map(Number);
  const resStart = resStartH * 60 + resStartM;
  const resEnd = resEndH * 60 + resEndM;
  
  // Verifica se a reserva está em algum dos turnos selecionados
  return selectedShifts.some(shiftId => {
    const shift = SHIFTS.find(s => s.id === shiftId);
    if (!shift) return false;
    
    const [shiftStartH, shiftStartM] = shift.start.split(':').map(Number);
    const [shiftEndH, shiftEndM] = shift.end.split(':').map(Number);
    const shiftStart = shiftStartH * 60 + shiftStartM;
    const shiftEnd = shiftEndH * 60 + shiftEndM;
    
    return resStart < shiftEnd && resEnd > shiftStart;
  });
}

export default function DayView({ 
  reservations, 
  onSlotClick, 
  onReservationClick,
  currentDate,
  selectedShifts = []
}) {
  const [currentTimePosition, setCurrentTimePosition] = React.useState(null);
  const HOURS = generateHours(selectedShifts);

  React.useEffect(() => {
    const updateCurrentTime = () => {
      const now = new Date();
      const isToday = now.toDateString() === currentDate.toDateString();
      
      if (!isToday) {
        setCurrentTimePosition(null);
        return;
      }
      
      const hours = now.getHours();
      const minutes = now.getMinutes();
      
      let baseHour = 7;
      let maxHour = 23;
      if (selectedShifts && selectedShifts.length > 0) {
        let minStart = 24;
        let maxEnd = 0;
        selectedShifts.forEach(shiftId => {
          const shift = SHIFTS.find(s => s.id === shiftId);
          if (shift) {
            const [startH] = shift.start.split(':').map(Number);
            const [endH, endM] = shift.end.split(':').map(Number);
            minStart = Math.min(minStart, startH);
            maxEnd = Math.max(maxEnd, endH + (endM > 0 ? 1 : 0));
          }
        });
        baseHour = minStart;
        maxHour = maxEnd;
      }
      
      if (hours >= baseHour && hours < maxHour) {
        const totalMinutes = (hours - baseHour) * 60 + minutes;
        const position = (totalMinutes / 30) * SLOT_HEIGHT;
        setCurrentTimePosition(position);
      } else {
        setCurrentTimePosition(null);
      }
    };

    updateCurrentTime();
    const interval = setInterval(updateCurrentTime, 60000);
    return () => clearInterval(interval);
  }, [currentDate, selectedShifts]);

  const getReservationsForRoom = (room) => {
    return reservations.filter(r => r.room === room && isInShifts(r, selectedShifts));
  };

  return (
    <div className="flex flex-1 overflow-hidden bg-white rounded-xl shadow-sm border border-gray-200">
      {/* Coluna de Horários */}
      <div className="w-16 flex-shrink-0 border-r border-gray-200 bg-gray-50/80">
        <div className="h-12 border-b border-gray-200" /> {/* Header spacer */}
        {HOURS.map((time, index) => (
          <div 
            key={time} 
            className={cn(
              "h-12 flex items-start justify-end pr-2 -mt-2",
              index % 2 === 0 ? "text-xs text-gray-500 font-medium" : "text-[10px] text-gray-400"
            )}
          >
            {index % 2 === 0 ? time : ''}
          </div>
        ))}
      </div>

      {/* Grid de Salas */}
      <div className="flex-1 overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Header de Salas */}
          <div className="flex border-b border-gray-200 bg-gray-50/80 sticky top-0 z-10">
            {ROOMS.map((room) => (
              <div 
                key={room}
                className="flex-1 min-w-[100px] h-12 flex items-center justify-center text-xs font-semibold text-gray-700 border-r border-gray-200 last:border-r-0"
              >
                {room}
              </div>
            ))}
          </div>

          {/* Grid Body */}
          <div className="relative">
            {/* Background Grid */}
            {HOURS.map((time, index) => (
              <div key={time} className="flex">
                {ROOMS.map((room) => (
                  <div
                    key={`${time}-${room}`}
                    onClick={() => onSlotClick(room, time)}
                    className={cn(
                      "flex-1 min-w-[100px] h-12 border-r border-gray-200 last:border-r-0 cursor-pointer transition-colors",
                      index % 2 === 0 ? "border-b border-gray-200" : "border-b border-gray-100",
                      "hover:bg-[#009541]/5"
                    )}
                  />
                ))}
              </div>
            ))}

            {/* Reservations Layer */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="flex h-full">
                {ROOMS.map((room, roomIndex) => (
                  <div key={room} className="flex-1 min-w-[100px] relative">
                    {getReservationsForRoom(room).map((reservation) => {
                        const { top, height } = getReservationPosition(
                          reservation.start_time,
                          reservation.end_time,
                          selectedShifts
                        );
                        return (
                          <div
                            key={reservation.id}
                            className="absolute left-1 right-1 pointer-events-auto"
                            style={{ top: `${top}px`, height: `${Math.max(height - 4, 20)}px` }}
                          >
                            <ReservationCard
                              reservation={reservation}
                              onClick={() => onReservationClick(reservation)}
                              compact={height < 60}
                            />
                          </div>
                        );
                      })}
                  </div>
                ))}
              </div>
            </div>

            {/* Current Time Line */}
            {currentTimePosition !== null && (
              <div 
                className="absolute left-0 right-0 z-20 pointer-events-none"
                style={{ top: `${currentTimePosition}px` }}
              >
                <div className="flex items-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500 -ml-1" />
                  <div className="flex-1 h-[2px] bg-red-500 shadow-sm" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}