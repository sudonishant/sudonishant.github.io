# Neeshant Portfolio Arcade

An interactive portfolio website that combines a personal developer brand, featured projects, browser games, and a support page in one GitHub Pages experience.

## Why This Project Exists

Most portfolio sites stop at a project list. This one is designed to feel more memorable and more useful: visitors can understand the builder, browse real work, and interact with original browser games in the same experience.

## Key Features

- Premium landing page with a strong creator-focused introduction
- Project showcase for Neeshant's web, AI, and automation work
- Dedicated browser-game arcade with multiple playable mini games
- Separate donation/support page with a themed interaction flow
- Responsive layout with custom visual styling and animated presentation
- GitHub Pages-friendly static architecture with no build step required

## Live Demo

- Portfolio home: [https://sudonishant.github.io/](https://sudonishant.github.io/)
- Games hub: [https://sudonishant.github.io/games.html](https://sudonishant.github.io/games.html)
- Support page: [https://sudonishant.github.io/donate.html](https://sudonishant.github.io/donate.html)

## Tech Stack

- HTML5
- CSS3
- JavaScript
- GitHub Pages
- Google Fonts

## Project Structure

```text
.
|-- index.html
|-- games.html
|-- donate.html
|-- styles.css
|-- script.js
|-- games/
|   |-- hub.js
|   |-- arcade.css
|   |-- arcade-core.js
|   |-- bug-catcher-run.html
|   |-- bug-catcher-run.js
|   |-- codequiz-blitz.html
|   |-- codequiz-blitz.js
|   |-- desi-detective.html
|   |-- desi-detective.js
|   |-- memory-stack-tech.html
|   |-- memory-stack-tech.js
|   |-- pathfinder-arena.html
|   |-- pathfinder-arena.js
|   |-- patna-1-space-shooter.html
|   |-- patna-1-space-shooter.js
|   |-- roast-arena.html
|   |-- roast-arena.js
|   |-- signal-heist.html
|   |-- signal-heist.js
|   |-- tower-slice-precision.html
|   |-- tower-slice-precision.js
|   |-- type-racer-code-lab.html
|   |-- type-racer-code-lab.js
|-- vendor/
|-- profile-photo.jpg
|-- main-photo.jpg
|-- donation-photo.png
|-- favicon.svg
`-- favicon-photo.png
```

## Local Setup

1. Clone the repository.
2. Open the project folder.
3. Run a simple static server.

```bash
python -m http.server 8080
```

4. Visit `http://localhost:8080`.

You can also open `index.html` directly, but a local server is better for consistent browser behavior.

## Deployment

This repository is optimized for GitHub Pages.

1. Push changes to the default branch.
2. Enable GitHub Pages from the repository settings.
3. Use the root folder as the publishing source.

## Author

Built by Neeshant
