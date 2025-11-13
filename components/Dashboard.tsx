// File: components/Dashboard.tsx
// Este é o componente principal da aplicação após o login. Ele age como um orquestrador,
// juntando a barra lateral (Sidebar), o cabeçalho (Header) e o painel Kanban (Board),
// além de gerenciar a exibição de todos os modais (pop-ups).

import React, { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { OS } from '../types';
import Sidebar from './Sidebar';
import Header from './Header';
import Board from './Board';
import OSDetailModal from './modals/OSDetailModal';
import OSForm from './modals/OSForm';
import ManagementModal from './modals/ManagementModal';
import UserForm from './modals/UserForm';
import PlantForm from './modals/PlantForm';
import DownloadModal from './modals/DownloadModal';

// Define a estrutura de configuração para abrir um modal.
interface ModalConfig {
    type: 'OS_DETAIL' | 'OS_FORM' | 'MANAGE_USERS' | 'MANAGE_PLANTS' | 'USER_FORM' | 'PLANT_FORM' | 'DOWNLOAD_FILTER';
    data?: any; // Dados a serem passados para o modal (ex: a OS a ser editada).
}

const Dashboard: React.FC = () => {
    // Acessa os dados e funções do contexto principal.
    const { osList, updateOS } = useData();
    
    // Estados para controlar a UI.
    const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false); // Visibilidade da sidebar em telas pequenas.
    const [isSidebarCollapsed, setSidebarCollapsed] = useState(false); // Estado de recolhimento da sidebar no desktop.
    const [searchTerm, setSearchTerm] = useState(''); // Termo de busca inserido no cabeçalho.
    const [modalConfig, setModalConfig] = useState<ModalConfig | null>(null); // Configuração do modal atualmente aberto, ou nulo se nenhum.

    // `useMemo` otimiza a performance filtrando as OSs apenas quando a lista ou o termo de busca mudam.
    const filteredOS = useMemo(() => {
        if (!searchTerm) return osList; // Se a busca estiver vazia, retorna todas as OSs.
        // Filtra as OSs cujo título ou ID contenham o termo de busca (ignorando maiúsculas/minúsculas).
        return osList.filter(os =>
            os.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            os.id.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [osList, searchTerm]);

    // Funções para manipular os modais.
    const handleCloseModal = () => setModalConfig(null);
    const handleNewOS = () => setModalConfig({ type: 'OS_FORM' });
    const handleCardClick = (os: OS) => setModalConfig({ type: 'OS_DETAIL', data: os });
    const handleOpenDownloadFilter = () => setModalConfig({ type: 'DOWNLOAD_FILTER' });

    // Função que renderiza o modal correto com base na configuração atual em `modalConfig`.
    const renderModal = () => {
        if (!modalConfig) return null;
        // Um `switch` decide qual componente de modal renderizar.
        switch (modalConfig.type) {
            case 'OS_DETAIL':
            return <OSDetailModal isOpen={true} onClose={handleCloseModal} os={modalConfig.data} setModalConfig={setModalConfig} />;

            case 'OS_FORM':
            return <OSForm isOpen={true} onClose={handleCloseModal} initialData={modalConfig.data} />;

            case 'MANAGE_USERS':
            case 'MANAGE_PLANTS':
            // Encaminha a própria config para o ManagementModal, que orquestra lista e forms
            return <ManagementModal isOpen={true} onClose={handleCloseModal} config={modalConfig} setModalConfig={setModalConfig} />;

            case 'USER_FORM': {
            // Permite voltar para a tela anterior (lista) ao fechar o form
            const parentConfigForUser = modalConfig.data?.parentConfig || null;
            return (
                <UserForm
                isOpen={true}
                onClose={() => setModalConfig(parentConfigForUser)}
                initialData={modalConfig.data?.user}
                role={modalConfig.data?.role}
                />
            );
            }

            case 'PLANT_FORM': {
            // IMPORTANTE: repassar presetClient, recebido quando o fluxo vem do PlantList
            const parentConfigForPlant = modalConfig.data?.parentConfig || null;
            return (
                <PlantForm
                isOpen={true}
                onClose={() => setModalConfig(parentConfigForPlant)}
                initialData={modalConfig.data?.plant}
                presetClient={modalConfig.data?.presetClient} // ← adicionada
                />
            );
            }

            case 'DOWNLOAD_FILTER':
            return <DownloadModal isOpen={true} onClose={handleCloseModal} />;

            default:
            return null;
        }
        };

    // Estrutura JSX do layout principal da aplicação.
    return (
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
            <Sidebar
                isMobileOpen={isMobileSidebarOpen}
                setMobileOpen={setMobileSidebarOpen}
                isCollapsed={isSidebarCollapsed}
                setIsCollapsed={setSidebarCollapsed}
                setModalConfig={setModalConfig}
            />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header
                    onMenuClick={() => setMobileSidebarOpen(true)}
                    onNewOSClick={handleNewOS}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                />
                <main className="flex-1 overflow-x-auto overflow-y-hidden">
                    <Board
                        osList={filteredOS} // Passa a lista já filtrada para o painel.
                        onUpdateOS={updateOS}
                        onCardClick={handleCardClick}
                        onOpenDownloadFilter={handleOpenDownloadFilter}
                    />
                </main>
            </div>
            {/* Renderiza o modal que estiver ativo. */}
            {renderModal()}
        </div>
    );
};

export default Dashboard;
