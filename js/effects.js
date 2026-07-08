  // nyan cat flight on the splash: stepped wave shedding a fading rainbow
  (function(){
    if (prefersReducedMotion) return;
    const cat = document.getElementById('spCat');
    const tc = document.getElementById('trailCanvas');
    if (!cat || !tc) return;
    const tctx = tc.getContext('2d');
    const feet = document.getElementById('catFeet');
    const head = document.getElementById('catHead');
    const tail = document.getElementById('catTail');
    const COLORS = ['#FF3B30', '#FF9500', '#FFE800', '#33E019', '#00A2FF', '#8A5CF6'];
    const CAT_W = 66;                 // sprite width, px
    const STRIPE_H = 4.6;             // one rainbow band
    const TRAIL_H = STRIPE_H * 6;     // full stack
    const FADE_MS = 2400;
    const SPEED = 110;                // px per second
    let segs = [];
    let lastSpawnX = -Infinity;
    let t0 = null;
    let raf = null;

    function size(){
      const d = fxDpr();
      tc.width = splash.clientWidth * d;
      tc.height = splash.clientHeight * d;
      tctx.setTransform(d, 0, 0, d, 0, 0);
    }
    size();
    addEventListener('resize', size);

    function frame(now){
      if (entered){ tctx.clearRect(0, 0, splash.clientWidth, splash.clientHeight); return; }
      if (t0 === null) t0 = now;
      const t = (now - t0) / 1000;
      const W = splash.clientWidth;
      const H = splash.clientHeight;
      const span = W + 320;
      const x = -160 + ((t * SPEED) % span);
      // stepped wave
      const baseY = H - 92;
      const y = baseY + Math.round(Math.sin(t * 6.2) * 1.4) * 8;
      cat.style.transform = 'translate(' + x + 'px,' + y + 'px)';

      // two-frame sprite: feet, head, tail
      const tick = Math.floor(now / 130) % 2;
      feet.setAttribute('transform', tick ? 'translate(1.2 0)' : 'translate(-1.2 0)');
      head.setAttribute('transform', tick ? 'translate(0 0.9)' : 'translate(0 0)');
      tail.setAttribute('transform', tick ? 'translate(0 -0.9)' : 'translate(0 0.5)');

      // shed a segment every 7px on a fixed grid so they always touch
      if (x < lastSpawnX) lastSpawnX = -Infinity;
      if (lastSpawnX === -Infinity) lastSpawnX = x - 7;
      while (x - lastSpawnX >= 7){
        lastSpawnX += 7;
        segs.push({ x: lastSpawnX + 16, y: y + 12, born: now }); // spawn behind the sprite
      }

      tctx.clearRect(0, 0, W, H);
      segs = segs.filter(s => now - s.born < FADE_MS);
      for (const s of segs){
        const a = 1 - (now - s.born) / FADE_MS;
        tctx.globalAlpha = a * 0.9;
        for (let i = 0; i < 6; i++){
          tctx.fillStyle = COLORS[i];
          tctx.fillRect(s.x, s.y + i * STRIPE_H, 8.5, STRIPE_H + 0.5);
        }
      }
      tctx.globalAlpha = 1;
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    // pause when the tab is hidden
    document.addEventListener('visibilitychange', () => {
      if (document.hidden){ if (raf) cancelAnimationFrame(raf); raf = null; }
      else if (!raf && !entered){ t0 = null; lastSpawnX = -Infinity; segs = []; raf = requestAnimationFrame(frame); }
    });
  })();
  addEventListener('keydown', e => {
    if (entered) return;
    if (e.key === 'Tab' || e.metaKey || e.ctrlKey || e.altKey || /^F\d+$/.test(e.key)) return; // leave browser shortcuts alone
    e.preventDefault();
    enterSite();
  });


  // sparkle trail: fine pointers only, off under reduced motion
  (function(){
    if (prefersReducedMotion || !window.matchMedia('(pointer: fine)').matches) return;
    const sc = document.getElementById('sparkleCanvas');
    const sctx = sc.getContext('2d');
    let sparks = [];
    let running = false;
    function size(){
      const d = 1; // 1x keeps the trail cheap on hi-dpi screens
      sc.width = innerWidth * d;
      sc.height = innerHeight * d;
      sctx.setTransform(d, 0, 0, d, 0, 0);
    }
    size();
    addEventListener('resize', size);
    const colors = ['#FFD34D', '#00E5FF', '#FF3CAC', '#FFFFFF'];
    let last = 0;
    addEventListener('pointermove', e => {
      const now = performance.now();
      if (now - last < 28) return; // throttle
      last = now;
      sparks.push({
        x: e.clientX + (Math.random() - 0.5) * 6,
        y: e.clientY + (Math.random() - 0.5) * 6,
        vy: 0.4 + Math.random() * 0.7,
        r: 1.5 + Math.random() * 2.5,
        c: colors[(Math.random() * colors.length) | 0],
        life: 46
      });
      if (!running){ running = true; sc.style.display = 'block'; requestAnimationFrame(step); }
    });
    function drawStar(x, y, r, c, a){
      sctx.save();
      sctx.globalAlpha = a;
      sctx.strokeStyle = c;
      sctx.lineWidth = 1.2;
      sctx.beginPath();
      sctx.moveTo(x - r, y); sctx.lineTo(x + r, y);
      sctx.moveTo(x, y - r); sctx.lineTo(x, y + r);
      sctx.stroke();
      sctx.restore();
    }
    let sparkDirty = null;
    function step(){
      sparks = sparks.filter(s => s.life > 0);
      // dirty-rect: clear only the sparks' bounding box
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity, maxR = 0;
      for (const s of sparks){
        if (s.x < minX) minX = s.x; if (s.x > maxX) maxX = s.x;
        if (s.y < minY) minY = s.y; if (s.y > maxY) maxY = s.y;
        if (s.r > maxR) maxR = s.r;
      }
      const pad = maxR + 3;
      const cur = sparks.length ? { x: minX - pad, y: minY - pad, w: (maxX - minX) + pad * 2, h: (maxY - minY) + pad * 2 } : null;
      if (sparkDirty) sctx.clearRect(sparkDirty.x, sparkDirty.y, sparkDirty.w, sparkDirty.h);
      if (cur) sctx.clearRect(cur.x, cur.y, cur.w, cur.h);
      sparkDirty = cur;
      for (const s of sparks){
        s.y += s.vy; s.life--;
        drawStar(s.x, s.y, s.r * (s.life / 46), s.c, s.life / 46);
      }
      if (sparks.length){ requestAnimationFrame(step); }
      else { running = false; sparkDirty = null; sc.style.display = 'none'; }
    }
  })();

  // page cats: click one to split (max 8); left idle 2s they merge back
  (function(){
    if (prefersReducedMotion) return;
    const proto = document.getElementById('spCat');
    if (!proto) return;
    const canvas2 = document.createElement('canvas');
    canvas2.id = 'nyanPageCanvas';
    canvas2.setAttribute('aria-hidden', 'true');
    document.body.appendChild(canvas2);
    const nctx = canvas2.getContext('2d');
    const COLORS = ['#FF3B30', '#FF9500', '#FFE800', '#33E019', '#00A2FF', '#8A5CF6'];
    const STRIPE_H = 3.9, FADE_MS = 2200, SPEED = 95;
    const MAX_CATS = 8, MERGE_AFTER = 2000;
    let segs = [], raf = null, last = 0, time = 0;
    let prevDirty = null; // last frame's trail bounds for dirty-rect clearing
    let lastTouch = -Infinity;
    let cats = [];
    let saidDivided = false, saidMax = false;

    function pickAltitude(){
      // below the nav strip, above the bottom
      return 90 + Math.random() * Math.max(innerHeight - 260, 60);
    }
    function puff(x, y, now){
      // small burst of rainbow on split/merge
      for (let i = 0; i < 4; i++) segs.push({ x: x + i * 9, y: y + 10, born: now });
    }

    function makeCat(x, baseY){
      const el = proto.cloneNode(true);
      el.removeAttribute('id');
      el.classList.remove('sp-cat');
      el.classList.add('page-cat');
      const feet = el.querySelector('#catFeet');
      const head = el.querySelector('#catHead');
      const tail = el.querySelector('#catTail');
      el.querySelectorAll('[id]').forEach(n => n.removeAttribute('id'));
      document.body.appendChild(el);
      const c = {
        el, feet, head, tail,
        x, baseY,
        y: baseY,
        targetY: baseY,
        speed: SPEED * (0.85 + Math.random() * 0.3),
        phase: Math.random() * Math.PI * 2,
        prevX: x,
        trailAcc: 0
      };
      el.addEventListener('pointerdown', e => {
        e.preventDefault();
        split(c);
      });
      return c;
    }

    function split(c){
      lastTouch = performance.now();
      if (cats.length >= MAX_CATS){
        if (!saidMax){ saidMax = true; notify('MAXIMUM CAT DENSITY REACHED. (8)'); }
        return;
      }
      const kitten = makeCat(c.x, c.baseY);
      kitten.y = c.y;
      // diverge: one drifts up, one down, both kept in view
      const spread = 50 + Math.random() * 70;
      const lo = 90, hi = Math.max(innerHeight - 170, lo + 60);
      c.targetY = Math.min(hi, Math.max(lo, c.baseY - spread));
      kitten.targetY = Math.min(hi, Math.max(lo, c.baseY + spread));
      cats.push(kitten);
      puff(c.x + 6, c.y, performance.now());
      if (!saidDivided){ saidDivided = true; notify('THE CAT HAS DIVIDED. THIS IS NORMAL.'); }
    }

    function size(){
      // render the fullscreen trail canvas below CSS res and let the GPU upscale
      // it (image-rendering: pixelated); 0.67x cuts the per-frame upload cost
      const d = 0.67;
      canvas2.width = Math.ceil(innerWidth * d);
      canvas2.height = Math.ceil(innerHeight * d);
      nctx.setTransform(d, 0, 0, d, 0, 0);
    }
    size();
    addEventListener('resize', size);

    cats.push(makeCat(-160, pickAltitude()));

    function frame(now){
      // cap at ~30fps to cut redraw cost of the always-on fullscreen layer
      if (last && now - last < 32){ raf = requestAnimationFrame(frame); return; }
      if (!last) last = now;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      time += dt;
      const tick = Math.floor(now / 140) % 2;
      const merging = cats.length > 1 && now - lastTouch > MERGE_AFTER;
      const leader = cats[0];

      for (let i = cats.length - 1; i >= 0; i--){
        const c = cats[i];
        if (merging && i > 0){
          // if the leader wrapped to the far side, absorb in place instead of
          // tweening across the whole screen
          if (Math.abs(leader.x - c.x) > innerWidth * 0.6){
            puff(c.x, c.y, now);
            c.el.remove();
            cats.splice(i, 1);
            continue;
          }
          // home back into the leader
          const k = Math.min(1, dt * 4);
          c.x += (leader.x - c.x) * k;
          c.baseY += (leader.baseY - c.baseY) * k;
          c.y = c.baseY + Math.round(Math.sin(time * 5.4 + c.phase) * 1.4) * 7;
          if (Math.abs(leader.x - c.x) < 18 && Math.abs(leader.baseY - c.baseY) < 18){
            puff(c.x, c.y, now);
            c.el.remove();
            cats.splice(i, 1);
            continue;
          }
        } else {
          c.x += c.speed * dt;
          if (c.x > innerWidth + 160){
            c.x = -160;
            c.prevX = c.x;
            c.targetY = pickAltitude();
          }
          c.baseY += (c.targetY - c.baseY) * Math.min(1, dt * 2.5);
          c.y = c.baseY + Math.round(Math.sin(time * 5.4 + c.phase) * 1.4) * 7;
        }
        c.el.style.transform = 'translate(' + c.x + 'px,' + c.y + 'px)';
        // only two frames, skip DOM writes between them
        if (c.lastTick !== tick){
          c.lastTick = tick;
          c.feet.setAttribute('transform', tick ? 'translate(1.2 0)' : 'translate(-1.2 0)');
          c.head.setAttribute('transform', tick ? 'translate(0 0.9)' : 'translate(0 0)');
          c.tail.setAttribute('transform', tick ? 'translate(0 -0.9)' : 'translate(0 0.5)');
        }
        // shed a segment every 7px on a grid tied to the cat's current x, so the
        // ribbon's leading edge stays under the sprite (prevX lagged a frame)
        const emit = c.x + 13;
        if (c.spawnX === undefined || Math.abs(emit - c.spawnX) > 400) c.spawnX = emit;
        const step = emit >= c.spawnX ? 7 : -7;
        let guard = 40; // cap segments per frame after a stalled tab
        while (Math.abs(emit - c.spawnX) >= 7 && guard-- > 0){
          c.spawnX += step;
          segs.push({ x: c.spawnX, y: c.y + 10, born: now });
        }
        c.prevX = c.x;
      }

      segs = segs.filter(s => now - s.born < FADE_MS);
      // dirty-rect: clear only where the trail is
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const s of segs){
        if (s.x < minX) minX = s.x; if (s.x + 8 > maxX) maxX = s.x + 8;
        if (s.y < minY) minY = s.y; if (s.y + 6 * STRIPE_H > maxY) maxY = s.y + 6 * STRIPE_H;
      }
      const cur = segs.length
        ? { x: minX - 2, y: minY - 2, w: (maxX - minX) + 4, h: (maxY - minY) + 4 }
        : null;
      if (prevDirty) nctx.clearRect(prevDirty.x, prevDirty.y, prevDirty.w, prevDirty.h);
      if (cur) nctx.clearRect(cur.x, cur.y, cur.w, cur.h);
      prevDirty = cur;
      for (const s of segs){
        const a = 1 - (now - s.born) / FADE_MS;
        nctx.globalAlpha = a * 0.8;
        for (let i = 0; i < 6; i++){
          nctx.fillStyle = COLORS[i];
          nctx.fillRect(s.x, s.y + i * STRIPE_H, 8, STRIPE_H + 0.5);
        }
      }
      nctx.globalAlpha = 1;
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden){ if (raf) cancelAnimationFrame(raf); raf = null; }
      else if (!raf){ last = 0; segs = []; raf = requestAnimationFrame(frame); }
    });
  })();

  // toast
  const toast = document.getElementById('toast');
  let toastTimer = null;
  function notify(msg){
    toast.textContent = msg;
    toast.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('on'), 3800);
  }

  // confetti: pixel squares launched up, falling under gravity
  const canvas = document.getElementById('confettiCanvas');
  const ctx = canvas.getContext('2d');
  let pieces = [];
  let confettiRunning = false;
  function sizeCanvas(){
    const d = fxDpr();
    canvas.width = innerWidth * d;
    canvas.height = innerHeight * d;
    ctx.setTransform(d, 0, 0, d, 0, 0);
  }
  sizeCanvas();
  addEventListener('resize', sizeCanvas);
  function burstConfetti(){
    if (prefersReducedMotion) return;
    const colors = ['#FF3CAC', '#00E5FF', '#FFD34D', '#3CFF6E', '#FFFFFF'];
    for (let i = 0; i < 140; i++){
      pieces.push({
        x: innerWidth / 2 + (Math.random() - 0.5) * 260,
        y: innerHeight + 10,
        vx: (Math.random() - 0.5) * 7,
        vy: -(10 + Math.random() * 9),
        s: 5 + Math.random() * 6,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.3,
        c: colors[i % colors.length],
        life: 240
      });
    }
    if (!confettiRunning){ confettiRunning = true; canvas.style.display = 'block'; requestAnimationFrame(stepConfetti); }
  }
  function stepConfetti(){
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    pieces = pieces.filter(p => p.life > 0 && p.y < innerHeight + 40);
    for (const p of pieces){
      p.vy += 0.22; p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life--;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = Math.min(1, p.life / 60);
      ctx.fillStyle = p.c;
      ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s);
      ctx.restore();
    }
    if (pieces.length){ requestAnimationFrame(stepConfetti); }
    else { confettiRunning = false; ctx.clearRect(0, 0, innerWidth, innerHeight); canvas.style.display = 'none'; }
  }

  // konami code: opens DEFEND.EXE with a bonus life
  const KONAMI = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
  let kIdx = 0;
  addEventListener('keydown', e => {
    if (e.target.matches('input, textarea')) return;
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    kIdx = (key === KONAMI[kIdx]) ? kIdx + 1 : (key === KONAMI[0] ? 1 : 0);
    if (kIdx === KONAMI.length){
      kIdx = 0;
      burstConfetti();
      DEFEND.open(true);
    }
  });

  // visitor counter: odometer digits backed by localStorage
  (function(){
    let n = 1337;
    try {
      n = parseInt(localStorage.getItem('dkk_visits') || '0', 10) + 1;
      localStorage.setItem('dkk_visits', String(n));
      n += 1336; // seed the count
    } catch (e) {}
    window.VISITOR_N = n; // used by the certificate widget
    const digits = String(n).padStart(6, '0').split('');
    document.getElementById('counterDigits').innerHTML = digits.map(d => '<i>' + d + '</i>').join('');
  })();

  // last updated from document.lastModified
  (function(){
    const d = new Date(document.lastModified);
    if (!isNaN(d)){
      document.getElementById('lastUpdated').textContent =
        d.toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' });
    }
  })();

