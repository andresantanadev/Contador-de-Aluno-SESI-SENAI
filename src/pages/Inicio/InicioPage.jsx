import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './InicioPage.css';

const InicioPage = ({ userRole }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Sempre que a URL mudar para /inicio --> RECARREGA a página.
  useEffect(() => {
    if (location.pathname === "/inicio") {
      window.location.reload();
    }
  }, [location.pathname]);

  const botoesConfig = {
    inspetora: [
      { texto: 'Nova Contagem', icone: 'bi bi-plus-circle-fill', rota: '/nova-contagem' },
      { texto: 'Chat', icone: 'bi bi-chat-dots-fill', rota: '/inspetora/chat' },
      { texto: 'Cardápio', icone: 'bi bi-journal-text', rota: '/cardapio' },
      { texto: 'Autorizados Direção', icone: 'bi bi-file-earmark-check-fill', rota: '/inspetora/autorizados' },
      { texto: 'Meu Perfil', icone: 'bi bi-person-circle', rota: '/inspetora/perfil', color: '#343a40' },
    ],

    nutri: [
      { texto: 'Controle de Produção', icone: 'bi bi-graph-up', rota: '/nutri/controle-producao' },
      { texto: 'Contagem Geral', icone: 'bi bi-calendar-check', rota: '/nutri/relatorio-geral' },
      { texto: 'Turmas e Categorias', icone: 'bi bi-people-fill', rota: '/nutri/gerenciar/categorias' },
      { texto: 'Cardápio', icone: 'bi bi-journal-richtext', rota: '/nutri/cardapios' },
      { texto: 'Chat', icone: 'bi bi-chat-dots-fill', rota: '/nutri/chat' },
      { texto: 'Gerenciar Usuários', icone: 'bi bi-person-video2', rota: '/nutri/gerenciar/usuarios' },
      { texto: 'Cronograma', icone: 'bi bi-calendar-week-fill', rota: '/nutri/cronograma' },
      { texto: 'Autorizados Direção', icone: 'bi bi-file-earmark-check-fill', rota: '/nutri/autorizados' },
      { texto: 'Necessidades', icone: 'bi bi-card-checklist', rota: '/nutri/planejamento' },
      { texto: 'Meu Perfil', icone: 'bi bi-person-circle', rota: '/nutri/perfil', color: '#343a40' },
    ],

    diretora: [
      { texto: 'Controle de Produção', icone: 'bi bi-graph-up', rota: '/diretora/controle-producao' },
      { texto: 'Contagem Geral', icone: 'bi bi-calendar-check', rota: '/diretora/relatorio-geral' },
      { texto: 'Turmas e Categorias', icone: 'bi bi-people-fill', rota: '/diretora/gerenciar/categorias' },
      { texto: 'Cardápio', icone: 'bi bi-journal-richtext', rota: '/diretora/cardapios' },
      { texto: 'Chat', icone: 'bi bi-chat-dots-fill', rota: '/diretora/chat' },
      { texto: 'Gerenciar Usuários', icone: 'bi bi-person-video2', rota: '/diretora/gerenciar/usuarios' },
      { texto: 'Cronograma', icone: 'bi bi-calendar-week-fill', rota: '/diretora/cronograma' },
      { texto: 'Autorizados Direção', icone: 'bi bi-file-earmark-check-fill', rota: '/diretora/autorizados' },
      { texto: 'Necessidades', icone: 'bi bi-card-checklist', rota: '/diretora/planejamento' },
      { texto: 'Meu Perfil', icone: 'bi bi-person-circle', rota: '/diretora/perfil', color: '#343a40' },
    ],
  };

  const botoes = botoesConfig[userRole] || [];
  const gridClass = (userRole === 'nutri' || userRole === 'diretora') ? 'wide-grid' : '';

  return (
    <section className="inicio-container">
      <div className={`buttons-section ${gridClass}`}>
        {botoes.map((botao, index) => (
          <button
            key={index}
            className="main-button"
            onClick={() => navigate(botao.rota)}
            style={botao.color ? { backgroundColor: botao.color } : {}}
          >
            <i className={botao.icone}></i> {botao.texto}
          </button>
        ))}
      </div>
    </section>
  );
};

export default InicioPage;
