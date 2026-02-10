import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2/dist/sweetalert2.all.min.js';
import { getLatestCardapio } from '../../services/api';
import { API_BASE_URL } from '../../config/apiConfig';

import './ViewCardapioPage.css';

const ViewCardapioPage = () => {
    const [pdfUrl, setPdfUrl] = useState(null);
    const [cardapioDate, setCardapioDate] = useState(null);
    const [loading, setLoading] = useState(true);

    const loadCardapio = async () => {
        setLoading(true);
        try {
            const latestCardapio = await getLatestCardapio();
            
            if (latestCardapio && latestCardapio.path) {
                // Monta a URL completa do PDF
                let url = latestCardapio.path;
                if (!url.startsWith('http')) {
                    const cleanBaseUrl = API_BASE_URL.replace('/api', '');
                    url = `${cleanBaseUrl}/uploads/${latestCardapio.path}`;
                }
                setPdfUrl(url);
                setCardapioDate(latestCardapio.created_at);
            } else {
                setPdfUrl(null);
            }
        } catch (error) {
            console.error("Erro ao carregar cardápio:", error);
            Swal.fire({
                icon: 'error',
                title: 'Ops!',
                text: 'Não foi possível carregar o cardápio. Tente novamente.',
                confirmButtonColor: '#d33'
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCardapio();
    }, []);

    // Formata a data para exibição bonita
    const formatData = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    };

    return (
        <section className="view-cardapio-container">
            <div className="view-cardapio-card">
                
                {/* Header */}
                <header className="view-cardapio-header">
                    <h2>
                        <i className="bi bi-journal-richtext" style={{color: '#e67e22'}}></i> 
                        Cardápio Semanal
                    </h2>
                    
                    {cardapioDate && (
                        <div className="cardapio-date-badge">
                            <i className="bi bi-clock-history"></i>
                            Atualizado em: {new Date(cardapioDate).toLocaleDateString('pt-BR')}
                        </div>
                    )}
                </header>

                {/* Conteúdo Principal */}
                <div className="pdf-viewer-container">
                    {loading ? (
                        <div className="loading-state">
                            <div className="spinner-border text-primary" style={{width: '3rem', height: '3rem'}} role="status"></div>
                            <p style={{marginTop: '1rem', fontSize: '1.1rem'}}>Buscando cardápio mais recente...</p>
                        </div>
                    ) : pdfUrl ? (
                        <iframe 
                            src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                            title="Visualizador de Cardápio"
                            className="pdf-iframe"
                            width="100%"
                            height="100%"
                        />
                    ) : (
                        <div className="empty-state-cardapio">
                            <i className="bi bi-file-earmark-x"></i>
                            <h3>Nenhum cardápio disponível</h3>
                            <p>A nutricionista ainda não disponibilizou o cardápio desta semana.</p>
                            <button className="btn-reload" onClick={loadCardapio}>
                                <i className="bi bi-arrow-clockwise"></i> Tentar Novamente
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default ViewCardapioPage;