const boards = [
    {
        name: "Neon Wallpapers",
        rssFeedUrl: "https://pingen.org/feed/1234567890" // Replace with your actual RSS feed URL for this board
    },
    // Add more boards here in the same format
    // {
    //     name: "Nature Wallpapers",
    //     rssFeedUrl: "YOUR_NATURE_BOARD_RSS_FEED_URL"
    // },
    // {
    //     name: "Minimalist Wallpapers",
    //     rssFeedUrl: "YOUR_MINIMALIST_BOARD_RSS_FEED_URL"
    // }
];

const gallery = document.getElementById('gallery');
const searchInput = document.getElementById('searchInput');
let allPins = [];

async function fetchAndRenderPins() {
    gallery.innerHTML = '<p class="loading-message">Loading wallpapers... ⏳</p>';
    allPins = [];

    for (const board of boards) {
        try {
            const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(board.rssFeedUrl)}`);
            const data = await response.json();
            const pinsForBoard = data.items.filter(item => item.enclosure && item.enclosure.link);
            
            if (pinsForBoard.length > 0) {
                // Add board name to each pin for search functionality
                pinsForBoard.forEach(pin => pin.boardName = board.name);
                allPins = allPins.concat(pinsForBoard);
                renderPins(pinsForBoard, board.name);
            }
        } catch (error) {
            console.error(`Error fetching pins for board "${board.name}":`, error);
        }
    }

    if (allPins.length === 0) {
        gallery.innerHTML = '<p class="loading-message">Failed to load wallpapers. Please try again later. 😟</p>';
    }
}

function renderPins(pins, boardName) {
    if (boardName) {
        const categoryHeader = document.createElement('h2');
        categoryHeader.classList.add('category-header');
        categoryHeader.textContent = boardName;
        gallery.appendChild(categoryHeader);
    }

    const categoryGrid = document.createElement('div');
    categoryGrid.classList.add('category-grid');

    pins.forEach(pin => {
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
        categoryGrid.appendChild(pinElement);
    });
    gallery.appendChild(categoryGrid);
}

function handleSearch() {
    const query = searchInput.value.toLowerCase();
    
    // Clear the gallery to show filtered results
    gallery.innerHTML = ''; 

    if (query === "") {
        fetchAndRenderPins(); // Re-render all pins if search box is empty
        return;
    }
    
    const filteredPins = allPins.filter(pin => 
        (pin.title && pin.title.toLowerCase().includes(query)) ||
        (pin.description && pin.description.toLowerCase().includes(query)) ||
        (pin.boardName && pin.boardName.toLowerCase().includes(query))
    );
    
    if (filteredPins.length > 0) {
        // Group pins by board for categorized search results
        const categorizedResults = {};
        filteredPins.forEach(pin => {
            if (!categorizedResults[pin.boardName]) {
                categorizedResults[pin.boardName] = [];
            }
            categorizedResults[pin.boardName].push(pin);
        });

        for (const boardName in categorizedResults) {
            renderPins(categorizedResults[boardName], boardName);
        }
    } else {
        gallery.innerHTML = '<p class="loading-message">No wallpapers found matching your search. 😞</p>';
    }
}

// Event listeners
searchInput.addEventListener('input', handleSearch);

// Initial fetch
fetchAndRenderPins();
