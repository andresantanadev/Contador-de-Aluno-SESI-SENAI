import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Swal from 'sweetalert2/dist/sweetalert2.all.min.js';
import {
  getTurmas,
  getContagensDeHoje,
  getNecessidades,
  getNecessidadeComAlunos,
  getCronograma,
  addContagem,
  updateContagem,
  getAlunosContagemNes,
  addAlunoNaContagemNes,
  removeAlunoDaContagemNes
} from '../../services/api';
import { PUBLIC_STORAGE_URL2 } from '../../config/apiConfig';
import placeholderAvatar from '../../assets/img/avatar.png';
import './ContagemPage.css';

const ContagemPage = () => {
  const [turmas, setTurmas] = useState([]);
  const [contagens, setContagens] = useState([]);
  const [necessidades, setNecessidades] = useState([]);
  const [alunosNesDeHoje, setAlunosNesDeHoje] = useState([]);
  const [idsAlunosNoCronograma, setIdsAlunosNoCronograma] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const hoje = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const carregarDados = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const [turmasRes, contagensRes, necessidadesRes, cronogramaRes, alunosNesRes] = await Promise.all([
        getTurmas(),
        getContagensDeHoje(),
        getNecessidades(),
        getCronograma(),
        getAlunosContagemNes()
      ]);

      setTurmas(turmasRes?.data || []);
      setContagens(contagensRes?.data || []);
      setNecessidades(necessidadesRes?.data || []);

      const apenasHoje = (alunosNesRes?.data || []).filter(nes => {
        const dataRegistro = nes.data_hora_contagem || (nes.contagem && nes.contagem.data_contagem);
        return dataRegistro && dataRegistro.startsWith(hoje);
      });
      setAlunosNesDeHoje(apenasHoje);

      const diasDaSemana = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
      const nomeDoDiaHoje = diasDaSemana[new Date().getDay()];
      const cronogramaDeHoje = (cronogramaRes?.data || []).find(d => d.dia.toLowerCase() === nomeDoDiaHoje);

      const idsDeHoje = new Set();
      if (cronogramaDeHoje?.alunos) {
        cronogramaDeHoje.alunos.forEach(a => { if (a.id) idsDeHoje.add(a.id); });
      }
      setIdsAlunosNoCronograma(idsDeHoje);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [hoje]);

  useEffect(() => { carregarDados(); }, [carregarDados]);

  // ALTERAÇÃO: Soma apenas as contagens que possuem a data de hoje
  const totalGeral = useMemo(() => {
    return contagens
      .filter(c => c.data_contagem === hoje)
      .reduce((sum, c) => sum + Number(c?.qtd_contagem || 0), 0);
  }, [contagens, hoje]);

  const getContagemDaTurma = useCallback(turmaId => {
    return contagens.find(c => c.turmas_id === turmaId && c.data_contagem === hoje) || null;
  }, [contagens, hoje]);

  const abrirModalContagem = async turma => {
    let contagemAtual = getContagemDaTurma(turma.id);
    const isCreatingContagem = !contagemAtual;
    const quantidadeInicial = isCreatingContagem ? 32 : Number(contagemAtual?.qtd_contagem || 0);

    Swal.fire({ title: 'Preparando Contagem...', didOpen: () => Swal.showLoading() });

    try {
      const necessidadesComAlunos = await Promise.all(necessidades.map(n => getNecessidadeComAlunos(n.id)));
      let alunosParaExibir = [];

      necessidadesComAlunos.forEach(nec => {
        (nec?.alunos || []).forEach(aluno => {
          if (aluno?.turmas_id === turma.id) {
            const isNAE = String(nec?.necessidade || '').toUpperCase() === 'NAE';
            const isInCronograma = idsAlunosNoCronograma.has(aluno.id);
            if (isNAE || isInCronograma) {
              alunosParaExibir.push({
                ...aluno,
                necessidade_id: nec?.id,
                necessidade_nome: nec?.necessidade,
                relacao_id: String(aluno.pivot?.id || aluno.alunos_has_necessidades_id)
              });
            }
          }
        });
      });

      if (isCreatingContagem) {
        const resNova = await addContagem({ quantidade: quantidadeInicial, turmaId: turma.id });
        contagemAtual = resNova?.data || resNova;
        await Promise.all(alunosParaExibir.map(aluno => addAlunoNaContagemNes(contagemAtual.id, aluno.relacao_id)));
        
        const resNes = await getAlunosContagemNes();
        const filtrados = (resNes?.data || []).filter(nes => (nes.data_hora_contagem || "").startsWith(hoje));
        setAlunosNesDeHoje(filtrados);
        setContagens(prev => [...prev, contagemAtual]);
      }

      let mapaAlunosAtivosModal = new Map();
      alunosNesDeHoje.forEach(nes => {
        if (nes.aluno && nes.aluno.id) {
          mapaAlunosAtivosModal.set(String(nes.aluno.id), nes.id);
        }
      });

      await Swal.fire({
        title: `Contagem - ${turma.nome_turma}`,
        html: `
          <div class="contador">
            <button id="menos" class="btn-contador">-</button>
            <input type="number" id="contadorValor" class="contador-input" value="${quantidadeInicial}"/>
            <button id="mais" class="btn-contador">+</button>
          </div>
          <h3 class="titulo-nes">Necessidades Especiais</h3>
          <div class="lista-nes">
            ${necessidades.map(n => {
              const alunosDoGrupo = alunosParaExibir.filter(a => a.necessidade_id === n.id);
              if (alunosDoGrupo.length === 0) return '';
              return `
                <div class="nes-group">
                  <h4>${n.necessidade}</h4>
                  ${alunosDoGrupo.map(a => {
                    const ativo = mapaAlunosAtivosModal.has(String(a.relacao_id));
                    return `
                      <div class="nes-item ${ativo ? 'ativo' : ''}" id="nes-item-${a.relacao_id}">
                        <img src="${a.foto ? `${PUBLIC_STORAGE_URL2}/${a.foto}` : placeholderAvatar}">
                        <span>${a.nome}</span>
                        <label class="switch">
                          <input type="checkbox" class="check-nes" data-relid="${a.relacao_id}" ${ativo ? 'checked' : ''}>
                          <span class="slider"></span>
                        </label>
                      </div>
                    `;
                  }).join('')}
                </div>
              `;
            }).join('')}
          </div>
        `,
        confirmButtonText: 'Salvar',
        confirmButtonColor: '#198754',
        showCancelButton: true,
        cancelButtonText: 'Fechar',
        cancelButtonColor: '#dc3545',
        reverseButtons: true,
        didOpen: () => {
          const input = document.getElementById('contadorValor');
          document.getElementById('menos').onclick = () => input.value = Math.max(0, parseInt(input.value) - 1);
          document.getElementById('mais').onclick = () => input.value = parseInt(input.value) + 1;

          document.querySelectorAll('.check-nes').forEach(chk => {
            chk.onchange = async e => {
              const relId = String(e.target.dataset.relid);
              const itemDiv = document.getElementById(`nes-item-${relId}`);
              try {
                if (e.target.checked) {
                  const res = await addAlunoNaContagemNes(contagemAtual.id, relId);
                  mapaAlunosAtivosModal.set(relId, (res?.data?.id || res?.id));
                  itemDiv.classList.add('ativo');
                } else {
                  const idParaRemover = mapaAlunosAtivosModal.get(relId);
                  if (idParaRemover) {
                    await removeAlunoDaContagemNes(idParaRemover);
                    mapaAlunosAtivosModal.delete(relId);
                    itemDiv.classList.remove('ativo');
                  }
                }
              } catch (err) {
                console.error("Erro na operação:", err);
                itemDiv.classList.remove('ativo');
                e.target.checked = false;
              }
            };
          });
        },
        preConfirm: () => ({ quantidadeFinal: parseInt(document.getElementById('contadorValor').value) })
      }).then(async result => {
        if (result.isConfirmed) {
          await updateContagem(contagemAtual.id, { quantidade: result.value.quantidadeFinal });
        }
        await carregarDados(false); 
      });
    } catch (error) { console.error(error); }
  };

  if (loading) return <div className="carregando"><div className="spinner"></div><p>Carregando...</p></div>;

  return (
    <section className="contagem-section">
      <div className="total-geral">
        <div><i className="bi bi-people-fill"></i> <span>Total de Alunos Hoje:</span></div>
        <strong>{totalGeral}</strong>
      </div>
      <div className="turmas-grid">
        {turmas.map(turma => {
          const contagem = getContagemDaTurma(turma.id);
          return (
            <button key={turma.id} className={`turma-card ${contagem ? 'tem-contagem' : 'sem-contagem'}`} onClick={() => abrirModalContagem(turma)}>
              <span className="turma-nome-display">{turma.nome_turma}</span>
              <span className="turma-contagem-display">{contagem ? `${contagem.qtd_contagem} alunos` : 'Fazer Contagem'}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default ContagemPage;