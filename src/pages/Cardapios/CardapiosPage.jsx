import React, { useState, useEffect, useCallback } from 'react';
import Swal from 'sweetalert2/dist/sweetalert2.all.min.js';
import { getCardapios, addCardapio, deleteCardapio } from '../../services/api';
import { API_BASE_URL } from '../../config/apiConfig';

import './CardapiosPage.css';

const CardapiosPage = () => {
    const [cardapios, setCardapios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    const fetchCardapios = useCallback(async () => {
        setLoading(true);
        try {
            const response = await getCardapios();
            // Ajuste conforme retorno do seu Laravel
            const lista = response.data?.data || response.data || [];
            setCardapios(lista);
        } catch (error) {
            console.error(error);
            Swal.fire('Erro', 'Não foi possível carregar os cardápios.', 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCardapios();
    }, [fetchCardapios]);

    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
            Swal.fire('Atenção', 'Por favor, selecione um arquivo PDF.', 'warning');
            return;
        }

        setUploading(true);
        try {
            await addCardapio(file);
            Swal.fire({
                icon: 'success',
                title: 'Upload Concluído',
                text: 'O cardápio foi adicionado com sucesso!',
                timer: 1500,
                showConfirmButton: false
            });
            fetchCardapios();
        } catch (error) {
            Swal.fire('Erro no Upload', 'Não foi possível enviar o arquivo.', 'error');
        } finally {
            setUploading(false);
            event.target.value = null;
        }
    };

    const handleDelete = (id) => {
        Swal.fire({
            title: 'Excluir Cardápio?',
            text: "Esta ação não pode ser desfeita.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#e74c3c',
            cancelButtonColor: '#95a5a6',
            confirmButtonText: 'Sim, excluir'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await deleteCardapio(id);
                    Swal.fire('Deletado!', 'O cardápio foi removido.', 'success');
                    fetchCardapios();
                } catch (error) {
                    Swal.fire('Erro', 'Falha ao excluir o cardápio.', 'error');
                }
            }
        });
    };

    const handleView = (path) => {
        let url = path;
        if (!path.startsWith('http')) {
            const cleanBaseUrl = API_BASE_URL.replace('/api', '');
            url = `${cleanBaseUrl}/uploads/pdf/${path}`; 
        }
        window.open(url, '_blank');
    };

    const formatDateName = (dateString) => {
        if (!dateString) return 'Cardápio Sem Data';
        const date = new Date(dateString);
        return `Cardápio Semanal - ${date.toLocaleDateString('pt-BR')}`;
    };

    return (
        <div className="cardapio-container">
            <div className="cardapio-layout">
                
                {/* --- HEADER PRINCIPAL (Limpo e espaçado) --- */}
                <header className="cardapio-header">
                    <h2><i className="bi bi-journal-richtext"></i> Gerenciar Cardápios</h2>
                    
                    {/* BOTÃO DE UPLOAD (Input file escondido) */}
                    <div className="upload-btn-wrapper">
                        <button className="btn-upload" disabled={uploading}>
                            {uploading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Enviando...
                                </>
                            ) : (
                                <>
                                    <i className="bi bi-cloud-upload-fill"></i> Adicionar Novo Cardápio
                                </>
                            )}
                        </button>
                        <input 
                            type="file" 
                            name="file" 
                            accept="application/pdf"
                            onChange={handleFileChange} 
                            disabled={uploading}
                        />
                    </div>
                </header>

                {/* --- LISTA DE ARQUIVOS (Com scroll) --- */}
                <main className="cardapio-list-scroll">
                    {loading ? (
                        <div style={{textAlign:'center', padding:'5rem', color:'#7f8c8d'}}>
                            <div className="spinner-border text-primary" style={{width: '3rem', height: '3rem'}} role="status"></div>
                            <p style={{marginTop: '1rem', fontSize: '1.1rem'}}>Carregando cardápios...</p>
                        </div>
                    ) : cardapios.length > 0 ? (
                        <div className="files-grid">
                            {cardapios.map(cardapio => (
                                <div key={cardapio.id} className="file-card">
                                    <i className="bi bi-file-earmark-pdf-fill file-icon"></i>
                                    
                                    <div className="file-name">
                                        {formatDateName(cardapio.created_at)}
                                    </div>
                                    
                                    <div className="file-date">
                                        <i className="bi bi-calendar3"></i> {new Date(cardapio.created_at).toLocaleDateString('pt-BR')} às {new Date(cardapio.created_at).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                                    </div>

                                    <div className="file-actions">
                                        <button 
                                            className="btn-file-action btn-view"
                                            onClick={() => handleView(cardapio.path)}
                                            title="Visualizar PDF"
                                        >
                                            <i className="bi bi-eye-fill"></i> Visualizar
                                        </button>
                                        <button 
                                            className="btn-file-action btn-delete-file" 
                                            onClick={() => handleDelete(cardapio.id)}
                                            title="Excluir Cardápio"
                                        >
                                            <i className="bi bi-trash-fill"></i> Excluir
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-files">
                            <i className="bi bi-folder2-open"></i>
                            <h3>Nenhum cardápio encontrado</h3>
                            <p>Clique no botão "Adicionar Novo Cardápio" no canto superior direito para começar.</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default CardapiosPage;