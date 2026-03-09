import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2/dist/sweetalert2.all.min.js';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
    getNecessidades, addNecessidade, updateNecessidade, deleteNecessidade, 
    getAlunos, addAluno, updateAluno, deleteAluno, getTurmas, 
    associarNecessidadesAoAluno, desassociarAlunoDaNecessidade, uploadFile,
    getNecessidadeComAlunos, agendarRelacaoNosDias, getCronograma, removerAgendamentoDoDia
} from '../../services/api';
import { PUBLIC_STORAGE_URL2 } from '../../config/apiConfig';
import placeholderAvatar from '../../assets/img/avatar.png';
import './PlanejamentoPage.css';

// --- COMPONENTES AUXILIARES ---

const SearchBar = ({ searchTerm, setSearchTerm, placeholder }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    return (
        <div className="search-container">
            <input 
                type="search" 
                placeholder={placeholder}
                className={`search-input ${isExpanded ? 'expanded' : ''}`}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                onBlur={() => { if(!searchTerm) setIsExpanded(false); }}
                onFocus={() => setIsExpanded(true)}
            />
            <button className="search-icon" onClick={() => setIsExpanded(true)}>
                <i className="bi bi-search"></i>
            </button>
        </div>
    );
};

const AlunoCard = ({ aluno, type, turmasMap, onAdd, onEdit, onDelete, onSchedule, onRemove, disabledAdd }) => (
    <div className="aluno-card">
        <div className="card-header">
            <img src={aluno.foto ? `${PUBLIC_STORAGE_URL2}/${aluno.foto}` : placeholderAvatar} alt={aluno.nome} className="card-photo" />
            <div className="card-info">
                <h5 className="card-name">{aluno.nome}</h5>
                {/* RM removido da visualização conforme solicitado */}
                <span className="card-details">{turmasMap[aluno.turmas_id] || 'Sem Turma'}</span>
            </div>
        </div>
        {aluno.descricao && type === 'associado' && (
            <div className="card-body">
                <p className="card-description-text">{aluno.descricao}</p>
            </div>
        )}
        <div className="card-actions" data-button-count={type === 'geral' ? 3 : 2}>
            {type === 'geral' ? (
                <>
                    <button title="Adicionar à necessidade" className="action-button-card add" onClick={onAdd} disabled={disabledAdd}><i className="bi bi-plus-lg"></i></button>
                    <button title="Editar Aluno" className="action-button-card edit" onClick={onEdit}><i className="bi bi-pencil-fill"></i></button>
                    <button title="Deletar Aluno" className="action-button-card delete" onClick={onDelete}><i className="bi bi-trash-fill"></i></button>
                </>
            ) : (
                <>
                    <button className="action-button-card schedule" onClick={onSchedule} title="Agendar Dia"><i className="bi bi-calendar-week"></i></button>
                    <button className="action-button-card remove" onClick={onRemove} title="Remover da Categoria"><i className="bi bi-trash-fill"></i></button>
                </>
            )}
        </div>
    </div>
);

// --- COMPONENTE PRINCIPAL ---

const PlanejamentoPage = () => {
    const [necessidades, setNecessidades] = useState([]);
    const [todosAlunos, setTodosAlunos] = useState([]);
    const [turmas, setTurmas] = useState([]);
    const [dadosCompletos, setDadosCompletos] = useState([]);
    const [diasDaSemana, setDiasDaSemana] = useState([]);
    const [selectedNecessidadeId, setSelectedNecessidadeId] = useState(null);
    const [searchTermCentral, setSearchTermCentral] = useState('');
    const [searchTermAlunosPanel, setSearchTermAlunosPanel] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    
    const turmasMap = useMemo(() => turmas.reduce((map, turma) => {
        map[turma.id] = turma.nome_turma;
        return map;
    }, {}), [turmas]);

    const fetchData = useCallback(async () => {
        try {
            setIsLoading(true);
            const [necessidadesData, alunosData, turmasData, cronogramaData] = await Promise.all([
                getNecessidades(1, 100), getAlunos(1, 1000), getTurmas(1, 100), getCronograma()
            ]);
            
            setNecessidades(necessidadesData.data || []);
            setTodosAlunos(alunosData.data || []);
            setTurmas(turmasData.data || []);
            setDiasDaSemana(cronogramaData.data || []);

            if (necessidadesData.data?.length > 0) {
                const resultados = await Promise.all(necessidadesData.data.map(nec => getNecessidadeComAlunos(nec.id)));
                setDadosCompletos(resultados.filter(Boolean));
            }
        } catch (error) {
            console.error(error);
        } finally { setIsLoading(false); }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleSelectNecessidade = (id) => {
        setSelectedNecessidadeId(id);
        setSearchTermCentral('');
    };
    
    const displayedAlunosCentral = useMemo(() => {
        if (!selectedNecessidadeId) return [];
        const necSel = dadosCompletos.find(nec => nec.id === selectedNecessidadeId);
        let alunosToShow = (necSel?.alunos || []).map(aluno => todosAlunos.find(a => a.id === aluno.id)).filter(Boolean);
        
        if (searchTermCentral) {
            return alunosToShow.filter(aluno => aluno.nome.toLowerCase().includes(searchTermCentral.toLowerCase()));
        }
        return alunosToShow;
    }, [selectedNecessidadeId, todosAlunos, dadosCompletos, searchTermCentral]);
    
    const filteredAlunosPanel = useMemo(() => 
        todosAlunos.filter(a => a.nome.toLowerCase().includes(searchTermAlunosPanel.toLowerCase()))
    , [todosAlunos, searchTermAlunosPanel]);

    // --- CRUD NECESSIDADES ---

    const handleAddNecessidade = async () => {
        const { value: nome } = await Swal.fire({ title: 'Criar Categoria', input: 'text', inputPlaceholder: 'Ex: Sem Glúten', showCancelButton: true, confirmButtonText: 'Criar', confirmButtonColor: '#28a745' });
        if (nome) {
            try {
                await addNecessidade(nome);
                fetchData();
            } catch (e) { Swal.fire('Erro', 'Falha ao criar.', 'error'); }
        }
    };

    // --- CRUD ALUNOS (RM E DATA AUTOMÁTICOS) ---

    const handleOpenAlunoModal = (aluno = null) => {
        const isEditing = !!aluno;
        const turmasOptionsHtml = turmas.map(t => `<option value="${t.id}" ${isEditing && aluno.turmas_id == t.id ? 'selected' : ''}>${t.nome_turma}</option>`).join('');

        Swal.fire({
            title: isEditing ? 'Editar Aluno' : 'Adicionar Aluno',
            width: '550px',
            html: `
                <div class="swal-form-container">
                    <input id="swal-nome" class="swal2-input" placeholder="Nome do Aluno" value="${isEditing ? aluno.nome : ''}">
                    
                    <select id="swal-genero" class="swal2-select">
                        <option value="">Selecione o Gênero</option>
                        <option value="Masculino" ${isEditing && aluno.genero === 'Masculino' ? 'selected' : ''}>Masculino</option>
                        <option value="Feminino" ${isEditing && aluno.genero === 'Feminino' ? 'selected' : ''}>Feminino</option>
                    </select>

                    <select id="swal-turma" class="swal2-select">
                        <option value="">Selecione a Turma</option>
                        ${turmasOptionsHtml}
                    </select>

                    <div style="margin-top:15px; text-align:left; padding:0 20px;">
                        <label style="font-weight:600; color:#555; font-size:14px;">Foto do Aluno (Opcional)</label>
                        <input id="swal-foto" type="file" class="swal2-file" style="margin-top:5px;" accept="image/*">
                    </div>

                    <textarea id="swal-descricao" class="swal2-textarea" placeholder="Observações/Restrições...">${isEditing ? aluno.descricao || '' : ''}</textarea>
                </div>
            `,
            focusConfirm: false, 
            showCancelButton: true, 
            confirmButtonText: 'Salvar',
            confirmButtonColor: '#28a745',
            preConfirm: async () => {
                const nome = document.getElementById('swal-nome').value;
                if (!nome) return Swal.showValidationMessage('O nome é obrigatório!');

                // --- Lógica Automática solicitada ---
                const rmAuto = isEditing ? aluno.rm : `AUTO-${Date.now()}`;
                const dataNascAuto = "0001-01-01";

                const data = {
                    nome,
                    rm: rmAuto,
                    data_nascimento: dataNascAuto,
                    genero: document.getElementById('swal-genero').value,
                    turmas_id: document.getElementById('swal-turma').value,
                    descricao: document.getElementById('swal-descricao').value,
                };

                const fotoFile = document.getElementById('swal-foto').files[0];
                if (fotoFile) {
                    try {
                        const uploadResponse = await uploadFile(fotoFile);
                        data.foto = uploadResponse.path;
                    } catch (e) { return Swal.showValidationMessage('Erro no upload da foto.'); }
                }
                return data;
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    isEditing ? await updateAluno(aluno.id, result.value) : await addAluno(result.value);
                    Swal.fire({ icon: 'success', title: 'Salvo!', timer: 1500, showConfirmButton: false });
                    fetchData();
                } catch (e) { Swal.fire('Erro', 'Não foi possível salvar.', 'error'); }
            }
        });
    };

    // --- RESTANTE DAS FUNÇÕES (ASSOCIAR, AGENDAR, PDF) ---

    const handleAddAlunoToNecessidade = async (alunoId) => {
        if (!selectedNecessidadeId) return Swal.fire('Aviso', 'Selecione uma categoria primeiro!', 'info');
        try {
            await associarNecessidadesAoAluno(alunoId, [selectedNecessidadeId]);
            fetchData();
        } catch (e) { Swal.fire('Erro', 'Falha ao associar.', 'error'); }
    };

    const handleRemoveAlunoFromNecessidade = async (aluno) => {
        const res = await Swal.fire({ title: 'Remover?', text: `Remover ${aluno.nome} desta categoria?`, icon: 'warning', showCancelButton: true });
        if (res.isConfirmed) {
            try {
                await desassociarAlunoDaNecessidade(selectedNecessidadeId, aluno.id);
                fetchData();
            } catch (e) { Swal.fire('Erro', 'Falha ao remover.', 'error'); }
        }
    };

    const handleDeleteAluno = async (id) => {
        const res = await Swal.fire({ title: 'Excluir?', text: 'Isso apagará o aluno permanentemente.', icon: 'error', showCancelButton: true });
        if (res.isConfirmed) {
            try {
                await deleteAluno(id);
                fetchData();
            } catch (e) { Swal.fire('Erro', 'Falha ao excluir.', 'error'); }
        }
    };

    const handleOpenScheduleModal = async (aluno) => {
        const relacao = dadosCompletos.find(n => n.id === selectedNecessidadeId)?.alunos?.find(a => a.id === aluno.id);
        if(!relacao?.pivot?.id) return;
        
        const relacaoId = relacao.pivot.id;
        const diasAgendados = [];
        diasDaSemana.forEach(d => {
            if(d.alunos.some(ag => String(ag.id) === String(aluno.id) && String(ag.necessidade_relacionada?.id) === String(selectedNecessidadeId))) {
                diasAgendados.push(String(d.id));
            }
        });

        const { value: selectedIds } = await Swal.fire({
            title: `Dias para ${aluno.nome}`,
            html: `<div class="swal-checkbox-container">${diasDaSemana.map(d => `
                <label class="swal-checkbox-label">
                    <input type="checkbox" class="swal-dia-checkbox" value="${d.id}" ${diasAgendados.includes(String(d.id)) ? 'checked' : ''}> ${d.dia}
                </label>`).join('')}</div>`,
            showCancelButton: true,
            preConfirm: () => Array.from(document.querySelectorAll('.swal-dia-checkbox:checked')).map(cb => cb.value)
        });

        if (selectedIds) {
            try {
                const toAdd = selectedIds.filter(id => !diasAgendados.includes(id));
                const toRem = diasAgendados.filter(id => !selectedIds.includes(id));
                if(toAdd.length) await agendarRelacaoNosDias(relacaoId, toAdd);
                if(toRem.length) await Promise.all(toRem.map(id => removerAgendamentoDoDia(relacaoId, id)));
                fetchData();
            } catch (e) { Swal.fire('Erro', 'Erro ao agendar.', 'error'); }
        }
    };

    const handleDownloadPdf = () => {
        const doc = new jsPDF();
        doc.setFontSize(18); doc.text("Relatório de Contagens - Menu Solutions", 14, 20);
        doc.setFontSize(10); doc.text(`Gerado em: ${new Date().toLocaleDateString()}`, 14, 28);

        const rows = [];
        dadosCompletos.forEach(nec => {
            nec.alunos.forEach(al => {
                const dias = diasDaSemana.filter(d => d.alunos.some(a => a.id === al.id && a.necessidade_relacionada?.id === nec.id)).map(d => d.dia).join(', ');
                rows.push([al.nome, turmasMap[al.turmas_id] || 'N/A', nec.necessidade, dias || 'Sempre']);
            });
        });

        autoTable(doc, {
            startY: 35,
            head: [['Aluno', 'Turma', 'Categoria', 'Dias Agendados']],
            body: rows,
            theme: 'striped'
        });
        doc.save('relatorio_planejamento.pdf');
    };

    return (
        <section className="planejamento-container-grid">
            <div className="panel-lateral panel-necessidades">
                <div className="panel-header">
                    <h3>Categorias</h3>
                    <button className="add-button-small" onClick={handleAddNecessidade}>+</button>
                </div>
                <div className="list-container">
                    {necessidades.map(nec => (
                        <div key={nec.id} className={`list-item-container ${selectedNecessidadeId === nec.id ? 'active' : ''}`} onClick={() => handleSelectNecessidade(nec.id)}>
                            <span className="list-item-name">{nec.necessidade}</span>
                            <div className="list-item-actions">
                                <button onClick={(e) => { e.stopPropagation(); /* edit nec */ }}><i className="bi bi-pencil-fill"></i></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="panel-central">
                <div className="panel-header">
                    <h3>{selectedNecessidadeId ? `Alunos em ${necessidades.find(n => n.id === selectedNecessidadeId)?.necessidade}` : 'Selecione uma Categoria'}</h3>
                    <div className="header-actions">
                        <SearchBar searchTerm={searchTermCentral} setSearchTerm={setSearchTermCentral} placeholder="Buscar..." />
                        <button className="action-button-pdf" onClick={handleDownloadPdf}><i className="bi bi-file-pdf"></i> PDF</button>
                    </div>
                </div>
                <div className="grid-container-central">
                    {displayedAlunosCentral.map(aluno => (
                        <AlunoCard key={aluno.id} aluno={aluno} type="associado" turmasMap={turmasMap} onSchedule={() => handleOpenScheduleModal(aluno)} onRemove={() => handleRemoveAlunoFromNecessidade(aluno)} />
                    ))}
                </div>
            </div>

            <div className="panel-lateral panel-alunos">
                <div className="panel-header">
                    <h3>Base de Alunos</h3>
                    <button className="add-button-small" onClick={() => handleOpenAlunoModal()}>+</button>
                </div>
                <div style={{padding: '0 15px 10px'}}><SearchBar searchTerm={searchTermAlunosPanel} setSearchTerm={setSearchTermAlunosPanel} placeholder="Filtrar base..." /></div>
                <div className="list-container-cards">
                    {filteredAlunosPanel.map(aluno => (
                        <AlunoCard key={aluno.id} aluno={aluno} type="geral" turmasMap={turmasMap} onAdd={() => handleAddAlunoToNecessidade(aluno.id)} onEdit={() => handleOpenAlunoModal(aluno)} onDelete={() => handleDeleteAluno(aluno.id)} disabledAdd={!selectedNecessidadeId} />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default PlanejamentoPage;