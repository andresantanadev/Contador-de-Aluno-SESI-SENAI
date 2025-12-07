import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2/dist/sweetalert2.all.min.js';
import { getNecessidades, addNecessidade, updateNecessidade, deleteNecessidade } from '../../services/api';
import './NecessidadesPage.css';

const NecessidadesPage = () => {
  const [necessidades, setNecessidades] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const fetchData = async (page = 1) => {
    try {
      setIsLoading(true);
      const data = await getNecessidades(page);
      setNecessidades(data.data || []);
      setPagination(data.meta);
    } catch (error) {
      if (error && !error.message.includes('Sessão expirada')) {
        Swal.fire('Erro!', 'Não foi possível carregar as necessidades.', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (item = null) => {
    Swal.fire({
      title: item ? 'Editar Necessidade' : 'Adicionar Nova Necessidade',
      input: 'text',
      inputValue: item ? item.necessidade : '',
      inputPlaceholder: 'Nome da Necessidade',
      showCancelButton: true,
      confirmButtonText: 'Salvar',
      confirmButtonColor: '#28a745',
      cancelButtonText: 'Cancelar',
      inputValidator: (value) => !value && 'Você precisa descrever a necessidade!'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          if (item) {
            await updateNecessidade(item.id, result.value);
          } else {
            await addNecessidade(result.value);
          }
          await Swal.fire({icon: 'success', title: 'Sucesso!', text: 'Necessidade salva com sucesso.', timer: 1500, showConfirmButton: false});
          fetchData(pagination?.current_page || 1);
        } catch (error) {
          if (error && !error.message.includes('Sessão expirada')) Swal.fire('Erro!', 'Não foi possível salvar a necessidade.', 'error');
        }
      }
    });
  };

  const handleDelete = (id) => {
    Swal.fire({
      title: 'Tem certeza?',
      text: "Isso pode afetar alunos associados a esta necessidade!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Sim, deletar!',
      cancelButtonText: 'Cancelar',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await deleteNecessidade(id);
          await Swal.fire({icon: 'success', title: 'Deletado!', text: 'A necessidade foi removida.', timer: 1500, showConfirmButton: false});
          fetchData(pagination?.current_page || 1);
        } catch (error) {
          if (error && !error.message.includes('Sessão expirada')) Swal.fire('Erro!', 'Não foi possível deletar a necessidade.', 'error');
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
    <section className="necessidades-container">
      <div className="necessidades-header">
        <h1>Gerenciar Necessidades</h1>
        <button className="action-button add-button" onClick={() => handleOpenModal()}>
          <i className="bi bi-plus"></i> Adicionar Necessidade
        </button>
      </div>

      <div className="necessidades-grid">
        {isLoading ? (
          <p className="full-width-message">Carregando...</p>
        ) : necessidades.length > 0 ? (
          necessidades.map(item => (
            <div key={item.id} className="necessidade-card">
              <span className="necessidade-text">{item.necessidade}</span>
              <div className="actions-cell">
                <button className="action-button-icon edit-button" title="Editar" onClick={() => handleOpenModal(item)}>
                  <i className="bi bi-pencil-fill"></i>
                </button>
                <button className="action-button-icon delete-button" title="Deletar" onClick={() => handleDelete(item.id)}>
                  <i className="bi bi-trash-fill"></i>
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="full-width-message">Nenhuma necessidade cadastrada.</p>
        )}
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
      
      <div className="necessidades-footer">
        <button className="action-button back-button" onClick={() => navigate(-1)}>
          <i className="bi bi-arrow-left"></i> Voltar
        </button>
      </div>
    </section>
  );
};

export default NecessidadesPage;