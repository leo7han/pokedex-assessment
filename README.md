# Rotom Dex!

A responsive, feature-rich Pokédex web application built as a technical assessment for the Old.St Labs Internship Program. 
This project fetches live data from the PokeAPI (https://pokeapi.co/) to display a comprehensive list of Pokémon, complete with a custom CSS Rotom Dex intro animation!

## Features

* **Dynamic Data Fetching:** Fetches and displays Pokémon data efficiently using pagination (10 Pokémon per load) via a "Load More" button.
* **Dual View Modes:** Seamlessly toggle between a detailed **Grid View** (showing sprite, name, ID, and types) and a sleek, minimalist **List View**.
* **Search & Filter:** Instantly search for any Pokémon by their specific Name or ID Number.
* **Custom Sorting:** Sort the loaded catalogue by ID (Lowest/Highest) or alphabetically by Name (A-Z/Z-A).
* **Detailed Info Modal:** Click on any Pokémon to view a detailed popup containing:
  * Official Artwork / Animated Sprites
  * Height & Weight
  * Base Stats visualized using a **Chart.js Radar Chart**
  * Pokémon Types
  * **Derived Weaknesses** (calculated dynamically based on the Pokémon's typing)
* **Master-Detail UI:** The sticky left panel updates dynamically to feature the currently selected Pokémon.
* **Dark Mode:** Fully supported dark/light theme toggle for better user accessibility and preference.
* **Rotom Dex Animation:** A purely CSS-driven 5-second intro animation of the Rotom Dex opening up the application.

## Technologies Used

* **HTML5:** Semantic markup and structure.
* **CSS3:** Advanced styling, CSS Grid/Flexbox layouts, dark mode variables, and complex `@keyframes` animations.
* **Vanilla JavaScript (ES6+):** DOM manipulation, event handling, asynchronous API fetching (`fetch`/`async`/`await`), and state management.
* **[Chart.js](https://www.chartjs.org/):** Used to render the interactive base stats radar chart.
* **[PokéAPI](https://pokeapi.co/):** The RESTful API used to gather Pokémon data, species information, and sprites.

