
const rssFeed = 'https://pin.it/760Lb4hoY.rss';

const gallery = document.getElementById('gallery');
const searchInput = document.getElementById('searchInput');

let wallpapers = [];

// Fetch RSS feed using rss2json API
fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssFeed)}`)
  .then(res => res.json())
  .then(data => {
    wallpapers = data.items.map(item => {
      const parser = new DOMParser();
      const htmlDoc = parser.parseFromString(item.content, "text/html");
      const img = htmlDoc.querySelector('img');
      return {
        img: img ? img.src : '',
        title: item.title
      };
    });
    displayWallpapers(wallpapers);
  })
  .catch(err => console.error('Failed to fetch RSS:', err));

// Display wallpapers in gallery
function displayWallpapers(list) {
  gallery.innerHTML = '';
  list.forEach(wp => {
    if (wp.img) {
      const div = document.createElement('div');
      div.className = 'wallpaper';
      div.innerHTML = `
        <img src="${wp.img}" alt="${wp.title}">
        <div class="caption">${wp.title}</div>
      `;
      gallery.appendChild(div);
    }
  });
}

// Search wallpapers by caption
searchInput.addEventListener('input', () => {
  const term = searchInput.value.toLowerCase();
  const filtered = wallpapers.filter(wp => wp.title.toLowerCase().includes(term));
  displayWallpapers(filtered);
});