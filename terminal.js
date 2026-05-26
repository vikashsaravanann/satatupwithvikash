const terminalHTML = `
<div id="hacker-terminal" class="terminal-overlay hidden">
    <div class="terminal-header">
        <span class="terminal-title">user@vikash-portfolio: ~</span>
        <button id="close-terminal" class="terminal-close">X</button>
    </div>
    <div class="terminal-body" id="terminal-body">
        <p class="terminal-welcome">Welcome to VikashOS v1.0.0 (Linux 5.15.0-101-generic x86_64)</p>
        <p class="terminal-welcome">Type 'help' to see a list of available commands.</p>
        <div id="terminal-output"></div>
        <div class="terminal-input-line">
            <span class="prompt">guest@vikash:~$ </span>
            <input type="text" id="terminal-input" autocomplete="off" spellcheck="false" autofocus>
        </div>
    </div>
</div>
`;

const terminalCSS = `
.terminal-overlay {
    position: fixed;
    top: 0; left: 0; width: 100vw; height: 100vh;
    background: rgba(10, 10, 15, 0.95);
    backdrop-filter: blur(10px);
    z-index: 9999;
    display: flex;
    flex-direction: column;
    font-family: 'Fira Code', 'Courier New', monospace;
    color: #10b981; /* Green color for text */
    padding: 20px;
    opacity: 1;
    transition: opacity 0.3s ease;
}

.terminal-overlay.hidden {
    opacity: 0;
    pointer-events: none;
}

.terminal-header {
    display: flex;
    justify-content: space-between;
    background: #1f2937;
    padding: 10px 15px;
    border-radius: 8px 8px 0 0;
    align-items: center;
    border-bottom: 2px solid #374151;
}

.terminal-title {
    color: #e5e7eb;
    font-weight: bold;
    font-size: 0.9rem;
}

.terminal-close {
    background: #ef4444;
    color: white;
    border: none;
    border-radius: 50%;
    width: 16px;
    height: 16px;
    cursor: pointer;
    font-size: 0.6rem;
    display: flex;
    justify-content: center;
    align-items: center;
}

.terminal-body {
    background: #000;
    flex: 1;
    border-radius: 0 0 8px 8px;
    padding: 20px;
    overflow-y: auto;
    font-size: 1rem;
    box-shadow: inset 0 0 10px rgba(0,0,0,0.5);
}

.terminal-welcome {
    margin: 0 0 10px 0;
    color: #3b82f6;
}

.terminal-input-line {
    display: flex;
    margin-top: 10px;
}

.prompt {
    color: #10b981;
    margin-right: 8px;
    white-space: pre;
}

#terminal-input {
    background: transparent;
    border: none;
    color: #e5e7eb;
    font-family: 'Fira Code', 'Courier New', monospace;
    font-size: 1rem;
    outline: none;
    flex: 1;
}

.terminal-out {
    color: #e5e7eb;
    margin: 5px 0;
    white-space: pre-wrap;
}

.terminal-err {
    color: #ef4444;
}

.terminal-success {
    color: #10b981;
}

.terminal-accent {
    color: #3b82f6;
}
`;

document.addEventListener('DOMContentLoaded', () => {
    // Add CSS
    const style = document.createElement('style');
    style.innerHTML = terminalCSS;
    document.head.appendChild(style);

    // Add HTML
    const div = document.createElement('div');
    div.innerHTML = terminalHTML;
    document.body.appendChild(div.firstElementChild);

    const terminalOverlay = document.getElementById('hacker-terminal');
    const terminalInput = document.getElementById('terminal-input');
    const terminalOutput = document.getElementById('terminal-output');
    const closeBtn = document.getElementById('close-terminal');
    const terminalBody = document.getElementById('terminal-body');

    // Toggle logic
    document.addEventListener('keydown', (e) => {
        if (e.key === '`' || e.key === '~') {
            e.preventDefault();
            toggleTerminal();
        }
    });

    closeBtn.addEventListener('click', () => {
        terminalOverlay.classList.add('hidden');
    });

    function toggleTerminal() {
        if (terminalOverlay.classList.contains('hidden')) {
            terminalOverlay.classList.remove('hidden');
            setTimeout(() => terminalInput.focus(), 100);
        } else {
            terminalOverlay.classList.add('hidden');
        }
    }

    // Commands logic
    const commands = {
        'help': () => \`Available commands:
  help       - Show this message
  about      - Display information about Vikash
  skills     - List technical skills
  projects   - Show developed projects
  contact    - Show contact information
  clear      - Clear the terminal screen
  exit       - Close the terminal\`,
        
        'about': () => \`[Vikash Saravanan]
Role: AI Engineer, Prompt Engineer & Web Developer
Location: Coimbatore, Tamil Nadu
Objective: Ambitious student actively building enterprise-grade AI automation systems.\`,
        
        'skills': () => \`[Core Competencies]
- Python, SQL, JavaScript, React
- Machine Learning, Computer Vision (YOLOv8)
- Prompt Engineering, LLM Integration
- n8n Automation, Cloud Deployments\`,
        
        'projects': () => \`[Key Projects]
1. HearWise (AI Hearing Screening)
2. OpenEnv Debugger (Meta Hackathon Finalist)
3. Portfolio AI Chatbot
4. Logic Intelligence Tech CRM\`,
        
        'contact': () => \`[Contact Data]
Email: vikash07052008@gmail.com
LinkedIn: linkedin.com/in/vikash-saravanan-j7528
GitHub: github.com/vikashsaravanann\`,
        
        'clear': () => {
            terminalOutput.innerHTML = '';
            return '';
        },
        
        'exit': () => {
            setTimeout(toggleTerminal, 300);
            return 'Closing session...';
        }
    };

    terminalInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const val = terminalInput.value.trim().toLowerCase();
            if (val) {
                // Echo command
                appendOutput(\`<span class="prompt">guest@vikash:~$</span> \${val}\`);
                
                // Execute
                if (commands[val]) {
                    const res = commands[val]();
                    if (res) appendOutput(res);
                } else {
                    appendOutput(\`<span class="terminal-err">Command not found: \${val}. Type 'help' for available commands.</span>\`);
                }
            }
            terminalInput.value = '';
            terminalBody.scrollTop = terminalBody.scrollHeight;
        }
    });

    function appendOutput(text) {
        const p = document.createElement('div');
        p.className = 'terminal-out';
        p.innerHTML = text;
        terminalOutput.appendChild(p);
    }
});
