// face-assistant.js

document.addEventListener('DOMContentLoaded', () => {
    // 1. Inject UI Elements into DOM
    const assistantHTML = `
        <button id="face-assistant-btn" aria-label="Portfolio AI Assistant">
            🤖
        </button>
        <div id="face-assistant-panel">
            <div class="fa-panel-header">
                <h3><i class="fas fa-robot"></i> AI Assistant</h3>
                <button class="fa-close-btn" id="fa-close-btn">&times;</button>
            </div>
            
            <div class="fa-webcam-container">
                <video id="fa-video" autoplay muted playsinline></video>
                <canvas id="fa-canvas"></canvas>
                
                <div id="fa-overlay" class="fa-overlay active">
                    <h4 id="fa-overlay-title">Loading AI Models...</h4>
                    <p id="fa-overlay-desc">Please wait while the vision models initialize.</p>
                    <button id="fa-register-btn" style="display: none;">Register Owner Face</button>
                    <button id="fa-continue-btn" class="btn-primary" style="display: none; padding: 8px 16px; margin-top: 10px; border-radius: 8px;">Start Chat</button>
                </div>
            </div>
            
            <div class="fa-status-bar" id="fa-status">Initializing...</div>
            
            <div class="fa-chat-container">
                <div class="fa-chat-messages" id="fa-chat-messages">
                    <!-- Chat messages will appear here -->
                </div>
                <div class="fa-chat-input-area">
                    <input type="text" id="fa-input" placeholder="Ask me something..." autocomplete="off">
                    <button id="fa-send-btn"><i class="fas fa-paper-plane"></i></button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', assistantHTML);

    // Load face-api.js script dynamically
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js';
    script.onload = initializeAssistant;
    document.body.appendChild(script);

    // Knowledge Base
    const KB = {
        name: "Vikash Saravanan J",
        role: "B.Tech AI & Data Science Student (Class of 2029)",
        education: "Rathinam Technical Campus, Coimbatore",
        companies: "Founder & CEO of HearWise Technologies (health-tech SaaS) and Logic Intelligence Technologies Pvt. Ltd. (web development)",
        skills: "React, TypeScript, Vite, Tailwind CSS, Supabase, Framer Motion, Next.js, Python, Node.js, HTML, CSS, JavaScript",
        achievements: "Meta PyTorch OpenEnv Hackathon Finalist",
        portfolio: "https://vikashsaravanann.github.io/Portfolio_Information/",
        github: "https://github.com/vikashsaravanann",
        linkedin: "https://linkedin.com/in/vikash-saravanan-j7528",
        instagram: "@startupwithVikash",
        email: "vikash07052008@gmail.com",
        location: "Coimbatore, Tamil Nadu, India"
    };

    let modelsLoaded = false;
    let stream = null;
    let detectionInterval = null;
    let isOwner = false;
    let isChatActive = false;

    // UI References
    const btn = document.getElementById('face-assistant-btn');
    const panel = document.getElementById('face-assistant-panel');
    const closeBtn = document.getElementById('fa-close-btn');
    const video = document.getElementById('fa-video');
    const canvas = document.getElementById('fa-canvas');
    const status = document.getElementById('fa-status');
    const overlay = document.getElementById('fa-overlay');
    const overlayTitle = document.getElementById('fa-overlay-title');
    const overlayDesc = document.getElementById('fa-overlay-desc');
    const registerBtn = document.getElementById('fa-register-btn');
    const continueBtn = document.getElementById('fa-continue-btn');
    
    const chatMessages = document.getElementById('fa-chat-messages');
    const chatInput = document.getElementById('fa-input');
    const sendBtn = document.getElementById('fa-send-btn');

    // Speech Synthesis
    const synth = window.speechSynthesis;

    function speak(text) {
        if (synth.speaking) {
            synth.cancel();
        }
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1;
        utterance.pitch = 1;
        synth.speak(utterance);
    }

    async function initializeAssistant() {
        try {
            // Load models
            const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';
            await Promise.all([
                faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
                faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
            ]);
            modelsLoaded = true;
            status.textContent = "Ready. Click the robot to start.";
            overlayTitle.textContent = "Models Ready";
            overlayDesc.textContent = "Click 'Start' to activate camera.";
            overlay.classList.remove('active');
            
            btn.addEventListener('click', togglePanel);
            closeBtn.addEventListener('click', closePanel);
        } catch (error) {
            console.error("Face API loading error:", error);
            status.textContent = "Error loading vision models.";
            overlayTitle.textContent = "Loading Error";
            overlayDesc.textContent = "Could not load AI models. Please check your connection.";
        }
    }

    async function startVideo() {
        try {
            stream = await navigator.mediaDevices.getUserMedia({ video: {} });
            video.srcObject = stream;
            
            video.onloadedmetadata = () => {
                const displaySize = { width: video.clientWidth, height: video.clientHeight };
                faceapi.matchDimensions(canvas, displaySize);
                status.textContent = "Scanning...";
                overlay.classList.remove('active');
                detectFace(displaySize);
            };
        } catch (err) {
            console.error("Camera access denied:", err);
            status.textContent = "Camera access denied.";
            overlay.classList.add('active');
            overlayTitle.textContent = "Camera Required";
            overlayDesc.textContent = "Please allow camera access to use the assistant.";
        }
    }

    function stopVideo() {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            stream = null;
        }
        if (detectionInterval) {
            clearInterval(detectionInterval);
        }
        if (synth.speaking) synth.cancel();
    }

    function togglePanel() {
        if (panel.classList.contains('active')) {
            closePanel();
        } else {
            openPanel();
        }
    }

    function openPanel() {
        panel.classList.add('active');
        if (modelsLoaded) {
            startVideo();
        }
    }

    function closePanel() {
        panel.classList.remove('active');
        stopVideo();
        isChatActive = false;
        chatMessages.innerHTML = ''; // Clear chat
    }

    async function detectFace(displaySize) {
        // Look for stored descriptor
        const storedDescriptorData = localStorage.getItem('vikash_face_descriptor');
        let ownerDescriptor = null;
        
        if (storedDescriptorData) {
            try {
                const parsed = JSON.parse(storedDescriptorData);
                ownerDescriptor = new Float32Array(Object.values(parsed));
            } catch (e) {
                console.error("Error parsing stored descriptor", e);
            }
        }

        detectionInterval = setInterval(async () => {
            if (isChatActive) return; // Stop scanning once chat starts

            const detection = await faceapi.detectSingleFace(video).withFaceLandmarks().withFaceDescriptor();
            
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            if (detection) {
                const resizedDetection = faceapi.resizeResults(detection, displaySize);
                faceapi.draw.drawDetections(canvas, resizedDetection);
                status.textContent = "Face Detected. Identifying...";

                if (ownerDescriptor) {
                    const distance = faceapi.euclideanDistance(detection.descriptor, ownerDescriptor);
                    if (distance < 0.5) {
                        handleRecognition(true);
                    } else {
                        handleRecognition(false);
                    }
                } else {
                    // No owner registered yet
                    status.textContent = "No owner registered.";
                    overlay.classList.add('active');
                    overlayTitle.textContent = "Setup Required";
                    overlayDesc.textContent = "No owner face registered. You can register now or proceed as visitor.";
                    registerBtn.style.display = 'block';
                    continueBtn.style.display = 'block';
                    
                    registerBtn.onclick = () => registerOwnerFace(displaySize);
                    continueBtn.onclick = () => {
                        registerBtn.style.display = 'none';
                        continueBtn.style.display = 'none';
                        handleRecognition(false);
                    };
                    
                    clearInterval(detectionInterval);
                }
            } else {
                status.textContent = "Scanning...";
            }
        }, 500);
    }

    async function registerOwnerFace(displaySize) {
        registerBtn.style.display = 'none';
        continueBtn.style.display = 'none';
        overlayTitle.textContent = "Registering...";
        overlayDesc.textContent = "Please look at the camera. Capturing frames...";
        
        let descriptors = [];
        let framesCaptured = 0;

        const regInterval = setInterval(async () => {
            const detection = await faceapi.detectSingleFace(video).withFaceLandmarks().withFaceDescriptor();
            
            if (detection) {
                descriptors.push(detection.descriptor);
                framesCaptured++;
                overlayDesc.textContent = `Capturing frames... (${framesCaptured}/5)`;
                
                if (framesCaptured >= 5) {
                    clearInterval(regInterval);
                    
                    // Average the descriptors
                    const avgDescriptor = new Float32Array(128);
                    for (let i = 0; i < 128; i++) {
                        let sum = 0;
                        for (let j = 0; j < 5; j++) {
                            sum += descriptors[j][i];
                        }
                        avgDescriptor[i] = sum / 5;
                    }

                    localStorage.setItem('vikash_face_descriptor', JSON.stringify(Array.from(avgDescriptor)));
                    
                    overlayTitle.textContent = "Owner face registered! ✅";
                    overlayDesc.textContent = "You're all set, Vikash.";
                    
                    setTimeout(() => {
                        overlay.classList.remove('active');
                        handleRecognition(true);
                    }, 2000);
                }
            }
        }, 500);
    }

    function handleRecognition(isOwnerMatch) {
        isChatActive = true;
        isOwner = isOwnerMatch;
        clearInterval(detectionInterval);
        
        // Clear canvas
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        overlay.classList.add('active');
        const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const today = new Date().toLocaleDateString('en-US', dateOptions);

        let ttsText = "";
        let initialChatMsg = "";

        if (isOwner) {
            status.textContent = "Recognised ✅ (Owner)";
            overlayTitle.textContent = "Welcome back, Vikash Saravanan! 👋";
            overlayDesc.textContent = `Today is ${today}.\\nReady to build something amazing today?`;
            
            ttsText = `Hello Vikash Saravanan! Welcome back. Today is ${today}. How can I assist you today?`;
            initialChatMsg = "I'm your Portfolio Assistant. I manage your portfolio and can help you update it, check your projects, or anything else you need.";
        } else {
            status.textContent = "Visitor Detected 👋";
            overlayTitle.textContent = "Hello there! 👋 Welcome to Vikash Saravanan's Portfolio";
            overlayDesc.textContent = "Feel free to ask me questions about Vikash.";
            
            ttsText = "Hello! Welcome. I'm the Portfolio Assistant for Vikash Saravanan. You can ask me anything about Vikash — his projects, skills, experience, or how to contact him.";
            initialChatMsg = "Hi! I'm Vikash's Portfolio Assistant. Feel free to ask me anything about Vikash Saravanan — his skills, projects, education, startups, or how to reach him!";
        }

        speak(ttsText);

        setTimeout(() => {
            overlay.classList.remove('active');
            addMessage(initialChatMsg, 'assistant');
        }, 3000);
    }

    // Chat functionality
    function addMessage(text, sender) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `fa-msg ${sender}`;
        msgDiv.textContent = text;
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function addTypingIndicator() {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'fa-typing';
        msgDiv.id = 'fa-typing-indicator';
        msgDiv.innerHTML = '<span></span><span></span><span></span>';
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function removeTypingIndicator() {
        const indicator = document.getElementById('fa-typing-indicator');
        if (indicator) indicator.remove();
    }

    function handleChat() {
        const text = chatInput.value.trim();
        if (!text) return;

        addMessage(text, 'user');
        chatInput.value = '';
        addTypingIndicator();

        setTimeout(() => {
            removeTypingIndicator();
            const response = generateResponse(text);
            addMessage(response, 'assistant');
        }, 800);
    }

    function generateResponse(question) {
        const q = question.toLowerCase();

        if (isOwner) {
            if (q.includes('update') || q.includes('edit')) return "Sure! Let me know what you want to update on the portfolio.";
            if (q.includes('projects') || q.includes('repos')) return "You have over 16+ GitHub repositories. The latest ones are highlighted in the Projects section.";
            return "I am ready to assist you, Vikash. How can I help with the portfolio today?";
        } else {
            // Visitor Mode Q&A
            if (q.includes('who is') || q.includes('about')) return `${KB.name} is a ${KB.role} at ${KB.education}. He is the ${KB.companies}.`;
            if (q.includes('skill') || q.includes('tech') || q.includes('stack')) return `Vikash's skills include: ${KB.skills}.`;
            if (q.includes('project') || q.includes('work') || q.includes('build')) return `He has built several projects including AI automation systems and health-tech SaaS. You can see them in the Projects section or his GitHub: ${KB.github}`;
            if (q.includes('contact') || q.includes('email') || q.includes('reach')) return `You can contact Vikash at ${KB.email} or connect on LinkedIn: ${KB.linkedin}`;
            if (q.includes('company') || q.includes('startup') || q.includes('founder') || q.includes('ceo')) return `Vikash is the ${KB.companies}.`;
            if (q.includes('location') || q.includes('where')) return `Vikash is based in ${KB.location}.`;
            if (q.includes('education') || q.includes('study') || q.includes('college')) return `He studies at ${KB.education} as a ${KB.role}.`;
            if (q.includes('achievement') || q.includes('hackathon')) return `He is a ${KB.achievements}.`;
            
            return `For more details, you can contact Vikash at ${KB.email} or visit his LinkedIn (${KB.linkedin}).`;
        }
    }

    sendBtn.addEventListener('click', handleChat);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleChat();
    });
});
