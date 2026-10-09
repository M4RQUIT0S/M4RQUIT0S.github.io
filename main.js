(() => {
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fineHover = matchMedia('(hover: hover) and (pointer: fine)').matches && !reduce;
  const text = {
    en: { reading: 'Reading…', copied: 'Email copied', selected: 'Email selected. Press Ctrl+C to copy.',
          name: 'name: Marco Sobrido Alvano · role: full-stack', last: 'last movement: looking for a remote team' },
    es: { reading: 'Leyendo…', copied: 'Email copiado', selected: 'Email seleccionado. Presioná Ctrl+C para copiar.',
          name: 'nombre: Marco Sobrido Alvano · rol: full-stack', last: 'último movimiento: buscando un equipo remoto' },
  };
  const t = key => text[root.lang === 'es' ? 'es' : 'en'][key];

  /* language */
  const langButtons = document.querySelectorAll('.lang button');
  const setLang = lang => {
    root.lang = lang;
    langButtons.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.set === lang)));
    try { localStorage.setItem('lang', lang); } catch (e) { /* storage blocked: choice lasts for this visit only */ }
  };
  langButtons.forEach(b => b.addEventListener('click', () => {
    if (b.dataset.set === root.lang) return;
    document.startViewTransition ? document.startViewTransition(() => setLang(b.dataset.set)) : setLang(b.dataset.set);
  }));
  setLang(root.lang);

  /* split headings into masked words, the wordmark into masked letters */
  document.querySelectorAll('.split').forEach(el => {
    const words = el.textContent.trim().split(/\s+/);
    el.setAttribute('aria-label', el.textContent.trim());
    el.replaceChildren(...words.flatMap((word, i) => {
      const w = document.createElement('span');
      w.className = 'w';
      w.setAttribute('aria-hidden', 'true');
      const inner = document.createElement('span');
      inner.textContent = word;
      inner.style.setProperty('--i', i);
      w.append(inner);
      return i ? [document.createTextNode(' '), w] : [w];
    }));
  });
  const wordmark = document.querySelector('.wordmark');
  [...wordmark.querySelectorAll('[data-letters]')].forEach((part, p, parts) => {
    const offset = parts.slice(0, p).reduce((n, el) => n + el.textContent.length, 0);
    part.replaceChildren(...[...part.textContent].map((ch, i) => {
      const l = document.createElement('span');
      l.className = 'l';
      const inner = document.createElement('span');
      inner.textContent = ch;
      inner.style.setProperty('--i', offset + i);
      l.append(inner);
      return l;
    }));
  });

  /* enter once when scrolled into view */
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in');
    io.unobserve(e.target);
  }), { threshold: 0.15 });
  document.querySelectorAll('.split, .fade, .wordmark, .log li').forEach(el => io.observe(el));

  /* hero network: drifting nodes linked when close, like tags in range of a reader */
  const canvas = document.getElementById('net');
  const ctx = canvas.getContext('2d');
  let nodes = [], w = 0, h = 0, running = true;
  const resize = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    w = canvas.clientWidth; h = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.round(Math.min(90, (w * h) / 14000)); // ponytail: O(n²) link pass, fine under ~100 nodes
    nodes = Array.from({ length: count }, () => ({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - .5) * .25, vy: (Math.random() - .5) * .25 }));
  };
  const draw = () => {
    ctx.clearRect(0, 0, w, h);
    for (const n of nodes) {
      n.x += n.vx; n.y += n.vy;
      if (n.x < 0 || n.x > w) n.vx *= -1;
      if (n.y < 0 || n.y > h) n.vy *= -1;
    }
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j], d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < 140) {
          ctx.strokeStyle = `rgba(242, 194, 48, ${0.14 * (1 - d / 140)})`;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
      ctx.fillStyle = 'rgba(236, 239, 234, 0.35)';
      ctx.fillRect(nodes[i].x - 1, nodes[i].y - 1, 2, 2);
    }
    if (running && !reduce) requestAnimationFrame(draw);
  };
  resize(); draw();
  addEventListener('resize', resize);
  new IntersectionObserver(([e]) => {
    const was = running;
    running = e.isIntersecting;
    if (running && !was && !reduce) draw();
  }).observe(canvas);

  /* 3D ear tag: thickness, flip, tilt toward the pointer */
  const flip = document.getElementById('flip');
  const tilt = document.getElementById('tilt');
  const stage = document.getElementById('stage');
  const outline = flip.querySelector('.front .body').getAttribute('d');
  for (let z = 1; z <= 8; z++) {
    const edge = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    edge.setAttribute('viewBox', '0 0 240 300');
    edge.setAttribute('class', 'edge');
    edge.setAttribute('aria-hidden', 'true');
    edge.style.transform = `translateZ(${-z}px)`;
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', outline);
    path.setAttribute('fill-rule', 'evenodd');
    edge.append(path);
    flip.prepend(edge);
  }
  flip.addEventListener('click', () => flip.setAttribute('aria-pressed', String(flip.getAttribute('aria-pressed') !== 'true')));
  const hero = document.querySelector('.hero');
  if (fineHover) {
    hero.addEventListener('pointermove', e => {
      const r = tilt.getBoundingClientRect();
      tilt.style.setProperty('--ry', `${((e.clientX - (r.left + r.width / 2)) / innerWidth * 50).toFixed(1)}deg`);
      tilt.style.setProperty('--rx', `${(-(e.clientY - (r.top + r.height / 2)) / innerHeight * 30).toFixed(1)}deg`);
    });
    hero.addEventListener('pointerleave', () => { tilt.style.removeProperty('--ry'); tilt.style.removeProperty('--rx'); });

    document.querySelectorAll('.card').forEach(card => {
      card.addEventListener('pointermove', e => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        card.style.setProperty('--ry', `${((x - .5) * 10).toFixed(1)}deg`);
        card.style.setProperty('--rx', `${((.5 - y) * 10).toFixed(1)}deg`);
        card.style.setProperty('--gx', `${(x * 100).toFixed(0)}%`);
        card.style.setProperty('--gy', `${(y * 100).toFixed(0)}%`);
        card.style.setProperty('--glare', '1');
      });
      card.addEventListener('pointerleave', () => ['--rx', '--ry', '--glare'].forEach(v => card.style.removeProperty(v)));
    });
  }

  /* simulated tag read */
  const scanBtn = document.getElementById('scan');
  const out = document.getElementById('console');
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const row = (parts, cls) => { const el = document.createElement('div'); if (cls) el.className = cls; el.append(...parts); return el; };
  scanBtn.addEventListener('click', async () => {
    const label = [...scanBtn.childNodes].map(n => n.cloneNode(true));
    scanBtn.disabled = true;
    scanBtn.textContent = t('reading');
    flip.setAttribute('aria-pressed', 'false');
    out.replaceChildren();
    stage.classList.remove('reading'); void stage.offsetWidth; stage.classList.add('reading');
    const ok = document.createElement('span'); ok.className = 'ok'; ok.textContent = 'record found';
    const lines = [
      row(['$ navigator.bluetooth.requestDevice({ filters: [{ services: [NUS] }] })'], 'dim'),
      row(['pairing… connected · Nordic UART service']),
      row(['rx 032202500000536']),
      row(['lookup EID… ', ok]),
      row([t('name')]),
      row([t('last')], 'dim'),
    ];
    for (const line of lines) { out.append(line); if (!reduce) await wait(420); }
    scanBtn.replaceChildren(...label);
    scanBtn.disabled = false;
  });

  /* copy email */
  const copied = document.getElementById('copied');
  let clearTimer;
  const say = msg => { copied.textContent = msg; clearTimeout(clearTimer); clearTimer = setTimeout(() => { copied.textContent = ''; }, 4000); };
  document.querySelectorAll('[data-copy]').forEach(btn => btn.addEventListener('click', () => {
    const value = btn.dataset.copy;
    navigator.clipboard.writeText(value).then(() => say(t('copied'))).catch(() => {
      const range = document.createRange();
      range.selectNodeContents(btn);
      getSelection().removeAllRanges();
      getSelection().addRange(range);
      say(t('selected'));
    });
  }));

  /* footer cursor: ring tracks instantly, glass pill lags behind (lerp) */
  const footer = document.querySelector('.footer');
  const ring = document.getElementById('cursor-ring');
  const pill = document.getElementById('cursor-pill');
  if (fineHover) {
    let mx = 0, my = 0, px = 0, py = 0, scale = 0, target = 0, inside = false, onTarget = false, first = true, rafId = 0;
    const tick = () => {
      px += (mx - px) * 0.08; py += (my - py) * 0.08;
      scale += (target - scale) * 0.15;
      const ringScale = (onTarget ? 1.6 : 1) * scale;
      pill.style.transform = `translate3d(${px}px, ${py}px, 0) translate(-50%, -50%) scale(${onTarget ? 0 : scale})`;
      ring.style.transform = `translate3d(${mx}px, ${my}px, 0) translate(-50%, -50%) scale(${ringScale})`;
      rafId = (inside || scale > 0.01) ? requestAnimationFrame(tick) : 0;
    };
    const start = () => { if (!rafId) rafId = requestAnimationFrame(tick); };
    footer.addEventListener('pointermove', e => {
      mx = e.clientX; my = e.clientY;
      if (first) { px = mx; py = my; first = false; }
      inside = true; target = 1;
      ring.classList.add('active'); pill.classList.add('active');
      start();
    });
    footer.addEventListener('pointerleave', () => { inside = false; target = 0; first = true; });
    footer.querySelectorAll('a, button').forEach(el => {
      el.addEventListener('pointerenter', () => { onTarget = true; ring.classList.add('expanded'); });
      el.addEventListener('pointerleave', () => { onTarget = false; ring.classList.remove('expanded'); });
    });
  }
})();
