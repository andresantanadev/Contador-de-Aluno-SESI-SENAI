import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2/dist/sweetalert2.all.min.js';
import { getAlunos, addAluno, updateAluno, deleteAluno, getTurmas } from '../../services/api';
import './AlunosPage.css';

const AlunosPage = () => {
    const [alunos, setAlunos] = useState([]);
    const [turmas, setTurmas] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    const turmasMap = useMemo(() => turmas.reduce((map, turma) => {
        map[turma.id] = turma.nome_turma;
        return map;
    }, {}), [turmas]);

    const fetchData = async (page = 1) => {
        try {
            setIsLoading(true);
            const [alunosData, turmasData] = await Promise.all([
                getAlunos(page),
                getTurmas(1, 100) // Pega até 100 turmas
            ]);
            setAlunos(alunosData.data || []);
            setPagination(alunosData.meta);
            setTurmas(turmasData.data || []);
        } catch (error) {
            if (error && !error.message.includes('Sessão expirada')) {
                Swal.fire('Erro!', 'Não foi possível carregar os dados dos alunos.', 'error');
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleOpenModal = (aluno = null) => {
        const isEditing = !!aluno;
        const turmasOptionsHtml = turmas.map(t => `<option value="${t.id}" ${isEditing && aluno.turmas_id == t.id ? 'selected' : ''}>${t.nome_turma}</option>`).join('');

        Swal.fire({
            title: isEditing ? 'Editar Aluno' : 'Adicionar Novo Aluno',
            html: `
                <div class="swal-form-container">
                    <input id="swal-nome" class="swal2-input" placeholder="Nome Completo" value="${isEditing ? aluno.nome : ''}">
                    <input id="swal-rm" class="swal2-input" placeholder="RM" value="${isEditing ? aluno.rm : ''}">
                    <input id="swal-data_nascimento" type="date" class="swal2-input" value="${isEditing ? aluno.data_nascimento : ''}">
                    <select id="swal-genero" class="swal2-select">
                        <option value="">Selecione o Gênero</option>
                        <option value="Masculino" ${isEditing && aluno.genero === 'Masculino' ? 'selected' : ''}>Masculino</option>
                        <option value="Feminino" ${isEditing && aluno.genero === 'Feminino' ? 'selected' : ''}>Feminino</option>
                    </select>
                    <select id="swal-turma" class="swal2-select">
                        <option value="">Selecione a Turma</option>
                        ${turmasOptionsHtml}
                    </select>
                </div>
            `,
            focusConfirm: false, showCancelButton: true, confirmButtonText: 'Salvar',
            confirmButtonColor: '#28a745',
            preConfirm: () => {
                const data = {
                    nome: document.getElementById('swal-nome').value,
                    rm: document.getElementById('swal-rm').value,
                    data_nascimento: document.getElementById('swal-data_nascimento').value,
                    genero: document.getElementById('swal-genero').value,
                    turmas_id: document.getElementById('swal-turma').value,
                };
                if (!data.nome || !data.rm) {
                    Swal.showValidationMessage('Nome e RM são obrigatórios!');
                    return false;
                }
                return data;
            }
        }).then(async (result) => {
            if (result.isConfirmed && result.value) {
                try {
                    Swal.showLoading();
                    if (isEditing) {
                        await updateAluno(aluno.id, result.value);
                    } else {
                        await addAluno(result.value);
                    }
                    await Swal.fire({icon: 'success', title: 'Sucesso!', text: 'Aluno salvo com sucesso.', timer: 1500, showConfirmButton: false});
                    fetchData(pagination?.current_page || 1);
                } catch (error) {
                    if (error && !error.message.includes('Sessão expirada')) Swal.fire('Erro!', 'Não foi possível salvar o aluno.', 'error');
                }
            }
        });
    };
    
    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Tem certeza?',
            text: "O aluno será removido permanentemente.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Sim, deletar!',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await deleteAluno(id);
                await Swal.fire({icon: 'success', title: 'Deletado!', text: 'Aluno removido com sucesso.', timer: 1500, showConfirmButton: false});
                fetchData(pagination?.current_page || 1);
            } catch (error) {
                if (error && !error.message.includes('Sessão expirada')) Swal.fire('Erro!', 'Não foi possível remover o aluno.', 'error');
            }
        }
    };

    const handlePageChange = (page) => {
        if (page) {
            fetchData(page);
        }
    };

    return (
        <section className="alunos-container">
            <div className="alunos-header">
                <h1>Gerenciar Alunos</h1>
                <button className="action-button add-button" onClick={() => handleOpenModal()}>
                    <i className="bi bi-plus"></i> Adicionar Aluno
                </button>
            </div>
            <div className="table-wrapper">
                <table className="alunos-table">
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th>RM</th>
                            <th>Nascimento</th>
                            <th>Turma</th>
                            <th className="coluna-acoes">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan="6" style={{textAlign: 'center', padding: '40px'}}>Carregando alunos...</td></tr>
                        ) : alunos.length > 0 ? (
                            alunos.map(aluno => (
                                <tr key={aluno.id}>
                                    <td>{aluno.nome}</td>
                                    <td>{aluno.rm}</td>
                                    <td>{new Date(aluno.data_nascimento).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</td>
                                    <td>{turmasMap[aluno.turmas_id] || 'N/A'}</td>
                                    <td className="coluna-acoes actions-cell">
                                        <button className="action-button edit-button" title="Editar" onClick={() => handleOpenModal(aluno)}><i className="bi bi-pencil-fill"></i></button>
                                        <button className="action-button delete-button" title="Deletar" onClick={() => handleDelete(aluno.id)}><i className="bi bi-trash-fill"></i></button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan="6" style={{textAlign: 'center', padding: '40px'}}>Nenhum aluno encontrado.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
            {pagination && pagination.last_page > 1 && (
                <div className="pagination-container">
                    {pagination.links.map((link, index) => (
                        <button
                            key={index}
                            className={`pagination-button ${link.active ? 'active' : ''} ${!link.page ? 'disabled' : ''}`}
                            onClick={() => handlePageChange(link.page)}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                            disabled={!link.page}
                        />
                    ))}
                </div>
            )}
            <div className="alunos-footer">
                <button className="action-button back-button" onClick={() => navigate(-1)}>
                    <i className="bi bi-arrow-left"></i> Voltar
                </button>
            </div>
        </section>
    );
};

export default AlunosPage;