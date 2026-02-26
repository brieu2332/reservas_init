import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format, addDays, subDays, addWeeks, subWeeks } from 'date-fns';
import { toast } from 'sonner';

import GovHeader from '@/components/layout/GovHeader';
import AppHeader from '@/components/layout/AppHeader';
import Sidebar from '@/components/layout/Sidebar';
import FilterBar from '@/components/calendar/FilterBar';
import DayView from '@/components/calendar/DayView';
import WeeklyHeatmap from '@/components/calendar/WeeklyHeatmap';
import ReservationModal from '@/components/calendar/ReservationModal';

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('day');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedShifts, setSelectedShifts] = useState([]);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [initialSlotData, setInitialSlotData] = useState(null);

  const queryClient = useQueryClient();

  const { data: reservations = [], isLoading } = useQuery({
    queryKey: ['reservations'],
    queryFn: () => base44.entities.Reservation.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Reservation.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      toast.success('Reserva criada com sucesso!');
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Reservation.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      toast.success('Reserva atualizada!');
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Reservation.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      toast.success('Reserva excluída!');
      closeModal();
    },
  });

  const handlePrevious = () => {
    if (viewMode === 'day') {
      setCurrentDate(subDays(currentDate, 1));
    } else {
      setCurrentDate(subWeeks(currentDate, 1));
    }
  };

  const handleNext = () => {
    if (viewMode === 'day') {
      setCurrentDate(addDays(currentDate, 1));
    } else {
      setCurrentDate(addWeeks(currentDate, 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleSlotClick = (room, time, date = currentDate) => {
    const [hour, min] = time.split(':').map(Number);
    const endHour = hour + 1;
    const endTime = `${endHour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
    
    setInitialSlotData({
      room,
      date: date,
      start_time: time,
      end_time: endTime,
      title: '',
      professor: '',
      turma: '',
      color: '#009541',
      status: 'confirmed'
    });
    setSelectedReservation(null);
    setModalOpen(true);
  };

  const handleReservationClick = (reservation) => {
    setSelectedReservation(reservation);
    setInitialSlotData(reservation);
    setModalOpen(true);
  };

  const handleNewReservation = () => {
    setInitialSlotData({
      room: 'Lab 1',
      date: currentDate,
      start_time: '08:00',
      end_time: '09:00',
      title: '',
      professor: '',
      turma: '',
      color: '#009541',
      status: 'confirmed'
    });
    setSelectedReservation(null);
    setModalOpen(true);
  };

  const handleHeatmapCellClick = (room, date) => {
    setCurrentDate(date);
    setViewMode('day');
  };

  const handleSave = (data) => {
    if (selectedReservation) {
      updateMutation.mutate({ id: selectedReservation.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = () => {
    if (selectedReservation) {
      deleteMutation.mutate(selectedReservation.id);
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedReservation(null);
    setInitialSlotData(null);
  };

  // Filtrar reservas por data
  const filteredReservations = reservations.filter(r => {
    if (viewMode === 'day') {
      return r.date === format(currentDate, 'yyyy-MM-dd');
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#F4F4F4] flex flex-col">
      <GovHeader />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          currentPage="Calendar" 
          isOpen={sidebarOpen} 
          onToggle={() => setSidebarOpen(!sidebarOpen)} 
        />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Barra Superior */}
          <AppHeader
            currentDate={currentDate}
            onPrevious={handlePrevious}
            onNext={handleNext}
            onToday={handleToday}
            onNewReservation={handleNewReservation}
          />

          {/* Barra Secundária - Filtros */}
          <FilterBar
            selectedShifts={selectedShifts}
            onShiftsChange={setSelectedShifts}
            viewMode={viewMode}
            onViewChange={setViewMode}
          />

          <main className="flex-1 p-4 lg:p-6 overflow-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#009541]" />
              </div>
            ) : viewMode === 'day' ? (
              <DayView
                reservations={filteredReservations}
                onSlotClick={handleSlotClick}
                onReservationClick={handleReservationClick}
                currentDate={currentDate}
                selectedShifts={selectedShifts}
              />
            ) : (
              <WeeklyHeatmap
                reservations={reservations}
                currentDate={currentDate}
                selectedShifts={selectedShifts}
                onCellClick={handleHeatmapCellClick}
              />
            )}
          </main>
        </div>
      </div>

      {/* Modal Flutuante Centralizado */}
      <ReservationModal
        isOpen={modalOpen}
        onClose={closeModal}
        onSave={handleSave}
        onDelete={handleDelete}
        initialData={initialSlotData}
        isEditing={!!selectedReservation}
        existingReservations={reservations}
      />
    </div>
  );
}