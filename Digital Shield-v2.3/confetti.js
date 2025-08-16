function triggerConfetti() {
    const canvas = document.createElement('canvas');
    const container = document.body;
    container.appendChild(canvas);

    canvas.style.position = 'fixed';
    canvas.style.left = '0';
    canvas.style.top = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.zIndex = '1000';
    canvas.style.pointerEvents = 'none';

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ["#005fcc", "#10b981", "#ef4444", "#f59e0b", "#ffffff"];
    const particles = [];

    for (let i = 0; i < 150; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height - canvas.height,
            size: Math.random() * 5 + 2,
            speed: Math.random() * 10 + 5,
            color: colors[Math.floor(Math.random() * colors.length)],
            angle: Math.random() * 360,
            spin: (Math.random() - 0.5) * 10
        });
    }

    let frame = 0;
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        particles.forEach(p => {
            p.y += p.speed;
            p.angle += p.spin;
            
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.angle * Math.PI / 180);
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 2);
            ctx.restore();
        });

        frame++;
        if (frame < 200) { // Run for about 3 seconds
            requestAnimationFrame(animate);
        } else {
            container.removeChild(canvas);
        }
    }

    animate();
}