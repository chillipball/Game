'use strict';

/* ══════════════════════════════════════
   State
══════════════════════════════════════ */
const state = {
  equipped:  { top: null, bottom: null, shoes: null, hair: null },
  lipColour: '#FF4D6D',
  eyeColour: '#C084FC',
};

/* ══════════════════════════════════════
   Snap zone definitions
   (cx, cy in doll SVG coordinate space: viewBox 0 0 200 480)
   r is the snap radius in SVG units — converted to page px at runtime.
══════════════════════════════════════ */
const ZONE_DEFS = {
  top:    { svgCx: 100, svgCy: 225, svgR: 78 },
  bottom: { svgCx: 100, svgCy: 338, svgR: 82 },
  shoes:  { svgCx: 100, svgCy: 438, svgR: 66 },
  hair:   { svgCx: 100, svgCy:  38, svgR: 62 },
};

/* Convert doll SVG coordinates → page pixel coordinates */
function dollSvgToPage(svgX, svgY) {
  const svg  = document.getElementById('doll-svg');
  const rect = svg.getBoundingClientRect();
  return {
    x: rect.left + (svgX / 200) * rect.width,
    y: rect.top  + (svgY / 480) * rect.height,
  };
}

/* Build page-space zone objects on demand (size changes on resize) */
function getPageZones() {
  const svg  = document.getElementById('doll-svg');
  const rect = svg.getBoundingClientRect();
  const scaleX = rect.width  / 200;
  const scaleY = rect.height / 480;
  // SVG uses preserveAspectRatio="xMidYMid meet" (the default) which scales by
  // the minimum of the two ratios, so snap radii must use Math.min.
  const scale  = Math.min(scaleX, scaleY);
  const zones  = {};

  for (const [name, def] of Object.entries(ZONE_DEFS)) {
    const { x, y } = dollSvgToPage(def.svgCx, def.svgCy);
    zones[name] = { x, y, r: def.svgR * scale, name };
  }
  return zones;
}

/* ══════════════════════════════════════
   Equip an item into a zone
══════════════════════════════════════ */
function equip(itemId, zoneName) {
  const zoneEl = document.getElementById(`zone-${zoneName}`);

  // Swap content
  zoneEl.innerHTML = `<use href="#${itemId}"/>`;

  // Trigger CSS snap-pop animation.
  // offsetWidth is always 0 on SVG elements so we use getAnimations() to cancel
  // any running animation before restarting. A 1-frame rAF ensures the removal
  // is painted before the class is re-added.
  zoneEl.getAnimations().forEach(a => a.cancel());
  zoneEl.classList.remove('zone-pop');
  requestAnimationFrame(() => {
    zoneEl.classList.add('zone-pop');
    zoneEl.addEventListener('animationend', () => zoneEl.classList.remove('zone-pop'), { once: true });
  });

  // Update state
  state.equipped[zoneName] = itemId;

  // Highlight equipped item in wardrobe
  document.querySelectorAll(`.wardrobe-item[data-zone="${zoneName}"]`).forEach(el => {
    el.classList.toggle('equipped', el.dataset.item === itemId);
  });

  // Sparkle burst at zone centre
  const zones = getPageZones();
  spawnSparkles(zones[zoneName].x, zones[zoneName].y);

  // Brief doll glow
  const dollSvg = document.getElementById('doll-svg');
  dollSvg.classList.add('glow');
  setTimeout(() => dollSvg.classList.remove('glow'), 550);
}

/* ══════════════════════════════════════
   Sparkle burst
══════════════════════════════════════ */
const SPARKLE_COLOURS = [
  '#FF6B9D', '#C77DFF', '#60D5FA', '#FFD166', '#84FAB0', '#FF4D8D', '#FCD34D',
];

function spawnSparkles(cx, cy) {
  const container = document.createElement('div');
  container.className = 'sparkle-container';
  document.body.appendChild(container);

  const count = 10;
  for (let i = 0; i < count; i++) {
    const s     = document.createElement('div');
    s.className = 'sparkle';

    const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
    const dist  = 38 + Math.random() * 36;

    s.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
    s.style.setProperty('--dy', `${Math.sin(angle) * dist}px`);
    s.style.background     = SPARKLE_COLOURS[i % SPARKLE_COLOURS.length];
    s.style.left           = (cx - 5) + 'px';
    s.style.top            = (cy - 5) + 'px';
    s.style.animationDelay = `${Math.random() * 0.08}s`;
    s.style.width          = (8 + Math.random() * 6) + 'px';
    s.style.height         = s.style.width;

    container.appendChild(s);
  }

  setTimeout(() => container.remove(), 900);
}

/* ══════════════════════════════════════
   Drag clone helpers
══════════════════════════════════════ */
function createDragClone(itemEl, x, y) {
  removeDragClone();

  const clone = document.createElement('div');
  clone.id    = 'drag-clone';

  const imgEl = itemEl.querySelector('img');
  if (imgEl) {
    const img    = document.createElement('img');
    img.src      = imgEl.src;
    img.width    = imgEl.width  || 80;
    img.height   = imgEl.height || 80;
    img.alt      = imgEl.alt;
    img.style.pointerEvents = 'none';
    clone.appendChild(img);
    clone.style.width  = img.width  + 'px';
    clone.style.height = img.height + 'px';
  } else {
    const svgEl = itemEl.querySelector('svg');
    clone.innerHTML    = svgEl.outerHTML;
    clone.style.width  = svgEl.getAttribute('width')  + 'px';
    clone.style.height = svgEl.getAttribute('height') + 'px';
  }

  clone.style.left = x + 'px';
  clone.style.top  = y + 'px';

  document.body.appendChild(clone);
  return clone;
}

function removeDragClone() {
  const clone = document.getElementById('drag-clone');
  if (!clone) return;
  clone.classList.add('fading');
  setTimeout(() => clone.remove(), 200);
}

/* ══════════════════════════════════════
   Snap ring helpers
══════════════════════════════════════ */
function showSnapRing(zoneName) {
  hideAllSnapRings();
  const zones = getPageZones();
  const zone  = zones[zoneName];
  const ring  = document.getElementById(`snap-ring-${zoneName}`);
  if (!ring || !zone) return;

  const size = zone.r * 2;
  ring.style.left   = zone.x + 'px';
  ring.style.top    = zone.y + 'px';
  ring.style.width  = size  + 'px';
  ring.style.height = size  + 'px';
  ring.classList.add('visible');
}

function hideAllSnapRings() {
  document.querySelectorAll('.snap-ring').forEach(r => r.classList.remove('visible'));
}

/* ══════════════════════════════════════
   Proximity check
══════════════════════════════════════ */
function getSnapZoneName(px, py, targetZone) {
  const zone = getPageZones()[targetZone];
  if (!zone) return null;
  const dist = Math.hypot(px - zone.x, py - zone.y);
  return dist < zone.r ? targetZone : null;
}

/* ══════════════════════════════════════
   Drag state
══════════════════════════════════════ */
let drag = null; // { itemId, zone, clone, startX, startY, moved, done, pointerId, itemEl }

function onPointerDown(e) {
  if (e.button !== undefined && e.button !== 0) return; // primary button only
  e.preventDefault();

  const itemEl = e.currentTarget;
  const clone  = createDragClone(itemEl, e.clientX, e.clientY);

  drag = {
    itemId:    itemEl.dataset.item,
    zone:      itemEl.dataset.zone,
    clone,
    startX:    e.clientX,
    startY:    e.clientY,
    moved:     false,
    done:      false,
    pointerId: e.pointerId,
    itemEl,
  };

  document.addEventListener('pointermove',  onPointerMove,  { passive: false });
  document.addEventListener('pointerup',    onPointerUp);
  document.addEventListener('pointercancel', onPointerCancel);
}

function onPointerMove(e) {
  if (!drag || drag.done) return;
  e.preventDefault();

  const px = e.clientX;
  const py = e.clientY;

  if (!drag.moved && Math.hypot(px - drag.startX, py - drag.startY) > 7) {
    drag.moved = true;
    // Capture pointer so the element keeps receiving events even if the
    // finger/cursor leaves the element (critical for touch drag reliability).
    try { drag.itemEl.setPointerCapture(drag.pointerId); } catch (_) {}
  }

  // Move clone
  drag.clone.style.left = px + 'px';
  drag.clone.style.top  = py + 'px';

  // Check proximity
  const nearZone = getSnapZoneName(px, py, drag.zone);
  if (nearZone) {
    showSnapRing(nearZone);

    // Auto-snap on hover
    drag.done = true;
    equip(drag.itemId, drag.zone);
    removeDragClone();
    hideAllSnapRings();
    cleanupDrag();
  } else {
    hideAllSnapRings();
  }
}

function onPointerCancel() {
  removeDragClone();
  hideAllSnapRings();
  cleanupDrag();
}

function onPointerUp(e) {
  if (!drag || drag.done) {
    cleanupDrag();
    return;
  }

  const px = e.clientX;
  const py = e.clientY;

  if (!drag.moved) {
    // Tap → auto-equip immediately
    equip(drag.itemId, drag.zone);
  } else {
    // Released: check final position
    const nearZone = getSnapZoneName(px, py, drag.zone);
    if (nearZone) equip(drag.itemId, drag.zone);
  }

  removeDragClone();
  hideAllSnapRings();
  cleanupDrag();
}

function cleanupDrag() {
  document.removeEventListener('pointermove',   onPointerMove);
  document.removeEventListener('pointerup',     onPointerUp);
  document.removeEventListener('pointercancel', onPointerCancel);
  drag = null;
}

/* ══════════════════════════════════════
   Makeup swatches
══════════════════════════════════════ */
document.querySelectorAll('.swatch').forEach(sw => {
  sw.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    const target = sw.dataset.target;
    const colour = sw.dataset.colour;

    // Deselect siblings
    document.querySelectorAll(`.swatch[data-target="${target}"]`).forEach(s =>
      s.classList.remove('selected')
    );
    sw.classList.add('selected');

    if (target === 'lips') {
      state.lipColour = colour;
      document.getElementById('lips-upper').setAttribute('fill', colour);
      document.getElementById('lips-lower').setAttribute('fill', colour);
    } else {
      state.eyeColour = colour;
      document.getElementById('eye-left-shadow').setAttribute('fill', colour);
      document.getElementById('eye-right-shadow').setAttribute('fill', colour);
    }

    // Sparkle near the face
    const { x, y } = dollSvgToPage(100, 105);
    spawnSparkles(x, y);
  });
});

/* ══════════════════════════════════════
   Reset button
══════════════════════════════════════ */
document.getElementById('reset-btn').addEventListener('click', () => {
  // Clear all clothing zones
  ['top', 'bottom', 'shoes', 'hair'].forEach(z => {
    document.getElementById(`zone-${z}`).innerHTML = '';
    state.equipped[z] = null;
  });

  // Reset makeup
  state.lipColour = '#FF4D6D';
  state.eyeColour = '#C084FC';
  document.getElementById('lips-upper').setAttribute('fill', '#FF4D6D');
  document.getElementById('lips-lower').setAttribute('fill', '#FF4D6D');
  document.getElementById('eye-left-shadow').setAttribute('fill', '#C084FC');
  document.getElementById('eye-right-shadow').setAttribute('fill', '#C084FC');

  // Reset wardrobe highlights and swatch selections
  document.querySelectorAll('.wardrobe-item').forEach(el => el.classList.remove('equipped'));
  document.querySelectorAll('.swatch').forEach(el => el.classList.remove('selected'));

  // Celebratory sparkles on reset
  const { x, y } = dollSvgToPage(100, 240);
  spawnSparkles(x, y);
  spawnSparkles(x - 40, y - 60);
  spawnSparkles(x + 40, y - 60);
});

/* ══════════════════════════════════════
   Wire up wardrobe items
══════════════════════════════════════ */
document.querySelectorAll('.wardrobe-item').forEach(itemEl => {
  itemEl.addEventListener('pointerdown', onPointerDown);
});
