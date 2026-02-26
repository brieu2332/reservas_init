import React, { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { X, Clock, MapPin, User, Users, BookOpen, Palette, AlertTriangle, Trash2, CalendarIcon } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { motion, AnimatePresence } from 'framer-motion';

const ROOMS = ['Lab 1', 'Lab 2', 'Lab 3', 'Sala 101', 'Sala 102', 'Sala 103', 'Auditório', 'Sala de Reuniões'];
const PROFESSORS = [
  'Prof. Carlos Silva',
  'Profa. Ana Costa',
  'Prof. Roberto Lima',
  'Prof. João Mendes',
  'Profa. Maria Santos',
  'Prof. Pedro Oliveira',
  'Prof. Lucas Ferreira',
  'Profa. Juliana Martins',
];

const COLORS = [
  { value: '#009541', label: 'Verde IFC' },
  { value: '#1976D2', label: 'Azul' },
  { value: '#7B1FA2', label: 'Roxo' },
  { value: '#E64A19', label: 'Laranja' },
  { value: '#00838F', label: 'Ciano' },
];

function timeToMinutes(time) {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function checkConflict(newReservation, existingReservations, excludeId = null) {
  const newStart = timeToMinutes(newReservation.start_time);
  const newEnd = timeToMinutes(newReservation.end_time);
  const newDate = typeof newReservation.date === 'string' 
    ? newReservation.date 
    : format(newReservation.date, 'yyyy-MM-dd');

  for (const res of existingReservations) {
    if (excludeId && res.id === excludeId) continue;
    if (res.room !== newReservation.room) continue;
    if (res.date !== newDate) continue;

    const existingStart = timeToMinutes(res.start_time);
    const existingEnd = timeToMinutes(res.end_time);

    if (newStart < existingEnd && newEnd > existingStart) {
      return res;
    }
  }
  return null;
}

export default function ReservationModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialData,
  isEditing = false,
  existingReservations = []
}) {
  const [formData, setFormData] = useState({
    title: '',
    room: '',
    professor: '',
    turma: '',
    date: new Date(),
    start_time: '08:00',
    end_time: '09:00',
    color: '#009541',
    status: 'confirmed'
  });

  const [conflict, setConflict] = useState(null);
  const [timeError, setTimeError] = useState('');
  const [professorSearch, setProfessorSearch] = useState('');
  const [showProfessorList, setShowProfessorList] = useState(false);
  const professorInputRef = useRef(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        turma: initialData.turma || '',
        date: initialData.date 
          ? (typeof initialData.date === 'string' ? new Date(initialData.date + 'T00:00:00') : initialData.date)
          : new Date(),
        status: initialData.status || 'confirmed'
      });
      setProfessorSearch(initialData.professor || '');
    }
  }, [initialData]);

  useEffect(() => {
    const startMins = timeToMinutes(formData.start_time);
    const endMins = timeToMinutes(formData.end_time);
    
    if (endMins <= startMins) {
      setTimeError('Horário de término deve ser após o início');
      setConflict(null);
      return;
    }
    setTimeError('');

    if (formData.room && formData.date) {
      const conflictRes = checkConflict(
        formData, 
        existingReservations, 
        isEditing ? initialData?.id : null
      );
      setConflict(conflictRes);
    } else {
      setConflict(null);
    }
  }, [formData.room, formData.date, formData.start_time, formData.end_time, existingReservations, isEditing, initialData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (conflict || timeError) return;
    
    onSave({
      ...formData,
      professor: professorSearch,
      date: format(formData.date, 'yyyy-MM-dd')
    });
  };

  const filteredProfessors = PROFESSORS.filter(p => 
    p.toLowerCase().includes(professorSearch.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div 
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gradient-to-r from-[#009541] to-[#00b050]">
                <h2 className="text-lg font-semibold text-white">
                  {isEditing ? 'Editar Reserva' : 'Nova Reserva'}
                </h2>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={onClose}
                  className="text-white/80 hover:text-white hover:bg-white/20 rounded-full"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto max-h-[calc(90vh-160px)]">
                {/* Alerts */}
                {conflict && (
                  <Alert variant="destructive" className="bg-red-50 border-red-200">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      <strong>Conflito detectado!</strong><br />
                      Esta sala já está ocupada por <strong>{conflict.professor}</strong> ({conflict.title}) 
                      das {conflict.start_time} às {conflict.end_time}.
                    </AlertDescription>
                  </Alert>
                )}

                {timeError && (
                  <Alert className="bg-amber-50 border-amber-200">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-sm text-amber-800">
                      {timeError}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Título */}
                <div className="space-y-1.5">
                  <Label htmlFor="title" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-[#009541]" />
                    Título da Atividade
                  </Label>
                  <Input
                    id="title"
                    placeholder="Ex: Aula de Programação Web"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="h-11 text-base"
                    required
                  />
                </div>

                {/* Professor com Autocomplete */}
                <div className="space-y-1.5 relative">
                  <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <User className="h-4 w-4 text-[#009541]" />
                    Professor / Responsável
                  </Label>
                  <div className="relative">
                    <Input
                      ref={professorInputRef}
                      placeholder="Digite para buscar..."
                      value={professorSearch}
                      onChange={(e) => {
                        setProfessorSearch(e.target.value);
                        setShowProfessorList(true);
                      }}
                      onFocus={() => setShowProfessorList(true)}
                      onBlur={() => setTimeout(() => setShowProfessorList(false), 200)}
                      className="h-11"
                      required
                    />
                    {showProfessorList && professorSearch && filteredProfessors.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-40 overflow-y-auto">
                        {filteredProfessors.map((prof) => (
                          <button
                            key={prof}
                            type="button"
                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
                            onClick={() => {
                              setProfessorSearch(prof);
                              setShowProfessorList(false);
                            }}
                          >
                            {prof}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Sala e Turma */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-[#009541]" />
                      Sala
                    </Label>
                    <Select
                      value={formData.room}
                      onValueChange={(value) => setFormData({ ...formData, room: value })}
                      required
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {ROOMS.map((room) => (
                          <SelectItem key={room} value={room}>{room}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="turma" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Users className="h-4 w-4 text-[#009541]" />
                      Turma
                    </Label>
                    <Input
                      id="turma"
                      placeholder="Ex: 3º Info"
                      value={formData.turma}
                      onChange={(e) => setFormData({ ...formData, turma: e.target.value })}
                      className="h-11"
                    />
                  </div>
                </div>

                {/* Data */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-[#009541]" />
                    Data
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full h-11 justify-start text-left font-normal",
                          !formData.date && "text-muted-foreground"
                        )}
                      >
                        {formData.date ? (
                          format(formData.date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })
                        ) : (
                          "Selecione a data"
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.date}
                        onSelect={(date) => date && setFormData({ ...formData, date })}
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Horários Precisos */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-[#009541]" />
                    Horário (flexível)
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-gray-500 mb-1 block">Início</Label>
                      <Input
                        type="time"
                        value={formData.start_time}
                        onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                        className="h-11 text-center font-mono"
                        min="07:00"
                        max="22:30"
                        required
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500 mb-1 block">Término</Label>
                      <Input
                        type="time"
                        value={formData.end_time}
                        onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                        className="h-11 text-center font-mono"
                        min="07:00"
                        max="22:30"
                        required
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">
                    Dica: Você pode definir horários precisos como 14:12 às 15:47
                  </p>
                </div>

                {/* Status e Cor */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-gray-700">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="confirmed">✓ Confirmado</SelectItem>
                        <SelectItem value="pending">● Pendente</SelectItem>
                        <SelectItem value="cancelled">✗ Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Palette className="h-4 w-4 text-[#009541]" />
                      Cor
                    </Label>
                    <div className="flex gap-1.5 h-11 items-center">
                      {COLORS.map((color) => (
                        <button
                          key={color.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, color: color.value })}
                          className={cn(
                            "w-8 h-8 rounded-full transition-all",
                            formData.color === color.value 
                              ? "ring-2 ring-offset-2 ring-gray-400 scale-110" 
                              : "hover:scale-105"
                          )}
                          style={{ backgroundColor: color.value }}
                          title={color.label}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </form>

              {/* Footer */}
              <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                {isEditing ? (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={onDelete}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </Button>
                ) : (
                  <div />
                )}
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={onClose}>
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleSubmit}
                    className="bg-[#009541] hover:bg-[#007a35] text-white px-6"
                    disabled={!!conflict || !!timeError}
                  >
                    {isEditing ? 'Salvar' : 'Criar Reserva'}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}