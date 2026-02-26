import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format, parseISO, isPast, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { Calendar, Clock, MapPin, User, Trash2, Edit, Filter } from 'lucide-react';

import GovHeader from '@/components/layout/GovHeader';
import Sidebar from '@/components/layout/Sidebar';
import ReservationModal from '@/components/calendar/ReservationModal';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

const ROOMS = ['Todas', 'Lab 1', 'Lab 2', 'Lab 3', 'Sala 101', 'Sala 102', 'Sala 103', 'Auditório', 'Sala de Reuniões'];

export default function MyReservations() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filterRoom, setFilterRoom] = useState('Todas');
  const [filterStatus, setFilterStatus] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reservationToDelete, setReservationToDelete] = useState(null);

  const queryClient = useQueryClient();

  const { data: reservations = [], isLoading } = useQuery({
    queryKey: ['reservations'],
    queryFn: () => base44.entities.Reservation.list('-date'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Reservation.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      toast.success('Reserva atualizada!');
      setModalOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Reservation.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      toast.success('Reserva excluída!');
      setDeleteDialogOpen(false);
    },
  });

  const getReservationStatus = (reservation) => {
    const date = parseISO(reservation.date);
    if (isPast(date) && !isToday(date)) return 'past';
    if (isToday(date)) return 'today';
    return 'upcoming';
  };

  const filteredReservations = reservations.filter(r => {
    const roomMatch = filterRoom === 'Todas' || r.room === filterRoom;
    const status = getReservationStatus(r);
    const statusMatch = filterStatus === 'all' || 
      (filterStatus === 'upcoming' && (status === 'upcoming' || status === 'today')) ||
      (filterStatus === 'past' && status === 'past');
    return roomMatch && statusMatch;
  });

  const handleEdit = (reservation) => {
    setSelectedReservation(reservation);
    setModalOpen(true);
  };

  const handleDelete = (reservation) => {
    setReservationToDelete(reservation);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (reservationToDelete) {
      deleteMutation.mutate(reservationToDelete.id);
    }
  };

  const handleSave = (data) => {
    if (selectedReservation) {
      updateMutation.mutate({ id: selectedReservation.id, data });
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F4F4] flex flex-col">
      <GovHeader />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          currentPage="MyReservations" 
          isOpen={sidebarOpen} 
          onToggle={() => setSidebarOpen(!sidebarOpen)} 
        />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="bg-white border-b border-gray-200 px-4 lg:px-6 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Meus Agendamentos</h1>
                <p className="text-sm text-gray-500 mt-1">
                  {filteredReservations.length} reserva{filteredReservations.length !== 1 ? 's' : ''} encontrada{filteredReservations.length !== 1 ? 's' : ''}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <Select value={filterRoom} onValueChange={setFilterRoom}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROOMS.map((room) => (
                        <SelectItem key={room} value={room}>{room}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="upcoming">Próximos</SelectItem>
                    <SelectItem value="past">Passados</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 p-4 lg:p-6 overflow-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#009541]" />
              </div>
            ) : filteredReservations.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">Nenhuma reserva encontrada</h3>
                <p className="text-sm text-gray-500 mt-1">Tente ajustar os filtros ou crie uma nova reserva.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredReservations.map((reservation) => {
                  const status = getReservationStatus(reservation);
                  return (
                    <div
                      key={reservation.id}
                      className={cn(
                        "bg-white rounded-xl border shadow-sm overflow-hidden transition-all hover:shadow-md",
                        status === 'past' && "opacity-60"
                      )}
                    >
                      <div className="flex">
                        {/* Color Bar */}
                        <div 
                          className="w-2 flex-shrink-0"
                          style={{ backgroundColor: reservation.color || '#009541' }}
                        />
                        
                        <div className="flex-1 p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold text-gray-900">{reservation.title}</h3>
                                {status === 'today' && (
                                  <Badge className="bg-[#009541] text-white">Hoje</Badge>
                                )}
                                {status === 'past' && (
                                  <Badge variant="secondary">Passado</Badge>
                                )}
                              </div>
                              
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4 text-gray-400" />
                                  {reservation.room}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-gray-400" />
                                  {format(parseISO(reservation.date), "d 'de' MMMM, yyyy", { locale: ptBR })}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-gray-400" />
                                  {reservation.start_time} - {reservation.end_time}
                                </div>
                              </div>
                              
                              {reservation.professor && (
                                <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                                  <User className="h-4 w-4 text-gray-400" />
                                  {reservation.professor}
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(reservation)}
                                className="text-gray-500 hover:text-[#009541]"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(reservation)}
                                className="text-gray-500 hover:text-red-600"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Edit Modal */}
      <ReservationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        onDelete={() => {
          setModalOpen(false);
          handleDelete(selectedReservation);
        }}
        initialData={selectedReservation}
        isEditing={true}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Reserva</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta reserva? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}