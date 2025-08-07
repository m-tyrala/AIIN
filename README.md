# AIIN - RPG Assistant for NPC Profiles

## Table of Contents
- [Project Name](#project-name)
- [Project Description](#project-description)
- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
- [Available Scripts](#available-scripts)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [License](#license)

## Project Name
**AIIN**

## Project Description
AIIN is an AI assistant designed for tabletop RPG game masters to quickly create and manage Non-Playable Character (NPC) profiles. The application streamlines the process of generating detailed NPC descriptions based on minimal input, making session preparations fast and efficient. Key features include NPC profile generation, CRUD management, integration of existing profiles, secure authentication, and performance monitoring.

## Tech Stack
- **Frontend:**
  - [Astro 5](https://docs.astro.build)
  - [React 19](https://reactjs.org/)
  - [TypeScript 5](https://www.typescriptlang.org/)
  - [Tailwind CSS 4](https://tailwindcss.com/)
  - [Shadcn/ui](https://ui.shadcn.com/)
- **Backend:**
  - [Supabase](https://supabase.com/) with PostgreSQL
  - AI services integration via [Openrouter.ai](https://openrouter.ai/)
- **Testing:**
  - Unit tests: [Vitest](https://vitest.dev/), [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/), [MSW](https://mswjs.io/) (mockowanie HTTP)
  - E2E tests: [Playwright](https://playwright.dev/) (Chromium/Firefox/WebKit), [@axe-core/playwright](https://github.com/dequelabs/axe-core-npm/tree/develop/packages/playwright) (testy dostępności)
- **CI/CD & Hosting:**
  - GitHub Actions for CI/CD pipelines
  - DigitalOcean for hosting and deployment

## Getting Started Locally
1. **Clone the repository:**
   ```sh
   git clone <repository-url>
   cd AIIN
   ```
2. **Install dependencies:**
   ```sh
   npm install
   ```
3. **Run the development server:**
   ```sh
   npm run dev
   ```
4. **Open your browser:**
   Visit `http://localhost:4321`

## Available Scripts
- **`npm run dev`** : Starts the local development server.
- **`npm run build`** : Builds the project for production.
- **`npm run preview`** : Previews the production build locally.
- **`npm run astro`** : Runs Astro CLI commands (e.g., `astro add`, `astro check`).

## Project Scope
- **NPC Profile Generation:** Quickly create detailed profiles with options for simplified, normal, and detailed descriptions.
- **CRUD Management:** Provides a dedicated interface for creating, editing, deleting, and viewing NPC profiles.
- **Profile Integration:** Ability to integrate existing NPC profiles via a multi-select list.
- **User Authentication:** Secure login through default Supabase authentication methods.
- **Performance Monitoring:** Tracks profile edits and interactions to assess efficiency.

## Project Status
Currently under active development. The project is continuously evolving with planned improvements and additional features based on user feedback.

## License
This project is licensed under the GNU GENERAL PUBLIC LICENSE.
