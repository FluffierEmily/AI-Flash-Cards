# AI-powered Flash Cards

A highly customizable, modern offline-first Single Page Application (SPA) and Progressive Web App (PWA) designed to supercharge learning through spaced repetition and intelligent, AI-driven answer scoring and card creation.

## 🛠️ Tech Stack
- **Frontend Framework:** React (SPA)
- **Build System:** Vite
- **PWA Support:** `vite-plugin-pwa` (offline asset caching, custom service worker, and web app manifest)
- **Styling:** shadcn/ui (React components built with Tailwind CSS & Radix UI for premium, customizable, and accessible aesthetics)
- **Package Manager:** `pnpm`
- **AI Integration:** Vercel AI SDK (unified, type-safe client-side LLM calls and structured feedback generation)
- **Push Notifications:** Firebase Cloud Messaging (FCM) (configured via service worker and Bring Your Own Project)
- **Local Storage:** IndexedDB (for high-performance offline-first local data storage)

## ✨ Core Features
1. **AI-Generated Scoring & Feedback**
   - Traditional flashcards rely on binary self-grading (e.g., "Got it" / "Forgot it").
   - This app supports free text or spoken answers scored by AI (via Gemini/LLM) for accuracy and completeness.
   - Score influences SRS: NextInterval and EaseFactor.
   - Contextual feedback highlighting what was right, what was wrong, and suggestions for improvement.
   - Bring Your Own Key (BYOK) support
2. **Spaced Repetition System (SRS)**
   - Algorithmic scheduling (SM-2 or similar) to present cards at optimal intervals based on your past score history.
   - Automatically adapts to your pace and custom difficulty levels.
3. **Offline-First & Data Portability**
   - **PWA Installability & Offline Cache:** Can be installed directly onto desktop or mobile home screens. Assets, routes, and UI are fully cached offline via Service Worker.
   - **Local IndexedDB Database:** All flashcard decks, study history, and SRS intervals are stored entirely locally in your browser.
   - **CSV Export & Import:** Full support for exporting and importing your card decks as CSV files for easy backups, edits in spreadsheet tools, or migrating decks.
4. **Independent Push Notifications**
   - System-level browser notifications using Firebase Cloud Messaging (FCM) to alert you when reviews are due, even if the app is closed.
5. **High Customizability**
   - Create custom card types with custom AI eval prompts.
   - Support markdown formatting and code snippets with syntax highlighting in the most common programming languages and CLI scripts.
6. **Quality of Life Features**
   - Sleek modern minimalist design with responsive layouts and smooth, but snappy card-flipping/swipe transitions.
   - Keyboard shortcut support for quick, friction-free study sessions.

## 🚀 Getting Started

### 📋 Prerequisites
- [Node.js](https://nodejs.org/) (v24 or higher)
- [pnpm](https://pnpm.io/) (`npm install -g pnpm`)

### ⚙️ Installation & Setup

<!-- TODO: Add installation and setup instructions once project is finalized and stable -->

## 🗺️ Project Roadmap
- [x] Initialize Vite React + TypeScript template.
- [ ] Setup shadcn/ui, styling, and theme configuration.
- [ ] Configure PWA support (`vite-plugin-pwa`, web manifest, icons).
- [ ] Implement deck management and flashcard creation workflows.
- [ ] Build the interactive review session UI (card viewer, keyboard controls).
- [ ] Integrate local spaced repetition scheduling logic.
- [ ] Add the AI evaluation layer (LLM scoring endpoint).
- [ ] Setup Firebase Cloud Messaging for PWA background push notifications.
- [ ] Design statistics and progress tracking dashboards.
