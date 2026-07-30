document.addEventListener('DOMContentLoaded', () => {
  // Estado da Aplicação
  const state = {
    mode: 'random', // 'random', 'passphrase', 'pin'
    history: [],
    blurHistory: false
  };

  // Dicionário de Palavras para Passphrase (Diceware Simulado)
  const WORD_LIST = [
    'alpha', 'bravo', 'cipher', 'delta', 'echo', 'falcon', 'matrix', 'quantum',
    'shield', 'vector', 'orbit', 'vertex', 'zenith', 'beacon', 'nebula', 'solaris',
    'crypto', 'proton', 'cortex', 'fusion', 'horizon', 'starlight', 'tactical'
  ];

  // Elementos do DOM
  const output = document.getElementById('passwordOutput');
  const copyBtn = document.getElementById('copyBtn');
  const copyBtnText = document.getElementById('copyBtnText');
  const refreshBtn = document.getElementById('refreshBtn');

  // Sliders e Toggles
  const lengthRange = document.getElementById('lengthRange');
  const lengthDisplay = document.getElementById('lengthDisplay');
  const wordsRange = document.getElementById('wordsRange');
  const wordsDisplay = document.getElementById('wordsDisplay');

  // Metricas
  const entropyVal = document.getElementById('entropyVal');
  const crackVal = document.getElementById('crackVal');
  const charCountVal = document.getElementById('charCountVal');
  const meterFill = document.getElementById('meterFill');
  const strengthLabel = document.getElementById('strengthLabel');

  // Histórico
  const historyList = document.getElementById('historyList');
  const toggleHistoryVis = document.getElementById('toggleHistoryVis');
  const exportHistoryBtn = document.getElementById('exportHistoryBtn');
  const clearHistoryBtn = document.getElementById('clearHistoryBtn');

  // Mudar Modo
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      state.mode = e.target.dataset.mode;

      document.getElementById('randomControls').classList.toggle('hidden', state.mode !== 'random');
      document.getElementById('passphraseControls').classList.toggle('hidden', state.mode !== 'passphrase');
      
      generate();
    });
  });

  // Atualização dos Sliders
  lengthRange.addEventListener('input', (e) => {
    lengthDisplay.textContent = e.target.value;
    generate();
  });

  wordsRange.addEventListener('input', (e) => {
    wordsDisplay.textContent = e.target.value;
    generate();
  });

  // Função Crypto Aleatória
  function getRandomInt(max) {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    return array[0] % max;
  }

  // Gerador Principal
  function generate() {
    let password = '';
    let poolSize = 0;

    if (state.mode === 'random') {
      let pool = '';
      const incUpper = document.getElementById('incUpper').checked;
      const incLower = document.getElementById('incLower').checked;
      const incNums = document.getElementById('incNums').checked;
      const incSyms = document.getElementById('incSyms').checked;
      const excAmbiguous = document.getElementById('excAmbiguous').checked;
      const customSymbols = document.getElementById('customSymbols').value;

      if (incUpper) pool += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      if (incLower) pool += 'abcdefghijklmnopqrstuvwxyz';
      if (incNums) pool += '0123456789';
      if (incSyms) pool += customSymbols || '!@#$%^&*()';

      if (excAmbiguous) {
        pool = pool.replace(/[1lI0O]/g, '');
      }

      if (!pool) return clearOutput();

      poolSize = pool.length;
      const len = parseInt(lengthRange.value, 10);
      for (let i = 0; i < len; i++) {
        password += pool[getRandomInt(pool.length)];
      }

    } else if (state.mode === 'passphrase') {
      const count = parseInt(wordsRange.value, 10);
      const cap = document.getElementById('passCapitalize').checked;
      const num = document.getElementById('passIncludeNumber').checked;
      const sep = document.getElementById('separatorInput').value;

      let words = [];
      for (let i = 0; i < count; i++) {
        let w = WORD_LIST[getRandomInt(WORD_LIST.length)];
        if (cap) w = w.charAt(0).toUpperCase() + w.slice(1);
        words.push(w);
      }

      if (num) words.push(getRandomInt(100));
      password = words.join(sep);
      poolSize = WORD_LIST.length;

    } else if (state.mode === 'pin') {
      const len = 6;
      poolSize = 10;
      for (let i = 0; i < len; i++) {
        password += getRandomInt(10);
      }
    }

    output.value = password;
    updateMetrics(password, poolSize);
    addToHistory(password);
  }

  function clearOutput() {
    output.value = '';
    entropyVal.textContent = '0 bits';
    crackVal.textContent = 'N/A';
    charCountVal.textContent = '0';
    meterFill.style.width = '0%';
  }

  // Análise Matemática de Cibersegurança
  function updateMetrics(password, poolSize) {
    const len = password.length;
    charCountVal.textContent = len;

    const entropy = Math.round(len * Math.log2(poolSize || 1));
    entropyVal.textContent = `${entropy} bits`;

    // Tempo estimado com base em 100 bilhões/seg
    const combinations = Math.pow(poolSize || 1, len);
    const seconds = combinations / 1e11;
    crackVal.textContent = formatTime(seconds);

    // Barra de Nível Visual
    let percent = Math.min(100, Math.max(10, (entropy / 120) * 100));
    let color = 'var(--color-danger)';
    let label = 'Muito Fraca';

    if (entropy >= 100) {
      color = 'var(--color-ultra)';
      label = 'Grau Militar / Impossível';
    } else if (entropy >= 75) {
      color = 'var(--color-success)';
      label = 'Excelente';
    } else if (entropy >= 50) {
      color = 'var(--color-warning)';
      label = 'Moderada';
    }

    meterFill.style.width = `${percent}%`;
    meterFill.style.backgroundColor = color;
    strengthLabel.textContent = label;
    strengthLabel.style.color = color;
  }

  function formatTime(sec) {
    if (sec < 1) return 'Instantâneo';
    if (sec < 3600) return `${Math.round(sec / 60)}m`;
    if (sec < 86400) return `${Math.round(sec / 3600)}h`;
    if (sec < 31536000) return `${Math.round(sec / 86400)}d`;
    if (sec < 3153600000) return `${Math.round(sec / 31536000)} anos`;
    return 'Séculos';
  }

  // Gestão do Histórico
  function addToHistory(pwd) {
    if (!pwd || state.history.includes(pwd)) return;
    state.history.unshift(pwd);
    if (state.history.length > 10) state.history.pop();
    renderHistory();
  }

  function renderHistory() {
    historyList.innerHTML = '';
    if (state.history.length === 0) {
      historyList.innerHTML = '<li class="empty-msg">Nenhuma senha gerada ainda.</li>';
      return;
    }

    state.history.forEach(pwd => {
      const li = document.createElement('li');
      li.className = `history-item ${state.blurHistory ? 'blur' : ''}`;
      li.innerHTML = `
        <span>${pwd}</span>
        <button class="text-btn">Copiar</button>
      `;
      li.querySelector('button').addEventListener('click', () => {
        navigator.clipboard.writeText(pwd);
      });
      historyList.appendChild(li);
    });
  }

  // Ações
  copyBtn.addEventListener('click', async () => {
    if (!output.value) return;
    await navigator.clipboard.writeText(output.value);
    copyBtnText.textContent = 'Copiado!';
    setTimeout(() => copyBtnText.textContent = 'Copiar', 1500);
  });

  toggleHistoryVis.addEventListener('click', () => {
    state.blurHistory = !state.blurHistory;
    toggleHistoryVis.textContent = state.blurHistory ? 'Mostrar' : 'Ocultar';
    renderHistory();
  });

  clearHistoryBtn.addEventListener('click', () => {
    state.history = [];
    renderHistory();
  });

  exportHistoryBtn.addEventListener('click', () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state.history, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "vaultkey_passwords.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  });

  refreshBtn.addEventListener('click', generate);

  // Atalhos
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && e.target.tagName !== 'INPUT') {
      e.preventDefault();
      generate();
    }
  });

  // Listeners dinâmicos
  document.querySelectorAll('input[type="checkbox"], #customSymbols, #separatorInput').forEach(el => {
    el.addEventListener('change', generate);
  });

  generate();
});