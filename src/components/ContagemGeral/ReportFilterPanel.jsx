// /src/components/ContagemGeral/ReportFilterPanel.jsx
import React from 'react';
import html2pdf from 'html2pdf.js'; // <--- 1. IMPORTAÇÃO DO HTML2PDF
import { MONTHS } from './utils'; 
import './ReportFilterPanel.css'; 

const ReportFilterPanel = ({
    reportType,
    dataType,
    onDataTypeChange,
    filters,
    onFilterChange,
    onGenerate,
    onDownload, // Vamos manter a prop, mas usaremos a função interna
    loading,
    reportData 
}) => {

    const handleFilter = (key, value) => {
        onFilterChange(prev => ({ ...prev, [key]: value }));
    };

    // --- 2. NOVA FUNÇÃO PARA BAIXAR O PDF ---
    const handleDownloadPDF = () => {
        // Busca o elemento visual (tabela/relatório) pelo ID definido no ReportPreview.jsx
        const element = document.getElementById('report-page');

        if (!element) {
            alert('Erro: O relatório não foi encontrado na tela.');
            return;
        }

        // Configurações do arquivo PDF
        const opt = {
            margin:       [10, 10, 10, 10],
            filename:     `Relatorio_${reportType}_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true }, // Scale 2 melhora a resolução
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        // Gera e baixa o PDF
        html2pdf().set(opt).from(element).save();
    };
    // ----------------------------------------

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
            case 'semanal':
                 return (
                    <div className="filter-group">
                        <label>Data Início (Semana)</label>
                        <input
                            type="date"
                            value={filters.startDate}
                            onChange={(e) => handleFilter('startDate', e.target.value)}
                        />
                         <label>Data Fim (Semana)</label>
                        <input
                            type="date"
                            value={filters.endDate}
                            onChange={(e) => handleFilter('endDate', e.target.value)}
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
        <div className="report-filter-panel">
            <div className="filter-section">
                <h4 className="filter-section-title">Filtros de Período</h4>
                {renderFilters()}
            </div>
            <div className="filter-section">
                 <h4 className="filter-section-title">Tipo de Dado</h4>
                <div className="filter-group">
                    <select
                        value={dataType}
                        onChange={(e) => onDataTypeChange(e.target.value)}
                    >
                        <option value="tudo">Tudo (Geral + NES)</option>
                        <option value="contagens">Contagens (Geral)</option>
                        <option value="necessidades">Necessidades (NES)</option>
                    </select>
                </div>
            </div>
            <div className="report-actions">
                <button 
                    className="btn-gerar" 
                    onClick={onGenerate} 
                    disabled={loading}
                >
                    {loading ? 'Gerando...' : 'Gerar Relatório'}
                </button>
                
                {/* 3. AQUI FOI ALTERADO: Chama a função handleDownloadPDF */}
                <button 
                    className="btn-baixar" 
                    onClick={handleDownloadPDF} 
                    disabled={!reportData} // Mantivemos a lógica: só habilita se tiver dados
                >
                    <i className="bi bi-download"></i> Baixar PDF
                </button>
            </div>
        </div>
    );
};

export default ReportFilterPanel;