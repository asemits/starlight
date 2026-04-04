function applyCloak(title, icon) {
    document.title = title;
    let link = document.querySelector("link[rel*='icon']") || document.createElement('link');
    link.type = 'image/x-icon';
    link.rel = 'shortcut icon';
    link.href = icon;
    document.getElementsByTagName('head')[0].appendChild(link);
    
    localStorage.setItem('tabTitle', title);
    localStorage.setItem('tabIcon', icon);
}

function loadCloak() {
    const savedTitle = localStorage.getItem('tabTitle');
    const savedIcon = localStorage.getItem('tabIcon');
    if (savedTitle && savedIcon) {
        applyCloak(savedTitle, savedIcon);
    }
}

loadCloak();

function resetTab() {
    localStorage.removeItem('tabTitle');
    localStorage.removeItem('tabIcon');
    window.location.reload();
}

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        window.location.href = 'https://classroom.google.com';
    }
});