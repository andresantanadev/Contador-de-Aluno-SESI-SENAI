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
import { PUBLIC_STORAGE_URL } from '../../config/apiConfig';
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
        getAlunosContagemNes() // Corrigido no api.js
      ]);

      // DEBUG: respostas brutas
      console.log('[DEBUG] getCronograma() raw:', cronogramaRes);
      console.log('[DEBUG] getAlunosContagemNes() raw:', alunosNesRes);

      setTurmas(turmasRes?.data || []);
      setContagens(contagensRes?.data || []);
      setNecessidades(necessidadesRes?.data || []);
      setAlunosNesDeHoje(alunosNesRes?.data || []);

      const diasDaSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
      const hojeIndex = new Date().getDay();
      const nomeDoDiaHoje = diasDaSemana[hojeIndex];

      const dadosDoCronograma = cronogramaRes?.data || [];
      const cronogramaDeHoje = dadosDoCronograma.find(d => d.dia === nomeDoDiaHoje);

      console.log(`[DEBUG] Procurando cronograma para: ${nomeDoDiaHoje}`);
      console.log('[DEBUG] cronogramaDeHoje:', cronogramaDeHoje);

      const idsDeHoje = new Set();
      if (cronogramaDeHoje && Array.isArray(cronogramaDeHoje.alunos)) {
        console.log('[DEBUG] Alunos no cronogramaDeHoje:', cronogramaDeHoje.alunos);
        cronogramaDeHoje.alunos.forEach(alunoRelacao => {
          console.log('[DEBUG] alunoRelacao item:', alunoRelacao);
          // A API aqui retorna objetos de aluno — vamos pegar o ID do aluno (aluno.id)
          // Caso o formato seja diferente, tente pivot.id ou alunos_has_necessidades_id
          const alunoId = alunoRelacao?.id ?? alunoRelacao?.aluno?.id ?? alunoRelacao?.alunos_has_necessidades_id ?? alunoRelacao?.pivot?.id;
          if (typeof alunoId !== 'undefined' && alunoId !== null) {
            idsDeHoje.add(alunoId);
          }
        });
      }

      console.log('[DEBUG] IDs de alunos do cronograma (final):', idsDeHoje);
      setIdsAlunosNoCronograma(idsDeHoje);
    } catch (error) {
      console.error('Erro no carregarDados:', error);
      if (!String(error?.message || '').includes('Sessão expirada')) {
        Swal.fire('Erro!', 'Não foi possível carregar os dados essenciais da página.', 'error');
      }
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const totalGeral = useMemo(
    () =>
      contagens
        .filter(c => c.data_contagem === hoje)
        .reduce((sum, c) => sum + Number(c?.qtd_contagem || 0), 0),
    [contagens, hoje]
  );

  const getContagemDaTurma = useCallback(
    turmaId => {
      const contagensDaTurmaHoje = contagens.filter(c => c.turmas_id === turmaId && c.data_contagem === hoje);
      if (contagensDaTurmaHoje.length === 0) return null;
      if (contagensDaTurmaHoje.length === 1) return contagensDaTurmaHoje[0];
      const idsComFilhos = new Set(alunosNesDeHoje.map(nes => nes.contagem_id));
      const contagemComFilhos = contagensDaTurmaHoje.find(
        c => idsComFilhos.has(c.id) || idsComFilhos.has(String(c.id))
      );
      return contagemComFilhos || contagensDaTurmaHoje[0];
    },
    [contagens, hoje, alunosNesDeHoje]
  );

  const abrirModalContagem = async turma => {
    let contagemAtual = getContagemDaTurma(turma.id);
    const isCreatingContagem = !contagemAtual;
    const quantidadeInicial = isCreatingContagem ? 32 : Number(contagemAtual?.qtd_contagem || 0);

    Swal.fire({
      title: 'Preparando Contagem...',
      text: `Buscando dados para a turma ${turma.nome_turma}`,
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    try {
      const necessidadesComAlunos = await Promise.all((necessidades || []).map(n => getNecessidadeComAlunos(n.id)));
      let alunosParaExibir = [];

      console.log('[DEBUG] idsAlunosNoCronograma (Set):', idsAlunosNoCronograma);

      necessidadesComAlunos.forEach(nec => {
        (nec?.alunos || []).forEach(aluno => {
          // joinId = id da relação pivot (alunos_has_necessidades)
          const joinId = aluno?.pivot?.id ?? aluno?.alunos_has_necessidades_id ?? null;
          const alunoId = aluno?.id ?? null;

          // somente considerar alunos da turma e que tenham joinId (para controlar NES) ou que sejam NAI
          if (aluno?.turmas_id === turma.id) {
            const isNAI = String(nec?.necessidade || '').toUpperCase() === 'NAI';
            // Agora comparamos o ID do ALUNO contra o Set que contém IDs de aluno do cronograma
            const isInCronograma = alunoId !== null && idsAlunosNoCronograma.has(alunoId);

            if (isNAI || isInCronograma) {
              alunosParaExibir.push({
                ...aluno,
                necessidade_id: nec?.id,
                necessidade_nome: nec?.necessidade,
                alunos_has_necessidades_id: joinId // pode ser null para NAI, mas ok
              });
            }

            // debug condicional para casos estranhos
            if (String(aluno?.nome || '').includes('cdsvsrcweswe')) {
              console.log('[DEBUG] aluno detectado (checa):', {
                nome: aluno.nome,
                joinId,
                alunoId,
                isNAI,
                isInCronograma
              });
            }
          }
        });
      });

      // 2. Lógica de Criação Automática
      let mapaAlunosAtivosModal = new Map(); // chave: joinId (relação) -> valor: id do registro contagem_nes
      let dadosNesParaRenderizar = [...(alunosNesDeHoje || [])];

      if (isCreatingContagem && alunosParaExibir.length > 0) {
        try {
          const novaContagemResponse = await addContagem({ quantidade: quantidadeInicial, turmaId: turma.id });
          contagemAtual = novaContagemResponse?.data || novaContagemResponse;
          if (!contagemAtual) throw new Error('Falha ao criar contagem principal inicial.');
          setContagens(prev => [...prev, contagemAtual]);
        } catch (err) {
          throw new Error(`Erro ao criar contagem principal: ${err?.message || err}`);
        }

        try {
          // nesExistentes deve ser um Set das chaves de relação já presentes
          const nesExistentes = new Set(
            (alunosNesDeHoje || []).map(nes => nes?.alunos_has_necessidades_id ?? nes?.aluno?.pivot?.id ?? nes?.aluno?.id)
          );

          const nesParaCriar = alunosParaExibir.filter(
            aluno => {
              // somente tentar criar NES se tiver joinId (relação). Se não tiver, pulamos.
              const joinId = aluno?.alunos_has_necessidades_id ?? aluno?.pivot?.id ?? aluno?.id;
              return joinId && !nesExistentes.has(joinId);
            }
          );

          if (nesParaCriar.length > 0) {
            const promessasCriacao = nesParaCriar.map(aluno =>
              addAlunoNaContagemNes(contagemAtual.id, aluno.alunos_has_necessidades_id)
            );
            await Promise.all(promessasCriacao);
          }
        } catch (createError) {
          console.error('Erro na criação automática de NES:', createError);
        }

        try {
          const alunosNesRes = await getAlunosContagemNes();
          dadosNesParaRenderizar = alunosNesRes?.data || [];
          setAlunosNesDeHoje(dadosNesParaRenderizar);
        } catch (fetchError) {
          console.error('Erro ao re-buscar NES:', fetchError);
          throw new Error(`Erro ao buscar dados pós-criação: ${fetchError?.message || fetchError}`);
        }
      }

      // 3. Preencher mapa: chave = joinId (alunos_has_necessidades_id ou pivot.id ou aluno.id), valor = nes.id (registro)
      dadosNesParaRenderizar.forEach(nes => {
        const chaveRel = nes?.alunos_has_necessidades_id ?? nes?.aluno?.pivot?.id ?? nes?.aluno?.id;
        if (typeof chaveRel !== 'undefined' && chaveRel !== null && nes?.id) {
          mapaAlunosAtivosModal.set(chaveRel, nes.id);
        }
      });

      console.log('[DEBUG] mapaAlunosAtivosModal inicial:', mapaAlunosAtivosModal);

      // 4. Montar e exibir modal
      await Swal.fire({
        title: `Contagem - ${turma.nome_turma}`,
        html: `
          <div class="contador">
            <button id="menos" class="btn-contador" aria-label="Diminuir">-</button>
            <input type="number" id="contadorValor" class="contador-input" value="${quantidadeInicial}" min="0"/>
            <button id="mais" class="btn-contador" aria-label="Aumentar">+</button>
          </div>
          ${alunosParaExibir.length > 0 ? `
            <h3 class="titulo-nes">Necessidades Especiais</h3>
            <div class="lista-nes">
              ${necessidades
                .map(n => {
                  const alunosDoGrupo = alunosParaExibir.filter(a => a.necessidade_id === n.id);
                  if (!alunosDoGrupo || alunosDoGrupo.length === 0) return '';
                  return `
                    <div class="nes-group">
                      <h4>${n.necessidade}</h4>
                      ${alunosDoGrupo
                        .map(a => {
                          const chave = a.alunos_has_necessidades_id ?? a.pivot?.id ?? a.id;
                          const ativo = mapaAlunosAtivosModal.has(chave);
                          return `
                            <div class="nes-item ${ativo ? 'ativo' : ''}" id="nes-item-${chave}">
                              <img src="${a.foto ? `${PUBLIC_STORAGE_URL}/${a.foto}` : placeholderAvatar}" alt="${a.nome}">
                              <span>${a.nome}</span>
                              <label class="switch">
                                <input type="checkbox" data-aluno-nes-id="${chave}" ${ativo ? 'checked' : ''}>
                                <span class="slider"></span>
                              </label>
                            </div>
                          `;
                        })
                        .join('')}
                    </div>
                  `;
                })
                .join('')}
            </div>
          ` : '<p>Nenhum aluno com necessidades especiais para exibir hoje.</p>'}
        `,
        confirmButtonText: 'Salvar',
        confirmButtonColor: '#198754',
        showCancelButton: true,
        cancelButtonText: 'Fechar',
        cancelButtonColor: '#dc3545',
        reverseButtons: true,
        width: 600,
        didOpen: () => {
          const contadorInput = document.getElementById('contadorValor');
          document.getElementById('menos').onclick = () => {
            contadorInput.value = Math.max(0, parseInt(contadorInput.value || '0', 10) - 1);
          };
          document.getElementById('mais').onclick = () => {
            contadorInput.value = parseInt(contadorInput.value || '0', 10) + 1;
          };

          document.querySelectorAll('.nes-item input[type="checkbox"]').forEach(chk => {
            chk.addEventListener('change', async e => {
              const alunoNesId = parseInt(e.target.dataset.alunoNesId, 10); // essa é a chaveRel usada no mapa
              const itemElement = e.target.closest('.nes-item');

              if (!contagemAtual) {
                try {
                  const qtdAtual = parseInt(document.getElementById('contadorValor').value || '0', 10) || (isCreatingContagem ? 32 : 0);
                  const novaContagemResponse = await addContagem({ quantidade: qtdAtual, turmaId: turma.id });
                  contagemAtual = novaContagemResponse?.data || novaContagemResponse;
                  if (!contagemAtual) throw new Error('Falha ao criar contagem de referência.');
                  setContagens(prev => [...prev, contagemAtual]);
                } catch (err) {
                  Swal.showValidationMessage(`Erro ao criar contagem principal: ${err?.message || err}`);
                  e.target.checked = !e.target.checked;
                  return;
                }
              }

              if (e.target.checked) {
                // adicionar NES: se já tivermos mapa, não duplicar
                if (!mapaAlunosAtivosModal.has(alunoNesId)) {
                  try {
                    const res = await addAlunoNaContagemNes(contagemAtual.id, alunoNesId);
                    const novoRegistro = res?.data || res;
                    const novoContagemNesId = novoRegistro?.id;
                    // guardamos no mapa com a chaveRel (alunoNesId) -> id do registro (novoContagemNesId)
                    if (novoContagemNesId) {
                      mapaAlunosAtivosModal.set(alunoNesId, novoContagemNesId);
                      itemElement.classList.add('ativo');
                    } else {
                      throw new Error('API não retornou ID ao criar NES.');
                    }
                  } catch (err) {
                    console.error('Erro ao adicionar NES:', err);
                    Swal.showValidationMessage(`Erro: ${err?.message || err}`);
                    e.target.checked = false;
                    itemElement.classList.remove('ativo');
                  }
                } else {
                  itemElement.classList.add('ativo');
                }
              } else {
                // remover NES: procurar id do registro no mapa e remover
                const idParaRemover = mapaAlunosAtivosModal.get(alunoNesId);
                if (idParaRemover) {
                  try {
                    await removeAlunoDaContagemNes(idParaRemover);
                    mapaAlunosAtivosModal.delete(alunoNesId);
                    itemElement.classList.remove('ativo');
                  } catch (err) {
                    console.error('Erro ao remover NES:', err);
                    Swal.showValidationMessage(`Erro: ${err?.message || err}`);
                    e.target.checked = true;
                    itemElement.classList.add('ativo');
                  }
                } else {
                  console.warn('Tentativa de remover NES não encontrado no mapa:', alunoNesId);
                  itemElement.classList.remove('ativo');
                }
              }
            });
          });
        },
        preConfirm: () => {
          return {
            quantidadeFinal: parseInt(document.getElementById('contadorValor').value || '0', 10),
            contagemOriginal: contagemAtual
          };
        }
      }).then(async result => {
        if (result.isConfirmed) {
          const { quantidadeFinal, contagemOriginal } = result.value;
          try {
            if (contagemOriginal) {
              if (Number(contagemOriginal.qtd_contagem) !== Number(quantidadeFinal)) {
                await updateContagem(contagemOriginal.id, { quantidade: quantidadeFinal });
              }
            } else {
              if (quantidadeFinal > 0 || (isCreatingContagem && quantidadeFinal === 32 && alunosParaExibir.length === 0)) {
                await addContagem({ quantidade: quantidadeFinal, turmaId: turma.id });
              }
            }
            Swal.fire('Sucesso', 'Contagem salva!', 'success');
          } catch (error) {
            Swal.fire('Erro!', `Não foi possível salvar o número da contagem. <br><small>${error?.message || error}</small>`, 'error');
          }
        }
        carregarDados(false);
      });
    } catch (error) {
      console.error('Erro ao abrir modal:', error);
      Swal.fire('Erro Fatal!', `Não foi possível processar a contagem. <br><small>${error?.message || error}</small>`, 'error');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="carregando">
        <div className="spinner"></div>
        <p>Carregando dados...</p>
      </div>
    );
  }

  return (
    <section className="contagem-section">
      <div className="total-geral">
        <div>
          <i className="bi bi-people-fill"></i>
          <span>Total de Alunos Hoje:</span>
        </div>
        <strong>{totalGeral}</strong>
      </div>

      <div className="turmas-grid">
        {turmas.map(turma => {
          const contagem = getContagemDaTurma(turma.id);
          return (
            <button
              key={turma.id}
              className={`turma-card ${contagem ? 'tem-contagem' : 'sem-contagem'}`}
              onClick={() => abrirModalContagem(turma)}
            >
              <span className="turma-nome-display">{turma.nome_turma}</span>
              <span className="turma-contagem-display">
                {contagem ? `${contagem.qtd_contagem} alunos` : 'Fazer Contagem'}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default ContagemPage;
