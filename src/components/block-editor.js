// ============================================================
// Editor de Bloques Multimedia (Drag & Drop táctil)
// ============================================================

let blockCounter = 0;

export function createBlockEditor(container, initialBlocks = []) {
  const parent = typeof container === 'string' ? document.getElementById(container) : container;
  if (!parent) throw new Error('Contenedor del editor no encontrado');

  let blocks = Array.isArray(initialBlocks) && initialBlocks.length > 0
    ? [...initialBlocks]
    : [{ id: `block-${++blockCounter}`, type: 'text', content: '' }];

  const styleId = 'block-editor-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .be-container { display: flex; flex-direction: column; gap: 12px; }
      .be-block { background: #fff; border: 1px solid #ddd; border-radius: 8px; padding: 12px; position: relative; }
      .be-block.dragging { opacity: 0.5; }
      .be-block.drag-over { border-color: #1976d2; background: #f0f7ff; }
      .be-block-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
      .be-block-type { font-size: 12px; color: #888; text-transform: uppercase; }
      .be-block-actions { display: flex; gap: 6px; }
      .be-block-actions button { background: none; border: 1px solid #ccc; border-radius: 4px; padding: 4px 8px; cursor: pointer; min-height: 44px; min-width: 44px; }
      .be-block-content textarea, .be-block-content input[type="text"], .be-block-content input[type="url"] { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; resize: vertical; min-height: 44px; }
      .be-block-content iframe { width: 100%; height: 200px; border: 1px solid #ddd; border-radius: 4px; }
      .be-add-bar { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 8px; }
      .be-add-btn { background: #1976d2; color: white; border: none; padding: 10px 16px; border-radius: 8px; cursor: pointer; min-height: 44px; }
    `;
    document.head.appendChild(style);
  }

  parent.classList.add('be-container');
  renderBlocks();

  return {
    getBlocks: () => blocks.map(({ id, type, ...rest }) => ({ type, ...rest })),
    setBlocks: (newBlocks) => {
      blocks = newBlocks.map(b => ({ id: b.id || `block-${++blockCounter}`, ...b }));
      renderBlocks();
    },
    destroy: () => {
      parent.innerHTML = '';
      parent.classList.remove('be-container');
    }
  };

  function renderBlocks() {
    parent.innerHTML = '';
    blocks.forEach((block, index) => {
      const blockEl = createBlockElement(block, index);
      parent.appendChild(blockEl);
    });

    const addBar = document.createElement('div');
    addBar.className = 'be-add-bar';
    addBar.innerHTML = `
      <button class="be-add-btn" data-type="text">📝 Texto</button>
      <button class="be-add-btn" data-type="video">🎥 Video</button>
      <button class="be-add-btn" data-type="iframe">🌐 Iframe</button>
      <button class="be-add-btn" data-type="link">🔗 Enlace</button>
      <button class="be-add-btn" data-type="separator">➖ Separador</button>
    `;
    parent.appendChild(addBar);

    addBar.querySelectorAll('.be-add-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.dataset.type;
        const newBlock = createDefaultBlock(type);
        blocks.push(newBlock);
        renderBlocks();
        setTimeout(() => {
          const last = parent.querySelector('.be-block:last-child');
          if (last) last.scrollIntoView({ behavior: 'smooth' });
        }, 50);
      });
    });
  }

  function createDefaultBlock(type) {
    const id = `block-${++blockCounter}`;
    switch (type) {
      case 'text': return { id, type: 'text', content: '' };
      case 'video': return { id, type: 'video', url: '' };
      case 'iframe': return { id, type: 'iframe', url: '' };
      case 'link': return { id, type: 'link', url: '', text: '' };
      case 'separator': return { id, type: 'separator', title: '' };
      default: return { id, type: 'text', content: '' };
    }
  }

  function createBlockElement(block, index) {
    const div = document.createElement('div');
    div.className = 'be-block';
    div.draggable = true;
    div.dataset.index = index;
    div.dataset.blockId = block.id;

    div.addEventListener('dragstart', handleDragStart);
    div.addEventListener('dragover', handleDragOver);
    div.addEventListener('drop', handleDrop);
    div.addEventListener('dragend', handleDragEnd);
    div.addEventListener('touchstart', handleTouchStart, { passive: false });
    div.addEventListener('touchmove', handleTouchMove, { passive: false });
    div.addEventListener('touchend', handleTouchEnd);

    const header = document.createElement('div');
    header.className = 'be-block-header';
    const typeLabel = document.createElement('span');
    typeLabel.className = 'be-block-type';
    typeLabel.textContent = getTypeLabel(block.type);
    const actions = document.createElement('div');
    actions.className = 'be-block-actions';
    actions.innerHTML = `
      <button class="be-move-up" ${index === 0 ? 'disabled' : ''}>⬆️</button>
      <button class="be-move-down" ${index === blocks.length - 1 ? 'disabled' : ''}>⬇️</button>
      <button class="be-delete">🗑️</button>
    `;
    header.appendChild(typeLabel);
    header.appendChild(actions);
    div.appendChild(header);

    const contentDiv = document.createElement('div');
    contentDiv.className = 'be-block-content';
    contentDiv.innerHTML = renderBlockContent(block);
    div.appendChild(contentDiv);

    actions.querySelector('.be-move-up').addEventListener('click', () => moveBlock(index, -1));
    actions.querySelector('.be-move-down').addEventListener('click', () => moveBlock(index, 1));
    actions.querySelector('.be-delete').addEventListener('click', () => {
      if (blocks.length <= 1) { alert('Debe haber al menos un bloque.'); return; }
      blocks.splice(index, 1);
      renderBlocks();
    });

    attachInputListeners(contentDiv, block, index);
    return div;
  }

  function renderBlockContent(block) {
    switch (block.type) {
      case 'text': return `<textarea rows="3" placeholder="Escribe aquí...">${block.content || ''}</textarea>`;
      case 'video': return `<input type="url" placeholder="URL del video de YouTube (embed)" value="${block.url || ''}" data-field="url">${block.url ? `<iframe src="${block.url}" style="margin-top:8px;"></iframe>` : ''}`;
      case 'iframe': return `<input type="url" placeholder="URL del iframe" value="${block.url || ''}" data-field="url">${block.url ? `<iframe src="${block.url}" style="margin-top:8px;"></iframe>` : ''}`;
      case 'link': return `<input type="url" placeholder="URL del enlace" value="${block.url || ''}" data-field="url"><input type="text" placeholder="Texto a mostrar" value="${block.text || ''}" data-field="text" style="margin-top:4px;">${block.url ? `<a href="${block.url}" target="_blank" style="display:block; margin-top:4px;">${block.text || block.url}</a>` : ''}`;
      case 'separator': return `<input type="text" placeholder="Título de sección" value="${block.title || ''}" data-field="title">`;
      default: return '';
    }
  }

  function attachInputListeners(container, block, index) {
    container.querySelectorAll('input, textarea').forEach(input => {
      input.addEventListener('input', () => {
        const field = input.dataset.field || (input.tagName === 'TEXTAREA' ? 'content' : 'url');
        blocks[index][field] = input.value;
      });
    });
  }

  function moveBlock(index, direction) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= blocks.length) return;
    [blocks[index], blocks[newIndex]] = [blocks[newIndex], blocks[index]];
    renderBlocks();
  }

  function getTypeLabel(type) {
    const labels = { text: 'Texto', video: 'Video', iframe: 'Iframe', link: 'Enlace', separator: 'Separador' };
    return labels[type] || type;
  }

  let draggedIndex = null;
  function handleDragStart(e) { draggedIndex = parseInt(e.currentTarget.dataset.index); e.currentTarget.classList.add('dragging'); }
  function handleDragOver(e) { e.preventDefault(); e.currentTarget.classList.add('drag-over'); }
  function handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    const targetIndex = parseInt(e.currentTarget.dataset.index);
    if (draggedIndex !== null && draggedIndex !== targetIndex) {
      const [moved] = blocks.splice(draggedIndex, 1);
      blocks.splice(targetIndex, 0, moved);
      renderBlocks();
    }
    draggedIndex = null;
  }
  function handleDragEnd(e) { e.currentTarget.classList.remove('dragging'); document.querySelectorAll('.be-block').forEach(el => el.classList.remove('drag-over')); }

  let touchDragIndex = null, touchStartY = 0, touchElement = null;
  function handleTouchStart(e) { touchElement = e.currentTarget; touchDragIndex = parseInt(touchElement.dataset.index); touchStartY = e.touches[0].clientY; touchElement.classList.add('dragging'); }
  function handleTouchMove(e) { e.preventDefault(); const diff = e.touches[0].clientY - touchStartY; touchElement.style.transform = `translateY(${diff}px)`; }
  function handleTouchEnd(e) {
    touchElement.classList.remove('dragging');
    touchElement.style.transform = '';
    const target = document.elementFromPoint(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
    const targetBlock = target?.closest('.be-block');
    document.querySelectorAll('.be-block').forEach(el => el.classList.remove('drag-over'));
    if (targetBlock && targetBlock !== touchElement) {
      const targetIndex = parseInt(targetBlock.dataset.index);
      if (!isNaN(targetIndex) && touchDragIndex !== null && touchDragIndex !== targetIndex) {
        const [moved] = blocks.splice(touchDragIndex, 1);
        blocks.splice(targetIndex, 0, moved);
        renderBlocks();
      }
    }
    touchDragIndex = null; touchElement = null;
  }
}