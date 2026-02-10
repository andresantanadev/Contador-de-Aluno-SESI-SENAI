import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2/dist/sweetalert2.all.min.js';
import {
    getContagensDashboard,
    getAlunosContagemNes,
    getNecessidades,
    getNecessidadeComAlunos,
    getTurmas
} from '../../services/api'; 
import './DashboardNutri.css';

// Componente de Card Reutilizável
const DashboardCard = ({ title, count, icon, onClick, className = '' }) => (
    <div className={`dash-card ${className} ${onClick ? 'clickable' : ''}`} onClick={onClick}>
        <div className="dash-card-header">
            <i className={`bi ${icon}`}></i>
            <span>{title}</span>
        </div>
        <div className="dash-card-body">
            {count}
        </div>
    </div>
);

// Componente de Seletor (Toggle Switch)
const ModeToggle = ({ mode, onToggle }) => (
    <div className="mode-toggle">
        <button
            className={`toggle-btn ${mode === 'contagens' ? 'active' : ''}`}
            onClick={() => onToggle('contagens')}
        >
            <i className="bi bi-list-ol"></i> Contagens
        </button>
        <button
            className={`toggle-btn ${mode === 'necessidades' ? 'active' : ''}`}
            onClick={() => onToggle('necessidades')}
        >
            <i className="bi bi-person-fill-exclamation"></i> Necessidades
        </button>
    </div>
);

const DashboardNutri = () => {
    const navigate = useNavigate();
    const [mode, setMode] = useState('contagens');
    const [loading, setLoading] = useState(true);
    
    const [dashboardData, setDashboardData] = useState([]);
    const [nesData, setNesData] = useState([]);
    
    const [relacaoToTurmaMap, setRelacaoToTurmaMap] = useState(new Map());
    const [turmaInfoMap, setTurmaInfoMap] = useState(new Map());

    // Define a data de hoje formatada (YYYY-MM-DD)
    const hoje = useMemo(() => new Date().toISOString().slice(0, 10), []);

    const carregarDadosDashboard = useCallback(async () => {
        setLoading(true);
        try {
            const [dashRes, nesRes, turmasRes, necessidadesRes] = await Promise.all([
                getContagensDashboard(),
                getAlunosContagemNes(),
                getTurmas(),
                getNecessidades()
            ]);

            setDashboardData(dashRes.data || []);
            setNesData(nesRes.data || []);

            const tMap = new Map();
            (turmasRes.data || []).forEach(turma => {
                tMap.set(turma.id, turma.nome_turma);
            });
            setTurmaInfoMap(tMap);

            const necComAlunosRes = await Promise.all(
                (necessidadesRes.data || []).map(n => getNecessidadeComAlunos(n.id))
            );

            const rMap = new Map();
            necComAlunosRes.forEach(nec => {
                (nec.alunos || []).forEach(aluno => {
                    const relId = aluno.pivot?.id || aluno.alunos_has_necessidades_id;
                    if (relId && aluno.turmas_id) {
                        rMap.set(String(relId), aluno.turmas_id);
                    }
                });
            });
            setRelacaoToTurmaMap(rMap);

        } catch (error) {
            console.error("Erro ao carregar dashboard:", error);
            Swal.fire('Erro!', 'Não foi possível carregar os dados.', 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        carregarDadosDashboard();
    }, [carregarDadosDashboard]);

    // --- FILTROS PARA "APENAS HOJE" ---

    // Filtra as contagens das turmas para somar apenas as de hoje
    const totalGeralContagens = useMemo(() => {
        return (dashboardData || []).reduce((sumCat, categoria) => {
            const sumTurmas = (categoria.turmas || [])
                .filter(t => t.data_contagem === hoje) // FILTRO DE DATA
                .reduce((sumT, turma) => sumT + Number(turma.qtd_contagem || 0), 0);
            return sumCat + sumTurmas;
        }, 0);
    }, [dashboardData, hoje]);

    // Filtra alunos com necessidades especiais registrados hoje
    const nesHojeFiltrado = useMemo(() => {
        return (nesData || []).filter(item => {
            const dataRegistro = item.data_hora_contagem || (item.contagem && item.contagem.data_contagem);
            return dataRegistro && dataRegistro.startsWith(hoje);
        });
    }, [nesData, hoje]);

    const naiData = useMemo(() => {
        return nesHojeFiltrado
            .filter(item => item.aluno?.necessidade?.toUpperCase() === 'NAE') // Ajustado para NAE como no seu sistema
            .map(item => item.aluno);
    }, [nesHojeFiltrado]);

    const necessidadesCards = useMemo(() => {
        const necMap = new Map();
        nesHojeFiltrado.forEach(item => {
            const necNome = item.aluno?.necessidade || 'Desconhecida';
            if (!necMap.has(necNome)) {
                necMap.set(necNome, []);
            }
            necMap.get(necNome).push(item.aluno);
        });
        return necMap;
    }, [nesHojeFiltrado]);

    // --- HANDLERS DE MODAL ---

    const handleCategoriaClick = (categoria) => {
        const turmasHoje = (categoria.turmas || []).filter(t => t.data_contagem === hoje);
        
        const turmasHtml = turmasHoje
            .map(turma => `
                <div class="modal-list-item">
                    <span>${turma.nome_turma}</span>
                    <strong>${turma.qtd_contagem}</strong>
                </div>
            `)
            .join('') || '<p>Nenhuma contagem realizada hoje para esta categoria.</p>';

        Swal.fire({
            title: `Turmas - ${categoria.nome_categoria}`,
            html: `<div class="modal-list scrollable">${turmasHtml}</div>`,
            confirmButtonText: 'Fechar',
            confirmButtonColor: '#dc3545',
        });
    };

    const handleNaiClick = () => {
        const alunosHtml = naiData
            .map(aluno => `
                <div class="modal-list-item simple">
                    <span>${aluno.nome}</span>
                </div>
            `)
            .join('') || '<p>Nenhum aluno NAE contado hoje.</p>';

        Swal.fire({
            title: 'Alunos - NAE Hoje',
            html: `<div class="modal-list scrollable">${alunosHtml}</div>`,
            confirmButtonText: 'Fechar',
            confirmButtonColor: '#dc3545',
        });
    };

    const handleNecessidadeClick = (necNome) => {
        const alunos = necessidadesCards.get(necNome) || [];
        const turmasMap = new Map();

        alunos.forEach(aluno => {
            const relId = String(aluno.id); // No seu sistema, aluno.id é o ID da relação
            const turmaId = relacaoToTurmaMap.get(relId);
            const turmaNome = turmaInfoMap.get(turmaId) || 'Turma não identificada';

            if (!turmasMap.has(turmaNome)) {
                turmasMap.set(turmaNome, []);
            }
            turmasMap.get(turmaNome).push(aluno);
        });
        
        let html = '';
        turmasMap.forEach((alunosDaTurma, turmaNome) => {
            html += `<h4 class="modal-turma-header">${turmaNome}</h4>`;
            html += alunosDaTurma.map(aluno => `
                <div class="modal-list-item simple">
                    <span>${aluno.nome} (RM: ${aluno.rm || 'N/A'})</span>
                </div>
            `).join('');
        });

        Swal.fire({
            title: `${necNome} - Hoje`,
            html: `<div class="modal-list scrollable">${html || '<p>Nenhum aluno encontrado hoje.</p>'}</div>`,
            confirmButtonText: 'Fechar',
            confirmButtonColor: '#dc3545',
        });
    };

    // --- RENDERIZAÇÃO ---

    const renderContagens = () => (
        <>
            {(dashboardData || []).map(cat => {
                const totalCategoria = (cat.turmas || [])
                    .filter(t => t.data_contagem === hoje)
                    .reduce((sum, t) => sum + Number(t.qtd_contagem || 0), 0);
                
                return (
                    <DashboardCard
                        key={cat.id}
                        title={cat.nome_categoria}
                        count={totalCategoria}
                        icon="bi-building"
                        onClick={() => handleCategoriaClick(cat)}
                    />
                );
            })}
            
            <DashboardCard
                title="NAE"
                count={naiData.length}
                icon="bi-person-arms-up"
                className="nai-card"
                onClick={handleNaiClick}
            />

            <DashboardCard
                title="Total Geral"
                count={totalGeralContagens}
                icon="bi-bar-chart-fill"
                className="total-card"
                onClick={null}
            />
        </>
    );

    const renderNecessidades = () => (
        <>
            {[...necessidadesCards.keys()].map(necNome => (
                <DashboardCard
                    key={necNome}
                    title={necNome}
                    count={necessidadesCards.get(necNome).length}
                    icon="bi-person-fill-exclamation"
                    onClick={() => handleNecessidadeClick(necNome)}
                />
            ))}
        </>
    );

    return (
        <section className="dashboard-nutri-container">
            <ModeToggle mode={mode} onToggle={setMode} />
            
            <div className="dash-grid-container">
                <div className="dash-grid">
                    {loading ? (
                        <div className="carregando-dash">
                            <div className="spinner"></div>
                            <p>Carregando dados de hoje...</p>
                        </div>
                    ) : (
                        mode === 'contagens' ? renderContagens() : renderNecessidades()
                    )}
                </div>
            </div>

            <button className="dash-avancar-btn" onClick={() => navigate('/nutri/inicio')}>
                Acessar Menu de Ações
            </button>
        </section>
    );
};

export default DashboardNutri;