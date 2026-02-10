import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2/dist/sweetalert2.all.min.js';
import { getTurmas, addTurma, updateTurma, deleteTurma, getCategorias, addCategoria, updateCategoria, deleteCategoria } from '../../services/api';
import BackButton from '../../components/common/BackButton/BackButton';
import './CategoriasPage.css';

// Função para escolher a cor do badge de forma consistente
const getBadgeColorClass = (categoriaId) => {
    if (!categoriaId) return 'badge-color-undefined';
    const numeroDeCores = 5;
    const corIndex = categoriaId % numeroDeCores;
    return `badge-color-${corIndex}`;
};

const CategoriasPage = () => {
    const [turmas, setTurmas] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [selectedCategoriaId, setSelectedCategoriaId] = useState('all');
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    const fetchData = useCallback(async () => {
        try {
            setIsLoading(true);
            const [turmasData, categoriasData] = await Promise.all([
                getTurmas(1, 1000), // Pega todas as turmas
                getCategorias(1, 100) // Pega todas as categorias
            ]);
            setTurmas(turmasData.data || []);
            setCategorias(categoriasData.data || []);
        } catch (error) {
            if (error && !error.message.includes('Sessão expirada')) {
                Swal.fire('Erro!', 'Não foi possível carregar os dados.', 'error');
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const filteredTurmas = useMemo(() => {
        if (selectedCategoriaId === 'all') return turmas;
        return turmas.filter(turma => turma.categorias_id === selectedCategoriaId);
    }, [selectedCategoriaId, turmas]);

    const nomeDaVisao = useMemo(() => {
        if (selectedCategoriaId === 'all') return 'Todas as Turmas';
        return `Turmas de: ${categorias.find(cat => cat.id === selectedCategoriaId)?.nome_categoria || ''}`;
    }, [selectedCategoriaId, categorias]);

    // ======================== CATEGORIAS ========================

    const handleAddCategoria = async () => {
        const { value: nome } = await Swal.fire({
            title: 'Adicionar Nova Categoria',
            input: 'text',
            inputPlaceholder: 'Nome da Categoria',
            showCancelButton: true,
            confirmButtonText: 'Salvar',
            confirmButtonColor: '#28a745',
            cancelButtonText: 'Cancelar',
            cancelButtonColor: '#a72828ff',
            inputValidator: (value) => !value && 'Você precisa digitar um nome!'
        });

        if (nome) {
            try {
                await addCategoria(nome);
                await Swal.fire({
                    icon: 'success',
                    title: 'Sucesso!',
                    text: 'Categoria salva.',
                    timer: 1500,
                    showConfirmButton: false
                });
                fetchData();
            } catch (error) {
                if (!error.message.includes('Sessão expirada')) {
                    Swal.fire('Erro!', 'Não foi possível salvar a categoria.', 'error');
                }
            }
        }
    };

    const handleEditCategoria = async (cat) => {
        const { value: nome } = await Swal.fire({
            title: 'Editar Categoria',
            input: 'text',
            inputValue: cat.nome_categoria,
            inputPlaceholder: 'Nome da Categoria',
            showCancelButton: true,
            confirmButtonText: 'Salvar',
            confirmButtonColor: '#28a745',
            cancelButtonText: 'Cancelar',
            cancelButtonColor: '#a72828ff',
            inputValidator: (value) => !value && 'O nome não pode ser vazio!'
        });

        if (nome) {
            try {
                await updateCategoria(cat.id, nome);
                await Swal.fire({
                    icon: 'success',
                    title: 'Sucesso!',
                    text: 'Categoria atualizada.',
                    timer: 1500,
                    showConfirmButton: false
                });
                fetchData();
            } catch (error) {
                if (!error.message.includes('Sessão expirada')) {
                    Swal.fire('Erro!', 'Não foi possível atualizar a categoria.', 'error');
                }
            }
        }
    };

    const handleDeleteCategoria = async (cat) => {
        const result = await Swal.fire({
            title: 'Tem certeza?',
            html: `Isso removerá a categoria "<strong>${cat.nome_categoria}</strong>" e pode afetar turmas associadas!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#a72828ff',
            confirmButtonText: 'Sim, deletar!',
            cancelButtonText: 'Cancelar',
            cancelButtonColor: '#000000ff',
        });

        if (result.isConfirmed) {
            try {
                await deleteCategoria(cat.id);
                await Swal.fire({
                    icon: 'success',
                    title: 'Deletado!',
                    text: 'A categoria foi removida.',
                    timer: 1500,
                    showConfirmButton: false
                });
                if (selectedCategoriaId === cat.id) setSelectedCategoriaId('all');
                fetchData();
            } catch (error) {
                if (!error.message.includes('Sessão expirada')) {
                    Swal.fire('Erro!', 'Não foi possível deletar a categoria.', 'error');
                }
            }
        }
    };

    // ======================== TURMAS ========================

    const handleAddTurma = async () => {
        const optionsHtml = categorias
            .map(cat => `<option value="${cat.id}">${cat.nome_categoria}</option>`)
            .join('');

        const { value: formValues } = await Swal.fire({
            title: 'Adicionar Nova Turma',
            html: `
                <input id="swal-nome" class="swal2-input" placeholder="Nome da Turma">
                <select id="swal-categoria" class="swal2-select">
                    <option value="">Selecione uma Categoria</option>
                    ${optionsHtml}
                </select>
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Salvar',
            confirmButtonColor: '#28a745',
            cancelButtonText: 'Cancelar',
            cancelButtonColor: '#a72828ff',
            preConfirm: () => {
                const nome = document.getElementById('swal-nome').value;
                const categoriaId = document.getElementById('swal-categoria').value;

                if (!nome || !categoriaId) {
                    Swal.showValidationMessage('Nome da turma e categoria são obrigatórios!');
                    return false;
                }

                return { nome_turma: nome, categorias_id: categoriaId };
            }
        });

        if (formValues) {
            try {
                await addTurma(formValues);
                await Swal.fire({
                    icon: 'success',
                    title: 'Sucesso!',
                    text: 'Turma salva com sucesso!',
                    timer: 1500,
                    showConfirmButton: false
                });
                fetchData();
            } catch (error) {
                if (!error.message.includes('Sessão expirada')) {
                    Swal.fire('Erro!', 'Não foi possível salvar a turma.', 'error');
                }
            }
        }
    };

    const handleEditTurma = async (turma) => {
        const optionsHtml = categorias
            .map(cat => `<option value="${cat.id}" ${turma.categorias_id == cat.id ? 'selected' : ''}>${cat.nome_categoria}</option>`)
            .join('');

        const { value: formValues } = await Swal.fire({
            title: 'Editar Turma',
            html: `
                <input id="swal-nome" class="swal2-input" value="${turma.nome_turma}">
                <select id="swal-categoria" class="swal2-select">
                    <option value="">Selecione uma Categoria</option>
                    ${optionsHtml}
                </select>
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Salvar',
            confirmButtonColor: '#28a745',
            cancelButtonText: 'Cancelar',
            cancelButtonColor: '#a72828ff',
            preConfirm: () => {
                const nome = document.getElementById('swal-nome').value;
                const categoriaId = document.getElementById('swal-categoria').value;

                if (!nome || !categoriaId) {
                    Swal.showValidationMessage('Nome da turma e categoria são obrigatórios!');
                    return false;
                }

                return { nome_turma: nome, categorias_id: categoriaId };
            }
        });

        if (formValues) {
            try {
                await updateTurma(turma.id, formValues);
                await Swal.fire({
                    icon: 'success',
                    title: 'Sucesso!',
                    text: 'Turma atualizada com sucesso!',
                    timer: 1500,
                    showConfirmButton: false
                });
                fetchData();
            } catch (error) {
                if (!error.message.includes('Sessão expirada')) {
                    Swal.fire('Erro!', 'Não foi possível atualizar a turma.', 'error');
                }
            }
        }
    };

    const handleDeleteTurma = async (id) => {
        const result = await Swal.fire({
            title: 'Tem certeza?',
            text: "Esta ação não pode ser revertida!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#a72828ff',
            confirmButtonText: 'Sim, deletar!',
            cancelButtonText: 'Cancelar',
            cancelButtonColor: '#000000',
        });

        if (result.isConfirmed) {
            try {
                await deleteTurma(id);
                await Swal.fire({
                    icon: 'success',
                    title: 'Deletado!',
                    text: 'A turma foi removida.',
                    timer: 1500,
                    showConfirmButton: false
                });
                fetchData();
            } catch (error) {
                if (!error.message.includes('Sessão expirada')) {
                    Swal.fire('Erro!', 'Não foi possível deletar a turma.', 'error');
                }
            }
        }
    };

    return (
        <section className="estrutura-container">
            <div className="panel-lateral panel-categorias">
                <div className="panel-header">
                    <h3>Categorias</h3>
                    <button className="add-button-small" onClick={handleAddCategoria} title="Criar Nova Categoria">+</button>
                </div>

                <div className="list-container">
                    <div
                        className={`list-item-container ${selectedCategoriaId === 'all' ? 'active' : ''}`}
                        onClick={() => setSelectedCategoriaId('all')}
                    >
                        <span className="list-item-name">Ver Todas as Turmas</span>
                    </div>

                    {isLoading ? (
                        <p style={{ padding: '10px' }}>Carregando...</p>
                    ) : (
                        categorias.map(cat => (
                            <div
                                key={cat.id}
                                className={`list-item-container ${selectedCategoriaId === cat.id ? 'active' : ''}`}
                                onClick={() => setSelectedCategoriaId(cat.id)}
                            >
                                <span className="list-item-name">{cat.nome_categoria}</span>
                                <div className="list-item-actions">
                                    <button
                                        title="Editar"
                                        onClick={(e) => { e.stopPropagation(); handleEditCategoria(cat); }}
                                    >
                                        <i className="bi bi-pencil-fill"></i>
                                    </button>
                                    <button
                                        title="Excluir"
                                        onClick={(e) => { e.stopPropagation(); handleDeleteCategoria(cat); }}
                                    >
                                        <i className="bi bi-trash-fill"></i>
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div className="panel-central panel-turmas">
                <div className="panel-header">
                    <h3>{nomeDaVisao}</h3>
                    <button className="add-button-small" onClick={handleAddTurma} title="Criar Nova Turma">+</button>
                </div>

                <div className="table-wrapper-turmas">
                    <table className="turmas-table">
                        <thead>
                            <tr>
                                <th>Nome da Turma</th>
                                <th>Categoria</th>
                                <th className="coluna-acoes">Ações</th>
                            </tr>
                        </thead>

                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan="3" style={{ textAlign: 'center', padding: '40px' }}>
                                        Carregando...
                                    </td>
                                </tr>
                            ) : filteredTurmas.length > 0 ? (
                                filteredTurmas.map(turma => (
                                    <tr key={turma.id}>
                                        <td>{turma.nome_turma}</td>
                                        <td>
                                            <span className={`categoria-badge ${getBadgeColorClass(turma.categoria?.id)}`}>
                                                {turma.categoria?.nome_categoria || 'Não definida'}
                                            </span>
                                        </td>
                                        <td className="coluna-acoes actions-cell">
                                            <button
                                                className="action-button edit-button"
                                                title="Editar"
                                                onClick={() => handleEditTurma(turma)}
                                            >
                                                <i className="bi bi-pencil-fill"></i>
                                            </button>
                                            <button
                                                className="action-button delete-button"
                                                title="Deletar"
                                                onClick={() => handleDeleteTurma(turma.id)}
                                            >
                                                <i className="bi bi-trash-fill"></i>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="3">
                                        <div className="empty-state">
                                            <i className="bi bi-search"></i>
                                            <p>Nenhuma turma encontrada.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    );
};

export default CategoriasPage;
