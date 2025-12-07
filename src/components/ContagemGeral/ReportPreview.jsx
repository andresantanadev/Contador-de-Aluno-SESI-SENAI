// /src/components/ContagemGeral/ReportPreview.jsx
import React, { useMemo } from 'react';
import { formatFriendlyDate, formatFriendlyTime } from './utils';
import './ReportPreview.css'; 

// Importe sua logo (ajuste o caminho se necessário)
import logo from '../../assets/img/logo.png'; 

// Componente de Tabela de Contagens
const ContagensTable = ({ data }) => (
    <table className="report-table">
        <thead>
            <tr>
                <th>Categoria</th>
                <th>Turma</th>
                <th>Quantidade</th>
            </tr>
        </thead>
        <tbody>
            {data.map((item) => (
                <tr key={item.id}>
                    <td>{item.turma.categoria.nome_categoria}</td>
                    <td>{item.turma.nome_turma}</td>
                    <td>{item.qtd_contagem}</td>
                </tr>
            ))}
        </tbody>
    </table>
);

// Componente de Tabela de Necessidades
const NecessidadesTable = ({ data }) => (
    <table className="report-table">
        <thead>
            <tr>
                <th>Aluno</th>
                <th>RM</th>
                <th>Necessidade</th>
                <th>Horário</th>
            </tr>
        </thead>
        <tbody>
            {data.map((item) => (
                <tr key={item.id}>
                    <td>{item.aluno.nome}</td>
                    <td>{item.aluno.rm}</td>
                    <td>{item.aluno.necessidade}</td>
                    <td>{formatFriendlyTime(item.data_hora_contagem)}</td>
                </tr>
            ))}
        </tbody>
    </table>
);


const ReportPreview = ({ data, loading, title, dataType }) => {

    // Agrupa os dados por dia
    const groupedData = useMemo(() => {
        if (!data) return [];

        const map = new Map();

        // Agrupa Contagens
        if (dataType === 'tudo' || dataType === 'contagens') {
            data.contagens.forEach(item => {
                const dateStr = item.data_contagem;
                if (!map.has(dateStr)) map.set(dateStr, { contagens: [], necessidades: [] });
                map.get(dateStr).contagens.push(item);
            });
        }

        // Agrupa Necessidades
         if (dataType === 'tudo' || dataType === 'necessidades') {
            data.necessidades.forEach(item => {
                const dateStr = item.data_hora_contagem.split('T')[0];
                if (!map.has(dateStr)) map.set(dateStr, { contagens: [], necessidades: [] });
                map.get(dateStr).necessidades.push(item);
            });
        }

        // Ordena por data
        return [...map.entries()].sort((a, b) => new Date(a[0]) - new Date(b[0]));

    }, [data, dataType]);

    // Define o Título principal com base no Tipo de Dado
    const mainTitle = () => {
        switch (dataType) {
            case 'contagens': return 'Relatório de Contagens (Geral)';
            case 'necessidades': return 'Relatório de Necessidades (NES)';
            default: return 'Relatório de Contagens'; // "Tudo"
        }
    };


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
                    <p>Selecione os filtros e clique em "Gerar Relatório" para visualizar os dados.</p>
                </div>
            );
        }

         if (groupedData.length === 0) {
             return (
                <div className="report-centered-state empty">
                    <i className="bi bi-cloud-drizzle"></i>
                    <p>Nenhum dado encontrado para o período e filtros selecionados.</p>
                </div>
            );
        }

        // Renderiza os dados agrupados por dia
        return (
            <div className="report-body">
                {groupedData.map(([date, dailyData]) => (
                    <div key={date} className="report-day-group">
                        <h3 className="report-day-header">{formatFriendlyDate(date)}</h3>
                        
                        {(dataType === 'tudo' || dataType === 'contagens') && dailyData.contagens.length > 0 && (
                            <>
                                <h4 className="report-table-title">Contagens (Geral)</h4>
                                <ContagensTable data={dailyData.contagens} />
                            </>
                        )}
                        
                        {(dataType === 'tudo' || dataType === 'necessidades') && dailyData.necessidades.length > 0 && (
                            <>
                                <h4 className="report-table-title">Necessidades (NES)</h4>
                                <NecessidadesTable data={dailyData.necessidades} />
                            </>
                        )}
                    </div>
                ))}
            </div>
        );
    };


    return (
        <div className="report-page-a4" id="report-page">
            {/* 1. Cabeçalho do Relatório (Baseado na sua imagem) */}
            <div className="report-header-v2">
                <h2 className="report-title-v2">{mainTitle()}</h2>
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

export default ReportPreview;