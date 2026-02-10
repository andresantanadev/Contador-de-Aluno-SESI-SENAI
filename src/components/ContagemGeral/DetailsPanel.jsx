// /src/components/ContagemGeral/DetailsPanel.jsx
import React, { useState, useEffect } from 'react';
import './DetailsPanel.css';

export const DetailsPanel = ({ details, loading }) => {
    const [activeTab, setActiveTab] = useState('contagens');

    // Volta para contagens sempre que a data muda
    useEffect(() => {
        setActiveTab('contagens');
    }, [details]);

    if (loading) {
        return (
            <div className="details-panel-loading">
                <div className="spinner"></div>
                <span>Processando dados do dia...</span>
            </div>
        );
    }

    if (!details) {
        return (
            <div className="details-panel-empty">
                <i className="bi bi-calendar-check" style={{ fontSize: '2.5rem', opacity: 0.3 }}></i>
                <h3>Escolha uma data</h3>
                <p>Selecione um dia com contagem no calendário ao lado.</p>
            </div>
        );
    }

    const { date, totalGeralContagens, contagens, necessidades } = details;
    const hasNec = [...necessidades.keys()].length > 0;

    return (
        <div className="details-panel-content">
            <h3 className="details-date">
                {date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </h3>
            
            <div className="details-toggle">
                <button className={`toggle-btn ${activeTab === 'contagens' ? 'active' : ''}`} onClick={() => setActiveTab('contagens')}>
                    Contagens
                </button>
                <button className={`toggle-btn ${activeTab === 'necessidades' ? 'active' : ''}`} onClick={() => setActiveTab('necessidades')}>
                    Necessidades
                </button>
            </div>

            {/* ABA: CONTAGENS */}
            <div className={`details-tab-content ${activeTab === 'contagens' ? 'active' : ''}`}>
                <div className="modal-total-card">
                    <span>Total de Alunos</span>
                    <strong>{totalGeralContagens}</strong>
                </div>
                
                <div className="modal-list scrollable">
                    {contagens.length > 0 ? (
                        contagens.map((cat, idx) => (
                            <div key={idx} className="categoria-section" style={{ marginBottom: '1.5rem' }}>
                                <h5 className="modal-categoria-header">{cat.nome_categoria}</h5>
                                {cat.turmas.map((t, tidx) => (
                                    <div className="modal-list-item" key={tidx}>
                                        <span>{t.nome_turma}</span>
                                        <strong>{t.qtd_contagem}</strong>
                                    </div>
                                ))}
                            </div>
                        ))
                    ) : (
                        <p className="no-data-msg">Nenhum registro nesta data.</p>
                    )}
                </div>
            </div>

            {/* ABA: NECESSIDADES */}
            <div className={`details-tab-content ${activeTab === 'necessidades' ? 'active' : ''}`}>
                <div className="modal-list scrollable">
                    {hasNec ? (
                        [...necessidades.keys()].map((necNome, idx) => (
                            <div key={idx} className="necessidade-section">
                                <h4 className="modal-turma-header">{necNome}</h4>
                                {necessidades.get(necNome).map((aluno, aidx) => (
                                    <details className="modal-accordion" key={aidx}>
                                        <summary>
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <strong>{aluno.nome}</strong>
                                                <small style={{ opacity: 0.7 }}>RM: {aluno.rm || 'N/A'}</small>
                                            </div>
                                            <i className="bi bi-chevron-down"></i>
                                        </summary>
                                        <div className="modal-accordion-content">
                                            <div dangerouslySetInnerHTML={{ __html: aluno.descricao }} />
                                        </div>
                                    </details>
                                ))}
                            </div>
                        ))
                    ) : (
                        <p className="no-data-msg">Nenhuma necessidade especial registrada para hoje.</p>
                    )}
                </div>
            </div>
        </div>
    );
};