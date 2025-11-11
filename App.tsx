// File: App.tsx
// Este é o componente raiz que estrutura toda a aplicação, gerenciando os provedores de contexto e o roteamento inicial (Login vs. Dashboard).

import React, { useState } from 'react';
// Importa os provedores de contexto que gerenciam o estado global da aplicação.
import { DataProvider } from './contexts/DataContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
// Importa os componentes de tela principais.
import Login from './components/Login';
import Dashboard from './components/Dashboard';

/**
 * AppContent é um componente interno que decide qual tela renderizar.
 * Ele usa o hook `useAuth` para verificar se há um usuário logado.
 */
const AppContent: React.FC = () => {
    // Acessa o estado de autenticação.
    const { user } = useAuth();

    // Se não houver usuário logado, exibe a tela de login.
    if (!user) {
        return <Login />;
    }

    // Se houver um usuário logado, exibe o painel principal (Dashboard).
    return <Dashboard />;
};

/**
 * O componente App principal envolve a aplicação com os provedores de contexto necessários.
 * A ordem dos provedores é crucial.
 */
const App: React.FC = () => {
  // A ordem dos provedores foi invertida. DataProvider agora envolve AuthProvider.
  // Isso corrige o erro, pois AuthProvider (que chama useData) agora é um filho de DataProvider e pode acessar os dados necessários.
  return (
    // DataProvider: Fornece todos os dados da aplicação (usuários, usinas, OSs).
    <DataProvider>
        {/* AuthProvider: Gerencia o estado de login/logout do usuário. Ele precisa estar dentro do DataProvider para poder consultar a lista de usuários. */}
        <AuthProvider>
            {/* Div principal que define o tema de cores da aplicação. */}
            <div className="min-h-screen text-gray-800 dark:text-gray-200">
                {/* Renderiza o conteúdo da aplicação, que será ou Login ou Dashboard. */}
                <AppContent />
            </div>
        </AuthProvider>
    </DataProvider>
  );
};

export default App;
