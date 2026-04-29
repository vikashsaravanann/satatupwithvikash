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


  /* ══════════════════════════════════════════
   2. NOISE GRAIN OVERLAY
  ══════════════════════════════════════════ */
  const grain = document.createElement('div');
  grain.id = 'grain-overlay';
  document.body.appendChild(grain);


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
    const count = 14;
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
        box-shadow:0 0 6px ${color};
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
    const n = Math.floor(canvas.width * canvas.height / 15000);
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
   9. HOLOGRAPHIC SHIMMER on project cards
  ══════════════════════════════════════════ */
  document.querySelectorAll('.deep-dive-card, .cert-badge-card, .bento-card').forEach(card => {
    card.classList.add('holo-card');
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--hx', ((e.clientX - r.left) / r.width * 100) + '%');
      card.style.setProperty('--hy', ((e.clientY - r.top)  / r.height * 100) + '%');
    });
  });


  /* ══════════════════════════════════════════
   10. SPOTLIGHT CARD (mouse-follow light)
  ══════════════════════════════════════════ */
  document.querySelectorAll('.deep-dive-card,.skill-card,.widget-card,.summary-box,.counter-card').forEach(card => {
    card.classList.add('spotlight-card');
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--sx', (e.clientX - r.left) + 'px');
      card.style.setProperty('--sy', (e.clientY - r.top)  + 'px');
    });
  });


  /* ══════════════════════════════════════════
   11. 3D TILT on project cards
  ══════════════════════════════════════════ */
  document.querySelectorAll('.deep-dive-card').forEach(card => {
    card.classList.add('tilt-card','scan-card');
    card.addEventListener('mousemove', e => {
      const r  = card.getBoundingClientRect();
      const rx = ((e.clientY - r.top  - r.height/2) / (r.height/2)) * -7;
      const ry = ((e.clientX - r.left - r.width/2)  / (r.width/2))  *  7;
      card.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(8px)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateZ(0)';
    });
  });


  /* ══════════════════════════════════════════
   12. PARALLAX HERO IMAGES (mouse track)
  ══════════════════════════════════════════ */
  const sideProfiles = document.querySelectorAll('.side-profile');
  const mainProfile  = document.querySelector('.profile-image-container.floating');
  document.addEventListener('mousemove', e => {
    const cx = window.innerWidth  / 2;
    const cy = window.innerHeight / 2;
    const dx = (e.clientX - cx) / cx;
    const dy = (e.clientY - cy) / cy;
    sideProfiles.forEach(el => {
      el.style.transform = `translateY(${dy * -12}px) translateX(${dx * -8}px)`;
    });
    if (mainProfile) {
      mainProfile.style.marginTop = (dy * -6) + 'px';
    }
  });


  /* ══════════════════════════════════════════
   13. MAGNETIC BUTTONS
  ══════════════════════════════════════════ */
  document.querySelectorAll('.btn-primary,.btn-secondary,.btn-primary-sm').forEach(btn => {
    btn.addEventListener('mousemove', e => {
      const r  = btn.getBoundingClientRect();
      const dx = (e.clientX - r.left - r.width/2)  * .38;
      const dy = (e.clientY - r.top  - r.height/2) * .38;
      btn.style.transform = `translate(${dx}px,${dy}px)`;
    });
    btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
  });


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
              <div class="counter-number" data-target="9">0</div>
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

});
