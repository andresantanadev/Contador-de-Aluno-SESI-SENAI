// /src/components/ControleProducao/ProducaoManagementView.jsx
import React, { useState, useMemo } from 'react';
import Swal from 'sweetalert2/dist/sweetalert2.all.min.js';
import { addProducao, updateProducao, deleteProducao } from '../../services/api';
import './ProducaoManagementView.css'; 

const ProducaoManagementView = ({ initialData, isLoading, onDataChange }) => {
    // Estado da barra de busca da tabela
    const [searchTerm, setSearchTerm] = useState('');

    // Filtra os dados da tabela localmente com base na busca
    const filteredData = useMemo(() => {
        return initialData.filter(item => 
            item && typeof item.nome_alimento === 'string' && item.nome_alimento.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [initialData, searchTerm]);

    const handleOpenModal = (item = null) => {
        Swal.fire({
            title: item ? 'Editar Item' : 'Adicionar Novo Item',
            width: '700px',
            html: `
                <input id="swal-nome" class="swal2-input" placeholder="Nome do Alimento" value="${item ? item.nome_alimento : ''}">
                <input id="swal-data" type="date" class="swal2-input" value="${item ? item.data_alimento : new Date().toISOString().split('T')[0]}">
                <input id="swal-quantidade" type="number" step="0.01" class="swal2-input" placeholder="Quantidade (ex: 10.50)" value="${item ? item.quantidade_alimento : ''}">
                <input id="swal-medida" class="swal2-input" placeholder="Medida (kg, g, L)" value="${item ? item.medida_alimento : ''}">
                <input id="swal-pessoas" type="number" class="swal2-input" placeholder="Pessoas" value="${item ? item.pessoas_alimento : ''}">
                <input id="swal-sobra" type="number" step="0.01" class="swal2-input" placeholder="Sobra Limpa (ex: 1.25)" value="${item ? item.sobra_limpa_alimento : ''}">
                <input id="swal-desperdicio" type="number" step="0.01" class="swal2-input" placeholder="Desperdício (ex: 0.50)" value="${item ? item.desperdicio_alimento : ''}">
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Salvar',
            confirmButtonColor: '#28a745',
            cancelButtonText: 'Cancelar',
            cancelButtonColor: '#d33',
            preConfirm: () => {
                // (Lógica do preConfirm idêntica à anterior)
                const nome = document.getElementById('swal-nome').value;
                if (!nome) {
                    Swal.showValidationMessage(`O nome do alimento é obrigatório.`);
                    return false;
                }
                const quantidadeStr = document.getElementById('swal-quantidade').value;
                const sobraStr = document.getElementById('swal-sobra').value;
                const desperdicioStr = document.getElementById('swal-desperdicio').value;
                const pessoasStr = document.getElementById('swal-pessoas').value;
                const quantidadeNum = parseFloat(quantidadeStr) || 0;
                const sobraNum = parseFloat(sobraStr) || 0;
                const desperdicioNum = parseFloat(desperdicioStr) || 0;
                const pessoas = parseInt(pessoasStr) || 0;

                return {
                    nome_alimento: nome,
                    data_alimento: document.getElementById('swal-data').value,
                    quantidade_alimento: quantidadeNum.toFixed(2),
                    medida_alimento: document.getElementById('swal-medida').value,
                    pessoas_alimento: pessoas,
                    sobra_limpa_alimento: sobraNum.toFixed(2),
                    desperdicio_alimento: desperdicioNum.toFixed(2),
                };
            },
        }).then(async (result) => {
            if (result.isConfirmed && result.value) {
                try {
                    if (item && item.id) {
                        await updateProducao(item.id, result.value);
                    } else {
                        await addProducao(result.value);
                    }
                    Swal.fire('Sucesso!', 'Operação realizada com sucesso!', 'success');
                    onDataChange(); // Chama a função do pai para recarregar os dados
                } catch (error) {
                    Swal.fire('Erro!', error.message || 'Não foi possível salvar o item.', 'error');
                }
            }
        });
    };

    const handleDelete = (id) => {
        Swal.fire({
            title: 'Tem certeza?',
            text: "Você não poderá reverter esta ação!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Sim, deletar!',
            cancelButtonText: 'Cancelar',
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await deleteProducao(id);
                    Swal.fire('Deletado!', 'O item foi removido.', 'success');
                    onDataChange(); // Chama a função do pai para recarregar os dados
                } catch (error) {
                    Swal.fire('Erro!', 'Não foi possível deletar o item.', 'error');
                }
            }
        });
    };

    return (
        <div className="producao-management-view">
            
            {/* ======================================================= */}
            {/* ====== AQUI ESTÁ A BARRA DE BUSCA E O BOTÃO ====== */}
            {/* ======================================================= */}
            <div className="producao-header">

            </div>
            {/* ======================================================= */}
            
            <div className="table-wrapper">
                <table className="producao-table">
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th>Data</th>
                            <th>Quantidade</th>
                            <th>Medida</th>
                            <th>Pessoas</th>
                            <th>Sobra Limpa</th>
                            <th>Desperdício</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan="8" style={{ textAlign: 'center' }}>Carregando dados...</td></tr>
                        ) : filteredData.length > 0 ? (
                            filteredData.map(item => (
                                <tr key={item.id}>
                                    <td>{item.nome_alimento}</td>
                                    <td>{new Date(item.data_alimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td>
                                    <td>{item.quantidade_alimento}</td>
                                    <td>{item.medida_alimento}</td>
                                    <td>{item.pessoas_alimento}</td>
                                    <td>{item.sobra_limpa_alimento}</td>
                                    <td>{item.desperdicio_alimento}</td>
                                    <td className="actions-cell">
                                        <button className="action-button edit-button" title="Editar" onClick={() => handleOpenModal(item)}>
                                            <i className="bi bi-pencil-fill"></i>
                                        </button>
                                        <button className="action-button delete-button" title="Deletar" onClick={() => handleDelete(item.id)}>
                                            <i className="bi bi-trash-fill"></i>
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan="8" style={{ textAlign: 'center' }}>Nenhum item encontrado.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ProducaoManagementView;