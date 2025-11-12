// File: components/modals/ManagementModal.tsx
// Este modal serve como uma interface de gerenciamento genérica para listar e editar
// diferentes tipos de dados (usuários e usinas). A correção abaixo monta apenas a seção
// ativa (lista OU formulário) por vez e usa keys estáveis para evitar remount que faz
// inputs perderem o foco ao digitar.

import React from 'react';
import Modal from './Modal';
import { useData } from '../../contexts/DataContext';
import { User, Plant, Role } from '../../types';
import UserForm from './UserForm';
import PlantForm from './PlantForm';
import Portal from '../Portal'; // ajuste o caminho se necessário

// Define as propriedades que o modal de gerenciamento espera receber.
interface ManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  // `config` determina o que o modal está gerenciando no momento (usuários/usinas)
  // ou se deve abrir o formulário de edição/criação correspondente.
  config: {
    // Estados principais de lista
    type: 'MANAGE_USERS' | 'MANAGE_PLANTS' | 'USER_FORM' | 'PLANT_FORM';
    data?: {
      // Para MANAGE_USERS: define quais funções serão listadas e o título
      roles?: Role[];
      title?: string;
      // Para USER_FORM: dados do usuário selecionado e config para voltar
      user?: User;
      role?: Role;
      // Para PLANT_FORM: dados da usina selecionada e config para voltar
      plant?: Plant;
      // Guarda a configuração anterior para retorno ao fechar o formulário
      parentConfig?: any;
    };
  };
  // Função para alterar a configuração do modal (navegar entre lista e formulários)
  setModalConfig: (config: any) => void;
}

const ManagementModal: React.FC<ManagementModalProps> = ({ isOpen, onClose, config, setModalConfig }) => {
  // Acessa os dados globais.
  const { users, plants } = useData();

  // Determina se o modal está gerenciando usuários ou usinas com base na configuração.
  const isManagingUsers = config.type === 'MANAGE_USERS';
  // Define o título do modal dinamicamente.
    const title = config.type === 'USER_FORM'
    ? (config.data?.user ? `Editar Usuário: ${config.data.user.name}` : 'Novo Usuário')
    : config.type === 'PLANT_FORM'
        ? (config.data?.plant ? `Editar Usina: ${config.data.plant.name}` : 'Nova Usina')
        : isManagingUsers
        ? `Gerenciar ${config.data?.title}`
        : 'Gerenciar Usinas';

    // ADICIONADO: título estável para esta sessão do modal
    // Motivo: evita re-render do cabeçalho enquanto digita no formulário.
    const stableModalTitleRef = React.useRef(title);
    // Atualiza o título fixo somente quando a “tela” muda (lista ↔ formulário).
    React.useEffect(() => {
        stableModalTitleRef.current = title;
    }, [config.type]);

  // Filtra a lista de itens a serem exibidos com base na configuração.
  const items = isManagingUsers
    ? users.filter(u => (config.data?.roles || []).includes(u.role))
    : plants;

  // Função chamada ao clicar no botão "Adicionar Novo..."
  const handleAddItem = () => {
    if (isManagingUsers) {
      // Abre o formulário de usuário, pré-selecionando a função correta.
      setModalConfig({
        type: 'USER_FORM',
        data: {
          role: config.data?.roles?.[0],
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

  // Renderização de linha para usuário (lista)
  const renderUserRow = (user: User) => (
    <div key={user.id} className="flex items-center justify-between p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">
      <div>
        <p className="font-semibold">{user.name}</p>
        <p className="text-sm text-gray-500">{user.email}</p>
      </div>
      <button onClick={() => handleEditItem(user)} className="btn-secondary text-sm">Editar</button>
    </div>
  );

  // Renderização de linha para usina (lista)
  const renderPlantRow = (plant: Plant) => (
    <div key={plant.id} className="flex items-center justify-between p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">
      <div>
        <p className="font-semibold">{plant.name}</p>
        <p className="text-sm text-gray-500">{plant.client}</p>
      </div>
      <button onClick={() => handleEditItem(plant)} className="btn-secondary text-sm">Editar</button>
    </div>
  );

  // Key estável para a “tela” ativa dentro do modal (lista, user form, plant form).
  // Importante: esta key só muda quando troca de tela ou de registro, não ao digitar.
  const screenKey =
    config.type === 'USER_FORM'
      ? (config.data?.user?.id ?? 'new-user')
      : config.type === 'PLANT_FORM'
        ? (config.data?.plant?.id ?? 'new-plant')
        : 'list';

return (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    title={stableModalTitleRef.current}
    footer={
      (config.type === 'MANAGE_USERS' || config.type === 'MANAGE_PLANTS') ? (
        <button onClick={handleAddItem} className="btn-primary">
          {isManagingUsers ? `Novo ${config.data?.title?.slice(0, -1) || 'Usuário'}` : 'Nova Usina'}
        </button>
      ) : undefined
    }
  >
    <div key={screenKey} className="contents">
      {(config.type === 'MANAGE_USERS' || config.type === 'MANAGE_PLANTS') ? (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {items.length > 0 ? (
            items.map(item => isManagingUsers ? renderUserRow(item as User) : renderPlantRow(item as Plant))
          ) : (
            <p className="text-center text-gray-500 p-4">Nenhum item encontrado.</p>
          )}
        </div>
      ) : config.type === 'USER_FORM' ? (
        <Portal>
          <UserForm
            key={config.data?.user?.id ?? 'new-user'}
            isOpen={true}
            onClose={() => setModalConfig(config.data?.parentConfig)}
            initialData={config.data?.user}
            role={config.data?.role}
          />
        </Portal>
      ) : config.type === 'PLANT_FORM' ? (
        <Portal>
          <PlantForm
            key={config.data?.plant?.id ?? 'new-plant'}
            isOpen={true}
            onClose={() => setModalConfig(config.data?.parentConfig)}
            initialData={config.data?.plant}
          />
        </Portal>
      ) : null}
    </div>
  </Modal>
);
};

export default React.memo(ManagementModal);