// /src/components/ContagemGeral/ReportFilters.jsx
import React from 'react';

// (Você pode querer mover MONTHS para um arquivo utils também)
const MONTHS = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const ReportFilters = ({
    reportType,
    onReportTypeChange,
    filters,
    onFilterChange,
    onGenerate,
    onDownload,
    loading
}) => {

    const handleFilter = (key, value) => {
        onFilterChange(prev => ({ ...prev, [key]: value }));
    };

    const renderFilters = () => {
        switch (reportType) {
            case 'diario':
                return (
                    <div className="filter-group">
                        <label>Selecione o Dia</label>
                        <input
                            type="date"
                            value={filters.date}
                            onChange={(e) => handleFilter('date', e.target.value)}
                        />
                    </div>
                );
            case 'mensal':
                return (
                    <div className="filter-group">
                        <label>Selecione o Mês</label>
                        <select
                            value={filters.month}
                            onChange={(e) => handleFilter('month', parseInt(e.target.value))}
                        >
                            {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
                        </select>
                        <label>Ano</label>
                        <input
                            type="number"
                            value={filters.year}
                            onChange={(e) => handleFilter('year', parseInt(e.target.value))}
                            className="input-ano"
                        />
                    </div>
                );
            case 'anual':
                 return (
                    <div className="filter-group">
                        <label>Selecione o Ano</label>
                         <input
                            type="number"
                            value={filters.year}
                            onChange={(e) => handleFilter('year', parseInt(e.target.value))}
                        />
                    </div>
                );
            case 'personalizado':
                return (
                    <div className="filter-group">
                        <label>Data Início</label>
                        <input
                            type="date"
                            value={filters.startDate}
                            onChange={(e) => handleFilter('startDate', e.target.value)}
                        />
                         <label>Data Fim</label>
                        <input
                            type="date"
                            value={filters.endDate}
                            onChange={(e) => handleFilter('endDate', e.target.value)}
                        />
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="report-filters-container">
            <h4>Tipo de Relatório</h4>
            <div className="report-type-list">
                <button
                    className={reportType === 'diario' ? 'active' : ''}
                    onClick={() => onReportTypeChange('diario')}
                >
                    Diário
                </button>
                 <button
                    className={reportType === 'mensal' ? 'active' : ''}
                    onClick={() => onReportTypeChange('mensal')}
                >
                    Mensal
                </button>
                 <button
                    className={reportType === 'anual' ? 'active' : ''}
                    onClick={() => onReportTypeChange('anual')}
                >
                    Anual
                </button>
                <button
                    className={reportType === 'personalizado' ? 'active' : ''}
                    onClick={() => onReportTypeChange('personalizado')}
                >
                    Personalizado
                </button>
                {/* Adicione Semanal se desejar */}
            </div>

            <hr />

            <h4>Filtros</h4>
            {renderFilters()}

            {/* Filtro de Tipo de Dado (Contagens, Necessidades, Tudo) */}
            <div className="filter-group">
                <label>Tipo de Dado</label>
                <select
                    value={filters.dataType}
                    onChange={(e) => handleFilter('dataType', e.target.value)}
                >
                    <option value="tudo">Tudo</option>
                    <option value="contagens">Apenas Contagens</option>
                    <option value="necessidades">Apenas Necessidades</option>
                </select>
            </div>

            <hr />

            <div className="report-actions">
                <button 
                    className="btn-gerar" 
                    onClick={onGenerate} 
                    disabled={loading}
                >
                    {loading ? 'Gerando...' : 'Gerar Relatório'}
                </button>
                <button 
                    className="btn-baixar" 
                    onClick={onDownload}
                >
                    <i className="bi bi-download"></i> Baixar Relatório
                </button>
            </div>
        </div>
    );
};

export default ReportFilters;