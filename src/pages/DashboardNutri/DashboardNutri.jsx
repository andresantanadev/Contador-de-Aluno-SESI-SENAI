import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2/dist/sweetalert2.all.min.js';
import {
    getContagensDashboard,
    getAlunosContagemNes,
    getNecessidades,
    getNecessidadeComAlunos,
    getTurmas
} from '../../services/api'; // Ajuste o caminho se necessário
// import DashboardWelcomeModal from '../../components/DashboardWelcomeModal'; // <-- REMOVIDO
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
    const [mode, setMode] = useState('contagens'); // 'contagens' ou 'necessidades'
    const [loading, setLoading] = useState(true);
    
    const [dashboardData, setDashboardData] = useState([]);
    const [nesData, setNesData] = useState([]);
    
    const [relacaoToTurmaMap, setRelacaoToTurmaMap] = useState(new Map());
    const [turmaInfoMap, setTurmaInfoMap] = useState(new Map());

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
                    if (aluno.pivot && aluno.pivot.id && aluno.turmas_id) {
                        rMap.set(aluno.pivot.id, aluno.turmas_id);
                    }
                });
            });
            setRelacaoToTurmaMap(rMap);

        } catch (error) {
            console.error("Erro ao carregar dashboard:", error);
            Swal.fire('Erro!', 'Não foi possível carregar os dados do dashboard.', 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        carregarDadosDashboard();
    }, [carregarDadosDashboard]);

    // --- CÁLCULOS E PROCESSAMENTO (useMemo) ---

    const totalGeralContagens = useMemo(() => {
        return (dashboardData || []).reduce((sumCat, categoria) => {
            const sumTurmas = (categoria.turmas || []).reduce((sumT, turma) => {
                return sumT + Number(turma.qtd_contagem || 0);
            }, 0);
            return sumCat + sumTurmas;
        }, 0);
    }, [dashboardData]);

    const naiData = useMemo(() => {
        return (nesData || [])
            .filter(item => item.aluno?.necessidade?.toUpperCase() === 'NAI')
            .map(item => item.aluno);
    }, [nesData]);

    const necessidadesCards = useMemo(() => {
        const necMap = new Map();
        (nesData || []).forEach(item => {
            const necNome = item.aluno?.necessidade || 'Desconhecida';
            if (!necMap.has(necNome)) {
                necMap.set(necNome, []);
            }
            necMap.get(necNome).push(item.aluno);
        });
        return necMap;
    }, [nesData]);

    // --- HANDLERS DE MODAL ---

    const handleCategoriaClick = (categoria) => {
        const turmasHtml = (categoria.turmas || [])
            .map(turma => `
                <div class="modal-list-item">
                    <span>${turma.nome_turma}</span>
                    <strong>${turma.qtd_contagem}</strong>
                </div>
            `)
            .join('') || '<p>Nenhuma turma encontrada.</p>';

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
                <details class="modal-accordion">
                    <summary>
                        ${aluno.nome}
                        <i class="bi bi-chevron-down"></i>
                    </summary>
                    <div class="modal-accordion-content">
                        ${aluno.descricao ? aluno.descricao : '<i>Nenhuma descrição disponível.</i>'}
                    </div>
                </details>
            `)
            .join('') || '<p>Nenhum aluno NAI contadado hoje.</p>';

        Swal.fire({
            title: 'Alunos - NAI',
            html: `<div class="modal-list scrollable">${alunosHtml}</div>`,
            confirmButtonText: 'Fechar',
            confirmButtonColor: '#dc3545',
        });
    };

    const handleNecessidadeClick = (necNome) => {
        const alunos = necessidadesCards.get(necNome) || [];

        const turmasMap = new Map();
        alunos.forEach(aluno => {
            const relacaoId = aluno.id;
            const turmaId = relacaoToTurmaMap.get(relacaoId);
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
            title: `Alunos - ${necNome}`,
            html: `<div class="modal-list scrollable">${html || '<p>Nenhum aluno encontrado.</p>'}</div>`,
            confirmButtonText: 'Fechar',
            confirmButtonColor: '#dc3545',
        });
    };

    // --- RENDERIZAÇÃO ---

    const renderContagens = () => (
        <>
            {(dashboardData || []).map(cat => {
                const totalCategoria = (cat.turmas || []).reduce(
                    (sum, t) => sum + Number(t.qtd_contagem || 0), 0
                );
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
                title="NAI"
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
                onClick={null} // Não é clicável
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
        <>
            {/* <DashboardWelcomeModal /> <-- REMOVIDO */}
            
            <section className="dashboard-nutri-container">
                <ModeToggle mode={mode} onToggle={setMode} />
                
                <div className="dash-grid-container">
                    <div className="dash-grid">
                        {loading ? (
                            <div className="carregando-dash">
                                <div className="spinner"></div>
                                <p>Carregando dados...</p>
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
        </>
    );
};

export default DashboardNutri;