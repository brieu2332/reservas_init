import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  Calendar, 
  CalendarDays, 
  Settings, 
  FileBarChart, 
  DoorOpen,
  Menu,
  X
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const menuItems = [
  { icon: Calendar, label: 'Calendário', page: 'Calendar' },
  { icon: CalendarDays, label: 'Meus Agendamentos', page: 'MyReservations' },
  { icon: DoorOpen, label: 'Salas', page: 'Rooms' },
  { icon: FileBarChart, label: 'Relatórios', page: 'Reports' },
  { icon: Settings, label: 'Configurações', page: 'Settings' },
];

export default function Sidebar({ currentPage, isOpen, onToggle }) {
  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 h-full bg-white border-r border-gray-200 z-50 transition-all duration-300",
        "lg:relative lg:translate-x-0",
        isOpen ? "translate-x-0 w-64" : "-translate-x-full lg:translate-x-0 lg:w-16"
      )}>
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b">
          <span className="font-semibold text-[#009541]">Menu</span>
          <Button variant="ghost" size="icon" onClick={onToggle}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Menu Items */}
        <nav className="p-2 mt-16 lg:mt-4">
          {menuItems.map((item) => {
            const isActive = currentPage === item.page;
            return (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                onClick={() => window.innerWidth < 1024 && onToggle()}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-all group",
                  isActive 
                    ? "bg-[#009541]/10 text-[#009541]" 
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <item.icon className={cn(
                  "h-5 w-5 flex-shrink-0",
                  isActive ? "text-[#009541]" : "text-gray-500 group-hover:text-gray-700"
                )} />
                <span className={cn(
                  "text-sm font-medium whitespace-nowrap",
                  !isOpen && "lg:hidden"
                )}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className={cn(
          "absolute bottom-4 left-0 right-0 px-4",
          !isOpen && "lg:px-2"
        )}>
          <div className={cn(
            "p-3 bg-[#009541]/5 rounded-lg",
            !isOpen && "lg:hidden"
          )}>
            <p className="text-xs text-gray-600">
              Sistema de Reservas
            </p>
            <p className="text-xs text-[#009541] font-medium">
              IFC Campus Blumenau
            </p>
          </div>
        </div>
      </aside>

      {/* Mobile Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggle}
        className="fixed bottom-4 left-4 z-30 lg:hidden bg-[#009541] text-white hover:bg-[#007a35] shadow-lg rounded-full h-12 w-12"
      >
        <Menu className="h-5 w-5" />
      </Button>
    </>
  );
}