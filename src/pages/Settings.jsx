import React, { useState } from 'react';
import { Settings as SettingsIcon, Bell, Clock, Palette, Shield } from 'lucide-react';

import GovHeader from '@/components/layout/GovHeader';
import Sidebar from '@/components/layout/Sidebar';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from 'sonner';

export default function Settings() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settings, setSettings] = useState({
    emailNotifications: true,
    reminderTime: '30',
    defaultView: 'day',
    autoConfirm: false,
    maxDuration: '4',
    advanceBooking: '30'
  });

  const handleSave = () => {
    toast.success('Configurações salvas com sucesso!');
  };

  return (
    <div className="min-h-screen bg-[#F4F4F4] flex flex-col">
      <GovHeader />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          currentPage="Settings" 
          isOpen={sidebarOpen} 
          onToggle={() => setSidebarOpen(!sidebarOpen)} 
        />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="bg-white border-b border-gray-200 px-4 lg:px-6 py-4">
            <h1 className="text-xl font-semibold text-gray-900">Configurações</h1>
            <p className="text-sm text-gray-500 mt-1">Personalize o sistema de reservas</p>
          </header>

          {/* Content */}
          <main className="flex-1 p-4 lg:p-6 overflow-auto">
            <div className="max-w-3xl mx-auto space-y-6">
              {/* Notificações */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100">
                      <Bell className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Notificações</CardTitle>
                      <CardDescription>Configure como deseja ser notificado</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="emailNotif">Notificações por e-mail</Label>
                      <p className="text-sm text-gray-500">Receber lembretes de reservas por e-mail</p>
                    </div>
                    <Switch
                      id="emailNotif"
                      checked={settings.emailNotifications}
                      onCheckedChange={(checked) => setSettings({ ...settings, emailNotifications: checked })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Lembrete antes da reserva</Label>
                    <Select
                      value={settings.reminderTime}
                      onValueChange={(value) => setSettings({ ...settings, reminderTime: value })}
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 minutos</SelectItem>
                        <SelectItem value="30">30 minutos</SelectItem>
                        <SelectItem value="60">1 hora</SelectItem>
                        <SelectItem value="120">2 horas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Visualização */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-100">
                      <Palette className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Preferências de Visualização</CardTitle>
                      <CardDescription>Personalize a aparência do calendário</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Visualização padrão</Label>
                    <Select
                      value={settings.defaultView}
                      onValueChange={(value) => setSettings({ ...settings, defaultView: value })}
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="day">Diária</SelectItem>
                        <SelectItem value="week">Semanal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Regras de Reserva */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-100">
                      <Clock className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Regras de Reserva</CardTitle>
                      <CardDescription>Defina limites e políticas de agendamento</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Duração máxima (horas)</Label>
                    <Input
                      type="number"
                      min="1"
                      max="12"
                      value={settings.maxDuration}
                      onChange={(e) => setSettings({ ...settings, maxDuration: e.target.value })}
                      className="w-[200px]"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Antecedência máxima para reservas (dias)</Label>
                    <Input
                      type="number"
                      min="1"
                      max="365"
                      value={settings.advanceBooking}
                      onChange={(e) => setSettings({ ...settings, advanceBooking: e.target.value })}
                      className="w-[200px]"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Administração */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-orange-100">
                      <Shield className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Administração</CardTitle>
                      <CardDescription>Configurações administrativas</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="autoConfirm">Confirmação automática</Label>
                      <p className="text-sm text-gray-500">Aprovar reservas automaticamente</p>
                    </div>
                    <Switch
                      id="autoConfirm"
                      checked={settings.autoConfirm}
                      onCheckedChange={(checked) => setSettings({ ...settings, autoConfirm: checked })}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Save Button */}
              <div className="flex justify-end">
                <Button 
                  onClick={handleSave}
                  className="bg-[#009541] hover:bg-[#007a35]"
                >
                  Salvar Configurações
                </Button>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}