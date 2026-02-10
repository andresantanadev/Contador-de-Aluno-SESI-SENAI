// /src/components/ContagemGeral/CalendarView.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Swal from 'sweetalert2/dist/sweetalert2.all.min.js';
import {
    getContagensPorRange,
    getDashboardPorData,
    getAlunosNesPorData,
    getNecessidades,
    getNecessidadeComAlunos,
    getTurmas
} from '../../services/api';

import { DetailsPanel } from './DetailsPanel';
import './CalendarView.css';

// Função para formatar data como AAAA-MM-DD sem erros de fuso horário
const toISODateString = (date) => {
    if (!date || isNaN(date.getTime())) return new Date().toISOString().split("T")[0];
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const CalendarView = () => {
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
    const [countsData, setCountsData] = useState(new Map());
    const [loadingCalendar, setLoadingCalendar] = useState(true);
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedDayDetails, setSelectedDayDetails] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [relacaoToDescricaoMap, setRelacaoToDescricaoMap] = useState(new Map());

    const MONTHS = useMemo(() => [
        'JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO',
        'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'
    ], []);

    // Carrega descrições fixas para complementar o que vem na API de contagem
    const carregarMapasDeApoio = useCallback(async () => {
        try {
            const necessidadesRes = await getNecessidades();
            const necComAlunosRes = await Promise.all(
                (necessidadesRes.data || []).map(n => getNecessidadeComAlunos(n.id))
            );
            const dMap = new Map();
            necComAlunosRes.forEach(nec => {
                (nec.alunos || []).forEach(aluno => {
                    const relacaoId = aluno.pivot?.id || aluno.alunos_has_necessidades_id;
                    if (relacaoId) {
                        dMap.set(String(relacaoId), aluno.descricao || '<i>Nenhuma descrição disponível.</i>');
                    }
                });
            });
            setRelacaoToDescricaoMap(dMap);
        } catch (error) {
            console.error("Erro ao carregar mapas:", error);
        }
    }, []);

    const carregarTotaisDoMes = useCallback(async (year, month) => {
        setLoadingCalendar(true);
        try {
            const dataInicio = toISODateString(new Date(year, month, 1));
            const dataFim = toISODateString(new Date(year, month + 1, 0));
            const contagensRes = await getContagensPorRange(dataInicio, dataFim);
            
            const totalsMap = new Map();
            (contagensRes.data || []).forEach(contagem => {
                const dateStr = contagem.data_contagem;
                const qtd = Number(contagem.qtd_contagem || 0);
                totalsMap.set(dateStr, (totalsMap.get(dateStr) || 0) + qtd);
            });
            setCountsData(totalsMap);
        } catch (error) {
            Swal.fire('Erro!', 'Falha ao carregar totais do calendário.', 'error');
        } finally {
            setLoadingCalendar(false);
        }
    }, []);

    const carregarDetalhesDoDia = useCallback(async (date) => {
        const dateStr = toISODateString(date);
        
        // Se o calendário diz que não tem nada nesse dia, nem chama a API
        if (!countsData.has(dateStr)) {
            setSelectedDayDetails({ date, totalGeralContagens: 0, contagens: [], necessidades: new Map() });
            return;
        }

        setLoadingDetails(true);
        try {
            const [dashRes, nesRes] = await Promise.all([
                getDashboardPorData(dateStr),
                getAlunosNesPorData(dateStr)
            ]);

            const dashboardData = dashRes?.data || [];
            const nesDataTotal = nesRes?.data || [];

            // FILTRO CRUCIAL: Filtra os alunos NES para mostrar APENAS os do dia clicado
            const nesDataFiltrado = nesDataTotal.filter(item => 
                item.data_hora_contagem && item.data_hora_contagem.startsWith(dateStr)
            );

            const contagensDetalhes = dashboardData.map(cat => ({
                nome_categoria: cat.nome_categoria,
                turmas: (cat.turmas || []).map(t => ({
                    nome_turma: t.nome_turma,
                    qtd_contagem: t.qtd_contagem
                }))
            }));

            const totalGeral = dashboardData.reduce((acc, cat) => 
                acc + (cat.turmas || []).reduce((sum, t) => sum + Number(t.qtd_contagem || 0), 0), 0);

            const necessidadesMap = new Map();
            nesDataFiltrado.forEach(item => {
                if (!item?.aluno) return;
                const necNome = item.aluno.necessidade || 'Outros';
                if (!necessidadesMap.has(necNome)) necessidadesMap.set(necNome, []);
                
                const relId = String(item.aluno.id);
                necessidadesMap.get(necNome).push({
                    nome: item.aluno.nome,
                    rm: item.aluno.rm,
                    descricao: relacaoToDescricaoMap.get(relId) || item.aluno.descricao || 'Sem descrição.'
                });
            });

            setSelectedDayDetails({
                date,
                totalGeralContagens: totalGeral,
                contagens: contagensDetalhes,
                necessidades: necessidadesMap
            });
        } catch (error) {
            console.error("Erro detalhes:", error);
            setSelectedDayDetails(null);
        } finally {
            setLoadingDetails(false);
        }
    }, [countsData, relacaoToDescricaoMap]);

    useEffect(() => { carregarMapasDeApoio(); }, [carregarMapasDeApoio]);
    useEffect(() => { carregarTotaisDoMes(currentYear, currentMonth); }, [currentYear, currentMonth, carregarTotaisDoMes]);
    useEffect(() => { if (selectedDate) carregarDetalhesDoDia(selectedDate); }, [selectedDate, carregarDetalhesDoDia]);

    const calendarDays = useMemo(() => {
        const days = [];
        const firstDay = new Date(currentYear, currentMonth, 1).getDay();
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

        for (let i = 0; i < firstDay; i++) days.push({ type: 'empty' });
        
        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(currentYear, currentMonth, i);
            const dateStr = toISODateString(date);
            days.push({
                type: 'day',
                dayOfMonth: i,
                date,
                total: countsData.get(dateStr) || 0,
                isToday: toISODateString(new Date()) === dateStr,
                isSelected: selectedDate && toISODateString(selectedDate) === dateStr
            });
        }
        return days;
    }, [currentYear, currentMonth, countsData, selectedDate]);

    return (
        <div className="calendar-main-grid">
            <div className="calendar-sidebar">
                <div className="year-selector">
                    <button onClick={() => setCurrentYear(p => p - 1)}><i className="bi bi-chevron-left"></i></button>
                    <span>{currentYear}</span>
                    <button onClick={() => setCurrentYear(p => p + 1)}><i className="bi bi-chevron-right"></i></button>
                </div>
                <div className="month-list">
                    {MONTHS.map((name, i) => (
                        <div key={i} className={`month-item ${i === currentMonth ? 'active' : ''}`} onClick={() => setSelectedDate(null) || setCurrentMonth(i)}>{name}</div>
                    ))}
                </div>
            </div>

            <div className="calendar-grid-area">
                <div className="calendar-header">
                    <div className="calendar-month-display">{MONTHS[currentMonth]} {currentYear}</div>
                </div>
                <div className="calendar-days-header">
                    {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => <div key={d} className="weekday-name">{d}</div>)}
                </div>
                <div className="calendar-body">
                    {loadingCalendar ? (
                        <div className="calendar-loading-overlay-custom"><div className="spinner"></div></div>
                    ) : (
                        calendarDays.map((day, i) => (
                            <div key={i} 
                                className={`calendar-day-tile ${day.type === 'empty' ? 'empty' : ''} ${day.isToday ? 'today' : ''} ${day.isSelected ? 'selected' : ''} ${day.total > 0 ? 'has-data' : ''}`}
                                onClick={() => day.type === 'day' && setSelectedDate(day.date)}
                            >
                                {day.type === 'day' && (
                                    <>
                                        <span className="day-number">{day.dayOfMonth}</span>
                                        {day.total > 0 && <div className="day-total-bubble">{day.total}</div>}
                                    </>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div className="calendar-details-panel">
                <DetailsPanel details={selectedDayDetails} loading={loadingDetails} />
            </div>
        </div>
    );
};

export default CalendarView;