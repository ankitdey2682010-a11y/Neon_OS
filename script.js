let highestZ = 10;
let matrixInterval = null;

const appTitles = {
  terminal: 'TERMINAL // BASH',
  notepad: 'SCRATCHPAD.TXT',
  files: 'FILE EXPLORER',
  calc: 'QUANTUM CALCULATOR',
  visualizer: 'MATRIX RAIN // STREAM',
  system: 'SYSTEM DIAGNOSTICS',
  themes: 'THEME SELECTOR'
};

function updateClock() 
{
  const now = new Date();
  document.getElementById('systemClock').innerText = now.toTimeString().split(' ')[0];
}
setInterval(updateClock, 1000);
updateClock();

function toggleStartMenu() 
{
  document.getElementById('start-menu').classList.toggle('hidden');
}

function openApp(type) 
{
  let win = document.getElementById(`win-${type}`);
  
  if (win) {
    if (win.classList.contains('minimized')) {
      win.classList.remove('minimized');
    }
    bringToFront(win);
    updateTaskbar();
    return;
  }

  win = document.createElement('div');
  win.className = 'window';
  win.id = `win-${type}`;
  win.style.left = `${50 + Math.random() * 50}px`;
  win.style.top = `${40 + Math.random() * 40}px`;
  win.style.zIndex = ++highestZ;

  let bodyContent = '';

  if (type === 'terminal') 
    {
    bodyContent = `
      <div class="terminal-logs" id="term-logs">
        <div>CyberOS Shell [v3.0]. Type <span style="color:var(--accent);">help</span>.</div>
      </div>
      <div class="terminal-input-row">
        <span style="color: var(--accent);">&gt;</span>
        <input class="terminal-input" id="term-in" autofocus onkeydown="handleTerminal(event)"/>
      </div>
    `;
  }
   else if (type === 'notepad') 
    {
    const saved = localStorage.getItem('cyber_note') || '';
    bodyContent = `<textarea class="pad" oninput="localStorage.setItem('cyber_note', this.value)" placeholder="Enter persistent notes...">${saved}</textarea>`;
  } 
  else if (type === 'files') 
    {
    bodyContent = `
      <div class="file-list">
        <div class="file-item" onclick="openApp('notepad')">📄 notes.txt <span>1 KB</span></div>
        <div class="file-item" onclick="openApp('calc')">🧮 math_core.exe <span>14 KB</span></div>
        <div class="file-item" onclick="openApp('visualizer')">🌌 matrix_stream.sh <span>8 KB</span></div>
        <div class="file-item" onclick="alert('Access Denied: Encrypted Keyring')">🔒 root_access.key <span>4 KB</span></div>
      </div>
    `;
  } 
  else if (type === 'calc') 
    {
    bodyContent = `
      <div class="calc-container">
        <input class="calc-display" id="calc-display" readonly value="0" />
        <div class="calc-grid">
          <button class="op" onclick="calcAction('C')">C</button>
          <button class="op" onclick="calcAction('(')">(</button>
          <button class="op" onclick="calcAction(')')">)</button>
          <button class="op" onclick="calcAction('/')">/</button>
          <button onclick="calcAction('7')">7</button>
          <button onclick="calcAction('8')">8</button>
          <button onclick="calcAction('9')">9</button>
          <button class="op" onclick="calcAction('*')">*</button>
          <button onclick="calcAction('4')">4</button>
          <button onclick="calcAction('5')">5</button>
          <button onclick="calcAction('6')">6</button>
          <button class="op" onclick="calcAction('-')">-</button>
          <button onclick="calcAction('1')">1</button>
          <button onclick="calcAction('2')">2</button>
          <button onclick="calcAction('3')">3</button>
          <button class="op" onclick="calcAction('+')">+</button>
          <button onclick="calcAction('0')">0</button>
          <button onclick="calcAction('.')">.</button>
          <button class="op" onclick="calcAction('DEL')">←</button>
          <button class="equals" onclick="calcAction('=')">=</button>
        </div>
      </div>
    `;
  } 
  else if (type === 'visualizer') 
    {
    bodyContent = `<canvas id="matrixCanvas" width="430" height="230"></canvas>`;
  }
   else if (type === 'system') 
    {
    bodyContent = `
      <p><strong>KERNEL:</strong> CyberOS 3.0.1-LTS</p>
      <p><strong>MODULES:</strong> MathEngine, CanvasStream, SecureBash</p>
      <p><strong>STATUS:</strong> All Subsystems Nominal</p>
    `;
  }
   else if (type === 'themes') 
    {
    bodyContent = `
      <p>Select visual profile:</p>
      <div class="theme-btn-grid">
        <button class="theme-btn" onclick="setTheme('cyberpunk')">CYBERPUNK</button>
        <button class="theme-btn" onclick="setTheme('matrix')">MATRIX</button>
        <button class="theme-btn" onclick="setTheme('synthwave')">SYNTHWAVE</button>
      </div>
    `;
  }

  win.innerHTML = `
    <div class="window-header" onmousedown="startDrag(event, '${win.id}')">
      <span class="window-title">${appTitles[type]}</span>
      <div class="window-controls">
        <button onclick="minimizeWindow('${win.id}')">_</button>
        <button onclick="toggleMaximize('${win.id}')">□</button>
        <button onclick="closeWindow('${win.id}')">✕</button>
      </div>
    </div>
    <div class="window-body">${bodyContent}</div>
  `;

  win.addEventListener('mousedown', () => bringToFront(win));
  document.body.appendChild(win);
  updateTaskbar();

  if (type === 'visualizer') {
    startMatrixRain();
  }
}

function bringToFront(win) 
{
  win.style.zIndex = ++highestZ;
  updateTaskbar();
}

function minimizeWindow(id) 
{
  document.getElementById(id).classList.add('minimized');
  updateTaskbar();
}

function toggleMaximize(id) 
{
  document.getElementById(id).classList.toggle('maximized');
}

function closeWindow(id) 
{
  if (id === 'win-visualizer' && matrixInterval) 
    {
    clearInterval(matrixInterval);
    matrixInterval = null;
  }
  document.getElementById(id).remove();
  updateTaskbar();
}

function setTheme(name) 
{
  document.body.setAttribute('data-theme', name);
}

function calcAction(val) 
{
  const display = document.getElementById('calc-display');
  if (!display) return;

  if (val === 'C') {
    display.value = '0';
  } else if (val === 'DEL') {
    display.value = display.value.length > 1 ? display.value.slice(0, -1) : '0';
  } else if (val === '=') 
    {
    try {

      const cleanExpr = display.value.replace(/[^0-9+\-*/().]/g, '');
      display.value = Function(`'use strict'; return (${cleanExpr})`)();
    } 
    catch 
    {
      display.value = 'ERR';
    }
  }
   else
     {
    if (display.value === '0' || display.value === 'ERR') {
      display.value = val;
    } else {
      display.value += val;
    }
  }
}

function startMatrixRain() 
{
  const canvas = document.getElementById('matrixCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  
  const chars = '0123456789ABCDEFｦｱｳｴｵｶｷｹｺｻｼｽｾｿﾀﾂﾃﾅﾆﾇﾈ';
  const fontSize = 12;
  const columns = Math.floor(canvas.width / fontSize);
  const drops = Array(columns).fill(1);

  if (matrixInterval) clearInterval(matrixInterval);

  matrixInterval = setInterval(() => {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#00ffcc';
    ctx.font = `${fontSize}px monospace`;

    for (let i = 0; i < drops.length; i++) 
      {
      const text = chars[Math.floor(Math.random() * chars.length)];
      ctx.fillText(text, i * fontSize, drops[i] * fontSize);

      if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) 
        {
        drops[i] = 0;
      }
      drops[i]++;
    }
  }, 40);
}

function updateTaskbar() 
{
  const container = document.getElementById('taskbar-tabs');
  container.innerHTML = '';

  const windows = Array.from(document.querySelectorAll('.window'));
  windows.forEach(win => {
    const type = win.id.replace('win-', '');
    const tab = document.createElement('button');
    tab.className = 'task-tab' + (!win.classList.contains('minimized') ? ' active' : '');
    tab.innerText = type.toUpperCase();
    tab.onclick = () => {
      if (win.classList.contains('minimized')) {
        win.classList.remove('minimized');
        bringToFront(win);
      } else {
        win.classList.add('minimized');
      }
      updateTaskbar();
    };
    container.appendChild(tab);
  });
}

function handleTerminal(e) 
{
  if (e.key === 'Enter') {
    const input = e.target.value.trim();
    const logs = document.getElementById('term-logs');
    if (!input) return;

    const cmd = document.createElement('div');
    cmd.innerHTML = `<span style="color:var(--text-dim);">&gt; ${input}</span>`;
    logs.appendChild(cmd);

    const parts = input.split(' ');
    const command = parts[0].toLowerCase();
    const res = document.createElement('div');

    switch (command) {
      case 'help':
        res.innerHTML = 'Commands: <span style="color:var(--accent)">open [app], calc [expr], theme [name], clear, time</span>';
        break;
      case 'calc':
        try {
          const expr = parts.slice(1).join('');
          res.innerText = Function(`'use strict'; return (${expr.replace(/[^0-9+\-*/().]/g, '')})`)();
        } 
        catch 
        {
          res.innerText = 'Evaluation error.';
        }
        break;
      case 'open':
        if (appTitles[parts[1]]) {
          openApp(parts[1]);
          res.innerText = `Launched: ${parts[1]}`;
        } else {
          res.innerText = `Unknown application: ${parts[1]}`;
        }
        break;
      case 'theme':
        if (['cyberpunk', 'matrix', 'synthwave'].includes(parts[1])) 
          {
          setTheme(parts[1]);
          res.innerText = `Applied theme: ${parts[1]}`;
        }
         else 
          {
          res.innerText = 'Usage: theme [cyberpunk | matrix | synthwave]';
        }
        break;
      case 'clear':
        logs.innerHTML = '';
        e.target.value = '';
        return;
      case 'time':
        res.innerText = new Date().toISOString();
        break;
      default:
        res.style.color = 'var(--magenta)';
        res.innerText = `Command not recognized: "${input}"`;
    }

    logs.appendChild(res);
    e.target.value = '';
  }
}

function startDrag(e, id) 
{
  const win = document.getElementById(id);
  if (win.classList.contains('maximized')) return;

  let shiftX = e.clientX - win.getBoundingClientRect().left;
  let shiftY = e.clientY - win.getBoundingClientRect().top;

  function moveAt(pageX, pageY) 
  {
    win.style.left = Math.max(0, pageX - shiftX) + 'px';
    win.style.top = Math.max(0, pageY - shiftY) + 'px';
  }

  function onMouseMove(event) 
  {
    moveAt(event.pageX, event.pageY);
  }

  document.addEventListener('mousemove', onMouseMove);
  document.onmouseup = function() {
    document.removeEventListener('mousemove', onMouseMove);
    document.onmouseup = null;
  };
}