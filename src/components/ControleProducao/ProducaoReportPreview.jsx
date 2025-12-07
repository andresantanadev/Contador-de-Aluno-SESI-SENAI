// /src/components/ControleProducao/ProducaoReportPreview.jsx
import React, { useMemo } from 'react';
// Importa o formatador de data da pasta utils da ContagemGeral
import { formatFriendlyDate } from '../ContagemGeral/utils'; 
import './ProducaoReportPreview.css'; // (CSS abaixo)

// Importe sua logo (use o caminho da imagem de header de produção)
import logo from '../../assets/img/logo.png'; // (Ajuste se o caminho estiver errado)

// Componente de Tabela de Produção
const ProducaoTable = ({ data }) => (
    <table className="report-table">
        <thead>
            <tr>
                <th>Nome</th>
                <th>Qtd.</th>
                <th>Medida</th>
                <th>Pessoas</th>
                <th>Sobra Limpa</th>
                <th>Desperdício</th>
            </tr>
        </thead>
        <tbody>
            {data.map((item) => (
                <tr key={item.id}>
                    <td>{item.nome_alimento}</td>
                    <td>{item.quantidade_alimento}</td>
                    <td>{item.medida_alimento}</td>
                    <td>{item.pessoas_alimento}</td>
                    <td>{item.sobra_limpa_alimento}</td>
                    <td>{item.desperdicio_alimento}</td>
                </tr>
            ))}
        </tbody>
    </table>
);


const ProducaoReportPreview = ({ data, loading, title }) => {

    // Agrupa os dados por dia
    const groupedData = useMemo(() => {
        if (!data) return [];
        const map = new Map();
        data.forEach(item => {
            const dateStr = item.data_alimento; // Chave de agrupamento
            if (!map.has(dateStr)) map.set(dateStr, []);
            map.get(dateStr).push(item);
        });
        // Ordena por data (convertendo para Date para garantir a ordem)
        return [...map.entries()].sort((a, b) => new Date(a[0]) - new Date(b[0]));
    }, [data]);

    const renderContent = () => {
        if (loading) {
            return (
                <div className="report-centered-state">
                    <div className="spinner"></div>
                    <span>Gerando visualização...</span>
                </div>
            );
        }
        
        if (!data) {
            return (
                <div className="report-centered-state empty">
                    <i className="bi bi-search-heart"></i>
                    <p>Selecione os filtros e clique em "Gerar Relatório".</p>
                </div>
            );
        }

         if (groupedData.length === 0) {
             return (
                <div className="report-centered-state empty">
                    <i className="bi bi-cloud-drizzle"></i>
                    <p>Nenhum dado encontrado para os filtros selecionados.</p>
                </div>
            );
        }

        // Renderiza os dados agrupados por dia
        return (
            <div className="report-body">
                {groupedData.map(([date, dailyData]) => (
                    <div key={date} className="report-day-group">
                        <h3 className="report-day-header">{formatFriendlyDate(date)}</h3>
                        <ProducaoTable data={dailyData} />
                    </div>
                ))}
            </div>
        );
    };


    return (
        <div className="report-page-a4" id="report-page">
            {/* 1. Cabeçalho do Relatório (Baseado na sua imagem) */}
            <div className="report-header-v2">
                <h2 className="report-title-v2">Controle de Produção e Consumo</h2>
                <img src={logo} alt="Menu Solutions Logo" className="report-logo-v2" />
            </div>
            <div className="report-header-line"></div>

            {/* 2. Informações do Filtro (Subtítulo) */}
            <div className="report-info">
                <strong>{title}</strong>
            </div>

            {/* 3. Conteúdo (Tabelas) */}
            {renderContent()}
        </div>
    );
};

export default ProducaoReportPreview;