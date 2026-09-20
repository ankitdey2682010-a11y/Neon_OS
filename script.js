(function () {
  let topZ = 10;
  const activeWindows = {};

  const appMeta = {
    notes: { title: 'Scratchpad', width: 360, height: 260 },
    calc: { title: 'Calculator', width: 260, height: 320 },
    console: { title: 'System Console', width: 440, height: 260 },
    settings: { title: 'Appearance', width: 280, height: 160 }
  };

  // Clock
  const clockEl = document.getElementById('clock');
  function tick() {
    const now = new Date();
    clockEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  setInterval(tick, 1000);
  tick();

  // Launcher Toggle
  const launcher = document.getElementById('launcher');
  const startBtn = document.getElementById('start-btn');

  startBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    launcher.classList.toggle('hidden');
  });

  document.addEventListener('click', (e) => {
    if (!launcher.contains(e.target) && e.target !== startBtn) {
      launcher.classList.add('hidden');
    }
  });

  // App launch event delegation
  document.querySelectorAll('[data-app]').forEach(el => {
    el.addEventListener('click', () => {
      spawnWindow(el.dataset.app);
      launcher.classList.add('hidden');
    });
  });

  function spawnWindow(id) {
    if (activeWindows[id]) {
      const win = activeWindows[id];
      win.classList.remove('minimized');
      focusWindow(win);
      return;
    }

    const tpl = document.getElementById(`tpl-${id}`);
    if (!tpl) return;

    const frame = document.createElement('div');
    frame.className = 'win-frame';
    frame.id = `win-${id}`;
    frame.style.width = `${appMeta[id].width}px`;
    frame.style.height = `${appMeta[id].height}px`;
    frame.style.left = `${60 + Object.keys(activeWindows).length * 24}px`;
    frame.style.top = `${60 + Object.keys(activeWindows).length * 24}px`;
    frame.style.zIndex = ++topZ;

    frame.innerHTML = `
      <div class="win-titlebar">
        <span class="win-title">${appMeta[id].title}</span>
        <div class="win-actions">
          <button class="btn-min"></button>
          <button class="btn-max"></button>
          <button class="btn-close"></button>
        </div>
      </div>
      <div class="win-content"></div>
    `;

    frame.querySelector('.win-content').appendChild(tpl.content.cloneNode(true));
    document.body.appendChild(frame);
    activeWindows[id] = frame;

    bindControls(frame, id);
    setupAppLogic(id, frame);
    syncPanel();
    focusWindow(frame);
  }

  function focusWindow(el) {
    el.style.zIndex = ++topZ;
    document.querySelectorAll('.task-item').forEach(t => {
      t.classList.toggle('active', t.dataset.target === el.id);
    });
  }

  function bindControls(win, id) {
    const titlebar = win.querySelector('.win-titlebar');

    win.addEventListener('mousedown', () => focusWindow(win));

    // Dragging
    titlebar.addEventListener('mousedown', (e) => {
      if (e.target.tagName.toLowerCase() === 'button') return;
      if (win.classList.contains('maximized')) return;

      const rect = win.getBoundingClientRect();
      const offsetLeft = e.clientX - rect.left;
      const offsetTop = e.clientY - rect.top;

      function onMove(ev) {
        win.style.left = `${ev.clientX - offsetLeft}px`;
        win.style.top = `${ev.clientY - offsetTop}px`;
      }

      function onUp() {
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      }

      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    });

    win.querySelector('.btn-close').addEventListener('click', () => {
      win.remove();
      delete activeWindows[id];
      syncPanel();
    });

    win.querySelector('.btn-min').addEventListener('click', () => {
      win.classList.add('minimized');
      syncPanel();
    });

    win.querySelector('.btn-max').addEventListener('click', () => {
      win.classList.toggle('maximized');
    });
  }

  function syncPanel() {
    const container = document.getElementById('active-tasks');
    container.innerHTML = '';

    Object.keys(activeWindows).forEach(key => {
      const win = activeWindows[key];
      const btn = document.createElement('button');
      btn.className = 'task-item';
      btn.dataset.target = win.id;
      btn.textContent = appMeta[key].title;

      if (!win.classList.contains('minimized')) {
        btn.classList.add('active');
      }

      btn.addEventListener('click', () => {
        if (win.classList.contains('minimized')) {
          win.classList.remove('minimized');
          focusWindow(win);
        } else {
          win.classList.add('minimized');
        }
        syncPanel();
      });

      container.appendChild(btn);
    });
  }

  function setupAppLogic(id, win) {
    if (id === 'notes') {
      const pad = win.querySelector('#scratchpad');
      pad.value = localStorage.getItem('plain_notes') || '';
      pad.addEventListener('input', () => localStorage.setItem('plain_notes', pad.value));
    }

    if (id === 'settings') {
      const picker = win.querySelector('#theme-picker');
      picker.value = document.body.getAttribute('data-theme') || 'dark';
      picker.addEventListener('change', (e) => {
        document.body.setAttribute('data-theme', e.target.value);
      });
    }

    if (id === 'calc') {
      const screen = win.querySelector('#calc-screen');
      let acc = null;
      let nextOp = null;
      let freshEntry = true;

      win.querySelector('.calc-keys').addEventListener('click', (e) => {
        if (!e.target.dataset.key) return;
        const key = e.target.dataset.key;

        if (!isNaN(key) || key === '.') {
          if (freshEntry) {
            screen.value = key === '.' ? '0.' : key;
            freshEntry = false;
          } else {
            if (key === '.' && screen.value.includes('.')) return;
            screen.value += key;
          }
        } else if (key === 'clear') {
          acc = null;
          nextOp = null;
          screen.value = '0';
          freshEntry = true;
        } else if (key === 'back') {
          screen.value = screen.value.slice(0, -1) || '0';
        } else if (['+', '-', '*', '/'].includes(key)) {
          acc = parseFloat(screen.value);
          nextOp = key;
          freshEntry = true;
        } else if (key === '=') {
          if (nextOp && acc !== null) {
            const cur = parseFloat(screen.value);
            let res = 0;
            if (nextOp === '+') res = acc + cur;
            if (nextOp === '-') res = acc - cur;
            if (nextOp === '*') res = acc * cur;
            if (nextOp === '/') res = cur === 0 ? 'Error' : acc / cur;
            screen.value = String(res);
            acc = null;
            nextOp = null;
            freshEntry = true;
          }
        }
      });
    }

    if (id === 'console') {
      const log = win.querySelector('.output-log');
      const input = win.querySelector('.cmd-input');

      function printLine(text) {
        const item = document.createElement('div');
        item.textContent = text;
        log.appendChild(item);
        log.scrollTop = log.scrollHeight;
      }

      printLine('System shell online. Type "help" to list commands.');

      input.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter') return;
        const val = input.value.trim();
        if (!val) return;

        printLine(`$ ${val}`);
        input.value = '';

        const args = val.split(' ');
        const root = args[0].toLowerCase();

        switch (root) {
          case 'help':
            printLine('Commands: open <app>, clear, theme <name>, date');
            break;
          case 'clear':
            log.innerHTML = '';
            break;
          case 'date':
            printLine(new Date().toString());
            break;
          case 'open':
            if (appMeta[args[1]]) spawnWindow(args[1]);
            else printLine(`App not found: ${args[1]}`);
            break;
          case 'theme':
            if (['dark', 'emerald', 'amber'].includes(args[1])) {
              document.body.setAttribute('data-theme', args[1]);
              printLine(`Theme: ${args[1]}`);
            } else {
              printLine('Options: dark, emerald, amber');
            }
            break;
          default:
            printLine(`Unknown command: ${root}`);
        }
      });
    }
  }
})();