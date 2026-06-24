import '../styles/popup.css';
import { isValidHex, normalizeHex, findMatchingEntry } from './utils.js';
import { persist, loadMappings } from './storage.js';
import { initColoris, setColor, bindHexInput } from './colorPicker.js';

const hostLabel       = document.getElementById('host-label');
const matchInfo       = document.getElementById('match-info');
const removeCurrent   = document.getElementById('remove-current');
const currentSwatch   = document.getElementById('current-swatch');
const currentColoris  = document.getElementById('current-coloris');
const currentHex      = document.getElementById('current-hex');
const saveCurrent     = document.getElementById('save-current');
const saveError       = document.getElementById('save-error');

const addSectionLabel  = document.getElementById('add-section-label');
const cancelEditBtn    = document.getElementById('cancel-edit-btn');
const newDomainInput   = document.getElementById('new-domain-input');
const newRegexCheckbox = document.getElementById('new-regex');
const newSwatch        = document.getElementById('new-swatch');
const newColoris       = document.getElementById('new-coloris');
const newHex           = document.getElementById('new-hex');
const addDomainBtn     = document.getElementById('add-domain-btn');

const domainList  = document.getElementById('domain-list');
const domainEmpty = document.getElementById('domain-list-empty');

initColoris(currentColoris, newColoris);

let host;
let colorMappings = [];
let dragSrcIndex  = null;
let editingIndex  = null;

function showError(msg) {
  saveError.textContent = msg;
  saveError.hidden = false;
}

function clearError() {
  saveError.hidden = true;
}

function renderList() {
  domainList.replaceChildren();
  colorMappings.forEach((entry, i) => domainList.append(createListItem(entry, i)));
}

function refreshCurrentDomain() {
  const match = findMatchingEntry(host, colorMappings);
  if (match) {
    setColor(currentColoris, currentSwatch, currentHex, match.color);
    matchInfo.textContent = match.isExact ? '' : `via: ${match.pattern}`;
    removeCurrent.hidden = !match.isExact;
  } else {
    setColor(currentColoris, currentSwatch, currentHex, '#FFFFFF');
    matchInfo.textContent = '';
    removeCurrent.hidden = true;
  }
}

function startEdit(index, { pattern, color, isRegex }) {
  editingIndex = index;
  addSectionLabel.textContent = `Edit: ${pattern}`;
  addSectionLabel.title = `Edit: ${pattern}`;
  addDomainBtn.textContent = 'Update';
  cancelEditBtn.hidden = false;
  newDomainInput.value = pattern;
  newRegexCheckbox.checked = isRegex;
  setColor(newColoris, newSwatch, newHex, color);
  newDomainInput.focus();
  newDomainInput.scrollIntoView({ block: 'nearest' });
}

function cancelEdit() {
  editingIndex = null;
  addSectionLabel.textContent = 'Add domain';
  addSectionLabel.removeAttribute('title');
  addDomainBtn.textContent = 'Add';
  cancelEditBtn.hidden = true;
  newDomainInput.value = '';
  newRegexCheckbox.checked = false;
  setColor(newColoris, newSwatch, newHex, '#FFFFFF');
}

cancelEditBtn.addEventListener('click', cancelEdit);

saveCurrent.addEventListener('click', async () => {
  const val = normalizeHex(currentHex.value);
  if (!isValidHex(val)) return;

  const idx = colorMappings.findIndex(m => m.pattern === host);
  if (idx >= 0) {
    colorMappings[idx].color = val;
  } else {
    colorMappings.push({ pattern: host, color: val, isRegex: false });
  }

  try {
    await persist(colorMappings);
  } catch (e) {
    showError('Save failed.');
    console.error(e);
    return;
  }
  clearError();
  refreshCurrentDomain();
  renderList();
  domainEmpty.hidden = colorMappings.length > 0;
});

removeCurrent.addEventListener('click', async () => {
  const index = colorMappings.findIndex(m => m.pattern === host);
  if (index < 0) return;
  colorMappings.splice(index, 1);

  try {
    await persist(colorMappings);
  } catch (e) {
    showError('Save failed.');
    console.error(e);
    return;
  }
  clearError();
  refreshCurrentDomain();
  renderList();
  domainEmpty.hidden = colorMappings.length > 0;
});

addDomainBtn.addEventListener('click', async () => {
  const pattern = newDomainInput.value.trim();
  const val     = normalizeHex(newHex.value);
  const isRegex = newRegexCheckbox.checked;
  if (!pattern || !isValidHex(val)) return;

  if (editingIndex !== null) {
    colorMappings[editingIndex] = { pattern, color: val, isRegex };
    colorMappings = colorMappings.filter((m, i) => i === editingIndex || m.pattern !== pattern);
  } else {
    const existing = colorMappings.findIndex(m => m.pattern === pattern);
    if (existing >= 0) {
      colorMappings[existing] = { pattern, color: val, isRegex };
    } else {
      colorMappings.push({ pattern, color: val, isRegex });
    }
  }

  cancelEdit();

  try {
    await persist(colorMappings);
  } catch (e) {
    showError('Save failed.');
    console.error(e);
    return;
  }
  clearError();
  refreshCurrentDomain();
  renderList();
  domainEmpty.hidden = colorMappings.length > 0;
});

newDomainInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter')  addDomainBtn.click();
  if (e.key === 'Escape') cancelEdit();
});

function createListItem({ pattern, color, isRegex }, index) {
  const li = document.createElement('li');
  li.dataset.index = index;

  const handle = document.createElement('span');
  handle.className = 'drag-handle';
  handle.textContent = '⠿';
  handle.setAttribute('draggable', 'true');

  const swatch = document.createElement('span');
  swatch.className = 'domain-swatch';
  swatch.style.backgroundColor = color;

  const name = document.createElement('span');
  name.className = 'domain-name';
  name.textContent = pattern;
  name.title = pattern;

  li.append(handle, swatch, name);

  if (isRegex) {
    const badge = document.createElement('span');
    badge.className = 'domain-regex-badge';
    badge.textContent = 'regex';
    li.append(badge);
  }

  const editBtn = document.createElement('button');
  editBtn.className = 'btn-icon action-btn edit-domain';
  editBtn.textContent = '✎';
  editBtn.title = 'Edit';
  editBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    startEdit(parseInt(li.dataset.index), { pattern, color, isRegex });
  });

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'btn-icon action-btn delete-domain';
  deleteBtn.textContent = '✕';
  deleteBtn.title = 'Remove';
  deleteBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    const i = parseInt(li.dataset.index);
    if (editingIndex === i) cancelEdit();
    colorMappings.splice(i, 1);

    try {
      await persist(colorMappings);
    } catch (err) {
      showError('Save failed.');
      console.error(err);
      return;
    }
    clearError();
    refreshCurrentDomain();
    renderList();
    domainEmpty.hidden = colorMappings.length > 0;
  });

  li.append(editBtn, deleteBtn);

  handle.addEventListener('dragstart', (e) => {
    dragSrcIndex = parseInt(li.dataset.index);
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => li.classList.add('dragging'), 0);
  });

  handle.addEventListener('dragend', () => {
    li.classList.remove('dragging');
    domainList.querySelectorAll('li').forEach(el => el.classList.remove('drag-over'));
    dragSrcIndex = null;
  });

  li.addEventListener('dragover', (e) => {
    if (dragSrcIndex === null) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    domainList.querySelectorAll('li').forEach(el => el.classList.remove('drag-over'));
    li.classList.add('drag-over');
  });

  li.addEventListener('dragleave', (e) => {
    if (!li.contains(e.relatedTarget)) li.classList.remove('drag-over');
  });

  li.addEventListener('drop', async (e) => {
    e.preventDefault();
    li.classList.remove('drag-over');
    const dropIndex = parseInt(li.dataset.index);
    if (dragSrcIndex === null || dragSrcIndex === dropIndex) return;

    if (editingIndex !== null) {
      if (editingIndex === dragSrcIndex) {
        editingIndex = dropIndex;
      } else if (dragSrcIndex < editingIndex && dropIndex >= editingIndex) {
        editingIndex--;
      } else if (dragSrcIndex > editingIndex && dropIndex <= editingIndex) {
        editingIndex++;
      }
    }

    const [moved] = colorMappings.splice(dragSrcIndex, 1);
    colorMappings.splice(dropIndex, 0, moved);
    dragSrcIndex = null;

    try {
      await persist(colorMappings);
    } catch (err) {
      showError('Save failed.');
      console.error(err);
      return;
    }
    clearError();
    renderList();
  });

  return li;
}

async function init() {
  const [tab] = await browser.tabs.query({ currentWindow: true, active: true });
  let url;
  try { url = new URL(tab?.url); } catch { return; }
  host = url.host;
  hostLabel.textContent = host;

  colorMappings = await loadMappings();

  const match = findMatchingEntry(host, colorMappings);
  if (match) {
    setColor(currentColoris, currentSwatch, currentHex, match.color);
    if (!match.isExact) matchInfo.textContent = `via: ${match.pattern}`;
    if (match.isExact)  removeCurrent.hidden = false;
  } else {
    setColor(currentColoris, currentSwatch, currentHex, '#FFFFFF');
  }

  setColor(newColoris, newSwatch, newHex, '#FFFFFF');
  bindHexInput(currentHex, currentColoris, currentSwatch);
  bindHexInput(newHex, newColoris, newSwatch);
  renderList();
  domainEmpty.hidden = colorMappings.length > 0;
}

init().catch(console.error);
