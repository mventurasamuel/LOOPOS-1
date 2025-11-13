//pages/PlantsPage.tsx
import React from 'react';
import PlantList from '@/components/PlantList';
import PlantForm from '@/components/modals/PlantForm';
import { Plant } from '@/types';

const PlantsPage: React.FC = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [editingPlant, setEditingPlant] = React.useState<Plant | undefined>(undefined);

  const openCreate = () => {
    setEditingPlant(undefined); // criação: sem initialData
    setIsOpen(true);
  };

  const openEdit = (p: Plant) => {
    setEditingPlant(p);        // edição: passa initialData
    setIsOpen(true);
  };

  const closeModal = () => setIsOpen(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-100">Gerenciar Usinas</h2>
        <button
          onClick={openCreate}
          className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded hover:bg-green-700"
        >
          + Nova Usina
        </button>
      </div>

      <PlantList onEdit={openEdit} />

      {/* Modal: se editingPlant existir, o PlantForm entra em modo de edição */}
      <PlantForm isOpen={isOpen} onClose={closeModal} initialData={editingPlant} />
    </div>
  );
};

export default PlantsPage;