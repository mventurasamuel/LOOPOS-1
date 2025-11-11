// File: components/Login.tsx
// Este componente renderiza a página de login da aplicação.

import React, { useState } from 'react';
// Importa o hook `useAuth` para acessar a função de login.
import { useAuth } from '../contexts/AuthContext';

const Login: React.FC = () => {
    // Estados para armazenar o email e a senha digitados pelo usuário.
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    // Estado para armazenar mensagens de erro (ex: "Credenciais inválidas").
    const [error, setError] = useState('');
    // Acessa a função `login` do contexto de autenticação.
    const { login } = useAuth();

    // Função chamada quando o formulário é enviado.
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault(); // Previne o recarregamento da página.
        setError(''); // Limpa erros anteriores.

        // Tenta fazer o login com as credenciais fornecidas.
        // Se a função `login` retornar `false`, significa que as credenciais são inválidas.
        if (!login(email, password)) {
            setError('Credenciais inválidas. Tente novamente.');
        }
        // Se o login for bem-sucedido, o `AuthProvider` atualizará o estado e o `App.tsx` renderizará o Dashboard.
    };

    // JSX que define a estrutura da tela de login.
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-800">
            <div className="max-w-md w-full bg-white dark:bg-gray-900 shadow-lg rounded-xl p-8 space-y-8">
                {/* Cabeçalho do formulário */}
                <div className="text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-auto text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
                        Acessar Sistema de OS
                    </h2>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        Bem-vindo de volta!
                    </p>
                </div>
                {/* Formulário de login */}
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="rounded-md shadow-sm -space-y-px">
                        {/* Campo de Email */}
                        <div>
                            <label htmlFor="email-address" className="sr-only">Email</label>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 text-gray-900 dark:text-white dark:bg-gray-700 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        {/* Campo de Senha */}
                        <div>
                            <label htmlFor="password" className="sr-only">Senha</label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 text-gray-900 dark:text-white dark:bg-gray-700 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                placeholder="Senha"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>
                    {/* Exibição de mensagem de erro, se houver */}
                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                    {/* Botão de Envio */}
                    <div>
                        <button
                            type="submit"
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Entrar
                        </button>
                    </div>
                     {/* Dicas de login para facilitar testes */}
                     <div className="text-center text-xs text-gray-500 dark:text-gray-400">
                        <p>Admin: admin@admin.com / admin</p>
                        <p>Técnico: carlos@technician.com / 123</p>
                        <p>Supervisor: maria@supervisor.com / 123</p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;
