import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2/dist/sweetalert2.all.min.js';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { getNecessidades, getNecessidadeComAlunos, getCronograma, agendarRelacaoNosDias, removerAgendamentoDoDia } from '../../services/api';
import './CronogramaPage.css';

const CronogramaPage = () => {
    // --- SEUS ESTADOS E LÓGICA (MANTIDOS INTACTOS) ---
    const [boardState, setBoardState] = useState(null);
    const [allRelations, setAllRelations] = useState({});
    const [necessidades, setNecessidades] = useState([]);
    const [filterId, setFilterId] = useState('all');
    const [isLoading, setIsLoading] = useState(true);
    const [isDragging, setIsDragging] = useState(false);
    const navigate = useNavigate();

    const fetchData = async () => {
        try {
            !boardState && setIsLoading(true);
            
            const [necessidadesResponse, cronogramaData] = await Promise.all([
                getNecessidades(1, 100),
                getCronograma(),
            ]);

            // --- FILTRO: REMOVER NECESSIDADE 'NAI' DA LISTA GERAL ---
            const rawNecessidades = necessidadesResponse.data || [];
            const listaNecessidades = rawNecessidades.filter(n => 
                n.necessidade && n.necessidade.toUpperCase() !== 'NAI'
            );
            
            setNecessidades(listaNecessidades);
            
            const relationsMap = {};
            const relationLookupMap = new Map();

            // Busca apenas as necessidades filtradas
            const necessidadesComAlunos = await Promise.all(
                listaNecessidades.map(nec => getNecessidadeComAlunos(nec.id))
            );
            
            necessidadesComAlunos.forEach(nec => {
                (nec.alunos || []).forEach(aluno => {
                    const relacaoId = aluno.pivot?.id;
                    if (!relacaoId) return;
                    
                    const relacaoKey = `rel-${relacaoId}`;
                    const lookupKey = `aluno${aluno.id}-nec${nec.id}`;

                    relationsMap[relacaoKey] = {
                        id: relacaoKey,
                        content: `${aluno.nome} - ${nec.necessidade}`,
                        relacaoId: relacaoId,
                        necessidadeId: nec.id,
                    };
                    relationLookupMap.set(lookupKey, relacaoKey);
                });
            });
            setAllRelations(relationsMap);

            const columns = {};
            const diasDaSemana = (cronogramaData.data || []);
            diasDaSemana.forEach(dia => {
                columns[dia.id] = { id: String(dia.id), title: dia.dia, itemIds: [] };
                
                (dia.alunos || []).forEach(alunoAgendado => {
                    if (!alunoAgendado || !alunoAgendado.necessidade_relacionada) return;

                    const alunoId = alunoAgendado.id;
                    const necessidadeId = alunoAgendado.necessidade_relacionada.id;

                    const lookupKey = `aluno${alunoId}-nec${necessidadeId}`;
                    const relacaoKey = relationLookupMap.get(lookupKey);

                    if (relacaoKey) {
                        const occurrenceId = `${relacaoKey}-occurrence-${dia.id}-${Math.random()}`;
                        columns[dia.id].itemIds.push({ id: occurrenceId, originalId: relacaoKey });
                    }
                });
            });
            
            setBoardState({
                columns,
                columnOrder: diasDaSemana.map(d => String(d.id)),
            });

        } catch (error) {
            if (error && !error.message.includes('Sessão expirada')) Swal.fire('Erro!', 'Não foi possível carregar os dados.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const filteredSourceItems = useMemo(() => {
        const relationsArray = Object.values(allRelations);
        if (filterId === 'all') return relationsArray;
        return relationsArray.filter(rel => rel.necessidadeId === filterId);
    }, [filterId, allRelations]);

    const onDragStart = () => {
        setIsDragging(true);
    };

    const onDragEnd = async (result) => {
        setIsDragging(false);
        const { destination, source, draggableId } = result;
        if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index) || destination.droppableId === 'source') {
            return;
        }

        const isCopying = source.droppableId === 'source';
        const relation = isCopying ? allRelations[draggableId] : allRelations[draggableId.split('-occurrence-')[0]];
        if (!relation) return;
        
        const diaDeDestino = [parseInt(destination.droppableId)];

        try {
            Swal.showLoading();
            await agendarRelacaoNosDias(relation.relacaoId, diaDeDestino);
            
            if (!isCopying) {
                await removerAgendamentoDoDia(relation.relacaoId, parseInt(source.droppableId));
            }

            await Swal.close();
            fetchData();
        } catch (error) {
            Swal.close();
            if (error.message.includes('Duplicate entry')) {
                 Swal.fire('Atenção!', 'Este aluno já está agendado neste dia.', 'warning');
            } else if (error.message && !error.message.includes('Sessão expirada')) {
                Swal.fire('Erro!', 'Não foi possível salvar o agendamento.', 'error');
            }
            if (!error.message.includes('Duplicate entry')) {
                fetchData();
            }
        }
    };

    // =========================================================================
    // === FUNÇÃO DE DELETAR CORRIGIDA ===
    // =========================================================================
    const handleDelete = async (e, itemOccurrence, columnId) => {
        // Impede que o clique no botão inicie o "arrastar" do card
        if(e) e.stopPropagation();

        if(!itemOccurrence || !itemOccurrence.originalId) {
            console.error("Erro: ID original não encontrado no item.", itemOccurrence);
            return;
        }

        // Garante que pegamos a relação correta do dicionário
        const relation = allRelations[itemOccurrence.originalId];
        if(!relation) return;
        
        const result = await Swal.fire({
            title: 'Tem certeza?',
            text: `Remover "${relation.content}" de ${boardState.columns[columnId].title}?`,
            icon: 'warning', 
            showCancelButton: true, 
            confirmButtonColor: '#d33',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Sim, remover!', 
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                Swal.showLoading();
                
                // Chama a API de remoção passando o ID da Relação e o ID do Dia (Coluna)
                await removerAgendamentoDoDia(relation.relacaoId, parseInt(columnId));
                
                await Swal.close();
                await Swal.fire('Removido!', 'O agendamento foi excluído.', 'success');
                fetchData();
            } catch (error) {
                console.error(error);
                Swal.close();
                
                // Tratamento de erro específico para rota não encontrada (405 ou 404)
                if (error.message && (error.message.includes('DELETE method is not supported') || error.message.includes('405'))) {
                    Swal.fire({
                        title: 'Erro de Configuração',
                        text: 'A rota de exclusão (DELETE) não foi encontrada ou não é suportada no servidor. Verifique o Backend.',
                        icon: 'error'
                    });
                } else if (error && !error.message.includes('Sessão expirada')) {
                    Swal.fire('Erro!', 'Não foi possível remover o agendamento.', 'error');
                }
            }
        }
    };

    if (isLoading) return <div className="loading-message">Carregando cronograma...</div>;

    return (
        <section className="cronograma-container">
            <div className="cronograma-header">
                <h1><i className="bi bi-calendar-week"></i> Gerenciar Cronograma</h1>
            </div>

            <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
                <div className="cronograma-board-wrapper">
                    
                    {/* --- SIDEBAR RETRÁTIL --- */}
                    <div className={`sidebar-drawer ${isDragging ? 'is-dragging' : ''}`}>
                        <div className="drawer-tab">
                            <i className="bi bi-list-task"></i>
                            <span className="vertical-text">Alunos</span>
                        </div>

                        <div className="drawer-content">
                            <div className="source-header">
                                <h3>Alunos Disponíveis</h3>
                                <select className="filter-select" value={filterId} onChange={(e) => setFilterId(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}>
                                    <option value="all">Todas as Necessidades</option>
                                    {necessidades.map(nec => <option key={nec.id} value={nec.id}>{nec.necessidade}</option>)}
                                </select>
                            </div>
                            
                            <Droppable droppableId="source" isDropDisabled={true}>
                                {(provided) => (
                                    <div className="source-list" ref={provided.innerRef} {...provided.droppableProps}>
                                        {filteredSourceItems.map((item, index) => (
                                            <Draggable draggableId={item.id} index={index} key={item.id}>
                                                {(provided, snapshot) => (
                                                    <div 
                                                        className={`source-item ${snapshot.isDragging ? 'dragging' : ''}`} 
                                                        ref={provided.innerRef} 
                                                        {...provided.draggableProps} 
                                                        {...provided.dragHandleProps}
                                                    >
                                                        <i className="bi bi-person-fill" style={{marginRight:'8px'}}></i>
                                                        {item.content}
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </div>
                    </div>

                    {/* --- PAINEL PRINCIPAL --- */}
                    <div className="schedule-panel">
                        <div className="schedule-board">
                            {boardState && boardState.columnOrder.map(columnId => {
                                const column = boardState.columns[columnId];
                                // CORREÇÃO AQUI: Passando 'originalId' explicitamente
                                const items = column.itemIds.map(occurrence => ({
                                    ...allRelations[occurrence.originalId], 
                                    occurrenceId: occurrence.id,
                                    originalId: occurrence.originalId 
                                })).filter(item => item.id);
                                
                                return (
                                    <Droppable droppableId={column.id} key={column.id}>
                                        {(provided, snapshot) => (
                                            <div className="day-column" ref={provided.innerRef} {...provided.droppableProps}>
                                                <h3 className="day-title">{column.title}</h3>
                                                <div className={`cards-container ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}>
                                                    {items.map((item, index) => (
                                                        <Draggable draggableId={item.occurrenceId} index={index} key={item.occurrenceId}>
                                                            {(provided, snapshot) => (
                                                                <div 
                                                                    className={`student-card ${snapshot.isDragging ? 'dragging' : ''}`} 
                                                                    ref={provided.innerRef} 
                                                                    {...provided.draggableProps} 
                                                                    {...provided.dragHandleProps}
                                                                >
                                                                    <p className="student-name">{item.content}</p>
                                                                    <button 
                                                                        className="delete-schedule-button" 
                                                                        title="Remover" 
                                                                        onClick={(e) => handleDelete(e, item, column.id)}
                                                                        // Adicionado onMouseDown para evitar conflito com drag start
                                                                        onMouseDown={(e) => e.stopPropagation()}
                                                                    >
                                                                        <i className="bi bi-x-lg"></i>
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </Draggable>
                                                    ))}
                                                    {provided.placeholder}
                                                </div>
                                            </div>
                                        )}
                                    </Droppable>
                                );
                            })}
                        </div>
                    </div>

                </div>
            </DragDropContext>
        </section>
    );
};

export default CronogramaPage;