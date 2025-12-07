// /src/components/ContagemGeral/DetailsPanel.jsx
import React, { useState, useEffect } from 'react';
import './DetailsPanel.css'; // Mova os estilos relevantes do DetailsPanel para cá

// Componente do Painel de Detalhes
export const DetailsPanel = ({ details, loading }) => {
    const [activeTab, setActiveTab] = useState('contagens');

    useEffect(() => {
        setActiveTab('contagens');
    }, [details]);

    if (loading) {
        return (
            <div className="details-panel-loading">
                <div className="spinner"></div>
                <span>Carregando detalhes...</span>
            </div>
        );
    }

    if (!details) {
        return (
            <div className="details-panel-empty">
                <h3>Selecione um Dia</h3>
                <p>Clique em um dia com contagens para ver os detalhes.</p>
            </div>
        );
    }

    const { date, totalGeralContagens, contagens, necessidades } = details;

    return (
        <div className="details-panel-content">
            <h3 className="details-date">{date.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h3>
            
            <div className="details-toggle">
                <button
                    className={`toggle-btn ${activeTab === 'contagens' ? 'active' : ''}`}
                    onClick={() => setActiveTab('contagens')}
                >
                    Contagens
                </button>
                <button
                    className={`toggle-btn ${activeTab === 'necessidades' ? 'active' : ''}`}
                    onClick={() => setActiveTab('necessidades')}
                >
                    Necessidades
                </button>
            </div>

            {/* Aba de Contagens */}
            <div className={`details-tab-content ${activeTab === 'contagens' ? 'active' : ''}`}>
                <div className="modal-total-card">
                    <span>Total Geral</span>
                    <strong>{totalGeralContagens}</strong>
                </div>
                <h4 className="modal-section-header">Detalhado por Categoria</h4>
                <div className="modal-list scrollable">
                    {contagens.length > 0 ? (
                        contagens.map((cat, indexCat) => (
                            <React.Fragment key={indexCat}>
                                <h5 className="modal-categoria-header">{cat.nome_categoria}</h5>
                                {cat.turmas && cat.turmas.length > 0 ? (
                                    cat.turmas.map((turma, indexTurma) => (
                                        <div className="modal-list-item" key={indexTurma}>
                                            <span>{turma.nome_turma}</span>
                                            <strong>{turma.qtd_contagem}</strong>
                                        </div>
                                    ))
                                ) : (
                                    <p className="modal-no-data">Nenhuma turma nesta categoria.</p>
                                )}
                            </React.Fragment>
                        ))
                    ) : (
                        <p className="modal-no-data">Nenhuma contagem detalhada para este dia.</p>
                    )}
                </div>
            </div>

            {/* Aba de Necessidades */}
            <div className={`details-tab-content ${activeTab === 'necessidades' ? 'active' : ''}`}>
                <div className="modal-list scrollable">
                    {[...necessidades.keys()].length > 0 ? (
                        [...necessidades.keys()].map((necNome, indexNec) => (
                            <React.Fragment key={indexNec}>
                                <h4 className="modal-turma-header">{necNome}</h4>
                                {necessidades.get(necNome).map((aluno, indexAluno) => (
                                    <details className="modal-accordion" key={indexAluno}>
                                        <summary>
                                            {aluno.nome}
                                            <i className="bi bi-chevron-down"></i>
                                        </summary>
                                        <div className="modal-accordion-content">
                                            <span dangerouslySetInnerHTML={{ __html: aluno.descricao }} />
                                        </div>
                                    </details>
                                ))}
                            </React.Fragment>
                        ))
                    ) : (
                        <p className="modal-no-data">Nenhum aluno com necessidade contadado neste dia.</p>
                    )}
                </div>
            </div>
        </div>
    );
};