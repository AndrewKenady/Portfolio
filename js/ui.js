  // drag any element by a handle (decks, dialogs, mini windows)
  let floatZ = 840;
  function makeDraggable(el, handle, opts){
    opts = opts || {};
    handle.addEventListener('pointerdown', e => {
      if (e.target.closest('.t-btns, button, a, input, select, textarea')) return;
      if (opts.enabled && !opts.enabled()) return;
      e.preventDefault();
      const r = el.getBoundingClientRect();
      const w = r.width, h = r.height;
      el.style.position = 'fixed';
      el.style.margin = '0';
      el.style.right = 'auto';
      el.style.bottom = 'auto';
      el.style.left = r.left + 'px';
      el.style.top = r.top + 'px';
      if (opts.raise){ floatZ = floatZ >= 884 ? 841 : floatZ + 1; el.style.zIndex = floatZ; }
      const ox = e.clientX - r.left, oy = e.clientY - r.top;
      try { handle.setPointerCapture(e.pointerId); } catch(_){}
      function mv(ev){
        el.style.left = Math.max(4 - w * 0.6, Math.min(innerWidth - w * 0.4, ev.clientX - ox)) + 'px';
        el.style.top = Math.max(0, Math.min(innerHeight - 24, ev.clientY - oy)) + 'px';
      }
      function up(){ handle.removeEventListener('pointermove', mv); handle.removeEventListener('pointerup', up); }
      handle.addEventListener('pointermove', mv);
      handle.addEventListener('pointerup', up);
    });
  }

  // window controls: minimize, mini preview, close
  let miniCascade = { x: 40, y: 96 };
  const MINI_EASE = 'cubic-bezier(0.22,0.75,0.3,1)';
  const MINI_MS = 340;
  const MINI_W = 320;   // mini tile width
  const MINI_BODY_H = 230; // scaled body preview height

  function clearMiniInline(win){
    win.style.position = win.style.left = win.style.top = win.style.right = win.style.bottom =
      win.style.width = win.style.height = win.style.zIndex = win.style.margin =
      win.style.transition = '';
    const body = win.querySelector('.win-body');
    if (body){ body.style.width = body.style.transform = body.style.transition = ''; }
  }

  // titlebar height stays fixed; only the body scales while the window's
  // width/height animate and clip it, so the top edge stays anchored
  function toggleMini(win){
    const goingMini = !win.classList.contains('mini');
    const first = win.getBoundingClientRect();
    const body = win.querySelector('.win-body');
    const tb = win.querySelector('.titlebar');

    if (goingMini){
      // current in-flow height (titlebar only if minimized)
      const footprintH = win.offsetHeight;
      const cs = getComputedStyle(win);
      const mt = cs.marginTop, mb = cs.marginBottom;
      const ph = document.createElement('div');
      ph.className = 'mini-ph';
      ph.style.height = footprintH + 'px';
      ph.style.marginTop = mt;
      ph.style.marginBottom = mb;
      win.parentNode.insertBefore(ph, win);
      win._ph = ph; win._mt = mt; win._mb = mb;

      // mini and min are exclusive: un-minimize first so the body shows and we
      // measure true full geometry (else height is titlebar-only and body is zero)
      win.classList.remove('min');
      win.classList.add('mini');
      win.style.right = 'auto'; win.style.bottom = 'auto';
      const fullW = first.width;
      win.style.width = fullW + 'px';              // lock full width
      const fullH = win.offsetHeight;              // full height with body shown
      const k = MINI_W / fullW;                    // body scale factor
      const bodyW = body.offsetWidth;
      const scaledBodyH = Math.round(body.offsetHeight * k);
      const visBodyH = Math.min(MINI_BODY_H, scaledBodyH);
      const endH = tb.offsetHeight + visBodyH;     // full titlebar + clipped body
      // fade only when the body is taller than the tile
      win.classList.toggle('clipped', scaledBodyH > MINI_BODY_H + 1);
      win._fullW = fullW; win._fullH = fullH; win._bodyW = bodyW; win._k = k; win._endH = endH;

      const cx = miniCascade.x, cy = miniCascade.y;
      miniCascade.x += 30; miniCascade.y += 30;
      if (miniCascade.y > innerHeight - 200){ miniCascade = { x: 40, y: 96 }; }

      body.style.width = bodyW + 'px';             // lock to stop reflow
      body.style.transformOrigin = 'top left';
      floatZ = floatZ >= 884 ? 841 : floatZ + 1; win.style.zIndex = floatZ;

      // start frame: current spot, full width, current footprint height
      win.style.transition = body.style.transition = 'none';
      win.style.left = first.left + 'px'; win.style.top = first.top + 'px';
      win.style.height = footprintH + 'px';
      body.style.transform = 'none';

      if (prefersReducedMotion){
        win.style.left = cx + 'px'; win.style.top = cy + 'px';
        win.style.width = MINI_W + 'px'; win.style.height = endH + 'px';
        body.style.transform = 'scale(' + k + ')';
        ph.remove(); win._ph = null; return;
      }
      void win.offsetWidth;
      const T = MINI_MS + 'ms ' + MINI_EASE;
      win.style.transition = 'left ' + T + ', top ' + T + ', width ' + T + ', height ' + T;
      body.style.transition = 'transform ' + T;
      win.style.left = cx + 'px'; win.style.top = cy + 'px';
      win.style.width = MINI_W + 'px'; win.style.height = endH + 'px';
      body.style.transform = 'scale(' + k + ')';
      requestAnimationFrame(() => {
        ph.style.transition = 'height ' + T + ', margin ' + T;
        ph.style.height = '0px'; ph.style.marginTop = '0px'; ph.style.marginBottom = '0px';
      });
      win.addEventListener('transitionend', function done(e){
        if (e.propertyName !== 'width') return;
        win.style.transition = body.style.transition = '';
        win.removeEventListener('transitionend', done);
      });
    } else {
      const ph = win._ph;
      if (prefersReducedMotion || !ph){
        if (ph){ ph.remove(); win._ph = null; }
        win.classList.remove('mini', 'clipped');
        clearMiniInline(win);
        return;
      }
      const phRect = ph.getBoundingClientRect();
      // placeholder top margin is collapsed to 0; add it back for the true resting top
      const homeLeft = phRect.left, homeTop = phRect.top + parseFloat(win._mt || 0);
      // reopen the space, sliding the page back down
      const T = MINI_MS + 'ms ' + MINI_EASE;
      ph.style.transition = 'height ' + T + ', margin ' + T;
      ph.style.height = win._fullH + 'px';
      ph.style.marginTop = win._mt; ph.style.marginBottom = win._mb;
      // grow back to full at home; body un-scales
      win.style.transition = body.style.transition = 'none';
      void win.offsetWidth;
      win.style.transition = 'left ' + T + ', top ' + T + ', width ' + T + ', height ' + T;
      body.style.transition = 'transform ' + T;
      win.style.left = homeLeft + 'px'; win.style.top = homeTop + 'px';
      win.style.width = win._fullW + 'px'; win.style.height = win._fullH + 'px';
      body.style.transform = 'none';
      win.addEventListener('transitionend', function done(e){
        if (e.propertyName !== 'width') return;
        win.removeEventListener('transitionend', done);
        win.classList.remove('mini', 'clipped');
        clearMiniInline(win);
        ph.remove(); win._ph = null;
      });
    }
  }
  document.querySelectorAll('.window .titlebar .t-btns').forEach(btns => {
    const win = btns.closest('.window');
    const [minB, maxB, closeB] = btns.querySelectorAll('i');
    if (minB) minB.addEventListener('click', () => win.classList.toggle('min'));
    if (maxB) maxB.addEventListener('click', () => {
      // mini preview needs a precise pointer; on touch/narrow screens shake instead
      if (matchMedia('(max-width:760px)').matches || matchMedia('(pointer:coarse)').matches){
        win.classList.remove('shake');
        void win.offsetWidth; // restart the animation
        win.classList.add('shake');
      } else {
        toggleMini(win);
      }
    });
    if (closeB) closeB.addEventListener('click', () => {
      notify('GADZOOKS! THE SITE IS FIGHTING BACK!');
      DEFEND.open(false);
    });
    // once mini, drag the whole window by its titlebar
    makeDraggable(win, win.querySelector('.titlebar'), { enabled: () => win.classList.contains('mini'), raise: true });
  });

  // drag the deck by its top strip (desktop only)
  (function(){
    const deck = document.getElementById('winamp');
    const grip = deck && deck.querySelector('.wa-top');
    if (deck && grip) makeDraggable(deck, grip, { enabled: () => !matchMedia('(max-width:700px)').matches, raise: true });
  })();

  // status bar: show a link's target on hover
  const statusBar = document.getElementById('statusBar');
  if (window.matchMedia('(hover:hover)').matches){
    document.querySelectorAll('a[href]').forEach(a => {
      a.addEventListener('mouseenter', () => {
        statusBar.textContent = a.href.startsWith('mailto:') ? a.href : '→ ' + a.href;
        statusBar.style.display = 'block';
      });
      a.addEventListener('mouseleave', () => { statusBar.style.display = 'none'; });
    });
  }

