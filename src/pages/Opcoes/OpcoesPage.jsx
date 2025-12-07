import React from 'react';
import { useNavigate } from 'react-router-dom';
import './OpcoesPage.css'; // Importa o estilo renomeado

const botoesGerenciamento = [
  { texto: 'Turmas e Categorias', icone: 'bi bi-people-fill', rota: '/nutri/gerenciar/categorias' },
  { texto: 'Gerenciar Usuários', icone: 'bi bi-person-video2', rota: '/nutri/gerenciar/usuarios' },
  {texto: 'Necessidades', icone: 'bi bi-card-checklist', rota: '/nutri/planejamento' },
];

const OpcoesPage = () => {
  const navigate = useNavigate();

  return (
    <section className="opcoes-container">
      <div className="management-buttons-section">
        <h1 className="management-title">Gerenciamento</h1> {/* Título Atualizado */}
        {botoesGerenciamento.map((botao, index) => (
          <button 
            key={index} 
            className="management-button" 
            onClick={() => navigate(botao.rota)}
          >
            <i className={botao.icone}></i>
            <span>{botao.texto}</span>
          </button>
        ))}
      </div>
    </section>
  );
};

export default OpcoesPage;