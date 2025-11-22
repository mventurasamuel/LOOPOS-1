// File: components/Schedule52Weeks.tsx
// Componente para exibir um cronograma de 52 semanas (1 ano)
// Mostra as OSs distribuídas ao longo das semanas do ano

import React, { useMemo } from 'react';
import { OS } from '../types';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';

interface Schedule52WeeksProps {
  osList: OS[];
  onCardClick: (os: OS) => void;
}

const Schedule52Weeks: React.FC<Schedule52WeeksProps> = ({ osList, onCardClick }) => {
  const { filterOSForUser } = useData();
  const { user } = useAuth();
  const visibleOS = user ? filterOSForUser(user) : osList;

  // Gera as 52 semanas do ano atual
  const weeks = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const weeksArray = [];
    const startDate = new Date(currentYear, 0, 1); // 1º de janeiro
    
    // Ajusta para o primeiro domingo do ano (ou segunda-feira se preferir)
    const firstDay = startDate.getDay();
    const daysToSubtract = firstDay === 0 ? 0 : firstDay;
    startDate.setDate(startDate.getDate() - daysToSubtract);
    
    for (let i = 0; i < 52; i++) {
      const weekStart = new Date(startDate);
      weekStart.setDate(weekStart.getDate() + (i * 7));
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      weeksArray.push({
        weekNumber: i + 1,
        startDate: new Date(weekStart),
        endDate: new Date(weekEnd),
      });
    }
    
    return weeksArray;
  }, []);

  // Agrupa OSs por semana baseado na data de início
  const osByWeek = useMemo(() => {
    const grouped: Record<number, OS[]> = {};
    
    visibleOS.forEach(os => {
      if (os.startDate) {
        const osDate = new Date(os.startDate);
        const weekIndex = weeks.findIndex(week => 
          osDate >= week.startDate && osDate <= week.endDate
        );
        
        if (weekIndex !== -1) {
          const weekNum = weeks[weekIndex].weekNumber;
          if (!grouped[weekNum]) {
            grouped[weekNum] = [];
          }
          grouped[weekNum].push(os);
        }
      }
    });
    
    return grouped;
  }, [visibleOS, weeks]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Urgente':
        return 'bg-red-500';
      case 'Alta':
        return 'bg-orange-500';
      case 'Média':
        return 'bg-yellow-500';
      case 'Baixa':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="h-full overflow-auto p-6 bg-gray-50 dark:bg-gray-900">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
          Cronograma de 52 Semanas
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Visualização anual das Ordens de Serviço organizadas por semana
        </p>
      </div>

      <div className="space-y-4">
        {/* Grid de semanas com OSs - 13 semanas por linha (4 linhas) */}
        <div 
          className="grid gap-2"
          style={{ gridTemplateColumns: 'repeat(13, minmax(0, 1fr))' }}
        >
          {weeks.map(week => {
            const osInWeek = osByWeek[week.weekNumber] || [];
            
            return (
              <div
                key={week.weekNumber}
                className="min-h-[200px] bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-2 space-y-1"
              >
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-2 text-center">
                  {formatDate(week.startDate)} - {formatDate(week.endDate)}
                </div>
                
                {osInWeek.length > 0 ? (
                  <div className="space-y-1">
                    {osInWeek.map(os => (
                      <div
                        key={os.id}
                        onClick={() => onCardClick(os)}
                        className={`p-2 rounded text-xs cursor-pointer hover:opacity-80 transition-opacity ${getPriorityColor(os.priority)} text-white`}
                        title={`${os.title} - ${os.priority}`}
                      >
                        <div className="font-semibold truncate">{os.id}</div>
                        <div className="truncate text-xs opacity-90">{os.title}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-gray-400 dark:text-gray-600 text-center mt-4">
                    Sem OSs
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Schedule52Weeks;

