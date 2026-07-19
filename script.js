// === BIOLUMINESCENT SWARM CURSOR ===
const swarmCanvas = document.getElementById('swarm-canvas');
const sctx = swarmCanvas.getContext('2d');
let sw, sh;
let mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
let stick = 0;

const S_COUNT = 60;
const S_SPEED = 3.5;
const S_TRAIL = 8;
const S_FRICTION = 0.94;

function resizeSwarm() {
  sw = swarmCanvas.width = window.innerWidth;
  sh = swarmCanvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeSwarm);
resizeSwarm();

document.addEventListener('mousemove', e => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
});
document.addEventListener('mousedown', () => scatterSwarm());

// Touch support: swarm follows the finger on mobile/tablet
function updateFromTouch(e) {
  if (!e.touches || e.touches.length === 0) return;
  mouse.x = e.touches[0].clientX;
  mouse.y = e.touches[0].clientY;
}
document.addEventListener('touchstart', e => {
  updateFromTouch(e);
  scatterSwarm();
}, { passive: true });
document.addEventListener('touchmove', updateFromTouch, { passive: true });

class Swimmer {
  constructor() { this.reset(true); }
  reset(rand) {
    this.x = rand ? Math.random() * sw : mouse.x;
    this.y = rand ? Math.random() * sh : mouse.y;
    this.vx = (Math.random() - 0.5) * 2;
    this.vy = (Math.random() - 0.5) * 2;
    this.history = [];
    this.offset = Math.random() * Math.PI * 2;
    this.colorOffset = Math.random() * 60;
  }
  update() {
    let dx = mouse.x - this.x;
    let dy = mouse.y - this.y;
    let dist = Math.sqrt(dx * dx + dy * dy);
    let angle = Math.atan2(dy, dx);
    let force = 0.3;
    if (dist < 80) {
      this.vx += Math.cos(angle + Math.PI / 2) * 0.6;
      this.vy += Math.sin(angle + Math.PI / 2) * 0.6;
      force = 0.04;
    }
    this.vx += Math.cos(angle) * force;
    this.vy += Math.sin(angle) * force;
    this.vx += (Math.random() - 0.5) * 0.6;
    this.vy += (Math.random() - 0.5) * 0.6;
    this.vx *= S_FRICTION;
    this.vy *= S_FRICTION;
    let speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    if (speed > S_SPEED) { this.vx = (this.vx / speed) * S_SPEED; this.vy = (this.vy / speed) * S_SPEED; }
    this.x += this.vx;
    this.y += this.vy;
    this.history.push({ x: this.x, y: this.y });
    if (this.history.length > S_TRAIL) this.history.shift();
  }
  draw() {
    let hue = (stick * 1.2 + this.colorOffset) % 360;
    sctx.strokeStyle = `hsla(${hue}, 100%, 60%, 0.8)`;
    sctx.fillStyle = `hsla(${hue}, 100%, 80%, 1)`;
    sctx.lineWidth = 1.5;
    sctx.lineCap = 'round';
    sctx.beginPath();
    for (let i = 0; i < this.history.length; i++) {
      let p = this.history[i];
      let wiggle = Math.sin(stick * 4 + this.offset + i) * (i * 0.25);
      if (i === 0) sctx.moveTo(p.x + wiggle, p.y + wiggle);
      else sctx.lineTo(p.x + wiggle, p.y + wiggle);
    }
    sctx.stroke();
    sctx.beginPath();
    sctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
    sctx.fill();
  }
}

const swarm = Array.from({ length: S_COUNT }, () => new Swimmer());

function scatterSwarm() {
  swarm.forEach(s => {
    let dx = s.x - mouse.x, dy = s.y - mouse.y;
    let dist = Math.sqrt(dx * dx + dy * dy) + 1;
    let force = 1500 / dist;
    s.vx += (dx / dist) * force;
    s.vy += (dy / dist) * force;
    s.history = [];
  });
}

function swarmLoop() {
  stick += 1;
  sctx.globalCompositeOperation = 'source-over';
  sctx.fillStyle = 'rgba(0,0,0,0)';
  sctx.clearRect(0, 0, sw, sh);
  sctx.globalCompositeOperation = 'lighter';

  // Small core glow at cursor
  const coreHue = (stick * 0.8) % 360;
  let grad = sctx.createRadialGradient(mouse.x, mouse.y, 2, mouse.x, mouse.y, 40);
  grad.addColorStop(0, `hsla(${coreHue}, 100%, 60%, 0.4)`);
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  sctx.fillStyle = grad;
  sctx.beginPath();
  sctx.arc(mouse.x, mouse.y, 40, 0, Math.PI * 2);
  sctx.fill();

  // Tiny solid dot core
  sctx.fillStyle = 'rgba(255,255,255,0.9)';
  sctx.beginPath();
  sctx.arc(mouse.x, mouse.y, 3, 0, Math.PI * 2);
  sctx.fill();

  swarm.forEach(s => { s.update(); s.draw(); });
  requestAnimationFrame(swarmLoop);
}
swarmLoop();

// Fade-up animation on scroll
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));

// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const href = a.getAttribute('href');
    if (href === '#') return;
    e.preventDefault();
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  });
});

// Nav background on scroll
window.addEventListener('scroll', () => {
  const nav = document.querySelector('nav');
  if (window.scrollY > 50) {
    nav.style.background = 'rgba(15,14,11,0.97)';
    nav.style.backdropFilter = 'blur(16px)';
  } else {
    nav.style.background = 'linear-gradient(to bottom, rgba(15,14,11,0.95), transparent)';
    nav.style.backdropFilter = 'blur(2px)';
  }
});

// Social menu ripple effect
document.querySelectorAll('.social-menu ul li a').forEach(btn => {
  btn.addEventListener('click', function(e) {
    let rect = this.getBoundingClientRect();
    let ripple = document.createElement('span');
    ripple.classList.add('s-ripple');
    ripple.style.left = (e.clientX - rect.left) + 'px';
    ripple.style.top = (e.clientY - rect.top) + 'px';
    this.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  });
});
