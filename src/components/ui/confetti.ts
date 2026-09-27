/**
 * BirthdayVerse Celebration Canvas Engine
 * High-performance lightweight confetti and fireworks particle physics.
 */

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  alpha: number;
  decay: number;
  shape: 'rect' | 'circle' | 'star' | 'heart';
}

const COLORS = [
  '#f43f5e', '#fb7185', '#ec4899', '#a855f7',
  '#818cf8', '#38bdf8', '#34d399', '#facc15', '#fb923c'
];

export function launchConfetti(originX?: number, originY?: number, shape: 'rect' | 'circle' | 'star' | 'heart' = 'rect') {
  if (typeof window === 'undefined') return;

  // Check prefers-reduced-motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  let canvas = document.getElementById('bv-confetti-canvas') as HTMLCanvasElement;
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = 'bv-confetti-canvas';
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '99999';
    document.body.appendChild(canvas);
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const width = (canvas.width = window.innerWidth);
  const height = (canvas.height = window.innerHeight);

  const startX = originX !== undefined ? originX : width / 2;
  const startY = originY !== undefined ? originY : height * 0.4;

  const particles: Particle[] = [];
  const particleCount = 120;

  for (let i = 0; i < particleCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 12 + 4;
    particles.push({
      x: startX,
      y: startY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 4, // Upward bias
      size: Math.random() * 8 + 6,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 12,
      alpha: 1,
      decay: Math.random() * 0.015 + 0.01,
      shape: Math.random() > 0.3 ? shape : 'rect'
    });
  }

  let animationFrameId: number;

  function render() {
    ctx!.clearRect(0, 0, width, height);

    let activeParticles = 0;

    for (const p of particles) {
      if (p.alpha <= 0) continue;

      activeParticles++;
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.25; // Gravity
      p.vx *= 0.98; // Air resistance
      p.rotation += p.rotationSpeed;
      p.alpha -= p.decay;

      ctx!.save();
      ctx!.translate(p.x, p.y);
      ctx!.rotate((p.rotation * Math.PI) / 180);
      ctx!.globalAlpha = Math.max(0, p.alpha);
      ctx!.fillStyle = p.color;

      if (p.shape === 'circle') {
        ctx!.beginPath();
        ctx!.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx!.fill();
      } else if (p.shape === 'heart') {
        const s = p.size / 2;
        ctx!.beginPath();
        ctx!.moveTo(0, s / 2);
        ctx!.bezierCurveTo(-s, -s, -s * 2, s / 3, 0, s * 2);
        ctx!.bezierCurveTo(s * 2, s / 3, s, -s, 0, s / 2);
        ctx!.fill();
      } else {
        ctx!.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      }

      ctx!.restore();
    }

    if (activeParticles > 0) {
      animationFrameId = requestAnimationFrame(render);
    } else {
      ctx!.clearRect(0, 0, width, height);
      cancelAnimationFrame(animationFrameId);
    }
  }

  render();
}

export function launchFireworks() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  launchConfetti(w * 0.25, h * 0.4, 'star');
  setTimeout(() => launchConfetti(w * 0.75, h * 0.35, 'heart'), 200);
  setTimeout(() => launchConfetti(w * 0.5, h * 0.3, 'circle'), 450);
}
