class ParticleNetwork {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.numberOfParticles = window.innerWidth < 768 ? 80 : 150;
        
        this.mouse = {
            x: null,
            y: null,
            radius: 200
        };

        this.init();
        this.animate();

        window.addEventListener('resize', () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            this.init();
        });

        window.addEventListener('mousemove', (e) => {
            this.mouse.x = e.x;
            this.mouse.y = e.y;
        });
        
        window.addEventListener('mouseout', () => {
            this.mouse.x = null;
            this.mouse.y = null;
        });
    }

    init() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.particles = [];
        
        for (let i = 0; i < this.numberOfParticles; i++) {
            let size = (Math.random() * 2.5) + 0.8;
            let x = (Math.random() * ((innerWidth - size * 2) - (size * 2)) + size * 2);
            let y = (Math.random() * ((innerHeight - size * 2) - (size * 2)) + size * 2);
            let directionX = (Math.random() * 2) - 1;
            let directionY = (Math.random() * 2) - 1;
            let color = '#0ea5e9'; // Accent color

            this.particles.push(new Particle(x, y, directionX, directionY, size, color, this.canvas, this.ctx, this.mouse));
        }
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        this.ctx.clearRect(0, 0, innerWidth, innerHeight);

        for (let i = 0; i < this.particles.length; i++) {
            this.particles[i].update();
        }
        this.connect();
    }

    connect() {
        let opacityValue = 1;
        for (let a = 0; a < this.particles.length; a++) {
            for (let b = a; b < this.particles.length; b++) {
                let distance = ((this.particles[a].x - this.particles[b].x) * (this.particles[a].x - this.particles[b].x))
                             + ((this.particles[a].y - this.particles[b].y) * (this.particles[a].y - this.particles[b].y));
                
                if (distance < (this.canvas.width / 6) * (this.canvas.height / 6)) {
                    opacityValue = 1 - (distance / 20000);
                    this.ctx.strokeStyle = `rgba(14, 165, 233, ${opacityValue * 0.2})`;
                    this.ctx.lineWidth = 1;
                    this.ctx.beginPath();
                    this.ctx.moveTo(this.particles[a].x, this.particles[a].y);
                    this.ctx.lineTo(this.particles[b].x, this.particles[b].y);
                    this.ctx.stroke();
                }
            }
        }
    }
}

class Particle {
    constructor(x, y, directionX, directionY, size, color, canvas, ctx, mouse) {
        this.x = x;
        this.y = y;
        this.directionX = directionX;
        this.directionY = directionY;
        this.size = size;
        this.color = color;
        this.canvas = canvas;
        this.ctx = ctx;
        this.mouse = mouse;
    }

    draw() {
        // Draw glow effect
        const glowGradient = this.ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 3);
        glowGradient.addColorStop(0, 'rgba(14, 165, 233, 0.4)');
        glowGradient.addColorStop(0.5, 'rgba(14, 165, 233, 0.1)');
        glowGradient.addColorStop(1, 'rgba(14, 165, 233, 0)');
        
        this.ctx.fillStyle = glowGradient;
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, this.size * 3, 0, Math.PI * 2, false);
        this.ctx.fill();
        
        // Draw particle core
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
        this.ctx.fillStyle = this.color;
        this.ctx.fill();
        
        // Draw bright center
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, this.size * 0.4, 0, Math.PI * 2, false);
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        this.ctx.fill();
    }

    update() {
        if (this.x > this.canvas.width || this.x < 0) {
            this.directionX = -this.directionX;
        }
        if (this.y > this.canvas.height || this.y < 0) {
            this.directionY = -this.directionY;
        }

        let dx = this.mouse.x - this.x;
        let dy = this.mouse.y - this.y;
        let distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < this.mouse.radius + this.size) {
            if (this.mouse.x < this.x && this.x < this.canvas.width - this.size * 10) {
                this.x += 3;
            }
            if (this.mouse.x > this.x && this.x > this.size * 10) {
                this.x -= 3;
            }
            if (this.mouse.y < this.y && this.y < this.canvas.height - this.size * 10) {
                this.y += 3;
            }
            if (this.mouse.y > this.y && this.y > this.size * 10) {
                this.y -= 3;
            }
        }

        this.x += this.directionX * 0.5;
        this.y += this.directionY * 0.5;

        this.draw();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ParticleNetwork('global-particles');
});
