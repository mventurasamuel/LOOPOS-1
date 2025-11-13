// File: components/modals/PlantForm.tsx
// Este componente renderiza um formulário modal para criar ou editar usinas.
// Ajustado para refletir o modelo: quantidade fixa de Subusinas por Usina.
// Na criação: o usuário informa N e o formulário gera Subusina 1..N.
// Na edição: a quantidade é fixa (não editável); apenas os campos das subusinas existentes são alterados.

import React, { useState, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import { Plant, Role } from '../../types';
import Modal from './Modal';
import { DEFAULT_PLANT_ASSETS } from '../../constants';

// Componentes auxiliares movidos para o escopo do módulo para evitar remounts e perda de foco.
const FormField: React.FC<{label: string, children: React.ReactNode, className?: string}> = ({label, children, className}) => (
  <div className={className}>
    <label className="block text-sm font-medium text-gray-200 mb-1">{label}</label>
    {children}
  </div>
);

const UserAssignmentField: React.FC<{
  title: string,
  users: Array<{ id: string; name: string }>,
  selected: string[],
  onChange: (id: string) => void
}> = ({ title, users, selected, onChange }) => (
  <FormField label={title}>
    <div className="grid grid-cols-2 gap-2 p-2 border dark:border-gray-600 rounded-md max-h-32 overflow-y-auto">
      {users.map(user => (
        <label key={user.id} className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={selected.includes(user.id)}
            onChange={() => onChange(user.id)}
            className="rounded"
          />
          <span>{user.name}</span>
        </label>
      ))}
    </div>
  </FormField>
);

interface PlantFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Plant; // Se presente, estamos editando; caso contrário, criando.
}

// Tipo para o estado interno do formulário de usina
type PlantFormData = {
  client: string;
  name: string;
  subPlants: { id: number; inverterCount: number }[];
  stringCount: number;
  trackerCount: number;
  assets: string[];
};

const PlantForm: React.FC<PlantFormProps> = ({ isOpen, onClose, initialData }) => {
  // Acessa os dados e funções do DataContext.
  const { users, addPlant, updatePlant } = useData();

  // Filtra usuários por função
  const allTechnicians = users.filter(u => u.role === Role.TECHNICIAN);
  const allSupervisors = users.filter(u => u.role === Role.SUPERVISOR);

  const isEditing = !!initialData;

  // Título estável para esta abertura do modal (evita mudanças durante a digitação)
  const stableTitleRef = React.useRef(
    isEditing ? `Editar Usina ${initialData?.name ?? ''}` : 'Nova Usina'
  );

  // Quantidade de subusinas (N). Na criação o usuário informa; na edição é fixa (derivada do dado).
  const [qtdSubunidades, setQtdSubunidades] = useState<number>(
    isEditing ? (initialData?.subPlants?.length ?? 1) : 1
  );

  // Função para obter estado inicial
  const getInitialState = (): PlantFormData => {
    if (initialData) {
      return {
        client: initialData.client,
        name: initialData.name,
        subPlants: [...initialData.subPlants], // já vem com a quantidade fixa
        stringCount: initialData.stringCount,
        trackerCount: initialData.trackerCount,
        assets: [...initialData.assets],
      };
    }
    // Criação: começamos com N subusinas (N = qtdSubunidades), numeradas 1..N, e inverterCount = 0.
    // OBS: o efeito abaixo mantém formData.subPlants sincronizado quando qtdSubunidades muda.
    return {
      client: '',
      name: '',
      subPlants: Array.from({ length: Math.max(1, qtdSubunidades) }, (_, i) => ({
        id: i + 1,
        inverterCount: 0
      })),
      stringCount: 0,
      trackerCount: 0,
      assets: DEFAULT_PLANT_ASSETS,
    };
  };

  // Estado principal do formulário
  const [formData, setFormData] = useState<PlantFormData>(getInitialState());

  // Estados para as associações de usuários (apenas no modo de edição).
  const [assignedTechnicians, setAssignedTechnicians] = useState<string[]>([]);
  const [assignedSupervisors, setAssignedSupervisors] = useState<string[]>([]);

  // Reset do formulário sempre que o modal abre
  useEffect(() => {
    if (isOpen) {
      setFormData(getInitialState());

      if (initialData) {
        // Se for edição, preenche usuários associados (usando plantIds)
        setAssignedTechnicians(
          allTechnicians.filter(u => u.plantIds?.includes(initialData.id)).map(u => u.id)
        );
        setAssignedSupervisors(
          allSupervisors.filter(u => u.plantIds?.includes(initialData.id)).map(u => u.id)
        );
      } else {
        setAssignedTechnicians([]);
        setAssignedSupervisors([]);
      }
    }
    // Importante: não incluir `users` nas dependências para não provocar remounts e perda de foco.
  }, [isOpen, initialData]); // eslint-disable-line react-hooks/exhaustive-deps

  // Quando a quantidade de subusinas muda em CRIAÇÃO, sincronizamos o array subPlants
  // preservando os inverterCount já digitados nas posições existentes.
  useEffect(() => {
    if (!isEditing) {
      setFormData(prev => {
        const n = Math.max(1, qtdSubunidades);
        const next = Array.from({ length: n }, (_, i) => ({
          id: i + 1,
          inverterCount: prev.subPlants[i]?.inverterCount ?? 0
        }));
        return { ...prev, subPlants: next };
      });
    }
  }, [qtdSubunidades, isEditing]);

  // Manipuladores de eventos para atualizar o estado do formulário.
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value
    }));
  };

  const handleSubPlantChange = (index: number, value: number) => {
    const newSubPlants = [...formData.subPlants];
    newSubPlants[index].inverterCount = value;
    setFormData(prev => ({ ...prev, subPlants: newSubPlants }));
  };

  // OBS: Botão "Adicionar Subusina" foi removido, pois a quantidade é fixa conforme a regra de negócio.

  const handleAssetToggle = (assetName: string) => {
    setFormData(prev => ({
      ...prev,
      assets: prev.assets.includes(assetName)
        ? prev.assets.filter(a => a !== assetName)
        : [...prev.assets, assetName]
    }));
  };

  const handleUserAssignmentChange = (userId: string, type: 'technician' | 'supervisor') => {
    const setter = type === 'technician' ? setAssignedTechnicians : setAssignedSupervisors;
    setter(prev => prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]);
  };

  // Submissão do formulário com a lógica de quantidade fixa de subusinas
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isEditing) {
      // Edição: a quantidade de subusinas é fixa; apenas atualizamos os dados existentes
      updatePlant({ ...initialData, ...formData }, assignedTechnicians, assignedSupervisors);
    } else {
      // Criação: subPlants já foi gerado automaticamente a partir de `qtdSubunidades`
      // (efeito acima garante que formData.subPlants tem tamanho N).
      addPlant(formData);
    }

    onClose();
  };

  // Contraste e acessibilidade: classes utilitárias para inputs no tema escuro
  const inputBase =
    "w-full px-3 py-2 rounded-md shadow-sm bg-gray-800 border border-gray-600 text-gray-100 placeholder-gray-400 " +
    "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={stableTitleRef.current}
      footer={
        <>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-200 bg-gray-700 rounded-md hover:bg-gray-600"
          >
            Cancelar
          </button>
          {/* Submit do form via atributo form para não perder foco */}
          <button
            type="submit"
            form="plant-form"
            className="ml-3 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            Salvar
          </button>
        </>
      }
    >
      <form id="plant-form" onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Cliente">
          <input
            type="text"
            name="client"
            value={formData.client}
            onChange={handleChange}
            required
            className={inputBase}
            placeholder="Nome do cliente"
          />
        </FormField>

        <FormField label="Nome da Usina">
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className={inputBase}
            placeholder="Ex.: Bom Jesus"
          />
        </FormField>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField label="Qtd. de Strings">
            <input
              type="number"
              name="stringCount"
              value={formData.stringCount}
              onChange={handleChange}
              min={0}
              className={inputBase}
            />
          </FormField>
          <FormField label="Qtd. de Trackers">
            <input
              type="number"
              name="trackerCount"
              value={formData.trackerCount}
              onChange={handleChange}
              min={0}
              className={inputBase}
            />
          </FormField>
          <FormField label="Qtd. de Subusinas">
            <input
              type="number"
              min={1}
              value={qtdSubunidades}
              onChange={(e) => setQtdSubunidades(Math.max(1, parseInt(e.target.value) || 1))}
              disabled={isEditing} // Edição: quantidade fixa
              className={inputBase + (isEditing ? " opacity-80 cursor-not-allowed" : "")}
            />
            <p className="text-xs text-gray-400 mt-1">
              {isEditing
                ? "A quantidade de subusinas é fixa para esta usina."
                : "Serão geradas Subusina 1, Subusina 2, ... até a quantidade informada."}
            </p>
          </FormField>
        </div>

        <FormField label="Subusinas">
          <div className="space-y-2">
            {formData.subPlants.map((sub, index) => (
              <div key={sub.id} className="flex items-center space-x-3">
                {/* Nota: a denominação visual (ex.: Bom Jesus 1..N) é aplicada na listagem/página de detalhes */}
                <span className="font-semibold text-gray-200">Subusina {sub.id}:</span>
                <input
                  type="number"
                  min={0}
                  value={sub.inverterCount}
                  onChange={(e) => handleSubPlantChange(index, parseInt(e.target.value) || 0)}
                  className={inputBase}
                  placeholder="Qtd. Inversores"
                />
              </div>
            ))}
          </div>
          {/* Botão de adicionar foi removido, conforme regra de contagem fixa */}
        </FormField>

        {isEditing && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t dark:border-gray-700">
            <UserAssignmentField
              title="Técnicos Atribuídos"
              users={allTechnicians}
              selected={assignedTechnicians}
              onChange={(id) => handleUserAssignmentChange(id, 'technician')}
            />
            <UserAssignmentField
              title="Supervisores Atribuídos"
              users={allSupervisors}
              selected={assignedSupervisors}
              onChange={(id) => handleUserAssignmentChange(id, 'supervisor')}
            />
          </div>
        )}

        <FormField label="Ativos Padrão">
          <div className="flex items-center justify-end">
            <label className="flex items-center space-x-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={formData.assets.length === DEFAULT_PLANT_ASSETS.length}
                onChange={(e) =>
                  setFormData(prev => ({
                    ...prev,
                    assets: e.target.checked ? DEFAULT_PLANT_ASSETS : []
                  }))
                }
                className="rounded"
              />
              <span>Selecionar Todos</span>
            </label>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-2 border dark:border-gray-600 rounded-md max-h-48 overflow-y-auto mt-1">
            {DEFAULT_PLANT_ASSETS.map(asset => (
              <label key={asset} className="flex items-center space-x-2 text-xs">
                <input
                  type="checkbox"
                  checked={formData.assets.includes(asset)}
                  onChange={() => handleAssetToggle(asset)}
                  className="rounded"
                />
                <span>{asset}</span>
              </label>
            ))}
          </div>
        </FormField>
      </form>
    </Modal>
  );
};

export default React.memo(PlantForm);