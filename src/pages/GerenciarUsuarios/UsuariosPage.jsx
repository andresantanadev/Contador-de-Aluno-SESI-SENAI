import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2/dist/sweetalert2.all.min.js';
import { getUsers, addUser, updateUser, deleteUser } from '../../services/api';
import './UsuariosPage.css';

const UsuariosPage = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState(null);

    // Carregar dados
    const fetchUsers = async (page = 1) => {
        try {
            setLoading(true);
            const response = await getUsers(page);
            // Ajuste conforme seu backend retorna (response.data ou response.data.data)
            const lista = response.data?.data || response.data || [];
            const meta = response.data?.meta || null; // Paginação do Laravel
            
            setUsers(lista);
            setPagination(meta);
        } catch (error) {
            Swal.fire('Erro', 'Não foi possível carregar os usuários', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    // Helper para exibir o nível bonito
    const getNivelLabel = (nivel) => {
        switch(parseInt(nivel)) {
            case 1: return { text: 'Inspetora', class: 'nivel-1' };
            case 2: return { text: 'Nutricionista', class: 'nivel-2' };
            case 3: return { text: 'Admin', class: 'nivel-3' };
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
                    </select>

                    <label style="display:block; margin-bottom:5px; font-weight:600">
                        ${isEditing ? 'Nova Senha (Opcional)' : 'Senha Inicial'}
                    </label>
                    <input id="swal-password" type="password" class="swal2-input" 
                        placeholder="${isEditing ? 'Deixe em branco para manter a atual' : 'Mínimo 6 caracteres'}" 
                        style="margin: 0; width: 100%">
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Salvar',
            confirmButtonColor: '#28a745',
            cancelButtonText: 'Cancelar',
            cancelButtonColor: '#a72828ff',
            focusConfirm: false,
            preConfirm: () => {
                const name = document.getElementById('swal-name').value;
                const email = document.getElementById('swal-email').value; // CAPTURANDO O EMAIL
                const nif = document.getElementById('swal-nif').value;
                const nivel_user = document.getElementById('swal-level').value;
                const password = document.getElementById('swal-password').value;

                // VALIDANDO O EMAIL
                if (!name || !nif || !email) {
                    Swal.showValidationMessage('Nome, E-mail e NIF são obrigatórios');
                    return false;
                }
                
                // Validação de senha: obrigatória ao criar, opcional ao editar
                if (!isEditing && (!password || password.length < 6)) {
                    Swal.showValidationMessage('A senha inicial deve ter pelo menos 6 caracteres');
                    return false;
                }

                // Se estiver editando e digitou algo, valida tamanho
                if (isEditing && password && password.length < 6) {
                    Swal.showValidationMessage('A nova senha deve ter pelo menos 6 caracteres');
                    return false;
                }

                const data = { name, email, nif, nivel_user }; // ENVIANDO O EMAIL NO DATA
                
                // Só envia a senha se ela foi preenchida
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
                        // Usa a rota update padrão, enviando a senha junto se tiver sido alterada
                        await updateUser(user.id, result.value);
                        Swal.fire({
    icon: 'success',
    title: 'Atualizado!',
    text: 'Usuário atualizado com sucesso.',
    showConfirmButton: false,
    timer: 1500,
    timerProgressBar: true
});
                    } else {
                        await addUser(result.value);
                        Swal.fire({
    icon: 'success',
    title: 'Criado!',
    text: 'Usuário criado com sucesso.',
    showConfirmButton: false,
    timer: 1500,
    timerProgressBar: true
});
                    }
                    fetchUsers();
                } catch (error) {
                    // Tenta mostrar a mensagem de erro específica do backend se possível, senão mostra a genérica
                    const errorMsg = error.message && error.message.includes('email') 
                        ? 'O E-mail já está em uso ou é inválido.' 
                        : 'Não foi possível salvar. Verifique se o NIF ou E-mail já existem, e se a senha foi preenchida.';
                    Swal.fire('Erro', errorMsg, 'error');
                }
            }
        });
    };

    // --- RESETAR SENHA (Botão Dedicado - Admin) ---
    const handleResetPassword = (user) => {
        Swal.fire({
            title: `Redefinir senha de ${user.name}`,
            text: 'Digite a nova senha para este usuário:',
            input: 'password',
            inputAttributes: {
                autocapitalize: 'off',
                placeholder: 'Nova senha'
            },
            showCancelButton: true,
            confirmButtonText: 'Alterar Senha',
            confirmButtonColor: '#fd7e14',
            cancelButtonText: 'Cancelar',
            preConfirm: (newPass) => {
                if (!newPass || newPass.length < 6) {
                    Swal.showValidationMessage('A senha deve ter no mínimo 6 caracteres');
                }
                return newPass;
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    // Usamos updateUser (PUT /users/{id}) pois a rota /reset-senha (PUT)
                    // exige 'senha_atual' e só funciona para o próprio usuário logado.
                    await updateUser(user.id, { 
                        password: result.value,
                        password_confirmation: result.value 
                    });
                    Swal.fire({
    icon: 'success',
    title: 'Sucesso!',
    text: 'Senha alterada com sucesso!',
    showConfirmButton: false,
    timer: 1500,
    timerProgressBar: true
});

                } catch (error) {
                    Swal.fire('Erro', 'Não foi possível alterar a senha.', 'error');
                }
            }
        });
    };

    // --- EXCLUIR USUÁRIO ---
    const handleDelete = (user) => {
        Swal.fire({
            title: 'Tem certeza?',
            text: `Você está prestes a excluir ${user.name}. Isso não pode ser desfeito!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Sim, excluir',
            cancelButtonText: 'Cancelar'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await deleteUser(user.id);
                    Swal.fire({
    icon: 'success',
    title: 'Deletado!',
    text: 'Usuário removido.',
    showConfirmButton: false,
    timer: 1500,
    timerProgressBar: true
});

                    fetchUsers();
                } catch (error) {
                    Swal.fire('Erro', 'Não foi possível excluir o usuário.', 'error');
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
                                <td colSpan="4" style={{textAlign:'center', padding:'2rem'}}>
                                    <div className="spinner-border text-success" role="status"></div>
                                    <p>Carregando usuários...</p>
                                </td>
                            </tr>
                        ) : users.length === 0 ? (
                            <tr>
                                <td colSpan="4" style={{textAlign:'center', padding:'2rem', color:'#999'}}>
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
                                            <button 
                                                className="btn-action btn-edit" 
                                                title="Editar Dados / Alterar Senha"
                                                onClick={() => handleOpenUserModal(user)}
                                            >
                                                <i className="bi bi-pencil-fill"></i>
                                            </button>
                                            
                                            <button 
                                                className="btn-action btn-password" 
                                                title="Resetar Senha"
                                                onClick={() => handleResetPassword(user)}
                                            >
                                                <i className="bi bi-key-fill"></i>
                                            </button>

                                            <button 
                                                className="btn-action btn-delete" 
                                                title="Excluir Usuário"
                                                onClick={() => handleDelete(user)}
                                            >
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
                    {pagination.links.map((link, index) => (
                        <button
                            key={index}
                            className={`page-btn ${link.active ? 'active' : ''}`}
                            disabled={!link.url}
                            onClick={() => link.url && fetchUsers(link.label)}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default UsuariosPage;