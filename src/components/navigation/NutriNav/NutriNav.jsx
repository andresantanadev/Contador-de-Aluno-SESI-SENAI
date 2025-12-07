import React from 'react';
import { Link } from 'react-router-dom';
import '../InspetoraNav/InspetoraNav.css'; // Usando o mesmo CSS para manter padrão

const NutriNav = ({ isOpen, usuario, dataSelecionada, onLogout, onCloseMenu }) => {
  const menuClasses = isOpen ? 'menu-lateral aberto' : 'menu-lateral';

  // Lista de itens atualizada conforme sua solicitação
  const menuItems = [
    // Botão Início (Adicionado manualmente para garantir navegação à home)
    { texto: 'Início', icone: 'bi bi-house-door-fill', rota: '/' },
    
    // Itens da lista fornecida
    { texto: 'Controle de Produção', icone: 'bi bi-graph-up', rota: '/nutri/controle-producao' },
    { texto: 'Contagem Geral', icone: 'bi bi-calendar-check', rota: '/nutri/relatorio-geral' },
    { texto: 'Turmas e Categorias', icone: 'bi bi-people-fill', rota: '/nutri/gerenciar/categorias' },
    { texto: 'Cardápio', icone: 'bi bi-journal-richtext', rota: '/nutri/cardapios' },
    { texto: 'Chat', icone: 'bi bi-chat-dots-fill', rota: '/nutri/chat' },
    { texto: 'Gerenciar Usuários', icone: 'bi bi-person-video2', rota: '/nutri/gerenciar/usuarios' },
    { texto: 'Cronograma', icone: 'bi bi-calendar-week-fill', rota: '/nutri/cronograma' },
    { texto: 'Autorizados Direção', icone: 'bi bi-file-earmark-check-fill', rota: '/nutri/autorizados' },
    { texto: 'Necessidades', icone: 'bi bi-card-checklist', rota: '/nutri/planejamento' },
    { texto: 'Meu Perfil', icone: 'bi bi-person-circle', rota: '/nutri/perfil' },
  ];

  return (
    <div className={menuClasses}>
      <div className="nome-usuario-container">
        <span>{usuario}</span>
      </div>
      <hr />
      <div className="nome-usuario-container">
        <small style={{ fontSize: '0.8rem', opacity: 0.8 }}></small><br/>
        <span>{dataSelecionada}</span>
      </div>
      <hr />
      
      <ul className="opcoes">
        {menuItems.map((item, index) => (
          <li key={index} onClick={onCloseMenu}>
            <Link to={item.rota}>
              <i className={item.icone}></i>
              &nbsp;&nbsp;{item.texto}
            </Link>
          </li>
        ))}
      </ul>

      {/* Botão de Sair */}
      <div className="sair" onClick={onLogout}>
        <i className="bi bi-box-arrow-right"></i>&nbsp;&nbsp;Sair
      </div>
    </div>
  );
};

export default NutriNav;