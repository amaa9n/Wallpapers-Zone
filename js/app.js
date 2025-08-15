const appState = {
  // UI state
  mobileMenu: false,
  darkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
  openGenerator: false,
  generating: false,
  detailOpen: false,
  selected: null,
  q: '',
  sortBy: 'latest',
  featuredTags: ['Nature','City','Abstract','Minimal','Space','Landscape','Animals','Cars','Neon','Texture'],
  activeTags: new Set(),

  // Data
  all: [], // all wallpapers loaded from /data/wallpapers.json
  page: 0,
  pageSize: 24,
  filtered: [],
  likes: new Set(JSON.parse(localStorage.getItem('likes')||'[]')),

  // AI generator state
  gen: { prompt: '', aspect: '16:9', size: '2048x1152', quality: 'hd', upscale5k: true },
  genResult: null,

  async init() {
    try {
      const res = await fetch('/data/wallpapers.json');
      const json = await res.json();
      this.all = json.sort((a,b)=> new Date(b.added) - new Date(a.added));
      this.applyFilters();
      this.observeInfiniteScroll();
    } catch (e) {
      console.error('Failed to load wallpapers.json', e);
    }
  },

  toggleDark(){ this.darkMode = !this.darkMode; localStorage.setItem('dark', this.darkMode ? '1':'0'); },
  scrollToTop(){ window.scrollTo({top:0, behavior:'smooth'}); },

  toggleTag(tag){
    if(this.activeTags.has(tag)) this.activeTags.delete(tag); else this.activeTags.add(tag);
    this.applyFilters(true);
  },

  search(){ this.applyFilters(true); },

  applySort(){ this.applyFilters(true); },

  applyFilters(resetPage=false){
    const q = this.q.trim().toLowerCase();
    const tags = Array.from(this.activeTags);
    let arr = this.all.filter(w=>{
      const matchQ = !q || w.title.toLowerCase().includes(q) || (w.tags||[]).some(t=>t.toLowerCase().includes(q));
      const matchTags = tags.length===0 || tags.every(t => (w.tags||[]).includes(t));
      return matchQ && matchTags;
    });
    if(this.sortBy==='popular') arr.sort((a,b)=>(this.isLiked(b.id)-this.isLiked(a.id))||0);
    if(this.sortBy==='trending') arr.sort((a,b)=>(b.downloads||0)-(a.downloads||0));
    if(resetPage){ this.page=0; document.getElementById('grid').innerHTML=''; }
    this.filtered = arr;
    this.renderNextPage();
  },

  observeInfiniteScroll(){
    const sentinel = document.getElementById('sentinel');
    const io = new IntersectionObserver((entries)=>{
      entries.forEach(entry=>{ if(entry.isIntersecting) this.renderNextPage(); });
    }, { rootMargin: '800px' });
    io.observe(sentinel);
  },

  renderNextPage(){
    const start = this.page * this.pageSize;
    const slice = this.filtered.slice(start, start + this.pageSize);
    if(slice.length===0) return;
    const grid = document.getElementById('grid');
    slice.forEach(w => grid.appendChild(this.card(w)));
    this.page++;
  },

  card(w){
    const art = document.createElement('article');
    art.className = 'group relative overflow-hidden rounded-2xl border border-slate-200/70 dark:border-slate-800/70 bg-white/70 dark:bg-slate-800/50 shadow hover:shadow-lg transition-shadow';
    art.innerHTML = `
      <img src="${w.thumb||w.src}" alt="${w.title}" loading="lazy" class="w-full h-auto max-h-[60rem] object-cover">
      <div class="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/60 via-black/20 to-transparent text-white">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-semibold line-clamp-1">${w.title}</h3>
          <button class="rounded-full bg-white/90 text-slate-900 px-2 py-1 text-xs flex items-center gap-1 like-btn"><i class="lucide-heart"></i><span>${this.isLiked(w.id)?'Liked':'Like'}</span></button>
        </div>
      </div>`;
    art.querySelector('img').addEventListener('click', ()=>{ this.selected = w; this.detailOpen = true; });
    art.querySelector('.like-btn').addEventListener('click', (e)=>{ e.stopPropagation(); this.toggleLike(w); art.querySelector('.like-btn span').textContent = this.isLiked(w.id)?'Liked':'Like'; });
    return art;
  },

  isLiked(id){ return this.likes.has(id); },
  likeLabel(w){ return this.isLiked(w.id)?'Liked':'Like'; },
  toggleLike(w){
    if(this.likes.has(w.id)) this.likes.delete(w.id); else this.likes.add(w.id);
    localStorage.setItem('likes', JSON.stringify(Array.from(this.likes)));
  },

  closeDetail(){ this.detailOpen=false; this.selected=null; },
  formatDate(d){ return d ? dayjs(d).format('MMM D, YYYY') : ''; },

  async download(w){
    try {
      // Attempt CORS-friendly fetch → blob → save
      const a = document.createElement('a');
      const resp = await fetch(w.src, { mode: 'cors' });
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      a.href = url; a.download = (w.title||'wallpaper').replace(/[^a-z0-9-_]+/gi,'_') + '.jpg';
      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    } catch(e) {
      // Fallback: open in new tab (some hosts block CORS download)
      window.open(w.src, '_blank');
    }
  },

  copy(text){ navigator.clipboard.writeText(text).then(()=>alert('Link copied')); },
  giscusLink(w){ return location.origin + location.pathname + '#reviews'; },

  // AI generation
  async generate(){
    if(!this.gen.prompt.trim()) { alert('Write a good prompt first 🙂'); return; }
    this.generating = true; this.genResult = null;
    try {
      const r = await fetch('/.netlify/functions/generate-image', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: this.gen.prompt, size: this.gen.size, quality: this.gen.quality, aspect: this.gen.aspect })
      });
      const { dataUrl } = await r.json();
      let out = dataUrl;
      if(this.gen.upscale5k){ out = await upscaleCanvas(out, 2); }
      this.genResult = out;
    } catch(e){ console.error(e); alert('Generation failed. Check your serverless function & API key.'); }
    finally { this.generating = false; }
  },

  downloadDataUrl(dataUrl, filename){
    const a = document.createElement('a');
    a.href = dataUrl; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
  },

  addToGrid(url){
    // Add a temporary local item (not saved to JSON)
    const id = 'local-'+Date.now();
    const w = { id, title: 'AI Wallpaper', src: url, thumb: url, tags:['AI'], added: new Date().toISOString(), resolution: 'generated' };
    this.filtered.unshift(w); this.page=0; document.getElementById('grid').innerHTML=''; this.renderNextPage();
    this.openGenerator=false; this.detailOpen=false;
  },

  promptAddToHome(){ alert('Use your browser menu → Add to Home Screen to install the PWA.'); }
};

// Expose app state
window.appState = appState;

document.addEventListener('alpine:init', () => {
  Alpine.data('appState', () => ({ ...appState, init: appState.init }));
});

// Simple client-side upscale using Canvas (2× default)
async function upscaleCanvas(dataUrl, scale=2){
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = img.width * scale; c.height = img.height * scale;
      const ctx = c.getContext('2d');
      ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, c.width, c.height);
      resolve(c.toDataURL('image/png'));
    };
    img.crossOrigin = 'anonymous';
    img.src = dataUrl;
  });
  }
