const API_URL = 'https://pokeapi.co/api/v2/pokemon';
const IMG_BASE_URL = 'https://assets.pokemon.com/assets/cms2/img/pokedex/full/';

let offset = 0;
const limit = 10;

document.addEventListener('DOMContentLoaded', () => {
    fetchPokemon();
});

async function fetchPokemon() {
    try {
        const response = await fetch(`${API_URL}?offset=${offset}&limit=${limit}`);
        const data = await response.json();

        const detailedPokemonPromises = data.results.map(pokemon => 
            fetch(pokemon.url).then(res => res.json())
        );

        const detailedPokemon = await Promise.all(detailedPokemonPromises);

        renderPokemon(detailedPokemon);
        offset += limit;
    } catch (error) {
        console.error("Error fetching Pokemon:", error);
    }
}

function renderPokemon(pokemonArray) {
    const container = document.getElementById('pokedex-container');

    pokemonArray.forEach(pokemon => {
        const formattedId = String(pokemon.id).padStart(3, '0');
        const assessmentImageUrl = `${IMG_BASE_URL}${formattedId}.png`;
        const backupImageUrl = pokemon.sprites.other['official-artwork'].front_default;

        const card = document.createElement('div');
        card.className = 'pokemon-card';

        card.innerHTML = `
            <img 
                src="${assessmentImageUrl}" 
                alt="${pokemon.name}" 
                onerror="this.onerror=null; this.src='${backupImageUrl}';"
            >
            <p>#${formattedId}</p>
            <h3>${pokemon.name}</h3>
            <div class="types">
                ${pokemon.types.map(t => `<span class="type-badge">${t.type.name}</span>`).join('')}
            </div>
        `;

        container.appendChild(card);
    });

    // CRITICAL FIX: Re-sort automatically after new Pokémon are loaded onto the screen!
    applyCurrentSort();
}

// --- Search Functionality ---
const searchInput = document.getElementById('search');

searchInput.addEventListener('keypress', async (event) => {
    if (event.key === 'Enter') {
        const query = searchInput.value.toLowerCase().trim();
        const container = document.getElementById('pokedex-container');
        const loadMoreBtn = document.getElementById('loadMoreBtn');

        if (!query) {
            container.innerHTML = '';
            offset = 0; 
            fetchPokemon();
            loadMoreBtn.classList.remove('hidden');
            return;
        }

        try {
            loadMoreBtn.classList.add('hidden');
            container.innerHTML = '<h2>Searching...</h2>';

            const response = await fetch(`${API_URL}/${query}`);
            
            if (!response.ok) {
                throw new Error("Pokémon not found");
            }

            const pokemon = await response.json();
            
            container.innerHTML = '';
            renderPokemon([pokemon]); 

        } catch (error) {
            container.innerHTML = `<h2>No Pokémon found matching "${query}". Please try another Name or ID.</h2>`;
        }
    }
});

// --- Sorting Functionality ---
function applyCurrentSort() {
    const container = document.getElementById('pokedex-container');
    const cards = Array.from(container.getElementsByClassName('pokemon-card'));
    const sortDropdown = document.getElementById('sortDropdown');
    
    // Safety check just in case the dropdown isn't loaded yet
    if (!sortDropdown) return; 
    
    const sortType = sortDropdown.value;

    cards.sort((a, b) => {
        const idA = a.querySelector('p').textContent;
        const idB = b.querySelector('p').textContent;
        const nameA = a.querySelector('h3').textContent;
        const nameB = b.querySelector('h3').textContent;

        if (sortType === 'id-asc') {
            return idA.localeCompare(idB);
        } else if (sortType === 'id-desc') {
            return idB.localeCompare(idA);
        } else if (sortType === 'name-asc') {
            return nameA.localeCompare(nameB);
        } else if (sortType === 'name-desc') {
            return nameB.localeCompare(nameA);
        }
    });

    // Re-append the cards in their correctly sorted order
    cards.forEach(card => container.appendChild(card));
}

// Trigger the sort function immediately when the user changes the dropdown option
const sortDropdown = document.getElementById('sortDropdown');
if (sortDropdown) {
    sortDropdown.addEventListener('change', applyCurrentSort);
}

// --- Load More Functionality ---
const loadMoreBtn = document.getElementById('loadMoreBtn');

loadMoreBtn.addEventListener('click', () => {
    loadMoreBtn.disabled = true;
    loadMoreBtn.textContent = 'Loading...';

    fetchPokemon().then(() => {
        loadMoreBtn.textContent = 'Load More';
        loadMoreBtn.disabled = false;
    });
});


// ==========================================
// --- DETAILED INFO MODAL & WEAKNESS LOGIC ---
// ==========================================

// 1. The Type Weakness Dictionary (Mapped to the "Weak Against" column per assessment logic)
const typeWeaknesses = {
    normal: ['rock', 'steel', 'ghost'],
    fighting: ['flying', 'poison', 'psychic', 'bug', 'ghost', 'fairy'],
    flying: ['rock', 'steel', 'electric'],
    poison: ['poison', 'ground', 'rock', 'ghost', 'steel'],
    ground: ['flying', 'bug', 'grass'],
    rock: ['fighting', 'ground', 'steel'],
    bug: ['fighting', 'flying', 'poison', 'ghost', 'steel', 'fire', 'fairy'],
    ghost: ['normal', 'dark'],
    steel: ['steel', 'fire', 'water', 'electric'],
    fire: ['rock', 'fire', 'water', 'dragon'],
    water: ['water', 'grass', 'dragon'],
    grass: ['flying', 'poison', 'bug', 'steel', 'fire', 'grass', 'dragon'],
    electric: ['ground', 'grass', 'electric', 'dragon'],
    psychic: ['steel', 'psychic', 'dark'],
    ice: ['steel', 'fire', 'water', 'ice'],
    dragon: ['steel', 'fairy'],
    dark: ['fighting', 'dark', 'fairy'],
    fairy: ['poison', 'steel', 'fire']
};

let currentModalPokemonId = null;

// 2. Event Delegation: Listen for clicks on any card inside the grid container
const gridContainer = document.getElementById('pokedex-container');
gridContainer.addEventListener('click', (event) => {
    // Find the closest parent element with the class 'pokemon-card'
    const card = event.target.closest('.pokemon-card');
    if (card) {
        // Extract the ID from the <p> tag inside the card (e.g., "#001" becomes 1)
        const idText = card.querySelector('p').textContent;
        const pokemonId = parseInt(idText.replace('#', ''), 10);
        openModal(pokemonId);
    }
});

// 3. Fetch specific data and open the modal
async function openModal(id) {
    try {
        currentModalPokemonId = id;
        const response = await fetch(`${API_URL}/${id}`);
        const pokemon = await response.json();

        // Format ID and set Header
        const formattedId = String(pokemon.id).padStart(3, '0');
        document.getElementById('modalName').textContent = pokemon.name;
        document.getElementById('modalId').textContent = `#${formattedId}`;
        
        // Handle Image with the same fallback trick
        const assessmentImageUrl = `${IMG_BASE_URL}${formattedId}.png`;
        const backupImageUrl = pokemon.sprites.other['official-artwork'].front_default;
        const modalImg = document.getElementById('modalImage');
        modalImg.src = assessmentImageUrl;
        modalImg.onerror = () => { modalImg.src = backupImageUrl; };

        // Populate Body (PokeAPI uses decimetres and hectograms, so we divide by 10)
        document.getElementById('modalHeight').textContent = `${pokemon.height / 10} m`;
        document.getElementById('modalWeight').textContent = `${pokemon.weight / 10} kg`;

        // Populate Types
        const typesContainer = document.getElementById('modalTypes');
        typesContainer.innerHTML = pokemon.types.map(t => `<span class="type-badge">${t.type.name}</span>`).join('');

        // Calculate Weaknesses based on the Pokémon's types
        const weaknessesContainer = document.getElementById('modalWeaknesses');
        let calculatedWeaknesses = new Set(); // Using a Set prevents duplicate weaknesses
        
        pokemon.types.forEach(t => {
            const typeName = t.type.name;
            if (typeWeaknesses[typeName]) {
                typeWeaknesses[typeName].forEach(weakness => calculatedWeaknesses.add(weakness));
            }
        });
        
        // Render Weaknesses with a slightly red background to distinguish them
        weaknessesContainer.innerHTML = Array.from(calculatedWeaknesses).map(w => 
            `<span class="type-badge" style="background-color: #ffcccc;">${w}</span>`
        ).join('');

        // Populate Base Stats
        const statsContainer = document.getElementById('modalStats');
        statsContainer.innerHTML = pokemon.stats.map(s => `
            <li>
                <strong>${s.stat.name.replace('-', ' ')}</strong>
                <span>${s.base_stat}</span>
            </li>
        `).join('');

        // Display the Modal
        document.getElementById('pokemon-modal').classList.remove('hidden');

    } catch (error) {
        console.error("Error loading Pokémon details:", error);
    }
}

// 4. Close Modal Logic
const closeModalBtn = document.getElementById('closeModal');
const modal = document.getElementById('pokemon-modal');

closeModalBtn.addEventListener('click', () => {
    modal.classList.add('hidden');
});

// Allow closing by clicking on the dark background outside the modal box
window.addEventListener('click', (event) => {
    if (event.target === modal) {
        modal.classList.add('hidden');
    }
});

// 5. Next and Previous Navigation
document.getElementById('prevBtn').addEventListener('click', () => {
    if (currentModalPokemonId > 1) {
        openModal(currentModalPokemonId - 1);
    }
});

document.getElementById('nextBtn').addEventListener('click', () => {
    // PokeAPI currently has just over 1000 Pokémon
    if (currentModalPokemonId < 1010) { 
        openModal(currentModalPokemonId + 1);
    }
});
