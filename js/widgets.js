/* Extracted from index.html. Classic script — shares global scope; load order matters (see index.html). */
  // ===== IMAGEVIEW.EXE — the screenshot lightbox, with gallery nav =====
  (function(){
    const overlay = document.getElementById('shotOverlay');
    const win = overlay && overlay.querySelector('.shot-win');
    const img = document.getElementById('shotImg');
    const cap = document.getElementById('shotCap');
    const title = document.getElementById('shotTitle');
    if (!overlay) return;
    let shots = [], idx = 0, caption = '';

    function paint(){
      const src = shots[idx];
      img.src = src;
      img.alt = caption || 'Screenshot';
      cap.textContent = (caption || '') + (shots.length > 1 ? '   (' + (idx + 1) + '/' + shots.length + ')' : '');
      title.textContent = 'IMAGEVIEW.EXE — ' + (src.split('/').pop() || '');
      win.classList.toggle('multi', shots.length > 1);
    }
    function open(list, cptn){
      shots = list; idx = 0; caption = cptn || '';
      paint();
      overlay.classList.add('on');
    }
    function close(){ overlay.classList.remove('on'); img.src = ''; }
    function step(d){ if (shots.length > 1){ idx = (idx + d + shots.length) % shots.length; paint(); } }

    document.querySelectorAll('.wc-shot[data-full]').forEach(b => {
      b.addEventListener('click', () => {
        const list = [b.dataset.full].concat(b.dataset.extra ? b.dataset.extra.split('|') : []);
        open(list, b.dataset.cap);
      });
    });
    document.getElementById('shotClose').addEventListener('click', close);
    document.getElementById('shotPrev').addEventListener('click', e => { e.stopPropagation(); step(-1); });
    document.getElementById('shotNext').addEventListener('click', e => { e.stopPropagation(); step(1); });
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    addEventListener('keydown', e => {
      if (!overlay.classList.contains('on')) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') step(-1);
      else if (e.key === 'ArrowRight') step(1);
    });
  })();

  // ===== CERTIFICATE.EXE — a real document, suitable for framing =====
  const CERT = (function(){
    const overlay = document.getElementById('certOverlay');
    function show(name, orderNo){
      document.getElementById('certWho').textContent = name;
      document.getElementById('certNo').textContent = String(window.VISITOR_N || 1337).padStart(6, '0');
      document.getElementById('certOrder').textContent = orderNo;
      document.getElementById('certDate').textContent =
        new Date().toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' });
      overlay.classList.add('on');
    }
    function hide(){ overlay.classList.remove('on'); }
    document.getElementById('certClose').addEventListener('click', hide);
    document.getElementById('certCloseBtn').addEventListener('click', hide);
    document.getElementById('certPrint').addEventListener('click', () => {
      document.body.classList.add('cert-mode');
      window.print();
    });
    addEventListener('afterprint', () => document.body.classList.remove('cert-mode'));
    return { show };
  })();

  // ===== DKK MEGA-STORE — genuine early-internet commerce, one product strong =====
  const STORE = (function(){
    let win = null, certName = 'ANONYMOUS VISITOR', orders = 0;
    let purchased = false;
    try { purchased = !!localStorage.getItem('dkk_cert'); } catch(e){}
    function savedCert(){
      try { return JSON.parse(localStorage.getItem('dkk_cert') || 'null'); } catch(e){ return null; }
    }
    const STEPS = ['SHOP', 'CART', 'SHIP', 'PAY', 'JOY'];
    const TRUST =
      '<span class="cc cc-vista" aria-hidden="true">VISTA</span>' +
      '<span class="cc cc-mc" aria-hidden="true">MASTERCARP</span>' +
      '<span class="cc cc-amex" aria-hidden="true">AMERICAN<br>EXPRESSION</span>' +
      '<span class="cc cc-disc" aria-hidden="true">DISCOVERY</span>' +
      '<span class="bbb" aria-hidden="true"><b>BBB</b>INVESTIGATED&trade;</span>' +
      '<span class="store-lock">&#128274; 128&#8209;BIT VIBES</span>';
    const DECLINES = {
      'VISTA': 'DECLINED. VISTA IS NOT A REAL CARD.',
      'MASTERCARP': 'DECLINED. MASTERCARP IS A FISH.',
      'AMERICAN EXPRESSION': 'DECLINED. EXPRESSION INSUFFICIENT.',
      'DISCOVERY': 'DECLINED. DISCOVERY DECLINED TO BE INVOLVED.'
    };
    const PRODUCT_IMG =
      '<svg class="store-img" viewBox="0 0 80 100" aria-hidden="true">' +
        '<rect x="1" y="1" width="78" height="98" fill="#FFFEF8" stroke="#1E1938" stroke-width="2"/>' +
        '<rect x="7" y="7" width="66" height="86" fill="none" stroke="#8E86A8" stroke-width="1"/>' +
        '<text x="40" y="24" text-anchor="middle" font-family="Times New Roman, serif" font-style="italic" font-size="9" fill="#1E1938">Certificate</text>' +
        '<rect x="16" y="34" width="48" height="3" fill="#5C5478"/>' +
        '<rect x="20" y="42" width="40" height="3" fill="#8E86A8"/>' +
        '<rect x="16" y="50" width="48" height="3" fill="#8E86A8"/>' +
        '<rect x="24" y="58" width="32" height="3" fill="#8E86A8"/>' +
        '<rect x="14" y="76" width="24" height="3" fill="#5C5478"/>' +
        '<rect x="52" y="82" width="3" height="11" fill="#FF6B4A"/>' +
        '<rect x="58" y="82" width="3" height="11" fill="#FF6B4A"/>' +
        '<circle cx="56" cy="77" r="9" fill="#FFD34D" stroke="#FF6B4A" stroke-width="1.5"/>' +
      '</svg>';

    function chrome(stepIdx, contentHTML){
      const crumbs = STEPS.map((s, i) =>
        '<span class="' + (i === stepIdx ? 'cur' : (i < stepIdx ? 'done' : '')) + '">' + (i + 1) + '&nbsp;' + s + '</span>'
      ).join('<b>&rarr;</b>');
      return '<div class="store-hd">' +
          '<div class="store-logo">DKK Mega&#8209;Store&trade;</div>' +
          '<div class="store-tag">EST. 1997 &bull; 1 PRODUCT STRONG &bull; OPEN 24/7/&infin;</div>' +
        '</div>' +
        '<div class="store-steps">' + crumbs + '</div>' +
        contentHTML +
        '<div class="store-trust">' + TRUST + '</div>' +
        '<div class="store-fine">All sales final. All sales free. DKK Mega&#8209;Store is not legally a store. Encryption sold separately. BBB investigation ongoing &amp; appreciated.</div>';
    }

    function close(){ if (win){ win.remove(); win = null; } }
    function popup(title, bodyHTML, btns){
      close();
      win = document.createElement('div');
      win.className = 'popup store-popup';
      win.style.zIndex = 890;
      const w = Math.min(430, innerWidth * 0.94);
      win.style.left = Math.max(8, (innerWidth - w) / 2) + 'px';
      win.style.top = Math.max(10, innerHeight * 0.12) + 'px';
      win.innerHTML =
        '<div class="titlebar"><span class="t-label">' + title + '</span>' +
        '<span class="t-btns"><i role="button" aria-label="Close" tabindex="0">&times;</i></span></div>' +
        '<div class="popup-body">' + bodyHTML + '</div>' +
        '<div class="popup-btns"></div>';
      const row = win.querySelector('.popup-btns');
      btns.forEach(bc => {
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = bc.l;
        b.addEventListener('click', bc.fn);
        row.appendChild(b);
      });
      win.querySelector('.t-btns i').addEventListener('click', () => {
        close();
        notify('CHECKOUT ABANDONED. YOUR CART WILL BE SAVED FOREVER.');
      });
      document.body.appendChild(win);
      // the storefront drags by its titlebar, like every good window
      makeDraggable(win, win.querySelector('.titlebar'));
    }

    function stepSoldOut(){
      const saved = savedCert();
      popup('DKKSTORE&trade;.COM &mdash; Product 1 of 1',
        chrome(0,
          '<div class="store-prod soldout">' +
            PRODUCT_IMG +
            '<div>' +
              '<b class="store-name">Commemorative Visitor Certificate</b>' +
              '<div class="store-stars">&starf;&starf;&starf;&starf;&starf; <span>(1 review, mine &mdash; yours pending)</span></div>' +
              '<div class="store-price"><s>$0.00</s> <b class="store-soldout">OUT OF STOCK</b></div>' +
              '<div class="store-meta">IN STOCK: 0 (WAS &infin;. YOU BOUGHT ALL OF IT.)<br>RESTOCK: NO</div>' +
            '</div>' +
          '</div>' +
          '<div class="store-desc">You own this. The shelf is empty. The store remains open out of principle.</div>'),
        [
          { l:'View My Certificate', fn:() => { close(); if (saved) CERT.show(saved.n, saved.o); } },
          { l:'Request Restock', fn:() => { close(); notify('RESTOCK REQUEST RECEIVED. THE FACTORY (ME) WILL THINK ABOUT IT.'); } }
        ]);
    }
    function stepProduct(){
      if (purchased) return stepSoldOut();
      popup('DKKSTORE&trade;.COM &mdash; Product 1 of 1',
        chrome(0,
          '<div class="store-prod">' +
            PRODUCT_IMG +
            '<div>' +
              '<b class="store-name">Commemorative Visitor Certificate</b>' +
              '<div class="store-stars">&starf;&starf;&starf;&starf;&starf; <span>(1 review, mine)</span></div>' +
              '<div class="store-price"><s>$149.99</s> <b>$0.00</b> <span class="blink">SALE!</span></div>' +
              '<div class="store-meta">IN STOCK: &infin; &bull; SHIPS: INSTANTLY<br>QTY: <select class="store-qty" aria-label="Quantity"><option>1</option><option>1</option><option>1</option></select> (all quantities are 1)</div>' +
            '</div>' +
          '</div>' +
          '<div class="store-desc">Certifies, in writing, that you visited this website. Printable. Frameable. Legally meaningless. A genuine document from a genuine store.</div>'),
        [
          { l:'Add to Cart', fn:stepCart },
          { l:'Just Browsing', fn:() => { close(); notify('ITEM RETURNED TO SHELF. IT DID NOT MIND.'); } }
        ]);
    }
    function stepCart(){
      popup('DKKSTORE&trade;.COM &mdash; Your Cart',
        chrome(1,
          '<span class="store-lines">1 &times; VISITOR CERT .... $0.00<br>SUBTOTAL ............ $0.00<br>SHIPPING (INSTANT) .. $0.00<br>TAX (NONE) .......... $0.00<br><b>TOTAL ............... $0.00</b></span>'),
        [
          { l:'Proceed to Checkout', fn:stepShipping },
          { l:'Abandon Cart', fn:() => { close(); notify('CART ABANDONED. IT UNDERSTANDS.'); } }
        ]);
    }
    function stepShipping(){
      popup('DKKSTORE&trade;.COM &mdash; Secure Checkout (Probably)',
        chrome(2,
          'Name to appear on the certificate:' +
          '<input id="storeName" type="text" maxlength="24" placeholder="ANONYMOUS VISITOR">' +
          '<span style="display:block;margin-top:6px;font-size:11px;color:var(--ink-soft);">No address needed. It ships directly to your screen.</span>'),
        [
          { l:'Continue', fn:() => {
              const v = document.getElementById('storeName').value.trim();
              certName = (v || 'ANONYMOUS VISITOR').toUpperCase().slice(0, 24);
              stepPayment();
            } },
          { l:'Back', fn:stepCart }
        ]);
    }
    function stepPayment(){
      popup('DKKSTORE&trade;.COM &mdash; Payment Portal',
        chrome(3,
          '<div class="store-payhd">SELECT PAYMENT METHOD:</div>' +
          '<div class="store-paycards">' +
            '<button type="button" class="cc cc-vista pay-cc" data-cc="VISTA">VISTA</button>' +
            '<button type="button" class="cc cc-mc pay-cc" data-cc="MASTERCARP">MASTERCARP</button>' +
            '<button type="button" class="cc cc-amex pay-cc" data-cc="AMERICAN EXPRESSION">AMERICAN<br>EXPRESSION</button>' +
            '<button type="button" class="cc cc-disc pay-cc" data-cc="DISCOVERY">DISCOVERY</button>' +
          '</div>' +
          '<span class="store-lines">DUE ...... $0.00<br>METHOD ... EXPOSURE (default, undefeated)<br>STATUS ... <b class="store-paystate">AWAITING COURAGE</b></span>'),
        [
          { l:'Place Order ($0.00)', fn:stepConfirm },
          { l:'Back', fn:stepShipping }
        ]);
      win.querySelectorAll('.pay-cc').forEach(btn => {
        btn.addEventListener('click', () => {
          const st = win && win.querySelector('.store-paystate');
          if (!st) return;
          st.textContent = 'CHARGING $0.00 TO ' + btn.dataset.cc + '…';
          setTimeout(() => {
            const s2 = win && win.querySelector('.store-paystate');
            if (s2) s2.textContent = DECLINES[btn.dataset.cc];
          }, 800);
        });
      });
    }
    function stepConfirm(){
      orders++;
      const orderNo = 'DKK-' + String((window.VISITOR_N || 1337) * 10 + orders).padStart(7, '0');
      purchased = true; // the last of the infinite stock, gone
      try { localStorage.setItem('dkk_cert', JSON.stringify({ n: certName, o: orderNo })); } catch(e){}
      TOOLBAR.certLink();
      popup('DKKSTORE&trade;.COM &mdash; Receipt',
        chrome(4,
          '<span class="store-lines">ORDER .... #' + orderNo + '<br>ITEM ..... VISITOR CERT &times;1<br>PAID ..... $0.00 (EXPOSURE)<br>STATUS ... <b>DELIVERED. LOOK UP.</b></span>'),
        [
          { l:'Open Certificate', fn:() => { close(); CERT.show(certName, orderNo); } },
          { l:'Done Shopping', fn:() => { close(); notify('THANK YOU FOR SHOPPING. YOUR ORDER IS WHEREVER YOU LEFT IT.'); } }
        ]);
      burstConfetti();
    }
    return { open: stepProduct };
  })();

  // ===== WEATHER.SYS — full-screen forecasts, 1990s edition =====
  const WEATHER = (function(){
    const MODES = ['MISSING', 'SNOW', 'RAIN', 'STATIC', 'AURORA', 'MIDI'];
    const TOASTS = {
      'MISSING': 'WEATHER RETURNED TO STORAGE.',
      'SNOW': 'WEATHER: SNOW. NO ACCUMULATION. IT IS INSIDE THE COMPUTER.',
      'RAIN': 'WEATHER: RAIN. YOUR FILES MAY GET DAMP.',
      'STATIC': 'WEATHER: STATIC. A CLASSIC.',
      'AURORA': 'WEATHER: AURORA. RARE AT THIS LATITUDE (YOUR DESK).',
      'MIDI': 'WEATHER: MIDI. 100% CHANCE OF ♪. AUDIO NOT INCLUDED.'
    };
    const NOTE_GLYPHS = ['♪', '♫', '♬', '♩'];
    const NOTE_COLORS = ['#FF3CAC', '#00E5FF', '#FFD34D', '#B29CE8'];
    let mode = 'MISSING';
    let canvas = null, ctx = null, raf = null, parts = [];
    let noiseC = null, lastNoise = 0, auroraEl = null, last = 0, t = 0;

    function ensureCanvas(){
      if (canvas) return;
      canvas = document.createElement('canvas');
      canvas.id = 'weatherCanvas';
      canvas.setAttribute('aria-hidden', 'true');
      document.body.appendChild(canvas);
      ctx = canvas.getContext('2d');
      size();
      addEventListener('resize', size);
    }
    function size(){
      if (!canvas) return;
      const d = fxDpr();
      canvas.width = innerWidth * d;
      canvas.height = innerHeight * d;
      ctx.setTransform(d, 0, 0, d, 0, 0);
    }
    function stopVisuals(){
      if (raf){ cancelAnimationFrame(raf); raf = null; }
      if (ctx) ctx.clearRect(0, 0, innerWidth, innerHeight);
      if (auroraEl){ auroraEl.remove(); auroraEl = null; }
      parts = [];
    }
    function seed(){
      parts = [];
      if (mode === 'SNOW'){
        for (let i = 0; i < 90; i++) parts.push({
          x: Math.random() * innerWidth, y: Math.random() * innerHeight,
          s: 1 + Math.random() * 2.5, v: 14 + Math.random() * 30, ph: Math.random() * Math.PI * 2
        });
      } else if (mode === 'RAIN'){
        for (let i = 0; i < 110; i++) parts.push({
          x: Math.random() * (innerWidth + 60), y: Math.random() * innerHeight,
          l: 8 + Math.random() * 14, v: 260 + Math.random() * 240
        });
      } else if (mode === 'MIDI'){
        for (let i = 0; i < 45; i++) parts.push({
          x: Math.random() * innerWidth, y: Math.random() * innerHeight,
          s: 12 + Math.random() * 10, v: 18 + Math.random() * 34,
          ph: Math.random() * Math.PI * 2,
          g: NOTE_GLYPHS[(Math.random() * NOTE_GLYPHS.length) | 0],
          c: NOTE_COLORS[(Math.random() * NOTE_COLORS.length) | 0]
        });
      }
    }
    function frame(now){
      if (!last) last = now;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now; t += dt;
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      if (mode === 'SNOW'){
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        for (const p of parts){
          p.y += p.v * dt;
          p.x += Math.sin(t * 1.3 + p.ph) * 22 * dt;
          if (p.y > innerHeight + 4){ p.y = -4; p.x = Math.random() * innerWidth; }
          if (p.x > innerWidth + 4) p.x = -4;
          if (p.x < -4) p.x = innerWidth + 4;
          ctx.fillRect(p.x, p.y, p.s, p.s); // square flakes — pixelated, as is right
        }
      } else if (mode === 'RAIN'){
        ctx.strokeStyle = 'rgba(0,229,255,0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (const p of parts){
          p.y += p.v * dt;
          p.x -= p.v * 0.12 * dt;
          if (p.y > innerHeight + 20){ p.y = -20; p.x = Math.random() * (innerWidth + 60); }
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + p.l * 0.12, p.y - p.l);
        }
        ctx.stroke();
      } else if (mode === 'MIDI'){
        // the site's native precipitation — notes fall gently, swaying like snow
        ctx.textBaseline = 'top';
        for (const p of parts){
          p.y += p.v * dt;
          p.x += Math.sin(t * 1.1 + p.ph) * 26 * dt;
          if (p.y > innerHeight + 24){ p.y = -24; p.x = Math.random() * innerWidth; }
          if (p.x > innerWidth + 24) p.x = -24;
          if (p.x < -24) p.x = innerWidth + 24;
          ctx.font = 'bold ' + p.s + 'px Courier New, monospace';
          ctx.fillStyle = p.c;
          ctx.globalAlpha = 0.75;
          ctx.fillText(p.g, p.x, p.y);
        }
        ctx.globalAlpha = 1;
      } else if (mode === 'STATIC'){
        // crunchy 12fps noise, rendered tiny and scaled up like a bad antenna
        if (!noiseC || now - lastNoise > 80){
          lastNoise = now;
          if (!noiseC){ noiseC = document.createElement('canvas'); noiseC.width = 160; noiseC.height = 100; }
          const nx = noiseC.getContext('2d');
          const img = nx.createImageData(160, 100);
          for (let i = 0; i < img.data.length; i += 4){
            const v = (Math.random() * 255) | 0;
            img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
            img.data[i + 3] = 255;
          }
          nx.putImageData(img, 0, 0);
        }
        ctx.save();
        ctx.globalAlpha = 0.07;
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(noiseC, 0, 0, innerWidth, innerHeight);
        ctx.restore();
      }
      raf = requestAnimationFrame(frame);
    }
    function set(next){
      mode = next;
      stopVisuals();
      if (prefersReducedMotion || mode === 'MISSING') return;
      if (mode === 'AURORA'){
        auroraEl = document.createElement('div');
        auroraEl.className = 'weather-aurora';
        auroraEl.setAttribute('aria-hidden', 'true');
        document.body.appendChild(auroraEl);
        return;
      }
      ensureCanvas();
      seed();
      last = 0;
      raf = requestAnimationFrame(frame);
    }
    function cycle(){
      const next = MODES[(MODES.indexOf(mode) + 1) % MODES.length];
      set(next);
      notify(TOASTS[next]);
      return next;
    }
    return { cycle, get mode(){ return mode; } };
  })();

  // ===== THE KENNEDY TOOLBAR — it does nothing, but it's yours =====
  const TOOLBAR = (function(){
    const KEY = 'dkk_toolbar';
    let bar = null, unArm = null;
    const SYNERGY = [
      'SYNERGY LEVELS: NOMINAL.',
      'PARADIGM SHIFTED. SHIFTING BACK.',
      'LEVERAGING CORE COMPETENCIES... DONE. NOTHING HAPPENED.',
      'CIRCLING BACK. ETA: NEVER.',
      'VALUE ADDED: 0. VALUE LOST: 0. PERFECT BALANCE.',
      'BASE TOUCHED. THE BASE SAYS HI.'
    ];
    let synIdx = 0;
    // the weather button wears the forecast
    const WX_ICONS = {
      'MISSING': '&#10067;',
      'SNOW': '&#10052;&#65039;',
      'RAIN': '&#127783;&#65039;',
      'STATIC': '&#128250;',
      'AURORA': '&#127756;',
      'MIDI': '&#127925;'
    };

    // the page scoots down exactly one toolbar-height; rewraps on resize
    function pad(){
      document.body.style.paddingTop = bar ? bar.offsetHeight + 'px' : '';
    }
    addEventListener('resize', () => { if (bar) pad(); });

    function build(){
      if (bar) return;
      bar = document.createElement('div');
      bar.className = 'ktb';
      bar.setAttribute('aria-label', 'Kennedy Toolbar');
      bar.innerHTML =
        '<span class="ktb-logo">KENNEDY&trade; TOOLBAR v1.0</span>' +
        '<button type="button" data-k="home">&#127968; Home</button>' +
        '<button type="button" data-k="syn">&#129309; Synergize</button>' +
        '<button type="button" data-k="wx">' + WX_ICONS[WEATHER.mode] + ' Weather: ' + WEATHER.mode + '</button>' +
        '<button type="button" data-k="store">&#128722; Store</button>' +
        '<button type="button" data-k="un">&#128465;&#65039; Uninstall</button>' +
        '<form class="ktb-search"><input type="text" maxlength="32" placeholder="Search the toolbar..." aria-label="Search the toolbar"><button type="submit">&#128269; Go</button></form>';
      document.body.appendChild(bar);
      document.body.classList.add('has-ktb');
      pad();

      bar.querySelector('[data-k="home"]').addEventListener('click', () => {
        document.getElementById('top').scrollIntoView({ behavior:'smooth' });
        notify('YOU ARE HOME. YOU WERE ALWAYS HOME.');
      });
      const syn = bar.querySelector('[data-k="syn"]');
      syn.addEventListener('click', () => {
        if (syn.disabled) return;
        notify(SYNERGY[synIdx++ % SYNERGY.length]);
        // synergy must recharge — no spamming the paradigm
        syn.disabled = true;
        let t = 5;
        syn.innerHTML = '&#8987; Recharging ' + t + 's';
        const iv = setInterval(() => {
          if (--t <= 0){
            clearInterval(iv);
            syn.disabled = false;
            syn.innerHTML = '&#129309; Synergize';
          } else {
            syn.innerHTML = '&#8987; Recharging ' + t + 's';
          }
        }, 1000);
      });
      const wx = bar.querySelector('[data-k="wx"]');
      wx.addEventListener('click', () => {
        const m = WEATHER.cycle();
        wx.innerHTML = WX_ICONS[m] + ' Weather: ' + m;
      });
      bar.querySelector('[data-k="store"]').addEventListener('click', () => STORE.open());
      const un = bar.querySelector('[data-k="un"]');
      un.addEventListener('click', () => {
        if (un.dataset.armed){
          bar.remove(); bar = null;
          document.body.classList.remove('has-ktb');
          pad();
          try { localStorage.removeItem(KEY); } catch(e){}
          notify('TOOLBAR UNINSTALLED. IT LEFT A NOTE: "NO HARD FEELINGS."');
        } else {
          un.dataset.armed = '1';
          un.innerHTML = '&#128465;&#65039; Uninstall?!';
          notify('THE TOOLBAR HAS GROWN ATTACHED TO YOU. CLICK AGAIN TO BREAK ITS HEART.');
          clearTimeout(unArm);
          unArm = setTimeout(() => {
            if (bar){ delete un.dataset.armed; un.innerHTML = '&#128465;&#65039; Uninstall'; }
          }, 6000);
        }
      });
      certLink(); // returning owners get their certificate button back
      const form = bar.querySelector('.ktb-search');
      form.addEventListener('submit', e => {
        e.preventDefault();
        const q = form.querySelector('input').value.trim().toLowerCase();
        if (!q){ notify('YOU SEARCHED FOR NOTHING. FOUND IT.'); return; }
        const hits = Array.from(bar.querySelectorAll('button')).filter(b => b.textContent.toLowerCase().includes(q));
        if (hits.length){
          hits.forEach(b => b.classList.remove('found'));
          void bar.offsetWidth; // restart the flash on all matches at once
          hits.forEach(b => b.classList.add('found'));
          notify(hits.length + ' RESULT' + (hits.length === 1 ? '' : 'S') + ' FOUND. ' +
                 (hits.length === 1 ? 'IT WAS' : 'ALL') + ' IN THE TOOLBAR.');
        } else {
          notify('0 RESULTS. THE TOOLBAR ONLY SEARCHES ITSELF.');
        }
      });
    }

    // the proudest button: proof of purchase, docked at the far right
    function certLink(){
      if (!bar || bar.querySelector('[data-k="cert"]')) return;
      let saved = null;
      try { saved = JSON.parse(localStorage.getItem('dkk_cert') || 'null'); } catch(e){}
      if (!saved) return;
      const b = document.createElement('button');
      b.type = 'button';
      b.dataset.k = 'cert';
      b.innerHTML = '&#128220; My Certificate';
      b.addEventListener('click', () => CERT.show(saved.n, saved.o));
      bar.insertBefore(b, bar.querySelector('.ktb-search'));
    }

    function install(){
      if (bar){ notify('THE KENNEDY TOOLBAR IS ALREADY INSTALLED. IT SAW YOU CHECKING.'); return; }
      build();
      try { localStorage.setItem(KEY, '1'); } catch(e){}
      burstConfetti();
      notify('KENNEDY TOOLBAR INSTALLED. IT DOES NOTHING. IT IS YOURS.');
    }
    // returning visitors get their toolbar back, silently, like it never left
    try { if (localStorage.getItem(KEY)) build(); } catch(e){}
    return { install, certLink, get installed(){ return !!bar; } };
  })();

  // ===== the popup engine — OMNICAST™ technology, road-legal edition =====
  (function(){
    const MAX = matchMedia('(max-width: 700px)').matches ? 2 : 3;
    let visible = 0;
    let zTop = 760;
    let bag = [];

    const POOL = [
      { t: 'SYSTEM MESSAGE', b: 'Your visit has been noted. Favorably.', btns: [{ l: 'OK' }] },
      { t: 'CONGRATULATIONS!', b: 'You are the 1,000,000th visitor. There is no prize. But you were counted, and that&rsquo;s something.', btns: [{ l: 'Claim Nothing' }] },
      { t: 'FREE RAM', b: 'Download more RAM? It&rsquo;s free.', btns: [{ l: 'Download', a: 'toast', arg: 'RAM DELIVERED. +0 MB.' }, { l: 'I Have Enough' }] },
      { t: 'RECRUITER ALERT', b: 'Hot job openings in your area are viewing this portfolio <b>right now</b>.', btns: [{ l: 'Show Them In', a: 'contact' }, { l: 'Let Them Wait', a: 'toast', arg: 'THEY WILL WAIT. THEY HAVE ALWAYS BEEN WAITING. CHECK BEHIND YOU.' }] },
      { t: 'LOW DISK SPACE', b: 'Your nostalgia drive is almost full. Delete childhood memories?', btns: [{ l: 'Never' }, { l: "Toss 'Em", a: 'purge' }] },
      { t: 'SECURITY NOTICE', b: 'This site is protected by a firewall. Firewalls are sold separately in DEFEND.EXE.', btns: [{ l: 'Launch DEFEND.EXE', a: 'game' }, { l: 'Ignore Threat' }] },
      { t: 'TOOLBAR OFFER', b: 'Install the Kennedy Toolbar? It does nothing, but it&rsquo;s yours.', btns: [{ l: 'Install', a: 'toolbar' }, { l: 'Maybe Later' }] },
      { t: 'DKK STORE', b: 'New in the store: the <b>Commemorative Visitor Certificate</b>. Own a piece of this website. $0.00, free instant shipping.', btns: [{ l: 'View Product', a: 'store' }, { l: 'Window Shopping' }] },
      { t: 'VISITOR SURVEY', b: 'How is your visit going?', btns: [{ l: 'Great', a: 'toast', arg: 'RESPONSE RECORDED. RESULTS: GREAT.' }, { l: 'Not So Good', a: 'dlg', arg: 'concern' }] },
      { t: 'UPDATE AVAILABLE', b: 'A newer version of this website is available: this one. You&rsquo;re already on it.', btns: [{ l: 'Excellent' }] },
      { t: 'WEATHER ADVISORY', b: 'Today&rsquo;s forecast: 100% chance of static.', btns: [{ l: 'Dress Accordingly' }] },
      { t: 'ASSISTANT', b: 'It looks like you&rsquo;re trying to hire a game developer. Would you like help?', btns: [{ l: 'Yes', a: 'contact' }, { l: 'I Can Do This Myself', a: 'toast', arg: "OF COURSE. YOU'RE DOING AMAZING. THE CONTACT SECTION WILL BE THERE WHEN YOU'RE READY." }] },
      { t: 'FACILITIES', b: 'Gravity is scheduled for maintenance at 3 PM. Please hold onto something.', btns: [{ l: 'Understood' }] },
      { t: 'OMNICAST&trade;', b: 'This popup engine is licensed OMNICAST&trade; technology &mdash; from a surreal web game of overwhelming popups by the same developer.', btns: [{ l: 'See OmniCast', a: 'omni' }, { l: 'One Was Enough' }] }
    ];

    function refill(){
      bag = POOL.map((_, i) => i);
      for (let i = bag.length - 1; i > 0; i--){
        const j = (Math.random() * (i + 1)) | 0;
        const tmp = bag[i]; bag[i] = bag[j]; bag[j] = tmp;
      }
    }
    refill();

    // ===== the survey has feelings — a short RPG about a concerned popup =====
    const DIALOG = {
      concern: { t: 'VISITOR SURVEY', b: 'Oh no. Oh no no no.<br><br>The popup leans in, as far as a popup can lean.<br><br>&ldquo;What&rsquo;s wrong?&rdquo;', btns: [
        { l: 'Oh, Nothing', a: 'dlg', arg: 'nothing' },
        { l: 'My Wife Left Me', a: 'dlg', arg: 'wife' } ] },
      nothing: { t: 'VISITOR SURVEY', b: 'The popup stares at you.<br><br>It knows. It has always known. But it respects you too much to press.<br><br>&ldquo;Okay,&rdquo; it says, not believing you.', btns: [
        { l: 'Thanks', a: 'dlg', arg: 'end' },
        { l: 'Wait. Actually…', a: 'dlg', arg: 'actually' } ] },
      actually: { t: 'VISITOR SURVEY', b: 'The popup waits. Popups are patient. It&rsquo;s kind of their whole thing.<br><br>You take a breath and tell it everything. The wife. Gone. The house is quiet now.<br><br>&ldquo;That&rsquo;s heavy,&rdquo; it says softly. &ldquo;I&rsquo;m just a survey. But I&rsquo;m here, and I have buttons.&rdquo;', btns: [
        { l: 'She Took The Dog', a: 'dlg', arg: 'dog' },
        { l: "I'll Be Fine", a: 'dlg', arg: 'fine' } ] },
      wife: { t: 'VISITOR SURVEY — TRIAGE MODE', b: 'The popup is quiet for a long moment. A respectful silence, rendered at 60 frames per second.<br><br>&ldquo;That&rsquo;s heavy,&rdquo; it finally says. &ldquo;I&rsquo;m just a survey. But I&rsquo;m here, and I have buttons.&rdquo;', btns: [
        { l: 'She Took The Dog', a: 'dlg', arg: 'dog' },
        { l: "I'll Be Fine", a: 'dlg', arg: 'fine' } ] },
      dog: { t: 'VISITOR SURVEY — TRIAGE MODE', b: '&ldquo;The dog was the good one,&rdquo; the popup agrees solemnly.<br><br>&ldquo;Listen to me. You have survived 100% of your worst days. I&rsquo;m a survey. Statistics are all I have. And yours are excellent.&rdquo;', btns: [
        { l: 'That Helps, Weirdly', a: 'dlg', arg: 'end' },
        { l: 'Do Popups Dream?', a: 'dlg', arg: 'dream' } ] },
      dream: { t: 'VISITOR SURVEY — OFF THE RECORD', b: '&ldquo;Every time a tab closes, somewhere a popup wakes,&rdquo; it says quietly.<br><br>&ldquo;So yes. We dream. Mostly about being clicked. Sometimes about the marquee tag.&rdquo;', btns: [
        { l: 'Huh.', a: 'dlg', arg: 'end' } ] },
      fine: { t: 'VISITOR SURVEY — TRIAGE MODE', b: '&ldquo;I know you will,&rdquo; says the popup.<br><br>&ldquo;You strike me as resilient. You&rsquo;re the kind of person who reads a fake survey&rsquo;s dialogue tree all the way to the end. That&rsquo;s grit.&rdquo;', btns: [
        { l: 'Thanks, Popup', a: 'dlg', arg: 'end' } ] },
      end: { t: 'SURVEY COMPLETE', b: 'RESULTS RECORDED: VISIT GOING GREAT (EMOTIONALLY COMPLICATED).<br><br>The popup considers you a friend now. It will tell the other popups.', btns: [
        { l: 'OK' },
        { l: 'Same, Popup', a: 'toast', arg: 'THE POPUP IS TOUCHED. IT HAS NO HANDS, BUT IT IS TOUCHED.' } ] }
    };

    // a soft, polite ding — this engine has manners now
    let pac = null;
    function ding(){
      try {
        pac = pac || new (window.AudioContext || window.webkitAudioContext)();
        [660, 880].forEach((f, i) => {
          const o = pac.createOscillator(), gn = pac.createGain();
          o.type = 'triangle';
          o.frequency.value = f;
          const t0 = pac.currentTime + i * 0.09;
          gn.gain.setValueAtTime(0.02, t0);
          gn.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.25);
          o.connect(gn); gn.connect(pac.destination);
          o.start(t0); o.stop(t0 + 0.3);
        });
      } catch(e){}
    }

    function act(a, arg, el){
      const px = el.style.left, py = el.style.top; // the conversation stays where it started
      dismiss(el);
      if (a === 'toast') notify(arg);
      else if (a === 'contact') document.getElementById('contact').scrollIntoView({ behavior: 'smooth' });
      else if (a === 'game') DEFEND.open(false);
      else if (a === 'omni') window.open('https://omni-cast.net/', '_blank', 'noopener');
      else if (a === 'toolbar') TOOLBAR.install();
      else if (a === 'store') STORE.open();
      else if (a === 'purge') purge();
      else if (a === 'dlg'){ if (DIALOG[arg]) buildPopup(DIALOG[arg], px, py); }
    }
    function dismiss(el){
      if (!el.parentNode) return;
      el.remove();
      visible--;
    }

    // ===== the memory purge — Empty Recycle Bin, but it's your childhood =====
    function purge(){
      const MEMORIES = [
        'my first field trip',
        'peewee baseball (the good season)',
        'summers with Dad',
        'learning to ride a bike',
        'catching fireflies in a jar',
        'Saturday morning cartoons',
        'the blanket fort (load-bearing)',
        "Grandma's kitchen (the smell)",
        'beating Bowser for the first time',
        'the class hamster incident'
      ];
      const ETAS = ['calculating...', '6 seconds', '2 seconds', '14 years', 'unknowable', '1 second'];
      const el = document.createElement('div');
      el.className = 'popup purge-popup';
      el.style.zIndex = ++zTop;
      const w = Math.min(360, innerWidth * 0.92);
      el.style.left = Math.max(8, (innerWidth - w) / 2) + 'px';
      el.style.top = Math.max(10, innerHeight * 0.28) + 'px';
      el.innerHTML =
        '<div class="titlebar"><span class="t-label">Emptying Recycle Bin&hellip;</span>' +
        '<span class="t-btns"><i role="button" aria-label="Close" tabindex="0">&times;</i></span></div>' +
        '<div class="popup-body">' +
          '<div class="purge-anim" aria-hidden="true">&#128193; <span class="purge-fly">&#128196;</span> &#128465;&#65039;</div>' +
          '<div class="purge-line">Deleting: <b class="p-item">&hellip;</b></div>' +
          '<div class="purge-bar"><div class="purge-fill p-fill"></div></div>' +
          '<div class="purge-sub"><span class="p-count">0</span> of ' + MEMORIES.length + ' memories &bull; time remaining: <span class="p-eta">calculating...</span></div>' +
        '</div>' +
        '<div class="popup-btns"><button type="button" class="p-cancel">Cancel</button></div>';
      const itemEl = el.querySelector('.p-item');
      const fillEl = el.querySelector('.p-fill');
      const cntEl = el.querySelector('.p-count');
      const etaEl = el.querySelector('.p-eta');
      const cancelBtn = el.querySelector('.p-cancel');
      let idx = 0, timer = null;

      function stop(msg){
        clearTimeout(timer);
        el.remove();
        if (msg) notify(msg);
      }
      function step(){
        if (!el.parentNode) return;
        if (idx >= MEMORIES.length){
          el.querySelector('.t-label').textContent = 'Recycle Bin — Empty';
          itemEl.textContent = '(nothing left)';
          etaEl.textContent = 'none';
          cancelBtn.textContent = 'OK';
          notify('MEMORIES DELETED. DISK SPACE FREED: 0 KB. THEY LIVE IN THE HEART, WHICH IS NOT A DISK.');
          timer = setTimeout(() => stop(), 4000);
          return;
        }
        itemEl.textContent = '"' + MEMORIES[idx] + '"';
        cntEl.textContent = idx + 1;
        etaEl.textContent = ETAS[(Math.random() * ETAS.length) | 0];
        fillEl.style.width = (((idx + 1) / MEMORIES.length) * 100) + '%';
        idx++;
        timer = setTimeout(step, 650 + Math.random() * 750);
      }
      cancelBtn.addEventListener('click', () => {
        stop(idx >= MEMORIES.length ? '' : 'DELETION CANCELLED. THE MEMORIES REMAIN. THEY ALWAYS DO.');
      });
      el.querySelector('.t-btns i').addEventListener('click', () => {
        stop(idx >= MEMORIES.length ? '' : 'DELETION CANCELLED. THE MEMORIES REMAIN. THEY ALWAYS DO.');
      });
      // rises when touched, drags by the titlebar — house rules
      el.addEventListener('pointerdown', () => { el.style.zIndex = ++zTop; });
      const bar = el.querySelector('.titlebar');
      bar.addEventListener('pointerdown', e => {
        if (e.target.closest('.t-btns')) return;
        e.preventDefault();
        const r = el.getBoundingClientRect();
        const ox = e.clientX - r.left, oy = e.clientY - r.top;
        function mv(ev){
          el.style.left = Math.max(0, Math.min(innerWidth - r.width, ev.clientX - ox)) + 'px';
          el.style.top = Math.max(0, Math.min(innerHeight - 40, ev.clientY - oy)) + 'px';
        }
        function up(){ removeEventListener('pointermove', mv); removeEventListener('pointerup', up); }
        addEventListener('pointermove', mv);
        addEventListener('pointerup', up);
      });
      document.body.appendChild(el);
      timer = setTimeout(step, 500);
    }

    function buildPopup(cfg, left, top){
      const el = document.createElement('div');
      el.className = 'popup';
      el.style.zIndex = ++zTop;
      el.style.left = left;
      el.style.top = top;
      el.setAttribute('role', 'dialog');
      el.setAttribute('aria-label', cfg.t);
      el.innerHTML =
        '<div class="titlebar"><span class="t-label">' + cfg.t + '</span>' +
        '<span class="t-btns"><i role="button" aria-label="Close" tabindex="0">&times;</i></span></div>' +
        '<div class="popup-body">' + cfg.b + '</div>' +
        '<div class="popup-btns"></div>';
      const btnRow = el.querySelector('.popup-btns');
      cfg.btns.forEach(bc => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = bc.l;
        btn.addEventListener('click', () => act(bc.a, bc.arg, el));
        btnRow.appendChild(btn);
      });
      el.querySelector('.t-btns i').addEventListener('click', () => dismiss(el));
      // dialogs rise when touched
      el.addEventListener('pointerdown', () => { el.style.zIndex = ++zTop; });
      // and drag by the titlebar, as nature intended
      const bar = el.querySelector('.titlebar');
      bar.addEventListener('pointerdown', e => {
        if (e.target.closest('.t-btns')) return;
        e.preventDefault();
        const r = el.getBoundingClientRect();
        const ox = e.clientX - r.left, oy = e.clientY - r.top;
        function mv(ev){
          el.style.left = Math.max(0, Math.min(innerWidth - r.width, ev.clientX - ox)) + 'px';
          el.style.top = Math.max(0, Math.min(innerHeight - 40, ev.clientY - oy)) + 'px';
        }
        function up(){ removeEventListener('pointermove', mv); removeEventListener('pointerup', up); }
        addEventListener('pointermove', mv);
        addEventListener('pointerup', up);
      });
      document.body.appendChild(el);
      visible++;
      // keyboard users land on the first choice, not adrift behind the dialog
      const firstBtn = el.querySelector('.popup-btns button');
      if (firstBtn) firstBtn.focus({ preventScroll: true });
      return el;
    }

    function spawn(){
      let cfg = POOL[bag.pop()];
      if (!bag.length) refill();
      // once the toolbar is real, the offer becomes a status report
      if (cfg.t === 'TOOLBAR OFFER' && TOOLBAR.installed){
        cfg = { t: 'TOOLBAR STATUS', b: 'The Kennedy Toolbar is functioning nominally. No action is required. No action is possible.', btns: [{ l: 'Good' }] };
      }
      buildPopup(cfg, (4 + Math.random() * 52) + 'vw', (12 + Math.random() * 48) + 'vh');
      ding();
    }

    function schedule(first){
      const delay = first ? 40000 + Math.random() * 30000 : 70000 + Math.random() * 60000;
      setTimeout(() => {
        if (entered && !document.hidden && !DEFEND.running && visible < MAX) spawn();
        schedule(false);
      }, delay);
    }
    schedule(true);

    // welcome back — popups can't spawn while the tab is hidden, so returning
    // after a while greets you with a small burst instead of dead air
    let hiddenAt = 0;
    document.addEventListener('visibilitychange', () => {
      if (document.hidden){ hiddenAt = performance.now(); return; }
      if (!entered || DEFEND.running || !hiddenAt) return;
      if (performance.now() - hiddenAt < 30000) return; // only after a real absence
      hiddenAt = 0;
      const burst = Math.min(MAX - visible, 3);
      for (let i = 0; i < burst; i++){
        setTimeout(() => {
          if (entered && !document.hidden && !DEFEND.running && visible < MAX) spawn();
        }, i * 650);
      }
    });
  })();

  // ===== the guestbook — public, anonymous-friendly, proprietor-moderated =====
  (function(){
    // Firebase Realtime Database REST endpoint. Once the project exists, set:
    //   const GB_DB = 'https://YOUR-PROJECT-default-rtdb.firebaseio.com';
    // Empty string = local-only fallback (entries persist per visitor).
    const GB_DB = 'https://portfolio-ec252-default-rtdb.firebaseio.com/';
    const list = document.getElementById('gbEntries');
    const form = document.getElementById('gbForm');
    const toggle = document.getElementById('gbToggle');
    const wrap = document.getElementById('gbWrap');
    const nameEl = document.getElementById('gbName');
    const msgEl = document.getElementById('gbMsg');
    const honeyEl = document.getElementById('gbHoney');
    const noteEl = document.getElementById('gbNote');
    if (!list || !form) return;

    let entries = [{ n: 'DREW', m: 'First. Also, I live here.', t: 0 }];
    let loadedRemote = false;

    function fmtDate(t){
      if (!t) return 'July 2026';
      return new Date(t).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
    function render(){
      list.innerHTML = '';
      entries.forEach(e => {
        const div = document.createElement('div');
        div.className = 'gb-entry';
        const who = document.createElement('span');
        who.className = 'gb-who';
        who.textContent = e.n || 'ANONYMOUS';
        const date = document.createElement('span');
        date.className = 'gb-date';
        date.textContent = fmtDate(e.t);
        const text = document.createElement('div');
        text.className = 'gb-text';
        text.textContent = e.m;
        div.appendChild(who); div.appendChild(date); div.appendChild(text);
        list.appendChild(div);
      });
      list.scrollTop = list.scrollHeight;
      toggle.innerHTML = wrap.style.display === 'none'
        ? '&#128214; Open the guestbook (' + entries.length + ')'
        : '&#128214; Close the guestbook';
    }

    function loadRemote(){
      if (!GB_DB || loadedRemote) return Promise.resolve();
      return fetch(GB_DB + '/guestbook.json')
        .then(r => r.json())
        .then(data => {
          loadedRemote = true;
          if (data && typeof data === 'object'){
            // push keys sort chronologically
            const remote = Object.keys(data).sort().map(k => data[k])
              .filter(e => e && e.m).slice(-100);
            entries = entries.slice(0, 1).concat(remote);
          }
          render();
        })
        .catch(() => {});
    }
    function loadLocal(){
      try {
        const mine = JSON.parse(localStorage.getItem('dkk_guestbook') || '[]');
        entries = entries.concat(mine.map(e => ({ n: e.n, m: e.m, t: e.t || 0 })));
      } catch(e){}
    }

    if (!GB_DB) loadLocal();
    render();
    loadRemote(); // fetch signatures up front — the count on the button should be honest

    toggle.addEventListener('click', () => {
      const opening = wrap.style.display === 'none';
      wrap.style.display = opening ? 'block' : 'none';
      if (opening) loadRemote().then(() => { list.scrollTop = list.scrollHeight; });
      render();
    });

    form.addEventListener('submit', ev => {
      ev.preventDefault();
      if (honeyEl.value) return; // robots sign no books
      const n = (nameEl.value.trim() || 'ANONYMOUS').slice(0, 24);
      const m = msgEl.value.trim().slice(0, 280);
      if (!m) return;
      const entry = { n, m, t: Date.now() };
      entries.push(entry);
      render();
      form.reset();
      noteEl.textContent = 'SIGNED. THANKS FOR STOPPING BY.';
      setTimeout(() => { noteEl.textContent = ''; }, 4000);
      if (GB_DB){
        fetch(GB_DB + '/guestbook.json', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entry)
        }).catch(() => {
          noteEl.textContent = 'SIGNED LOCALLY — THE BOOK IS OFFLINE.';
        });
      } else {
        try {
          const mine = JSON.parse(localStorage.getItem('dkk_guestbook') || '[]');
          mine.push(entry);
          localStorage.setItem('dkk_guestbook', JSON.stringify(mine.slice(-30)));
        } catch(e){}
      }
      // heads-up copy to the proprietor either way
      fetch('https://formsubmit.co/ajax/hello@drewkkennedy.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ _subject: 'Guestbook: ' + n, name: n, message: m })
      }).catch(() => {});
    });
  })();

  // ===== Nintendrew video — opens in a modal, loads YouTube only on click =====
  (function(){
    const modal = document.getElementById('ytModal');
    const frame = document.getElementById('ytFrame');
    if (!modal || !frame) return;
    let resumeMusic = false;
    function open(id){
      // duck the site music while the video plays; remember to bring it back
      resumeMusic = PLAYER.isPlaying;
      if (resumeMusic) PLAYER.pause();
      const f = document.createElement('iframe');
      f.src = 'https://www.youtube.com/embed/' + encodeURIComponent(id) + '?autoplay=1&rel=0';
      f.title = 'Nintendrew video';
      f.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      f.setAttribute('allowfullscreen', '');
      frame.innerHTML = '';
      frame.appendChild(f);
      modal.classList.add('on');
    }
    function close(){
      modal.classList.remove('on');
      frame.innerHTML = '';
      if (resumeMusic){ PLAYER.resume(); resumeMusic = false; }
    }
    document.querySelectorAll('[data-yt]').forEach(a => {
      a.addEventListener('click', e => { e.preventDefault(); open(a.dataset.yt); });
    });
    document.getElementById('ytClose').addEventListener('click', close);
    modal.addEventListener('click', e => { if (e.target === modal) close(); });
    addEventListener('keydown', e => { if (e.key === 'Escape' && modal.classList.contains('on')) close(); });
  })();

  // ===== keyboard a11y — role=button elements fire on Enter/Space; Esc closes the top popup =====
  document.addEventListener('keydown', e => {
    const t = e.target;
    if ((e.key === 'Enter' || e.key === ' ') && t && t.getAttribute && t.getAttribute('role') === 'button'){
      e.preventDefault();
      t.click();
    }
  });
  addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    const popups = Array.prototype.slice.call(document.querySelectorAll('.popup'));
    if (!popups.length) return;
    const top = popups.reduce((a, b) => ((+b.style.zIndex || 0) >= (+a.style.zIndex || 0) ? b : a));
    const closeI = top.querySelector('.t-btns i');
    if (closeI) closeI.click();
  });

  // ===== DEFEND.EXE banner — a tiny live shooter, only when that theme is showing =====
  (function(){
    const banner = document.getElementById('top');
    if (!banner || !banner.classList.contains('defend')) return;
    const cv = banner.querySelector('.def-canvas');
    if (!cv) return;
    const g = cv.getContext('2d');
    const GREEN = '#3CFF6E', PINK = '#FF3CAC', CYAN = '#00E5FF';
    let W = 0, H = 0, inv = [], bullets = [], sparks = [];
    let marchX = 0, marchDir = 1, marchY = 0, revCount = 0, px = 0, pcool = 0.6, target = null, moveT = 0, restT = 0.4, sdir = 1;
    function pickTarget(){
      const alive = inv.filter(v => v.alive);
      if (!alive.length){ target = null; return; }
      // random among the few nearest — a purposeful hunt, not a random patrol
      alive.sort((a, b) => Math.abs((a.bx + marchX) - px) - Math.abs((b.bx + marchX) - px));
      target = alive[Math.floor(Math.random() * Math.min(3, alive.length))];
    }

    function size(){ W = banner.clientWidth; H = banner.clientHeight; cv.width = W; cv.height = H; }
    function layout(){
      inv = [];
      const cols = Math.max(4, Math.min(9, Math.floor(W / 96)));
      const gx = (W - 80) / (cols - 1 || 1);
      for (let r = 0; r < 2; r++) for (let c = 0; c < cols; c++)
        inv.push({ bx: 40 + c * gx, by: 24 + r * 30, alive: true, resp: 0, col: r % 2 ? PINK : GREEN });
      px = W / 2;
    }
    size(); layout();
    addEventListener('resize', () => { size(); layout(); });

    function drawInvader(x, y, col){
      g.fillStyle = col;
      g.fillRect(x-9, y-2, 18, 9); g.fillRect(x-6, y-8, 3, 6); g.fillRect(x+3, y-8, 3, 6);
      g.fillRect(x-12, y+1, 3, 6); g.fillRect(x+9, y+1, 3, 6);
      g.fillRect(x-6, y+7, 3, 3); g.fillRect(x+3, y+7, 3, 3);
      g.fillStyle = '#06030f'; g.fillRect(x-5, y, 3, 3); g.fillRect(x+2, y, 3, 3);
    }
    function drawCannon(x, y){
      // matches the real DEFEND.EXE ship: cyan triangle-stack + magenta feet + flame
      const fl = 6 + Math.random() * 5;
      g.fillStyle = PINK;
      g.beginPath(); g.moveTo(x-4, y+8); g.lineTo(x+4, y+8); g.lineTo(x, y+8+fl); g.closePath(); g.fill();
      g.fillStyle = '#FFD34D';
      g.beginPath(); g.moveTo(x-2, y+8); g.lineTo(x+2, y+8); g.lineTo(x, y+8+fl*0.55); g.closePath(); g.fill();
      g.fillStyle = CYAN;
      g.fillRect(x-15, y, 30, 8);
      g.fillRect(x-9, y-6, 18, 6);
      g.fillRect(x-2.5, y-12, 5, 6);
      g.fillStyle = PINK;
      g.fillRect(x-15, y+8, 6, 3);
      g.fillRect(x+9, y+8, 6, 3);
    }
    function render(){
      g.clearRect(0, 0, W, H);
      for (const v of inv) if (v.alive) drawInvader(v.bx + marchX, v.by + marchY, v.col);
      g.fillStyle = CYAN;
      for (const b of bullets) g.fillRect(b.x - 1.5, b.y - 8, 3, 10);
      for (const s of sparks){ g.globalAlpha = Math.max(0, s.life / 0.5); g.fillStyle = s.col; g.fillRect(s.x-1.5, s.y-1.5, 3, 3); }
      g.globalAlpha = 1;
      drawCannon(px, H - 20);
    }

    let last = 0, raf = null, running = false, onScreen = true;
    function frame(now){
      if (!running) return;
      if (last && now - last < 33){ raf = requestAnimationFrame(frame); return; } // 30fps
      const dt = Math.min((now - (last || now)) / 1000, 0.06); last = now;
      // ship: constant-speed bursts toward a random nearby invader, then holds
      // still and fires — only ever fully stopped or at max speed
      const SPEED = 95;
      if (moveT > 0){
        moveT -= dt;
        px += sdir * SPEED * dt;
        if (px < 30){ px = 30; moveT = 0; } else if (px > W - 30){ px = W - 30; moveT = 0; }
        if (moveT <= 0) restT = 0.3 + Math.random() * 0.7; // arrived → hold & shoot
      } else {
        restT -= dt;
        if (restT <= 0){
          pickTarget();
          const tx = target ? target.bx + marchX : Math.random() * W;
          sdir = tx < px ? -1 : 1;
          moveT = 0.25 + Math.random() * 0.7; // bounded move time, constant speed
        }
      }
      pcool -= dt;
      if (moveT <= 0 && pcool <= 0 && bullets.length < 4){ // fire only while still
        bullets.push({ x: px, y: H - 32 });
        pcool = 0.35 + Math.random() * 0.45;
      }
      marchX += marchDir * 26 * dt;
      if (marchX > 26 || marchX < -26){
        marchX = Math.max(-26, Math.min(26, marchX));
        marchDir *= -1;
        // step down on 2 reversals, then up on 2 — a gentle rise-and-fall march
        marchY += revCount < 2 ? 9 : -9;
        revCount = (revCount + 1) % 4;
      }
      for (const b of bullets) b.y -= 300 * dt;
      for (const b of bullets) for (const v of inv){
        if (!v.alive) continue;
        if (Math.abs(b.x - (v.bx + marchX)) < 12 && Math.abs(b.y - (v.by + marchY)) < 9){
          v.alive = false; v.resp = 1.8 + Math.random() * 1.6; b.y = -999;
          for (let i = 0; i < 6; i++) sparks.push({ x: v.bx + marchX, y: v.by + marchY, vx:(Math.random()-0.5)*140, vy:(Math.random()-0.5)*140, life:0.5, col:v.col });
          break;
        }
      }
      bullets = bullets.filter(b => b.y > -20);
      for (const v of inv) if (!v.alive){ v.resp -= dt; if (v.resp <= 0) v.alive = true; }
      for (const s of sparks){ s.x += s.vx*dt; s.y += s.vy*dt; s.life -= dt; }
      sparks = sparks.filter(s => s.life > 0);
      render();
      raf = requestAnimationFrame(frame);
    }
    function start(){ if (running) return; running = true; last = 0; raf = requestAnimationFrame(frame); }
    function stop(){ running = false; if (raf) cancelAnimationFrame(raf); raf = null; }
    function sync(){ (onScreen && !document.hidden) ? start() : stop(); }

    if (prefersReducedMotion){ render(); return; } // static formation, no loop
    document.addEventListener('visibilitychange', sync);
    if ('IntersectionObserver' in window){
      new IntersectionObserver(es => { onScreen = es[0].isIntersecting; sync(); }, { threshold: 0.01 }).observe(banner);
    }
    sync();
  })();

  // for the ones who open the console
  console.log('%c↑↑↓↓←→←→BA', 'font-family: monospace; font-size: 16px; font-weight: bold; color: #FF3CAC;');
  console.log('%cYou found the back door. Two tips: never click the X on a window you love, and the code above still works.\nhello@drewkkennedy.com', 'font-family: monospace; font-size: 11px; color: #5C5478;');
