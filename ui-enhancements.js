/* ═══════════════════════════════════════════════════════════════
   ui-enhancements.js  v3
   Newark Parcel Intelligence — Advanced UI Layer
   Fixes: filters, zoning dropdown, reset, sliders, theme switcher,
          AI report formatting, login, command palette, transitions
════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ───────────────────────────────────────────────────────────
     HELPERS
  ─────────────────────────────────────────────────────────── */
  function el(id) { return document.getElementById(id); }
  function qs(sel) { return document.querySelector(sel); }
  function qsa(sel) { return [...document.querySelectorAll(sel)]; }

  function animateCounter(element, targetText) {
    const num = parseFloat(String(targetText).replace(/[^0-9.]/g, ''));
    if (isNaN(num) || num === 0) { element.textContent = targetText; return; }
    const prefix = String(targetText).match(/^[^0-9]*/)?.[0] || '';
    const suffix = String(targetText).match(/[^0-9.]*$/)?.[0] || '';
    const steps = 24; const duration = 500;
    let step = 0;
    const iv = setInterval(() => {
      step++;
      const ease = 1 - Math.pow(1 - step / steps, 3);
      const cur = num * ease;
      let d;
      if (suffix.includes('B')) d = `${prefix}${cur.toFixed(1)}${suffix}`;
      else if (suffix.includes('M')) d = `${prefix}${cur.toFixed(1)}${suffix}`;
      else if (suffix.includes('K')) d = `${prefix}${Math.round(cur)}${suffix}`;
      else d = `${prefix}${Math.round(cur).toLocaleString()}${suffix}`;
      element.textContent = d;
      if (step >= steps) { clearInterval(iv); element.textContent = targetText; }
    }, duration / steps);
  }

  /* ───────────────────────────────────────────────────────────
     THEMES
  ─────────────────────────────────────────────────────────── */
  const THEMES = {
    'dark-indigo': {
      label: 'Dark Indigo',
      '--bg': '#080c14', '--bg-2': '#0c1220', '--bg-3': '#111827',
      '--surface': '#131d2e', '--surface-2': '#192236', '--surface-3': '#1e2a40',
      '--border': 'rgba(99,102,241,0.12)', '--border-2': 'rgba(99,102,241,0.22)',
      '--text': '#f1f5f9', '--text-2': '#cbd5e1', '--muted': '#94a3b8', '--soft': '#64748b',
      '--indigo': '#6366f1', '--indigo-2': '#818cf8', '--indigo-glow': 'rgba(99,102,241,0.35)',
      '--violet': '#8b5cf6', '--emerald': '#10b981', '--crimson': '#f43f5e', '--amber': '#f59e0b',
    },
    'dark-teal': {
      label: 'Dark Teal',
      '--bg': '#060e10', '--bg-2': '#091418', '--bg-3': '#0f1e22',
      '--surface': '#112028', '--surface-2': '#162830', '--surface-3': '#1a303a',
      '--border': 'rgba(20,184,166,0.14)', '--border-2': 'rgba(20,184,166,0.28)',
      '--text': '#f0fdfa', '--text-2': '#ccfbf1', '--muted': '#99f6e4', '--soft': '#5eead4',
      '--indigo': '#14b8a6', '--indigo-2': '#2dd4bf', '--indigo-glow': 'rgba(20,184,166,0.3)',
      '--violet': '#0ea5e9', '--emerald': '#10b981', '--crimson': '#f43f5e', '--amber': '#f59e0b',
    },
    'dark-crimson': {
      label: 'Dark Crimson',
      '--bg': '#0f0608', '--bg-2': '#160a0d', '--bg-3': '#1e1014',
      '--surface': '#221318', '--surface-2': '#2a1820', '--surface-3': '#321e28',
      '--border': 'rgba(244,63,94,0.14)', '--border-2': 'rgba(244,63,94,0.25)',
      '--text': '#fff1f2', '--text-2': '#fecdd3', '--muted': '#fda4af', '--soft': '#fb7185',
      '--indigo': '#f43f5e', '--indigo-2': '#fb7185', '--indigo-glow': 'rgba(244,63,94,0.3)',
      '--violet': '#e879f9', '--emerald': '#10b981', '--crimson': '#f43f5e', '--amber': '#f59e0b',
    },
    'dark-amber': {
      label: 'Dark Amber',
      '--bg': '#0c0a04', '--bg-2': '#141006', '--bg-3': '#1c1608',
      '--surface': '#211a0a', '--surface-2': '#2a2210', '--surface-3': '#332a16',
      '--border': 'rgba(245,158,11,0.14)', '--border-2': 'rgba(245,158,11,0.26)',
      '--text': '#fffbeb', '--text-2': '#fef3c7', '--muted': '#fde68a', '--soft': '#fbbf24',
      '--indigo': '#f59e0b', '--indigo-2': '#fbbf24', '--indigo-glow': 'rgba(245,158,11,0.3)',
      '--violet': '#f97316', '--emerald': '#10b981', '--crimson': '#f43f5e', '--amber': '#f59e0b',
    },
    'light': {
      label: 'Light Mode',
      '--bg': '#f8fafc', '--bg-2': '#f1f5f9', '--bg-3': '#e2e8f0',
      '--surface': '#ffffff', '--surface-2': '#f8fafc', '--surface-3': '#f1f5f9',
      '--border': 'rgba(99,102,241,0.12)', '--border-2': 'rgba(99,102,241,0.22)',
      '--text': '#0f172a', '--text-2': '#1e293b', '--muted': '#475569', '--soft': '#94a3b8',
      '--indigo': '#6366f1', '--indigo-2': '#4f46e5', '--indigo-glow': 'rgba(99,102,241,0.25)',
      '--violet': '#7c3aed', '--emerald': '#059669', '--crimson': '#e11d48', '--amber': '#d97706',
    },
  };

  let currentTheme = localStorage.getItem('npi-theme') || 'dark-indigo';

  function applyTheme(name) {
    const theme = THEMES[name];
    if (!theme) return;
    currentTheme = name;
    localStorage.setItem('npi-theme', name);
    const root = document.documentElement;
    Object.entries(theme).forEach(([k, v]) => {
      if (k.startsWith('--')) root.style.setProperty(k, v);
    });
    // update theme buttons
    qsa('.theme-btn').forEach(b => b.classList.toggle('active', b.dataset.theme === name));
  }

  function injectThemeSwitcher() {
    const btn = document.createElement('button');
    btn.id = 'themeSwitcherBtn';
    btn.className = 'btn-ghost';
    btn.title = 'Switch UI theme';
    btn.innerHTML = `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg> Theme`;

    // panel
    const panel = document.createElement('div');
    panel.id = 'themeSwitcherPanel';
    panel.style.cssText = `
      position:fixed;top:64px;right:16px;z-index:8500;
      background:var(--surface);border:1px solid var(--border-2);
      border-radius:18px;padding:16px;width:260px;
      box-shadow:0 20px 60px rgba(0,0,0,0.5),0 0 40px var(--indigo-glow);
      display:none;
    `;
    panel.innerHTML = `
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:var(--soft);margin-bottom:12px;display:flex;align-items:center;gap:8px;">
        <svg viewBox="0 0 24 24" style="width:13px;height:13px"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>
        UI Theme
      </div>
      <div style="display:flex;flex-direction:column;gap:6px;">
        ${Object.entries(THEMES).map(([key, t]) => `
          <button class="theme-btn" data-theme="${key}" style="
            display:flex;align-items:center;gap:10px;padding:9px 12px;
            border-radius:10px;border:1px solid var(--border-2);
            background:var(--surface-2);color:var(--text-2);
            font-size:12px;font-weight:500;font-family:inherit;
            cursor:pointer;text-align:left;transition:all 0.15s;
            width:100%;
          ">
            <span style="width:12px;height:12px;border-radius:50%;flex-shrink:0;background:${t['--indigo']};box-shadow:0 0 8px ${t['--indigo-glow'] || t['--indigo']}"></span>
            ${t.label}
          </button>
        `).join('')}
      </div>
    `;

    document.body.appendChild(panel);

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    });
    document.addEventListener('click', (e) => {
      if (!panel.contains(e.target) && e.target !== btn) panel.style.display = 'none';
    });
    panel.querySelectorAll('.theme-btn').forEach(b => {
      b.addEventListener('click', () => {
        applyTheme(b.dataset.theme);
        panel.style.display = 'none';
      });
      b.addEventListener('mouseenter', () => { b.style.borderColor = 'var(--indigo)'; b.style.color = 'var(--text)'; });
      b.addEventListener('mouseleave', () => { b.style.borderColor = ''; b.style.color = ''; });
    });

    // Insert before Export CSV button
    const exportBtn = el('exportCsv');
    if (exportBtn) exportBtn.parentNode.insertBefore(btn, exportBtn);

    applyTheme(currentTheme);
  }

  /* ───────────────────────────────────────────────────────────
     LOGIN PARTICLES
  ─────────────────────────────────────────────────────────── */
  function initParticles() {
    const canvas = el('loginParticles');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W = canvas.width = window.innerWidth;
    let H = canvas.height = window.innerHeight;
    const pts = Array.from({ length: 55 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      r: Math.random() * 1.4 + 0.3,
      vx: (Math.random() - 0.5) * 0.28,
      vy: (Math.random() - 0.5) * 0.28,
      a: Math.random() * 0.5 + 0.1,
    }));
    function draw() {
      ctx.clearRect(0, 0, W, H);
      pts.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(99,102,241,${p.a})`; ctx.fill();
      });
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 110) {
            ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y);
            ctx.strokeStyle = `rgba(99,102,241,${0.07 * (1 - d / 110)})`; ctx.lineWidth = 0.5; ctx.stroke();
          }
        }
      }
      requestAnimationFrame(draw);
    }
    draw();
    window.addEventListener('resize', () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; });
  }

  /* ───────────────────────────────────────────────────────────
     LOGIN
  ─────────────────────────────────────────────────────────── */
  function initLogin() {
    initParticles();
    const pwInput = el('loginPassword');
    const pwToggle = el('pwToggle');
    const loginBtn = el('enterDashboard');
    const loginError = el('loginError');
    const loginScreen = el('loginScreen');
    const appEl = el('app');

    pwToggle?.addEventListener('click', () => {
      pwInput.type = pwInput.type === 'password' ? 'text' : 'password';
    });
    pwInput?.addEventListener('keydown', e => { if (e.key === 'Enter') loginBtn?.click(); });

    loginBtn?.addEventListener('click', () => {
      const pwd = (pwInput?.value || '').trim().toLowerCase();
      if (pwd !== 'newark') {
        loginError.textContent = 'Incorrect password. Hint: the city name.';
        loginBtn.classList.add('invalid');
        setTimeout(() => loginBtn.classList.remove('invalid'), 400);
        return;
      }
      loginError.textContent = '';
      loginBtn.querySelector('span').textContent = 'Entering Dashboard…';
      loginBtn.disabled = true;
      setTimeout(() => {
        loginScreen.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        loginScreen.style.opacity = '0'; loginScreen.style.transform = 'scale(1.02)';
        setTimeout(() => {
          loginScreen.classList.add('gone');
          appEl.classList.add('visible');
        }, 500);
      }, 600);
    });
  }

  /* ───────────────────────────────────────────────────────────
     COMMAND PALETTE — full rewrite that properly delegates to app.js
  ─────────────────────────────────────────────────────────── */
  function initCommandPalette() {
    const overlay = el('cmdOverlay');
    const backdrop = el('cmdBackdrop');
    const openBtn = el('cmdPaletteToggle');
    const closeBtn = el('cmdClose');
    const applyBtn = el('cmdApply');
    const cmdSearch = el('cmdSearch');
    const searchInput = el('searchInput'); // hidden input app.js listens to
    let isOpen = false;

    function open() {
      if (isOpen) return;
      isOpen = true;
      overlay.classList.remove('gone');
      setTimeout(() => cmdSearch?.focus(), 80);
    }
    function close() {
      if (!isOpen) return;
      isOpen = false;
      overlay.classList.add('gone');
    }

    openBtn?.addEventListener('click', open);
    closeBtn?.addEventListener('click', close);
    backdrop?.addEventListener('click', close);
    applyBtn?.addEventListener('click', close);
    document.addEventListener('keydown', e => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); isOpen ? close() : open(); }
      if (e.key === 'Escape' && isOpen) close();
    });

    // ── Search: sync cmdSearch → hidden #searchInput → app.js ──
    cmdSearch?.addEventListener('input', () => {
      if (searchInput) {
        searchInput.value = cmdSearch.value;
        searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });

    // ── Filter pills: delegate click to make app.js handle state ──
    // app.js already wired [data-filter] buttons via querySelectorAll
    // Our cmd pills have data-filter so app.js DID wire them — but we
    // need to ensure the .on class syncs visually after each click
    qsa('[data-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        const group = btn.dataset.filter;
        qsa(`[data-filter="${group}"]`).forEach(b => {
          b.classList.toggle('on', b === btn);
        });
      });
    });

    // ── Reset: call app.js resetDashboardFilters then sync UI ──
    el('resetFilters')?.addEventListener('click', () => {
      // Reset visual state of cmd pills
      qsa('[data-filter="status"]').forEach(b => b.classList.toggle('on', b.dataset.value === 'All'));
      qsa('[data-filter="ownership"]').forEach(b => b.classList.toggle('on', b.dataset.value === 'All'));
      // Reset search
      if (cmdSearch) cmdSearch.value = '';
      if (searchInput) { searchInput.value = ''; searchInput.dispatchEvent(new Event('input', { bubbles: true })); }
      // Reset range labels
      if (el('scoreRangeLabel')) el('scoreRangeLabel').textContent = '0 – 100';
      if (el('landRangeLabel')) el('landRangeLabel').textContent = 'All';
      if (el('improvementRangeLabel')) el('improvementRangeLabel').textContent = 'All';
      // Reset geo/zoning labels
      if (el('geoMenuLabel')) el('geoMenuLabel').textContent = 'All Areas';
      if (el('zoningMenuLabel')) el('zoningMenuLabel').textContent = 'All Zoning';
      // Uncheck all multi-menu checkboxes
      qsa('.multi-menu input[type="checkbox"]').forEach(cb => {
        cb.checked = cb.value === '__all__';
      });
    });

    // ── Zoning/Geo dropdowns: fix positioning & z-index conflict ──
    // app.js toggleMenu uses position:fixed but the cmd-overlay is z-index:8000
    // We need to move the menus to body level when opened
    function fixMenuPositioning(menuId, btnId) {
      const btn = el(btnId);
      const menu = el(menuId);
      if (!btn || !menu) return;

      btn.addEventListener('click', (e) => {
        e.stopPropagation(); // prevent backdrop close

        // Move menu to body if needed
        if (menu.parentElement !== document.body) {
          document.body.appendChild(menu);
          menu.style.cssText = `
            position:fixed;z-index:99000;width:280px;max-height:320px;
            overflow-y:auto;padding:8px;
            background:var(--surface);border:1px solid var(--border-2);
            border-radius:16px;box-shadow:0 24px 60px rgba(0,0,0,0.6);
          `;
        }

        const isHidden = menu.classList.contains('gone');
        // close all menus first
        qsa('#geoMenu,#zoningMenu').forEach(m => m.classList.add('gone'));

        if (isHidden) {
          const rect = btn.getBoundingClientRect();
          menu.style.left = `${Math.max(8, Math.min(window.innerWidth - 290, rect.left))}px`;
          menu.style.top = `${rect.bottom + 6}px`;
          menu.classList.remove('gone');
        }
      });
    }

    fixMenuPositioning('geoMenu', 'geoMenuButton');
    fixMenuPositioning('zoningMenu', 'zoningMenuButton');

    // Close menus when clicking outside (but not closing the cmd palette)
    document.addEventListener('click', (e) => {
      const geoMenu = el('geoMenu');
      const zonMenu = el('zoningMenu');
      if (geoMenu && !e.target.closest('#geoMenuButton') && !e.target.closest('#geoMenu')) geoMenu.classList.add('gone');
      if (zonMenu && !e.target.closest('#zoningMenuButton') && !e.target.closest('#zoningMenu')) zonMenu.classList.add('gone');
    });

    // ── Slider live labels ──
    ['scoreMin','scoreMax','landMin','landMax','improvementMin','improvementMax'].forEach(id => {
      el(id)?.addEventListener('input', updateSliderLabels);
    });

    function updateSliderLabels() {
      const sMin = el('scoreMin')?.value || 0;
      const sMax = el('scoreMax')?.value || 100;
      if (el('scoreRangeLabel')) el('scoreRangeLabel').textContent = `${sMin} – ${sMax}`;

      const lMin = el('landMin')?.value || 0;
      const lMax = el('landMax')?.value || 0;
      if (el('landRangeLabel')) el('landRangeLabel').textContent =
        (lMin == 0 && lMax == el('landMax')?.max) ? 'All' : `$${Number(lMin).toLocaleString()} – $${Number(lMax).toLocaleString()}`;

      const iMin = el('improvementMin')?.value || 0;
      const iMax = el('improvementMax')?.value || 0;
      if (el('improvementRangeLabel')) el('improvementRangeLabel').textContent =
        (iMin == 0 && iMax == el('improvementMax')?.max) ? 'All' : `$${Number(iMin).toLocaleString()} – $${Number(iMax).toLocaleString()}`;
    }

    // result count sync
    const obs = new MutationObserver(() => {
      const cnt = el('cmdResultCount');
      const src = el('mapTabCount');
      if (cnt && src) cnt.textContent = src.textContent || '—';
    });
    const tabCount = el('mapTabCount');
    if (tabCount) obs.observe(tabCount, { childList: true, characterData: true, subtree: true });
  }

  /* ───────────────────────────────────────────────────────────
     AI PANEL
  ─────────────────────────────────────────────────────────── */
  function initAiPanel() {
    const fab = el('aiLauncher');
    const panel = el('aiPanel');
    const closeBtn = el('closeAi');
    const form = el('aiForm');
    const input = el('aiInput');
    const messages = el('aiMessages');
    let isOpen = false;
    let isDragging = false;

    function openPanel() { isOpen = true; panel.classList.remove('gone'); input?.focus(); }
    function closePanel() { isOpen = false; panel.classList.add('gone'); }

    fab?.addEventListener('click', () => { if (!isDragging) isOpen ? closePanel() : openPanel(); });
    closeBtn?.addEventListener('click', closePanel);

    // Draggable
    if (fab) {
      let sX, sY, fX, fY, moved = false;
      fab.addEventListener('mousedown', e => {
        sX = e.clientX; sY = e.clientY;
        const r = fab.getBoundingClientRect(); fX = r.left; fY = r.top;
        moved = false; isDragging = false;
        fab.classList.add('dragging');
        function onMove(e2) {
          const dx = e2.clientX - sX, dy = e2.clientY - sY;
          if (Math.abs(dx) > 4 || Math.abs(dy) > 4) { moved = true; isDragging = true; }
          if (isDragging) {
            fab.style.left = `${Math.max(0, Math.min(window.innerWidth - 80, fX + dx))}px`;
            fab.style.top = `${Math.max(0, Math.min(window.innerHeight - 80, fY + dy))}px`;
            fab.style.right = 'auto';
          }
        }
        function onUp() {
          fab.classList.remove('dragging');
          setTimeout(() => { isDragging = false; }, 80);
          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('mouseup', onUp);
        }
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
      });
    }

    // Dock buttons
    qsa('[data-ai-dock]').forEach(btn => {
      btn.addEventListener('click', () => {
        const p = {
          'top-left':    { top:'100px', left:'20px', right:'auto', bottom:'auto' },
          'top-right':   { top:'100px', right:'20px', left:'auto', bottom:'auto' },
          'mid-left':    { top:'50%', left:'20px', right:'auto', bottom:'auto' },
          'mid-right':   { top:'50%', right:'20px', left:'auto', bottom:'auto' },
          'bottom-left': { bottom:'80px', left:'20px', right:'auto', top:'auto' },
          'bottom-right':{ bottom:'80px', right:'20px', left:'auto', top:'auto' },
        }[btn.dataset.aiDock];
        if (p) { Object.assign(fab.style, p); Object.assign(panel.style, { top: p.top ? `calc(${p.top} + 68px)` : '', right: p.right||'', bottom: p.bottom ? `calc(${p.bottom} + 68px)` : '', left: p.left||'' }); }
      });
    });

    // Suggestions
    el('aiSuggestions')?.addEventListener('click', e => {
      const btn = e.target.closest('[data-prompt]');
      if (btn) { if (input) input.value = btn.dataset.prompt; form?.dispatchEvent(new Event('submit')); }
    });

    // ── Enhanced message renderer ──
    function escHtml(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c])); }

    function formatBotMsg(text) {
      let h = escHtml(text);
      // bold **text**
      h = h.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
      // highlight numbers
      h = h.replace(/\b(\d{1,3}(?:,\d{3})*(?:\.\d+)?(?:\s*(?:parcels?|acres?|%|sq\s*ft))?)\b/g, '<em>$1</em>');
      // line breaks
      h = h.replace(/\n/g, '<br>');
      return `<p>${h}</p>`;
    }

    function addMsg(role, content) {
      const isBot = role === 'bot';
      const div = document.createElement('div');
      div.className = `ai-msg ${isBot ? 'ai-msg--bot' : 'ai-msg--user'}`;
      if (isBot) {
        div.innerHTML = `<div class="ai-msg-avatar"><svg viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"/></svg></div><div class="ai-msg-bubble">${formatBotMsg(content)}</div>`;
      } else {
        div.innerHTML = `<div class="ai-msg-bubble">${escHtml(content)}</div>`;
      }
      messages?.appendChild(div);
      if (messages) messages.scrollTop = messages.scrollHeight;
      return div;
    }

    function addTyping() {
      const div = document.createElement('div');
      div.className = 'ai-msg ai-msg--bot ai-msg--typing';
      div.innerHTML = `<div class="ai-msg-avatar"><svg viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"/></svg></div><div class="ai-msg-bubble"><div class="typing-dots"><span></span><span></span><span></span></div></div>`;
      messages?.appendChild(div);
      if (messages) messages.scrollTop = messages.scrollHeight;
      return div;
    }

    // Override window.addAiMessage used by app.js
    window.addAiMessage = function(role, content) {
      return addMsg(role, content);
    };

    // Intercept form submit — show typing then let app.js handle
    form?.addEventListener('submit', e => {
      // If app.js is re-triggering via bypass flag, let it through
      if (window.__bypassAiIntercept) return;

      e.preventDefault();
      e.stopPropagation();
      const text = input?.value?.trim();
      if (!text) return;
      if (input) input.value = '';

      addMsg('user', text);
      const typing = addTyping();

      setTimeout(() => {
        typing.remove();
        if (typeof window.__appAiSubmit === 'function') {
          window.__appAiSubmit(text);
        } else {
          addMsg('bot', 'Please ensure the parcel data has fully loaded before querying.');
        }
      }, 600 + Math.random() * 400);
    });
  }

  /* ───────────────────────────────────────────────────────────
     TAB TRANSITIONS
  ─────────────────────────────────────────────────────────── */
  function initTabTransitions() {
    // app.js already handles tab switching via [data-tab]
    // We add smooth animation on top
    qsa('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.dataset.tab;
        qsa('.view').forEach(v => {
          const isTarget = v.id === `view-${target}`;
          if (isTarget && v.classList.contains('gone')) {
            v.classList.remove('gone');
            v.style.opacity = '0'; v.style.transform = 'translateY(6px)';
            requestAnimationFrame(() => {
              v.style.transition = 'opacity 0.28s ease, transform 0.28s ease';
              v.style.opacity = '1'; v.style.transform = 'translateY(0)';
            });
          }
        });
      });
    });
  }

  /* ───────────────────────────────────────────────────────────
     COUNTER ANIMATIONS
  ─────────────────────────────────────────────────────────── */
  function initCounters() {
    const ids = ['kVacant','kValue','kLandValue','kImprovedValue','mParcels','mVacant','mScore','sidebarCount','cParcels','cVacantOnly','cUnderOnly','cOpportunity','cValue'];
    const obs = new MutationObserver(muts => {
      muts.forEach(m => {
        const el = m.target;
        const text = el.textContent.trim();
        if (text && text !== '—' && !el.dataset.anim) {
          el.dataset.anim = '1';
          animateCounter(el, text);
          setTimeout(() => delete el.dataset.anim, 700);
        }
      });
    });
    ids.forEach(id => {
      const e = document.getElementById(id);
      if (e) obs.observe(e, { childList: true, characterData: true, subtree: true });
    });
  }

  /* ───────────────────────────────────────────────────────────
     STATUS BAR SYNC
  ─────────────────────────────────────────────────────────── */
  function initStatusSync() {
    const top = el('statusText'), bot = el('statusTextBottom');
    if (!top || !bot) return;
    new MutationObserver(() => { bot.textContent = top.textContent; })
      .observe(top, { childList: true, characterData: true, subtree: true });
    bot.textContent = top.textContent;
  }

  /* ───────────────────────────────────────────────────────────
     RIPPLE EFFECT
  ─────────────────────────────────────────────────────────── */
  function initRipples() {
    if (!document.getElementById('ripple-kf')) {
      const s = document.createElement('style');
      s.id = 'ripple-kf';
      s.textContent = `@keyframes ripple-anim { to { transform:scale(2.8); opacity:0; } }`;
      document.head.appendChild(s);
    }
    document.addEventListener('click', e => {
      const btn = e.target.closest('.btn-primary,.login-btn,.sel-btn,.cmd-apply');
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const rpl = document.createElement('span');
      rpl.style.cssText = `position:absolute;width:${size}px;height:${size}px;border-radius:50%;background:rgba(255,255,255,0.22);transform:scale(0);left:${e.clientX-rect.left-size/2}px;top:${e.clientY-rect.top-size/2}px;animation:ripple-anim 0.55s ease-out;pointer-events:none;`;
      btn.style.position = 'relative'; btn.style.overflow = 'hidden';
      btn.appendChild(rpl); setTimeout(() => rpl.remove(), 600);
    });
  }

  /* ───────────────────────────────────────────────────────────
     PATCH CHART.JS DEFAULTS FOR DARK THEME
  ─────────────────────────────────────────────────────────── */
  function patchCharts() {
    if (!window.Chart) return;
    Chart.defaults.color = '#64748b';
    Chart.defaults.borderColor = 'rgba(99,102,241,0.1)';
    Chart.defaults.font.family = '"DM Sans",ui-sans-serif,system-ui,sans-serif';
    Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(19,29,46,0.97)';
    Chart.defaults.plugins.tooltip.titleColor = '#f1f5f9';
    Chart.defaults.plugins.tooltip.bodyColor = '#94a3b8';
    Chart.defaults.plugins.tooltip.borderColor = 'rgba(99,102,241,0.3)';
    Chart.defaults.plugins.tooltip.borderWidth = 1;
    Chart.defaults.plugins.tooltip.padding = 12;
    Chart.defaults.plugins.tooltip.cornerRadius = 12;
  }

  /* ───────────────────────────────────────────────────────────
     KEYBOARD SHORTCUTS
  ─────────────────────────────────────────────────────────── */
  function initKeyboard() {
    document.addEventListener('keydown', e => {
      if ((e.metaKey||e.ctrlKey) && e.key >= '1' && e.key <= '4') {
        const tabs = qsa('.tab'); const idx = parseInt(e.key) - 1;
        if (tabs[idx]) { e.preventDefault(); tabs[idx].click(); }
      }
    });
  }

  /* ───────────────────────────────────────────────────────────
     INTERCEPT app.js AI SUBMIT to add typing delay
  ─────────────────────────────────────────────────────────── */
  function interceptAppAi() {
    // Wait for app.js to be loaded, then patch the AI form
    const origForm = el('aiForm');
    if (!origForm) return;

    // Store original handler reference — app.js adds its own listener
    // We already added ours in initAiPanel, which calls e.stopPropagation()
    // So app.js's handler won't fire. We need to manually invoke it.
    // The trick: expose a function that mimics what app.js does on submit.
    // App.js's aiForm submit handler reads input.value and calls handleUserMessage.
    // We expose __appAiSubmit = (text) => { set input value, fire submit on HIDDEN form }

    // Create a shadow form that app.js doesn't know about
    const shadow = document.createElement('form');
    shadow.id = '__shadowAiForm';
    shadow.style.display = 'none';
    const shadowInput = document.createElement('input');
    shadowInput.id = '__shadowAiInput';
    document.body.appendChild(shadow);
    shadow.appendChild(shadowInput);

    window.__appAiSubmit = function(text) {
      // Directly set the real input value and dispatch submit
      // But since we blocked the original submit, we need another way.
      // Best approach: find and call app.js's internal function if exposed,
      // otherwise just put text in input and fire a new submit event that
      // bypasses our interceptor.
      const realInput = el('aiInput');
      if (realInput) realInput.value = text;
      // Fire submit without triggering our listener (use a flag)
      window.__bypassAiIntercept = true;
      origForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      window.__bypassAiIntercept = false;
    };

    // Patch our form listener to respect the bypass flag
    // (already handled in initAiPanel by checking window.__bypassAiIntercept)
  }

  /* ───────────────────────────────────────────────────────────
     INIT
  ─────────────────────────────────────────────────────────── */
  function init() {
    patchCharts();
    initLogin();
    injectThemeSwitcher();
    initCommandPalette();
    initAiPanel();
    initTabTransitions();
    initCounters();
    initStatusSync();
    initRipples();
    initKeyboard();
    setTimeout(interceptAppAi, 500);
    window.uiEnhanced = true;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 0);
  }

})();
