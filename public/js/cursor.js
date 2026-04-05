document.addEventListener('DOMContentLoaded', () => {
    const cursorGlow = document.createElement('div');

cursorGlow.style.cssText = `
        position: fixed;
        pointer-events: none;
        width: 45px;
        height: 45px;
        border-radius: 50%;
        transform: translate(-50%, -50%);
        z-index: 99999999999999999;
        opacity: 0;
        background: transparent;
        border: 1px solid rgba(255, 255, 255, 0.8);
        box-shadow: 0 0 8px rgba(0, 0, 0, 0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: opacity 0.2s ease, width 0.25s ease, height 0.25s ease, border-color 0.2s ease, background-color 0.2s ease;
    `;

    const centerDot = document.createElement('div');
    centerDot.style.cssText = `
        width: 2px;
        height: 2px;
        background: #fff;
        border-radius: 50%;
    `;
    cursorGlow.appendChild(centerDot);

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

    document.addEventListener('mouseover', (e) => {
        const style = window.getComputedStyle(e.target);
        const isInteractive = e.target.closest('a, button, input, select, textarea, [role="button"]') || 
                             style.cursor === 'pointer';

        if (isInteractive) {
            cursorGlow.style.width = '45px';
            cursorGlow.style.height = '45px';
            cursorGlow.style.borderColor = '#5a5a5a';
            cursorGlow.style.backgroundColor = 'rgba(175, 175, 175, 0.1)';
        }
    });

    document.addEventListener('mouseout', () => {
        cursorGlow.style.width = '20px';
        cursorGlow.style.height = '20px';
        cursorGlow.style.borderColor = 'rgba(255, 255, 255, 0.8)';
        cursorGlow.style.backgroundColor = 'transparent';
    });

    function animate() {
        const ease = 0.18;
        currentX += (mouseX - currentX) * ease;
        currentY += (mouseY - currentY) * ease;
        cursorGlow.style.left = currentX + 'px';
        cursorGlow.style.top = currentY + 'px';
        requestAnimationFrame(animate);
    }

    animate();
});