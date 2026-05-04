/* ═══════════════════════════════════════════════════════════════
   ui-enhancements.js
   Newark Parcel Intelligence — Advanced UI Layer
   Handles: login, command palette, AI panel, animations, 
            tab transitions, counter rolls, micro-interactions
════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ───────────────────────────────────────────────────────────
     HELPERS
  ─────────────────────────────────────────────────────────── */
  function el(id) { return document.getElementById(id); }
  function qs(selector) { return document.querySelector(selector); }
  function qsa(selector) { return [...document.querySelectorAll(selector)]; }

  /* Animate a number counting up */
  function animateCounter(element, targetText) {
    const num = parseFloat(String(targetText).replace(/[^0-9.]/g, ''));
    if (isNaN(num) || num === 0) { element.textContent = targetText; return; }
    const prefix = String(targetText).match(/^[^0-9]*/)?.[0] || '';
    const suffix = String(targetText).match(/[^0-9.]*$/)?.[0] || '';
    const duration = 600;
    const steps = 28;
    let step = 0;
    const interval = setInterval(() => {
      step++;
      const progress = step / steps;
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = num * ease;
      let display;
      if (suffix.includes('B')) display = `${prefix}${(current).toFixed(1)}${suffix}`;
      else if (suffix.includes('M')) display = `${prefix}${(current).toFixed(1)}${suffix}`;
      else if (suffix.includes('K')) display = `${prefix}${Math.round(current)}${suffix}`;
      else display = `${prefix}${Math.round(current).toLocaleString()}${suffix}`;
      element.textContent = display;
      if (step >= steps) { clearInterval(interval); element.textContent = targetText; }
    }, duration / steps);
  }

  /* ───────────────────────────────────────────────────────────
     LOGIN PARTICLES CANVAS
  ─────────────────────────────────────────────────────────── */
  function initParticles() {
    const canvas = el('loginParticles');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W = canvas.width = window.innerWidth;
    let H = canvas.height = window.innerHeight;
    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.5 + 0.3,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      alpha: Math.random() * 0.5 + 0.1,
    }));

    function draw() {
      ctx.clearRect(0, 0, W, H);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(99,102,241,${p.alpha})`;
        ctx.fill();
      });
      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(99,102,241,${0.06 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }
      requestAnimationFrame(draw);
    }
    draw();
    window.addEventListener('resize', () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    });
  }

  /* ───────────────────────────────────────────────────────────
     LOGIN SCREEN
  ─────────────────────────────────────────────────────────── */
  function initLogin() {
    initParticles();

    const pwInput = el('loginPassword');
    const pwToggle = el('pwToggle');
    const loginBtn = el('enterDashboard');
    const loginError = el('loginError');
    const loginScreen = el('loginScreen');
    const app = el('app');

    // Password toggle
    if (pwToggle && pwInput) {
      pwToggle.addEventListener('click', () => {
        const isPassword = pwInput.type === 'password';
        pwInput.type = isPassword ? 'text' : 'password';
      });
    }

    // Enter on password field
    if (pwInput) {
      pwInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') loginBtn?.click();
      });
    }

    // Login button
    if (loginBtn) {
      loginBtn.addEventListener('click', () => {
        const pwd = pwInput?.value?.trim() || '';
        if (pwd.toLowerCase() !== 'newark') {
          loginError.textContent = 'Incorrect password. Hint: the city name.';
          loginBtn.classList.add('invalid');
          setTimeout(() => loginBtn.classList.remove('invalid'), 400);
          return;
        }
        loginError.textContent = '';
        loginBtn.innerHTML = `<span>Entering Dashboard…</span>
          <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-dashoffset="32" style="animation:dashSpin 0.8s linear infinite"/></svg>`;
        loginBtn.disabled = true;
        setTimeout(() => {
          loginScreen.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
          loginScreen.style.opacity = '0';
          loginScreen.style.transform = 'scale(1.03)';
          setTimeout(() => {
            loginScreen.classList.add('gone');
            app.classList.add('visible');
            // Signal to app.js that we're in
            if (typeof window.enterDashboard === 'function') window.enterDashboard();
          }, 500);
        }, 700);
      });
    }
  }

  /* ───────────────────────────────────────────────────────────
     COMMAND PALETTE
  ─────────────────────────────────────────────────────────── */
  function initCommandPalette() {
    const overlay = el('cmdOverlay');
    const backdrop = el('cmdBackdrop');
    const searchInput = el('cmdSearch');
    const openBtn = el('cmdPaletteToggle');
    const closeBtn = el('cmdClose');
    const applyBtn = el('cmdApply');
    const resultCount = el('cmdResultCount');
    let isOpen = false;

    function open() {
      if (isOpen) return;
      isOpen = true;
      overlay.classList.remove('gone');
      setTimeout(() => searchInput?.focus(), 100);
      updateResultCount();
    }

    function close() {
      if (!isOpen) return;
      isOpen = false;
      overlay.classList.add('gone');
    }

    function updateResultCount() {
      if (resultCount && typeof window.filtered !== 'undefined') {
        resultCount.textContent = (window.filtered?.length ?? '—').toLocaleString();
      } else if (resultCount) {
        resultCount.textContent = '—';
      }
    }

    openBtn?.addEventListener('click', open);
    closeBtn?.addEventListener('click', close);
    backdrop?.addEventListener('click', close);
    applyBtn?.addEventListener('click', close);

    // Keyboard shortcut ⌘K / Ctrl+K
    document.addEventListener('keydown', e => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); isOpen ? close() : open(); }
      if (e.key === 'Escape' && isOpen) close();
    });

    // Sync result count when filters run
    const observer = new MutationObserver(() => updateResultCount());
    const countEl = el('mapTabCount');
    if (countEl) observer.observe(countEl, { childList: true, subtree: true, characterData: true });

    // Wire the cmd-pill filter buttons (mirror the filter state)
    qsa('[data-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        const group = btn.dataset.filter;
        const groupBtns = qsa(`[data-filter="${group}"]`);
        groupBtns.forEach(b => b.classList.toggle('on', b === btn));
        setTimeout(updateResultCount, 200);
      });
    });

    // Live search passthrough to app searchInput
    if (searchInput) {
      searchInput.addEventListener('input', e => {
        const appSearch = el('searchInput');
        if (appSearch) {
          appSearch.value = e.target.value;
          appSearch.dispatchEvent(new Event('input'));
          setTimeout(updateResultCount, 200);
        }
      });
    }
  }

  /* ───────────────────────────────────────────────────────────
     AI PANEL — ENHANCED
  ─────────────────────────────────────────────────────────── */
  function initAiPanel() {
    const fab = el('aiLauncher');
    const panel = el('aiPanel');
    const closeBtn = el('closeAi');
    const form = el('aiForm');
    const input = el('aiInput');
    const messages = el('aiMessages');
    const suggestions = el('aiSuggestions');
    const statusEl = el('aiStatus');
    let isOpen = false;
    let isDragging = false;
    let dragOffset = { x: 0, y: 0 };

    function openPanel() {
      isOpen = true;
      panel.classList.remove('gone');
      input?.focus();
    }

    function closePanel() {
      isOpen = false;
      panel.classList.add('gone');
    }

    fab?.addEventListener('click', e => {
      if (!isDragging) isOpen ? closePanel() : openPanel();
    });

    closeBtn?.addEventListener('click', closePanel);

    // Draggable AI launcher
    if (fab) {
      let startX, startY, fabStartX, fabStartY;
      let dragMoved = false;

      fab.addEventListener('mousedown', e => {
        startX = e.clientX; startY = e.clientY;
        const rect = fab.getBoundingClientRect();
        fabStartX = rect.left; fabStartY = rect.top;
        dragMoved = false;
        isDragging = false;
        fab.classList.add('dragging');

        function onMove(e2) {
          const dx = e2.clientX - startX;
          const dy = e2.clientY - startY;
          if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
            dragMoved = true; isDragging = true;
          }
          if (isDragging) {
            fab.style.left = `${Math.max(0, Math.min(window.innerWidth - 80, fabStartX + dx))}px`;
            fab.style.top = `${Math.max(0, Math.min(window.innerHeight - 80, fabStartY + dy))}px`;
            fab.style.right = 'auto';
          }
        }
        function onUp() {
          fab.classList.remove('dragging');
          setTimeout(() => { isDragging = false; }, 100);
          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('mouseup', onUp);
        }
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
      });
    }

    // Dock position buttons
    qsa('[data-ai-dock]').forEach(btn => {
      btn.addEventListener('click', () => {
        const pos = btn.dataset.aiDock;
        const positions = {
          'top-left':    { top: '100px', left: '20px', right: 'auto', bottom: 'auto' },
          'top-right':   { top: '100px', right: '20px', left: 'auto', bottom: 'auto' },
          'mid-left':    { top: '50%', left: '20px', right: 'auto', bottom: 'auto', transform: 'translateY(-50%)' },
          'mid-right':   { top: '50%', right: '20px', left: 'auto', bottom: 'auto', transform: 'translateY(-50%)' },
          'bottom-left': { bottom: '80px', left: '20px', right: 'auto', top: 'auto' },
          'bottom-right':{ bottom: '80px', right: '20px', left: 'auto', top: 'auto' },
        };
        const p = positions[pos];
        if (p) {
          Object.assign(fab.style, { top: p.top || '', right: p.right || '', bottom: p.bottom || '', left: p.left || '', transform: p.transform || '' });
          Object.assign(panel.style, {
            top: p.top ? `calc(${p.top} + 70px)` : '',
            right: p.right || '', bottom: p.bottom ? `calc(${p.bottom} + 70px)` : '',
            left: p.left || '', transform: p.transform || ''
          });
        }
      });
    });

    // Suggestion chips
    suggestions?.addEventListener('click', e => {
      const btn = e.target.closest('[data-prompt]');
      if (btn) {
        input.value = btn.dataset.prompt;
        form.dispatchEvent(new Event('submit'));
      }
    });

    // Enhanced message rendering
    function addMessage(role, content) {
      const isBot = role === 'bot';
      const div = document.createElement('div');
      div.className = `ai-msg ${isBot ? 'ai-msg--bot' : 'ai-msg--user'}`;

      if (isBot) {
        div.innerHTML = `
          <div class="ai-msg-avatar">
            <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"/>
            </svg>
          </div>
          <div class="ai-msg-bubble">${formatBotMessage(content)}</div>`;
      } else {
        div.innerHTML = `<div class="ai-msg-bubble">${escapeHtml(content)}</div>`;
      }

      messages.appendChild(div);
      messages.scrollTop = messages.scrollHeight;
      return div;
    }

    function addTypingIndicator() {
      const div = document.createElement('div');
      div.className = 'ai-msg ai-msg--bot ai-msg--typing';
      div.innerHTML = `
        <div class="ai-msg-avatar">
          <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"/>
          </svg>
        </div>
        <div class="ai-msg-bubble">
          <div class="typing-dots"><span></span><span></span><span></span></div>
        </div>`;
      messages.appendChild(div);
      messages.scrollTop = messages.scrollHeight;
      return div;
    }

    function formatBotMessage(text) {
      // Convert plain text to rich HTML
      let html = escapeHtml(text);
      // Bold **text**
      html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
      // Numbers highlighted
      html = html.replace(/\b(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\b/g, '<em>$1</em>');
      // Bullet lists
      if (html.includes('&#xA;- ') || html.includes('\n- ')) {
        const lines = html.split(/\n/);
        let inList = false;
        const parts = lines.map(line => {
          if (line.startsWith('- ')) {
            if (!inList) { inList = true; return '<ul><li>' + line.slice(2) + '</li>'; }
            return '<li>' + line.slice(2) + '</li>';
          }
          if (inList) { inList = false; return '</ul>' + line; }
          return line;
        });
        if (inList) parts.push('</ul>');
        html = parts.join('<br>');
      }
      // Line breaks
      html = html.replace(/\n/g, '<br>');
      return `<p>${html}</p>`;
    }

    function escapeHtml(str) {
      return String(str ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;' })[c]);
    }

    // Intercept the original addAiMessage function to use our enhanced renderer
    const originalAddAiMessage = window.addAiMessage;
    window.addAiMessage = function(role, content) {
      if (originalAddAiMessage) {
        // For compatibility: let original handle logic, we handle display
      }
      return addMessage(role, content);
    };

    // Intercept form submission to show typing indicator
    form?.addEventListener('submit', e => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text) return;
      input.value = '';

      // Add user message
      addMessage('user', text);

      // Show typing indicator
      const typingEl = addTypingIndicator();

      // Simulate response delay then remove typing indicator
      setTimeout(() => {
        typingEl.remove();
        // Delegate to original app.js AI handler
        if (typeof window.handleAiQuery === 'function') {
          window.handleAiQuery(text);
        } else {
          // Fallback: trigger original form
          const origInput = el('aiInput');
          if (origInput) {
            origInput.value = text;
            const origForm = el('aiForm');
            // We already submitted — the original handler should pick up via our override
          }
          addMessage('bot', "I'm analyzing the dataset… please ensure the parcel data is fully loaded.");
        }
      }, 800 + Math.random() * 400);
    });
  }

  /* ───────────────────────────────────────────────────────────
     TAB TRANSITIONS
  ─────────────────────────────────────────────────────────── */
  function initTabTransitions() {
    const views = qsa('.view');

    qsa('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.dataset.tab;
        qsa('.tab').forEach(t => t.classList.toggle('on', t === tab));
        views.forEach(v => {
          const isTarget = v.id === `view-${target}`;
          if (isTarget) {
            v.classList.remove('gone');
            v.style.opacity = '0';
            v.style.transform = 'translateY(6px)';
            requestAnimationFrame(() => {
              v.style.transition = 'opacity 0.28s ease, transform 0.28s ease';
              v.style.opacity = '1';
              v.style.transform = 'translateY(0)';
            });
          } else {
            v.classList.add('gone');
            v.style.opacity = '';
            v.style.transform = '';
            v.style.transition = '';
          }
        });
      });
    });
  }

  /* ───────────────────────────────────────────────────────────
     KPI COUNTER ANIMATIONS
  ─────────────────────────────────────────────────────────── */
  function initCounterAnimations() {
    const kpiIds = ['kVacant','kValue','kLandValue','kImprovedValue','mParcels','mVacant','mScore','sidebarCount','cParcels','cVacantOnly','cUnderOnly','cOpportunity','cValue'];

    const observer = new MutationObserver(mutations => {
      mutations.forEach(m => {
        const el = m.target;
        const text = el.textContent.trim();
        if (text !== '—' && text !== '' && !el.dataset.animating) {
          el.dataset.animating = '1';
          animateCounter(el, text);
          setTimeout(() => delete el.dataset.animating, 800);
        }
      });
    });

    kpiIds.forEach(id => {
      const element = document.getElementById(id);
      if (element) observer.observe(element, { childList: true, characterData: true, subtree: true });
    });
  }

  /* ───────────────────────────────────────────────────────────
     STATUS BAR SYNC
  ─────────────────────────────────────────────────────────── */
  function initStatusBarSync() {
    const statusTop = el('statusText');
    const statusBottom = el('statusTextBottom');
    if (!statusTop || !statusBottom) return;

    const obs = new MutationObserver(() => {
      statusBottom.textContent = statusTop.textContent;
    });
    obs.observe(statusTop, { childList: true, characterData: true, subtree: true });
    statusBottom.textContent = statusTop.textContent;
  }

  /* ───────────────────────────────────────────────────────────
     SIDEBAR HOVER MICRO-INTERACTIONS
  ─────────────────────────────────────────────────────────── */
  function initMicroInteractions() {
    // Add ripple effect to primary buttons
    document.addEventListener('click', e => {
      const btn = e.target.closest('.btn-primary, .login-btn, .sel-btn');
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      const ripple = document.createElement('span');
      const size = Math.max(rect.width, rect.height);
      ripple.style.cssText = `
        position:absolute;width:${size}px;height:${size}px;border-radius:50%;
        background:rgba(255,255,255,0.25);transform:scale(0);
        left:${e.clientX - rect.left - size/2}px;top:${e.clientY - rect.top - size/2}px;
        animation:ripple 0.5s ease-out;pointer-events:none;
      `;
      btn.style.position = 'relative';
      btn.style.overflow = 'hidden';
      btn.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    });

    // Inject ripple keyframe once
    if (!document.getElementById('ripple-style')) {
      const style = document.createElement('style');
      style.id = 'ripple-style';
      style.textContent = `@keyframes ripple { to { transform: scale(2.5); opacity: 0; } }`;
      document.head.appendChild(style);
    }
  }

  /* ───────────────────────────────────────────────────────────
     MINI-KPI TOOLTIP
  ─────────────────────────────────────────────────────────── */
  function initKpiTooltips() {
    const tooltips = {
      'kVacant': 'Parcels where IMPRVT_VAL = 0 (vacant) or IMPRVT_VAL ≤ 20% of LAND_VAL (underutilized)',
      'kValue':  'Total cumulative assessed value across all filtered parcels',
      'kLandValue': 'Total land value from REGRID_landval field',
      'kImprovedValue': 'Total improvement value from REGRID_improvval field',
    };
    Object.entries(tooltips).forEach(([id, tip]) => {
      const element = document.getElementById(id)?.closest('.mini-kpi');
      if (element) element.title = tip;
    });
  }

  /* ───────────────────────────────────────────────────────────
     MAP LOADING STATE ENHANCEMENT
  ─────────────────────────────────────────────────────────── */
  function initMapLoadingObserver() {
    const mapLoading = el('mapLoading');
    if (!mapLoading) return;
    // Observe when map loading state changes, animate in/out
    const obs = new MutationObserver(() => {
      if (mapLoading.classList.contains('gone')) {
        mapLoading.style.opacity = '1';
      }
    });
    obs.observe(mapLoading, { attributes: true, attributeFilter: ['class'] });
  }

  /* ───────────────────────────────────────────────────────────
     CHART DARK MODE OVERRIDE
  ─────────────────────────────────────────────────────────── */
  function patchChartDefaults() {
    if (!window.Chart) return;
    Chart.defaults.color = '#64748b';
    Chart.defaults.borderColor = 'rgba(99,102,241,0.1)';
    Chart.defaults.font.family = '"DM Sans", ui-sans-serif, system-ui, sans-serif';
    Chart.defaults.font.size = 11;
    Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(19,29,46,0.97)';
    Chart.defaults.plugins.tooltip.titleColor = '#f1f5f9';
    Chart.defaults.plugins.tooltip.bodyColor = '#94a3b8';
    Chart.defaults.plugins.tooltip.borderColor = 'rgba(99,102,241,0.3)';
    Chart.defaults.plugins.tooltip.borderWidth = 1;
    Chart.defaults.plugins.tooltip.padding = 12;
    Chart.defaults.plugins.tooltip.cornerRadius = 12;
    Chart.defaults.plugins.legend.labels.color = '#64748b';
  }

  /* ───────────────────────────────────────────────────────────
     KEYBOARD SHORTCUTS INFO
  ─────────────────────────────────────────────────────────── */
  function initKeyboardShortcuts() {
    document.addEventListener('keydown', e => {
      // ⌘1-4 for tabs
      if ((e.metaKey || e.ctrlKey) && e.key >= '1' && e.key <= '4') {
        const tabs = qsa('.tab');
        const idx = parseInt(e.key) - 1;
        if (tabs[idx]) { e.preventDefault(); tabs[idx].click(); }
      }
      // ⌘E for export
      if ((e.metaKey || e.ctrlKey) && e.key === 'e') {
        e.preventDefault();
        el('exportCsv')?.click();
      }
    });
  }

  /* ───────────────────────────────────────────────────────────
     ANALYTICS SECTION HEADER ENHANCEMENTS
  ─────────────────────────────────────────────────────────── */
  function enhanceSectionText() {
    // Better insight tag text based on data context
    const tagMap = {
      'iVacant': 'Vacancy Concentration',
      'iClusters': 'Assemblage Potential',
      'iOwnership': 'Ownership Profile',
      'iZoning': 'Zoning Landscape',
    };
  }

  /* ───────────────────────────────────────────────────────────
     APP INIT SEQUENCE
  ─────────────────────────────────────────────────────────── */
  function init() {
    patchChartDefaults();
    initLogin();
    initCommandPalette();
    initAiPanel();
    initTabTransitions();
    initCounterAnimations();
    initStatusBarSync();
    initMicroInteractions();
    initKpiTooltips();
    initMapLoadingObserver();
    initKeyboardShortcuts();
    enhanceSectionText();

    // Expose global for app.js compatibility
    window.uiEnhanced = true;
  }

  // Run after DOM and app.js are both ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    // Already loaded — run after a tick to let app.js initialize
    setTimeout(init, 0);
  }

})();
