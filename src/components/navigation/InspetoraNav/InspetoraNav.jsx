import React from 'react';
import { Link } from 'react-router-dom'; // Importante para navegação sem recarregar tudo
import './InspetoraNav.css';

const InspetoraNav = ({ isOpen, usuario, dataSelecionada, onLogout, onCloseMenu }) => {
  const menuClasses = isOpen ? 'menu-lateral aberto' : 'menu-lateral';

  // Lista de rotas baseada no que você enviou
  const menuItems = [
    // Mantive o Início fixo pois é importante para voltar
    { texto: 'Início', icone: 'bi bi-house-door-fill', rota: '/' },
    { texto: 'Nova Contagem', icone: 'bi bi-plus-circle-fill', rota: '/nova-contagem' },
    { texto: 'Chat', icone: 'bi bi-chat-dots-fill', rota: '/inspetora/chat' },
    { texto: 'Cardápio', icone: 'bi bi-journal-text', rota: '/cardapio' },
    { texto: 'Autorizados Direção', icone: 'bi bi-file-earmark-check-fill', rota: '/inspetora/autorizados' },
    { texto: 'Meu Perfil', icone: 'bi bi-person-circle', rota: '/inspetora/perfil' },
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
            {/* O Link evita que a página pisque (white screen) ao navegar */}
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

export default InspetoraNav;