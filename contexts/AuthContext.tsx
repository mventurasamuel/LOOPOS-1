// File: contexts/AuthContext.tsx
// Este arquivo gerencia o estado de autenticação do usuário em toda a aplicação.

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User } from '../types';
// Importa o hook `useData` para acessar a lista de usuários para validação do login.
import { useData } from './DataContext';

// Define a estrutura do objeto que será exposto pelo contexto de autenticação.
interface AuthContextType {
    user: User | null; // O objeto do usuário logado ou nulo se ninguém estiver logado.
    login: (email: string, pass: string) => boolean; // Função para tentar fazer login.
    logout: () => void; // Função para fazer logout.
}

// Cria o contexto React com o tipo definido acima.
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * AuthProvider é o componente que envolve a aplicação (ou partes dela)
 * e fornece o estado de autenticação para todos os seus filhos.
 */
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Estado para armazenar os dados do usuário logado.
    const [user, setUser] = useState<User | null>(null);
    // Acessa a lista de todos os usuários do DataContext.
    const { users } = useData();

    // `useEffect` é usado para verificar se há um usuário logado no localStorage quando a aplicação carrega pela primeira vez.
    // Isso permite que a sessão do usuário persista mesmo após recarregar a página.
    useEffect(() => {
        const storedUser = localStorage.getItem('authUser');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []); // O array vazio `[]` garante que este efeito rode apenas uma vez, na montagem do componente.

    // Função de login que verifica as credenciais contra a lista de usuários.
    const login = (email: string, pass: string): boolean => {
        // Procura um usuário que corresponda ao email e senha fornecidos.
        const foundUser = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === pass);
        if (foundUser) {
            // Se o usuário for encontrado, cria uma cópia sem a senha para armazenar com segurança.
            const userToStore = { ...foundUser };
            delete userToStore.password; 
            // Atualiza o estado da aplicação com o usuário logado.
            setUser(userToStore);
            // Armazena os dados do usuário no localStorage para persistir a sessão.
            localStorage.setItem('authUser', JSON.stringify(userToStore));
            return true; // Retorna true para indicar sucesso no login.
        }
        return false; // Retorna false se as credenciais forem inválidas.
    };

    // Função de logout que limpa o estado do usuário.
    const logout = () => {
        // Remove o usuário do estado da aplicação.
        setUser(null);
        // Remove os dados do usuário do localStorage, encerrando a sessão.
        localStorage.removeItem('authUser');
    };

    // Fornece o estado `user` e as funções `login` e `logout` para os componentes filhos.
    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

/**
 * useAuth é um hook customizado que simplifica o uso do AuthContext.
 * Em vez de usar `useContext(AuthContext)` em cada componente, basta chamar `useAuth()`.
 */
export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    // Garante que o hook seja usado dentro de um AuthProvider.
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
