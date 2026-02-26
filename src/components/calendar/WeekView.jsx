import React from 'react';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ReservationCard from './ReservationCard';

const ROOMS = ['Lab 1', 'Lab 2', 'Lab 3', 'Sala 101', 'Sala 102', 'Sala 103', 'Auditório', 'Sala de Reuniões'];
const HOURS = [];
for (let h = 7; h <= 22; h++) {
  HOURS.push(`${h.toString().padStart(2, '0')}:00`);
  if (h < 22) HOURS.push(`${h.toString().padStart(2, '0')}:30`);
}

const SLOT_HEIGHT = 48;

function getReservationPosition(startTime, endTime) {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  const startMinutes = (startHour - 7) * 60 + startMin;
  const endMinutes = (endHour - 7) * 60 + endMin;
  
  const top = (startMinutes / 30) * SLOT_HEIGHT;
  const height = ((endMinutes - startMinutes) / 30) * SLOT_HEIGHT;
  
  return { top, height: Math.max(height, SLOT_HEIGHT) };
}

export default function WeekView({ 
  reservations, 
  selectedRoom,
  onRoomChange,
  onSlotClick, 
  onReservationClick,
  currentDate 
}) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 5 }, (_, i) => addDays(weekStart, i));
  const today = new Date();

  const [currentTimePosition, setCurrentTimePosition] = React.useState(null);
  const [currentDayIndex, setCurrentDayIndex] = React.useState(-1);

  React.useEffect(() => {
    const updateCurrentTime = () => {
      const now = new Date();
      const dayIndex = weekDays.findIndex(d => isSameDay(d, now));
      
      if (dayIndex === -1) {
        setCurrentTimePosition(null);
        setCurrentDayIndex(-1);
        return;
      }
      
      const hours = now.getHours();
      const minutes = now.getMinutes();
      
      if (hours >= 7 && hours < 23) {
        const totalMinutes = (hours - 7) * 60 + minutes;
        const position = (totalMinutes / 30) * SLOT_HEIGHT;
        setCurrentTimePosition(position);
        setCurrentDayIndex(dayIndex);
      } else {
        setCurrentTimePosition(null);
        setCurrentDayIndex(-1);
      }
    };

    updateCurrentTime();
    const interval = setInterval(updateCurrentTime, 60000);
    return () => clearInterval(interval);
  }, [currentDate]);

  const getReservationsForDay = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return reservations.filter(r => r.room === selectedRoom && r.date === dateStr);
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-white rounded-xl shadow-sm border border-gray-200">
      {/* Room Selector */}
      <div className="p-4 border-b border-gray-200 bg-gray-50/80">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-700">Visualizando:</span>
          <Select value={selectedRoom} onValueChange={onRoomChange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROOMS.map((room) => (
                <SelectItem key={room} value={room}>{room}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Coluna de Horários */}
        <div className="w-16 flex-shrink-0 border-r border-gray-200 bg-gray-50/80">
          <div className="h-14 border-b border-gray-200" />
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

        {/* Grid de Dias */}
        <div className="flex-1 overflow-x-auto">
          <div className="min-w-[500px]">
            {/* Header de Dias */}
            <div className="flex border-b border-gray-200 bg-gray-50/80 sticky top-0 z-10">
              {weekDays.map((day) => {
                const isToday = isSameDay(day, today);
                return (
                  <div 
                    key={day.toISOString()}
                    className="flex-1 min-w-[100px] h-14 flex flex-col items-center justify-center border-r border-gray-200 last:border-r-0"
                  >
                    <span className="text-xs text-gray-500 capitalize">
                      {format(day, 'EEE', { locale: ptBR })}
                    </span>
                    <span className={cn(
                      "text-lg font-semibold mt-0.5",
                      isToday 
                        ? "w-8 h-8 rounded-full bg-[#009541] text-white flex items-center justify-center" 
                        : "text-gray-700"
                    )}>
                      {format(day, 'd')}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Grid Body */}
            <div className="relative">
              {HOURS.map((time, index) => (
                <div key={time} className="flex">
                  {weekDays.map((day) => (
                    <div
                      key={`${time}-${day.toISOString()}`}
                      onClick={() => onSlotClick(selectedRoom, time, day)}
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
                  {weekDays.map((day, dayIndex) => (
                    <div key={day.toISOString()} className="flex-1 min-w-[100px] relative">
                      {getReservationsForDay(day).map((reservation) => {
                        const { top, height } = getReservationPosition(
                          reservation.start_time,
                          reservation.end_time
                        );
                        return (
                          <div
                            key={reservation.id}
                            className="absolute left-1 right-1 pointer-events-auto"
                            style={{ top: `${top}px`, height: `${height - 4}px` }}
                          >
                            <ReservationCard
                              reservation={reservation}
                              onClick={() => onReservationClick(reservation)}
                              compact={height < 60}
                            />
                          </div>
                        );
                      })}

                      {/* Current Time Line for this day */}
                      {currentTimePosition !== null && dayIndex === currentDayIndex && (
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
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}