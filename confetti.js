const CONFETTI_COLORS = ['#f6c518', '#ffffff', '#ff6b6b', '#4ecdc4', '#ffe66d', '#c9a012'];

function launchConfetti() {
  const canvas = document.createElement('canvas');
  canvas.className = 'confetti-canvas';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  const particles = [];
  let animationId = null;
  let burstTimer = null;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  resize();
  window.addEventListener('resize', resize);

  function spawnBurst(originX, originY) {
    const centerX = canvas.width / 2;
    const centerY = canvas.height * 0.42;
    const count = 70;

    for (let i = 0; i < count; i += 1) {
      const angle = Math.atan2(centerY - originY, centerX - originX);
      const spread = (Math.random() - 0.5) * 1.1;
      const speed = 7 + Math.random() * 8;

      particles.push({
        x: originX + (Math.random() - 0.5) * 24,
        y: originY + (Math.random() - 0.5) * 12,
        vx: Math.cos(angle + spread) * speed,
        vy: Math.sin(angle + spread) * speed - (5 + Math.random() * 4),
        gravity: 0.12 + Math.random() * 0.08,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        width: 5 + Math.random() * 7,
        height: 3 + Math.random() * 5,
        rotation: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.25,
        life: 1,
        decay: 0.004 + Math.random() * 0.006,
      });
    }
  }

  function fireBursts() {
    spawnBurst(0, canvas.height);
    spawnBurst(canvas.width, canvas.height);
  }

  fireBursts();
  burstTimer = window.setInterval(fireBursts, 450);

  window.setTimeout(() => {
    window.clearInterval(burstTimer);
  }, 2200);

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let alive = false;

    for (const particle of particles) {
      particle.vy += particle.gravity;
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.rotation += particle.spin;
      particle.life -= particle.decay;

      if (particle.life <= 0) {
        continue;
      }

      alive = true;
      ctx.save();
      ctx.globalAlpha = Math.min(particle.life, 1);
      ctx.translate(particle.x, particle.y);
      ctx.rotate(particle.rotation);
      ctx.fillStyle = particle.color;
      ctx.fillRect(
        -particle.width / 2,
        -particle.height / 2,
        particle.width,
        particle.height
      );
      ctx.restore();
    }

    if (alive) {
      animationId = requestAnimationFrame(animate);
    } else {
      cleanup();
    }
  }

  function cleanup() {
    window.clearInterval(burstTimer);
    window.removeEventListener('resize', resize);
    if (animationId) {
      cancelAnimationFrame(animationId);
    }
    canvas.remove();
  }

  animate();
}
