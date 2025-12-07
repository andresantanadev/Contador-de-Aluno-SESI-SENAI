import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Swal from 'sweetalert2/dist/sweetalert2.all.min.js';
import { logoutUser, getUserData } from '../../services/api';

import Header from '../../components/common/Header/Header';
import Footer from '../../components/common/Footer/Footer';

// --- IMPORTS DOS NAVS ---
import InspetoraNav from '../../components/navigation/InspetoraNav/InspetoraNav';
import NutriNav from '../../components/navigation/NutriNav/NutriNav';
import DiretoraNav from '../../components/navigation/DiretoraNav/DiretoraNav'; // <--- 1. IMPORT NOVO

import './MainLayout.css';
import background from '../../assets/img/main.jpg';

const MainLayout = ({ userRole, children }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [usuario, setUsuario] = useState('Carregando...');
    const [dataAtual, setDataAtual] = useState('');

    const location = useLocation();   
    const isChatPage = location.pathname.includes('chat'); 

    const navigate = useNavigate();
    const navRef = useRef(null);

    // Função que REALMENTE faz o logout
    const handleFinalLogout = async (showSuccess = true) => {
        try {
            await logoutUser();
            if (showSuccess) {
                // Opcional: alerta de sucesso
            }
        } catch (error) {
            console.error("Erro na API de logout, mas deslogando localmente.", error);
        } finally {
            localStorage.clear();
            navigate('/');
        }
    };

    // Efeito para buscar dados do usuário e data
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const data = await getUserData();
                setUsuario(data.name);
            } catch (error) {
                console.error("Não foi possível buscar os dados do usuário. Forçando logout.", error);
                handleFinalLogout(false); 
            }

            const hoje = new Date();
            const dataFormatada = hoje.toLocaleDateString('pt-BR');
            setDataAtual(dataFormatada);
        };

        fetchInitialData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.pathname]); 

    // Efeito para fechar o menu ao clicar fora
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isMenuOpen && navRef.current && !navRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
        };
        if (isMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isMenuOpen]);

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
    const closeMenu = () => setIsMenuOpen(false);

    const confirmLogout = () => {
        setIsMenuOpen(false);
        Swal.fire({
            title: 'Você tem certeza?',
            text: "Você será desconectado do sistema.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#8B0000',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Sim, quero sair!',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                handleFinalLogout();
            }
        });
    };

    return (
        <div className="app-container">
            <Header 
                onMenuClick={toggleMenu} 
                userRole={userRole}
                isMenuOpen={isMenuOpen}
            />
            
            {/* --- 2. ÁREA DOS MENUS ATUALIZADA --- */}
            <div ref={navRef}>
                {userRole === 'inspetora' && (
                    <InspetoraNav
                        isOpen={isMenuOpen}
                        usuario={usuario}
                        dataSelecionada={dataAtual}
                        onLogout={confirmLogout}
                        onCloseMenu={closeMenu}
                    />
                )}

                {userRole === 'nutri' && (
                    <NutriNav
                        isOpen={isMenuOpen}
                        usuario={usuario}
                        dataSelecionada={dataAtual}
                        onLogout={confirmLogout}
                        onCloseMenu={closeMenu}
                    />
                )}

                {userRole === 'diretora' && (
                    <DiretoraNav
                        isOpen={isMenuOpen}
                        usuario={usuario}
                        dataSelecionada={dataAtual}
                        onLogout={confirmLogout}
                        onCloseMenu={closeMenu}
                    />
                )}
            </div>

            <main 
                className="main-content" 
                style={{ backgroundImage: `url(${background})` }}
                key={location.pathname} 
            >
                {children}
            </main>

            {!isChatPage && <Footer />}
        </div>
        
    );
};

export default MainLayout;