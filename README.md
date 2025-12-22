# 🍳 Recipe Genesis AI Lab 🤖

An intelligent web application that leverages AI (Google Gemini) to generate unique recipes based on user-provided ingredients and preferences. Features include recipe creation, modification via chat, user authentication, and recipe saving with an Appwrite backend.

<!-- Add a screenshot or GIF of the application here -->
<!-- ![App Screenshot](path/to/your/screenshot.png) -->

<!-- Optional: Add badges for build status, license, etc. -->
<!-- [![Build Status](https://img.shields.io/...)](link) -->
<!-- [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE) -->

<!-- Optional: Add a link to a live demo if available -->
<!-- **[Live Demo](your-deployment-link.com)** -->

---

## ✨ Features

*   **AI-Powered Recipe Generation:** Input ingredients and get unique recipes created by Google's Gemini AI.
*   **Customizable Preferences:** Tailor recipes by specifying dietary needs (Vegan, Gluten-Free, etc.), cuisine style, meal type, cooking time, and skill level.
*   **Ingredient Management:** Input ingredients via text or speech recognition (on supported browsers). Saved ingredients can be loaded from user profiles.
*   **Interactive AI Chatbot:** Modify generated recipes, ask for ingredient substitutions, scale servings, or ask general cooking questions.
*   **User Authentication:** Secure signup and login functionality using Appwrite.
*   **Saved Recipe Collection:** Logged-in users can save their favorite generated recipes.
*   **Recipe Editing:** Modify saved recipes.
*   **User Profiles:** Manage basic profile information and save default cooking preferences.
*   **Dark/Light Mode:** Theme toggling for user preference, saved to profile.
*   **Responsive Design:** Built with Tailwind CSS and shadcn/ui for usability across devices.
*   **Protected Routes:** Ensures certain pages (like 'My Recipes') are only accessible to logged-in users.

## 🛠️ Tech Stack

*   **Frontend Framework:** React 18 with TypeScript
*   **Build Tool:** Vite
*   **Styling:** Tailwind CSS
*   **UI Components:** shadcn/ui
*   **State Management:** React Context (Auth, Theme), TanStack Query
*   **Routing:** React Router v6
*   **AI Integration:** Google Gemini API (`@google/generative-ai`)
*   **Backend & Authentication:** Appwrite (Cloud or Self-Hosted)
*   **Linting:** ESLint with TypeScript ESLint plugin
*   **Type Checking:** TypeScript

## 🚀 Getting Started

Follow these instructions to set up and run the project locally.

### Prerequisites

*   **Node.js:** Version 18.x or higher recommended. (Use [nvm](https://github.com/nvm-sh/nvm) to manage Node versions).
*   **npm:** (Comes with Node.js) or Yarn/pnpm.
*   **Appwrite Instance:** You need a running Appwrite instance (Cloud or self-hosted).
*   **Google Gemini API Key:** Obtain an API key from [Google AI Studio](https://aistudio.google.com/).

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/ADITYAVOFFICIAL/AI_Recipes_Generator.git
    cd AI_Recipes_Generator
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    # yarn install
    # or
    # pnpm install
    ```

3.  **Set up Environment Variables:**
    Create a `.env` file in the root directory of the project by copying the example below. **Never commit your `.env` file to version control!**

    ```dotenv
    # .env.example - Copy this to .env and fill in your values

    # Google Gemini API Key
    VITE_GEMINI_API_KEY=YOUR_GEMINI_API_KEY

    # Appwrite Configuration
    VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1 # Or your self-hosted endpoint
    VITE_APPWRITE_PROJECT_ID=YOUR_APPWRITE_PROJECT_ID
    VITE_APPWRITE_DATABASE_ID=YOUR_APPWRITE_DATABASE_ID
    VITE_APPWRITE_COLLECTION_RECIPES=YOUR_RECIPES_COLLECTION_ID
    VITE_APPWRITE_COLLECTION_USER_PROFILES=YOUR_USER_PROFILES_COLLECTION_ID
    ```

    Replace the placeholder values (`YOUR_...`) with your actual credentials and IDs from Google AI Studio and your Appwrite project console.

    *   **Appwrite Setup:** Ensure you have created the necessary database and collections (`recipes`, `userProfiles`) in your Appwrite project with the appropriate attributes and permissions as implied by the `src/lib/appwrite.ts` file. The `userProfiles` collection should have attributes like `userId` (string, required, indexed), `dietaryPreferences` (string array), `cuisinePreferences` (string array), `skillLevel` (string), `darkMode` (boolean), `savedIngredients` (string array), `defaultServings` (integer), `displayName` (string), `avatarUrl` (string). Document-level permissions should allow the respective user read/write access. The `recipes` collection needs attributes matching `SavedRecipeDocument`.

### Running the Development Server

Start the Vite development server:

```bash
npm run dev
# or
# yarn dev
# or
# pnpm dev
```

The application should now be running, typically at http://localhost:8080 (as configured in vite.config.ts).

🏗️ Building for Production

To create an optimized production build:
```bash
npm run build
# or
# yarn build
# or
# pnpm build
```

The production-ready files will be generated in the dist/ directory.

⚙️ Environment Variables

The following environment variables are required for the application to function correctly. These should be placed in a .env file in the project root:
```bash
VITE_GEMINI_API_KEY: Your API key for accessing the Google Gemini API.

VITE_APPWRITE_ENDPOINT: The API endpoint URL for your Appwrite instance.

VITE_APPWRITE_PROJECT_ID: Your Appwrite project's unique ID.

VITE_APPWRITE_DATABASE_ID: The ID of the Appwrite database containing your collections.

VITE_APPWRITE_COLLECTION_RECIPES: The ID of the collection used to store saved recipes.

VITE_APPWRITE_COLLECTION_USER_PROFILES: The ID of the collection used to store user profile data and preferences.
```
📁 Folder Structure
```
adityavofficial-recipe-genesis-ai-lab/
├── public/             # Static assets (robots.txt, favicons, etc.)
├── src/
│   ├── components/     # Reusable UI components
│   │   ├── ui/         # Base UI primitives (shadcn/ui)
│   │   └── recipes/    # Recipe-specific components (Search, Filters)
│   ├── contexts/       # React Context providers (Auth, Theme)
│   ├── hooks/          # Custom React Hooks (useAuth, useTheme, etc.)
│   ├── lib/            # Utility functions, API clients (Appwrite, Gemini)
│   ├── pages/          # Page-level components mapped to routes
│   ├── types/          # TypeScript type definitions
│   ├── App.css         # Global App styles (if any beyond index.css)
│   ├── App.tsx         # Main application component, sets up routing & providers
│   ├── index.css       # Tailwind CSS setup and global styles
│   ├── main.tsx        # Entry point of the React application
│   └── vite-env.d.ts   # Vite environment types
├── .eslintrc.js        # ESLint configuration
├── components.json     # shadcn/ui configuration
├── index.html          # Main HTML entry point for Vite
├── package.json        # Project metadata and dependencies
├── postcss.config.js   # PostCSS configuration (for Tailwind)
├── tailwind.config.ts  # Tailwind CSS configuration
├── tsconfig.json       # Base TypeScript configuration
├── tsconfig.app.json   # App-specific TypeScript configuration
├── tsconfig.node.json  # Node-specific TypeScript configuration
├── vite.config.ts      # Vite build tool configuration
└── README.md           # This file```
```
## ☁️ Deployment

This project is built with Vite. You can deploy the static output from the `dist/` directory (after running `npm run build`) to any static hosting provider like:

*   [Vercel](https://vercel.com/)
*   [Netlify](https://www.netlify.com/)
*   [GitHub Pages](https://pages.github.com/)
*   [Render](https://render.com/)

Configure your hosting provider to serve the `index.html` file and ensure your environment variables are correctly set up in the deployment environment.

The original project scaffold might have mentioned [Lovable.dev](https://lovable.dev/) for deployment. You can continue using that platform if preferred, following their specific deployment instructions.

## 📄 License

<!-- Specify your license here, e.g., MIT -->
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details (if you add one).

## Acknowledgements

*   [shadcn/ui](https://ui.shadcn.com/) for the excellent UI components.
*   [Vite](https://vitejs.dev/) for the fast frontend tooling.
*   [Tailwind CSS](https://tailwindcss.com/) for utility-first styling.
*   [React](https://reactjs.org/) & [TypeScript](https://www.typescriptlang.org/)
*   [Appwrite](https://appwrite.io/) for the backend services.
*   [Google Gemini](https://ai.google.dev/) for the generative AI capabilities.

<!-- Deployment test update -->
<!-- trigger clean production deploy -->

