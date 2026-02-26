import React from 'react';
import { cn } from "@/lib/utils";

const statusStyles = {
  confirmed: {
    border: 'border-l-4',
    opacity: ''
  },
  pending: {
    border: 'border-l-4 border-l-amber-500',
    opacity: 'opacity-90'
  },
  cancelled: {
    border: 'border-l-4 border-l-gray-400',
    opacity: 'opacity-50'
  }
};

export default function ReservationCard({ reservation, onClick, compact = false }) {
  const status = reservation.status || 'confirmed';
  const statusStyle = statusStyles[status] || statusStyles.confirmed;
  const bgColor = reservation.color || '#009541';
  
  // For confirmed, use the reservation color for border
  const borderColor = status === 'confirmed' ? bgColor : undefined;

  return (
    <div
      onClick={onClick}
      className={cn(
        "h-full rounded-lg cursor-pointer transition-all shadow-sm hover:shadow-lg overflow-hidden",
        statusStyle.border,
        statusStyle.opacity,
        "bg-white"
      )}
      style={{ 
        borderLeftColor: borderColor,
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}
    >
      <div 
        className={cn("h-full flex flex-col", compact ? "p-1" : "p-2")}
        style={{ backgroundColor: `${bgColor}15` }}
      >
        <p 
          className={cn(
            "font-semibold truncate",
            compact ? "text-[10px]" : "text-xs"
          )}
          style={{ color: bgColor }}
        >
          {reservation.title}
        </p>
        {!compact && (
          <p className="text-[10px] text-gray-600 truncate mt-0.5">
            {reservation.professor}
          </p>
        )}
        {!compact && (
          <p className="text-[10px] text-gray-500 mt-auto">
            {reservation.start_time} - {reservation.end_time}
          </p>
        )}
        {status === 'pending' && !compact && (
          <span className="text-[9px] text-amber-600 font-medium mt-1">● Pendente</span>
        )}
      </div>
    </div>
  );
}