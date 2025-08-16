const boards = [
    {
        name: "Neon Wallpapers",
        rssFeedUrl: "https://pingen.org/feed/1234567890" // Replace with your board URL
    },
    {
        name: "Nature Wallpapers",
        rssFeedUrl: "YOUR_NATURE_BOARD_RSS_FEED_URL"
    },
    {
        name: "Abstract Wallpapers",
        rssFeedUrl: "YOUR_ABSTRACT_BOARD_RSS_FEED_URL"
    }
];

const gallery = document.getElementById('gallery');
const searchInput = document.getElementById('searchInput');
const loader = document.getElementById('loading');
const scrollLoader = document.getElementById('loading-scroll');
const filterButtons = document.querySelectorAll('.filter-btn');

let allPins = [];
let currentPage = 0;
const pinsPerPage = 12;

async function fetchAndRenderPins() {
    loader.classList.remove('hidden');
    allPins = [];

    for (const board of boards) {
        try {
            const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(board.rssFeedUrl)}`);
            const data = await response.json();
            const pinsForBoard = data.items.filter(item => item.enclosure && item.enclosure.link);
            
            if (pinsForBoard.length > 0) {
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
