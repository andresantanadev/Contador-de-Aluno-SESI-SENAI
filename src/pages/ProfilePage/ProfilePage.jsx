import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2/dist/sweetalert2.all.min.js';
import { getUserData, updateUserData, changePassword } from '../../services/api'; 
import './ProfilePage.css';

const ProfilePage = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    
    // Dados do Usuário (Agora com NIF ao invés de Email)
    const [user, setUser] = useState({
        id: '',
        name: '',
        nif: '', 
        nivel_user: 1
    });

    // Estado para mudança de senha
    const [passwordData, setPasswordData] = useState({
        senha_atual: '',
        new_password: '',
        new_password_confirmation: ''
    });

    const getNivelLabel = (nivel) => {
        switch(parseInt(nivel)) {
            case 1: return 'Inspetora / Apoio';
            case 2: return 'Nutricionista';
            case 3: return 'Administrador';
            default: return 'Usuário do Sistema';
        }
    };

    const fetchProfile = async () => {
        try {
            setIsLoading(true);
            const response = await getUserData();
            
            // Ajuste para pegar os dados (verifique se o backend retorna 'nif')
            const userData = response.data || response; 
            
            setUser({
                id: userData.id,
                name: userData.name,
                nif: userData.nif, // Mapeando o NIF vindo do banco
                nivel_user: userData.nivel_user
            });

        } catch (error) {
            console.error(error);
            Swal.fire('Erro', 'Não foi possível carregar o perfil.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    // Atualizar Dados Pessoais (Apenas Nome, pois NIF é chave de acesso)
    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        try {
            // Enviamos o nome para atualização. O NIF geralmente não muda.
            await updateUserData(user.id, { name: user.name });
            
            // --- ALERTA DE SUCESSO AUTOMÁTICO ---
            Swal.fire({
                icon: 'success',
                title: 'Sucesso!',
                text: 'Dados atualizados com sucesso.',
                timer: 1500,
                showConfirmButton: false
            });
        } catch (error) {
            Swal.fire('Erro!', 'Falha ao atualizar perfil.', 'error');
        }
    };

    // Alterar Senha
    const handleChangePassword = async (e) => {
        e.preventDefault();
        
        if (passwordData.new_password !== passwordData.new_password_confirmation) {
            Swal.fire('Atenção', 'As novas senhas não coincidem.', 'warning');
            return;
        }

        try {
            await changePassword(passwordData);
            
            // --- ALERTA DE SUCESSO AUTOMÁTICO ---
            Swal.fire({
                icon: 'success',
                title: 'Sucesso!',
                text: 'Senha alterada com sucesso!',
                timer: 1500,
                showConfirmButton: false
            });
            
            setPasswordData({ senha_atual: '', new_password: '', new_password_confirmation: '' });
        } catch (error) {
            const msg = error.message || 'Erro ao alterar senha.';
            Swal.fire('Erro!', msg, 'error');
        }
    };

    if (isLoading) return <div className="loading-screen">Carregando Perfil...</div>;

    return (
        <div className="profile-container">
            <div className="profile-header-top">
                <h1>Meu Perfil</h1>
            </div>

            <div className="profile-grid">
                
                {/* COLUNA ESQUERDA: Identidade */}
                <div className="left-column">
                    <div className="profile-card identity-card">
                        <img 
                            src={`https://ui-avatars.com/api/?name=${user.name}&background=28a745&color=fff&size=128&bold=true`} 
                            alt="Avatar" 
                            className="avatar-large" 
                        />
                        <h2 className="user-name">{user.name}</h2>
                        <span className={`user-role-badge role-${user.nivel_user}`}>
                            {getNivelLabel(user.nivel_user)}
                        </span>
                        {/* Exibe o NIF no cartão de identidade */}
                        <p className="user-email-display">
                            <i className="bi bi-person-vcard"></i> NIF: {user.nif}
                        </p>
                    </div>
                </div>

                {/* COLUNA DIREITA: Edição e Segurança */}
                <div className="right-column">
                    
                    {/* Formulário de Dados Pessoais */}
                    <div className="profile-card">
                        <h3 className="form-section-title"><i className="bi bi-person-lines-fill"></i> Informações Pessoais</h3>
                        <form onSubmit={handleUpdateProfile}>
                            <div className="form-group">
                                <label>Nome Completo</label>
                                <input 
                                    type="text" 
                                    className="form-input" 
                                    value={user.name}
                                    onChange={(e) => setUser({...user, name: e.target.value})}
                                    required 
                                />
                            </div>
                            <div className="form-group">
                                <label>NIF (Login do Usuário)</label>
                                <input 
                                    type="text" 
                                    className="form-input input-disabled" 
                                    value={user.nif}
                                    readOnly
                                    title="O NIF é seu identificador único e não pode ser alterado."
                                />
                                <small className="helper-text">O NIF é utilizado para login e não pode ser alterado por aqui.</small>
                            </div>
                            <div style={{textAlign: 'right', marginTop: '1rem'}}>
                                <button type="submit" className="btn-save">
                                    <i className="bi bi-check-lg"></i> Salvar Dados
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Formulário de Senha */}
                    <div className="profile-card">
                        <h3 className="form-section-title"><i className="bi bi-shield-lock-fill"></i> Alterar Senha</h3>
                        <form onSubmit={handleChangePassword}>
                            <div className="form-group">
                                <label>Senha Atual</label>
                                <input 
                                    type="password" 
                                    className="form-input"
                                    placeholder="Digite sua senha atual"
                                    value={passwordData.senha_atual}
                                    onChange={(e) => setPasswordData({...passwordData, senha_atual: e.target.value})}
                                    required 
                                />
                            </div>
                            
                            <div className="grid-2-col">
                                <div className="form-group">
                                    <label>Nova Senha</label>
                                    <input 
                                        type="password" 
                                        className="form-input"
                                        placeholder="Min. 8 caracteres"
                                        value={passwordData.new_password}
                                        onChange={(e) => setPasswordData({...passwordData, new_password: e.target.value})}
                                        required 
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Confirmar Nova Senha</label>
                                    <input 
                                        type="password" 
                                        className="form-input"
                                        placeholder="Repita a nova senha"
                                        value={passwordData.new_password_confirmation}
                                        onChange={(e) => setPasswordData({...passwordData, new_password_confirmation: e.target.value})}
                                        required 
                                    />
                                </div>
                            </div>

                            <div style={{textAlign: 'right', marginTop: '1rem'}}>
                                <button type="submit" className="btn-save btn-password">
                                    <i className="bi bi-key-fill"></i> Atualizar Senha
                                </button>
                            </div>
                        </form>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default ProfilePage;