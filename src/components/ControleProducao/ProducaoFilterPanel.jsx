// /src/components/ControleProducao/ProducaoFilterPanel.jsx
import React from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Swal from 'sweetalert2/dist/sweetalert2.all.min.js'; // <-- ADICIONE ESTA LINHA
import './ProducaoFilterPanel.css'; 

// Função de Download do PDF (movida para cá)
const handleDownloadPdf = (data, title, logo) => {
    if (!data) {
        // Agora o Swal está definido e vai funcionar
        Swal.fire('Atenção', 'Gere um relatório antes de baixar.', 'info');
        return;
    }
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const today = new Date().toLocaleDateString('pt-BR');

    const tableData = data.map(item => [
        item.nome_alimento,
        new Date(item.data_alimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' }),
        item.quantidade_alimento,
        item.medida_alimento,
        item.pessoas_alimento,
        item.sobra_limpa_alimento,
        item.desperdicio_alimento,
    ]);

    autoTable(doc, {
        head: [['Nome', 'Data', 'Qtd.', 'Medida', 'Pessoas', 'Sobra', 'Desperdício']],
        body: tableData,
        startY: 40,
        theme: 'grid',
        headStyles: {
            fillColor: [139, 0, 0], 
            textColor: [255, 255, 255],
            fontStyle: 'bold',
        },
        alternateRowStyles: {
            fillColor: [248, 249, 250]
        },
        didDrawPage: function (data) {
            const margin = 15;
            const logoWidth = 40;
            const logoHeight = 10;
            const verticalCenter = 20;

            doc.setFontSize(20);
            doc.setTextColor(51, 51, 51);
            doc.setFont('helvetica', 'bold');
            doc.text('Relatório de Produção e Consumo', margin, verticalCenter, { baseline: 'bottom' });
            
            const logoX = pageWidth - margin - logoWidth;
            const logoY = verticalCenter - logoHeight; 
            try {
                doc.addImage(logo, 'PNG', logoX, logoY, logoWidth, logoHeight);
            } catch(e) { console.error("Erro ao adicionar logo no PDF:", e); }
            
            doc.setDrawColor(220, 220, 220);
            doc.setLineWidth(0.5);
            doc.line(margin, verticalCenter + 5, pageWidth - margin, verticalCenter + 5);
            
            doc.setFontSize(12);
            doc.setTextColor(100);
            doc.setFont('helvetica', 'normal');
            doc.text(title, margin, verticalCenter + 12);

            // Rodapé
            const pageCount = doc.internal.getNumberOfPages();
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.setFont('helvetica', 'normal');
            doc.text('Menu Solutions', margin, pageHeight - 10);
            doc.text(`Emitido em: ${today}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
            doc.text(`Página ${data.pageNumber} de ${pageCount}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
        },
    });

    doc.save(`Producao_Consumo_${today.replace(/\//g, '-')}.pdf`);
};


const ProducaoFilterPanel = ({
    filters,
    onFilterChange,
    onGenerate,
    loading,
    reportData,
    logo,
    isReportMode
}) => {

    const handleFilter = (key, value) => {
        onFilterChange(prev => ({ ...prev, [key]: value }));
    };

    return (
        <div className={`producao-filter-panel ${isReportMode ? 'visible' : 'hidden'}`}>
            {/* Seção 1: Filtros Dinâmicos */}
            <div className="filter-section">
                <h4 className="filter-section-title">Filtros de Relatório</h4>
                <div className="filter-group">
                    <label>Data Início</label>
                    <input
                        type="date"
                        value={filters.startDate}
                        onChange={(e) => handleFilter('startDate', e.target.value)}
                    />
                </div>
                <div className="filter-group">
                    <label>Data Fim</label>
                    <input
                        type="date"
                        value={filters.endDate}
                        onChange={(e) => handleFilter('endDate', e.target.value)}
                    />
                </div>
            </div>

            {/* Seção 2: Busca por Nome */}
            <div className="filter-section">
                <div className="filter-group">
                    <label>Buscar por Nome</label>
                    <input
                        type="text"
                        value={filters.searchTerm}
                        onChange={(e) => handleFilter('searchTerm', e.target.value)}
                        placeholder="Ex: Arroz"
                    />
                </div>
            </div>
            
            {/* Seção 3: Ações */}
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
                    onClick={() => handleDownloadPdf(reportData, "Relatório Filtrado", logo)}
                    disabled={!reportData} 
                >
                    <i className="bi bi-download"></i> Baixar PDF
                </button>
            </div>
        </div>
    );
};

export default ProducaoFilterPanel;