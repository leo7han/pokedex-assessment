const API_URL = 'https://pokeapi.co/api/v2/pokemon';
const SPECIES_URL = 'https://pokeapi.co/api/v2/pokemon-species';
const IMG_BASE_URL = 'https://assets.pokemon.com/assets/cms2/img/pokedex/full/';

let offset = 0;
const limit = 10;
let currentlyFeaturedId = 1; 
let radarChartInstance = null;

const themeToggle = document.getElementById('themeToggle');
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    
    if (radarChartInstance) {
        const isDark = document.body.classList.contains('dark-mode');
        radarChartInstance.options.scales.r.pointLabels.color = isDark ? '#fff' : '#333';
        radarChartInstance.options.scales.r.grid.color = isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)';
        radarChartInstance.options.scales.r.angleLines.color = isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)';
        radarChartInstance.update();
    }
});

document.getElementById('homeBtn').addEventListener('click', async () => {
    const searchInput = document.getElementById('search');
    const container = document.getElementById('pokedex-container');
    
    if (searchInput.value.trim() !== '' || container.children.length === 1) {
        searchInput.value = '';
        offset = 0;
        container.innerHTML = '';
        document.getElementById('loadMoreBtn').classList.remove('hidden');
        await fetchPokemon();
    } else {
        updateLeftPanelFromModal(1);
    }
    
    document.querySelector('.right-panel').scrollTo({ top: 0, behavior: 'smooth' });
});

const viewToggleBtn = document.getElementById('viewToggleBtn');
const pokedexContainer = document.getElementById('pokedex-container');
const rightPanel = document.querySelector('.right-panel');

let isGridView = true;
pokedexContainer.classList.remove('list-container');
pokedexContainer.classList.add('grid-container');
viewToggleBtn.innerHTML = '<span class="icon-list">☰</span>';
rightPanel.style.width = '500px'; 

viewToggleBtn.addEventListener('click', () => {
    isGridView = !isGridView;
    if (isGridView) {
        pokedexContainer.classList.remove('list-container');
        pokedexContainer.classList.add('grid-container');
        viewToggleBtn.innerHTML = '<span class="icon-list">☰</span>';
        rightPanel.style.width = '500px'; 
    } else {
        pokedexContainer.classList.remove('grid-container');
        pokedexContainer.classList.add('list-container');
        viewToggleBtn.innerHTML = '<span class="icon-grid">⊞</span>';
        rightPanel.style.width = '380px'; 
    }
});

const customSort = document.getElementById('customSort');
const sortSelected = customSort.querySelector('.sort-selected');
const sortText = customSort.querySelector('.sort-text');
let currentSortValue = 'id-asc';

sortSelected.addEventListener('click', () => {
    customSort.classList.toggle('open');
});

document.querySelectorAll('.sort-option').forEach(option => {
    option.addEventListener('click', function() {
        sortText.textContent = this.textContent;
        currentSortValue = this.getAttribute('data-value');
        customSort.classList.remove('open');
        applyCurrentSort();
    });
});

document.addEventListener('click', (e) => {
    if (!customSort.contains(e.target)) {
        customSort.classList.remove('open');
    }
});

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
        
        if (offset === 0 && detailedPokemon.length > 0) {
            const first = detailedPokemon[0];
            const formattedId = String(first.id).padStart(3, '0');
            const img = `${IMG_BASE_URL}${formattedId}.png`;
            const backup = first.sprites.other['official-artwork'].front_default;
            updateFeaturedPanel(first.id, first.name, formattedId, img, backup, first.types);
        }
        
        offset += limit;
    } catch (error) {
        console.error("Error fetching Pokemon:", error);
    }
}

function renderPokemon(pokemonArray) {
    const container = document.getElementById('pokedex-container');

    pokemonArray.forEach(pokemon => {
        const formattedId = String(pokemon.id).padStart(3, '0');
        const officialImageUrl = `${IMG_BASE_URL}${formattedId}.png`;
        const backupImageUrl = pokemon.sprites.other['official-artwork'].front_default;
        
        const listSprite = pokemon.sprites.front_default || backupImageUrl;
        
        const typesHTML = pokemon.types.map(t => 
            `<span class="list-type type-${t.type.name}">${t.type.name}</span>`
        ).join('');

        const row = document.createElement('div');
        row.className = 'pokemon-list-item';
        
        if (pokemon.id === currentlyFeaturedId) {
            row.classList.add('active');
        }

        row.innerHTML = `
            <div class="id-number"><span>No.</span><span>${formattedId}</span></div>
            <img src="${listSprite}" class="list-sprite" alt="${pokemon.name} sprite">
            <div class="list-info">
                <span class="name">${pokemon.name}</span>
                <div class="list-types">${typesHTML}</div>
            </div>
        `;

        row.addEventListener('click', () => {
            document.querySelectorAll('.pokemon-list-item').forEach(el => el.classList.remove('active'));
            row.classList.add('active');
            updateFeaturedPanel(pokemon.id, pokemon.name, formattedId, officialImageUrl, backupImageUrl, pokemon.types);
        });

        container.appendChild(row);
    });

    applyCurrentSort();
}

async function updateFeaturedPanel(id, name, formattedId, primaryImg, backupImg, typesArray) {
    currentlyFeaturedId = id;
    
    document.getElementById('stat-id').textContent = `#${formattedId}`;
    document.getElementById('stat-name').textContent = name;
    
    if (typesArray) {
        const typeHTML = typesArray.map(t => `<span class="type-badge type-${t.type.name}">${t.type.name}</span>`).join('');
        document.getElementById('stat-type').innerHTML = typeHTML;
    }
    
    const imgEl = document.getElementById('featuredImage');
    imgEl.src = primaryImg;
    imgEl.onerror = () => { imgEl.src = backupImg; };

    const infoContainer = document.getElementById('featuredInfo');
    
    if(infoContainer.innerHTML === "") {
        infoContainer.innerHTML = "Loading data...";
    }
    
    try {
        const speciesRes = await fetch(`${SPECIES_URL}/${id}`);
        const speciesData = await speciesRes.json();
        
        const flavorEntry = speciesData.flavor_text_entries.find(entry => entry.language.name === 'en');
        const description = flavorEntry ? flavorEntry.flavor_text.replace(/\f|\n|\r/g, ' ') : 'No description available.';
        
        const generaEntry = speciesData.genera.find(g => g.language.name === 'en');
        const genus = generaEntry ? generaEntry.genus : 'Unknown Pokémon';
        
        infoContainer.innerHTML = `
            <p style="color: #e3350d; font-family: 'Press Start 2P', cursive; font-size: 14px; margin-bottom: 20px;">The ${genus}</p>
            <p>${description}</p>
        `;
    } catch (error) {
        infoContainer.innerHTML = "Error loading information.";
    }
}

document.getElementById('viewDetailsBtn').addEventListener('click', () => {
    openModal(currentlyFeaturedId);
});

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
            container.innerHTML = '<h2 style="color: white; text-align: center;">Searching...</h2>';

            const response = await fetch(`${API_URL}/${query}`);
            if (!response.ok) throw new Error("Pokémon not found");

            const pokemon = await response.json();
            container.innerHTML = '';
            renderPokemon([pokemon]); 
            
            const formattedId = String(pokemon.id).padStart(3, '0');
            const officialImageUrl = `${IMG_BASE_URL}${formattedId}.png`;
            const backupImageUrl = pokemon.sprites.other['official-artwork'].front_default;
            updateFeaturedPanel(pokemon.id, pokemon.name, formattedId, officialImageUrl, backupImageUrl, pokemon.types);
            
            const newRow = container.querySelector('.pokemon-list-item');
            if(newRow) newRow.classList.add('active');

        } catch (error) {
            container.innerHTML = `<h2 style="color: white; text-align: center;">No Pokémon found matching "${query}".</h2>`;
        }
    }
});

function applyCurrentSort() {
    const container = document.getElementById('pokedex-container');
    const rows = Array.from(container.getElementsByClassName('pokemon-list-item'));

    rows.sort((a, b) => {
        const idA = a.querySelector('.id-number').textContent.replace('No. ', '');
        const idB = b.querySelector('.id-number').textContent.replace('No. ', '');
        const nameA = a.querySelector('.name').textContent;
        const nameB = b.querySelector('.name').textContent;

        if (currentSortValue === 'id-asc') return idA.localeCompare(idB);
        if (currentSortValue === 'id-desc') return idB.localeCompare(idA);
        if (currentSortValue === 'name-asc') return nameA.localeCompare(nameB);
        if (currentSortValue === 'name-desc') return nameB.localeCompare(nameA);
    });

    rows.forEach(row => container.appendChild(row));
}

const loadMoreBtn = document.getElementById('loadMoreBtn');
loadMoreBtn.addEventListener('click', () => {
    loadMoreBtn.disabled = true;
    loadMoreBtn.textContent = 'Loading...';
    fetchPokemon().then(() => {
        loadMoreBtn.textContent = 'Load More';
        loadMoreBtn.disabled = false;
    });
});

const typeWeaknesses = {
    normal: ['rock', 'steel', 'ghost'], fighting: ['flying', 'poison', 'psychic', 'bug', 'ghost', 'fairy'],
    flying: ['rock', 'steel', 'electric'], poison: ['poison', 'ground', 'rock', 'ghost', 'steel'],
    ground: ['flying', 'bug', 'grass'], rock: ['fighting', 'ground', 'steel'],
    bug: ['fighting', 'flying', 'poison', 'ghost', 'steel', 'fire', 'fairy'], ghost: ['normal', 'dark'],
    steel: ['steel', 'fire', 'water', 'electric'], fire: ['rock', 'fire', 'water', 'dragon'],
    water: ['water', 'grass', 'dragon'], grass: ['flying', 'poison', 'bug', 'steel', 'fire', 'grass', 'dragon'],
    electric: ['ground', 'grass', 'electric', 'dragon'], psychic: ['steel', 'psychic', 'dark'],
    ice: ['steel', 'fire', 'water', 'ice'], dragon: ['steel', 'fairy'],
    dark: ['fighting', 'dark', 'fairy'], fairy: ['poison', 'steel', 'fire']
};

let currentModalPokemonId = null;

async function openModal(id) {
    try {
        currentModalPokemonId = id;
        const response = await fetch(`${API_URL}/${id}`);
        const pokemon = await response.json();

        const formattedId = String(pokemon.id).padStart(3, '0');
        document.getElementById('modalName').textContent = pokemon.name;
        document.getElementById('modalId').textContent = `#${formattedId}`;
        
        const animatedSpriteUrl = pokemon.sprites?.versions?.['generation-v']?.['black-white']?.animated?.front_default;
        const fallbackImageUrl = pokemon.sprites.front_default || pokemon.sprites.other['official-artwork'].front_default;
        
        document.getElementById('modalImage').src = animatedSpriteUrl || fallbackImageUrl;

        document.getElementById('modalHeight').textContent = `${pokemon.height / 10} m`;
        document.getElementById('modalWeight').textContent = `${pokemon.weight / 10} kg`;

        const typesContainer = document.getElementById('modalTypes');
        typesContainer.innerHTML = pokemon.types.map(t => 
            `<span class="type-badge type-${t.type.name}">${t.type.name}</span>`
        ).join('');

        const weaknessesContainer = document.getElementById('modalWeaknesses');
        let calculatedWeaknesses = new Set(); 
        pokemon.types.forEach(t => {
            const typeName = t.type.name;
            if (typeWeaknesses[typeName]) typeWeaknesses[typeName].forEach(w => calculatedWeaknesses.add(w));
        });
        weaknessesContainer.innerHTML = Array.from(calculatedWeaknesses).map(w => 
            `<span class="type-badge type-${w}">${w}</span>`
        ).join('');

        const statsContainer = document.getElementById('modalStats');
        statsContainer.innerHTML = pokemon.stats.map(s => {
            let statName = s.stat.name.toUpperCase();
            if(statName === 'SPECIAL-ATTACK') statName = 'SP. ATK';
            if(statName === 'SPECIAL-DEFENSE') statName = 'SP. DEF';
            
            return `
                <div class="stat-grid-box">
                    <span>${statName}</span>
                    <span class="stat-divider">|</span>
                    <span>${s.base_stat}</span>
                </div>
            `;
        }).join('');

        document.getElementById('pokemon-modal').classList.remove('hidden');

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                renderRadarChart(pokemon.stats);
            });
        });

    } catch (error) {
        console.error("Error loading the Pokémon details:", error);
    }
}

function renderRadarChart(statsArray) {
    const ctx = document.getElementById('statsRadarChart').getContext('2d');
    const isDark = document.body.classList.contains('dark-mode');
    
    const labelColor = isDark ? '#fff' : '#333';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)';
    
    const labels = statsArray.map(s => {
        const name = s.stat.name.toUpperCase();
        if (name === 'SPECIAL-ATTACK') return ['SPECIAL', 'ATTACK'];
        if (name === 'SPECIAL-DEFENSE') return ['SPECIAL', 'DEFENSE'];
        return name;
    });
    
    const dataValues = statsArray.map(s => s.base_stat);

    if (radarChartInstance) {
        radarChartInstance.destroy();
    }

    radarChartInstance = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Base Stats',
                data: dataValues,
                backgroundColor: 'rgba(74, 144, 226, 0.4)', 
                borderColor: 'rgba(74, 144, 226, 1)',
                borderWidth: 3, 
                pointBackgroundColor: '#e3350d', 
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: '#e3350d',
                pointRadius: 4 
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false, 
            scales: {
                r: {
                    angleLines: { color: gridColor },
                    grid: { color: gridColor, circular: true },
                    pointLabels: { font: { size: 14, family: 'Nunito', weight: '900' }, color: labelColor },
                    ticks: { display: false, min: 0, max: 200 }
                }
            },
            plugins: { legend: { display: false } }
        }
    });
}

const closeModalBtn = document.getElementById('closeModal');
const pokemonModal = document.getElementById('pokemon-modal');
closeModalBtn.addEventListener('click', () => pokemonModal.classList.add('hidden'));

const aboutBtn = document.getElementById('aboutBtn');
const aboutModal = document.getElementById('about-modal');
const closeAboutModal = document.getElementById('closeAboutModal');
aboutBtn.addEventListener('click', () => aboutModal.classList.remove('hidden'));
closeAboutModal.addEventListener('click', () => aboutModal.classList.add('hidden'));

window.addEventListener('click', (event) => { 
    if (event.target === pokemonModal) pokemonModal.classList.add('hidden'); 
    if (event.target === aboutModal) aboutModal.classList.add('hidden');
});

document.getElementById('prevBtn').addEventListener('click', () => {
    if (currentModalPokemonId > 1) {
        const prevId = currentModalPokemonId - 1;
        openModal(prevId);
        updateLeftPanelFromModal(prevId);
    }
});

document.getElementById('nextBtn').addEventListener('click', () => {
    if (currentModalPokemonId < 1010) { 
        const nextId = currentModalPokemonId + 1;
        openModal(nextId);
        updateLeftPanelFromModal(nextId);
    }
});

async function updateLeftPanelFromModal(id) {
    try {
        const response = await fetch(`${API_URL}/${id}`);
        const pokemon = await response.json();
        const formattedId = String(pokemon.id).padStart(3, '0');
        
        const officialImageUrl = `${IMG_BASE_URL}${formattedId}.png`;
        const backupImageUrl = pokemon.sprites.other['official-artwork'].front_default;
        
        updateFeaturedPanel(pokemon.id, pokemon.name, formattedId, officialImageUrl, backupImageUrl, pokemon.types);
        
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        while (id > offset) {
            loadMoreBtn.disabled = true;
            loadMoreBtn.textContent = 'Loading...';
            await fetchPokemon(); 
        }
        loadMoreBtn.disabled = false;
        loadMoreBtn.textContent = 'Load More';

        document.querySelectorAll('.pokemon-list-item').forEach(el => {
            el.classList.remove('active');
            if (el.querySelector('.id-number').textContent.includes(formattedId)) {
                el.classList.add('active');
                el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        });
    } catch (error) {
        console.error("Left Panel is not updating:", error);
    }
}