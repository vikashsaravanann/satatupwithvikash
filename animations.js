/**
 * VIKASH PORTFOLIO — ANIMATION ADDONS v2
 * Add after script.js:  <script src="animation-addons.js"></script>
 */

document.addEventListener('DOMContentLoaded', () => {

  /* ══════════════════════════════════════════
   1. PAGE INTRO LOADER
  ══════════════════════════════════════════ */
  const introEl = document.createElement('div');
  introEl.id = 'page-intro';
  introEl.innerHTML = `
    <div class="intro-logo">VIKASH <span>SARAVANAN</span></div>
    <div class="intro-bar"><div class="intro-fill"></div></div>
  `;
  document.body.prepend(introEl);
  setTimeout(() => introEl.remove(), 2700);


  /* Grain Overlay Removed for performance */


  /* ══════════════════════════════════════════
   3. SCROLL PROGRESS BAR
  ══════════════════════════════════════════ */
  const bar = document.createElement('div');
  bar.id = 'scroll-progress';
  document.body.prepend(bar);

  window.addEventListener('scroll', () => {
    const h = document.documentElement;
    bar.style.width = ((h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100) + '%';
  }, { passive: true });


  /* ══════════════════════════════════════════
   5. CLICK PARTICLE BURST
  ══════════════════════════════════════════ */
  const BURST_COLORS = ['#0ea5e9','#38bdf8','#7dd3fc','#6366f1','#a78bfa','#ec4899','#00ff88'];
  document.addEventListener('click', e => {
    const count = 6;
    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      p.className = 'click-particle';
      const angle  = (i / count) * Math.PI * 2;
      const dist   = 40 + Math.random() * 70;
      const dur    = 0.5 + Math.random() * 0.5;
      const color  = BURST_COLORS[Math.floor(Math.random() * BURST_COLORS.length)];
      const size   = 4 + Math.random() * 5;
      p.style.cssText = `
        left:${e.clientX}px; top:${e.clientY}px;
        width:${size}px; height:${size}px;
        background:${color};
        --tx:${Math.cos(angle) * dist}px;
        --ty:${Math.sin(angle) * dist}px;
        --d:${dur}s;
      `;
      document.body.appendChild(p);
      setTimeout(() => p.remove(), dur * 1000);
    }
  });


  /* ══════════════════════════════════════════
   6. GLOBAL STAR CANVAS & HERO AURORA
  ══════════════════════════════════════════ */
  const heroSection = document.getElementById('hero');
  if (heroSection) {
    // Add aurora blobs to hero
    ['aurora-blob aurora-blob-1','aurora-blob aurora-blob-2','aurora-blob aurora-blob-3'].forEach(cls => {
      const b = document.createElement('div');
      b.className = cls;
      heroSection.insertBefore(b, heroSection.firstChild);
    });
  }

  const canvas = document.createElement('canvas');
  canvas.id = 'site-canvas';
  document.body.prepend(canvas);
  const ctx = canvas.getContext('2d');
  let particles = [];

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function makeParticles() {
    particles = [];
    const n = Math.min(25, Math.floor(canvas.width * canvas.height / 80000));
    for (let i = 0; i < n; i++) particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.2,
      vx: (Math.random() - .5) * 0.15,
      vy: (Math.random() - .5) * 0.15,
      a: Math.random() * .6 + .2,
      p: Math.random() * Math.PI * 2
    });
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach((pt) => {
      pt.x += pt.vx; pt.y += pt.vy; pt.p += .015;
      if (pt.x < 0) pt.x = canvas.width;
      if (pt.x > canvas.width)  pt.x = 0;
      if (pt.y < 0) pt.y = canvas.height;
      if (pt.y > canvas.height) pt.y = 0;
      const a = pt.a * (.5 + .5 * Math.sin(pt.p));
      ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(14,165,233,${a})`; ctx.fill();
    });
    requestAnimationFrame(draw);
  }

  let resizeTimer;
  window.addEventListener('resize', () => { 
    resize(); 
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => makeParticles(), 200);
  });
  resize(); makeParticles(); draw();


  /* ══════════════════════════════════════════
     OPTIMIZED MOUSE INTERACTION SYSTEM
  ══════════════════════════════════════════ */
  let mouseX = 0, mouseY = 0;
  let rafPending = false;

  const holoCards = document.querySelectorAll('.deep-dive-card, .cert-badge-card, .bento-card');
  const spotlightCards = document.querySelectorAll('.deep-dive-card,.skill-card,.widget-card,.summary-box,.counter-card');
  const tiltCards = document.querySelectorAll('.deep-dive-card');
  const sideProfiles = document.querySelectorAll('.side-profile');
  const mainProfile  = document.querySelector('.profile-image-container.floating');
  const magneticBtns = document.querySelectorAll('.btn-primary,.btn-secondary,.btn-primary-sm');
  const meshGradient = document.getElementById('mesh-gradient');

  // Initialize classes
  holoCards.forEach(c => c.classList.add('holo-card'));
  spotlightCards.forEach(c => c.classList.add('spotlight-card'));
  tiltCards.forEach(c => c.classList.add('tilt-card','scan-card'));

  function updateMouseEffects() {
    // 1. Holographic & Spotlight
    const activeCards = [...holoCards, ...spotlightCards];
    activeCards.forEach(card => {
      const r = card.getBoundingClientRect();
      if (mouseX > r.left && mouseX < r.right && mouseY > r.top && mouseY < r.bottom) {
        if (card.classList.contains('holo-card')) {
          card.style.setProperty('--hx', ((mouseX - r.left) / r.width * 100) + '%');
          card.style.setProperty('--hy', ((mouseY - r.top)  / r.height * 100) + '%');
        }
        if (card.classList.contains('spotlight-card')) {
          card.style.setProperty('--sx', (mouseX - r.left) + 'px');
          card.style.setProperty('--sy', (mouseY - r.top)  + 'px');
        }
      }
    });

    // 2. 3D Tilt
    tiltCards.forEach(card => {
      const r = card.getBoundingClientRect();
      if (mouseX > r.left && mouseX < r.right && mouseY > r.top && mouseY < r.bottom) {
        const rx = ((mouseY - r.top  - r.height/2) / (r.height/2)) * -5; // Reduced intensity
        const ry = ((mouseX - r.left - r.width/2)  / (r.width/2))  *  5;
        card.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(8px)`;
      } else {
        card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateZ(0)';
      }
    });

    // 3. Parallax Hero
    if (heroSection) {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const dx = (mouseX - cx) / cx;
      const dy = (mouseY - cy) / cy;
      
      sideProfiles.forEach(el => {
        el.style.transform = `translate3d(${dx * -8}px, ${dy * -12}px, 0)`;
      });
      if (mainProfile) {
        mainProfile.style.transform = `translate3d(0, ${dy * -6}px, 0)`;
      }
      if (meshGradient) {
        meshGradient.style.transform = `translate3d(${dx * 15}px, ${dy * 10}px, 0)`;
      }
    }

    // 4. Magnetic Buttons
    magneticBtns.forEach(btn => {
      const r = btn.getBoundingClientRect();
      if (mouseX > r.left - 50 && mouseX < r.right + 50 && mouseY > r.top - 50 && mouseY < r.bottom + 50) {
        const dx = (mouseX - r.left - r.width/2)  * .3;
        const dy = (mouseY - r.top  - r.height/2) * .3;
        btn.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
      } else {
        btn.style.transform = '';
      }
    });

    rafPending = false;
  }

  document.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    if (!rafPending) {
      rafPending = true;
      requestAnimationFrame(updateMouseEffects);
    }
  }, { passive: true });


  /* ══════════════════════════════════════════
   14. RIPPLE on buttons
  ══════════════════════════════════════════ */
  document.querySelectorAll('.btn-primary,.btn-primary-sm').forEach(btn => {
    btn.classList.add('ripple-btn');
    btn.addEventListener('click', e => {
      const r    = btn.getBoundingClientRect();
      const size = Math.max(r.width, r.height) * 2;
      const w    = document.createElement('span');
      w.className = 'ripple-wave';
      w.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX-r.left-size/2}px;top:${e.clientY-r.top-size/2}px;`;
      btn.appendChild(w);
      w.addEventListener('animationend', () => w.remove());
    });
  });


  /* ══════════════════════════════════════════
   15. ANIMATED COUNTERS (count-up)
  ══════════════════════════════════════════ */
  function countUp(el, target, ms = 1800) {
    let start = null;
    (function step(ts) {
      if (!start) start = ts;
      const p = Math.min((ts - start) / ms, 1);
      const e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.floor(e * target);
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = target;
    })(performance.now());
  }

  const cntObs = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      const numEl  = en.target.querySelector('.counter-number');
      const target = parseInt(numEl.dataset.target, 10);
      countUp(numEl, target);
      cntObs.unobserve(en.target);
    });
  }, { threshold: .5 });


  /* ══════════════════════════════════════════
   16. STAGGER CHILDREN observer
  ══════════════════════════════════════════ */
  const staggerObs = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add('visible'); staggerObs.unobserve(en.target); }
    });
  }, { threshold: .1 });


  /* ══════════════════════════════════════════
   19. ORBIT RING — inject into About section
  ══════════════════════════════════════════ */
  const aboutSection = document.getElementById('summary');
  const competencies = document.getElementById('competencies');
  if (aboutSection) {
    // Inject stats section after about
    const statsHtml = `
      <section class="stats-counter-section neon-grid-bg">
        <div class="container">
          <div class="section-title fade-up" style="margin-bottom:44px;">
            <h2>By The <span class="highlight">Numbers</span></h2>
            <p>Milestones that define the journey so far.</p>
          </div>
          <div class="stats-counter-grid stagger-children">
            <div class="counter-card">
              <i class="fas fa-certificate counter-icon"></i>
              <div class="counter-number" data-target="15">0</div>
              <span class="counter-suffix">+</span>
              <div class="counter-label">Certifications</div>
            </div>
            <div class="counter-card">
              <i class="fas fa-project-diagram counter-icon"></i>
              <div class="counter-number" data-target="3">0</div>
              <span class="counter-suffix">+</span>
              <div class="counter-label">Live Projects</div>
            </div>
            <div class="counter-card">
              <i class="fas fa-code counter-icon"></i>
              <div class="counter-number" data-target="5000">0</div>
              <span class="counter-suffix">+</span>
              <div class="counter-label">Lines of Code</div>
            </div>
            <div class="counter-card">
              <i class="fas fa-trophy counter-icon"></i>
              <div class="counter-number" data-target="1">0</div>
              <span class="counter-suffix"></span>
              <div class="counter-label">Hackathon Finalist</div>
            </div>
          </div>
        </div>
      </section>`;

    aboutSection.insertAdjacentHTML('afterend', statsHtml);

    // Orbit widget — inject before competencies
    const orbitSkills = [
      { icon:'fab fa-python',    label:'Python'   },
      { icon:'fab fa-react',     label:'React'    },
      { icon:'fas fa-database',  label:'SQL'      },
      { icon:'fas fa-robot',     label:'n8n'      },
      { icon:'fab fa-docker',    label:'Docker'   },
      { icon:'fas fa-eye',       label:'Vision'   },
    ];

    const orbitHtml = `
      <div style="text-align:center;margin-bottom:20px;" class="fade-up">
        <h3 style="font-size:1.4rem;color:rgba(255,255,255,.5);letter-spacing:3px;text-transform:uppercase;font-weight:400;margin-bottom:8px;">Core Stack</h3>
      </div>
      <div class="orbit-container fade-up" id="orbit-wrap">
        <div class="orbit-ring" style="width:240px;height:240px;"></div>
        <div class="orbit-ring" style="width:140px;height:140px;opacity:.5;"></div>
        <div class="orbit-center"><i class="fas fa-brain"></i></div>
        ${orbitSkills.map((s, i) => `
          <div class="orbit-item" data-idx="${i}" data-tooltip="${s.label}">
            <i class="${s.icon}"></i>
          </div>`).join('')}
      </div>`;

    if (competencies) {
      competencies.insertAdjacentHTML('beforebegin', `<section style="padding:60px 0 0;"><div class="container">${orbitHtml}</div></section>`);
    }

    // Animate orbit items
    function placeOrbitItems() {
      const wrap  = document.getElementById('orbit-wrap');
      if (!wrap) return;
      const items = wrap.querySelectorAll('.orbit-item');
      const r     = 120; // radius

      (function animate(ts) {
        items.forEach((el, i) => {
          const angle = (ts / 3500) + (i * (Math.PI * 2 / items.length));
          const x = Math.cos(angle) * r - 23;
          const y = Math.sin(angle) * r - 23;
          el.style.left = (50 + x / 1.6) + '%'; // center hack
          el.style.top  = (50 + y / 1.6) + '%';
          el.style.transform = `rotate(${-angle}rad) scale(1)`;
        });
        requestAnimationFrame(animate);
      })(performance.now());
    }

    setTimeout(placeOrbitItems, 100);

    // Observe new elements
    document.querySelectorAll('.counter-card').forEach(c => cntObs.observe(c));
    document.querySelectorAll('.stagger-children').forEach(c => staggerObs.observe(c));
    document.querySelectorAll('.fade-up').forEach(c => {
      new IntersectionObserver(e => {
        if (e[0].isIntersecting) { e[0].target.classList.add('visible'); }
      }, { threshold: .1 }).observe(c);
    });
  }


  /* ══════════════════════════════════════════
   20. AVAILABILITY BAR — inject into hero
  ══════════════════════════════════════════ */
  const heroTop = document.querySelector('.hero-top-intro');
  if (heroTop) {
    const av = document.createElement('div');
    av.className = 'availability-bar fade-up';
    av.innerHTML = `<span class="ping-ring"></span> Open for Internships &amp; Freelance`;
    heroTop.insertBefore(av, heroTop.firstChild);
  }


  /* ══════════════════════════════════════════
   21. IMAGE DISTORTION on gallery + profile separators
  ══════════════════════════════════════════ */
  document.querySelectorAll('.gallery-item,.responsive-intro-card,.responsive-staggered-card').forEach(el => {
    el.classList.add('img-distort');
  });


  /* ══════════════════════════════════════════
   22. GLASS LIFT on timeline + footer widgets
  ══════════════════════════════════════════ */
  document.querySelectorAll('.timeline-content,.footer-widget').forEach(el => {
    el.classList.add('glass-lift');
  });


  /* ══════════════════════════════════════════
   23. TOAST NOTIFICATION SYSTEM
  ══════════════════════════════════════════ */
  const toastC = document.createElement('div');
  toastC.id = 'toast-container';
  document.body.appendChild(toastC);

  function toast(icon, msg, dur = 4500) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = `<i class="fas ${icon} toast-icon"></i><span>${msg}</span><i class="fas fa-times toast-close"></i>`;
    toastC.appendChild(t);
    requestAnimationFrame(() => requestAnimationFrame(() => t.classList.add('show')));
    const hide = () => { t.classList.remove('show'); setTimeout(() => t.remove(), 520); };
    t.querySelector('.toast-close').onclick = hide;
    if (dur > 0) setTimeout(hide, dur);
  }

  setTimeout(() => toast('fa-wave-square', 'Welcome to Vikash\'s Portfolio! 🚀', 5500), 2400);

  const footerEl = document.getElementById('contact');
  let contactShown = false;
  if (footerEl) {
    new IntersectionObserver(e => {
      if (e[0].isIntersecting && !contactShown) {
        contactShown = true;
        toast('fa-envelope', 'Let\'s connect — vikash07052008@gmail.com', 6000);
      }
    }, { threshold: .3 }).observe(footerEl);
  }


  /* ══════════════════════════════════════════
   24. BACK TO TOP BUTTON
  ══════════════════════════════════════════ */
  const btt = document.createElement('div');
  btt.id = 'back-to-top';
  btt.innerHTML = '<i class="fas fa-arrow-up"></i>';
  document.body.appendChild(btt);
  window.addEventListener('scroll', () => btt.classList.toggle('visible', scrollY > 600), { passive: true });
  btt.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));


  /* ══════════════════════════════════════════
   27. SCAN LINE on skill cards
  ══════════════════════════════════════════ */
  document.querySelectorAll('.skill-card,.widget-card').forEach(c => c.classList.add('scan-card'));


  /* ══════════════════════════════════════════
   28. NEON GRID on competencies section
  ══════════════════════════════════════════ */
  document.getElementById('competencies')?.classList.add('neon-grid-bg');


  /* ══════════════════════════════════════════
   30. DEV CONSOLE SIGNATURE
  ══════════════════════════════════════════ */
  console.log('%c ██╗   ██╗██╗██╗  ██╗ █████╗ ███████╗██╗  ██╗', 'color:#0ea5e9;font-family:monospace;font-size:10px;');
  console.log('%c ██║   ██║██║██║ ██╔╝██╔══██╗██╔════╝██║  ██║', 'color:#0ea5e9;font-family:monospace;font-size:10px;');
  console.log('%c ██║   ██║██║█████╔╝ ███████║███████╗███████║', 'color:#38bdf8;font-family:monospace;font-size:10px;');
  console.log('%c ╚██╗ ██╔╝██║██╔═██╗ ██╔══██║╚════██║██╔══██║', 'color:#38bdf8;font-family:monospace;font-size:10px;');
  console.log('%c  ╚████╔╝ ██║██║  ██╗██║  ██║███████║██║  ██║', 'color:#7dd3fc;font-family:monospace;font-size:10px;');
  console.log('%c   ╚═══╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝', 'color:#7dd3fc;font-family:monospace;font-size:10px;');
  console.log('%c          SARAVANAN — Portfolio v2 ✦ Built with passion', 'color:#0ea5e9;font-weight:bold;font-size:13px;');


  /* ═══════════════════════════════════════════════════════
     ANIMATION ADDONS v3 — MERGED
     ═══════════════════════════════════════════════════════ */


  /* ══════════════════════════════════════════
   NEW 1. GRADIENT MESH BACKGROUND in hero
  ══════════════════════════════════════════ */
  // heroSection already declared above in v2 section
  if (heroSection && !document.getElementById('mesh-gradient')) {
    const mesh = document.createElement('div');
    mesh.id = 'mesh-gradient';
    heroSection.insertBefore(mesh, heroSection.firstChild);
    ['mesh-blob-1','mesh-blob-2','mesh-blob-3','mesh-blob-4'].forEach(cls => {
      const b = document.createElement('div');
      b.className = `mesh-blob ${cls}`;
      mesh.appendChild(b);
    });
  }

  // Mouse-shift mesh on hero
  heroSection && document.addEventListener('mousemove', e => {
    const rect = heroSection.getBoundingClientRect();
    if (e.clientY > rect.bottom) return;
    const cx = (e.clientX / window.innerWidth  - .5) * 30;
    const cy = (e.clientY / window.innerHeight - .5) * 20;
    const m  = heroSection.querySelector('#mesh-gradient');
    if (m) m.style.transform = `translate(${cx}px,${cy}px)`;
  });


  /* ══════════════════════════════════════════
   NEW 5. SECTION PROGRESS SIDEBAR DOTS
  ══════════════════════════════════════════ */
  const sections = ['hero','summary','competencies','projects','academics','contact'];
  const labels   = ['Hero','About','Skills','Projects','Education','Contact'];

  const nav = document.createElement('div');
  nav.id = 'section-nav';
  sections.forEach((id, i) => {
    const d = document.createElement('div');
    d.className = 'section-dot';
    d.dataset.label = labels[i];
    d.dataset.target = id;
    d.addEventListener('click', () => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    });
    d.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
    d.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
    nav.appendChild(d);
  });
  document.body.appendChild(nav);

  function updateSectionDots() {
    sections.forEach((id, i) => {
      const el = document.getElementById(id);
      const dt = nav.children[i];
      if (!el || !dt) return;
      const rect = el.getBoundingClientRect();
      if (rect.top <= window.innerHeight / 2 && rect.bottom >= window.innerHeight / 2) {
        dt.classList.add('active');
      } else {
        dt.classList.remove('active');
      }
    });
  }
  window.addEventListener('scroll', updateSectionDots, { passive: true });
  updateSectionDots();


  /* ══════════════════════════════════════════
   NEW 6. CLIP-PATH WIPE REVEAL (images)
   Observe parent container so clip-path:inset
   doesn't prevent intersection detection.
  ══════════════════════════════════════════ */
  document.querySelectorAll('.cinema-grid, .cinema-strip, .cert-container').forEach(parent => {
    const children = parent.querySelectorAll('.cinema-frame, .cert-row');
    children.forEach(el => el.classList.add('wipe-reveal'));
    new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        children.forEach((el, i) => {
          setTimeout(() => el.classList.add('visible'), i * 120);
        });
      }
    }, { threshold: .1 }).observe(parent);
  });


  /* ══════════════════════════════════════════
   NEW 7. ACHIEVEMENT / XP POPUPS
  ══════════════════════════════════════════ */
  const achievements = [
    { icon:'🏆', title:'ACHIEVEMENT UNLOCKED', msg:'Hackathon Finalist — Meta PyTorch', bar:90 },
    { icon:'🚀', title:'PROJECT DEPLOYED',     msg:'HearWise — Live Production App',  bar:100 },
    { icon:'📜', title:'CERTIFICATION EARNED', msg:'15+ Professional Credentials',      bar:100 },
    { icon:'⚡', title:'SKILL MASTERED',       msg:'n8n Automation — 88% Proficiency', bar:88 },
  ];
  let achIdx = 0;

  function showAchievement(a) {
    const popup = document.createElement('div');
    popup.className = 'xp-popup';
    popup.innerHTML = `
      <div class="xp-icon">${a.icon}</div>
      <div style="flex:1;">
        <div class="xp-title">${a.title}</div>
        <div style="font-size:.88rem;margin:4px 0;">${a.msg}</div>
        <div class="xp-bar-wrap"><div class="xp-bar-fill"></div></div>
      </div>`;
    document.body.appendChild(popup);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      popup.classList.add('show');
      const fill = popup.querySelector('.xp-bar-fill');
      if (fill) fill.style.width = a.bar + '%';
    }));
    setTimeout(() => {
      popup.classList.remove('show');
      setTimeout(() => popup.remove(), 600);
    }, 4200);
  }

  // Trigger as user scrolls into key sections
  const achTriggers = [
    { id: 'projects',       delay: 0 },
    { id: 'competencies',   delay: 800 },
    { id: 'academics',      delay: 0 },
    { id: 'summary',        delay: 400 },
  ];
  const shown = new Set();
  achTriggers.forEach(({ id, delay }, i) => {
    const el = document.getElementById(id);
    if (!el) return;
    new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !shown.has(id)) {
        shown.add(id);
        setTimeout(() => showAchievement(achievements[i % achievements.length]), delay);
      }
    }, { threshold: .3 }).observe(el);
  });


  /* ══════════════════════════════════════════
   NEW 8. LETTER-BY-LETTER SUBTITLE REVEAL
  ══════════════════════════════════════════ */
  document.querySelectorAll('.section-title p, .goals-text .lead-text').forEach(el => {
    if (el.classList.contains('_letter_done')) return;
    el.classList.add('_letter_done', 'letter-reveal');
    const text = el.textContent;
    el.innerHTML = text.split('').map(ch =>
      ch === ' '
        ? ' '
        : `<span class="char-wrap"><span class="char-inner">${ch}</span></span>`
    ).join('');
    el.querySelectorAll('.char-inner').forEach((ci, i) => {
      ci.style.transitionDelay = (i * 0.018) + 's';
    });
    new IntersectionObserver(e => {
      if (e[0].isIntersecting) el.classList.add('visible');
    }, { threshold: .4 }).observe(el);
  });


  /* ══════════════════════════════════════════
   NEW 9. CARD AURA on project & skill cards
  ══════════════════════════════════════════ */
  document.querySelectorAll('.deep-dive-card, .skill-card, .counter-card').forEach(c => {
    c.classList.add('aura-card');
  });


  /* ══════════════════════════════════════════
   NEW 10. GLITCH TITLES — set data-text attr
  ══════════════════════════════════════════ */
  document.querySelectorAll('.deep-dive-header h3').forEach(h => {
    h.dataset.text = h.textContent;
  });


  /* ══════════════════════════════════════════
   NEW 11. CONFETTI BURST on primary CTA btns
  ══════════════════════════════════════════ */
  const CONF_COLORS = ['#0ea5e9','#38bdf8','#6366f1','#ec4899','#00ff88','#f59e0b','#f472b6'];
  const CONF_SHAPES = [2, 50]; // borderRadius values (px = square, 50% = circle)

  document.querySelectorAll('.btn-primary, .btn-primary-sm').forEach(btn => {
    btn.addEventListener('click', e => {
      for (let i = 0; i < 15; i++) {
        const p   = document.createElement('div');
        p.className = 'confetti-piece';
        const angle = Math.random() * Math.PI * 2;
        const dist  = 60 + Math.random() * 120;
        const dur   = 0.6 + Math.random() * 0.7;
        const color = CONF_COLORS[Math.floor(Math.random() * CONF_COLORS.length)];
        const br    = Math.random() > .5 ? '50%' : Math.floor(Math.random() * 4) + 'px';
        const size  = 5 + Math.random() * 8;
        p.style.cssText = `
          left:${e.clientX}px; top:${e.clientY}px;
          width:${size}px; height:${size}px;
          background:${color};
          --tx:${Math.cos(angle)*dist}px;
          --ty:${Math.sin(angle)*dist}px;
          --dur:${dur}s; --rot:${Math.random()*720-360}deg;
          --br:${br}; border-radius:${br};
          animation-duration:${dur}s;
        `;
        document.body.appendChild(p);
        setTimeout(() => p.remove(), dur * 1000 + 100);
      }
    });
  });


  /* ══════════════════════════════════════════
   NEW 12. STAR FIELD in timeline section
  ══════════════════════════════════════════ */
  const timelineSection = document.getElementById('timeline');
  if (timelineSection) {
    timelineSection.classList.add('starfield-section');
    for (let i = 0; i < 25; i++) {
      const s = document.createElement('div');
      s.className = 'star-dot';
      const size = Math.random() * 2.5 + 0.5;
      s.style.cssText = `
        width:${size}px; height:${size}px;
        left:${Math.random()*100}%; top:${Math.random()*100}%;
        --t:${2 + Math.random()*4}s; --d:${Math.random()*4}s;
      `;
      timelineSection.appendChild(s);
    }
  }


  /* Comet Trail & Repel logic moved to consolidated handler above */


  /* ══════════════════════════════════════════
   NEW 14. NAV COLOR SHIFT on deep scroll
  ══════════════════════════════════════════ */
  const navbar = document.querySelector('.navbar');
  window.addEventListener('scroll', () => {
    if (!navbar) return;
    navbar.classList.toggle('deep-scroll', scrollY > 300);
  }, { passive: true });


  /* ══════════════════════════════════════════
   NEW 15. ANIMATED SECTION DIVIDERS
  ══════════════════════════════════════════ */
  const dividerTargets = ['#summary','#competencies','#projects','#academics'];
  dividerTargets.forEach(sel => {
    const el = document.querySelector(sel);
    if (!el) return;
    const div = document.createElement('div');
    div.className = 'section-divider';
    el.insertAdjacentElement('beforebegin', div);
  });


  /* ══════════════════════════════════════════
   NEW 16. PERSPECTIVE TILT on profile image sections
  ══════════════════════════════════════════ */
  document.querySelectorAll('.profile-separator').forEach(sec => {
    sec.classList.add('persp-section');
  });


  /* ══════════════════════════════════════════
   NEW 17. TYPING DOTS on footer "Get In Touch" btn
  ══════════════════════════════════════════ */
  const footerCta = document.querySelector('.highlight-widget .btn-primary-sm');
  if (footerCta) {
    const dots = document.createElement('span');
    dots.className = 'typing-dots';
    dots.innerHTML = '<span></span><span></span><span></span>';
    footerCta.appendChild(dots);
  }


  /* Repel logic moved to consolidated handler */


  /* ══════════════════════════════════════════
   NEW 19. NOISE FILTER on gallery images
  ══════════════════════════════════════════ */
  document.querySelectorAll('.cinema-frame, .gallery-item').forEach(el => {
    el.classList.add('noise-img');
  });


  /* ══════════════════════════════════════════
   NEW 20. TYPEWRITER CURSOR BLINK class
  ══════════════════════════════════════════ */
  // CSS .typewriter::after already handles this — ensure typewriter el exists
  // (it does in the original HTML: <span class="typewriter text-accent">)


  /* ══════════════════════════════════════════
   NEW 21. ELASTIC SOCIAL ICON BOUNCE extra hover
  ══════════════════════════════════════════ */
  // CSS handles via .social-links-hero a:hover — no extra JS needed





  /* Counter re-wire: reuse cntObs from v2 section above */
  document.querySelectorAll('.counter-card').forEach(c => cntObs.observe(c));


  /* ══════════════════════════════════════════
   COPY EMAIL ON CLICK
  ══════════════════════════════════════════ */
  document.querySelectorAll('.contact-details p').forEach(p => {
    if (p.textContent.includes('@')) {
      p.classList.add('email-copy');
      p.title = 'Click to copy';
      p.addEventListener('click', () => {
        const email = p.textContent.replace(/^\s*\S+\s*/, '').trim();
        navigator.clipboard.writeText(email).then(() => {
          // Show tooltip
          let tip = p.querySelector('.email-copied-tip');
          if (!tip) {
            tip = document.createElement('span');
            tip.className = 'email-copied-tip';
            tip.textContent = 'Copied!';
            p.appendChild(tip);
          }
          tip.classList.add('show');
          setTimeout(() => tip.classList.remove('show'), 1500);
          // Also show toast if available
          if (typeof toast === 'function') toast('fa-copy', 'Email copied to clipboard!', 3000);
        });
      });
    }
  });


  /* ══════════════════════════════════════════
   TEXT SCRAMBLE ON HERO NAME
  ══════════════════════════════════════════ */
  const heroH1 = document.querySelector('#hero h1');
  if (heroH1) {
    const finalText = heroH1.textContent.trim();
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%';
    let frame = 0;
    const totalFrames = 25;
    heroH1.textContent = '';
    function scrambleStep() {
      let out = '';
      for (let i = 0; i < finalText.length; i++) {
        if (finalText[i] === ' ') { out += ' '; continue; }
        const revealAt = Math.floor((i / finalText.length) * totalFrames);
        if (frame >= revealAt) {
          out += finalText[i];
        } else {
          out += chars[Math.floor(Math.random() * chars.length)];
        }
      }
      heroH1.textContent = out;
      frame++;
      if (frame <= totalFrames) requestAnimationFrame(scrambleStep);
      else heroH1.textContent = finalText;
    }
    // Start after intro loader finishes
    setTimeout(scrambleStep, 2200);
  }


  /* ══════════════════════════════════════════
   SKILL BADGE TOOLTIPS
  ══════════════════════════════════════════ */
  document.querySelectorAll('.skill-tag, .orbit-item').forEach(el => {
    const proficiency = el.dataset.level || (Math.floor(Math.random() * 20) + 80) + '%';
    const experience = el.dataset.exp || (Math.floor(Math.random() * 2) + 1) + ' Years';
    
    el.addEventListener('mouseenter', (e) => {
      const tip = document.createElement('div');
      tip.className = 'skill-tooltip';
      tip.innerHTML = `<strong>${el.dataset.tooltip || el.textContent}</strong><br>Proficiency: ${proficiency}<br>Experience: ${experience}`;
      document.body.appendChild(tip);
      
      const updatePos = (ev) => {
        tip.style.left = (ev.clientX + 15) + 'px';
        tip.style.top = (ev.clientY + 15) + 'px';
      };
      updatePos(e);
      el._tip = tip;
      el.addEventListener('mousemove', updatePos);
    });
    
    el.addEventListener('mouseleave', () => {
      if (el._tip) {
        el._tip.remove();
        el._tip = null;
      }
    });
  });


  /* ══════════════════════════════════════════
   TIMELINE PROGRESS LINE FILL
  ══════════════════════════════════════════ */
  const timelineLine = document.querySelector('.timeline::before');
  const timelineSection2 = document.querySelector('.timeline-section');
  if (timelineSection2 && timelineLine) {
      window.addEventListener('scroll', () => {
          const rect = timelineSection2.getBoundingClientRect();
          const winH = window.innerHeight;
          if (rect.top < winH && rect.bottom > 0) {
              const progress = Math.max(0, Math.min(1, (winH - rect.top) / (rect.height + winH/2)));
              timelineSection2.style.setProperty('--line-fill', (progress * 100) + '%');
          }
      }, { passive: true });
  }


  /* ══════════════════════════════════════════
   NUMBER COUNTER EASTER EGG (Confetti)
  ══════════════════════════════════════════ */
  let finishedCounters = 0;
  const totalCounters = document.querySelectorAll('.counter-card').length;
  
  function triggerEasterEgg() {
      finishedCounters++;
      if (finishedCounters === totalCounters) {
          // Trigger massive confetti
          for (let i = 0; i < 50; i++) {
              setTimeout(() => {
                  const x = Math.random() * window.innerWidth;
                  const y = Math.random() * window.innerHeight;
                  spawnConfetti(x, y);
              }, i * 20);
          }
          if (typeof toast === 'function') toast('fa-grin-stars', 'All Milestones Reached! 🏆', 5000);
      }
  }

  function spawnConfetti(x, y) {
      for (let i = 0; i < 8; i++) {
          const p = document.createElement('div');
          p.className = 'confetti-piece';
          const angle = Math.random() * Math.PI * 2;
          const dist = 50 + Math.random() * 100;
          const dur = 0.5 + Math.random() * 1;
          const color = CONF_COLORS[Math.floor(Math.random() * CONF_COLORS.length)];
          const size = 5 + Math.random() * 8;
          p.style.cssText = `
            left:${x}px; top:${y}px;
            width:${size}px; height:${size}px;
            background:${color};
            --tx:${Math.cos(angle) * dist}px;
            --ty:${Math.sin(angle) * dist}px;
            --dur:${dur}s; --rot:${Math.random() * 720 - 360}deg;
            animation-duration:${dur}s;
          `;
          document.body.appendChild(p);
          setTimeout(() => p.remove(), dur * 1000);
      }
  }

  // Update countUp to notify completion
  const originalCountUp = countUp;
  countUp = function(el, target, ms = 1800) {
      let start = null;
      (function step(ts) {
          if (!start) start = ts;
          const p = Math.min((ts - start) / ms, 1);
          const e = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.floor(e * target);
          if (p < 1) requestAnimationFrame(step);
          else {
              el.textContent = target;
              triggerEasterEgg();
          }
      })(performance.now());
  };


  /* ══════════════════════════════════════════
   PROJECT IMAGE LIGHTBOX
  ══════════════════════════════════════════ */
  const lightbox = document.createElement('div');
  lightbox.id = 'lightbox';
  lightbox.innerHTML = `
      <div class="lightbox-content">
          <img src="" alt="Enlarged Project">
          <button class="lightbox-close"><i class="fas fa-times"></i></button>
          <button class="lightbox-prev"><i class="fas fa-chevron-left"></i></button>
          <button class="lightbox-next"><i class="fas fa-chevron-right"></i></button>
      </div>
  `;
  document.body.appendChild(lightbox);

  const lbImg = lightbox.querySelector('img');
  const projectImgs = Array.from(document.querySelectorAll('.deep-dive-body img, .project-gallery-collage img'));
  let currentLbIdx = 0;

  projectImgs.forEach((img, idx) => {
      img.style.cursor = 'zoom-in';
      img.addEventListener('click', () => {
          currentLbIdx = idx;
          showLightbox(img.src);
      });
  });

  function showLightbox(src) {
      lbImg.src = src;
      lightbox.classList.add('active');
      document.body.style.overflow = 'hidden';
  }

  lightbox.querySelector('.lightbox-close').onclick = () => {
      lightbox.classList.remove('active');
      document.body.style.overflow = '';
  };

  lightbox.querySelector('.lightbox-prev').onclick = (e) => {
      e.stopPropagation();
      currentLbIdx = (currentLbIdx - 1 + projectImgs.length) % projectImgs.length;
      lbImg.src = projectImgs[currentLbIdx].src;
  };

  lightbox.querySelector('.lightbox-next').onclick = (e) => {
      e.stopPropagation();
      currentLbIdx = (currentLbIdx + 1) % projectImgs.length;
      lbImg.src = projectImgs[currentLbIdx].src;
  };

  lightbox.onclick = () => lightbox.querySelector('.lightbox-close').onclick();








  /* ══════════════════════════════════════════
   DEV SIGNATURE
  ══════════════════════════════════════════ */
  console.log('%c⚡ Vikash Portfolio — All animations loaded', 'color:#0ea5e9;font-weight:bold;font-size:12px;');


});
