document.addEventListener('DOMContentLoaded', () => {
    const cursorGlow = document.createElement('div');

    cursorGlow.style.cssText = `
    
        position: fixed;
        pointer-events: none;
        /* Smaller size for a precise cursor look */
        width: 20px; 
        height: 20px;
        border-radius: 50%;
        transform: translate(-50%, -50%);
        z-index: 99999999999999999999999999999999999999999999999999999; /* Because of that shitty sidebar */
        opacity: 0;

        /* The "Empty Center" Look */
        background: transparent;
        /* Thin white border */
        border: 1px solid rgba(255, 255, 255, 0.8); 
        
        /* Subtle glow so it doesn't disappear on white backgrounds */
        box-shadow: 0 0 8px rgba(0, 0, 0, 0.3);

        /* Remove the heavy filters for a sharp circle */
        filter: none;
        mix-blend-mode: normal;

        transition: opacity 0.2s ease, width 0.2s ease, height 0.2s ease, border-color 0.2s ease;
    `;

    document.body.appendChild(cursorGlow);

    let mouseX = 0, mouseY = 0;
    let currentX = 0, currentY = 0;
    let isVisible = false;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;

        if (!isVisible) {
            isVisible = true;
            cursorGlow.style.opacity = '1';
        }
    });

    document.addEventListener('mouseleave', () => {
        isVisible = false;
        cursorGlow.style.opacity = '0';
    });

    // Interaction Effect: Hover over buttons to turn the border Neon Mint
    document.querySelectorAll('a, button, .control-btn').forEach(el => {
        el.addEventListener('mouseenter', () => {
            cursorGlow.style.borderColor = '#5a5a5a'; // Your Neon Mint
            cursorGlow.style.width = '35px';
            cursorGlow.style.height = '35px';
        });
        el.addEventListener('mouseleave', () => {
            cursorGlow.style.borderColor = 'rgba(255, 255, 255, 0.8)';
            cursorGlow.style.width = '20px';
            cursorGlow.style.height = '20px';
        });
    });

    function animate() {
        // Keeps that smooth 'floaty' feel
        const ease = 0.18; 

        currentX += (mouseX - currentX) * ease;
        currentY += (mouseY - currentY) * ease;

        cursorGlow.style.left = currentX + 'px';
        cursorGlow.style.top = currentY + 'px';

        requestAnimationFrame(animate);
    }

    animate();
});