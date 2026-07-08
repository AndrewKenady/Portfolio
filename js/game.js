/* Extracted from index.html. Classic script — shares global scope; load order matters (see index.html). */
  // ===== DEFEND.EXE — full arcade: entrances, divers, shop, bosses, leaderboard =====
  const DEFEND = (function(){
    const overlay = document.getElementById('gameOverlay');
    const cv = document.getElementById('gameCanvas');
    const g = cv.getContext('2d');
    const elScore = document.getElementById('gScore');
    const elHi = document.getElementById('gHi');
    const elLives = document.getElementById('gLives');
    const elLvl = document.getElementById('gLvl');
    const elBytes = document.getElementById('gBytes');
    const elHint = document.getElementById('gHint');
    const W = 480, H = 560;

    // --- persistent leaderboard ---
    const DEFAULT_BOARD = [
      { name:'DRW', score:5000, lv:6 }, { name:'NYN', score:4000, lv:5 },
      { name:'CRL', score:3000, lv:4 }, { name:'MRC', score:2000, lv:3 },
      { name:'RSE', score:1000, lv:2 }
    ];
    let board;
    try { board = JSON.parse(localStorage.getItem('dkk_arcade') || 'null') || DEFAULT_BOARD.slice(); }
    catch(e){ board = DEFAULT_BOARD.slice(); }
    function saveBoard(){ try { localStorage.setItem('dkk_arcade', JSON.stringify(board)); } catch(e){} }
    function hiScore(){ return board.length ? board[0].score : 0; }

    // --- state ---
    let running = false, raf = null, last = 0, crtWasOn = false, time = 0;
    let mode = 'intro'; // intro | play | shop | over | entry | board
    let score = 0, bytes = 0, lives = 3, level = 1, shields = 0;
    let up = { rapid:0, cannon:0, speed:0 };
    let ship, pShots, eShots, foes, boss, parts, floats, shake = 0;
    let fireHeld = false, moveL = false, moveR = false, moveU = false, moveD = false;
    let touchX = null, touchY = null, invuln = 0;
    let shipTrail = [];
    const Y_MIN = H - 175, Y_MAX = H - 34; // the flight band — low orbit only
    let modeT = 0;           // seconds in current mode
    let shopSel = 0, shopItems = [];
    let entry = { chars:[0,0,0], slot:0 };
    const CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.!?';
    let stars = [];
    for (let i = 0; i < 60; i++) stars.push({ x: Math.random()*W, y: Math.random()*H, s: 0.3 + Math.random()*1.4 });

    // deterministic per-level RNG — the "procedural" in procedurally generated
    function rng(seed){
      let a = (seed * 2654435761) >>> 0;
      return function(){
        a |= 0; a = (a + 0x6D2B79F5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }

    // --- audio ---
    let ac = null;
    function beep(freq, dur, type, vol, when){
      try {
        ac = ac || new (window.AudioContext || window.webkitAudioContext)();
        const t0 = ac.currentTime + (when || 0);
        const o = ac.createOscillator(), gn = ac.createGain();
        o.type = type || 'square';
        o.frequency.value = freq;
        gn.gain.setValueAtTime(vol || 0.03, t0);
        gn.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
        o.connect(gn); gn.connect(ac.destination);
        o.start(t0); o.stop(t0 + dur);
      } catch(e){}
    }
    function jingle(freqs, step, dur, type, vol){
      freqs.forEach((f, i) => beep(f, dur || 0.12, type || 'square', vol || 0.03, i * (step || 0.09)));
    }

    // --- level generation ---
    function levelSpec(n){
      const r = rng(n);
      const isBoss = n % 10 === 0;
      const rows = Math.min(3 + Math.floor(n / 3), 6);
      const kindPool = ['digit','button','window'];
      if (n >= 2) kindPool.push('new');
      if (n >= 4) kindPool.push('ad');
      if (n >= 6) kindPool.push('cursor');
      const rowKinds = [];
      for (let i = 0; i < rows; i++) rowKinds.push(kindPool[(r() * kindPool.length) | 0]);
      return {
        isBoss, rows, rowKinds, r,
        sway: 30 + Math.min(n * 3, 60),
        swaySpd: 0.5 + Math.min(n * 0.05, 0.9),
        fireChance: 0.008 + Math.min(n * 0.0022, 0.03),
        shotSpd: 120 + Math.min(n * 12, 220),
        maxDivers: Math.min(1 + Math.floor(n / 2), 5),
        diveChance: n >= 2 ? 0.004 + Math.min(n * 0.0012, 0.014) : 0,
        hpBonus: n >= 8 ? 1 : 0
      };
    }
    const KIND_STATS = {
      digit:  { pts:10, hp:1, w:34, h:24 },
      button: { pts:20, hp:1, w:46, h:26 },
      window: { pts:30, hp:2, w:46, h:28 },
      new:    { pts:40, hp:1, w:44, h:22 },
      ad:     { pts:50, hp:2, w:50, h:30 },
      cursor: { pts:60, hp:1, w:26, h:28 }
    };

    function spawnLevel(n){
      const spec = levelSpec(n);
      foes = []; boss = null; pShots = []; eShots = []; floats = [];
      if (spec.isBoss){
        const tier = n / 10;
        boss = {
          x: W/2, y: 110, w: 220, h: 96,
          hp: 50 + tier * 40, hpMax: 50 + tier * 40,
          tier, t: 0, flash: 0, minionT: 6
        };
        jingle([220, 185, 156, 131], 0.16, 0.22, 'sawtooth', 0.05); // alarm
        return;
      }
      const cols = 7;
      for (let row = 0; row < spec.rows; row++){
        const kind = spec.rowKinds[row];
        const st = KIND_STATS[kind];
        for (let c = 0; c < cols; c++){
          const fx = 30 + c * ((W - 60) / (cols - 1)) - st.w/2;
          const fy = 58 + row * 42;
          const side = (row % 2) ? -60 : W + 60;
          foes.push({
            kind, w: st.w, h: st.h,
            pts: st.pts + (n * 2), hp: st.hp + (kind === 'window' ? spec.hpBonus : 0),
            fx, fy, x: side, y: -40 - row * 30,
            ex: side, ey: -30 - row * 26,
            cxp: W/2 + (spec.r() - 0.5) * 300, cyp: 140 + spec.r() * 160,
            entDelay: row * 0.35 + c * 0.09, entDur: 1.15,
            state: 'enter', p: 0, dig: (spec.r() * 10) | 0, diveT: 0
          });
        }
      }
    }

    // --- shop ---
    function buildShop(){
      shopItems = [
        { id:'rapid',  name:'RAPID FIRE',   desc:'-25% fire cooldown',        cost: 150 * Math.pow(2, up.rapid),  max: 3, have: () => up.rapid },
        { id:'cannon', name:'MULTI-CANNON', desc:'+1 barrel (max 3)',         cost: 350 * Math.pow(2, up.cannon), max: 2, have: () => up.cannon },
        { id:'speed',  name:'OVERCLOCK',    desc:'+20% ship speed',           cost: 200 * Math.pow(2, up.speed),  max: 2, have: () => up.speed },
        { id:'shield', name:'FIREWALL',     desc:'absorbs one hit (max 2)',   cost: 250,                          max: 2, have: () => shields },
        { id:'life',   name:'EXTRA LIFE',   desc:'self-explanatory',          cost: 500,                          max: 9, have: () => lives - 1 },
        { id:'skip',   name:'CONTINUE >>',  desc:'to level ' + (level + 1),   cost: 0,                            max: 99, have: () => 0 }
      ];
      shopSel = shopItems.length - 1;
    }
    function buyShopItem(){
      const it = shopItems[shopSel];
      if (it.id === 'skip'){ startLevel(level + 1); return; }
      if (it.have() >= it.max){ beep(140, 0.15, 'sawtooth', 0.03); return; }
      if (bytes < it.cost){ beep(140, 0.15, 'sawtooth', 0.03); return; }
      bytes -= it.cost;
      if (it.id === 'rapid') up.rapid++;
      else if (it.id === 'cannon') up.cannon++;
      else if (it.id === 'speed') up.speed++;
      else if (it.id === 'shield') shields++;
      else if (it.id === 'life') lives++;
      jingle([784, 1046], 0.07, 0.09, 'triangle', 0.05); // cha-ching
      buildShop();
      shopSel = Math.min(shopSel, shopItems.length - 1);
      syncHud();
    }

    // --- flow ---
    function startRun(konami){
      score = 0; bytes = 0; lives = konami ? 4 : 3; level = 1; shields = 0;
      up = { rapid:0, cannon:0, speed:0 };
      startLevel(1);
    }
    function startLevel(n){
      level = n;
      ship = { x: W/2, y: H - 46, w: 30, h: 18, tilt: 0 };
      shipTrail = [];
      invuln = 1;
      fireHeld = false; moveL = false; moveR = false; moveU = false; moveD = false;
      touchX = null; touchY = null;
      parts = []; floats = [];
      spawnLevel(n);
      setMode('intro');
      jingle([523, 659, 784], 0.08, 0.1, 'square', 0.04);
      syncHud();
    }
    function setMode(m){
      mode = m; modeT = 0;
      elHint.innerHTML = {
        intro: 'GET READY',
        play:  '&larr;&darr;&uarr;&rarr; / WASD FLY &bull; SPACE FIRE &bull; ESC QUIT',
        shop:  '&uarr;&darr; SELECT &bull; SPACE BUY &bull; TAP ITEMS ON TOUCH',
        over:  'SPACE: CONTINUE',
        entry: '&uarr;&darr; CHANGE &bull; &larr;&rarr; SLOT &bull; SPACE OK &bull; OR JUST TYPE',
        board: 'SPACE: PLAY AGAIN &bull; ESC: EXIT'
      }[m] || '';
    }
    function levelCleared(){
      const bonus = 50 * level;
      score += bonus; bytes += 20 + 5 * level;
      floats.push({ x: W/2, y: H/2, txt: 'LEVEL CLEAR  +' + bonus, life: 1.6, c: '#3CFF6E' });
      jingle([523, 659, 784, 1046], 0.09, 0.14, 'triangle', 0.05);
      buildShop();
      setMode('shop');
      syncHud();
    }
    function gameOver(){
      setMode('over');
      jingle([392, 330, 262, 196], 0.18, 0.3, 'sawtooth', 0.05);
      shake = 14;
    }
    function qualifies(){ return board.length < 10 || score > board[board.length - 1].score; }
    function submitScore(){
      const name = entry.chars.map(i => CHARSET[i]).join('');
      board.push({ name, score, lv: level });
      board.sort((a,b) => b.score - a.score);
      board = board.slice(0, 10);
      saveBoard();
      elHi.textContent = hiScore();
      setMode('board');
      jingle([523, 659, 784, 1046, 1318], 0.08, 0.12, 'square', 0.04);
    }
    function syncHud(){
      elScore.textContent = score;
      elBytes.textContent = bytes;
      elLvl.textContent = level;
      elHi.textContent = hiScore();
      elLives.innerHTML = '&hearts;'.repeat(Math.max(lives, 0)) || '&mdash;';
    }

    function open(viaKonami){
      if (running){ if (viaKonami){ lives++; syncHud(); notify('CHEAT ACCEPTED. +1 LIFE.'); } return; }
      running = true;
      crtWasOn = document.body.classList.contains('crt');
      document.body.classList.add('crt');
      document.body.style.overflow = 'hidden';
      overlay.classList.add('on');
      if (viaKonami) notify('KONAMI ACKNOWLEDGED. BONUS LIFE.');
      startRun(viaKonami);
      last = 0;
      raf = requestAnimationFrame(loop);
    }
    function close(){
      running = false;
      if (raf) cancelAnimationFrame(raf);
      overlay.classList.remove('on');
      if (!crtWasOn) document.body.classList.remove('crt');
      document.body.style.overflow = '';
    }

    function boom(x, y, col, n){
      for (let i = 0; i < (n || 14); i++){
        parts.push({ x, y, vx:(Math.random()-0.5)*180, vy:(Math.random()-0.5)*180, life:0.5, c:col });
      }
    }

    // --- combat helpers ---
    function damageFoe(f, idx){
      f.hp--;
      if (f.hp > 0){ f.flash = 0.12; beep(300, 0.05, 'square', 0.02); return; }
      boom(f.x + f.w/2, f.y + f.h/2, '#FF3CAC');
      score += f.pts;
      bytes += Math.max(1, (f.pts / 10) | 0);
      floats.push({ x: f.x + f.w/2, y: f.y, txt: '+' + f.pts, life: 0.7, c: '#F0EDF5' });
      foes.splice(idx, 1);
      beep(520, 0.07, 'square', 0.03);
    }
    function hitShip(){
      if (shields > 0){
        shields--;
        invuln = 1.2;
        boom(ship.x, ship.y, '#3CFF6E', 10);
        beep(240, 0.2, 'triangle', 0.05);
        floats.push({ x: ship.x, y: ship.y - 24, txt: 'FIREWALL DOWN', life: 0.9, c: '#3CFF6E' });
        return;
      }
      lives--;
      syncHud();
      boom(ship.x, ship.y, '#00E5FF', 22);
      beep(90, 0.35, 'sawtooth', 0.05);
      invuln = 1.6;
      shake = 10;
      if (lives <= 0) gameOver();
    }
    let lastFire = 0;
    function tryFire(now){
      const cd = 210 * Math.pow(0.75, up.rapid);
      if (now - lastFire < cd) return;
      lastFire = now;
      const barrels = 1 + up.cannon;
      for (let b = 0; b < barrels; b++){
        const off = barrels === 1 ? 0 : (b - (barrels - 1) / 2) * 12;
        pShots.push({ x: ship.x + off, y: ship.y - 14, vx: barrels === 3 ? off * 3 : 0 });
      }
      beep(880, 0.05, 'square', 0.018);
    }

    // --- update ---
    function update(dt){
      time += dt; modeT += dt;
      for (const st of stars){ st.y += st.s * 30 * dt; if (st.y > H){ st.y = -2; st.x = Math.random() * W; } }
      for (const p of parts){ p.x += p.vx*dt; p.y += p.vy*dt; p.life -= dt; }
      parts = parts.filter(p => p.life > 0);
      for (const fl of floats){ fl.y -= 26 * dt; fl.life -= dt; }
      floats = floats.filter(f => f.life > 0);
      if (shake > 0) shake = Math.max(0, shake - dt * 30);

      if (mode === 'intro'){ if (modeT > 1.4) setMode('play'); return; }
      if (mode !== 'play') return;

      const spec = levelSpec(level);

      // ship — full 2D flight within the band
      const spd = 280 * Math.pow(1.2, up.speed);
      let dx = 0, dy = 0;
      if (moveL) dx -= spd * dt;
      if (moveR) dx += spd * dt;
      if (moveU) dy -= spd * 0.8 * dt;
      if (moveD) dy += spd * 0.8 * dt;
      if (touchX !== null) dx = Math.max(-spd*dt, Math.min(spd*dt, touchX - ship.x));
      if (touchY !== null) dy = Math.max(-spd*0.8*dt, Math.min(spd*0.8*dt, touchY - ship.y));
      ship.x = Math.max(20, Math.min(W - 20, ship.x + dx));
      ship.y = Math.max(Y_MIN, Math.min(Y_MAX, ship.y + dy));
      // bank into the strafe
      const targetTilt = Math.max(-0.3, Math.min(0.3, dx / Math.max(spd * dt, 0.001) * 0.3));
      ship.tilt += (targetTilt - ship.tilt) * Math.min(dt * 12, 1);
      // afterimage trail
      shipTrail.push({ x: ship.x, y: ship.y, tilt: ship.tilt });
      if (shipTrail.length > 12) shipTrail.shift();
      // engine wash — burns hotter under thrust
      const thrust = (Math.abs(dx) + Math.abs(dy)) > 0.1;
      if (Math.random() < (thrust ? 0.9 : 0.4)){
        parts.push({
          x: ship.x + (Math.random()-0.5) * 8 - ship.tilt * 20,
          y: ship.y + 12,
          vx: (Math.random()-0.5) * 30 - ship.tilt * 60,
          vy: 60 + Math.random() * (thrust ? 90 : 40),
          life: 0.22 + Math.random() * 0.12,
          c: Math.random() < 0.6 ? '#00E5FF' : (Math.random() < 0.5 ? '#FF3CAC' : '#FFD34D')
        });
      }
      if (invuln > 0) invuln -= dt;
      if (fireHeld) tryFire(time * 1000);

      // formation + entrances + divers
      const swayX = Math.sin(time * spec.swaySpd) * spec.sway;
      let divers = 0;
      for (const f of foes) if (f.state === 'dive') divers++;
      for (const f of foes){
        if (f.flash > 0) f.flash -= dt;
        if (f.state === 'enter'){
          if (modeT > f.entDelay){
            f.p += dt / f.entDur;
            const t = Math.min(f.p, 1);
            const u = 1 - t;
            f.x = u*u*f.ex + 2*u*t*f.cxp + t*t*f.fx;
            f.y = u*u*f.ey + 2*u*t*f.cyp + t*t*f.fy;
            if (f.p >= 1){ f.state = 'form'; }
          }
        } else if (f.state === 'form'){
          f.x = f.fx + swayX;
          f.y = f.fy + Math.sin(time * 1.7 + f.fx * 0.03) * 4;
          if (divers < spec.maxDivers && Math.random() < spec.diveChance){
            f.state = 'dive'; f.diveT = 0; f.dx0 = f.x; f.dy0 = f.y;
            f.dtx = ship.x; divers++;
            beep(660, 0.09, 'sawtooth', 0.02);
          }
        } else if (f.state === 'dive'){
          f.diveT += dt / 1.7;
          const t = f.diveT;
          f.x = f.dx0 + (f.dtx - f.dx0) * t + Math.sin(t * Math.PI * 3) * 46;
          f.y = f.dy0 + (H + 50 - f.dy0) * t * t;
          if (f.y > H + 40){ f.state = 'enter'; f.p = 0; f.ex = f.x = Math.random() * W; f.ey = f.y = -40; f.cxp = W/2; f.cyp = 120; f.entDelay = modeT; }
        }
      }

      // firing: formation + divers aim
      if (foes.length && Math.random() < spec.fireChance){
        const f = foes[(Math.random() * foes.length) | 0];
        if (f.state !== 'enter'){
          const aimed = f.state === 'dive' || f.kind === 'ad';
          const dx = aimed ? (ship.x - (f.x + f.w/2)) : 0;
          const dist = Math.max(Math.abs(dx), 1);
          eShots.push({ x: f.x + f.w/2, y: f.y + f.h, vx: aimed ? (dx / dist) * spec.shotSpd * 0.4 : 0, vy: spec.shotSpd });
          beep(180, 0.08, 'sawtooth', 0.012);
        }
      }

      // boss
      if (boss){
        boss.t += dt;
        if (boss.flash > 0) boss.flash -= dt;
        boss.x = W/2 + Math.sin(boss.t * 0.6) * 110;
        boss.y = 100 + Math.sin(boss.t * 1.3) * 22;
        // spread fire
        if ((boss.t % Math.max(1.6 - boss.tier * 0.15, 0.8)) < dt){
          for (let a = -2; a <= 2; a++){
            eShots.push({ x: boss.x, y: boss.y + boss.h/2, vx: a * 46, vy: 150 + boss.tier * 20 });
          }
          beep(150, 0.14, 'sawtooth', 0.03);
        }
        // minions
        boss.minionT -= dt;
        if (boss.minionT <= 0){
          boss.minionT = Math.max(7 - boss.tier, 3.5);
          for (let i = 0; i < 3; i++){
            const st = KIND_STATS.digit;
            foes.push({ kind:'digit', w:st.w, h:st.h, pts: 15 + level, hp: 1,
              fx: boss.x - 60 + i * 60 - st.w/2, fy: 210,
              x: boss.x, y: boss.y + 30, ex: boss.x, ey: boss.y + 30,
              cxp: boss.x + (i - 1) * 120, cyp: 260,
              entDelay: modeT, entDur: 0.8, state:'enter', p:0, dig:(Math.random()*10)|0, diveT:0, flash:0 });
          }
        }
      }

      // shots
      for (const s of pShots){ s.y -= 430 * dt; s.x += (s.vx || 0) * dt; }
      for (const s of eShots){ s.y += s.vy * dt; s.x += (s.vx || 0) * dt; }
      pShots = pShots.filter(s => s.y > -12 && s.x > -10 && s.x < W + 10);
      eShots = eShots.filter(s => s.y < H + 12 && s.x > -10 && s.x < W + 10);

      // player shots vs foes / boss
      for (const s of pShots){
        for (let i = foes.length - 1; i >= 0; i--){
          const f = foes[i];
          if (f.state !== 'enter' && s.x > f.x && s.x < f.x + f.w && s.y > f.y && s.y < f.y + f.h){
            damageFoe(f, i);
            s.y = -99;
            break;
          }
        }
        if (boss && s.y > -50 &&
            s.x > boss.x - boss.w/2 && s.x < boss.x + boss.w/2 &&
            s.y > boss.y - boss.h/2 && s.y < boss.y + boss.h/2){
          // the × button is the weak point, naturally
          const xbX = boss.x + boss.w/2 - 18, xbY = boss.y - boss.h/2 + 10;
          const crit = Math.abs(s.x - xbX) < 12 && Math.abs(s.y - xbY) < 12;
          boss.hp -= crit ? 3 : 1;
          boss.flash = 0.1;
          if (crit) floats.push({ x: s.x, y: s.y, txt: 'CRIT', life: 0.5, c: '#FFD34D' });
          beep(crit ? 700 : 330, 0.06, 'square', 0.03);
          s.y = -99;
          if (boss.hp <= 0){
            const pts = 1000 * boss.tier;
            score += pts; bytes += 150 * boss.tier;
            boom(boss.x, boss.y, '#FF3CAC', 60);
            boom(boss.x - 60, boss.y + 20, '#FFD34D', 40);
            boom(boss.x + 60, boss.y - 20, '#00E5FF', 40);
            floats.push({ x: W/2, y: boss.y, txt: 'SYSTEM RESTORED  +' + pts, life: 2, c: '#FFD34D' });
            shake = 16;
            boss = null;
            burstConfetti();
          }
        }
      }

      // enemy contact + shots vs ship
      if (invuln <= 0){
        for (const s of eShots){
          if (Math.abs(s.x - ship.x) < ship.w/2 + 4 && Math.abs(s.y - ship.y) < ship.h/2 + 6){
            s.y = H + 99;
            hitShip();
            break;
          }
        }
        for (const f of foes){
          if (f.state === 'dive' &&
              Math.abs((f.x + f.w/2) - ship.x) < (f.w + ship.w)/2 - 6 &&
              Math.abs((f.y + f.h/2) - ship.y) < (f.h + ship.h)/2 - 4){
            hitShip();
            break;
          }
        }
      }

      elScore.textContent = score;
      elBytes.textContent = bytes;

      // level cleared?
      if (!foes.length && !boss) levelCleared();
    }

    // --- drawing ---
    function drawFoe(f){
      const flash = f.flash > 0;
      if (f.kind === 'window'){
        g.fillStyle = flash ? '#FFFFFF' : '#F0EDF5'; g.fillRect(f.x, f.y, f.w, f.h);
        const grad = g.createLinearGradient(f.x, 0, f.x + f.w, 0);
        grad.addColorStop(0, '#FF3CAC'); grad.addColorStop(1, '#2B86C5');
        g.fillStyle = grad; g.fillRect(f.x, f.y, f.w, 8);
        g.fillStyle = '#8E86A8';
        g.fillRect(f.x+5, f.y+13, f.w-10, 3);
        g.fillRect(f.x+5, f.y+19, f.w-16, 3);
      } else if (f.kind === 'button'){
        g.fillStyle = flash ? '#FFFFFF' : '#F0EDF5'; g.fillRect(f.x, f.y, f.w, f.h);
        g.fillStyle = '#FFFFFF'; g.fillRect(f.x, f.y, f.w, 2); g.fillRect(f.x, f.y, 2, f.h);
        g.fillStyle = '#8E86A8'; g.fillRect(f.x, f.y+f.h-2, f.w, 2); g.fillRect(f.x+f.w-2, f.y, 2, f.h);
        g.fillStyle = '#1E1938'; g.font = 'bold 11px Verdana'; g.textAlign = 'center';
        g.fillText('OK', f.x+f.w/2, f.y+f.h/2+4);
      } else if (f.kind === 'new'){
        g.fillStyle = flash ? '#FFFFFF' : '#FF3CAC'; g.fillRect(f.x+2, f.y+2, f.w-4, f.h-4);
        g.fillStyle = flash ? '#FF3CAC' : '#FFFFFF'; g.font = 'bold 11px Verdana'; g.textAlign = 'center';
        g.fillText('NEW!', f.x+f.w/2, f.y+f.h/2+4);
      } else if (f.kind === 'ad'){
        g.fillStyle = flash ? '#FFFFFF' : '#FFD34D'; g.fillRect(f.x, f.y, f.w, f.h);
        g.fillStyle = '#1E1938'; g.fillRect(f.x, f.y, f.w, 9);
        g.fillStyle = '#FFD34D'; g.font = 'bold 7px Verdana'; g.textAlign = 'center';
        g.fillText('AD', f.x+f.w/2, f.y+7);
        g.fillStyle = '#B0286E'; g.font = 'bold 9px Verdana';
        g.fillText('FREE RAM', f.x+f.w/2, f.y+f.h-9);
      } else if (f.kind === 'cursor'){
        g.fillStyle = flash ? '#FF3CAC' : '#FFFFFF';
        g.beginPath();
        g.moveTo(f.x+6, f.y);
        g.lineTo(f.x+6, f.y+f.h-6);
        g.lineTo(f.x+12, f.y+f.h-12);
        g.lineTo(f.x+18, f.y+f.h);
        g.lineTo(f.x+22, f.y+f.h-3);
        g.lineTo(f.x+15, f.y+f.h-14);
        g.lineTo(f.x+22, f.y+f.h-14);
        g.closePath();
        g.fill();
        g.strokeStyle = '#1E1938'; g.lineWidth = 1.5; g.stroke();
      } else { // digit
        g.fillStyle = '#000000'; g.fillRect(f.x+4, f.y, f.w-8, f.h);
        g.fillStyle = flash ? '#FFFFFF' : '#3CFF6E'; g.font = 'bold 14px Courier New'; g.textAlign = 'center';
        g.fillText(String(f.dig), f.x+f.w/2, f.y+f.h/2+5);
      }
    }

    function drawBoss(){
      const bx = boss.x - boss.w/2, by = boss.y - boss.h/2;
      g.fillStyle = boss.flash > 0 ? '#FFFFFF' : '#F0EDF5';
      g.fillRect(bx, by, boss.w, boss.h);
      const grad = g.createLinearGradient(bx, 0, bx + boss.w, 0);
      grad.addColorStop(0, '#E03C31'); grad.addColorStop(1, '#7A2BD9');
      g.fillStyle = grad; g.fillRect(bx, by, boss.w, 20);
      g.fillStyle = '#FFFFFF'; g.font = 'bold 11px Courier New'; g.textAlign = 'left';
      g.fillText('FATAL_ERROR.EXE — TIER ' + boss.tier, bx + 8, by + 14);
      // the × button (weak point) — hit it for triple damage
      const xbX = boss.x + boss.w/2 - 18, xbY = by + 10;
      g.fillStyle = '#F0EDF5'; g.fillRect(xbX - 9, xbY - 8, 18, 16);
      g.strokeStyle = '#8E86A8'; g.lineWidth = 2; g.strokeRect(xbX - 9, xbY - 8, 18, 16);
      g.fillStyle = '#E03C31'; g.font = 'bold 12px Verdana'; g.textAlign = 'center';
      g.fillText('×', xbX, xbY + 4);
      // body text
      g.fillStyle = '#1E1938'; g.font = 'bold 10px Courier New'; g.textAlign = 'center';
      g.fillText('A fatal exception 0E has occurred', boss.x, by + 40);
      g.fillText('at 0057:PORTFOLIO. The current', boss.x, by + 54);
      g.fillText('website will be terminated.', boss.x, by + 68);
      g.fillStyle = '#8E86A8'; g.font = '9px Courier New';
      g.fillText('* Press any key to perish *', boss.x, by + 84);
      // health bar
      g.fillStyle = '#1E1938'; g.fillRect(60, 22, W - 120, 10);
      g.fillStyle = '#E03C31'; g.fillRect(62, 24, (W - 124) * Math.max(boss.hp / boss.hpMax, 0), 6);
    }

    function shipGeo(alpha, hot){
      // drawn at origin — caller sets the transform
      g.globalAlpha = alpha;
      if (hot){
        // engine flame — flickers every frame
        const fl = 9 + Math.random() * 7;
        g.fillStyle = '#FF3CAC';
        g.beginPath();
        g.moveTo(-5, 11); g.lineTo(5, 11); g.lineTo(0, 11 + fl);
        g.closePath(); g.fill();
        g.fillStyle = '#FFD34D';
        g.beginPath();
        g.moveTo(-2.5, 11); g.lineTo(2.5, 11); g.lineTo(0, 11 + fl * 0.55);
        g.closePath(); g.fill();
      }
      g.fillStyle = '#00E5FF';
      g.fillRect(-15, 0, 30, 8);
      g.fillRect(-9, -6, 18, 6);
      g.fillRect(-2.5, -12, 5, 6);
      g.fillStyle = '#FF3CAC';
      g.fillRect(-15, 8, 6, 3);
      g.fillRect(9, 8, 6, 3);
      g.globalAlpha = 1;
    }
    function drawShip(){
      // afterimages first, oldest faintest
      for (let i = 0; i < shipTrail.length - 1; i += 3){
        const tr = shipTrail[i];
        g.save();
        g.translate(tr.x, tr.y);
        g.rotate(tr.tilt);
        shipGeo(0.04 + (i / shipTrail.length) * 0.1, false);
        g.restore();
      }
      if (invuln > 0 && ((invuln * 10) | 0) % 2 === 1) return;
      g.save();
      g.translate(ship.x, ship.y);
      g.rotate(ship.tilt);
      shipGeo(1, true);
      g.restore();
      if (shields > 0){
        g.strokeStyle = shields > 1 ? '#FFD34D' : '#3CFF6E';
        g.lineWidth = 1.5;
        g.globalAlpha = 0.7 + Math.sin(time * 6) * 0.3;
        g.beginPath();
        g.arc(ship.x, ship.y, 26, 0, Math.PI * 2);
        g.stroke();
        g.globalAlpha = 1;
      }
    }

    function centerText(txt, y, size, color, bold){
      g.fillStyle = color;
      // +20% — the menu screens' text was hard to read through the CRT scanlines
      g.font = (bold ? 'bold ' : '') + (size * 1.2) + 'px Courier New';
      g.textAlign = 'center';
      g.fillText(txt, W/2, y);
    }

    function paint(){
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.clearRect(0, 0, W, H);
      if (shake > 0) g.setTransform(1, 0, 0, 1, (Math.random()-0.5) * shake, (Math.random()-0.5) * shake);
      // scrolling starfield
      for (const st of stars){
        g.globalAlpha = 0.25 + st.s * 0.4;
        g.fillStyle = '#FFFFFF';
        g.fillRect(st.x, st.y, st.s > 1.2 ? 2 : 1.5, st.s > 1.2 ? 2 : 1.5);
      }
      g.globalAlpha = 1;

      if (mode === 'shop'){ paintShop(); return; }
      if (mode === 'entry'){ paintEntry(); return; }
      if (mode === 'board'){ paintBoard(); return; }

      for (const f of foes) drawFoe(f);
      if (boss) drawBoss();
      g.fillStyle = '#00E5FF';
      for (const s of pShots) g.fillRect(s.x-2, s.y-8, 4, 10);
      for (const s of eShots){
        g.fillStyle = '#F0EDF5'; g.fillRect(s.x-5, s.y-6, 11, 12);
        g.fillStyle = '#E03C31'; g.font = 'bold 10px Verdana'; g.textAlign = 'center';
        g.fillText('!', s.x+0.5, s.y+3.5);
      }
      for (const p of parts){
        g.globalAlpha = Math.max(p.life*2, 0);
        g.fillStyle = p.c;
        g.fillRect(p.x-2, p.y-2, 4, 4);
      }
      g.globalAlpha = 1;
      for (const fl of floats){
        g.globalAlpha = Math.min(fl.life * 2, 1);
        g.fillStyle = fl.c;
        g.font = 'bold 12px Courier New'; g.textAlign = 'center';
        g.fillText(fl.txt, fl.x, fl.y);
      }
      g.globalAlpha = 1;
      drawShip();

      if (mode === 'intro'){
        const bossLevel = level % 10 === 0;
        centerText('LEVEL ' + level, H/2 - 10, 30, bossLevel ? '#E03C31' : '#F0EDF5', true);
        if (bossLevel) centerText('!! SYSTEM CRITICAL !!', H/2 + 22, 14, '#E03C31', true);
        else if (modeT % 0.6 < 0.35) centerText('READY', H/2 + 22, 14, '#3CFF6E', true);
      }
      if (mode === 'over'){
        g.fillStyle = 'rgba(4,2,16,0.8)';
        g.fillRect(0, 0, W, H);
        centerText('GAME OVER', H/2 - 60, 34, '#FF3CAC', true);
        centerText('THE SITE REMAINS.', H/2 - 28, 15, '#F0EDF5', true);
        centerText('SCORE ' + score + '   LEVEL ' + level, H/2 + 2, 15, '#F0EDF5', true);
        if (qualifies()) centerText('** HIGH SCORE — ENTER YOUR NAME **', H/2 + 34, 13, '#FFD34D', true);
        centerText(qualifies() ? 'PRESS SPACE' : 'SPACE: LEADERBOARD   ESC: TRUCE', H/2 + 62, 13, '#3CFF6E');
        centerText('p.s. i build games for a living — hire me', H/2 + 96, 12, '#8F85B8');
      }
    }

    function paintShop(){
      centerText('★ THE BYTE SHOP ★', 64, 24, '#FFD34D', true);
      centerText('LEVEL ' + level + ' CLEAR  —  YOU HAVE ' + bytes + ' BYTES', 92, 13, '#3CFF6E');
      shopItems.forEach((it, i) => {
        const y = 140 + i * 58;
        const sel = i === shopSel;
        const maxed = it.id !== 'skip' && it.have() >= it.max;
        const afford = it.id === 'skip' || bytes >= it.cost;
        if (sel){
          g.fillStyle = 'rgba(0,229,255,0.12)';
          g.fillRect(40, y - 24, W - 80, 48);
          g.strokeStyle = '#00E5FF'; g.lineWidth = 2;
          g.strokeRect(40, y - 24, W - 80, 48);
          g.fillStyle = '#00E5FF'; g.font = 'bold 19px Courier New'; g.textAlign = 'left';
          g.fillText('>', 50, y + 5);
        }
        g.textAlign = 'left';
        g.fillStyle = maxed ? '#8F85B8' : (afford ? '#F0EDF5' : '#8F85B8');
        g.font = 'bold 18px Courier New';
        g.fillText(it.name + (it.id !== 'skip' && it.max <= 3 ? ' ' + '◆'.repeat(it.have()) : ''), 70, y);
        g.font = '13px Courier New';
        g.fillStyle = '#8F85B8';
        g.fillText(it.desc, 70, y + 16);
        g.textAlign = 'right';
        g.font = 'bold 17px Courier New';
        if (it.id === 'skip'){ g.fillStyle = '#3CFF6E'; g.fillText('FREE', W - 56, y + 5); }
        else if (maxed){ g.fillStyle = '#8F85B8'; g.fillText('MAX', W - 56, y + 5); }
        else { g.fillStyle = afford ? '#FFD34D' : '#E03C31'; g.fillText(it.cost + 'B', W - 56, y + 5); }
      });
    }

    function paintEntry(){
      centerText('HIGH SCORE!', 130, 28, '#FFD34D', true);
      centerText(String(score), 168, 20, '#F0EDF5', true);
      centerText('ENTER YOUR NAME', 220, 14, '#3CFF6E', true);
      for (let i = 0; i < 3; i++){
        const x = W/2 + (i - 1) * 60;
        const sel = i === entry.slot;
        g.fillStyle = sel ? 'rgba(0,229,255,0.15)' : 'rgba(255,255,255,0.05)';
        g.fillRect(x - 22, 250, 44, 56);
        g.strokeStyle = sel ? '#00E5FF' : '#8F85B8';
        g.lineWidth = 2;
        g.strokeRect(x - 22, 250, 44, 56);
        g.fillStyle = sel ? '#00E5FF' : '#F0EDF5';
        g.font = 'bold 41px Courier New'; g.textAlign = 'center';
        g.fillText(CHARSET[entry.chars[i]], x, 294);
        if (sel && (time % 0.8) < 0.4){
          g.fillStyle = '#00E5FF';
          g.fillRect(x - 14, 312, 28, 3);
        }
      }
      centerText('SPACE / ENTER TO CONFIRM', 360, 12, '#8F85B8');
    }

    function paintBoard(){
      centerText('— HALL OF FAME —', 84, 22, '#FFD34D', true);
      board.forEach((e, i) => {
        const y = 130 + i * 34;
        const isNew = e.score === score && mode === 'board' && e.lv === level;
        g.font = 'bold 18px Courier New';
        g.textAlign = 'left';
        g.fillStyle = isNew ? '#FFD34D' : (i === 0 ? '#3CFF6E' : '#F0EDF5');
        g.fillText(String(i + 1).padStart(2, ' ') + '.', 92, y);
        g.fillText(e.name, 140, y);
        g.textAlign = 'right';
        g.fillText(String(e.score).padStart(7, ' '), 330, y);
        g.fillStyle = '#8F85B8';
        g.fillText('LV' + (e.lv || 1), 388, y);
      });
      centerText('SPACE: PLAY AGAIN   ESC: EXIT', H - 60, 13, '#3CFF6E');
    }

    function loop(ts){
      if (!running) return;
      if (!last) last = ts;
      const dt = Math.min((ts - last) / 1000, 0.05);
      last = ts;
      update(dt);
      paint();
      raf = requestAnimationFrame(loop);
    }

    // --- input ---
    function advanceFromOver(){
      if (qualifies()){ entry = { chars:[0,0,0], slot:0 }; setMode('entry'); }
      else setMode('board');
    }
    addEventListener('keydown', e => {
      if (!running) return;
      if (e.key === 'Escape'){ close(); return; }
      if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' '].includes(e.key)) e.preventDefault();

      if (mode === 'shop'){
        if (e.key === 'ArrowUp') { shopSel = (shopSel + shopItems.length - 1) % shopItems.length; beep(500, 0.04, 'square', 0.02); }
        if (e.key === 'ArrowDown'){ shopSel = (shopSel + 1) % shopItems.length; beep(500, 0.04, 'square', 0.02); }
        if (e.key === ' ' || e.key === 'Enter') buyShopItem();
        return;
      }
      if (mode === 'entry'){
        const N = CHARSET.length;
        if (e.key === 'ArrowUp'){ entry.chars[entry.slot] = (entry.chars[entry.slot] + N - 1) % N; beep(700, 0.03, 'square', 0.02); }
        else if (e.key === 'ArrowDown'){ entry.chars[entry.slot] = (entry.chars[entry.slot] + 1) % N; beep(700, 0.03, 'square', 0.02); }
        else if (e.key === 'ArrowLeft'){ entry.slot = Math.max(0, entry.slot - 1); }
        else if (e.key === 'ArrowRight'){ entry.slot = Math.min(2, entry.slot + 1); }
        else if (e.key === 'Backspace'){ entry.slot = Math.max(0, entry.slot - 1); }
        else if (e.key === ' ' || e.key === 'Enter'){
          if (entry.slot < 2){ entry.slot++; beep(600, 0.04, 'square', 0.02); }
          else submitScore();
        } else if (/^[a-z0-9.!?]$/i.test(e.key)){
          const idx = CHARSET.indexOf(e.key.toUpperCase());
          if (idx >= 0){
            entry.chars[entry.slot] = idx;
            if (entry.slot < 2) entry.slot++;
            beep(600, 0.04, 'square', 0.02);
          }
        }
        return;
      }
      if (mode === 'board'){
        if (e.key === ' ' || e.key === 'Enter') startRun(false);
        return;
      }
      if (mode === 'over'){
        if (e.key === ' ' || e.key === 'Enter') advanceFromOver();
        return;
      }
      // play / intro
      if (e.key === 'ArrowLeft' || e.key === 'a') moveL = true;
      if (e.key === 'ArrowRight' || e.key === 'd') moveR = true;
      if (e.key === 'ArrowUp' || e.key === 'w') moveU = true;
      if (e.key === 'ArrowDown' || e.key === 's') moveD = true;
      if (e.key === ' ') fireHeld = true;
    });
    addEventListener('keyup', e => {
      if (e.key === 'ArrowLeft' || e.key === 'a') moveL = false;
      if (e.key === 'ArrowRight' || e.key === 'd') moveR = false;
      if (e.key === 'ArrowUp' || e.key === 'w') moveU = false;
      if (e.key === 'ArrowDown' || e.key === 's') moveD = false;
      if (e.key === ' ') fireHeld = false;
    });
    cv.addEventListener('pointerdown', e => {
      const px = (e.offsetX / cv.clientWidth) * W;
      const py = (e.offsetY / cv.clientHeight) * H;
      if (mode === 'shop'){
        const idx = Math.round((py - 140) / 58);
        if (idx >= 0 && idx < shopItems.length){
          if (idx === shopSel) buyShopItem();
          else { shopSel = idx; beep(500, 0.04, 'square', 0.02); }
        }
        return;
      }
      if (mode === 'entry'){
        if (py < 250){ entry.chars[entry.slot] = (entry.chars[entry.slot] + 1) % CHARSET.length; }
        else if (py > 306){
          if (entry.slot < 2) entry.slot++;
          else submitScore();
        } else {
          const slot = Math.min(2, Math.max(0, Math.round((px - W/2) / 60) + 1));
          entry.slot = slot;
        }
        return;
      }
      if (mode === 'board'){ startRun(false); return; }
      if (mode === 'over'){ advanceFromOver(); return; }
      fireHeld = true;
      touchX = px;
      touchY = Math.max(Y_MIN, Math.min(Y_MAX, py));
    });
    cv.addEventListener('pointermove', e => {
      if (e.buttons && (mode === 'play' || mode === 'intro')){
        touchX = (e.offsetX / cv.clientWidth) * W;
        touchY = Math.max(Y_MIN, Math.min(Y_MAX, (e.offsetY / cv.clientHeight) * H));
      }
    });
    addEventListener('pointerup', () => { fireHeld = false; touchX = null; touchY = null; });
    document.getElementById('gameClose').addEventListener('click', close);
    document.addEventListener('visibilitychange', () => { if (document.hidden && running) last = 0; });

    return { open, close, get running(){ return running; } };
  })();

