// File: components/modals/Modal.tsx
// Este é um componente de Modal genérico e reutilizável que serve como base para todos os outros modais da aplicação.

import React, { ReactNode } from 'react';

// Define as propriedades que o componente Modal espera receber.
interface ModalProps {
    isOpen: boolean; // Controla se o modal está visível ou não.
    onClose: () => void; // Função a ser chamada para fechar o modal.
    title: string; // O título exibido no cabeçalho do modal.
    children: ReactNode; // O conteúdo principal do modal.
    footer?: ReactNode; // Conteúdo opcional para o rodapé (geralmente botões de ação).
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer }) => {
    // Se `isOpen` for falso, o componente não renderiza nada.
    if (!isOpen) return null;

    // A estrutura do modal consiste em um overlay (fundo escuro) e o painel do modal em si.
    return (
        <div 
            // Overlay que cobre a tela inteira.
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center"
            // Clicar no overlay chama a função `onClose` para fechar o modal.
            onClick={onClose}
        >
            <div 
                // Painel do modal.
                className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col"
                // `e.stopPropagation()` impede que o clique dentro do modal se propague para o overlay, evitando que ele feche acidentalmente.
                onClick={e => e.stopPropagation()}
            >
                {/* Cabeçalho do modal com título e botão de fechar. */}
                <header className="flex items-center justify-between p-4 border-b dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
                    <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
                    </button>
                </header>
                {/* Corpo principal do modal, com rolagem automática se o conteúdo for muito grande. */}
                <main className="p-6 overflow-y-auto">
                    {children}
                </main>
                {/* Rodapé opcional, renderizado apenas se a prop `footer` for fornecida. */}
                {footer && (
                    <footer className="flex justify-end p-4 border-t dark:border-gray-700">
                        {footer}
                    </footer>
                )}
            </div>
        </div>
    );
};

export default Modal;
