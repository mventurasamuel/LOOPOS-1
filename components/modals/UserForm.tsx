// File: components/modals/UserForm.tsx
// Este componente renderiza um formulário modal para criar ou editar usuários.

import React, { useState, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import { User, Role } from '../../types';
import Modal from './Modal';
import { ROLES } from '../../constants';

// Componentes auxiliares movidos para o escopo do módulo para evitar remounts e perda de foco.
const FormField: React.FC<{label: string, children: React.ReactNode, className?: string}> = ({label, children, className}) => (
  <div className={className}>
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
    {children}
  </div>
);

const inputClasses =
  "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-gray-100 caret-blue-600";

interface UserFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: User; // Dados do usuário a ser editado. Se ausente, é um formulário de criação.
  role?: Role; // Pré-seleciona a função ao criar um novo usuário a partir de um modal de gerenciamento específico.
  setModalConfig?: (config: any) => void; // Para abrir formulário de criação de usuário
}

// Cria tipo para facilitar o estado do formulário sem Partial
type UserFormData = {
  name: string;
  username: string;         // login (ex.: Fabio)
  email?: string;           // opcional
  phone: string;
  password: string;
  role: Role;
  plantIds: string[];
  supervisorId: string;
};


const UserForm: React.FC<UserFormProps> = ({ isOpen, onClose, initialData, role, setModalConfig }) => {
  const { addUser, updateUser, plants, users } = useData();
  const isEditing = !!initialData;
  
  // Função para abrir formulário de criação de supervisor
  const handleAddNewSupervisor = () => {
    if (setModalConfig && formData.plantIds.length > 0) {
      setModalConfig({
        type: 'USER_FORM',
        data: {
          role: Role.SUPERVISOR,
          parentConfig: {
            type: 'USER_FORM',
            data: {
              user: initialData,
              role: formData.role,
              parentConfig: initialData ? undefined : {
                type: 'MANAGE_USERS',
                data: {
                  roles: [formData.role],
                  title: formData.role === Role.TECHNICIAN ? 'Técnicos' : 'Usuários'
                }
              }
            }
          }
        }
      });
    }
  };

  const stableTitleRef = React.useRef(
    isEditing ? `Editar Usuário: ${initialData?.name ?? ''}` : 'Novo Usuário'
  );

  const getInitialState = (): UserFormData => {
    if (initialData) {
      return {
        name: initialData.name,
        username: initialData.username,
        email: initialData.email,
        phone: initialData.phone,
        password: '',
        role: initialData.role,
        plantIds: [...(initialData.plantIds || [])],
        supervisorId: initialData.supervisorId || '',
      };
    }
    return {
      name: '',
      username: '',
      email: undefined,
      phone: '',
      password: '',
      role: role || Role.OPERATOR,
      plantIds: [],
      supervisorId: ''
    };
  };

  const [formData, setFormData] = useState<UserFormData>(getInitialState());

  // ✅ ÚNICO useMemo - supervisores filtrados:
  const supervisorsForSelectedPlants = React.useMemo(() => {
    if (!formData.plantIds || formData.plantIds.length === 0) {
      return [];
    }
    
    return users.filter(u => 
      u.role === Role.SUPERVISOR &&
      u.plantIds.some(plantId => formData.plantIds.includes(plantId))
    );
  }, [users, formData.plantIds]);

  useEffect(() => {
    if (isOpen) {
      setFormData(prev => {
        const initial = getInitialState();
        
        if (initial.role === Role.TECHNICIAN && initial.plantIds.length > 0) {
          const supervisorsInPlants = users.filter(u => 
            u.role === Role.SUPERVISOR &&
            u.plantIds.some(pId => initial.plantIds.includes(pId))
          );
          
          if (supervisorsInPlants.length === 1) {
            initial.supervisorId = supervisorsInPlants[0].id;
          }
        }
        
        return initial;
      });
    }
  }, [isOpen, initialData, role, users]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const v = name === 'username' ? value.toLowerCase() : value;
    setFormData(prev => ({ ...prev, [name]: v }));
  };

  const handlePlantChange = (plantId: string) => {
    setFormData(prev => {
      const current = prev.plantIds;
      const plantIds = current.includes(plantId)
        ? current.filter(id => id !== plantId)
        : [...current, plantId];
      
      if (plantIds.length === 0) {
        return { ...prev, plantIds, supervisorId: '' };
      }
      
      return { ...prev, plantIds };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { name, username, phone, password, role: formRole } = formData;
    
    if (!name || !username || !phone || (!isEditing && !password) || !formRole) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    try {
      if (isEditing) {
        const dataToUpdate: Partial<User> = {
          ...initialData,
          name: formData.name,
          email: formData.email || undefined, // Converte string vazia para undefined
          phone: formData.phone,
          role: formData.role,
          plantIds: formData.plantIds,
          supervisorId: formData.supervisorId || undefined, // Converte string vazia para undefined
        };
        
        if (formData.password && formData.password.trim() !== '') {
          (dataToUpdate as any).password = formData.password;
        }
        
        console.log('📤 Enviando atualização para backend:', dataToUpdate);
        await updateUser(dataToUpdate as User);
      } else {
        // ✅ Prepara dados para criação, convertendo strings vazias para undefined
        const userData: Omit<User, 'id'> = {
          name: formData.name,
          username: formData.username,
          email: formData.email || undefined,
          phone: formData.phone,
          password: formData.password,
          role: formData.role,
          plantIds: formData.plantIds || [],
          supervisorId: formData.supervisorId || undefined,
          can_login: true,
        };
        
        console.log('📤 Enviando criação para backend:', userData);
        await addUser(userData);
      }
      
      onClose();
    } catch (error: any) {
      console.error('❌ Erro ao salvar usuário:', error);
      alert(`Erro ao salvar usuário: ${error.message || 'Erro desconhecido'}`);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={stableTitleRef.current}
      footer={
        <>
          <button onClick={onClose} className="btn-secondary">Cancelar</button>
          <button type="submit" form="user-form" className="btn-primary ml-3">Salvar</button>
        </>
      }
    >
      <form id="user-form" onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Nome Completo">
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className={inputClasses}
          />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Usuário">
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={(e) => {
                const val = e.target.value;
                if (/^[a-z0-9._-]*$/i.test(val) && val.length <= 32) {
                  setFormData(prev => ({ ...prev, username: val }));
                }
              }}
              maxLength={32}
              placeholder="ex: usuario.nome"
              className={inputClasses}
            />
          </FormField>
          <FormField label="Telefone">
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              className={inputClasses}
            />
          </FormField>
        </div>

        <FormField label="E-mail (opcional)">
          <input
            type="email"
            name="email"
            value={formData.email || ''}
            onChange={handleChange}
            placeholder="ex.: nome@dominio.com (opcional)"
            className={inputClasses}
          />
        </FormField>

        <FormField label="Senha">
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required={!isEditing}
            placeholder={isEditing ? 'Deixe em branco para não alterar' : ''}
            className={inputClasses}
          />
        </FormField>

        <FormField label="Função">
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            required
            className={inputClasses}
          >
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </FormField>

        {(formData.role === Role.TECHNICIAN || formData.role === Role.SUPERVISOR) && (
          <FormField label="Usinas Associadas">
            <div className="grid grid-cols-2 gap-2 p-3 border dark:border-gray-600 rounded-md max-h-32 overflow-y-auto">
              {plants.map(plant => (
                <label key={plant.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.plantIds.includes(plant.id)}
                    onChange={() => handlePlantChange(plant.id)}
                    className="rounded"
                  />
                  <span>{plant.name}</span>
                </label>
              ))}
            </div>
          </FormField>
        )}

        {formData.role === Role.TECHNICIAN && (
          <FormField label="Supervisor Responsável">
            {supervisorsForSelectedPlants.length === 0 ? (
              <div className="space-y-2">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  {formData.plantIds.length === 0 
                    ? 'Selecione pelo menos uma usina para ver os supervisores disponíveis'
                    : 'Nenhum supervisor disponível para as usinas selecionadas'}
                </p>
                {formData.plantIds.length > 0 && setModalConfig && (
                  <button
                    type="button"
                    onClick={handleAddNewSupervisor}
                    className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Criar Supervisor
                  </button>
                )}
              </div>
            ) : (
              <select
                name="supervisorId"
                value={formData.supervisorId}
                onChange={handleChange}
                required
                className={inputClasses}
              >
                <option value="">Selecione um supervisor</option>
                {supervisorsForSelectedPlants.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            )}
          </FormField>
        )}
      </form>

    </Modal>
  );
};

export default React.memo(UserForm);
