// /src/pages/ContagemGeral/ContagemGeralPage.jsx
import React, { useState } from 'react';
import CalendarView from '../../components/ContagemGeral/CalendarView';
import ReportView from '../../components/ContagemGeral/ReportView';
import './ContagemGeralPage.css'; // Mantenha os estilos principais/comuns aqui

const ContagemGeralPage = () => {
    const [viewMode, setViewMode] = useState('calendar'); // 'calendar' ou 'reports'

    return (
        <section className="contagem-geral-container-custom">
            
            {/* 1. Navegação Principal */}
            <div className="main-view-toggle">
                <button
                    className={`toggle-btn ${viewMode === 'calendar' ? 'active' : ''}`}
                    onClick={() => setViewMode('calendar')}
                >
                    <i className="bi bi-calendar-week"></i> Calendário
                </button>
                <button
                    className={`toggle-btn ${viewMode === 'reports' ? 'active' : ''}`}
                    onClick={() => setViewMode('reports')}
                >
                    <i className="bi bi-file-earmark-text"></i> Relatórios
                </button>
            </div>

            {/* 2. Renderização Condicional da View */}
            <div className="main-view-content">
                {viewMode === 'calendar' ? (
                    <CalendarView />
                ) : (
                    <ReportView />
                )}
            </div>

        </section>
    );
};

export default ContagemGeralPage;