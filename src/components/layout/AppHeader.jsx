import React from 'react';
import { Button } from "@/components/ui/button";
import { Plus, Bell, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function AppHeader({ 
  currentDate, 
  onPrevious, 
  onNext, 
  onToday, 
  onNewReservation 
}) {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="px-4 lg:px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Logo IFC */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-[#009541] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">IFC</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-sm font-semibold text-gray-900">Instituto Federal Catarinense</h1>
                <p className="text-xs text-gray-500">Campus Blumenau - Reserva de Ambientes</p>
              </div>
            </div>
          </div>

          {/* Navegação de Data */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onToday}
              className="text-[#009541] border-[#009541] hover:bg-[#009541]/10"
            >
              Hoje
            </Button>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={onPrevious} className="h-8 w-8">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={onNext} className="h-8 w-8">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <span className="text-sm font-semibold text-gray-800 min-w-[200px] text-center capitalize">
              {format(currentDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </span>
          </div>

          {/* Ações */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Bell className="h-4 w-4 text-gray-600" />
            </Button>

            <Button
              onClick={onNewReservation}
              className="bg-[#009541] hover:bg-[#007a35] text-white gap-2 shadow-md"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Nova Reserva</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}