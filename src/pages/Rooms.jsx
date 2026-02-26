import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { 
  DoorOpen, 
  Users, 
  Monitor, 
  Plus, 
  Edit, 
  Trash2,
  Projector,
  Wifi,
  Volume2,
  PenTool
} from 'lucide-react';

import GovHeader from '@/components/layout/GovHeader';
import Sidebar from '@/components/layout/Sidebar';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

const ROOM_TYPES = {
  laboratory: { label: 'Laboratório', icon: Monitor, color: 'bg-blue-100 text-blue-700' },
  classroom: { label: 'Sala de Aula', icon: PenTool, color: 'bg-green-100 text-green-700' },
  auditorium: { label: 'Auditório', icon: Volume2, color: 'bg-purple-100 text-purple-700' },
  meeting_room: { label: 'Sala de Reuniões', icon: Users, color: 'bg-orange-100 text-orange-700' },
};

const RESOURCES = [
  { id: 'projector', label: 'Projetor', icon: Projector },
  { id: 'computers', label: 'Computadores', icon: Monitor },
  { id: 'wifi', label: 'Wi-Fi', icon: Wifi },
  { id: 'audio', label: 'Sistema de Áudio', icon: Volume2 },
  { id: 'whiteboard', label: 'Quadro Branco', icon: PenTool },
];

export default function Rooms() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    capacity: '',
    type: 'classroom',
    floor: '',
    resources: [],
    is_active: true
  });

  const queryClient = useQueryClient();

  const { data: rooms = [], isLoading } = useQuery({
    queryKey: ['rooms'],
    queryFn: () => base44.entities.Room.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Room.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast.success('Sala criada com sucesso!');
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Room.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast.success('Sala atualizada!');
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Room.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast.success('Sala excluída!');
    },
  });

  const openModal = (room = null) => {
    if (room) {
      setEditingRoom(room);
      setFormData({
        name: room.name,
        capacity: room.capacity,
        type: room.type,
        floor: room.floor || '',
        resources: room.resources || [],
        is_active: room.is_active !== false
      });
    } else {
      setEditingRoom(null);
      setFormData({
        name: '',
        capacity: '',
        type: 'classroom',
        floor: '',
        resources: [],
        is_active: true
      });
    }
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingRoom(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      capacity: parseInt(formData.capacity)
    };
    
    if (editingRoom) {
      updateMutation.mutate({ id: editingRoom.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const toggleResource = (resourceId) => {
    setFormData(prev => ({
      ...prev,
      resources: prev.resources.includes(resourceId)
        ? prev.resources.filter(r => r !== resourceId)
        : [...prev.resources, resourceId]
    }));
  };

  return (
    <div className="min-h-screen bg-[#F4F4F4] flex flex-col">
      <GovHeader />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          currentPage="Rooms" 
          isOpen={sidebarOpen} 
          onToggle={() => setSidebarOpen(!sidebarOpen)} 
        />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="bg-white border-b border-gray-200 px-4 lg:px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Gestão de Salas</h1>
                <p className="text-sm text-gray-500 mt-1">
                  {rooms.length} ambiente{rooms.length !== 1 ? 's' : ''} cadastrado{rooms.length !== 1 ? 's' : ''}
                </p>
              </div>
              <Button 
                onClick={() => openModal()}
                className="bg-[#009541] hover:bg-[#007a35] gap-2"
              >
                <Plus className="h-4 w-4" />
                Nova Sala
              </Button>
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 p-4 lg:p-6 overflow-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#009541]" />
              </div>
            ) : rooms.length === 0 ? (
              <div className="text-center py-12">
                <DoorOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">Nenhuma sala cadastrada</h3>
                <p className="text-sm text-gray-500 mt-1">Comece adicionando uma nova sala.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {rooms.map((room) => {
                  const typeConfig = ROOM_TYPES[room.type] || ROOM_TYPES.classroom;
                  const TypeIcon = typeConfig.icon;
                  
                  return (
                    <div
                      key={room.id}
                      className={cn(
                        "bg-white rounded-xl border shadow-sm overflow-hidden transition-all hover:shadow-md",
                        !room.is_active && "opacity-60"
                      )}
                    >
                      <div className="p-5">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className={cn("p-2 rounded-lg", typeConfig.color)}>
                              <TypeIcon className="h-5 w-5" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">{room.name}</h3>
                              <Badge variant="secondary" className={typeConfig.color}>
                                {typeConfig.label}
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openModal(room)}
                              className="h-8 w-8"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteMutation.mutate(room.id)}
                              className="h-8 w-8 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-gray-400" />
                            Capacidade: {room.capacity} pessoas
                          </div>
                          {room.floor && (
                            <div className="flex items-center gap-2">
                              <DoorOpen className="h-4 w-4 text-gray-400" />
                              {room.floor}
                            </div>
                          )}
                        </div>

                        {room.resources?.length > 0 && (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {room.resources.map(resourceId => {
                              const resource = RESOURCES.find(r => r.id === resourceId);
                              if (!resource) return null;
                              const ResourceIcon = resource.icon;
                              return (
                                <Badge key={resourceId} variant="outline" className="gap-1">
                                  <ResourceIcon className="h-3 w-3" />
                                  {resource.label}
                                </Badge>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Modal */}
      <Dialog open={modalOpen} onOpenChange={closeModal}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>
              {editingRoom ? 'Editar Sala' : 'Nova Sala'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5 mt-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Sala</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Lab 1"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacidade</Label>
                <Input
                  id="capacity"
                  type="number"
                  min="1"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  placeholder="30"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ROOM_TYPES).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="floor">Andar / Bloco</Label>
              <Input
                id="floor"
                value={formData.floor}
                onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                placeholder="Ex: Bloco A - 2º Andar"
              />
            </div>

            <div className="space-y-2">
              <Label>Recursos Disponíveis</Label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {RESOURCES.map(resource => (
                  <label
                    key={resource.id}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Checkbox
                      checked={formData.resources.includes(resource.id)}
                      onCheckedChange={() => toggleResource(resource.id)}
                    />
                    <span className="text-sm">{resource.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={closeModal}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-[#009541] hover:bg-[#007a35]">
                {editingRoom ? 'Salvar' : 'Criar Sala'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}