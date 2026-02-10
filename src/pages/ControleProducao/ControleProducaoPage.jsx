import React, { useState, useCallback, useMemo, useEffect } from 'react';
import Swal from 'sweetalert2/dist/sweetalert2.all.min.js';
import { getProducao, addProducao } from '../../services/api'; // Adicionei addProducao

// Importa o componente que gerencia a tabela e visualização (RESTAURADO)
import ProducaoManagementView from '../../components/ControleProducao/ProducaoManagementView';

// Importa os componentes auxiliares para o relatório
import ProducaoReportPreview from '../../components/ControleProducao/ProducaoReportPreview';
import ProducaoFilterPanel from '../../components/ControleProducao/ProducaoFilterPanel';

// Importa funções de data
import { toISODateString, parseISODateAsUTC, formatFriendlyDate } from '../../components/ContagemGeral/utils';

import './ControleProducaoPage.css'; // O CSS V2 "Bonito"
import logo from '../../assets/img/logo.png'; // Logo para o PDF

// Função auxiliar para datas no filtro
const getDaysInRange = (startDate, endDate) => {
    const days = [];
    let currentDate = parseISODateAsUTC(startDate);
    const lastDate = parseISODateAsUTC(endDate);
    for (let i = 0; i <= 366 && currentDate <= lastDate; i++) {
        days.push(toISODateString(currentDate)); 
        currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }
    return days;
};

const ControleProducaoPage = () => {
    // --- ESTADOS ---
    const [viewMode, setViewMode] = useState('management'); // 'management' ou 'report'
    const [searchTerm, setSearchTerm] = useState(''); // Estado da Barra de Pesquisa
    
    const [allProducaoData, setAllProducaoData] = useState([]);
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentReportTitle, setCurrentReportTitle] = useState("Selecione os filtros");

    // Filtros do Relatório
    const initialState = useMemo(() => {
        const today = new Date();
        return {
            startDate: toISODateString(today),
            endDate: toISODateString(today),
            searchTerm: '',
        };
    }, []);
    const [filters, setFilters] = useState(initialState);

    // --- BUSCA DE DADOS (BACK-END REAL) ---
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getProducao();
            // Garante que pegamos o array de dados corretamente
            const lista = data.data || data || []; 
            setAllProducaoData(lista);
        } catch (error) {
            console.error("Erro ao buscar produção:", error);
            Swal.fire('Erro!', 'Não foi possível carregar os dados de produção.', 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // --- FILTRO LOCAL PARA A TABELA DE GERENCIAMENTO ---
    // Filtra os dados antes de passar para o componente de visualização
    const filteredManagementData = useMemo(() => {
        if (!searchTerm) return allProducaoData;
        const term = searchTerm.toLowerCase();
        return allProducaoData.filter(item => 
            item.nome_alimento?.toLowerCase().includes(term)
        );
    }, [allProducaoData, searchTerm]);

    // --- AÇÃO DE ADICIONAR ITEM (NOVA) ---
    const handleAddItem = () => {
        Swal.fire({
            title: 'Adicionar Novo Item',
            width: '700px',
            html: `
                <input id="swal-nome" class="swal2-input" placeholder="Nome do Alimento">
                <input id="swal-data" type="date" class="swal2-input" value="${new Date().toISOString().split('T')[0]}">
                <input id="swal-quantidade" type="number" step="0.01" class="swal2-input" placeholder="Quantidade (ex: 10.50)">
                <input id="swal-medida" class="swal2-input" placeholder="Medida (kg, g, L)">
                <input id="swal-pessoas" type="number" class="swal2-input" placeholder="Pessoas">
                <input id="swal-sobra" type="number" step="0.01" class="swal2-input" placeholder="Sobra Limpa (ex: 1.25)">
                <input id="swal-desperdicio" type="number" step="0.01" class="swal2-input" placeholder="Desperdício (ex: 0.50)">
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Salvar',
            confirmButtonColor: '#28a745',
            cancelButtonText: 'Cancelar',
            cancelButtonColor: '#d33',
            preConfirm: () => {
                const nome = document.getElementById('swal-nome').value;
                if (!nome) {
                    Swal.showValidationMessage(`O nome do alimento é obrigatório.`);
                    return false;
                }
                return {
                    nome_alimento: nome,
                    data_alimento: document.getElementById('swal-data').value,
                    quantidade_alimento: document.getElementById('swal-quantidade').value,
                    medida_alimento: document.getElementById('swal-medida').value,
                    pessoas_alimento: document.getElementById('swal-pessoas').value,
                    sobra_limpa_alimento: document.getElementById('swal-sobra').value,
                    desperdicio_alimento: document.getElementById('swal-desperdicio').value,
                };
            },
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await addProducao(result.value);
                    Swal.fire({
    title: 'Sucesso!',
    text: 'Item adicionado.',
    icon: 'success',
    timer: 1500,
    showConfirmButton: false
});

                    fetchData(); // Atualiza a tabela
                } catch (error) {
                    Swal.fire('Erro!', 'Não foi possível salvar.', 'error');
                }
            }
        });
    };

    // --- LÓGICA DE GERAÇÃO DE RELATÓRIO ---
    const handleGenerateReport = useCallback(() => {
        setLoading(true);
        setReportData(null);
        
        const { startDate, endDate, searchTerm: filterTerm } = filters;
        
        let title = `Relatório: ${formatFriendlyDate(startDate)} a ${formatFriendlyDate(endDate)}`;
        if (startDate === endDate) title = `Relatório do Dia: ${formatFriendlyDate(startDate)}`;
        if (filterTerm) title += ` (Filtro: "${filterTerm}")`;
        
        setCurrentReportTitle(title);

        try {
            const validDaysSet = new Set(getDaysInRange(startDate, endDate));
            const filteredData = allProducaoData.filter(item => {
                const dataStr = item.data_alimento || '';
                const itemDate = dataStr.substring(0, 10); 
                const dateMatch = validDaysSet.has(itemDate);
                const searchMatch = item.nome_alimento?.toLowerCase().includes(filterTerm.toLowerCase());
                return dateMatch && searchMatch;
            });
            
            setReportData(filteredData);
        } catch (error) {
            Swal.fire('Erro!', 'Não foi possível filtrar os dados.', 'error');
        } finally {
            setLoading(false);
        }
    }, [filters, allProducaoData]);

    const handleDownloadReport = () => {
        console.log("Download solicitado...");
    };

    return (
        <section className="producao-container-v2">
            <div className={`producao-layout-grid-v2 ${viewMode === 'report' ? 'mode-report' : ''}`}>
                
                {/* --- COLUNA 1: SIDEBAR DE NAVEGAÇÃO --- */}
                <div className="producao-sidebar-v2">
                    <h3>Produção</h3>
                    <button 
                        className={`sidebar-action-button ${viewMode === 'management' ? 'active' : ''}`} 
                        onClick={() => setViewMode('management')}
                    >
                        <i className="bi bi-pencil-square"></i>
                        <span>Gerenciamento</span>
                    </button>
                    <button 
                        className={`sidebar-action-button ${viewMode === 'report' ? 'active' : ''}`}
                        onClick={() => setViewMode('report')}
                    >
                        <i className="bi bi-file-earmark-text-fill"></i>
                        <span>Relatórios</span>
                    </button>
                </div>

                {/* --- COLUNA 2: CONTEÚDO PRINCIPAL --- */}
                <div className="producao-content-v2">
                    
                    {/* MODO GERENCIAMENTO: Usa o componente dedicado que já funciona */}
                    {viewMode === 'management' && (
                        <>
                            {/* Cabeçalho organizado: Título (Esq) - Busca (Meio) - Botão (Dir) */}
                            <div className="content-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem' }}>
                                
                                {/* Lado Esquerdo: Título */}
                                <h2 style={{ margin: 0, minWidth: '250px' }}>
                                    <i className="bi bi-basket2"></i> Tabela de Consumo
                                </h2>
                                
                                {/* Centro: Barra de Pesquisa (CORRIGIDO) */}
                                <div className="search-bar-container" style={{ flex: 1, maxWidth: '500px', margin: '0 1rem', position: 'relative' }}>
                                    {/* Ícone absoluto */}
                                    <i className="bi bi-search search-icon" 
                                       style={{ 
                                           position: 'absolute', 
                                           left: '15px', 
                                           top: '50%', 
                                           transform: 'translateY(-50%)', 
                                           color: '#666',
                                           zIndex: 1 
                                       }}>
                                    </i>
                                    {/* Input com estilos forçados para garantir visibilidade */}
                                    <input 
                                        type="text" 
                                        className="search-input" 
                                        placeholder="Buscar por nome..." 
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        style={{ 
                                            width: '100%', 
                                            padding: '10px 15px 10px 45px', // Padding esquerdo maior para o ícone
                                            borderRadius: '25px',
                                            border: '1px solid #000000ff', // Borda visível
                                            backgroundColor: '#f8f9fa', // Fundo levemente cinza para destacar do branco
                                            color: '#333', // Texto escuro
                                            fontSize: '0.95rem',
                                            outline: 'none',
                                            height: '45px'
                                        }} 
                                    />
                                </div>

                                {/* Lado Direito: Botão Adicionar */}
                                <button 
                                    className="btn-add-item"
                                    onClick={handleAddItem}
                                    style={{
                                        backgroundColor: '#28a745',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        padding: '0.7rem 1.5rem',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        whiteSpace: 'nowrap',
                                        fontSize: '0.95rem',
                                        boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                                    }}
                                >
                                    <i className="bi bi-plus-lg"></i> Adicionar Item
                                </button>
                            </div>

                            <ProducaoManagementView 
                                initialData={filteredManagementData}
                                isLoading={loading}
                                onDataChange={fetchData} // Passa a função para recarregar dados após edições
                            />
                        </>
                    )}

                    {/* MODO RELATÓRIO: PREVIEW DO PDF */}
                    {viewMode === 'report' && (
                        <div className="producao-report-preview-area" style={{padding: '1.5rem', overflowY:'auto', height:'100%'}}>
                            <ProducaoReportPreview
                                data={reportData}
                                loading={loading && !reportData}
                                title={currentReportTitle}
                            />
                        </div>
                    )}
                </div>

                {/* --- COLUNA 3: PAINEL DE FILTROS (Apenas no modo relatório) --- */}
                {viewMode === 'report' && (
                    <ProducaoFilterPanel
                        filters={filters}
                        onFilterChange={setFilters}
                        onGenerate={handleGenerateReport}
                        onDownload={handleDownloadReport}
                        loading={loading}
                        reportData={reportData}
                        logo={logo}
                        isReportMode={true}
                    />
                )}
            </div>
        </section>
    );
};

export default ControleProducaoPage;