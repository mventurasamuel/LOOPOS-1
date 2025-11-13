// File: contexts/DataContext.tsx
// Este é o "coração" da aplicação, atuando como um banco de dados em memória.
// Ele gerencia todos os dados (usuários, usinas, OSs), fornece funções para manipulá-los
// e usa o localStorage para persistência (via hook useLocalStorage abaixo).

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { OS, User, Plant, Notification, OSLog, ImageAttachment, Role } from '../types';
import { DEFAULT_PLANT_ASSETS } from '../constants';

// --- DADOS DE EXEMPLO (MOCK DATA) ---
// Estes dados são usados para popular a aplicação inicialmente, facilitando o desenvolvimento e testes.
// Observação: você pode acrescentar usuários COORDINATOR/ASSISTANT aqui se desejar testá-los.
const initialUsers: User[] = [
  { id: 'user-1', name: 'Admin User', email: 'admin@admin.com', password: 'admin', phone: '111', role: Role.ADMIN },
  { id: 'user-2', name: 'Maria Oliveira', email: 'maria@supervisor.com', password: '123', phone: '222', role: Role.SUPERVISOR, plantIds: ['plant-1', 'plant-2'] },
  { id: 'user-3', name: 'Carlos Souza', email: 'carlos@technician.com', password: '123', phone: '333', role: Role.TECHNICIAN, plantIds: ['plant-1'], supervisorId: 'user-2' },
  { id: 'user-4', name: 'João Pereira', email: 'joao@technician.com', password: '123', phone: '444', role: Role.TECHNICIAN, plantIds: ['plant-2'], supervisorId: 'user-2' },
  { id: 'user-5', name: 'Ana Costa', email: 'ana@supervisor.com', password: '123', phone: '555', role: Role.SUPERVISOR, plantIds: ['plant-3'] },
  { id: 'user-6', name: 'Pedro Lima', email: 'pedro@technician.com', password: '123', phone: '667', role: Role.TECHNICIAN, plantIds: ['plant-3'], supervisorId: 'user-5' },
  { id: 'user-7', name: 'Luiza Fernandes', email: 'luiza@operator.com', password: '123', phone: '777', role: Role.OPERATOR },
];

const initialPlants: Plant[] = [
  { id: 'plant-1', client: 'Cliente A', name: 'UFV Solar I',  subPlants: [{ id: 1, inverterCount: 10 }], stringCount: 100, trackerCount: 50,  assets: DEFAULT_PLANT_ASSETS },
  { id: 'plant-2', client: 'Cliente B', name: 'UFV Solar II', subPlants: [{ id: 1, inverterCount: 15 }], stringCount: 150, trackerCount: 75,  assets: DEFAULT_PLANT_ASSETS.slice(0, 10) },
  { id: 'plant-3', client: 'Cliente C', name: 'UFV Solar III',subPlants: [{ id: 1, inverterCount: 20 }], stringCount: 200, trackerCount: 100, assets: DEFAULT_PLANT_ASSETS },
];

interface AssignmentsDTO {
  coordinatorId: string | null;
  supervisorIds: string[];
  technicianIds: string[];
  assistantIds: string[];
}

// Inicia sem Ordens de Serviço, para que o usuário possa criar as suas.
const initialOS: OS[] = [];
const initialNotifications: Notification[] = [];

// --- CONTEXTO ---
// Define a estrutura do objeto que o DataContext fornecerá aos seus consumidores.
interface DataContextType {
  users: User[];
  plants: Plant[];
  osList: OS[];
  notifications: Notification[];
  addUser: (user: Omit<User, 'id'>) => Promise<User>;
  updateUser: (user: User) => Promise<User>;
  addPlant: (plant: Omit<Plant, 'id'>, assignments?: AssignmentsDTO) => Promise<Plant>;
  updatePlant: (plant: Plant, assignments?: AssignmentsDTO) => Promise<void>;
  addOS: (osData: Omit<OS, 'id' | 'title' | 'createdAt' | 'updatedAt' | 'logs' | 'imageAttachments'>) => Promise<void>;
  updateOS: (os: OS) => Promise<void>;
  addOSLog: (osId: string, log: Omit<OSLog, 'id' | 'timestamp'>) => void;
  addOSAttachment: (osId: string, attachment: Omit<ImageAttachment, 'id' | 'uploadedAt'>) => void;
  deleteOSAttachment: (osId: string, attachmentId: string) => void;
  markNotificationAsRead: (notificationId: string) => void;
  filterOSForUser: (u: User) => OS[];
}

// Cria o contexto.
const DataContext = createContext<DataContextType | undefined>(undefined);

/**
 * Hook customizado para abstrair a lógica de ler e salvar dados no localStorage.
 * @param key Chave usada no localStorage.
 * @param initialValue Valor inicial se não houver nada salvo.
 */
// Persistência de cache local (mesmo hook que você já tinha)
const useLocalStorage = <T,>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try { const item = window.localStorage.getItem(key); return item ? JSON.parse(item) : initialValue; }
    catch { return initialValue; }
  });
  const setValue = (value: T | ((val: T) => T)) => {
    try { const next = value instanceof Function ? value(storedValue) : value;
      setStoredValue(next); window.localStorage.setItem(key, JSON.stringify(next)); } catch {}
  };
  return [storedValue, setValue];
};

/**
 * DataProvider é o componente que gerencia e fornece todos os dados da aplicação.
 * Ele persiste os dados no localStorage por "tabela" (users, plants, osList, notifications).
 */
export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Estados com cache local
  const [users, setUsers] = useLocalStorage<User[]>('users', []);
  const [plants, setPlants] = useLocalStorage<Plant[]>('plants', []);
  const [osList, setOsList] = useLocalStorage<OS[]>('osList', []);
  const [notifications, setNotifications] = useLocalStorage<Notification[]>('notifications', []);

  // Bootstrap único: carrega users, plants e OS da API; se falhar, mantém cache local
  const didBootstrapRef = React.useRef(false);
  React.useEffect(() => {
    if (didBootstrapRef.current) return;
    didBootstrapRef.current = true;
    (async () => {
      try {
        const [u, p, o] = await Promise.all([
          fetch('/api/users').then(r => r.ok ? r.json() : users),
          fetch('/api/plants').then(r => r.ok ? r.json() : plants),
          fetch('/api/os').then(r => r.ok ? r.json() : osList),
        ]);
        setUsers(u); setPlants(p); setOsList(o);
      } catch {
        // Sem backend: segue com cache local
      }
    })();
  }, []);

  // Helpers
  const createNotification = (userId: string, message: string) => {
    const n: Notification = { id: `notif-${Date.now()}`, userId, message, read: false, timestamp: new Date().toISOString() };
    setNotifications(prev => [n, ...prev]);
  };

  const filterOSForUser = (u: User): OS[] => {
    if (u.role === Role.TECHNICIAN) return osList.filter(os => os.technicianId === u.id);
    if (u.role === Role.SUPERVISOR) {
      const techIds = users.filter(x => x.role === Role.TECHNICIAN && x.supervisorId === u.id).map(x => x.id);
      return osList.filter(os => techIds.includes(os.technicianId));
    }
    return osList;
  };

  // --- Users via API (com fallback otimista) ---
  const addUser = async (user: Omit<User, 'id'>): Promise<User> => {
    try {
      const res = await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(user) });
      if (!res.ok) throw new Error();
      const saved: User = await res.json();
      setUsers(prev => [...prev, saved]);
      return saved;
    } catch {
      const local: User = { ...user, id: `user-${Date.now()}` };
      setUsers(prev => [...prev, local]); // fallback
      return local;
    }
  };

  const updateUser = async (user: User): Promise<User> => {
    try {
      const res = await fetch(`/api/users/${user.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(user) });
      if (!res.ok) throw new Error();
      const saved: User = await res.json();
      setUsers(prev => prev.map(u => u.id === saved.id ? saved : u));
      return saved;
    } catch {
      setUsers(prev => prev.map(u => u.id === user.id ? user : u)); // fallback
      return user;
    }
  };

  // --- Plants via API (com assignments separados) ---
  const putAssignments = async (plantId: string, a: AssignmentsDTO) => {
    try {
      await fetch(`/api/plants/${plantId}/assignments`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(a)
      });
      // Atualiza links reversos no estado (opcional; backend já persiste em users.json)
      setUsers(prev => prev.map(u => {
        const list = new Set(u.plantIds || []);
        const inAssign = u.id === a.coordinatorId || a.supervisorIds.includes(u.id) || a.technicianIds.includes(u.id) || a.assistantIds.includes(u.id);
        if (inAssign) list.add(plantId); else list.delete(plantId);
        return { ...u, plantIds: Array.from(list) };
      }));
    } catch {
      // fallback silencioso; o usuário verá os dados ao recarregar quando backend voltar
    }
  };

  const addPlant = async (plant: Omit<Plant, 'id'>, assignments?: AssignmentsDTO): Promise<Plant> => {
    try {
      const res = await fetch('/api/plants', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(plant) });
      if (!res.ok) throw new Error();
      const saved: Plant = await res.json();
      setPlants(prev => [...prev, saved]);
      if (assignments) await putAssignments(saved.id, {
        coordinatorId: assignments.coordinatorId ?? null,
        supervisorIds: assignments.supervisorIds || [],
        technicianIds: assignments.technicianIds || [],
        assistantIds: assignments.assistantIds || [],
      });
      return saved;
    } catch {
      const local: Plant = { ...plant, id: `plant-${Date.now()}` };
      setPlants(prev => [...prev, local]); // fallback
      return local;
    }
  };

  const updatePlant = async (plant: Plant, assignments?: AssignmentsDTO): Promise<void> => {
    try {
      const res = await fetch(`/api/plants/${plant.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(plant) });
      if (!res.ok) throw new Error();
      const saved: Plant = await res.json();
      setPlants(prev => prev.map(p => p.id === saved.id ? saved : p));
      if (assignments) await putAssignments(saved.id, {
        coordinatorId: assignments.coordinatorId ?? null,
        supervisorIds: assignments.supervisorIds || [],
        technicianIds: assignments.technicianIds || [],
        assistantIds: assignments.assistantIds || [],
      });
    } catch {
      setPlants(prev => prev.map(p => p.id === plant.id ? plant : p)); // fallback
    }
  };

  // --- OS (seu código atual; mantém fallback local) ---
  const addOS = async (osData: Omit<OS, 'id'| 'title'| 'createdAt'| 'updatedAt'| 'logs'| 'imageAttachments'>): Promise<void> => {
    const now = new Date().toISOString();
    const nextIdNumber = (osList.length > 0 ? Math.max(...osList.map(os => parseInt(os.id.replace(/\D/g, ''), 10))) : 0) + 1;
    const newId = `OS${String(nextIdNumber).padStart(4, '0')}`;
    const newTitle = `${newId} - ${osData.activity}`;
    const payload: OS = { ...osData, id: newId, title: newTitle, createdAt: now, updatedAt: now, logs: [], imageAttachments: [] };
    try {
      const res = await fetch('/api/os', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error();
      const saved: OS = await res.json();
      setOsList(prev => [saved, ...prev]);
    } catch {
      setOsList(prev => [payload, ...prev]); // fallback
    }
    if (osData.supervisorId) createNotification(osData.supervisorId, `Nova OS "${newTitle}" criada.`);
    if (osData.technicianId) createNotification(osData.technicianId, `Você foi atribuído à nova OS "${newTitle}".`);
  };

  const updateOS = async (updatedOS: OS) => {
    const finalOS = { ...updatedOS, title: `${updatedOS.id} - ${updatedOS.activity}`, updatedAt: new Date().toISOString() };
    try {
      const res = await fetch(`/api/os/${finalOS.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(finalOS) });
      if (!res.ok) throw new Error();
      const saved: OS = await res.json();
      setOsList(prev => prev.map(os => os.id === saved.id ? saved : os));
    } catch {
      setOsList(prev => prev.map(os => os.id === finalOS.id ? finalOS : os));
    }
  };

  const addOSLog = (osId: string, log: Omit<OSLog, 'id' | 'timestamp'>) => {
    const newLog: OSLog = { ...log, id: `log-${Date.now()}`, timestamp: new Date().toISOString() };
    setOsList(prev => prev.map(os => os.id === osId ? { ...os, logs: [newLog, ...os.logs] } : os));
    const os = osList.find(o => o.id === osId);
    if (os) {
      const author = users.find(u => u.id === log.authorId);
      const msg = `${author?.name || 'Usuário'} adicionou um comentário à OS "${os.title}".`;
      createNotification(os.supervisorId, msg);
      if (log.statusChange) createNotification(os.supervisorId, `O status da OS "${os.title}" foi alterado para ${log.statusChange.to}.`);
    }
  };

  const addOSAttachment = (osId: string, att: Omit<ImageAttachment, 'id' | 'uploadedAt'>) => {
    const newAtt: ImageAttachment = { ...att, id: `img-${Date.now()}`, uploadedAt: new Date().toISOString() };
    setOsList(prev => prev.map(os => os.id === osId ? { ...os, imageAttachments: [newAtt, ...os.imageAttachments] } : os));
  };

  const deleteOSAttachment = (osId: string, attId: string) => {
    setOsList(prev => prev.map(os => os.id === osId ? { ...os, imageAttachments: os.imageAttachments.filter(a => a.id !== attId) } : os));
  };

  const markNotificationAsRead = (id: string) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));

  return (
    <DataContext.Provider value={{
      users, plants, osList, notifications,
      addUser, updateUser, addPlant, updatePlant,
      addOS, updateOS, addOSLog, addOSAttachment, deleteOSAttachment,
      filterOSForUser, markNotificationAsRead,
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = (): DataContextType => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within a DataProvider');
  return ctx;
};