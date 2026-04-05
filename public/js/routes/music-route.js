(function () {
  const modules = window.StarlightRouteModules = window.StarlightRouteModules || {};
  modules["/music"] = {
    render: function renderMusicRoute() {
      return `
        <iframe src="public/music.html" class="w-full h-screen border-0"></iframe>
      `;
    },
afterRender: function() {
    fetchMusic('trending');
    updateFavUI();
    renderPlaylist();
    renderQueue();
    updateBadges();
    attachScrollListener('trending-container');
    attachScrollListener('search-container');
    document.dispatchEvent(new Event('audioReady'));
}
  };
})();
