const boards = [
  {
    name: "Scenery Wallpaper",
    rssFeedUrl: "https://in.pinterest.com/amaa9n/scenery-wallpaper.rss"
  },
  {
    name: "Depth Wallpaper",
    rssFeedUrl: "https://in.pinterest.com/amaa9n/depth-wallpaper.rss"
  },
  {
    name: "Photography",
    rssFeedUrl: "https://in.pinterest.com/amaa9n/photography.rss"
  },
  {
    name: "Dark Phone Wallpapers",
    rssFeedUrl: "https://in.pinterest.com/amaa9n/dark-phone-wallpapers.rss"
  }
];
async function selectBoard(index) {
  // Highlight active tab
  document.querySelectorAll(".board-tab").forEach((btn, idx) => {
    btn.classList.toggle("active", idx === index);
  });

  gallery.innerHTML = `<p style="text-align:center; color:#666; font-size:1.2rem;">Loading wallpapers...</p>`;

  const rssUrl = boards[index].rssFeedUrl;

  const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;

  try {
    const res = await fetch(apiUrl);
    const data = await res.json();
    if (data.status !== "ok") throw new Error("Failed to load RSS feed");
    renderGallery(data.items);
  } catch (err) {
    gallery.innerHTML = `<p style="color:#f55; text-align:center;">Failed to load wallpapers. Try again later.</p>`;
    console.error(err);
  }
}

function renderGallery(items) {
  gallery.innerHTML = "";
  items.forEach(item => {
    if (!item.enclosure || !item.enclosure.link) return;

    const card = document.createElement("div");
    card.className = "wallpaper-card";

    card.innerHTML = `
      <a href="${item.link}" target="_blank" rel="noopener noreferrer">
        <img src="${item.enclosure.link}" alt="${item.title}" loading="lazy" />
      </a>
      <div class="card-info">
        <h3 title="${item.title}">${item.title}</h3>
      </div>
    `;

    gallery.appendChild(card);
  });
}

// Initialize
renderBoards();
selectBoard(0);
                pinsForBoard.forEach(pin => pin.boardName = board.name);
                allPins = allPins.concat(pinsForBoard);
            }
        } catch (error) {
            console.error(`Error fetching pins for board "${board.name}":`, error);
        }
    }

    loader.classList.add('hidden');
    if (allPins.length === 0) {
        gallery.innerHTML = '<p class="loading-message">No wallpapers found. 😞</p>';
    } else {
        // Shuffle pins to simulate "most viewed" randomness for now
        allPins = shuffleArray(allPins);
        renderMorePins();
    }
}

function renderMorePins() {
    const startIndex = currentPage * pinsPerPage;
    const endIndex = startIndex + pinsPerPage;
    const pinsToRender = allPins.slice(startIndex, endIndex);

    if (pinsToRender.length === 0) {
        scrollLoader.classList.add('hidden');
        return;
    }

    scrollLoader.classList.remove('hidden');
    setTimeout(() => {
        scrollLoader.classList.add('hidden');
        pinsToRender.forEach(pin => {
            const pinElement = document.createElement('div');
            pinElement.classList.add('wallpaper-card');
            
            const imageUrl = pin.enclosure.link;
            const title = pin.title || 'Untitled Wallpaper';

            pinElement.innerHTML = `
                <a href="${pin.link}" target="_blank">
                    <img src="${imageUrl}" alt="${title}">
                    <div class="card-info">
                        <h3 class="card-title">${title}</h3>
                    </div>
                </a>
            `;
            gallery.appendChild(pinElement);
        });
        currentPage++;
    }, 1000); // Simulate a network delay with a 1s animation
}

function handleSearch() {
    const query = searchInput.value.toLowerCase();
    
    gallery.innerHTML = '';
    
    if (query === "") {
        currentPage = 0;
        renderMorePins();
        return;
    }
    
    const filteredPins = allPins.filter(pin => 
        (pin.title && pin.title.toLowerCase().includes(query)) ||
        (pin.description && pin.description.toLowerCase().includes(query)) ||
        (pin.boardName && pin.boardName.toLowerCase().includes(query))
    );
    
    if (filteredPins.length > 0) {
        filteredPins.forEach(pin => {
            const pinElement = document.createElement('div');
            pinElement.classList.add('wallpaper-card');
            
            const imageUrl = pin.enclosure.link;
            const title = pin.title || 'Untitled Wallpaper';
            
            pinElement.innerHTML = `
                <a href="${pin.link}" target="_blank">
                    <img src="${imageUrl}" alt="${title}">
                    <div class="card-info">
                        <h3 class="card-title">${title}</h3>
                    </div>
                </a>
            `;
            gallery.appendChild(pinElement);
        });
    } else {
        gallery.innerHTML = '<p class="loading-message">No wallpapers found matching your search. 😞</p>';
    }
}

function handleFilter(event) {
    filterButtons.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    const sortType = event.target.dataset.sort;
    if (sortType === 'latest') {
        allPins.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
    } else if (sortType === 'most-viewed') {
        // Since we don't have view data, we'll shuffle the array
        allPins = shuffleArray(allPins);
    }
    
    gallery.innerHTML = '';
    currentPage = 0;
    renderMorePins();
}

// Utility function to shuffle an array (for "most viewed" simulation)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Infinite scroll functionality
window.addEventListener('scroll', () => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500 && !scrollLoader.classList.contains('hidden')) {
        renderMorePins();
    }
});

// Event listeners
searchInput.addEventListener('input', handleSearch);
filterButtons.forEach(btn => btn.addEventListener('click', handleFilter));

// Initial fetch
fetchAndRenderPins();
