import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2/dist/sweetalert2.all.min.js';
import { loginUser, getUserData } from '../../services/api';
import { showTermsModal, showPrivacyModal } from '../../utils/modals';
import './LoginPage.css';
import logo from '../../assets/img/code.png';

const LoginPage = () => {
  const [nif, setNif] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(''); 
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const navigateBasedOnLevel = (level) => {
    // Converte para string para garantir comparação correta
    switch (String(level)) {
      case '1': navigate('/inspetora/inicio'); break;
      case '2': navigate('/nutri/inicio'); break;
      case '3': navigate('/diretora/inicio'); break; // Adicionado nível Diretora
      default:
        Swal.fire({
          icon: 'error',
          title: 'Acesso Negado',
          text: 'Seu nível de usuário não tem uma página de destino configurada.',
        });
        localStorage.clear();
        break;
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const loginResponse = await loginUser(nif, password);
      const token = loginResponse.token;
      
      // Salva token primeiro para poder buscar dados do usuário
      localStorage.setItem('authToken', token);

      const userData = await getUserData(token);
      localStorage.setItem('userName', userData.name);
      localStorage.setItem('userLevel', userData.nivel_user);
      
      setIsLoading(false);
      
      // Alerta de Sucesso (Rápido e sem botão, como nos outros)
      await Swal.fire({
        icon: 'success',
        title: 'Bem-vindo(a)!',
        text: userData.name,
        timer: 1500,
        showConfirmButton: false,
        allowOutsideClick: false
      });

      navigateBasedOnLevel(userData.nivel_user);

    } catch (err) {
      setIsLoading(false);
      
      // Tratamento específico para erro de login
      // Se for erro no login, não é "sessão expirada", é "senha errada"
      const errorMessage = err.message || 'Falha desconhecida.';
      
      // Se a API retornar 401 no endpoint /login, é erro de credenciais
      if (errorMessage.includes('401') || errorMessage.toLowerCase().includes('unauthorized')) {
          Swal.fire({
            icon: 'error',
            title: 'Acesso Negado',
            text: 'NIF ou senha incorretos. Por favor, verifique seus dados.',
            confirmButtonText: 'Tentar Novamente',
            confirmButtonColor: '#d33',
          });
      } else {
          // Outros erros (servidor fora, internet, etc)
          setError(errorMessage);
          Swal.fire({
            icon: 'error',
            title: 'Erro no Sistema',
            text: errorMessage || 'Ocorreu um erro inesperado ao tentar entrar.',
            confirmButtonText: 'OK',
            confirmButtonColor: '#6c757d',
          });
      }
    }
  };

  return (
    <div className="login-background">
      <div className="box">
        <div className="logo-container">
          <img src={logo} alt="Logo Menu Solutions" />
        </div>
        
        <form onSubmit={handleSubmit}>
          <h2>Login</h2>
          <div className="inputBox">
            <input 
              type="text" 
              value={nif}
              onChange={(e) => setNif(e.target.value)}
              required 
            />
            <span>NIF</span>
            <i></i>
          </div>

          <div className="inputBox">
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
            <span>Senha</span>
            <i></i>
          </div>

          <input 
            type="submit" 
            value={isLoading ? 'Entrando...' : 'Entrar'} 
            disabled={isLoading}
          />

          <div className="terms-container">
            <p>
              Ao continuar, você concorda com nossos{' '}
              <span className="link-style" onClick={showTermsModal}>Termos de Uso</span> e{' '}
              <span className="link-style" onClick={showPrivacyModal}>Política de Privacidade</span>.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;