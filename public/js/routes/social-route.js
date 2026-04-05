(function () {
  const modules = window.StarlightRouteModules = window.StarlightRouteModules || {};
  modules["/social"] = {
    render: function renderSocialRoute() {
      return `
        <h1 class="text-4xl font-bold mb-6">Social</h1>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <a href="#/private-chat" class="block p-6 bg-gray-800 rounded-lg shadow-md hover:bg-gray-700 transition">
            <h2 class="text-2xl font-semibold mb-2 text-white"><i class="fas fa-comments"></i> Private Chat</h2>
            <p class="text-gray-400">Direct messages and group chats.</p>
          </a>
        </div>
      `;
    }
  };
})();
