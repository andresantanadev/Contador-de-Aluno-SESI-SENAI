import React from 'react';
import { Link } from 'react-router-dom';
import '../InspetoraNav/InspetoraNav.css'; // Reaproveitando o CSS padrão

const DiretoraNav = ({ isOpen, usuario, dataSelecionada, onLogout, onCloseMenu }) => {
  const menuClasses = isOpen ? 'menu-lateral aberto' : 'menu-lateral';

  const menuItems = [
    // Botão Início (Adicionado para garantir o retorno à Home)
    { texto: 'Início', icone: 'bi bi-house-door-fill', rota: '/' },
    
    // Itens específicos da Diretora
    { texto: 'Controle de Produção', icone: 'bi bi-graph-up', rota: '/diretora/controle-producao' },
    { texto: 'Contagem Geral', icone: 'bi bi-calendar-check', rota: '/diretora/relatorio-geral' },
    { texto: 'Turmas e Categorias', icone: 'bi bi-people-fill', rota: '/diretora/gerenciar/categorias' },
    { texto: 'Cardápio', icone: 'bi bi-journal-richtext', rota: '/diretora/cardapios' },
    { texto: 'Chat', icone: 'bi bi-chat-dots-fill', rota: '/diretora/chat' },
    { texto: 'Gerenciar Usuários', icone: 'bi bi-person-video2', rota: '/diretora/gerenciar/usuarios' },
    { texto: 'Cronograma', icone: 'bi bi-calendar-week-fill', rota: '/diretora/cronograma' },
    { texto: 'Autorizados Direção', icone: 'bi bi-file-earmark-check-fill', rota: '/diretora/autorizados' },
    { texto: 'Necessidades', icone: 'bi bi-card-checklist', rota: '/diretora/planejamento' },
    { texto: 'Meu Perfil', icone: 'bi bi-person-circle', rota: '/diretora/perfil' },
  ];

  return (
    <div className={menuClasses}>
      <div className="nome-usuario-container">
        <span>{usuario}</span>
      </div>
      <hr />
      <div className="nome-usuario-container">
        <small style={{ fontSize: '0.8rem', opacity: 0.8 }}>Data de Hoje:</small><br/>
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

      <div className="sair" onClick={onLogout}>
        <i className="bi bi-box-arrow-right"></i>&nbsp;&nbsp;Sair
      </div>
    </div>
  );
};

export default DiretoraNav;