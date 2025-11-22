// File: components/Calendar.tsx
// Componente para exibir um calendário mensal com as OSs distribuídas por data

import React, { useState, useMemo } from 'react';
import { OS } from '../types';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';

interface CalendarProps {
  osList: OS[];
  onCardClick: (os: OS) => void;
}

const Calendar: React.FC<CalendarProps> = ({ osList, onCardClick }) => {
  const { filterOSForUser } = useData();
  const { user } = useAuth();
  const visibleOS = user ? filterOSForUser(user) : osList;

  const [currentDate, setCurrentDate] = useState(new Date());

  // Nomes dos meses e dias da semana em português
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  // Calcula os dias do mês atual
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Dias do mês anterior (para preencher a primeira semana)
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        isCurrentMonth: false,
        dayNumber: prevMonthLastDay - i,
      });
    }

    // Dias do mês atual
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({
        date: new Date(year, month, day),
        isCurrentMonth: true,
        dayNumber: day,
      });
    }

    // Dias do próximo mês (para completar a última semana)
    const remainingDays = 42 - days.length; // 6 semanas * 7 dias
    for (let day = 1; day <= remainingDays; day++) {
      days.push({
        date: new Date(year, month + 1, day),
        isCurrentMonth: false,
        dayNumber: day,
      });
    }

    return days;
  }, [currentDate]);

  // Agrupa OSs por data
  const osByDate = useMemo(() => {
    const grouped: Record<string, OS[]> = {};
    
    visibleOS.forEach(os => {
      if (os.startDate) {
        const osDate = new Date(os.startDate);
        const dateKey = `${osDate.getFullYear()}-${osDate.getMonth()}-${osDate.getDate()}`;
        
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(os);
      }
    });
    
    return grouped;
  }, [visibleOS]);

  const getOSsForDate = (date: Date): OS[] => {
    const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    return osByDate[dateKey] || [];
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

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  return (
    <div className="h-full overflow-auto p-6 bg-gray-50 dark:bg-gray-900">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
            Calendário
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={goToPreviousMonth}
              className="px-3 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              ‹
            </button>
            <button
              onClick={goToToday}
              className="px-4 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Hoje
            </button>
            <button
              onClick={goToNextMonth}
              className="px-3 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              ›
            </button>
          </div>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        {/* Cabeçalho com dias da semana */}
        <div className="grid grid-cols-7 border-b border-gray-300 dark:border-gray-700">
          {dayNames.map(day => (
            <div
              key={day}
              className="p-3 text-center font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Grid de dias */}
        <div className="grid grid-cols-7">
          {calendarDays.map((dayData, index) => {
            const osListForDay = getOSsForDate(dayData.date);
            const isToday =
              dayData.date.toDateString() === new Date().toDateString() &&
              dayData.isCurrentMonth;

            return (
              <div
                key={index}
                className={`min-h-[120px] border border-gray-200 dark:border-gray-700 p-2 ${
                  dayData.isCurrentMonth
                    ? 'bg-white dark:bg-gray-800'
                    : 'bg-gray-50 dark:bg-gray-900 opacity-50'
                } ${isToday ? 'ring-2 ring-blue-500' : ''}`}
              >
                <div
                  className={`text-sm font-semibold mb-1 ${
                    isToday
                      ? 'text-blue-600 dark:text-blue-400'
                      : dayData.isCurrentMonth
                      ? 'text-gray-800 dark:text-gray-200'
                      : 'text-gray-400 dark:text-gray-600'
                  }`}
                >
                  {dayData.dayNumber}
                </div>

                <div className="space-y-1">
                  {osListForDay.slice(0, 3).map(os => (
                    <div
                      key={os.id}
                      onClick={() => onCardClick(os)}
                      className={`p-1 rounded text-xs cursor-pointer hover:opacity-80 transition-opacity ${getPriorityColor(
                        os.priority
                      )} text-white truncate`}
                      title={`${os.title} - ${os.priority}`}
                    >
                      {os.id}
                    </div>
                  ))}
                  {osListForDay.length > 3 && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      +{osListForDay.length - 3} mais
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legenda */}
      <div className="mt-6 flex flex-wrap gap-4 items-center">
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Legenda:
        </span>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          <span className="text-xs text-gray-600 dark:text-gray-400">Urgente</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-orange-500 rounded"></div>
          <span className="text-xs text-gray-600 dark:text-gray-400">Alta</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-500 rounded"></div>
          <span className="text-xs text-gray-600 dark:text-gray-400">Média</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span className="text-xs text-gray-600 dark:text-gray-400">Baixa</span>
        </div>
      </div>
    </div>
  );
};

export default Calendar;

