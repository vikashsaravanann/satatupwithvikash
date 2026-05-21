document.addEventListener('DOMContentLoaded', () => {
    
    // Navbar Scroll Effect
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Hamburger Menu Toggle
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.getElementById('navLinks');
    if (navToggle) {
        navToggle.addEventListener('click', () => {
            document.body.classList.toggle('nav-open');
        });
        // Close menu when a link is clicked
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                document.body.classList.remove('nav-open');
            });
        });
    }



    // Project Filtering
    const filterBtns = document.querySelectorAll('.filter-btn');
    const projectCards = document.querySelectorAll('.deep-dive-card[data-category]');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const filter = btn.dataset.filter;
            projectCards.forEach(card => {
                const categories = card.dataset.category.split(' ');
                if (filter === 'all' || categories.includes(filter)) {
                    card.classList.remove('hidden');
                } else {
                    card.classList.add('hidden');
                }
            });
        });
    });



    // Intersection Observer for Fade-up and Fade-left Animations
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
        let delay = 0;
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Apply a staggered delay
                entry.target.style.transitionDelay = `${delay}s`;
                entry.target.classList.add('visible');
                delay += 0.15;
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const animatedElements = document.querySelectorAll('.fade-up, .fade-left');
    animatedElements.forEach(el => observer.observe(el));

    // Intersection Observer for Skill Progress Bars
    const progressObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const progressBar = entry.target;
                const targetWidth = progressBar.getAttribute('data-progress');
                progressBar.style.width = `${targetWidth}%`;
                observer.unobserve(progressBar);
            }
        });
    }, observerOptions);

    const progressBars = document.querySelectorAll('.skill-progress');
    progressBars.forEach(bar => progressObserver.observe(bar));

    // ==============================
    // MULTI-CHANNEL CONTACT FORM
    // EmailJS (real email) + WhatsApp + SMS
    // ==============================

    // Initialize EmailJS with public key
    if (typeof emailjs !== 'undefined') {
        emailjs.init('vikash_portfolio_key'); // Will be replaced with real key
    }

    // Toast notification helper
    function showContactToast(message, isError) {
        let toast = document.querySelector('.contact-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.className = 'contact-toast';
            document.body.appendChild(toast);
        }
        toast.innerHTML = `<i class="fas ${isError ? 'fa-exclamation-circle' : 'fa-check-circle'}"></i> ${message}`;
        if (isError) {
            toast.style.background = 'linear-gradient(135deg, #dc2626, #ef4444)';
            toast.style.boxShadow = '0 8px 30px rgba(220, 38, 38, 0.4)';
        } else {
            toast.style.background = 'linear-gradient(135deg, #059669, #10b981)';
            toast.style.boxShadow = '0 8px 30px rgba(5, 150, 105, 0.4)';
        }
        setTimeout(() => toast.classList.add('show'), 50);
        setTimeout(() => {
            toast.classList.remove('show');
        }, 4500);
    }

    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = document.getElementById('contactSubmitBtn');
            const btnContent = submitBtn.querySelector('.btn-content');
            const btnLoader = submitBtn.querySelector('.btn-loader');
            submitBtn.disabled = true;
            btnContent.style.display = 'none';
            btnLoader.style.display = 'inline-flex';

            const name = document.getElementById('cf-name').value.trim();
            const email = document.getElementById('cf-email').value.trim();
            const phone = document.getElementById('cf-phone') ? document.getElementById('cf-phone').value.trim() : '';
            const subject = document.getElementById('cf-subject') ? document.getElementById('cf-subject').value : 'General Inquiry';
            const message = document.getElementById('cf-message').value.trim();

            const messageBody = `Hi Vikash,\n\nNew inquiry from your portfolio website.\n\nName: ${name}\nEmail: ${email}\nPhone: ${phone || 'Not provided'}\nSubject: ${subject}\n\nMessage:\n${message}`;
            const encodedBody = encodeURIComponent(messageBody);
            const encodedSubject = encodeURIComponent(subject);

            let emailSent = false;

            // 1. EmailJS — Real Email Delivery (lands in your inbox)
            if (typeof emailjs !== 'undefined') {
                try {
                    await emailjs.send('service_portfolio', 'template_contact', {
                        from_name: name,
                        from_email: email,
                        phone: phone || 'Not provided',
                        subject: subject,
                        message: message,
                        to_email: 'vikash07052008@gmail.com'
                    });
                    emailSent = true;
                } catch (err) {
                    console.warn('EmailJS delivery failed:', err);
                }
            }

            // 2. WhatsApp Trigger
            window.open(`https://wa.me/919342877474?text=${encodedBody}`, '_blank');

            // 3. SMS Trigger (with slight delay to avoid conflict)
            setTimeout(() => {
                window.open(`sms:+919342877474?body=${encodedBody}`, '_blank');
            }, 600);

            // Show success feedback
            contactForm.reset();
            btnLoader.style.display = 'none';
            btnContent.style.display = 'inline-flex';
            submitBtn.disabled = false;

            if (emailSent) {
                showContactToast('Message sent to all 3 channels — WhatsApp, Email & SMS!', false);
            } else {
                showContactToast('WhatsApp & SMS launched! Email will open in your mail app.', false);
                // Fallback: Open default email client
                setTimeout(() => {
                    window.location.href = `mailto:vikash07052008@gmail.com?subject=${encodedSubject}&body=${encodedBody}`;
                }, 800);
            }
        });
    }

    // Typewriter effect for Hero section
    const typewriterElement = document.querySelector('.typewriter');
    const words = ["Data Analyst", "Data Scientist", "AI Engineer"];
    let wordIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let typeSpeed = 100;

    function typeEffect() {
        const currentWord = words[wordIndex];
        
        if (isDeleting) {
            typewriterElement.textContent = currentWord.substring(0, charIndex - 1);
            charIndex--;
            typeSpeed = 50;
        } else {
            typewriterElement.textContent = currentWord.substring(0, charIndex + 1);
            charIndex++;
            typeSpeed = 100;
        }

        if (!isDeleting && charIndex === currentWord.length) {
            isDeleting = true;
            typeSpeed = 2000; // Pause at end of word
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            wordIndex = (wordIndex + 1) % words.length;
            typeSpeed = 500; // Pause before typing next word
        }

        setTimeout(typeEffect, typeSpeed);
    }

    // Start typewriter effect
    setTimeout(typeEffect, 1000);

    // Smooth scrolling for anchor links (fallback for browsers without CSS smooth scroll)
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const navHeight = document.querySelector('.navbar').offsetHeight;
                const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navHeight;
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
});
