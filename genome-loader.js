(() => {
  'use strict';
  const duration = 2000;
  const total = 152273;
  const segmentCount = 44;
  const colors = ['#2f9e57', '#6fcf5a', '#9bb52e', '#c9e04f', '#f4c92b', '#13a58f', '#d6393b',
    '#e0aa7d', '#a8683a', '#4c6ef5', '#ff8a8a', '#ff922b', '#b44fd1', '#9aa5ad'];
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const formatter = new Intl.NumberFormat('en-US');
  const dialog = document.createElement('dialog');
  dialog.id = 'aclab-genome-loader';
  dialog.setAttribute('aria-label', 'The AC Lab');
  dialog.addEventListener('cancel', event => event.preventDefault());
  dialog.innerHTML = `
    <svg viewBox="0 0 800 800" text-anchor="middle" aria-hidden="true">
      <circle class="guide" cx="400" cy="400" r="264"></circle>
      <g></g>
      <text class="bp-count" x="400" y="412">0</text>
      <text class="bp-unit" x="400" y="466">bp</text>
    </svg>
    <strong class="lab-name">The AC Lab</strong>
    <p class="operation" role="status"></p>`;
  document.body.append(dialog);
  const ring = dialog.querySelector('g');
  const number = dialog.querySelector('.bp-count');
  const operation = dialog.querySelector('.operation');
  const jobs = new Map();
  let delay = 0;
  let frame = 0;
  let started = 0;

  function point(radius, angle) {
    const radians = angle * Math.PI / 180;
    return (400 + radius * Math.sin(radians)).toFixed(1) + ' ' +
      (400 - radius * Math.cos(radians)).toFixed(1);
  }

  const weights = Array.from({ length: segmentCount }, () => .6 + Math.random() * 1.4);
  const sum = weights.reduce((a, b) => a + b);
  let angle = 90;
  const segments = weights.map((weight, index) => {
    const span = 360 * weight / sum;
    const start = angle - .5;
    const end = angle - span + .5;
    const middle = (angle - span / 2) * Math.PI / 180;
    const radius = 300 + Math.random() * 320;
    const offset = (Math.random() - .5) * 320;
    angle -= span;
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('class', 'segment');
    path.setAttribute('d', `M${point(292, start)} A292 292 0 0 0 ${point(292, end)}
      L${point(236, end)} A236 236 0 0 1 ${point(236, start)} Z`);
    path.setAttribute('fill', colors[index % colors.length]);
    ring.append(path);
    return { path, start: Math.random() * .55, rotation: (Math.random() - .5) * 360,
      x: Math.sin(middle) * radius + Math.cos(middle) * offset,
      y: -Math.cos(middle) * radius + Math.sin(middle) * offset };
  });

  function draw(elapsed) {
    const progress = Math.min(1, elapsed / duration);
    let assembled = 0;
    for (const segment of segments) {
      const part = Math.max(0, Math.min(1, (progress - segment.start) / .45));
      const remaining = (1 - part) ** 3;
      assembled += 1 - remaining;
      segment.path.style.transform = `translate(${segment.x * remaining}px, ${segment.y * remaining}px)
        rotate(${segment.rotation * remaining}deg) scale(${1 - .65 * remaining})`;
      segment.path.style.opacity = Math.min(1, part * 4);
    }
    const fraction = assembled / segmentCount;
    const rotation = -50 * (1 - fraction) + Math.max(0, elapsed - duration) * .012;
    ring.setAttribute('transform', `rotate(${rotation} 400 400)`);
    number.textContent = formatter.format(Math.round(fraction * total));
  }

  function animate(now) {
    draw(Math.max(0, now - started));
    frame = requestAnimationFrame(animate);
  }

  function update() {
    if (jobs.size) {
      operation.textContent = [...jobs.values()].at(-1);
      if (dialog.open || delay) return;
      delay = setTimeout(() => {
        delay = 0;
        dialog.showModal();
        document.documentElement.classList.add('aclab-loading');
        started = performance.now();
        if (motion.matches) draw(duration);
        else animate(started);
      }, 120);
      return;
    }
    clearTimeout(delay);
    delay = 0;
    cancelAnimationFrame(frame);
    if (dialog.open) dialog.close();
    document.documentElement.classList.remove('aclab-loading');
  }

  function begin(message) {
    const job = Symbol();
    jobs.set(job, message);
    update();
    return () => { if (jobs.delete(job)) update(); };
  }

  async function run(message, action) {
    const finish = begin(message);
    try { return await action(); }
    finally { finish(); }
  }

  window.ACLoader = { begin, run };
})();
