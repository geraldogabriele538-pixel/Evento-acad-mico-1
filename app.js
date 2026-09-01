// ---------------------------------------------------------------
// Navegação (abas principais + subabas)
// ---------------------------------------------------------------
document.querySelectorAll('.tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
  });
});
document.querySelectorAll('.subtabs').forEach(group => {
  group.querySelectorAll('.subtab').forEach(btn => {
    btn.addEventListener('click', () => {
      group.querySelectorAll('.subtab').forEach(b => b.classList.remove('active'));
      group.parentElement.querySelectorAll(':scope > .subpanel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.dataset.sub).classList.add('active');
    });
  });
});

// ---------------------------------------------------------------
// Helpers de API
// ---------------------------------------------------------------
async function apiGet(path) {
  const res = await fetch(path);
  return res.json();
}
async function apiPost(path, body) {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erro desconhecido');
  return data;
}

function showMsg(id, text, ok) {
  const el = document.getElementById(id);
  el.textContent = text;
  el.className = 'msg ' + (ok ? 'ok' : 'err');
}

function renderTable(container, rows, columns) {
  const el = typeof container === 'string' ? document.getElementById(container) : container;
  if (!rows || rows.length === 0) {
    el.innerHTML = '<p class="empty">Nenhum registro encontrado.</p>';
    return;
  }
  const cols = columns || Object.keys(rows[0]).filter(k => typeof rows[0][k] !== 'object');
  let html = '<table><thead><tr>' + cols.map(c => `<th>${c.label || c}</th>`).join('') + '</tr></thead><tbody>';
  for (const row of rows) {
    html += '<tr>' + cols.map(c => {
      const key = c.key || c;
      let val = row[key];
      if (Array.isArray(val)) {
        val = val.map(v => `<span class="pill">${v.nome || v}</span>`).join(' ') || '—';
      } else if (val === null || val === undefined || val === '') {
        val = '—';
      }
      return `<td>${val}</td>`;
    }).join('') + '</tr>';
  }
  html += '</tbody></table>';
  el.innerHTML = html;
}

function formToObj(form) {
  const obj = {};
  for (const el of form.elements) {
    if (!el.name) continue;
    if (el.tagName === 'SELECT' && el.multiple) {
      obj[el.name] = Array.from(el.selectedOptions).map(o => o.value);
    } else {
      obj[el.name] = el.value;
    }
  }
  return obj;
}

// ---------------------------------------------------------------
// Listas auxiliares (datalists / selects) — recarregadas sob demanda
// ---------------------------------------------------------------
async function refreshAuxLists() {
  const [instituicoes, vinculos, tipos, organizadores, apoio, atividades, hoteis] = await Promise.all([
    apiGet('/api/instituicoes'),
    apiGet('/api/vinculos'),
    apiGet('/api/tipos_atividade'),
    apiGet('/api/equipe_organizadora'),
    apiGet('/api/equipe_apoio'),
    apiGet('/api/atividades'),
    apiGet('/api/hoteis'),
  ]);

  fillDatalist('lista-instituicoes', instituicoes.map(i => i.nome));
  fillDatalist('lista-vinculos', vinculos.map(v => v.vinculo));
  fillDatalist('lista-tipos', tipos.map(t => t.tipo));

  fillSelect('select-organizadores', organizadores, o => o.cpf, o => `${o.nome} (${o.cpf})`);
  fillSelect('select-apoio', apoio, a => a.cpf, a => `${a.nome} (${a.cpf})`);

  const atividadeLabel = a => `${a.nome} — ${a.dia} ${a.hora}`;
  fillSelect('select-atividade-ministrante', atividades, a => a.id, atividadeLabel);
  fillSelect('select-atividade-presenca', atividades, a => a.id, atividadeLabel);

  fillSelect('select-hotel-quarto', hoteis, h => h.nome, h => h.nome);
  fillSelect('select-hotel-alocacao', hoteis, h => h.nome, h => h.nome);
}

function fillDatalist(id, values) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = values.map(v => `<option value="${v}">`).join('');
}
function fillSelect(id, items, valueFn, labelFn) {
  const el = document.getElementById(id);
  if (!el) return;
  const selected = el.multiple ? Array.from(el.selectedOptions).map(o => o.value) : el.value;
  el.innerHTML = items.map(it => `<option value="${valueFn(it)}">${labelFn(it)}</option>`).join('');
  if (el.multiple) {
    Array.from(el.options).forEach(o => { if (selected.includes(o.value)) o.selected = true; });
  } else if (selected) {
    el.value = selected;
  }
}

// atualiza os quartos disponíveis quando o hotel de alocação muda
document.getElementById('select-hotel-alocacao').addEventListener('change', async (e) => {
  const quartos = await apiGet('/api/quartos_hotel?hotel=' + encodeURIComponent(e.target.value));
  fillSelect('select-quarto-alocacao', quartos, q => q.quarto, q => `${q.quarto} (ocupantes: ${q.ocupantes})`);
});
document.getElementById('select-hotel-quarto').addEventListener('focus', refreshAuxLists);

// ---------------------------------------------------------------
// Formulários de CADASTRO
// ---------------------------------------------------------------
function bindForm(formId, path, msgId, transform, onSuccess) {
  const form = document.getElementById(formId);
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    let body = formToObj(form);
    if (transform) body = transform(body);
    try {
      await apiPost(path, body);
      showMsg(msgId, 'Salvo com sucesso.', true);
      form.reset();
      await refreshAuxLists();
      if (onSuccess) onSuccess();
    } catch (err) {
      showMsg(msgId, 'Erro: ' + err.message, false);
    }
  });
}

bindForm('form-pessoa', '/api/pessoas', 'msg-pessoa', async (body) => {
  if (body.instituicao_origem) await apiPost('/api/instituicoes', { nome: body.instituicao_origem });
  if (body.vinculo) await apiPost('/api/vinculos', { vinculo: body.vinculo });
  return body;
});

bindForm('form-inscricao', '/api/inscritos', 'msg-inscricao');
bindForm('form-organizacao', '/api/equipe_organizadora', 'msg-organizacao');
bindForm('form-apoio', '/api/equipe_apoio', 'msg-apoio');

bindForm('form-atividade', '/api/atividades', 'msg-atividade', async (body) => {
  if (body.tipo) await apiPost('/api/tipos_atividade', { tipo: body.tipo, tem_premiacao: body.tem_premiacao });
  body.vagas = parseInt(body.vagas, 10);
  return body;
});

bindForm('form-ministrante', '/api/ministrantes', 'msg-ministrante');
bindForm('form-presenca', '/api/presencas', 'msg-presenca');
bindForm('form-hotel', '/api/hoteis', 'msg-hotel', (body) => {
  body.numero_quartos = body.numero_quartos ? parseInt(body.numero_quartos, 10) : null;
  body.pessoas_por_quarto = body.pessoas_por_quarto ? parseInt(body.pessoas_por_quarto, 10) : null;
  return body;
});
bindForm('form-quarto', '/api/quartos_hotel', 'msg-hotel');
bindForm('form-alocacao', '/api/alocacoes', 'msg-hotel');

// ---------------------------------------------------------------
// CONSULTA
// ---------------------------------------------------------------
async function buscarPessoas() {
  const cpf = document.getElementById('busca-pessoa-cpf').value;
  const nome = document.getElementById('busca-pessoa-nome').value;
  const rows = await apiGet(`/api/pessoas?cpf=${encodeURIComponent(cpf)}&nome=${encodeURIComponent(nome)}`);
  renderTable('tabela-pessoas', rows, ['cpf', 'nome', 'telefone', 'email', 'sexo', 'instituicao_origem', 'vinculo']);
  const inscritos = await apiGet('/api/inscritos');
  renderTable('tabela-inscritos', inscritos, ['cpf', 'nome', 'data_inscricao', 'pagamento_inscricao']);
}
document.getElementById('btn-busca-pessoa').addEventListener('click', buscarPessoas);

async function buscarAtividades() {
  const nome = document.getElementById('busca-atividade-nome').value;
  const rows = await apiGet('/api/atividades?nome=' + encodeURIComponent(nome));
  renderTable('tabela-atividades', rows, [
    'id', 'tipo', 'nome', 'dia', 'hora', 'vagas', 'inscritos_confirmados',
    { key: 'organizadores', label: 'Organizadores' },
    { key: 'apoio', label: 'Apoio' },
    { key: 'ministrantes', label: 'Ministrantes' },
  ]);
}
document.getElementById('btn-busca-atividade').addEventListener('click', buscarAtividades);

async function buscarAlocacoes() {
  const rows = await apiGet('/api/alocacoes');
  renderTable('tabela-alocacoes', rows, ['cpf', 'nome', 'instituicao_origem', 'nome_hotel', 'quarto']);
}

// ---------------------------------------------------------------
// RELATORIOS
// ---------------------------------------------------------------
document.querySelectorAll('[data-report]').forEach(btn => {
  btn.addEventListener('click', async () => {
    const report = btn.dataset.report;
    const rows = await apiGet('/api/relatorios/' + report);
    if (report === 'inscritos_excedentes') {
      renderTable('out-excedentes', rows, ['atividade', 'dia', 'hora', 'vagas', 'total_inscritos', 'excedentes']);
    } else if (report === 'ministrantes_apoio') {
      renderTable('out-equipe', rows, ['nome', 'dia', 'hora',
        { key: 'ministrantes', label: 'Ministrantes' },
        { key: 'equipe_apoio', label: 'Equipe de apoio' }]);
    } else if (report === 'presentes_confirmados') {
      renderTable('out-presentes', rows, ['atividade', 'dia', 'hora', 'cpf', 'nome']);
    } else if (report === 'certificados') {
      renderTable('out-certificados', rows, ['nome', 'cpf', 'atividade', 'tipo', 'dia']);
    } else if (report === 'hotel_quartos') {
      renderTable('out-hotel', rows, ['hotel', 'quarto', 'pessoa', 'instituicao_origem']);
    }
  });
});

// ---------------------------------------------------------------
// Inicialização
// ---------------------------------------------------------------
refreshAuxLists();
buscarPessoas();
buscarAtividades();
buscarAlocacoes();
