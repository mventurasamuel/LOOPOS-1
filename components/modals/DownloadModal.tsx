// File: components/modals/DownloadModal.tsx
// Este componente renderiza um modal para filtrar e baixar relatórios de Ordens de Serviço em formato ZIP contendo PDFs individuais.

import React, { useState } from 'react';
import Modal from './Modal';
import { useData } from '../../contexts/DataContext';
import { OSStatus, Role } from '../../types';
import { OS_STATUSES } from '../../constants';
// Importa as bibliotecas para geração de PDF e arquivos ZIP.
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import JSZip from 'jszip';

// Define as propriedades que o modal de download espera receber.
interface DownloadModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const DownloadModal: React.FC<DownloadModalProps> = ({ isOpen, onClose }) => {
    // Acessa os dados globais da aplicação.
    const { plants, osList, users } = useData();
    // Estados para armazenar os valores dos filtros selecionados pelo usuário.
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedStatuses, setSelectedStatuses] = useState<OSStatus[]>([]);
    const [selectedPlants, setSelectedPlants] = useState<string[]>([]);
    const [selectedTechnicians, setSelectedTechnicians] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false); // Estado para feedback de carregamento.

    // Filtra a lista de usuários para obter apenas os técnicos.
    const technicians = users.filter(u => u.role === Role.TECHNICIAN);

    // Manipuladores de eventos para os filtros de checkbox (Usinas e Técnicos).
    const handleFilterChange = (setter: React.Dispatch<React.SetStateAction<string[]>>, id: string) => {
        setter(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
    };
    const handleStatusChange = (status: OSStatus) => {
        setSelectedStatuses(prev => prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]);
    };

    /**
     * Função principal que filtra as OSs, gera os PDFs e cria o arquivo ZIP.
     */
    const handleDownload = async () => {
        // 1. Filtra a lista de OSs com base nos critérios selecionados.
        let filteredOS = osList;
        if (startDate) { filteredOS = filteredOS.filter(os => new Date(os.startDate) >= new Date(startDate)); }
        if (endDate) { const end = new Date(endDate); end.setDate(end.getDate() + 1); filteredOS = filteredOS.filter(os => new Date(os.startDate) < end); }
        if (selectedStatuses.length > 0) { filteredOS = filteredOS.filter(os => selectedStatuses.includes(os.status)); }
        if (selectedPlants.length > 0) { filteredOS = filteredOS.filter(os => selectedPlants.includes(os.plantId)); }
        if (selectedTechnicians.length > 0) { filteredOS = filteredOS.filter(os => selectedTechnicians.includes(os.technicianId)); }

        if (filteredOS.length === 0) { alert("Nenhuma OS encontrada com os filtros selecionados."); return; }

        setIsLoading(true);
        const zip = new JSZip();

        // 2. Itera sobre cada OS filtrada para gerar um PDF individual.
        for (const os of filteredOS) {
            const doc = new jsPDF();
            const plant = plants.find(p => p.id === os.plantId);
            const technician = users.find(u => u.id === os.technicianId);
            const supervisor = users.find(u => u.id === os.supervisorId);

            // Adiciona o título e a tabela de informações principais.
            doc.setFontSize(16); doc.text(`Relatório da OS: ${os.title}`, 14, 20);
            autoTable(doc, { startY: 30, head: [['Campo', 'Valor']], body: [ ['ID', os.id], ['Status', os.status], ['Prioridade', os.priority], ['Usina', plant?.name || 'N/A'], ['Cliente', plant?.client || 'N/A'], ['Técnico', technician?.name || 'N/A'], ['Supervisor', supervisor?.name || 'N/A'], ['Data de Início', new Date(os.startDate).toLocaleDateString('pt-BR')], ['Atividade', os.activity], ], theme: 'striped', });

            let finalY = (doc as any).lastAutoTable.finalY || 10;
            
            // Adiciona a descrição e os ativos envolvidos.
            doc.setFontSize(12); doc.text('Descrição:', 14, finalY + 10);
            const descLines = doc.splitTextToSize(os.description, 180);
            doc.setFontSize(10); doc.text(descLines, 14, finalY + 15);
            finalY += 15 + (descLines.length * 5);
            
            doc.setFontSize(12); doc.text('Ativos Envolvidos:', 14, finalY + 5);
            doc.setFontSize(10); doc.text(os.assets.join(', '), 14, finalY + 10);
            finalY += 15;

            // 3. Adiciona as imagens anexadas ao PDF.
            if (os.imageAttachments && os.imageAttachments.length > 0) {
                doc.addPage();
                doc.setFontSize(12); doc.text('Anexos:', 14, 20);
                finalY = 25;

                for (const attachment of os.imageAttachments) {
                    try {
                        const img = new Image(); img.src = attachment.url;
                        await new Promise(resolve => { img.onload = resolve; img.onerror=resolve; }); // Espera a imagem carregar.
                        
                        // Lógica para redimensionar a imagem para caber na página.
                        const imgProps = doc.getImageProperties(img.src); const margin = 14; const maxWidth = doc.internal.pageSize.getWidth() - 2 * margin; const maxHeight = 100; const ratio = Math.min(maxWidth / imgProps.width, maxHeight / imgProps.height); const imgWidth = imgProps.width * ratio; const imgHeight = imgProps.height * ratio;

                        // Adiciona uma nova página se não houver espaço suficiente.
                        if (finalY + imgHeight + 15 > doc.internal.pageSize.getHeight() - margin) { doc.addPage(); finalY = margin; }

                        doc.addImage(img.src, 'JPEG', margin, finalY, imgWidth, imgHeight);
                        finalY += imgHeight + 2;
                        if (attachment.caption) { doc.setFontSize(8); doc.setTextColor(100); doc.text(attachment.caption, margin, finalY); finalY += 10; }
                    } catch (e) { console.error("Erro ao adicionar imagem ao PDF:", e); }
                }
            }
            
            // Adiciona o PDF gerado ao arquivo ZIP.
            const pdfBlob = doc.output('blob');
            const fileName = `${os.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
            zip.file(fileName, pdfBlob);
        }
        
        // 4. Gera o arquivo ZIP e inicia o download.
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(zipBlob);
        link.download = `relatorios_os_${new Date().toISOString().split('T')[0]}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setIsLoading(false);
        onClose();
    };

    // Componente auxiliar para agrupar campos de filtro.
    const FilterGroup: React.FC<{label: string, children: React.ReactNode}> = ({label, children}) => ( <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{label}</label>{children}</div> );
    const inputClasses = "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600";

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Baixar Relatório de OS" footer={ <> <button onClick={onClose} className="btn-secondary">Cancelar</button> <button onClick={handleDownload} disabled={isLoading} className="btn-primary ml-3 disabled:bg-gray-400">{isLoading ? 'Gerando...' : 'Gerar e Baixar'}</button> </> }>
            <div className="space-y-4">
                <FilterGroup label="Data de Início (De/Até)"> <div className="flex items-center space-x-2"><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={inputClasses} /><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={inputClasses} /></div></FilterGroup>
                <FilterGroup label="Filtrar por Status"><div className="grid grid-cols-2 gap-2 p-3 border dark:border-gray-600 rounded-md">{OS_STATUSES.map(status => ( <label key={status} className="flex items-center space-x-2 cursor-pointer"><input type="checkbox" checked={selectedStatuses.includes(status)} onChange={() => handleStatusChange(status)} className="rounded" /><span>{status}</span></label>))}</div></FilterGroup>
                <FilterGroup label="Filtrar por Usina"><div className="grid grid-cols-2 gap-2 p-3 border dark:border-gray-600 rounded-md max-h-32 overflow-y-auto">{plants.map(plant => ( <label key={plant.id} className="flex items-center space-x-2 cursor-pointer"><input type="checkbox" checked={selectedPlants.includes(plant.id)} onChange={() => handleFilterChange(setSelectedPlants, plant.id)} className="rounded" /><span>{plant.name}</span></label>))}</div></FilterGroup>
                <FilterGroup label="Filtrar por Técnico"><div className="grid grid-cols-2 gap-2 p-3 border dark:border-gray-600 rounded-md max-h-32 overflow-y-auto">{technicians.map(tech => ( <label key={tech.id} className="flex items-center space-x-2 cursor-pointer"><input type="checkbox" checked={selectedTechnicians.includes(tech.id)} onChange={() => handleFilterChange(setSelectedTechnicians, tech.id)} className="rounded" /><span>{tech.name}</span></label>))}</div></FilterGroup>
            </div>
        </Modal>
    );
};

export default DownloadModal;
