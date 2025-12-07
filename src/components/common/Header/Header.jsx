import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Header.css';

import setas from '../../../assets/img/setas.png';
import setas2 from '../../../assets/img/setas2.png'; // Nova imagem
import logo from '../../../assets/img/menu.png';

const Header = ({ onMenuClick, onLogoClick, userRole, isMenuOpen }) => {
    const navigate = useNavigate();
    const location = useLocation();

    // O botão de voltar só aparece se não estivermos na página inicial (dashboard)
    const showBackButton = location.pathname !== '/dashboard';
    const iconeClasses = `bi bi-list ${isMenuOpen ? 'girar' : ''}`;

    return (
        <header className="header">
            {/* Seção Esquerda (Vermelha) */}
            <div className="header-section header-left">
                {showBackButton && (
                    <button className="header-back-button" onClick={() => navigate(-1)} title="Voltar">
                        <i className="bi bi-arrow-left"></i>
                    </button>
                )}
            </div>

            {/* Seção Central (Branca com Logos) */}
            <div className="header-section header-center">
                <img src={setas} alt="Setas" className="setas-flanco" />
                <img 
                    src={logo} 
                    alt="Logo" 
                    className="logo-principal" 
                    style={{ cursor: 'pointer' }} 
                    onClick={onLogoClick} 
                />
                <img src={setas2} alt="Setas 2" className="setas-flanco" />
            </div>

            {/* Seção Direita (Vermelha) */}
            <div className="header-section header-right">
                {userRole === 'inspetora' && (
                    <div className="notificacao">
                        <span id="notificacao-badge" style={{ display: 'none' }}></span>
                    </div>
                )}
                <button className="menu-hamburguer" onClick={onMenuClick}>
                    <i id="iconeMenu" className={iconeClasses}></i>
                </button>
            </div>
        </header>
    );
};

export default Header;