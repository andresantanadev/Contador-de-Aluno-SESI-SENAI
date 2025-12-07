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
} from '../../services/api'; // Ajuste o caminho se necessário (ex: ../../services/api)

import { DetailsPanel } from './DetailsPanel'; // Importa o componente extraído
import './CalendarView.css'; // Não se esqueça de criar este CSS e mover os estilos

// Função auxiliar para formatar data como AAAA-MM-DD
// (Esta função está incluída aqui para o componente ser autônomo)
const toISODateString = (date) => {
    // Adiciona verificação para garantir que date não seja nulo ou inválido
    if (!date || isNaN(date.getTime())) {
        console.error("Tentativa de formatar data inválida:", date);
        return new Date().toISOString().split("T")[0]; // Retorna hoje como fallback
    }
    try {
        // Ajuste de fuso horário para garantir a data correta
        const adjustedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        return adjustedDate.toISOString().split("T")[0];
    } catch (e) {
        console.error("Erro ao formatar data:", date, e);
        return new Date().toISOString().split("T")[0]; // Retorna hoje como fallback
    }
};


// Componente Principal do Calendário
const CalendarView = () => {
    // Todos os estados que você tinha antes
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth()); // 0-11
    const [countsData, setCountsData] = useState(new Map());
    const [loadingCalendar, setLoadingCalendar] = useState(true);
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedDayDetails, setSelectedDayDetails] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [relacaoToTurmaMap, setRelacaoToTurmaMap] = useState(new Map());
    const [turmaInfoMap, setTurmaInfoMap] = useState(new Map());
    const [relacaoToDescricaoMap, setRelacaoToDescricaoMap] = useState(new Map());

    // Constante de Meses
    const MONTHS = useMemo(() => [
        'JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO',
        'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'
    ], []);

    // Função para carregar os mapas
    const carregarMapas = useCallback(async () => {
        // (Seu código original, sem alterações)
        try {
            const [turmasRes, necessidadesRes] = await Promise.all([
                getTurmas(),
                getNecessidades()
            ]);
            const tMap = new Map();
            (turmasRes.data || []).forEach(turma => tMap.set(turma.id, turma.nome_turma));
            setTurmaInfoMap(tMap);
            const necComAlunosRes = await Promise.all(
                (necessidadesRes.data || []).map(n => getNecessidadeComAlunos(n.id))
            );
            const rMap = new Map();
            const dMap = new Map();
            necComAlunosRes.forEach(nec => {
                (nec.alunos || []).forEach(aluno => {
                    if (aluno.pivot && aluno.pivot.id) {
                        const relacaoId = aluno.pivot.id;
                        if (aluno.turmas_id) rMap.set(relacaoId, aluno.turmas_id);
                        // Armazena a descrição ou o texto padrão
                        dMap.set(relacaoId, aluno.descricao || '<i>Nenhuma descrição disponível.</i>');
                    }
                });
            });
            setRelacaoToTurmaMap(rMap);
            setRelacaoToDescricaoMap(dMap);
        } catch (error) {
            console.error("Erro ao carregar mapas de dados:", error);
            Swal.fire('Erro!', 'Não foi possível carregar dados de apoio.', 'error');
        }
    }, []);

    // Função para carregar os totais do mês
    const carregarTotaisDoMes = useCallback(async (year, month) => {
        // (Seu código original, sem alterações)
        setLoadingCalendar(true);
        try {
            const dataInicio = toISODateString(new Date(year, month, 1));
            const dataFim = toISODateString(new Date(year, month + 1, 0));
            const contagensRes = await getContagensPorRange(dataInicio, dataFim);
            const data = contagensRes.data || [];
            const totalsMap = new Map();
            data.forEach(contagem => {
                const dateStr = contagem.data_contagem;
                const qtd = Number(contagem.qtd_contagem || 0);
                totalsMap.set(dateStr, (totalsMap.get(dateStr) || 0) + qtd);
            });
            setCountsData(totalsMap);
        } catch (error) {
            console.error("Erro ao carregar totais do mês:", error);
            Swal.fire('Erro!', 'Não foi possível carregar os totais de contagem.', 'error');
        } finally {
            setLoadingCalendar(false);
        }
    }, []);

    // Função para carregar os detalhes do dia
    const carregarDetalhesDoDia = useCallback(async (date) => {
        // (Seu código original, sem alterações)
        const dataSelecionadaStr = toISODateString(date);
        // ================== DEBUG 1 ==================
        console.log("[DEBUG] Carregando Detalhes para a data string:", dataSelecionadaStr);
        // ============================================

        if (!countsData.has(dataSelecionadaStr) || countsData.get(dataSelecionadaStr) === 0) {
            setSelectedDayDetails(null);
            return;
        }
        setLoadingDetails(true);
        try {
            // ================== DEBUG 2 ==================
            console.log("[DEBUG] Chamando APIs com data:", dataSelecionadaStr);
            // ============================================
            const [dashRes, nesRes] = await Promise.all([
                getDashboardPorData(dataSelecionadaStr), // <-- Passa a data string correta
                getAlunosNesPorData(dataSelecionadaStr)  // <-- Passa a data string correta
            ]);
            
            // ================== DEBUG 3 ==================
            console.log("[DEBUG] Resposta getDashboardPorData:", dashRes);
            console.log("[DEBUG] Resposta getAlunosNesPorData:", nesRes);
                // ============================================

            const dashboardData = dashRes?.data || []; // Adiciona '?' para segurança
            const nesData = nesRes?.data || [];      // Adiciona '?' para segurança

            const contagensDetalhes = dashboardData.map(cat => ({
                nome_categoria: cat.nome_categoria,
                turmas: (cat.turmas || []).map(turma => ({ // Adiciona '|| []' para segurança
                    nome_turma: turma.nome_turma,
                    qtd_contagem: turma.qtd_contagem
                }))
            }));
            const totalGeralContagens = dashboardData.reduce((sumCat, categoria) => {
                return sumCat + (categoria.turmas || []).reduce((sumT, turma) => sumT + Number(turma.qtd_contagem || 0), 0);
            }, 0);
            const necessidadesDetalhes = new Map();
            nesData.forEach(item => {
                // Adiciona verificações extras para evitar erros
                if (!item || !item.aluno) return;

                const necNome = item.aluno.necessidade || 'Desconhecida';
                if (!necessidadesDetalhes.has(necNome)) necessidadesDetalhes.set(necNome, []);
                
                const relacaoId = item.aluno.id;
                // Busca a descrição do mapa pré-carregado
                const descricao = relacaoToDescricaoMap.get(relacaoId) || '<i>Nenhuma descrição disponível.</i>';
                
                necessidadesDetalhes.get(necNome).push({
                    nome: item.aluno.nome || 'Nome não encontrado',
                    descricao: descricao
                });
            });

            // ================== DEBUG 4 ==================
            console.log("[DEBUG] Detalhes processados:", { date, totalGeralContagens, contagens: contagensDetalhes, necessidades: necessidadesDetalhes });
            // ============================================

            setSelectedDayDetails({
                date: date,
                totalGeralContagens,
                contagens: contagensDetalhes,
                necessidades: necessidadesDetalhes
            });
        } catch (error) {
            console.error("Erro ao carregar detalhes do dia:", error);
            Swal.fire('Erro!', `Não foi possível carregar os detalhes para ${dataSelecionadaStr}.`, 'error');
            setSelectedDayDetails(null);
        } finally {
            setLoadingDetails(false);
        }
    }, [countsData, relacaoToDescricaoMap]); // Adiciona dependências que faltavam

    // useEffect para carregar mapas
    useEffect(() => {
        carregarMapas();
    }, [carregarMapas]);

    // useEffect para carregar totais ao mudar mês/ano
    useEffect(() => {
        carregarTotaisDoMes(currentYear, currentMonth);
        setSelectedDayDetails(null);
        setSelectedDate(null);
    }, [currentYear, currentMonth, carregarTotaisDoMes]);

    // useEffect para carregar detalhes ao mudar a data selecionada
    useEffect(() => {
        if (selectedDate) {
            carregarDetalhesDoDia(selectedDate);
        } else {
            setSelectedDayDetails(null); // Limpa detalhes se nenhuma data estiver selecionada
        }
    }, [selectedDate, carregarDetalhesDoDia]);

    // Funções 'handle'
    const handleYearChange = (delta) => {
        setCurrentYear(prev => prev + delta);
    };

    const handleMonthSelect = (monthIndex) => {
        setCurrentMonth(monthIndex);
    };

    const handleDayClick = (dayOfMonth) => {
        const clickedDate = new Date(currentYear, currentMonth, dayOfMonth);
        // ================== DEBUG 5 ==================
        console.log("[DEBUG] Dia Clicado (handleDayClick):", clickedDate, "String:", toISODateString(clickedDate));
        // ============================================
        setSelectedDate(clickedDate); // Define a data selecionada
    };

    // Funções de cálculo do calendário
    const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

    // useMemo para gerar os dias do calendário
    const calendarDays = useMemo(() => {
        const days = [];
        for (let i = 0; i < firstDay; i++) {
            days.push({ type: 'empty' });
        }
        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(currentYear, currentMonth, i);
            const dateStr = toISODateString(date);
            const total = countsData.get(dateStr) || 0;
            const isToday = toISODateString(new Date()) === dateStr;
            const isSelected = selectedDate && toISODateString(selectedDate) === dateStr;
            days.push({
                type: 'day', dayOfMonth: i, date: date, total: total,
                isToday: isToday, isSelected: isSelected, hasData: total > 0
            });
        }
        return days;
    }, [currentYear, currentMonth, daysInMonth, firstDay, countsData, selectedDate]);

    // O JSX de retorno (o layout do grid)
    return (
        <div className="calendar-main-grid">
            
            {/* Painel Lateral */}
            <div className="calendar-sidebar">
                <div className="year-selector">
                    <button onClick={() => handleYearChange(-1)}><i className="bi bi-chevron-left"></i></button>
                    <span>{currentYear}</span>
                    <button onClick={() => handleYearChange(1)}><i className="bi bi-chevron-right"></i></button>
                </div>
                <div className="month-list">
                    {MONTHS.map((monthName, index) => (
                        <div 
                            key={index}
                            className={`month-item ${index === currentMonth ? 'active' : ''}`}
                            onClick={() => handleMonthSelect(index)}
                        >
                            {monthName}
                        </div>
                    ))}
                </div>
            </div>

            {/* Área Principal do Calendário */}
            <div className="calendar-grid-area">
                <div className="calendar-header">
                    <div className="calendar-month-display">
                        {MONTHS[currentMonth]} {currentYear}
                    </div>
                    <p className="calendar-subtitle">
                        Visualize as contagens diárias e clique em um dia para ver os detalhes.
                    </p>
                </div>
                
                <div className="calendar-days-header">
                    {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                        <div key={day} className="weekday-name">{day}</div>
                    ))}
                </div>

                <div className="calendar-body">
                    {loadingCalendar ? (
                        <div className="calendar-loading-overlay-custom">
                            <div className="spinner"></div>
                            <span>Carregando mês...</span>
                        </div>
                    ) : (
                        calendarDays.map((day, index) => (
                            <div 
                                key={index} 
                                className={`calendar-day-tile ${day.type === 'empty' ? 'empty' : ''} ${day.isToday ? 'today' : ''} ${day.isSelected ? 'selected' : ''} ${day.hasData ? 'has-data' : ''}`}
                                onClick={() => day.type === 'day' && handleDayClick(day.dayOfMonth)}
                            >
                                {day.type === 'day' && (
                                    <>
                                        <span className="day-number">{day.dayOfMonth}</span>
                                        {day.total > 0 && (
                                            <div className="day-total-bubble">
                                                {day.total}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Painel de Detalhes */}
            <div className="calendar-details-panel">
                <DetailsPanel
                    details={selectedDayDetails}
                    loading={loadingDetails}
                />
            </div>
        </div>
    );
};

export default CalendarView;