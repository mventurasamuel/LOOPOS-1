// File: components/modals/ManagementModal.tsx
// Este modal serve como uma interface de gerenciamento genérica para listar e editar diferentes tipos de dados, como usuários e usinas.

import React from 'react';
import Modal from './Modal';
import { useData } from '../../contexts/DataContext';
import { User, Plant, Role } from '../../types';

// Define as propriedades que o modal de gerenciamento espera receber.
interface ManagementModalProps {
    isOpen: boolean;
    onClose: () => void;
    // `config` determina o que o modal está gerenciando no momento (usuários ou usinas) e passa dados relevantes.
    config: {
        type: 'MANAGE_USERS' | 'MANAGE_PLANTS';
        data?: {
            roles: Role[]; // Para usuários, especifica quais funções devem ser listadas.
            title: string;   // Usado para o título do modal (ex: "Técnicos").
        };
    };
    // Função para alterar a configuração do modal (navegar para o formulário de edição/criação).
    setModalConfig: (config: any) => void;
}

const ManagementModal: React.FC<ManagementModalProps> = ({ isOpen, onClose, config, setModalConfig }) => {
    // Acessa os dados globais.
    const { users, plants } = useData();

    // Determina se o modal está gerenciando usuários ou usinas com base na configuração.
    const isManagingUsers = config.type === 'MANAGE_USERS';
    // Define o título do modal dinamicamente.
    const title = isManagingUsers ? `Gerenciar ${config.data?.title}` : 'Gerenciar Usinas';
    
    // Filtra a lista de itens a serem exibidos com base na configuração.
    const items = isManagingUsers
        ? users.filter(u => config.data?.roles.includes(u.role))
        : plants;

    // Função chamada ao clicar no botão "Adicionar Novo...".
    const handleAddItem = () => {
        if (isManagingUsers) {
            // Abre o formulário de usuário, pré-selecionando a função correta.
            setModalConfig({ 
                type: 'USER_FORM', 
                data: { 
                    role: config.data?.roles[0],
                    parentConfig: config // Salva a config atual para poder voltar a ela.
                } 
            });
        } else {
            // Abre o formulário de usina.
            setModalConfig({ 
                type: 'PLANT_FORM',
                data: {
                    parentConfig: config
                }
            });
        }
    };

    // Função chamada ao clicar no botão "Editar" de um item.
    const handleEditItem = (item: User | Plant) => {
        if (isManagingUsers) {
            // Abre o formulário de usuário com os dados do usuário selecionado.
            setModalConfig({ 
                type: 'USER_FORM', 
                data: { 
                    user: item as User,
                    parentConfig: config 
                } 
            });
        } else {
            // Abre o formulário de usina com os dados da usina selecionada.
            setModalConfig({ 
                type: 'PLANT_FORM', 
                data: {
                    plant: item as Plant,
                    parentConfig: config
                }
            });
        }
    };

    // Funções de renderização para cada tipo de item.
    const renderUserRow = (user: User) => (
        <div key={user.id} className="flex items-center justify-between p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">
            <div>
                <p className="font-semibold">{user.name}</p>
                <p className="text-sm text-gray-500">{user.email}</p>
            </div>
            <button onClick={() => handleEditItem(user)} className="btn-secondary text-sm">Editar</button>
        </div>
    );
    
    const renderPlantRow = (plant: Plant) => (
         <div key={plant.id} className="flex items-center justify-between p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">
            <div>
                <p className="font-semibold">{plant.name}</p>
                <p className="text-sm text-gray-500">{plant.client}</p>
            </div>
            <button onClick={() => handleEditItem(plant)} className="btn-secondary text-sm">Editar</button>
        </div>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            // O rodapé contém o botão para adicionar um novo item.
            footer={
                <button onClick={handleAddItem} className="btn-primary">
                    {isManagingUsers ? `Novo ${config.data?.title.slice(0, -1)}` : 'Nova Usina'}
                </button>
            }
        >
            {/* O corpo do modal contém a lista de itens. */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
                {items.length > 0 ? (
                    items.map(item => isManagingUsers ? renderUserRow(item as User) : renderPlantRow(item as Plant))
                ) : (
                    <p className="text-center text-gray-500 p-4">Nenhum item encontrado.</p>
                )}
            </div>
        </Modal>
    );
};

export default ManagementModal;
