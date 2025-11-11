// File: index.tsx
// Este é o ponto de entrada principal da aplicação React.

// Importa as bibliotecas React e ReactDOM necessárias para renderizar a aplicação.
import React from 'react';
import ReactDOM from 'react-dom/client';
// Importa o componente principal da aplicação.
import App from './App';

// Procura pelo elemento HTML com o id 'root'. Este é o contêiner onde toda a aplicação será renderizada.
const rootElement = document.getElementById('root');
// Lança um erro se o elemento 'root' não for encontrado, pois a aplicação não teria onde ser montada.
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Cria uma "raiz" de renderização do React no elemento encontrado.
const root = ReactDOM.createRoot(rootElement);
// Renderiza o componente 'App' dentro da raiz, iniciando a aplicação.
root.render(
    <App />
);
