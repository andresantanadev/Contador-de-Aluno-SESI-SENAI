import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2/dist/sweetalert2.all.min.js';
import { getUsers, addUser, updateUser, deleteUser } from '../../services/api';
import './UsuariosPage.css';

const UsuariosPage = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState(null);

    // Carregar dados do Backend
    const fetchUsers = useCallback(async (page = 1) => {
        try {
            setLoading(true);
            const response = await getUsers(page);
            // Ajuste para lidar com diferentes formatos de retorno do Laravel/API
            const lista = response.data?.data || response.data || [];
            const meta = response.data?.meta || (response.data?.last_page ? response.data : null);
            
            setUsers(lista);
            setPagination(meta);
        } catch (error) {
            Swal.fire('Erro', 'Não foi possível carregar os usuários', 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    // Helper para exibir o nível com estilo
    const getNivelLabel = (nivel) => {
        switch(parseInt(nivel)) {
            case 1: return { text: 'Inspetora', class: 'nivel-1' };
            case 2: return { text: 'Nutricionista', class: 'nivel-2' };
            case 3: return { text: 'Diretora', class: 'nivel-3' };
            default: return { text: 'Outro', class: 'nivel-1' };
        }
    };

    // --- CRIAR / EDITAR USUÁRIO ---
    const handleOpenUserModal = (user = null) => {
        const isEditing = !!user;
        
        Swal.fire({
            title: isEditing ? 'Editar Usuário' : 'Novo Usuário',
            html: `
                <div style="text-align: left">
                    <label style="display:block; margin-bottom:5px; font-weight:600">Nome Completo</label>
                    <input id="swal-name" class="swal2-input" placeholder="Ex: Maria Silva" value="${user ? user.name : ''}" style="margin: 0 0 15px 0; width: 100%">
                    
                    <label style="display:block; margin-bottom:5px; font-weight:600">E-mail</label>
                    <input id="swal-email" type="email" class="swal2-input" placeholder="Ex: maria@escola.com" value="${user ? user.email || '' : ''}" style="margin: 0 0 15px 0; width: 100%">

                    <label style="display:block; margin-bottom:5px; font-weight:600">NIF (Login)</label>
                    <input id="swal-nif" class="swal2-input" placeholder="Ex: 123456" value="${user ? user.nif : ''}" style="margin: 0 0 15px 0; width: 100%">
                    
                    <label style="display:block; margin-bottom:5px; font-weight:600">Nível de Acesso</label>
                    <select id="swal-level" class="swal2-select" style="margin: 0 0 15px 0; width: 100%; display:block">
                        <option value="1" ${user && user.nivel_user == 1 ? 'selected' : ''}>Inspetora / Apoio</option>
                        <option value="2" ${user && user.nivel_user == 2 ? 'selected' : ''}>Nutricionista</option>
                        <option value="3" ${user && user.nivel_user == 3 ? 'selected' : ''}>Diretora (Admin)</option>
                    </select>

                    <label style="display:block; margin-bottom:5px; font-weight:600">
                        ${isEditing ? 'Nova Senha (Opcional)' : 'Senha Inicial'}
                    </label>
                    <input id="swal-password" type="password" class="swal2-input" 
                        placeholder="${isEditing ? 'Deixe em branco para manter' : 'Mínimo 6 caracteres'}" 
                        style="margin: 0; width: 100%">
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Salvar',
            confirmButtonColor: '#28a745',
            cancelButtonText: 'Cancelar',
            cancelButtonColor: '#dc3545',
            focusConfirm: false,
            preConfirm: () => {
                const name = document.getElementById('swal-name').value;
                const email = document.getElementById('swal-email').value;
                const nif = document.getElementById('swal-nif').value;
                const nivel_user = document.getElementById('swal-level').value;
                const password = document.getElementById('swal-password').value;

                if (!name || !nif || !email) {
                    Swal.showValidationMessage('Nome, E-mail e NIF são obrigatórios');
                    return false;
                }
                
                if (!isEditing && (!password || password.length < 6)) {
                    Swal.showValidationMessage('A senha inicial deve ter pelo menos 6 caracteres');
                    return false;
                }

                const data = { name, email, nif, nivel_user };
                if (password) {
                    data.password = password;
                    data.password_confirmation = password; 
                }
                return data;
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    if (isEditing) {
                        await updateUser(user.id, result.value);
                        Swal.fire({ icon: 'success', title: 'Atualizado!', timer: 1500, showConfirmButton: false });
                    } else {
                        await addUser(result.value);
                        Swal.fire({ icon: 'success', title: 'Criado!', timer: 1500, showConfirmButton: false });
                    }
                    fetchUsers();
                } catch (error) {
                    Swal.fire('Erro', 'Verifique se o NIF ou E-mail já existem no sistema.', 'error');
                }
            }
        });
    };

    // --- RESETAR SENHA ---
    const handleResetPassword = (user) => {
        Swal.fire({
            title: `Nova senha para ${user.name}`,
            input: 'password',
            inputPlaceholder: 'Digite a nova senha',
            showCancelButton: true,
            confirmButtonText: 'Alterar',
            confirmButtonColor: '#fd7e14',
            preConfirm: (newPass) => {
                if (!newPass || newPass.length < 6) {
                    Swal.showValidationMessage('Mínimo 6 caracteres');
                }
                return newPass;
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await updateUser(user.id, { 
                        password: result.value,
                        password_confirmation: result.value 
                    });
                    Swal.fire({ icon: 'success', title: 'Senha alterada!', timer: 1500, showConfirmButton: false });
                } catch (error) {
                    Swal.fire('Erro', 'Falha ao alterar senha.', 'error');
                }
            }
        });
    };

    // --- EXCLUIR ---
    const handleDelete = (user) => {
        Swal.fire({
            title: 'Excluir usuário?',
            text: `Tem certeza que deseja remover ${user.name}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            confirmButtonText: 'Sim, excluir'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await deleteUser(user.id);
                    Swal.fire({ icon: 'success', title: 'Excluído!', timer: 1500, showConfirmButton: false });
                    fetchUsers();
                } catch (error) {
                    Swal.fire('Erro', 'Não foi possível excluir.', 'error');
                }
            }
        });
    };

    return (
        <div className="usuarios-container">
            <div className="page-header">
                <h1><i className="bi bi-people-fill"></i> Gerenciar Usuários</h1>
                <button className="btn-add" onClick={() => handleOpenUserModal()}>
                    <i className="bi bi-person-plus-fill"></i> Novo Usuário
                </button>
            </div>

            <div className="table-responsive">
                <table className="custom-table">
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th>NIF (Login)</th>
                            <th>Nível de Acesso</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="4" style={{textAlign:'center', padding:'3rem'}}>
                                    <div className="spinner-border text-success" role="status"></div>
                                    <p style={{marginTop:'10px'}}>Carregando usuários...</p>
                                </td>
                            </tr>
                        ) : users.length === 0 ? (
                            <tr>
                                <td colSpan="4" style={{textAlign:'center', padding:'3rem', color:'#999'}}>
                                    Nenhum usuário encontrado.
                                </td>
                            </tr>
                        ) : (
                            users.map((user) => {
                                const nivel = getNivelLabel(user.nivel_user);
                                return (
                                    <tr key={user.id}>
                                        <td style={{fontWeight:'500'}}>{user.name}</td>
                                        <td>{user.nif}</td>
                                        <td>
                                            <span className={`badge-nivel ${nivel.class}`}>
                                                {nivel.text}
                                            </span>
                                        </td>
                                        <td className="actions-cell">
                                            <button className="btn-action btn-edit" title="Editar" onClick={() => handleOpenUserModal(user)}>
                                                <i className="bi bi-pencil-fill"></i>
                                            </button>
                                            <button className="btn-action btn-password" title="Resetar Senha" onClick={() => handleResetPassword(user)}>
                                                <i className="bi bi-key-fill"></i>
                                            </button>
                                            <button className="btn-action btn-delete" title="Excluir" onClick={() => handleDelete(user)}>
                                                <i className="bi bi-trash-fill"></i>
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
            
            {pagination && pagination.last_page > 1 && (
                <div className="pagination">
                    {pagination.links?.map((link, index) => (
                        <button
                            key={index}
                            className={`page-btn ${link.active ? 'active' : ''}`}
                            disabled={!link.url}
                            onClick={() => {
                                const page = new URL(link.url).searchParams.get('page');
                                fetchUsers(page);
                            }}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    )) || (
                        // Fallback caso a estrutura de links seja simples
                        Array.from({ length: pagination.last_page }, (_, i) => (
                            <button 
                                key={i} 
                                className={`page-btn ${pagination.current_page === i + 1 ? 'active' : ''}`}
                                onClick={() => fetchUsers(i + 1)}
                            >
                                {i + 1}
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default UsuariosPage;