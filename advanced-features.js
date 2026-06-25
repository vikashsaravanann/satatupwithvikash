// advanced-features.js

// Try/Catch wrapper for features to ensure isolation
const safeRun = (name, fn) => {
    try {
        fn();
    } catch (e) {
        console.error(`Feature Error [${name}]:`, e);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    
    // ==========================================
    // F33: Loading Screen
    // ==========================================
    safeRun('LoadingScreen', () => {
        if (!sessionStorage.getItem('portfolio_loaded')) {
            const lsHTML = `
                <div id="adv-loading-screen">
                    <div class="adv-logo-text">VS</div>
                    <div class="adv-typing-text" id="adv-typing"></div>
                    <div class="adv-progress-container">
                        <div class="adv-progress-bar" id="adv-bar"></div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('afterbegin', lsHTML);
            
            const typing = document.getElementById('adv-typing');
            const bar = document.getElementById('adv-bar');
            const screen = document.getElementById('adv-loading-screen');
            
            const text = "Vikash Saravanan...";
            let i = 0;
            const typeWriter = () => {
                if (i < text.length) {
                    typing.innerHTML += text.charAt(i);
                    i++;
                    setTimeout(typeWriter, 100);
                }
            };
            
            setTimeout(() => { bar.style.width = '100%'; }, 100);
            typeWriter();
            
            setTimeout(() => {
                screen.style.opacity = '0';
                setTimeout(() => screen.remove(), 500);
                sessionStorage.setItem('portfolio_loaded', 'true');
            }, 2500);
        }
    });

    // ==========================================
    // F3: Smart Project Recommender
    // ==========================================
    safeRun('SmartRecommender', () => {
        const createRoleModal = () => {
            const html = `
                <div class="adv-role-modal" id="adv-role-modal">
                    <div class="adv-role-content">
                        <h2 style="color:#0ea5e9; margin-bottom: 20px;">Who are you?</h2>
                        <button class="adv-role-btn" data-role="recruiter">👨‍💼 Recruiter</button>
                        <button class="adv-role-btn" data-role="developer">👨‍💻 Developer</button>
                        <button class="adv-role-btn" data-role="client">🏢 Client</button>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', html);
        };

        createRoleModal();


        const modal = document.getElementById('adv-role-modal');
        const role = localStorage.getItem('visitor_role');
        
        if (!role) {
            modal.classList.add('active');
        }

        const applyHighlight = (roleType) => {
            document.querySelectorAll('.adv-highlight-section').forEach(el => el.classList.remove('adv-highlight-section'));
            
            let targets = [];
            if (roleType === 'recruiter') targets = ['skills', 'competencies', 'certifications', 'about'];
            if (roleType === 'developer') targets = ['projects', 'github'];
            if (roleType === 'client') targets = ['contact', 'services'];
            
            targets.forEach(id => {
                const el = document.getElementById(id) || document.querySelector(`[id*="${id}"]`);
                if (el) {
                    el.classList.add('adv-highlight-section');
                    // auto scroll to first target if triggered manually
                }
            });
            setTimeout(() => {
                document.querySelectorAll('.adv-highlight-section').forEach(el => el.classList.remove('adv-highlight-section'));
            }, 3000);
        };

        document.querySelectorAll('.adv-role-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const r = e.target.getAttribute('data-role');
                localStorage.setItem('visitor_role', r);
                modal.classList.remove('active');
                applyHighlight(r);
            });
        });
    });

    // ==========================================
    // F16: Resume Download Counter
    // ==========================================
    safeRun('ResumeCounter', () => {
        let count = parseInt(localStorage.getItem('resume_download_count') || '0');
        
        // Find resume buttons
        const resumeBtns = document.querySelectorAll('a[download], a[href*="resume"], .resume-btn');
        resumeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                count++;
                localStorage.setItem('resume_download_count', count.toString());
                updateUI();
            });
        });

        const updateUI = () => {
            resumeBtns.forEach(btn => {
                let badge = btn.querySelector('.adv-resume-badge');
                if (!badge) {
                    badge = document.createElement('span');
                    badge.className = 'adv-resume-badge';
                    badge.style.cssText = 'margin-left:8px; font-size:12px; background:rgba(0,0,0,0.3); padding:2px 6px; border-radius:10px;';
                    btn.appendChild(badge);
                }
                badge.innerText = `⬇️ ${count}`;
            });
        };
        updateUI();
    });

    // ==========================================
    // F31 & F32: Keyboard Shortcuts & Print
    // ==========================================
    safeRun('Shortcuts', () => {
        const html = `
            <div id="adv-toast" class="adv-toast"></div>
            <div class="adv-hire-modal" id="adv-shortcuts-modal">
                <div class="adv-hire-content" style="text-align:left;">
                    <button class="adv-hire-close" onclick="document.getElementById('adv-shortcuts-modal').classList.remove('active')">&times;</button>
                    <h2 style="color:#0ea5e9; text-align:center; margin-bottom:20px;">Keyboard Shortcuts</h2>
                    <ul style="list-style:none; padding:0; line-height:2;">
                        <li><kbd class="adv-kbd">H</kbd> Home</li>
                        <li><kbd class="adv-kbd">A</kbd> About</li>
                        <li><kbd class="adv-kbd">P</kbd> Projects</li>
                        <li><kbd class="adv-kbd">S</kbd> Skills</li>
                        <li><kbd class="adv-kbd">C</kbd> Contact</li>
                        <li><kbd class="adv-kbd">G</kbd> GitHub</li>
                        <li><kbd class="adv-kbd">L</kbd> LinkedIn</li>
                        <li><kbd class="adv-kbd">R</kbd> Download Resume</li>
                        <li><kbd class="adv-kbd">Ctrl+Shift+P</kbd> Print Portfolio</li>
                        <li><kbd class="adv-kbd">?</kbd> Help</li>
                    </ul>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', html);

        const toast = document.getElementById('adv-toast');
        let toastT;
        const showToast = (msg) => {
            toast.innerText = msg;
            toast.classList.add('show');
            clearTimeout(toastT);
            toastT = setTimeout(() => toast.classList.remove('show'), 2000);
        };

        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            // Print
            if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'p') {
                e.preventDefault();
                window.print();
                return;
            }
            if (e.ctrlKey || e.metaKey || e.altKey) return;

            const key = e.key.toLowerCase();
            const scrollTo = (id, name) => {
                const el = document.getElementById(id) || document.querySelector(`[id*="${id}"]`);
                if (el) { el.scrollIntoView({behavior:'smooth'}); showToast(`⌨️ Navigating to ${name}...`); }
            };

            switch(key) {
                case 'h': scrollTo('home', 'Home'); break;
                case 'a': scrollTo('summary', 'About'); scrollTo('about', 'About'); break;
                case 'p': scrollTo('projects', 'Projects'); break;
                case 's': scrollTo('skills', 'Skills'); scrollTo('competencies', 'Skills'); break;
                case 'c': scrollTo('contact', 'Contact'); break;
                case 'g': window.open('https://github.com/vikashsaravanann', '_blank'); showToast('⌨️ Opening GitHub'); break;
                case 'l': window.open('https://linkedin.com/in/vikash-saravanan-j7528', '_blank'); showToast('⌨️ Opening LinkedIn'); break;
                case 'r': 
                    const resumeBtn = document.querySelector('a[download]');
                    if (resumeBtn) resumeBtn.click();
                    showToast('⌨️ Downloading Resume'); 
                    break;
                case '?':
                case '/': 
                    document.getElementById('adv-shortcuts-modal').classList.add('active'); 
                    break;
                case 'escape':
                    document.getElementById('adv-shortcuts-modal').classList.remove('active');
                    break;
            }
        });
    });

    // ==========================================
    // F42: Easter Eggs (Konami & VIKASH)
    // ==========================================
    safeRun('EasterEggs', () => {
        // Load canvas-confetti
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.2/dist/confetti.browser.min.js';
        document.head.appendChild(s);

        let konami = ['arrowup','arrowup','arrowdown','arrowdown','arrowleft','arrowright','arrowleft','arrowright','b','a'];
        let konamiPos = 0;
        let nameCode = ['v','i','k','a','s','h'];
        let namePos = 0;

        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            // Konami
            if (e.key.toLowerCase() === konami[konamiPos]) {
                konamiPos++;
                if (konamiPos === konami.length) {
                    konamiPos = 0;
                    activatePartyMode();
                }
            } else { konamiPos = 0; }

            // Name
            if (e.key.toLowerCase() === nameCode[namePos]) {
                namePos++;
                if (namePos === nameCode.length) {
                    namePos = 0;
                    fireConfetti();
                }
            } else { namePos = 0; }
        });

        function fireConfetti() {
            if(window.confetti) {
                confetti({ particleCount: 150, spread: 180, origin: { y: 0.6 }, colors: ['#0ea5e9', '#7c3aed', '#ffffff'] });
                const toast = document.getElementById('adv-toast');
                if(toast) {
                    toast.innerText = "🎉 You found the easter egg! Vikash appreciates you!";
                    toast.classList.add('show');
                    setTimeout(() => toast.classList.remove('show'), 3000);
                }
            }
        }

        function activatePartyMode() {
            document.body.classList.add('party-mode');
            const toast = document.getElementById('adv-toast');
            if(toast) {
                toast.innerText = "🕹️ KONAMI CODE ACTIVATED! Party Mode ON!";
                toast.classList.add('show');
            }
            if(window.confetti) {
                let duration = 5000;
                let animationEnd = Date.now() + duration;
                let interval = setInterval(function() {
                    let timeLeft = animationEnd - Date.now();
                    if (timeLeft <= 0) { return clearInterval(interval); }
                    confetti({ particleCount: 50, spread: 360, origin: { x: Math.random(), y: Math.random() - 0.2 }});
                }, 250);
            }
            setTimeout(() => {
                document.body.classList.remove('party-mode');
                if(toast) toast.classList.remove('show');
            }, 5000);
        }
    });

    // ==========================================
    // F15: Real-time Visitor Map
    // ==========================================
    safeRun('VisitorMap', () => {
        // Find a place to inject. Like contact section or footer
        const target = document.getElementById('contact') || document.querySelector('footer') || document.body;
        
        const html = `
            <div class="adv-map-container">
                <h3 style="color:#0ea5e9; text-align:center; margin-top:0;">Global Reach</h3>
                <p style="text-align:center; font-size:14px; margin-bottom:15px;" id="adv-map-counter">🌍 Loading visitors...</p>
                <div class="adv-map-svg-wrap" id="adv-map-wrap">
                    <!-- Simple inline SVG Map placeholder -->
                    <svg viewBox="0 0 1000 500" style="width:100%; height:100%; fill:#334155;">
                        <rect width="1000" height="500" fill="#0f172a" />
                        <path d="M100,100 Q200,50 300,150 T500,200 T700,100 T900,250 L900,500 L100,500 Z" opacity="0.3"/>
                        <text x="500" y="250" fill="#64748b" text-anchor="middle" font-size="20">World Map View</text>
                    </svg>
                </div>
                <div class="adv-ticker">
                    <div class="adv-ticker-content" id="adv-ticker-content">...</div>
                </div>
            </div>
        `;
        target.insertAdjacentHTML('beforebegin', html);

        // Fetch location
        fetch('https://ipapi.co/json/')
            .then(res => res.json())
            .then(data => {
                if (data.city) {
                    let visitors = JSON.parse(localStorage.getItem('portfolio_visitors') || '[]');
                    const newV = { city: data.city, country: data.country_name, lat: data.latitude, lon: data.longitude, t: Date.now() };
                    // Avoid duplicate immediately
                    if(visitors.length === 0 || visitors[visitors.length-1].city !== newV.city) {
                        visitors.push(newV);
                        if (visitors.length > 100) visitors.shift();
                        localStorage.setItem('portfolio_visitors', JSON.stringify(visitors));
                    }
                    
                    document.getElementById('adv-map-counter').innerText = `🌍 Visited from ${new Set(visitors.map(v=>v.country)).size} countries`;
                    
                    const tickerText = visitors.slice(-10).reverse().map(v => `Someone from ${v.city}, ${v.country} just visited`).join(' • ');
                    document.getElementById('adv-ticker-content').innerText = tickerText;

                    // Plot dots
                    const wrap = document.getElementById('adv-map-wrap');
                    visitors.forEach(v => {
                        if(v.lat && v.lon) {
                            // Rough projection mapping
                            const x = (v.lon + 180) * (1000 / 360);
                            const y = (90 - v.lat) * (500 / 180);
                            const dot = document.createElement('div');
                            dot.className = 'adv-map-dot';
                            dot.style.left = `${(x/1000)*100}%`;
                            dot.style.top = `${(y/500)*100}%`;
                            wrap.appendChild(dot);
                        }
                    });
                }
            }).catch(e => console.log('Map fetch error', e));
    });

    // ==========================================
    // F46 & F48: Mobile Nav & Shake
    // ==========================================
    safeRun('MobileFeatures', () => {
        // Only if touch device
        if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
            
            // F46 Swipe
            const sections = Array.from(document.querySelectorAll('section'));
            if(sections.length > 0) {
                let dotsHtml = '<div class="adv-swipe-dots">';
                sections.forEach((_, i) => { dotsHtml += `<div class="adv-dot ${i===0?'active':''}" id="adv-dot-${i}"></div>`; });
                dotsHtml += '</div>';
                document.body.insertAdjacentHTML('beforeend', dotsHtml);

                let startX = 0;
                let currentIdx = 0;

                const updateDots = () => {
                    document.querySelectorAll('.adv-dot').forEach((d,i) => {
                        d.classList.toggle('active', i === currentIdx);
                    });
                };

                // Track scroll to update dot
                window.addEventListener('scroll', () => {
                    let minD = Infinity;
                    let bestIdx = 0;
                    sections.forEach((s, i) => {
                        const rect = s.getBoundingClientRect();
                        const d = Math.abs(rect.top);
                        if (d < minD) { minD = d; bestIdx = i; }
                    });
                    if(bestIdx !== currentIdx) {
                        currentIdx = bestIdx;
                        updateDots();
                    }
                }, {passive:true});

                document.addEventListener('touchstart', e => startX = e.touches[0].clientX, {passive:true});
                document.addEventListener('touchend', e => {
                    const diffX = startX - e.changedTouches[0].clientX;
                    if (Math.abs(diffX) > 80) {
                        if (diffX > 0 && currentIdx < sections.length - 1) currentIdx++; // swipe left (next)
                        else if (diffX < 0 && currentIdx > 0) currentIdx--; // swipe right (prev)
                        sections[currentIdx].scrollIntoView({behavior: 'smooth'});
                        updateDots();
                    }
                }, {passive:true});

                if(!sessionStorage.getItem('swipe_hint_shown')) {
                    const toast = document.getElementById('adv-toast');
                    if(toast) {
                        toast.innerText = "👆 Swipe left/right to navigate sections";
                        toast.classList.add('show');
                        setTimeout(() => toast.classList.remove('show'), 3000);
                        sessionStorage.setItem('swipe_hint_shown', 'true');
                    }
                }
            }

            // F48 Shake to contact
            let lastUpdate = 0;
            let lastX = 0, lastY = 0, lastZ = 0;
            window.addEventListener('devicemotion', (e) => {
                const acc = e.accelerationIncludingGravity;
                if(!acc) return;
                const currTime = Date.now();
                if((currTime - lastUpdate) > 100) {
                    const diffTime = currTime - lastUpdate;
                    lastUpdate = currTime;
                    const speed = Math.abs(acc.x + acc.y + acc.z - lastX - lastY - lastZ) / diffTime * 10000;
                    if (speed > 15) { // Shake detected
                        // Debounce logic
                        if(!window.isShaking) {
                            window.isShaking = true;
                            if(navigator.vibrate) navigator.vibrate(200);
                            const m = document.getElementById('adv-hire-modal');
                            if(m) m.classList.add('active');
                            setTimeout(() => { window.isShaking = false; }, 2000);
                        }
                    }
                    lastX = acc.x; lastY = acc.y; lastZ = acc.z;
                }
            }, false);

            if(!sessionStorage.getItem('shake_hint_shown')) {
                setTimeout(() => {
                    const toast = document.getElementById('adv-toast');
                    if(toast) {
                        toast.innerText = "📳 Tip: Shake your phone to quickly contact Vikash!";
                        toast.classList.add('show');
                        setTimeout(() => toast.classList.remove('show'), 3000);
                        sessionStorage.setItem('shake_hint_shown', 'true');
                    }
                }, 4000);
            }
        }
    });
});

// PWA Install Prompt
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    if(!sessionStorage.getItem('pwa_prompt_dismissed')) {
        const btnHtml = `<button id="pwa-install-btn" style="position:fixed; bottom:20px; right:100px; z-index:9999; background:#0ea5e9; color:#fff; border:none; padding:10px 20px; border-radius:8px; font-weight:bold; cursor:pointer; box-shadow:0 4px 15px rgba(0,0,0,0.3);">📲 Install App</button>`;
        document.body.insertAdjacentHTML('beforeend', btnHtml);
        
        const btn = document.getElementById('pwa-install-btn');
        btn.addEventListener('click', async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                if (outcome === 'accepted') {
                    btn.remove();
                }
                deferredPrompt = null;
            }
        });
        
        // Also add a close button to dismiss
        const closeHtml = `<button id="pwa-install-close" style="position:fixed; bottom:40px; right:85px; z-index:10000; background:#1e293b; color:#fff; border:none; border-radius:50%; width:20px; height:20px; cursor:pointer; font-size:12px;">&times;</button>`;
        document.body.insertAdjacentHTML('beforeend', closeHtml);
        document.getElementById('pwa-install-close').addEventListener('click', () => {
            btn.remove();
            document.getElementById('pwa-install-close').remove();
            sessionStorage.setItem('pwa_prompt_dismissed', 'true');
        });
    }
});
