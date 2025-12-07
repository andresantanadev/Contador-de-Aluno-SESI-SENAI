import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2/dist/sweetalert2.all.min.js';
import { getTurmas, addTurma, updateTurma, deleteTurma, getCategorias } from '../../services/api';
import './TurmasPage.css';

// Função para escolher a cor do badge de forma consistente
const getBadgeColorClass = (categoriaId) => {
  if (!categoriaId) return 'badge-color-undefined'; // Cor padrão se não houver ID
  const numeroDeCores = 5; // Temos 5 cores na paleta (0 a 4)
  const corIndex = categoriaId % numeroDeCores;
  return `badge-color-${corIndex}`;
};

const TurmasPage = () => {
  const [turmas, setTurmas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const fetchData = async (page = 1) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('authToken');
      if (!token) { navigate('/'); return; }
      
      const [turmasData, categoriasData] = await Promise.all([
        getTurmas(token, page),
        getCategorias(token) // Pega a primeira página de categorias para o dropdown
      ]);

      setTurmas(turmasData.data || []);
      setPagination(turmasData.meta);
      setCategorias(categoriasData.data || []);

    } catch (error) {
      Swal.fire('Erro!', 'Não foi possível carregar os dados da página.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (item = null) => {
    const isEditing = item !== null;
    const optionsHtml = categorias.map(cat => 
      `<option value="${cat.id}" ${isEditing && item.categorias_id == cat.id ? 'selected' : ''}>
        ${cat.nome_categoria}
      </option>`
    ).join('');

    Swal.fire({
      title: isEditing ? 'Editar Turma' : 'Adicionar Nova Turma',
      html: `
        <input id="swal-nome" class="swal2-input" placeholder="Nome da Turma" value="${isEditing ? item.nome_turma : ''}">
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
      cancelButtonColor: '#d33',
      preConfirm: () => {
        const nome = document.getElementById('swal-nome').value;
        const categoriaId = document.getElementById('swal-categoria').value;
        if (!nome || !categoriaId) {
          Swal.showValidationMessage('Nome da turma e categoria são obrigatórios!');
          return false;
        }
        return { nome_turma: nome, categorias_id: categoriaId };
      }
    }).then(async (result) => {
      if (result.isConfirmed && result.value) {
        const token = localStorage.getItem('authToken');
        try {
          if (isEditing) {
            await updateTurma(item.id, result.value, token);
          } else {
            await addTurma(result.value, token);
          }
          Swal.fire('Sucesso!', 'Turma salva com sucesso!', 'success');
          fetchData(pagination?.current_page || 1);
        } catch (error) {
          Swal.fire('Erro!', 'Não foi possível salvar a turma.', 'error');
        }
      }
    });
  };

  const handleDelete = (id) => {
    Swal.fire({
      title: 'Tem certeza?',
      text: "Esta ação não pode ser revertida!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sim, deletar!',
      cancelButtonText: 'Cancelar',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const token = localStorage.getItem('authToken');
          await deleteTurma(id, token);
          Swal.fire('Deletado!', 'A turma foi removida.', 'success');
          fetchData(pagination?.current_page || 1);
        } catch (error) {
          Swal.fire('Erro!', 'Não foi possível deletar a turma.', 'error');
        }
      }
    });
  };

  const handlePageChange = (page) => {
    if (page) {
      fetchData(page);
    }
  };

  return (
    <section className="turmas-container">
      <div className="turmas-header">
        <h1>Gerenciar Turmas</h1>
        <button className="action-button add-button" onClick={() => handleOpenModal()}>
          <i className="bi bi-plus"></i> Adicionar Turma
        </button>
      </div>
      <div className="table-wrapper">
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
              <tr><td colSpan="3" style={{textAlign: 'center'}}>Carregando...</td></tr>
            ) : turmas.length > 0 ? (
              turmas.map(turma => (
                <tr key={turma.id}>
                  <td>{turma.nome_turma}</td>
                  <td>
                    <span className={`categoria-badge ${getBadgeColorClass(turma.categoria?.id)}`}>
                      {turma.categoria?.nome_categoria || 'Não definida'}
                    </span>
                  </td>
                  <td className="coluna-acoes actions-cell">
                    <button className="action-button edit-button" title="Editar" onClick={() => handleOpenModal(turma)}>
                      <i className="bi bi-pencil-fill"></i>
                    </button>
                    <button className="action-button delete-button" title="Deletar" onClick={() => handleDelete(turma.id)}>
                      <i className="bi bi-trash-fill"></i>
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="3" style={{textAlign: 'center'}}>Nenhuma turma encontrada.</td></tr>
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
      <div className="turmas-footer">
        <button className="action-button back-button" onClick={() => navigate(-1)}>
          <i className="bi bi-arrow-left"></i> Voltar
        </button>
      </div>
    </section>
  );
};

export default TurmasPage;