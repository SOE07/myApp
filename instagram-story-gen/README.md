# Instagram Story Generator

A web-based tool for creating Instagram Stories (1080×1920) with customizable text, backgrounds, and layouts.

## Tech Stack

- **Vite** 7 — build tool
- **React** 19 — UI framework
- **Tailwind CSS** 4 — utility-first styling
- **Canvas API** — story rendering at 1080×1920

## Getting Started

```bash
cd instagram-story-gen
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

## Project Structure

```
src/
├── main.jsx              # React entry point
├── index.css             # Tailwind CSS import
├── App.jsx               # Main app component
└── utils/
    └── renderCanvas.js   # Canvas rendering engine (1080×1920)
```
