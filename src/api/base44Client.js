// src/api/base44Client.js

// Função para simular o tempo de resposta de um servidor real (300ms)
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Funções para ler e guardar no LocalStorage do navegador
const getStorage = (key) => JSON.parse(localStorage.getItem(key) || '[]');
const setStorage = (key, data) => localStorage.setItem(key, JSON.stringify(data));

// Criador de "banco de dados falso" para cada entidade
const createMockEntity = (entityName) => ({
  list: async () => {
    await delay(300);
    return getStorage(entityName);
  },
  create: async (data) => {
    await delay(300);
    const items = getStorage(entityName);
    const newItem = { id: Date.now().toString(), ...data }; // Gera um ID único
    items.push(newItem);
    setStorage(entityName, items);
    return newItem;
  },
  update: async (id, data) => {
    await delay(300);
    let items = getStorage(entityName);
    const index = items.findIndex(item => item.id === id);
    if (index > -1) {
      items[index] = { ...items[index], ...data };
      setStorage(entityName, items);
      return items[index];
    }
    throw new Error('Item não encontrado');
  },
  delete: async (id) => {
    await delay(300);
    let items = getStorage(entityName);
    items = items.filter(item => item.id !== id);
    setStorage(entityName, items);
    return { success: true };
  }
});

// Exportamos a nossa versão local e "falsa" do base44
export const base44 = {
  entities: {
    Reservation: createMockEntity('reservations_local_db'),
    Room: createMockEntity('rooms_local_db')
  },
  appLogs: {
    logUserInApp: async () => { return { success: true }; }
  },
  auth: {
    me: async () => ({ id: 'local-1', name: 'Desenvolvedor', role: 'admin' }),
    logout: () => { console.log("Logout local") },
    redirectToLogin: () => { console.log("Redirect local") }
  }
};