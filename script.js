(() => {
  'use strict';

  let topZ = 10;

  const activeWindows = {};

  const appMeta = {
    notes: {
      title: 'Scratchpad',
      width: 410,
      height: 330
    },

    calc: {
      title: 'Calculator',
      width: 300,
      height: 430
    },

    console: {
      title: 'System Console',
      width: 500,
      height: 350
    },

    settings: {
      title: 'Appearance',
      width: 330,
      height: 280
    }
  };

  const launcher = document.getElementById('launcher');
  const startBtn = document.getElementById('start-btn');
  const clockEl = document.getElementById('clock');
  const searchInput = document.getElementById('app-search');

  try {
    const savedTheme = localStorage.getItem('terminal_theme');

    if (['dark', 'emerald', 'amber'].includes(savedTheme)) {
      document.body.dataset.theme = savedTheme;
    }
  } catch (error) {
    console.warn('Theme preferences could not be loaded.');
  }

  function updateClock() {
    const now = new Date();

    clockEl.textContent = now.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });

    clockEl.title = now.toLocaleDateString([], {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });

    document.getElementById('desktop-date').textContent =
      now.toLocaleDateString([], {
        weekday: 'long',
        month: 'short',
        day: 'numeric'
      }).toUpperCase();
  }

  updateClock();

  setInterval(updateClock, 1000);

  function toggleLauncher(force) {
    const shouldOpen =
      typeof force === 'boolean'
        ? force
        : launcher.classList.contains('hidden');

    launcher.classList.toggle('hidden', !shouldOpen);

    startBtn.setAttribute(
      'aria-expanded',
      String(shouldOpen)
    );

    if (shouldOpen) {
      searchInput.value = '';
      filterApps('');

      setTimeout(() => {
        searchInput.focus();
      }, 0);
    }
  }

  startBtn.addEventListener('click', event => {
    event.stopPropagation();
    toggleLauncher();
  });

  launcher.addEventListener('click', event => {
    event.stopPropagation();
  });

  document.addEventListener('click', () => {
    toggleLauncher(false);
  });

  searchInput.addEventListener('input', () => {
    filterApps(searchInput.value);
  });

  function filterApps(query) {
    const q = query.trim().toLowerCase();

    document.querySelectorAll('#app-list li').forEach(item => {
      item.hidden = !item.textContent.toLowerCase().includes(q);
    });
  }

  document.querySelectorAll('[data-app]').forEach(element => {
    const open = () => {
      spawnWindow(element.dataset.app);
    };

    if (element.classList.contains('shortcut')) {

      element.addEventListener('dblclick', open);

      element.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          open();
        }
      });

    } else {

      element.addEventListener('click', open);

    }
  });
  document.addEventListener('keydown', event => {

    if (event.key === 'Escape') {
      toggleLauncher(false);
    }

    if (
      (event.ctrlKey || event.metaKey) &&
      event.code === 'Space'
    ) {
      event.preventDefault();
      toggleLauncher();
    }

    if (event.key === 'F2') {
      event.preventDefault();
      spawnWindow('notes');
    }

  });
  function spawnWindow(id) {

    if (!appMeta[id]) {
      return;
    }

    if (activeWindows[id]) {

      const existing = activeWindows[id];

      existing.classList.remove('minimized');

      focusWindow(existing);

      if (id === 'console') {
        existing.querySelector('.cmd-input')?.focus();
      }

      return;
    }

    const template = document.getElementById(`tpl-${id}`);

    if (!template) {
      return;
    }

    const frame = document.createElement('section');

    frame.className = 'win-frame';
    frame.id = `win-${id}`;
    frame.dataset.app = id;

    frame.setAttribute(
      'aria-label',
      appMeta[id].title
    );

    const width = Math.min(
      appMeta[id].width,
      Math.max(200, window.innerWidth - 24)
    );

    const height = Math.min(
      appMeta[id].height,
      Math.max(180, window.innerHeight - 64)
    );

    frame.style.width = `${width}px`;
    frame.style.height = `${height}px`;

    const offset = Object.keys(activeWindows).length * 26;

    frame.style.left = `${
      Math.max(
        0,
        Math.min(
          70 + offset,
          window.innerWidth - width - 12
        )
      )
    }px`;

    frame.style.top = `${
      Math.max(
        0,
        Math.min(
          50 + offset,
          window.innerHeight - height - 64
        )
      )
    }px`;

    frame.style.zIndex = ++topZ;

    frame.innerHTML = `
      <div class="win-titlebar">

        <div class="title-cluster">
          <span class="window-app-dot"></span>
          <span class="win-title">${appMeta[id].title}</span>
        </div>

        <div class="win-actions">

          <button
            class="btn-min"
            aria-label="Minimize window"
            title="Minimize">
          </button>

          <button
            class="btn-max"
            aria-label="Maximize or restore window"
            title="Maximize / restore">
          </button>

          <button
            class="btn-close"
            aria-label="Close window"
            title="Close">
          </button>

        </div>
      </div>

      <div class="win-content"></div>
    `;

    frame.querySelector('.win-content')
      .appendChild(template.content.cloneNode(true));

    document.body.appendChild(frame);

    activeWindows[id] = frame;

    bindControls(frame, id);

    setupAppLogic(id, frame);

    syncPanel();

    focusWindow(frame);
  }

  function focusWindow(frame) {

    frame.style.zIndex = ++topZ;

    document.querySelectorAll('.task-item').forEach(task => {

      task.classList.toggle(
        'active',
        task.dataset.target === frame.id
      );

    });

  }

  function bindControls(frame, id) {

    const titlebar = frame.querySelector('.win-titlebar');

    frame.addEventListener('mousedown', () => {
      focusWindow(frame);
    });

    // Double-click title bar to maximize or restore.

    titlebar.addEventListener('dblclick', event => {

      if (!event.target.closest('button')) {
        toggleMaximize(frame);
      }

    });

    titlebar.addEventListener('mousedown', event => {

      if (
        event.target.closest('button') ||
        frame.classList.contains('maximized')
      ) {
        return;
      }

      const rect = frame.getBoundingClientRect();

      const startX = event.clientX;
      const startY = event.clientY;

      const originalLeft = rect.left;
      const originalTop = rect.top;

      function onMove(moveEvent) {

        const maxLeft = Math.max(
          0,
          window.innerWidth - frame.offsetWidth
        );

        const maxTop = Math.max(
          0,
          window.innerHeight - 48
        );

        frame.style.left = `${
          Math.max(
            0,
            Math.min(
              maxLeft,
              originalLeft + moveEvent.clientX - startX
            )
          )
        }px`;

        frame.style.top = `${
          Math.max(
            0,
            Math.min(
              maxTop,
              originalTop + moveEvent.clientY - startY
            )
          )
        }px`;
      }

      function onUp() {

        window.removeEventListener('mousemove', onMove);

        window.removeEventListener('mouseup', onUp);

      }

      window.addEventListener('mousemove', onMove);

      window.addEventListener('mouseup', onUp);

    });

    frame.querySelector('.btn-close').addEventListener('click', () => {

      frame.remove();

      delete activeWindows[id];

      syncPanel();

    });

    frame.querySelector('.btn-min').addEventListener('click', () => {

      frame.classList.add('minimized');

      syncPanel();

    });


    frame.querySelector('.btn-max').addEventListener('click', () => {

      toggleMaximize(frame);

    });

  }


  function toggleMaximize(frame) {

    frame.classList.toggle('maximized');

    const button = frame.querySelector('.btn-max');

    if (frame.classList.contains('maximized')) {

      button.title = 'Restore window';

      button.setAttribute(
        'aria-label',
        'Restore window'
      );

    } else {

      button.title = 'Maximize window';

      button.setAttribute(
        'aria-label',
        'Maximize window'
      );

    }

  }


  function syncPanel() {

    const container = document.getElementById('active-tasks');

    container.innerHTML = '';

    Object.entries(activeWindows).forEach(([id, frame]) => {

      const button = document.createElement('button');

      button.className = 'task-item';

      button.dataset.target = frame.id;

      button.textContent = appMeta[id].title;

      button.title = `${appMeta[id].title} — click to switch`;

      if (!frame.classList.contains('minimized')) {
        button.classList.add('active');
      }

      button.addEventListener('click', () => {

        if (frame.classList.contains('minimized')) {

          frame.classList.remove('minimized');

          focusWindow(frame);

        } else if (Number(frame.style.zIndex) === topZ) {

          frame.classList.add('minimized');

        } else {

          focusWindow(frame);

        }

        syncPanel();

      });

      container.appendChild(button);

    });

  }


  function setupAppLogic(id, frame) {



    if (id === 'notes') {

      const pad = frame.querySelector('#scratchpad');

      const status = frame.querySelector('#notes-status');

      const counter = frame.querySelector('#note-count');

      try {
        pad.value = localStorage.getItem('terminal_notes') || '';
      } catch (error) {
        pad.value = '';
      }

      const updateCount = () => {

        counter.textContent =
          `${pad.value.length.toLocaleString()} characters`;

      };

      updateCount();

      let saveTimer;

      pad.addEventListener('input', () => {

        status.textContent = 'Saving…';

        updateCount();

        clearTimeout(saveTimer);

        saveTimer = setTimeout(() => {

          try {

            localStorage.setItem(
              'terminal_notes',
              pad.value
            );

            status.textContent = 'Saved locally';

          } catch (error) {

            status.textContent = 'Storage unavailable';

          }

        }, 180);

      });


      frame.querySelector('#clear-notes').addEventListener('click', () => {

        if (!pad.value || confirm('Clear all saved notes?')) {

          pad.value = '';

          try {
            localStorage.setItem('terminal_notes', '');
          } catch (error) {
            console.warn('Could not clear saved notes.');
          }

          updateCount();

          status.textContent = 'Saved locally';

          pad.focus();

        }

      });

    }

    if (id === 'settings') {

      const picker = frame.querySelector('#theme-picker');

      picker.value = document.body.dataset.theme || 'dark';

      picker.addEventListener('change', event => {

        applyTheme(event.target.value);

      });

    }

    if (id === 'calc') {

      setupCalculator(frame);

    }


    if (id === 'console') {

      const log = frame.querySelector('.output-log');

      const input = frame.querySelector('.cmd-input');


      function printLine(message, type = '') {

        const line = document.createElement('div');

        line.className = `log-line ${type}`;

        line.textContent = message;

        log.appendChild(line);

        log.scrollTop = log.scrollHeight;

      }


      printLine('Terminal_OS shell initialized.');

      printLine(
        'This is a local demo shell — commands do not run on your computer.'
      );

      printLine(
        'Type "help" to view commands.',
        'muted'
      );


      const history = [];

      let historyIndex = 0;


      frame.querySelector('#console-clear').addEventListener('click', () => {

        log.innerHTML = '';

      });


      input.addEventListener('keydown', event => {


        if (event.key === 'ArrowUp' && history.length) {

          event.preventDefault();

          historyIndex = Math.max(0, historyIndex - 1);

          input.value = history[historyIndex] || '';

          return;

        }

        if (event.key === 'ArrowDown' && history.length) {

          event.preventDefault();

          historyIndex = Math.min(
            history.length,
            historyIndex + 1
          );

          input.value = history[historyIndex] || '';

          return;

        }


        if (event.key !== 'Enter') {
          return;
        }

        const value = input.value.trim();

        if (!value) {
          return;
        }

        printLine(
          `user@local:~$ ${value}`,
          'command'
        );

        history.push(value);

        historyIndex = history.length;

        input.value = '';

        const [command, ...args] = value.split(/\s+/);

        const root = command.toLowerCase();



        switch (root) {

          case 'help':

            printLine(
              'help | clear | date | time | whoami | apps | open <app> | theme <dark|emerald|amber> | uptime'
            );

            break;


          case 'clear':

            log.innerHTML = '';

            break;


          case 'date':

            printLine(
              new Date().toLocaleDateString(undefined, {
                dateStyle: 'full'
              })
            );

            break;


          case 'time':

            printLine(new Date().toLocaleTimeString());

            break;


          case 'whoami':

            printLine('user@local-machine');

            break;


          case 'apps':

            printLine(Object.keys(appMeta).join(', '));

            break;


          case 'open': {

            const app = (args[0] || '').toLowerCase();

            if (appMeta[app]) {

              spawnWindow(app);

              printLine(
                `Opening ${appMeta[app].title}…`,
                'success'
              );

            } else {

              printLine(
                `Unknown app. Try: ${Object.keys(appMeta).join(', ')}`,
                'error'
              );

            }

            break;

          }


          case 'theme':

            if (
              ['dark', 'emerald', 'amber'].includes(
                (args[0] || '').toLowerCase()
              )
            ) {

              applyTheme(args[0].toLowerCase());

              printLine(
                `Theme changed to ${args[0].toLowerCase()}.`,
                'success'
              );

            } else {

              printLine(
                'Usage: theme dark | emerald | amber',
                'muted'
              );

            }

            break;


          case 'uptime':

            printLine(
              'Session active in this browser tab.'
            );

            break;


          default:

            printLine(
              `Command not found: ${root}. Type "help".`,
              'error'
            );

        }

      });


      setTimeout(() => {
        input.focus();
      }, 50);

    }

  }



  function applyTheme(theme) {

    if (!['dark', 'emerald', 'amber'].includes(theme)) {
      return;
    }

    document.body.dataset.theme = theme;

    try {

      localStorage.setItem(
        'terminal_theme',
        theme
      );

    } catch (error) {

      console.warn('Theme preference could not be saved.');

    }

    const picker = document.querySelector(
      '#win-settings #theme-picker'
    );

    if (picker) {
      picker.value = theme;
    }
  }

  function setupCalculator(frame) {

    const screen = frame.querySelector('#calc-screen');

    let stored = null;

    let operator = null;

    let freshEntry = true;

    let lastOperator = null;

    let lastOperand = null;


    function calculate(a, op, b) {

      if (op === '+') return a + b;

      if (op === '-') return a - b;

      if (op === '*') return a * b;

      if (op === '/') {
        return b === 0 ? 'Error' : a / b;
      }

      return b;

    }


    function formatResult(result) {

      if (result === 'Error' || !Number.isFinite(result)) {
        return 'Error';
      }

      return String(Number(result.toPrecision(10)));

    }


    function press(key) {

      if (/^\d$/.test(key) || key === '.') {

        if (screen.value === 'Error' || freshEntry) {

          screen.value = key === '.' ? '0.' : key;

          freshEntry = false;

        } else if (
          key !== '.' ||
          !screen.value.includes('.')
        ) {

          screen.value += key;

        }

        return;

      }


      if (key === 'clear') {

        screen.value = '0';

        stored = null;

        operator = null;

        lastOperator = null;

        lastOperand = null;

        freshEntry = true;

        return;

      }

      if (key === 'back') {

        if (freshEntry || screen.value === 'Error') {
          return;
        }

        screen.value =
          screen.value.length > 1
            ? screen.value.slice(0, -1)
            : '0';

        if (screen.value === '-') {
          screen.value = '0';
        }

        return;

      }
    if (key === '%') {

        const number = parseFloat(screen.value);

        screen.value = String(number / 100);

        freshEntry = true;

        return;

      }

      if (['+', '-', '*', '/'].includes(key)) {

        const current = parseFloat(screen.value);

        if (
          operator &&
          !freshEntry &&
          stored !== null
        ) {

          stored = calculate(
            stored,
            operator,
            current
          );

          screen.value = formatResult(stored);

        } else {

          stored = current;

        }

        operator = key;

        freshEntry = true;

        return;

      }

      if (key === '=') {

        if (operator && stored !== null) {

          const operand = freshEntry
            ? stored
            : parseFloat(screen.value);

          const result = calculate(
            stored,
            operator,
            operand
          );

          lastOperator = operator;

          lastOperand = operand;

          screen.value = formatResult(result);

          stored = null;

          operator = null;

          freshEntry = true;

        } else if (
          lastOperator &&
          lastOperand !== null
        ) {

          screen.value = formatResult(
            calculate(
              parseFloat(screen.value),
              lastOperator,
              lastOperand
            )
          );

          freshEntry = true;

        }

      }

    }


    frame.querySelector('.calc-keys').addEventListener('click', event => {

      const button = event.target.closest('[data-key]');

      if (button) {
        press(button.dataset.key);
      }

    });



    frame.addEventListener('keydown', event => {

      if (
        /^\d$/.test(event.key) ||
        ['.', '+', '-', '*', '/', '%'].includes(event.key)
      ) {

        event.preventDefault();

        press(event.key);

      } else if (
        event.key === 'Enter' ||
        event.key === '='
      ) {

        event.preventDefault();

        press('=');

      } else if (event.key === 'Backspace') {

        event.preventDefault();

        press('back');

      } else if (event.key === 'Escape') {

        press('clear');

      }

    });

  }


  window.addEventListener('resize', () => {

    document.querySelectorAll(
      '.win-frame:not(.maximized)'
    ).forEach(frame => {

      const rect = frame.getBoundingClientRect();

      frame.style.left = `${
        Math.max(
          0,
          Math.min(
            rect.left,
            window.innerWidth -
              Math.min(rect.width, window.innerWidth)
          )
        )
      }px`;

      frame.style.top = `${
        Math.max(
          0,
          Math.min(
            rect.top,
            window.innerHeight - 52
          )
        )
      }px`;

    });

  });

})();