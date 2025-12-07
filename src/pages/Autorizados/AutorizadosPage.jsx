import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Swal from 'sweetalert2/dist/sweetalert2.all.min.js';
import { getAutorizados, addAutorizado, updateAutorizado, deleteAutorizado } from '../../services/api';
import './AutorizadosPage.css';

// Mapeamento de níveis para legibilidade
// 1 = Inspetora, 2 = Nutricionista, 3 = Diretora (Ajuste conforme seu sistema)
const LEVEL_INSPETORA = '1';
const LEVEL_NUTRI = '2';
const LEVEL_DIRETORA = '3';

const AutorizadosPage = () => {
    const [autorizados, setAutorizados] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Pega o nível do usuário logado
    const userLevel = localStorage.getItem('userLevel');

    // --- BUSCA DE DADOS ---
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const response = await getAutorizados();
            const data = response.data?.data || response.data || [];
            // Ordena: Pendentes primeiro, depois por data mais recente
            const sortedData = data.sort((a, b) => {
                if (a.status === 'pendente' && b.status !== 'pendente') return -1;
                if (a.status !== 'pendente' && b.status === 'pendente') return 1;
                return new Date(b.created_at) - new Date(a.created_at);
            });
            setAutorizados(sortedData);
        } catch (error) {
            Swal.fire('Erro', 'Não foi possível carregar os registros.', 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // --- FILTRAGEM ---
    const filteredData = useMemo(() => {
        if (!searchTerm) return autorizados;
        const term = searchTerm.toLowerCase();
        return autorizados.filter(item => 
            item.titulo?.toLowerCase().includes(term) ||
            item.conteudo?.toLowerCase().includes(term)
        );
    }, [autorizados, searchTerm]);

    // --- AÇÕES ---

    // 1. CRIAR OU EDITAR (Inspetora e Nutri)
    const handleOpenModal = (item = null) => {
        const isEditing = !!item;
        
        Swal.fire({
            title: isEditing ? 'Editar Solicitação' : 'Nova Solicitação',
            html: `
                <div style="text-align: left">
                    <label style="font-weight:600; font-size:0.9rem; color:#555">Título / Assunto</label>
                    <input id="swal-titulo" class="swal2-input" placeholder="Ex: Autorização para aluno sair cedo" value="${item ? item.titulo : ''}" style="margin: 5px 0 15px 0; width: 100%">
                    
                    <label style="font-weight:600; font-size:0.9rem; color:#555">Detalhes</label>
                    <textarea id="swal-conteudo" class="swal2-textarea" placeholder="Descreva os detalhes..." style="margin: 5px 0; width: 100%">${item ? item.conteudo : ''}</textarea>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Salvar',
            confirmButtonColor: '#28a745',
            cancelButtonText: 'Cancelar',
            cancelButtonColor: '#a72828ff',
            width: 600,
            preConfirm: () => {
                const titulo = document.getElementById('swal-titulo').value;
                const conteudo = document.getElementById('swal-conteudo').value;
                if (!titulo || !conteudo) {
                    Swal.showValidationMessage('Título e Conteúdo são obrigatórios');
                    return false;
                }
                return { titulo, conteudo };
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    if (isEditing) {
                        // Ao editar, mantemos o status que estava (ou volta pra pendente se a regra exigir)
                        await updateAutorizado(item.id, { ...result.value, status: item.status });
                    } else {
                        // Ao criar, o service já força 'pendente'
                        await addAutorizado(result.value);
                    }
                    
                    Swal.fire({
                        icon: 'success',
                        title: 'Salvo!',
                        timer: 1500,
                        showConfirmButton: false
                    });
                    fetchData();
                } catch (error) {
                    Swal.fire('Erro', 'Falha ao salvar.', 'error');
                }
            }
        });
    };

    // 2. EXCLUIR (Nutri apenas, ou quem criou - aqui deixarei Nutri e Inspetora)
    const handleDelete = (id) => {
        Swal.fire({
            title: 'Excluir?',
            text: "Essa ação é irreversível.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            confirmButtonText: 'Sim, excluir'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await deleteAutorizado(id);
                    Swal.fire({ icon: 'success', title: 'Excluído', timer: 1500, showConfirmButton: false });
                    fetchData();
                } catch (error) {
                    Swal.fire('Erro', 'Não foi possível excluir.', 'error');
                }
            }
        });
    };

    // 3. APROVAR (Apenas Diretora)
    const handleApprove = (item) => {
        Swal.fire({
            title: 'Confirmar Autorização?',
            text: `Deseja mudar o status de "${item.titulo}" para Confirmado?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#27ae60',
            confirmButtonText: 'Sim, Confirmar'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await updateAutorizado(item.id, { 
                        titulo: item.titulo, 
                        conteudo: item.conteudo, 
                        status: 'confirmado' 
                    });
                    Swal.fire({ icon: 'success', title: 'Autorizado!', timer: 1500, showConfirmButton: false });
                    fetchData();
                } catch (error) {
                    Swal.fire('Erro', 'Falha ao aprovar.', 'error');
                }
            }
        });
    };

    // --- RENDERIZAÇÃO CONDICIONAL DE BOTÕES ---
    const canCreate = userLevel === LEVEL_NUTRI || userLevel === LEVEL_INSPETORA;
    const canEdit = userLevel === LEVEL_NUTRI || userLevel === LEVEL_INSPETORA;
    const canDelete = userLevel === LEVEL_NUTRI; // Apenas nutri deleta (ou ajuste conforme regra)
    const canApprove = userLevel === LEVEL_DIRETORA;

    return (
        <section className="autorizados-container">
            <div className="autorizados-content">
                
                {/* HEADER */}
                <div className="autorizados-header">
                    <h2>
                        <i className="bi bi-file-earmark-check-fill" style={{color: '#27ae60'}}></i> 
                        Autorizados Pela Direção
                    </h2>
                    
                    <div className="header-tools">
                        <div className="search-container">
                            <i className="bi bi-search search-icon"></i>
                            <input 
                                type="text" 
                                className="search-input" 
                                placeholder="Buscar por título..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)} 
                            />
                        </div>
                        
                        {canCreate && (
                            <button className="btn-create" onClick={() => handleOpenModal(null)}>
                                <i className="bi bi-plus-lg"></i> Nova Solicitação
                            </button>
                        )}
                    </div>
                </div>

                {/* GRID DE CARDS */}
                <div className="autorizados-grid-scroll">
                    {loading ? (
                        <div style={{textAlign:'center', padding:'2rem', width:'100%'}}>
                            <div className="spinner-border text-secondary" role="status"></div>
                        </div>
                    ) : filteredData.length > 0 ? (
                        filteredData.map(item => (
                            <div key={item.id} className={`auth-card ${item.status}`}>
                                <div className="auth-card-body">
                                    <div className="auth-date">
                                        {new Date(item.created_at).toLocaleDateString('pt-BR')} às {new Date(item.created_at).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}
                                    </div>
                                    <h3 className="auth-title">{item.titulo}</h3>
                                    <p className="auth-text">{item.conteudo}</p>
                                </div>
                                
                                <div className="auth-card-footer">
                                    <span className={`status-pill ${item.status}`}>
                                        {item.status === 'confirmado' ? <><i className="bi bi-check-circle"></i> Confirmado</> : <><i className="bi bi-clock"></i> Pendente</>}
                                    </span>

                                    <div className="auth-actions">
                                        {/* Botão de Aprovar (Só Diretora e se estiver pendente) */}
                                        {canApprove && item.status === 'pendente' && (
                                            <button className="btn-icon-auth btn-approve-auth" onClick={() => handleApprove(item)} title="Aprovar">
                                                <i className="bi bi-check-lg"></i> Aprovar
                                            </button>
                                        )}

                                        {/* Botões de Edição (Inspetora/Nutri só podem editar se pendente) */}
                                        {canEdit && item.status === 'pendente' && (
                                            <button className="btn-icon-auth btn-edit-auth" onClick={() => handleOpenModal(item)} title="Editar">
                                                <i className="bi bi-pencil-fill"></i>
                                            </button>
                                        )}

                                        {/* Botão Excluir */}
                                        {canDelete && (
                                            <button className="btn-icon-auth btn-delete-auth" onClick={() => handleDelete(item.id)} title="Excluir">
                                                <i className="bi bi-trash-fill"></i>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="empty-state">
                            <i className="bi bi-inbox"></i>
                            <p>Nenhuma solicitação encontrada.</p>
                        </div>
                    )}
                </div>

            </div>
        </section>
    );
};

export default AutorizadosPage;