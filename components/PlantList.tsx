// File: components/PlantList.tsx
import React from 'react';
import { useData } from '@/contexts/DataContext';
import { Plant } from '@/types';

interface Props {
  onEdit: (p: Plant) => void;
}

const PlantList: React.FC<Props> = ({ onEdit }) => {
  const { plants } = useData();
  const [query, setQuery] = React.useState('');

  const grouped = React.useMemo(() => {
    const map = new Map<string, Plant[]>();
    plants.forEach(p => {
      const key = p.client || 'Sem cliente';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    });
    for (const [, list] of map) list.sort((a, b) => a.name.localeCompare(b.name));
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [plants]);

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Buscar usina por nome..."
          className="w-full px-3 py-2 rounded-md bg-gray-800 border border-gray-600 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {grouped.map(([client, list]) => {
        const filtered = list.filter(p =>
          p.name.toLowerCase().includes(query.trim().toLowerCase())
        );
        if (filtered.length === 0) return null;

        return (
          <div key={client}>
            <h3 className="text-sm font-semibold text-gray-300 mb-2">{client}</h3>
            <ul className="divide-y divide-gray-700 rounded-md border border-gray-700">
              {filtered.map(p => (
                <li key={p.id} className="p-3 flex items-center justify-between">
                  <div>
                    <div className="text-gray-100">{p.name}</div>
                    <div className="text-xs text-gray-400">
                      {p.subPlants.length} subusina(s) · {p.stringCount} strings · {p.trackerCount} trackers
                    </div>
                  </div>
                  <button
                    onClick={() => onEdit(p)}
                    className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded"
                  >
                    Editar
                  </button>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
};

export default PlantList;