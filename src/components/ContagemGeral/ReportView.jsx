// /src/components/ContagemGeral/ReportView.jsx
import React, { useState, useCallback, useMemo } from 'react';
import Swal from 'sweetalert2/dist/sweetalert2.all.min.js';
import ReportTypeSidebar from './ReportTypeSidebar';
import ReportFilterPanel from './ReportFilterPanel';
import ReportPreview from './ReportPreview';
import { 
    getContagensPorRange, 
    getAlunosNesPorData 
} from '../../services/api';
// Importa as novas funções UTC
import { toISODateString, parseISODateAsUTC, MONTHS, formatFriendlyDate } from './utils'; // <-- CORREÇÃO AQUI
import './ReportView.css';

/**
 * Retorna um array de strings de data (AAAA-MM-DD) para um range.
 * Usa UTC para ser à prova de fuso horário.
 */
const getDaysInRange = (startDate, endDate) => {
    const days = [];
    // Converte as strings de data para objetos Date em UTC
    let currentDate = parseISODateAsUTC(startDate);
    const lastDate = parseISODateAsUTC(endDate);

    // Loop de segurança para no máximo 366 dias
    for (let i = 0; i <= 366 && currentDate <= lastDate; i++) {
        // Converte o Date UTC de volta para string AAAA-MM-DD
        days.push(toISODateString(currentDate)); 
        // Avança o dia em UTC
        currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }
    return days;
};


const ReportView = () => {
    const [reportType, setReportType] = useState('diario');
    const [dataType, setDataType] = useState('tudo'); 
    
    // Define os filtros iniciais baseados em UTC
    const initialState = useMemo(() => {
        const today = new Date();
        return {
            date: toISODateString(today),
            startDate: toISODateString(today),
            endDate: toISODateString(today),
            month: today.getUTCMonth(), // Mês em UTC (0-11)
            year: today.getUTCFullYear(), // Ano em UTC
        };
    }, []);

    const [filters, setFilters] = useState(initialState);
    
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [currentReportTitle, setCurrentReportTitle] = useState("Nenhum relatório gerado");

    const handleGenerateReport = useCallback(async () => {
        setLoading(true);
        setReportData(null);
        
        let startDate, endDate;
        let title = "";

        // 1. Define o range de datas e o título (Tudo em UTC)
        switch (reportType) {
            case 'diario':
                startDate = filters.date;
                endDate = filters.date;
                title = `Relatório do Dia: ${formatFriendlyDate(startDate)}`; // <-- Erro estava aqui
                break;
            case 'mensal':
                startDate = toISODateString(new Date(Date.UTC(filters.year, filters.month, 1)));
                endDate = toISODateString(new Date(Date.UTC(filters.year, filters.month + 1, 0)));
                title = `Relatório Mensal: ${MONTHS[filters.month]}/${filters.year}`;
                break;
            case 'anual':
                 startDate = toISODateString(new Date(Date.UTC(filters.year, 0, 1)));
                 endDate = toISODateString(new Date(Date.UTC(filters.year, 11, 31)));
                 title = `Relatório Anual: ${filters.year}`;
                break;
            case 'personalizado':
                startDate = filters.startDate;
                endDate = filters.endDate;
                title = `Relatório Personalizado: ${formatFriendlyDate(startDate)} a ${formatFriendlyDate(endDate)}`; // <-- Erro estava aqui
                break;
            // TODO: Adicionar "semanal"
            default:
                startDate = filters.date;
                endDate = filters.date;
        }

        setCurrentReportTitle(title);

        try {
            // 2. Busca os dados e APLICA O FILTRO MANUALMENTE
            
            // Pega os dias exatos que queremos (ex: ["2025-11-06"])
            const validDays = getDaysInRange(startDate, endDate);
            const validDaysSet = new Set(validDays); // (Para um filtro rápido)

            let contagensResData = [];
            let necResData = []; 

            // --- 1. Busca CONTAGENS (Geral) ---
            if (dataType === 'contagens' || dataType === 'tudo') {
                // Busca TODOS os dados (já que o filtro da API está quebrado)
                const unfilteredContagensRes = await getContagensPorRange('2000-01-01', '2100-01-01');
                
                // FILTRO MANUAL (WORKAROUND):
                contagensResData = (unfilteredContagensRes.data || []).filter(contagem => 
                    validDaysSet.has(contagem.data_contagem)
                );
            }
            
            // --- 2. Busca NECESSIDADES (NES) ---
            if (dataType === 'necessidades' || dataType === 'tudo') {
                // Busca TODOS os dados NES (passando uma data qualquer, já que a API ignora)
                const unfilteredNesRes = await getAlunosNesPorData(initialState.date);
                
                // FILTRO MANUAL (WORKAROUND):
                necResData = (unfilteredNesRes.data || []).filter(nes => {
                    const nesDate = nes.data_hora_contagem.split('T')[0];
                    return validDaysSet.has(nesDate);
                });
            }
            
            setReportData({
                contagens: contagensResData, // Passa o array filtrado
                necessidades: necResData,  // Passa o array filtrado
            });

        } catch (error) {
            console.error("Erro ao gerar relatório:", error);
            Swal.fire('Erro!', 'Não foi possível gerar os dados do relatório.', 'error');
        } finally {
            setLoading(false);
        }
    }, [filters, reportType, dataType, initialState.date]); // Adiciona initialState.date

    const handleDownloadReport = () => {
        Swal.fire('Em breve!', 'A funcionalidade de download (PDF) será implementada aqui.', 'info');
    };

    return (
        <div className="report-main-grid-v2">
            <ReportTypeSidebar
                activeType={reportType}
                onTypeChange={setReportType}
            />
            <div className="report-preview-area">
                <ReportPreview
                    data={reportData}
                    loading={loading}
                    title={currentReportTitle}
                    dataType={dataType}
                />
            </div>
            <ReportFilterPanel
                reportType={reportType}
                dataType={dataType}
                onDataTypeChange={setDataType}
                filters={filters}
                onFilterChange={setFilters}
                onGenerate={handleGenerateReport}
                onDownload={handleDownloadReport}
                loading={loading}
                reportData={reportData} 
            />
        </div>
    );
};

export default ReportView;