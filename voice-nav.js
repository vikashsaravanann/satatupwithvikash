// voice-nav.js

document.addEventListener('DOMContentLoaded', () => {
    // Inject UI Elements
    const voiceNavHTML = `
        <button id="voice-nav-btn" aria-label="Voice Commands">
            <i class="fa-solid fa-microphone-lines"></i>
        </button>
        <div class="vn-listening-label" id="vn-listening-label">
            <span class="vn-pulse-dot"></span> Listening... speak now
        </div>
        <div id="vn-toast">
            <span id="vn-toast-icon">🎤</span>
            <span id="vn-toast-text">Listening...</span>
        </div>
        <div id="vn-help-panel">
            <div class="vn-help-header">
                <h3>Voice Commands Help</h3>
                <button class="vn-help-close" id="vn-help-close">&times;</button>
            </div>
            <div class="vn-help-content">
                <div class="vn-help-item"><div class="vn-help-command">"home" / "top"</div><div class="vn-help-action">Scroll to top</div></div>
                <div class="vn-help-item"><div class="vn-help-command">"about" / "who are you"</div><div class="vn-help-action">Go to About section</div></div>
                <div class="vn-help-item"><div class="vn-help-command">"projects" / "my work"</div><div class="vn-help-action">Go to Projects section</div></div>
                <div class="vn-help-item"><div class="vn-help-command">"skills" / "tech stack"</div><div class="vn-help-action">Go to Skills section</div></div>
                <div class="vn-help-item"><div class="vn-help-command">"certifications"</div><div class="vn-help-action">Go to Certifications</div></div>
                <div class="vn-help-item"><div class="vn-help-command">"contact" / "reach out"</div><div class="vn-help-action">Go to Contact section</div></div>
                <div class="vn-help-item"><div class="vn-help-command">"github"</div><div class="vn-help-action">Open GitHub profile</div></div>
                <div class="vn-help-item"><div class="vn-help-command">"linkedin"</div><div class="vn-help-action">Open LinkedIn profile</div></div>
                <div class="vn-help-item"><div class="vn-help-command">"download resume"</div><div class="vn-help-action">Download PDF Resume</div></div>
                <div class="vn-help-item"><div class="vn-help-command">"help" / "commands"</div><div class="vn-help-action">Show this help panel</div></div>
                <div class="vn-help-item"><div class="vn-help-command">"stop" / "cancel"</div><div class="vn-help-action">Stop listening</div></div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', voiceNavHTML);

    const btn = document.getElementById('voice-nav-btn');
    const toast = document.getElementById('vn-toast');
    const toastText = document.getElementById('vn-toast-text');
    const listeningLabel = document.getElementById('vn-listening-label');
    const helpPanel = document.getElementById('vn-help-panel');
    const helpClose = document.getElementById('vn-help-close');

    // Speech API setup
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const synth = window.speechSynthesis;
    let recognition = null;
    let isListening = false;
    let toastTimeout = null;

    if (!SpeechRecognition) {
        btn.style.display = 'none';
        showToast("Voice commands not supported in this browser. Try Chrome.");
        return;
    }

    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-IN'; // Indian English

    let selectedVoice = null;
    
    // Load voices and select a female voice
    function loadVoices() {
        const voices = synth.getVoices();
        if (!voices.length) return;
        
        // Try to find a high-quality female voice
        selectedVoice = voices.find(v => 
            v.name.includes('Samantha') || 
            v.name.includes('Victoria') || 
            v.name.includes('Karen') || 
            v.name.includes('Tessa') || 
            v.name.includes('Google UK English Female') ||
            (v.name.includes('Female') && v.lang.startsWith('en'))
        ) || voices.find(v => v.lang === 'en-US' || v.lang === 'en-GB') || voices[0];
        
        console.log("🎙️ AI Voice selected:", selectedVoice ? selectedVoice.name : "Default");
    }
    
    // Voices are loaded asynchronously in some browsers
    loadVoices();
    if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = loadVoices;
    }

    // Speak helper
    function speak(text) {
        if (synth.speaking) {
            synth.cancel();
        }
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        if (selectedVoice) {
            utterance.voice = selectedVoice;
        }
        utterance.rate = 1.0;
        utterance.pitch = 1.1; // Slightly higher pitch for female tuning if default
        synth.speak(utterance);
    }

    // Toast helper
    function showToast(message, duration = 2500) {
        toastText.innerHTML = message;
        toast.classList.add('show');
        if (toastTimeout) clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => {
            toast.classList.remove('show');
        }, duration);
    }

    function toggleListening() {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    }

    function startListening() {
        try {
            recognition.start();
            isListening = true;
            btn.classList.add('listening');
            listeningLabel.classList.add('active');
            if (synth.speaking) synth.cancel();
        } catch (e) {
            console.error(e);
        }
    }

    function stopListening() {
        isListening = false;
        recognition.stop();
        btn.classList.remove('listening');
        btn.classList.remove('processing');
        listeningLabel.classList.remove('active');
    }

    // Long press logic for help panel
    let pressTimer;
    btn.addEventListener('mousedown', () => {
        pressTimer = window.setTimeout(() => {
            toggleHelp();
        }, 3000);
    });
    btn.addEventListener('mouseup', () => {
        clearTimeout(pressTimer);
    });
    btn.addEventListener('mouseleave', () => {
        clearTimeout(pressTimer);
    });
    // For touch devices
    btn.addEventListener('touchstart', () => {
        pressTimer = window.setTimeout(() => {
            toggleHelp();
        }, 3000);
    }, {passive: true});
    btn.addEventListener('touchend', () => {
        clearTimeout(pressTimer);
    });

    btn.addEventListener('click', () => {
        toggleListening();
    });

    function toggleHelp() {
        if (helpPanel.classList.contains('active')) {
            helpPanel.classList.remove('active');
        } else {
            helpPanel.classList.add('active');
            speak("Here are the available voice commands.");
        }
    }

    helpClose.addEventListener('click', () => {
        helpPanel.classList.remove('active');
    });

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript.toLowerCase().trim();
        btn.classList.remove('listening');
        btn.classList.add('processing');
        listeningLabel.classList.remove('active');
        
        handleCommand(transcript);
        
        setTimeout(() => {
            btn.classList.remove('processing');
            if (isListening) {
                // Restart if still in listening mode and not stopped by command
                startListening();
            }
        }, 1000);
    };

    recognition.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        if (event.error === 'not-allowed') {
            showToast("Microphone access denied.");
            stopListening();
        }
        btn.classList.remove('listening');
        listeningLabel.classList.remove('active');
    };

    recognition.onend = () => {
        if (isListening && !btn.classList.contains('processing')) {
            startListening();
        } else if (!isListening) {
            btn.classList.remove('listening');
            listeningLabel.classList.remove('active');
        }
    };

    // Scroll helper with offset
    function scrollToSection(id, keyword) {
        let el = document.getElementById(id);
        
        // Fallbacks based on ID names common in the portfolio
        if (!el && id === 'about') el = document.getElementById('summary');
        if (!el && id === 'skills') el = document.getElementById('competencies');
        
        // Fallback: search headings
        if (!el) {
            const headings = Array.from(document.querySelectorAll('h1, h2, h3'));
            const found = headings.find(h => h.textContent.toLowerCase().includes(keyword));
            if (found) el = found.closest('section') || found;
        }

        if (el) {
            const y = el.getBoundingClientRect().top + window.scrollY - 80;
            window.scrollTo({ top: y, behavior: 'smooth' });
            return true;
        }
        return false;
    }

    function handleCommand(cmd) {
        let found = true;

        if (cmd.includes('home') || cmd.includes('top')) {
            speak("Navigating to top.");
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else if (cmd.includes('about') || cmd.includes('who are you')) {
            speak("Navigating to about.");
            scrollToSection('about', 'about');
        } else if (cmd.includes('project') || cmd.includes('my work')) {
            speak("Navigating to projects.");
            if (window.location.pathname.includes('projects.html')) {
                scrollToSection('projects', 'portfolio');
            } else {
                const scrolled = scrollToSection('projects', 'project');
                if (!scrolled) window.location.href = 'projects.html';
            }
        } else if (cmd.includes('skill') || cmd.includes('tech stack')) {
            speak("Navigating to skills.");
            scrollToSection('skills', 'skill');
        } else if (cmd.includes('certificat')) {
            speak("Navigating to certifications.");
            if (window.location.pathname.includes('certifications.html')) {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                const scrolled = scrollToSection('certifications', 'certificat');
                if (!scrolled) window.location.href = 'certifications.html';
            }
        } else if (cmd.includes('contact') || cmd.includes('reach out')) {
            speak("Navigating to contact.");
            scrollToSection('contact', 'contact');
        } else if (cmd.includes('github')) {
            speak("Opening GitHub profile.");
            window.open('https://github.com/vikashsaravanann', '_blank');
        } else if (cmd.includes('linkedin')) {
            speak("Opening LinkedIn profile.");
            window.open('https://linkedin.com/in/vikash-saravanan-j7528', '_blank');
        } else if (cmd.includes('download resume') || cmd.includes('get resume')) {
            if (typeof generateResumePDF === 'function') {
                generateResumePDF();
            } else {
                const resumeBtn = document.querySelector('a[download]');
                if (resumeBtn) resumeBtn.click();
                else scrollToSection('summary', 'about');
            }
            speak("Downloading resume.");
        } else if (cmd.includes('dark mode') || cmd.includes('light mode')) {
            speak("Toggling theme.");
            // Try common theme toggles
            const themeBtn = document.getElementById('themeToggle') || document.querySelector('.theme-toggle');
            if (themeBtn) themeBtn.click();
            else speak("Theme toggle not found.");
            speak("Toggling theme.");
        } else if (cmd.includes('help') || cmd.includes('what can you do') || cmd.includes('commands')) {
            helpPanel.classList.add('active');
            speak("Here are the commands you can use. You can say home, about, projects, skills, contact, or stop.");
        } else if (cmd.includes('clear') || cmd.includes('stop')) {
            speak("Stopping voice navigation.");
            stopListening();
            helpPanel.classList.remove('active');
        } else {
            speak("Sorry, I didn't catch that command.");
        }
    }

    // Integration with face assistant (if it triggers globally)
    // We can expose a global method that face-assistant can call if modified later
    window.activateVoiceCommandsFromFaceAssistant = function(isOwner) {
        if (isOwner) {
            speak("Voice commands activated, Vikash. Say 'help' to hear what I can do.");
            setTimeout(() => {
                startListening();
            }, 3000); // Wait for face assistant TTS
        } else {
            // Optional: Activate for visitor
            // startListening();
        }
    }
});
