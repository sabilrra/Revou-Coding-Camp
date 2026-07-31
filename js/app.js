/* ============================================================
   MY DASHBOARD — app.js
   Features: Greeting + Clock, Focus Timer (custom duration),
             To-Do List (add/edit/delete/done/sort/no-duplicates),
             Quick Links, Light/Dark Mode, Custom Name
   Storage:  localStorage
   ============================================================ */

'use strict';

/* ── LocalStorage helpers ── */
const LS = {
  get: (key, fallback = null) => {
    try {
      const v = localStorage.getItem(key);
      return v !== null ? JSON.parse(v) : fallback;
    } catch { return fallback; }
  },
  set: (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  },
};

/* ============================================================
   1. THEME (Light / Dark)
   ============================================================ */
(function initTheme() {
  const saved = LS.get('theme', 'light');
  document.documentElement.setAttribute('data-theme', saved);
})();

document.getElementById('theme-toggle').addEventListener('click', () => {
  const html    = document.documentElement;
  const current = html.getAttribute('data-theme');
  const next    = current === 'light' ? 'dark' : 'light';
  html.setAttribute('data-theme', next);
  LS.set('theme', next);
});

/* ============================================================
   2. GREETING — Clock, Date, Time-of-day Message, Custom Name
   ============================================================ */
const greetingMsg     = document.getElementById('greeting-message');
const currentTimeEl   = document.getElementById('current-time');
const currentDateEl   = document.getElementById('current-date');
const greetingNameEl  = document.getElementById('greeting-name-display');
const editNameBtn     = document.getElementById('edit-name-btn');
const nameForm        = document.getElementById('name-form');
const nameInput       = document.getElementById('name-input');
const saveNameBtn     = document.getElementById('save-name-btn');
const cancelNameBtn   = document.getElementById('cancel-name-btn');

function getGreeting(hour) {
  if (hour >= 5  && hour < 12) return '☀️ Good morning';
  if (hour >= 12 && hour < 17) return '🌤 Good afternoon';
  if (hour >= 17 && hour < 21) return '🌆 Good evening';
  return '🌙 Good night';
}

function pad(n) { return String(n).padStart(2, '0'); }

function updateClock() {
  const now  = new Date();
  const h    = now.getHours();
  const m    = now.getMinutes();
  const s    = now.getSeconds();
  const name = LS.get('userName', '');

  // Time display
  currentTimeEl.textContent = `${pad(h)}:${pad(m)}:${pad(s)}`;

  // Greeting
  greetingMsg.textContent = `${getGreeting(h)}${name ? ', ' + name : ''}!`;

  // Date — only update once per second (no flicker)
  const dateStr = now.toLocaleDateString(undefined, {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  currentDateEl.textContent = dateStr;
}

updateClock();
setInterval(updateClock, 1000);

/* ── Name display ── */
function renderNameDisplay() {
  const name = LS.get('userName', '');
  greetingNameEl.textContent = name ? `👋 Hey, ${name}` : '';
}
renderNameDisplay();

editNameBtn.addEventListener('click', () => {
  nameInput.value = LS.get('userName', '');
  nameForm.classList.remove('hidden');
  nameInput.focus();
});

saveNameBtn.addEventListener('click', saveName);
nameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') saveName(); });
cancelNameBtn.addEventListener('click', () => nameForm.classList.add('hidden'));

function saveName() {
  const val = nameInput.value.trim();
  LS.set('userName', val);
  renderNameDisplay();
  nameForm.classList.add('hidden');
}

/* ============================================================
   3. FOCUS TIMER (Pomodoro — custom duration)
   ============================================================ */
const timerDisplay    = document.getElementById('timer-display');
const timerProgressBar= document.getElementById('timer-progress-bar');
const timerStatus     = document.getElementById('timer-status');
const timerStartBtn   = document.getElementById('timer-start-btn');
const timerStopBtn    = document.getElementById('timer-stop-btn');
const timerResetBtn   = document.getElementById('timer-reset-btn');
const pomodoroInput   = document.getElementById('pomodoro-minutes');
const applyDurationBtn= document.getElementById('apply-duration-btn');

let timerInterval   = null;
let timerRunning    = false;
let totalSeconds    = 0;   // full duration in seconds
let remainingSeconds= 0;

/* Load saved duration */
const savedMinutes = LS.get('pomodoroDuration', 25);
pomodoroInput.value = savedMinutes;
totalSeconds        = savedMinutes * 60;
remainingSeconds    = totalSeconds;
renderTimerDisplay();

function renderTimerDisplay() {
  const m = Math.floor(remainingSeconds / 60);
  const s = remainingSeconds % 60;
  timerDisplay.textContent = `${pad(m)}:${pad(s)}`;

  // Progress bar
  const pct = totalSeconds > 0 ? (remainingSeconds / totalSeconds) * 100 : 100;
  timerProgressBar.style.width = `${pct}%`;
}

function startTimer() {
  if (timerRunning) return;
  if (remainingSeconds === 0) resetTimer();          // restart if done
  timerRunning = true;
  timerStartBtn.disabled = true;
  timerStopBtn.disabled  = false;
  timerStatus.textContent = '⏳ Stay focused!';
  timerDisplay.classList.remove('timer__display--done');

  timerInterval = setInterval(() => {
    remainingSeconds--;
    renderTimerDisplay();
    if (remainingSeconds <= 0) {
      clearInterval(timerInterval);
      timerRunning = false;
      timerStartBtn.disabled = false;
      timerStopBtn.disabled  = true;
      timerStatus.textContent = '🎉 Time\'s up! Take a break.';
      timerDisplay.classList.add('timer__display--done');
      // Browser notification (if permitted)
      if (Notification.permission === 'granted') {
        new Notification('Focus Timer', { body: 'Session complete! Time to take a break.' });
      }
    }
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
  timerRunning = false;
  timerStartBtn.disabled = false;
  timerStopBtn.disabled  = true;
  timerStatus.textContent = '⏸ Paused.';
}

function resetTimer() {
  stopTimer();
  const mins       = parseInt(pomodoroInput.value) || 25;
  totalSeconds     = mins * 60;
  remainingSeconds = totalSeconds;
  timerStatus.textContent = 'Ready to focus!';
  timerDisplay.classList.remove('timer__display--done');
  renderTimerDisplay();
}

/* Apply custom duration */
applyDurationBtn.addEventListener('click', () => {
  const mins = parseInt(pomodoroInput.value);
  if (!mins || mins < 1 || mins > 120) {
    pomodoroInput.value = 25;
    return;
  }
  LS.set('pomodoroDuration', mins);
  resetTimer();
  timerStatus.textContent = `⏱ Duration set to ${mins} min. Ready!`;
});

pomodoroInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') applyDurationBtn.click();
});

timerStartBtn.addEventListener('click', startTimer);
timerStopBtn.addEventListener('click', stopTimer);
timerResetBtn.addEventListener('click', resetTimer);

/* Request notification permission on first interaction */
timerStartBtn.addEventListener('click', () => {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}, { once: true });

/* ============================================================
   4. TO-DO LIST
   Features: add, edit, done, delete, persist, sort, no-duplicates
   ============================================================ */
const todoInput  = document.getElementById('todo-input');
const todoAddBtn = document.getElementById('todo-add-btn');
const todoList   = document.getElementById('todo-list');
const todoError  = document.getElementById('todo-error');
const todoEmpty  = document.getElementById('todo-empty');
const sortSelect = document.getElementById('sort-select');

// Edit modal elements
const editModal    = document.getElementById('edit-modal');
const editTaskInput= document.getElementById('edit-task-input');
const modalSaveBtn = document.getElementById('modal-save-btn');
const modalCancelBtn=document.getElementById('modal-cancel-btn');

let tasks        = LS.get('tasks', []);
let editingTaskId= null;

/* ── Helpers ── */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function saveTasks() {
  LS.set('tasks', tasks);
}

function getSortedTasks() {
  const mode = sortSelect.value;
  const copy = [...tasks];
  if (mode === 'az')   return copy.sort((a,b) => a.text.localeCompare(b.text));
  if (mode === 'za')   return copy.sort((a,b) => b.text.localeCompare(a.text));
  if (mode === 'done') return copy.sort((a,b) => Number(a.done) - Number(b.done));
  return copy; // default: insertion order
}

function renderTasks() {
  todoList.innerHTML = '';
  const sorted = getSortedTasks();

  if (sorted.length === 0) {
    todoEmpty.classList.remove('hidden');
    return;
  }
  todoEmpty.classList.add('hidden');

  sorted.forEach(task => {
    const li = document.createElement('li');
    li.className = `todo__item${task.done ? ' todo__item--done' : ''}`;
    li.dataset.id = task.id;

    li.innerHTML = `
      <input type="checkbox" class="todo__checkbox" ${task.done ? 'checked' : ''}
             aria-label="Mark ${escHtml(task.text)} as done" />
      <span class="todo__text">${escHtml(task.text)}</span>
      <div class="todo__actions">
        <button class="btn btn--ghost btn--sm edit-btn" title="Edit task" aria-label="Edit task">✏️</button>
        <button class="btn btn--danger btn--sm delete-btn" title="Delete task" aria-label="Delete task">🗑️</button>
      </div>
    `;

    // Checkbox — toggle done
    li.querySelector('.todo__checkbox').addEventListener('change', () => {
      const t = tasks.find(x => x.id === task.id);
      if (t) { t.done = !t.done; saveTasks(); renderTasks(); }
    });

    // Edit
    li.querySelector('.edit-btn').addEventListener('click', () => openEditModal(task.id));

    // Delete
    li.querySelector('.delete-btn').addEventListener('click', () => {
      tasks = tasks.filter(x => x.id !== task.id);
      saveTasks();
      renderTasks();
    });

    todoList.appendChild(li);
  });
}

function escHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function addTask() {
  const text = todoInput.value.trim();
  if (!text) return;

  // Duplicate check (challenge: Prevent duplicate tasks)
  const isDuplicate = tasks.some(t => t.text.toLowerCase() === text.toLowerCase());
  if (isDuplicate) {
    todoError.classList.remove('hidden');
    setTimeout(() => todoError.classList.add('hidden'), 2500);
    return;
  }

  todoError.classList.add('hidden');
  tasks.push({ id: generateId(), text, done: false });
  saveTasks();
  renderTasks();
  todoInput.value = '';
  todoInput.focus();
}

todoAddBtn.addEventListener('click', addTask);
todoInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') addTask(); });
sortSelect.addEventListener('change', renderTasks);

/* ── Edit Modal ── */
function openEditModal(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  editingTaskId        = id;
  editTaskInput.value  = task.text;
  editModal.classList.remove('hidden');
  editTaskInput.focus();
}

function closeEditModal() {
  editModal.classList.add('hidden');
  editingTaskId = null;
}

modalSaveBtn.addEventListener('click', saveEditedTask);
editTaskInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') saveEditedTask(); });
modalCancelBtn.addEventListener('click', closeEditModal);
editModal.addEventListener('click', (e) => { if (e.target === editModal) closeEditModal(); });

function saveEditedTask() {
  const newText = editTaskInput.value.trim();
  if (!newText) return;

  // Duplicate check (skip if text unchanged)
  const task = tasks.find(t => t.id === editingTaskId);
  if (!task) return;
  if (newText.toLowerCase() !== task.text.toLowerCase()) {
    const isDuplicate = tasks.some(t => t.id !== editingTaskId && t.text.toLowerCase() === newText.toLowerCase());
    if (isDuplicate) {
      editTaskInput.select();
      return;
    }
  }

  task.text = newText;
  saveTasks();
  renderTasks();
  closeEditModal();
}

/* ── Keyboard shortcut: Escape closes modal ── */
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !editModal.classList.contains('hidden')) closeEditModal();
});

renderTasks();

/* ============================================================
   5. QUICK LINKS
   ============================================================ */
const linkNameInput = document.getElementById('link-name-input');
const linkUrlInput  = document.getElementById('link-url-input');
const linkAddBtn    = document.getElementById('link-add-btn');
const linksGrid     = document.getElementById('links-grid');
const linksEmpty    = document.getElementById('links-empty');

let links = LS.get('quickLinks', []);

function saveLinks() { LS.set('quickLinks', links); }

function renderLinks() {
  linksGrid.innerHTML = '';

  if (links.length === 0) {
    linksEmpty.classList.remove('hidden');
    return;
  }
  linksEmpty.classList.add('hidden');

  links.forEach((link, index) => {
    const chip = document.createElement('div');
    chip.style.display = 'inline-flex';
    chip.style.alignItems = 'center';

    const anchor = document.createElement('a');
    anchor.href        = link.url;
    anchor.target      = '_blank';
    anchor.rel         = 'noopener noreferrer';
    anchor.className   = 'link-chip';
    anchor.textContent = link.name;

    const delBtn = document.createElement('button');
    delBtn.className   = 'link-chip__delete';
    delBtn.textContent = '✕';
    delBtn.title       = 'Remove link';
    delBtn.setAttribute('aria-label', `Remove ${link.name}`);
    delBtn.addEventListener('click', (e) => {
      e.preventDefault();
      links.splice(index, 1);
      saveLinks();
      renderLinks();
    });

    anchor.appendChild(delBtn);
    chip.appendChild(anchor);
    linksGrid.appendChild(chip);
  });
}

function addLink() {
  const name = linkNameInput.value.trim();
  const url  = linkUrlInput.value.trim();
  if (!name || !url) return;

  // Ensure URL has a protocol
  const fullUrl = /^https?:\/\//i.test(url) ? url : 'https://' + url;

  links.push({ name, url: fullUrl });
  saveLinks();
  renderLinks();
  linkNameInput.value = '';
  linkUrlInput.value  = '';
  linkNameInput.focus();
}

linkAddBtn.addEventListener('click', addLink);
linkUrlInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') addLink(); });

renderLinks();
