import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Importações
import LoginPage from './pages/Login/LoginPage';
import MainLayout from './layouts/MainLayout/MainLayout';
import InicioPage from './pages/Inicio/InicioPage';
import DashboardNutri from './pages/DashboardNutri/DashboardNutri';
import ControleProducaoPage from './pages/ControleProducao/ControleProducaoPage';
import OpcoesPage from './pages/Opcoes/OpcoesPage';
import CategoriasPage from './pages/GerenciarCategorias/CategoriasPage';
import TurmasPage from './pages/GerenciarTurmas/TurmasPage';
import UsuariosPage from './pages/GerenciarUsuarios/UsuariosPage';
import NecessidadesPage from './pages/GerenciarNecessidades/NecessidadesPage';
import AlunosPage from './pages/GerenciarAlunos/AlunosPage';
import CronogramaPage from './pages/Cronograma/CronogramaPage';
import PlanejamentoPage from './pages/Planejamento/PlanejamentoPage';
import NaiPage from './pages/GerenciarNai/NaiPage';
import ContagemPage from './pages/Inspetora/ContagemPage';
import ContagemGeralPage from './pages/ContagemGeral/ContagemGeralPage';
import ProfilePage from './pages/ProfilePage/ProfilePage';
import ViewCardapioPage from './pages/Inspetora/ViewCardapioPage';
import CardapiosPage from './pages/Cardapios/CardapiosPage';
import AutorizadosPage from './pages/Autorizados/AutorizadosPage';
import ChatPage from './pages/Chat/ChatPage';

const roleMap = { '1': 'inspetora', '2': 'nutri', '3': 'diretora' };

const PrivateRoute = ({ children, requiredRole }) => {
  const token = localStorage.getItem('authToken');
  const userLevel = localStorage.getItem('userLevel');
  const userRole = roleMap[userLevel];
  
  if (!token || userRole !== requiredRole) {
    return <Navigate to="/" />;
  }
  return children;
};

const PublicRoute = ({ children }) => {
  const token = localStorage.getItem('authToken');
  const userLevel = localStorage.getItem('userLevel');
  if (token && userLevel) {
    const redirectMap = { 
      '1': '/inspetora/inicio',
      '2': '/nutri/dashboard',
      '3': '/diretora/inicio',
    };
    const redirectTo = redirectMap[userLevel] || '/';
    return <Navigate to={redirectTo} />;
  }
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* ROTA PÚBLICA */}
        <Route path="/" element={ <PublicRoute><LoginPage /></PublicRoute> } />
        
        {/* ================== ROTAS DA INSPETORA ================== */}
        <Route path="/inspetora/inicio" element={ <PrivateRoute requiredRole="inspetora"><MainLayout userRole="inspetora"><InicioPage userRole="inspetora" /></MainLayout></PrivateRoute> } />
        <Route path="/nova-contagem" element={ <PrivateRoute requiredRole="inspetora"><MainLayout userRole="inspetora"><ContagemPage /></MainLayout></PrivateRoute> } />
        <Route path="/cardapio" element={ <PrivateRoute requiredRole="inspetora"><MainLayout userRole="inspetora"><ViewCardapioPage /></MainLayout></PrivateRoute> } />
        <Route path="/inspetora/autorizados" element={ <PrivateRoute requiredRole="inspetora"><MainLayout userRole="inspetora"><AutorizadosPage /></MainLayout></PrivateRoute> } />
        <Route path="/inspetora/perfil" element={ <PrivateRoute requiredRole="inspetora"><MainLayout userRole="inspetora"><ProfilePage /></MainLayout></PrivateRoute> } />
        <Route path="/inspetora/chat" element={ <PrivateRoute requiredRole="inspetora"><MainLayout userRole="inspetora"><ChatPage /></MainLayout></PrivateRoute> } />
        
        {/* ================== ROTAS DA NUTRICIONISTA ================== */}
        <Route path="/nutri/dashboard" element={ <PrivateRoute requiredRole="nutri"><MainLayout userRole="nutri"><DashboardNutri /></MainLayout></PrivateRoute> } />
        <Route path="/nutri/relatorio-geral" element={ <PrivateRoute requiredRole="nutri"><MainLayout userRole="nutri"><ContagemGeralPage /></MainLayout></PrivateRoute> } />
        <Route path="/nutri/inicio" element={ <PrivateRoute requiredRole="nutri"><MainLayout userRole="nutri"><InicioPage userRole="nutri" /></MainLayout></PrivateRoute> } />
        <Route path="/nutri/controle-producao" element={ <PrivateRoute requiredRole="nutri"><MainLayout userRole="nutri"><ControleProducaoPage /></MainLayout></PrivateRoute> } />
        <Route path="/nutri/gerenciar" element={ <PrivateRoute requiredRole="nutri"><MainLayout userRole="nutri"><OpcoesPage /></MainLayout></PrivateRoute> } />
        <Route path="/nutri/gerenciar/categorias" element={ <PrivateRoute requiredRole="nutri"><MainLayout userRole="nutri"><CategoriasPage /></MainLayout></PrivateRoute> } />
        <Route path="/nutri/gerenciar/turmas" element={ <PrivateRoute requiredRole="nutri"><MainLayout userRole="nutri"><TurmasPage /></MainLayout></PrivateRoute> } />
        <Route path="/nutri/gerenciar/usuarios" element={ <PrivateRoute requiredRole="nutri"><MainLayout userRole="nutri"><UsuariosPage /></MainLayout></PrivateRoute> } />
        <Route path="/nutri/gerenciar/necessidades" element={ <PrivateRoute requiredRole="nutri"><MainLayout userRole="nutri"><NecessidadesPage /></MainLayout></PrivateRoute> } />
        <Route path="/nutri/gerenciar/alunos" element={ <PrivateRoute requiredRole="nutri"><MainLayout userRole="nutri"><AlunosPage /></MainLayout></PrivateRoute> } />
        <Route path="/nutri/cronograma" element={ <PrivateRoute requiredRole="nutri"><MainLayout userRole="nutri"><CronogramaPage /></MainLayout></PrivateRoute> } />
        <Route path="/nutri/planejamento" element={ <PrivateRoute requiredRole="nutri"><MainLayout userRole="nutri"><PlanejamentoPage /></MainLayout></PrivateRoute> } />
        <Route path="/nutri/gerenciar-nai" element={ <PrivateRoute requiredRole="nutri"><MainLayout userRole="nutri"><NaiPage /></MainLayout></PrivateRoute> } />
        <Route path="/nutri/cardapios" element={ <PrivateRoute requiredRole="nutri"><MainLayout userRole="nutri"><CardapiosPage /></MainLayout></PrivateRoute> } />
        <Route path="/nutri/autorizados" element={ <PrivateRoute requiredRole="nutri"><MainLayout userRole="nutri"><AutorizadosPage /></MainLayout></PrivateRoute> } />
        <Route path="/nutri/perfil" element={ <PrivateRoute requiredRole="nutri"><MainLayout userRole="nutri"><ProfilePage /></MainLayout></PrivateRoute> } />
        <Route path="/nutri/chat" element={ <PrivateRoute requiredRole="nutri"><MainLayout userRole="nutri"><ChatPage /></MainLayout></PrivateRoute> } />

        {/* ================== ROTAS DA DIRETORA ================== */}
        {/* Acessa os mesmos componentes da Nutri, mas com rotas /diretora/... para a validação de segurança funcionar */}
        <Route path="/diretora/inicio" element={ <PrivateRoute requiredRole="diretora"><MainLayout userRole="diretora"><InicioPage userRole="diretora" /></MainLayout></PrivateRoute> } />
        <Route path="/diretora/dashboard" element={ <PrivateRoute requiredRole="diretora"><MainLayout userRole="diretora"><DashboardNutri /></MainLayout></PrivateRoute> } />
        
        <Route path="/diretora/controle-producao" element={ <PrivateRoute requiredRole="diretora"><MainLayout userRole="diretora"><ControleProducaoPage /></MainLayout></PrivateRoute> } />
        <Route path="/diretora/relatorio-geral" element={ <PrivateRoute requiredRole="diretora"><MainLayout userRole="diretora"><ContagemGeralPage /></MainLayout></PrivateRoute> } />
        
        {/* Gerenciamento */}
        <Route path="/diretora/gerenciar/categorias" element={ <PrivateRoute requiredRole="diretora"><MainLayout userRole="diretora"><CategoriasPage /></MainLayout></PrivateRoute> } />
        <Route path="/diretora/gerenciar/turmas" element={ <PrivateRoute requiredRole="diretora"><MainLayout userRole="diretora"><TurmasPage /></MainLayout></PrivateRoute> } />
        <Route path="/diretora/gerenciar/usuarios" element={ <PrivateRoute requiredRole="diretora"><MainLayout userRole="diretora"><UsuariosPage /></MainLayout></PrivateRoute> } />
        <Route path="/diretora/gerenciar/necessidades" element={ <PrivateRoute requiredRole="diretora"><MainLayout userRole="diretora"><NecessidadesPage /></MainLayout></PrivateRoute> } />
        <Route path="/diretora/gerenciar/alunos" element={ <PrivateRoute requiredRole="diretora"><MainLayout userRole="diretora"><AlunosPage /></MainLayout></PrivateRoute> } />
        
        {/* Funcionalidades Extras */}
        <Route path="/diretora/cardapios" element={ <PrivateRoute requiredRole="diretora"><MainLayout userRole="diretora"><CardapiosPage /></MainLayout></PrivateRoute> } />
        <Route path="/diretora/chat" element={ <PrivateRoute requiredRole="diretora"><MainLayout userRole="diretora"><ChatPage /></MainLayout></PrivateRoute> } />
        <Route path="/diretora/cronograma" element={ <PrivateRoute requiredRole="diretora"><MainLayout userRole="diretora"><CronogramaPage /></MainLayout></PrivateRoute> } />
        <Route path="/diretora/autorizados" element={ <PrivateRoute requiredRole="diretora"><MainLayout userRole="diretora"><AutorizadosPage /></MainLayout></PrivateRoute> } />
        <Route path="/diretora/planejamento" element={ <PrivateRoute requiredRole="diretora"><MainLayout userRole="diretora"><PlanejamentoPage /></MainLayout></PrivateRoute> } />
        <Route path="/diretora/perfil" element={ <PrivateRoute requiredRole="diretora"><MainLayout userRole="diretora"><ProfilePage /></MainLayout></PrivateRoute> } />

      </Routes>
    </Router>
  );
}

export default App;