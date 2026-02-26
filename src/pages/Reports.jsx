import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Calendar, TrendingUp, Clock, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';

import GovHeader from '@/components/layout/GovHeader';
import Sidebar from '@/components/layout/Sidebar';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const COLORS = ['#009541', '#1976D2', '#7B1FA2', '#E64A19', '#00838F', '#C2185B', '#FFA000', '#388E3C'];

export default function Reports() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const { data: reservations = [], isLoading } = useQuery({
    queryKey: ['reservations'],
    queryFn: () => base44.entities.Reservation.list(),
  });

  const { data: rooms = [] } = useQuery({
    queryKey: ['rooms'],
    queryFn: () => base44.entities.Room.list(),
  });

  // Stats
  const totalReservations = reservations.length;
  const totalHours = reservations.reduce((acc, r) => {
    const [startH, startM] = r.start_time.split(':').map(Number);
    const [endH, endM] = r.end_time.split(':').map(Number);
    return acc + (endH - startH) + (endM - startM) / 60;
  }, 0);

  // Reservas por sala
  const reservationsByRoom = reservations.reduce((acc, r) => {
    acc[r.room] = (acc[r.room] || 0) + 1;
    return acc;
  }, {});

  const roomChartData = Object.entries(reservationsByRoom)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // Reservas por dia da semana
  const reservationsByDay = reservations.reduce((acc, r) => {
    const day = format(parseISO(r.date), 'EEEE', { locale: ptBR });
    acc[day] = (acc[day] || 0) + 1;
    return acc;
  }, {});

  const dayOrder = ['segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira'];
  const dayChartData = dayOrder.map(day => ({
    name: day.charAt(0).toUpperCase() + day.slice(1, 3),
    reservas: reservationsByDay[day] || 0
  }));

  // Calendário de ocupação
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const reservationsByDate = reservations.reduce((acc, r) => {
    acc[r.date] = (acc[r.date] || 0) + 1;
    return acc;
  }, {});

  const getOccupancyColor = (count) => {
    if (count === 0) return 'bg-gray-100';
    if (count <= 2) return 'bg-green-200';
    if (count <= 5) return 'bg-green-400';
    if (count <= 8) return 'bg-green-600';
    return 'bg-green-800';
  };

  return (
    <div className="min-h-screen bg-[#F4F4F4] flex flex-col">
      <GovHeader />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          currentPage="Reports" 
          isOpen={sidebarOpen} 
          onToggle={() => setSidebarOpen(!sidebarOpen)} 
        />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="bg-white border-b border-gray-200 px-4 lg:px-6 py-4">
            <h1 className="text-xl font-semibold text-gray-900">Relatórios e Estatísticas</h1>
            <p className="text-sm text-gray-500 mt-1">Visão geral da utilização dos ambientes</p>
          </header>

          {/* Content */}
          <main className="flex-1 p-4 lg:p-6 overflow-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#009541]" />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-[#009541]/10">
                          <Calendar className="h-6 w-6 text-[#009541]" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Total de Reservas</p>
                          <p className="text-2xl font-bold text-gray-900">{totalReservations}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-blue-100">
                          <Clock className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Horas Reservadas</p>
                          <p className="text-2xl font-bold text-gray-900">{totalHours.toFixed(0)}h</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-purple-100">
                          <MapPin className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Salas Ativas</p>
                          <p className="text-2xl font-bold text-gray-900">{rooms.length}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-orange-100">
                          <TrendingUp className="h-6 w-6 text-orange-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Média por Dia</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {Object.keys(reservationsByDate).length > 0 
                              ? (totalReservations / Object.keys(reservationsByDate).length).toFixed(1)
                              : '0'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Charts */}
                <div className="grid gap-6 lg:grid-cols-2">
                  {/* Reservas por Sala */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Reservas por Sala</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {roomChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie
                              data={roomChartData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={100}
                              paddingAngle={2}
                              dataKey="value"
                              label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                            >
                              {roomChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-[300px] flex items-center justify-center text-gray-500">
                          Sem dados disponíveis
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Reservas por Dia da Semana */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Reservas por Dia da Semana</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={dayChartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="reservas" fill="#009541" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                {/* Heatmap Calendar */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Mapa de Ocupação</CardTitle>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1))}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm font-medium min-w-[120px] text-center capitalize">
                          {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1))}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-7 gap-2 mb-2">
                      {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                        <div key={day} className="text-xs text-gray-500 text-center font-medium">
                          {day}
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-2">
                      {/* Empty cells for days before month start */}
                      {Array.from({ length: monthStart.getDay() }).map((_, i) => (
                        <div key={`empty-${i}`} className="aspect-square" />
                      ))}
                      {monthDays.map(day => {
                        const dateStr = format(day, 'yyyy-MM-dd');
                        const count = reservationsByDate[dateStr] || 0;
                        return (
                          <div
                            key={dateStr}
                            className={cn(
                              "aspect-square rounded-md flex items-center justify-center text-xs font-medium transition-colors",
                              getOccupancyColor(count),
                              count > 5 && "text-white"
                            )}
                            title={`${format(day, 'd MMM', { locale: ptBR })}: ${count} reserva(s)`}
                          >
                            {format(day, 'd')}
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Legend */}
                    <div className="flex items-center justify-end gap-2 mt-4 text-xs text-gray-500">
                      <span>Menos</span>
                      <div className="flex gap-1">
                        <div className="w-4 h-4 rounded bg-gray-100" />
                        <div className="w-4 h-4 rounded bg-green-200" />
                        <div className="w-4 h-4 rounded bg-green-400" />
                        <div className="w-4 h-4 rounded bg-green-600" />
                        <div className="w-4 h-4 rounded bg-green-800" />
                      </div>
                      <span>Mais</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}