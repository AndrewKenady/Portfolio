/* Extracted from index.html. Classic script — shares global scope; load order matters (see index.html). */
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // effect canvases render at capped DPI — it's all chunky pixel art anyway,
  // and full retina on 4-5 fullscreen canvases is where the frame budget went
  const fxDpr = () => Math.min(window.devicePixelRatio || 1, 1.5);

  // ===== the enter page — first input doubles as audio consent =====
  const splash = document.getElementById('splash');
  let entered = false;

  // the gate greets everyone, every time — that's how the music gets its user gesture
  document.body.style.overflow = 'hidden';
  splash.focus({ preventScroll: true });

  // marquee the page title while the door is still closed
  const REAL_TITLE = document.title;
  let tstr = '★ DREW K. KENNEDY ★ GAME DEVELOPER ★ CONTENT CREATOR ★ HOST & PANELIST ';
  let titleTimer = setInterval(() => {
    tstr = tstr.slice(1) + tstr[0];
    document.title = tstr;
  }, 400);

  // ===== MIDI ENGINE — because the background music is a real .mid file =====
  const MIDI = (function(){
    let notes = [], duration = 0, loaded = false;
    let actx = null, master = null, schedTimer = null, songStart = 0, cursor = 0, playing = false;
    const CH_WAVE = ['square','triangle','sawtooth','square','triangle','sawtooth','square','triangle','sine','','square','triangle','sawtooth','square','triangle','sawtooth'];

    function varlen(dv, p){
      let v = 0, b;
      do { b = dv.getUint8(p.i++); v = (v << 7) | (b & 0x7F); } while (b & 0x80);
      return v;
    }

    function parse(buf){
      const dv = new DataView(buf);
      if (dv.getUint32(0) !== 0x4D546864) return false;
      const ntrks = dv.getUint16(10);
      const tpq = dv.getUint16(12);
      if (tpq & 0x8000) return false;
      let pos = 14;
      const raw = [], tempos = [{ tick: 0, uspq: 500000 }];
      for (let t = 0; t < ntrks; t++){
        if (pos + 8 > dv.byteLength || dv.getUint32(pos) !== 0x4D54726B) break;
        const len = dv.getUint32(pos + 4);
        const end = pos + 8 + len;
        const p = { i: pos + 8 };
        let tick = 0, status = 0;
        while (p.i < end){
          tick += varlen(dv, p);
          const b = dv.getUint8(p.i);
          if (b & 0x80){ status = b; p.i++; }
          const hi = status & 0xF0, ch = status & 0x0F;
          if (hi === 0x90 || hi === 0x80){
            const n = dv.getUint8(p.i++), v = dv.getUint8(p.i++);
            raw.push({ tick, ch, n, on: hi === 0x90 && v > 0, v });
          } else if (hi === 0xA0 || hi === 0xB0 || hi === 0xE0){ p.i += 2; }
          else if (hi === 0xC0 || hi === 0xD0){ p.i += 1; }
          else if (status === 0xFF){
            const type = dv.getUint8(p.i++), mlen = varlen(dv, p);
            if (type === 0x51) tempos.push({ tick, uspq: (dv.getUint8(p.i)<<16) | (dv.getUint8(p.i+1)<<8) | dv.getUint8(p.i+2) });
            p.i += mlen;
          } else if (status === 0xF0 || status === 0xF7){
            // evaluate varlen FIRST — `p.i += varlen(...)` reads the old p.i before
            // varlen advances it past the length byte, skidding the parser off-axis
            const slen = varlen(dv, p);
            p.i += slen;
          }
          else { p.i++; }
        }
        pos = end;
      }
      // ticks → seconds via the tempo map
      tempos.sort((a,b) => a.tick - b.tick);
      function toSec(tick){
        let s = 0, lt = 0, u = 500000;
        for (const tm of tempos){
          if (tm.tick >= tick) break;
          s += (tm.tick - lt) * (u / 1e6) / tpq;
          lt = tm.tick; u = tm.uspq;
        }
        return s + (tick - lt) * (u / 1e6) / tpq;
      }
      // pair on/off into sustained notes
      raw.sort((a,b) => a.tick - b.tick || (a.on ? 1 : -1));
      const open = {};
      notes = [];
      for (const e of raw){
        const key = e.ch * 128 + e.n;
        if (e.on){ (open[key] = open[key] || []).push(e); }
        else {
          const o = (open[key] || []).shift();
          if (o) notes.push({ t: toSec(o.tick), d: Math.max(toSec(e.tick) - toSec(o.tick), 0.04), ch: e.ch, n: e.n, v: o.v });
        }
      }
      notes.sort((a,b) => a.t - b.t);
      // trim dead air — some MIDIs sit silent for seconds before the first note
      if (notes.length){
        const lead = notes[0].t;
        if (lead > 0.5){ for (const nt of notes) nt.t -= (lead - 0.3); }
      }
      duration = notes.length ? notes[notes.length-1].t + 2 : 0;
      loaded = notes.length > 60; // a real song, not a parse accident
      return loaded;
    }

    function voice(nt, when){
      const t = when, vel = (nt.v / 127) * 0.85;
      if (nt.ch === 9){ // drums: pitched thump for kicks, noise for the rest
        const g = actx.createGain();
        g.gain.setValueAtTime(vel * 0.5, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
        if (nt.n === 35 || nt.n === 36){
          const o = actx.createOscillator();
          o.type = 'sine';
          o.frequency.setValueAtTime(140, t);
          o.frequency.exponentialRampToValueAtTime(45, t + 0.1);
          o.connect(g); g.connect(master);
          o.start(t); o.stop(t + 0.12);
        } else {
          const bl = actx.createBufferSource();
          bl.buffer = MIDI.noise;
          const f = actx.createBiquadFilter();
          f.type = 'highpass'; f.frequency.value = nt.n >= 42 ? 6000 : 2000;
          bl.connect(f); f.connect(g); g.connect(master);
          bl.start(t); bl.stop(t + 0.08);
        }
        return;
      }
      // polyphony guard — phones deserve music too, just less of it at once
      if (MIDI.voices > 40 && vel < 0.5) return;
      const o = actx.createOscillator();
      o.type = CH_WAVE[nt.ch] || 'square';
      o.frequency.value = 440 * Math.pow(2, (nt.n - 69) / 12);
      const g = actx.createGain();
      const d = Math.min(nt.d, 4);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vel * 0.16, t + 0.008);
      g.gain.exponentialRampToValueAtTime(Math.max(vel * 0.05, 0.001), t + Math.max(d * 0.7, 0.03));
      g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.06);
      o.connect(g); g.connect(master);
      MIDI.voices++;
      o.onended = () => { MIDI.voices--; };
      o.start(t); o.stop(t + d + 0.1);
    }

    function pump(){
      if (!playing) return;
      const now = actx.currentTime;
      const horizon = now + 0.8;
      while (cursor < notes.length && songStart + notes[cursor].t < horizon){
        const nt = notes[cursor++];
        const when = songStart + nt.t;
        if (when > now - 0.05) voice(nt, when);
      }
      if (cursor >= notes.length && now > songStart + duration){ // side A over
        if (MIDI.onEnded){
          playing = false;
          clearInterval(schedTimer);
          MIDI.onEnded();
        } else { // no playlist? loop the tape
          songStart = now + 1.2;
          cursor = 0;
        }
      }
    }

    return {
      noise: null,
      onEnded: null,
      voices: 0,
      load(buf){ return parse(buf); },
      get loaded(){ return loaded; },
      // hard cut: notes are scheduled up to 0.8s ahead, so severing master from
      // the output is the only way to silence in-flight voices instantly.
      // start() rebuilds master via its own guard.
      stop(){
        playing = false;
        clearInterval(schedTimer);
        if (master){ try { master.disconnect(); } catch(e){} master = null; }
        MIDI.voices = 0;
      },
      start(){
        clearInterval(schedTimer);
        actx = actx || new (window.AudioContext || window.webkitAudioContext)();
        if (!master){
          master = actx.createGain();
          master.gain.value = 0.6;
          master.connect(actx.destination);
          const nb = actx.createBuffer(1, actx.sampleRate * 0.1, actx.sampleRate);
          const ch = nb.getChannelData(0);
          for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;
          this.noise = nb;
        }
        actx.resume();
        songStart = actx.currentTime + 0.15;
        cursor = 0;
        playing = true;
        schedTimer = setInterval(pump, 200);
        pump();
      },
      pause(){ playing = false; clearInterval(schedTimer); if (actx) actx.suspend(); },
      resume(){ if (actx){ actx.resume(); playing = true; schedTimer = setInterval(pump, 200); } }
    };
  })();

  // ===== the playlist — shuffled fresh on every visit =====
  const PLAYLIST = [
    { f: 'September.mid',                                          t: 'Earth, Wind & Fire — September' },
    { f: 'Queen - Bohemian Rhapsody.mid',                          t: 'Queen — Bohemian Rhapsody' },
    { f: "Don't-Stop-Me-Now.mid",                                  t: "Queen — Don't Stop Me Now" },
    { f: 'Never-Gonna-Give-You-Up.mid',                            t: 'Rick Astley — Never Gonna Give You Up' },
    { f: 'toto-africa.mid',                                        t: 'Toto — Africa' },
    { f: 'Smells-Like-Teen-Spirit.mid',                            t: 'Nirvana — Smells Like Teen Spirit' },
    { f: 'Careless-Whisper.mid',                                   t: 'George Michael — Careless Whisper' },
    { f: 'Imagine dragons - Radioactive.mid',                      t: 'Imagine Dragons — Radioactive' },
    { f: 'Skrillex - Scary Monsters and nice splities (all parts).mid', t: 'Skrillex — Scary Monsters & Nice Sprites' },
    { f: 'Mii Channel.mid',                                        t: 'Mii Channel' },
    { f: 'Simpsons.mid',                                           t: 'The Simpsons' },
    { f: 'Mortal Kombat - Theme.mid',                              t: 'Mortal Kombat' },
    { f: 'The Elder Scrolls V Skyrim - Dragonborn Theme.mid',      t: 'Skyrim — Dragonborn' }
  ];

  const PLAYER = (function(){
    const box = document.getElementById('winamp');
    const lcd = document.getElementById('waTrack');
    const btnPrev = document.getElementById('waPrev');
    const btnPlay = document.getElementById('waPlay');
    const btnNext = document.getElementById('waNext');
    let order = [], pos = 0, playing = false, everStarted = false, skips = 0;
    const cache = new Map();
    let marqStr = '', crawl = false;

    function shuffle(){
      order = PLAYLIST.map((_, i) => i);
      for (let i = order.length - 1; i > 0; i--){
        const j = (Math.random() * (i + 1)) | 0;
        const tmp = order[i]; order[i] = order[j]; order[j] = tmp;
      }
    }
    function cur(){ return PLAYLIST[order[pos]]; }
    function setLcdRaw(base){
      lcd.textContent = base;
      // crawl only if the title overflows the LCD — short titles sit still,
      // long ones parade. rotating a string that fits just looks broken.
      crawl = lcd.offsetWidth > lcd.parentNode.clientWidth - 17;
      marqStr = crawl ? base + '  ★  ' : base;
    }
    function setLcd(){
      setLcdRaw((pos + 1) + '/' + order.length + '  ' + cur().t);
    }
    // the LCD crawls (when it must), as is right and proper
    setInterval(() => {
      if (!playing || !crawl || !marqStr) return;
      marqStr = marqStr.slice(1) + marqStr[0];
      lcd.textContent = marqStr;
    }, 260);
    // LCD width changes with the viewport — re-judge the crawl
    addEventListener('resize', () => { if (everStarted) setLcd(); });

    function loadAndPlay(){
      const tr = cur();
      const got = cache.has(tr.f)
        ? Promise.resolve(cache.get(tr.f))
        : fetch('misc/' + encodeURIComponent(tr.f))
            .then(r => { if (!r.ok) throw 0; return r.arrayBuffer(); })
            .then(b => { cache.set(tr.f, b); return b; });
      got.then(buf => {
        if (!MIDI.load(buf)) throw 0;
        skips = 0;
        MIDI.start();
        playing = true;
        everStarted = true;
        box.style.display = 'block';
        box.classList.remove('paused');
        setLcd();
      }).catch(() => {
        // unreadable or missing (e.g., file:// preview) — skip, but don't spin forever
        if (++skips < PLAYLIST.length) next();
        else box.style.display = 'none';
      });
    }
    function next(){
      MIDI.stop();
      pos++;
      if (pos >= order.length){ shuffle(); pos = 0; } // reshuffle each full spin
      loadAndPlay();
    }
    function prev(){
      MIDI.stop();
      pos = (pos + order.length - 1) % order.length;
      loadAndPlay();
    }
    function toggle(){
      if (!everStarted) return;
      if (playing){
        MIDI.pause();
        playing = false;
        box.classList.add('paused');
      } else {
        MIDI.resume();
        playing = true;
        box.classList.remove('paused');
      }
    }
    // the dancing baby's b-side — off the shuffle rotation, on demand only.
    // always restarts from the top, cutting whatever's currently playing.
    function playSecret(){
      const key = 'secret/Hooked-On-A-Feeling.mid';
      MIDI.stop();
      const got = cache.has(key)
        ? Promise.resolve(cache.get(key))
        : fetch('misc/secret/' + encodeURIComponent('Hooked-On-A-Feeling.mid'))
            .then(r => { if (!r.ok) throw 0; return r.arrayBuffer(); })
            .then(b => { cache.set(key, b); return b; });
      got.then(buf => {
        if (!MIDI.load(buf)) throw 0;
        MIDI.start();
        playing = true;
        everStarted = true;
        box.style.display = 'block';
        box.classList.remove('paused', 'shade');
        setLcdRaw('SECRET  Blue Swede — Hooked on a Feeling');
      }).catch(() => {});
    }

    MIDI.onEnded = next;
    btnNext.addEventListener('click', next);
    btnPrev.addEventListener('click', prev);
    btnPlay.addEventListener('click', toggle);
    const btnShade = document.getElementById('waShade');
    btnShade.addEventListener('click', () => {
      const shaded = box.classList.toggle('shade');
      btnShade.innerHTML = shaded ? '&#9652;' : '&#9662;';
      btnShade.setAttribute('aria-label', shaded ? 'Expand player' : 'Collapse player');
      if (!shaded && everStarted) setLcd(); // the LCD was hidden — re-measure the crawl
    });
    return {
      start(){ shuffle(); pos = 0; loadAndPlay(); },
      playSecret,
      get isPlaying(){ return playing; },
      pause(){ if (everStarted && playing) toggle(); },
      resume(){ if (everStarted && !playing) toggle(); }
    };
  })();

  // ===== the dancing baby spins its record — a hidden B.J.-Thomas b-side =====
  (function(){
    const baby = document.querySelector('.dancing-baby');
    if (!baby) return;
    baby.style.cursor = 'pointer';
    baby.setAttribute('role', 'button');
    baby.setAttribute('tabindex', '0');
    baby.setAttribute('aria-label', 'Play the dancing baby’s song');
    baby.title = 'ooga-chaka';
    const go = () => { PLAYER.playSecret(); notify('OOGA-CHAKA! OOGA-OOGA...'); };
    baby.addEventListener('click', go);
    baby.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); go(); }
    });
  })();

  function enterSite(){
    if (entered) return;
    entered = true;
    if (titleTimer){ clearInterval(titleTimer); document.title = REAL_TITLE; }
    PLAYER.start(); // the click is the user gesture the audio needs
    splash.classList.add('hidden');
    document.body.style.overflow = '';
    // once faded, drop the splash entirely — it's a full-screen gradient layer
    // plus the splash trail canvas, both pure overhead after entering
    setTimeout(() => { splash.style.display = 'none'; }, 1000);
  }
  splash.addEventListener('click', enterSite);

