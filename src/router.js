export class Router {
  constructor(routes) {
    this.routes = routes;
    this.root = document.getElementById('app');
    window.addEventListener('hashchange', () => this.handleRoute());
    
    // Add toast container
    this.toastContainer = document.createElement('div');
    this.toastContainer.className = 'fixed bottom-24 md:bottom-10 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 pointer-events-none';
    document.body.appendChild(this.toastContainer);
  }

  init() {
    this.handleRoute();
  }

  handleRoute() {
    let hash = window.location.hash || '#/';
    // Parse query params if any
    const [path, queryString] = hash.split('?');
    const params = new URLSearchParams(queryString || '');

    const route = this.routes.find(r => r.path === path) || this.routes.find(r => r.path === '#/');
    this.root.innerHTML = '';
    
    // Mount the component
    if (route.component) {
      const el = route.component({ router: this, params });
      this.root.appendChild(el);
    }
  }

  navigate(path) {
    window.location.hash = path;
  }
  
  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `px-4 py-3 rounded-xl shadow-lg font-body text-sm font-medium transform transition-all duration-300 translate-y-10 opacity-0 flex items-center gap-2 ${
      type === 'success' ? 'bg-primary text-onPrimary' : 'bg-surfaceVariant text-onSurface'
    }`;
    
    const iconMap = {
      success: 'check_circle',
      info: 'info'
    };
    
    const icon = document.createElement('span');
    icon.className = 'material-symbols-outlined text-[18px]';
    icon.textContent = iconMap[type] || 'info';
    toast.appendChild(icon);
    
    const text = document.createElement('span');
    text.textContent = message;
    toast.appendChild(text);
    
    this.toastContainer.appendChild(toast);
    
    // Animate in
    requestAnimationFrame(() => {
      toast.classList.remove('translate-y-10', 'opacity-0');
    });
    
    // Remove after 3 seconds
    setTimeout(() => {
      toast.classList.add('opacity-0', 'scale-95');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
}
