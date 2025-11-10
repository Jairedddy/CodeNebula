# CodeNebula - Transform your codebase into a galaxy of insights! 🌌

Explore your GitHub repositories in an interactive 3D visualization at [https://codenebulaa.netlify.app/](https://codenebulaa.netlify.app/).

## 🚀 Application Overview

CodeNebula is an interactive 3D visualization tool that transforms GitHub repositories into stunning "galaxy" visualizations. It empowers developers to explore codebases in an immersive, three-dimensional space, facilitating a deeper understanding of code structure, dependencies, and inter-file relationships.

### Core Functionality

1.  **GitHub Repository Analysis**
    *   Users input a GitHub repository URL.
    *   The application fetches and processes the repository structure using GitHub's API.
    *   Outputs a 3D galaxy visualization where each file is represented as a celestial body.

2.  **3D Galaxy Visualization**
    *   Files are displayed as colored spheres in 3D space, with colors indicating programming languages and sphere size reflecting file size.
    *   The most important file is highlighted as a central "star."
    *   Interactive features include camera rotation, zoom, pan, tooltips on hover, and detailed analysis on click.

3.  **Dependency Visualization**
    *   Offers "Structure Mode" (folder-based organization) and "Dependency Mode" (shows inter-file relationships).

4.  **AI-Powered Code Analysis**
    *   AI-generated summaries for any selected file, including its purpose, critical functions, and a refactoring priority score (1-5).
    *   Provides a preview of the actual code content.

### Key Features

*   **Visual Design**: Cyberpunk/space-themed dark interface with smooth animations, color-coded language identification, and a starfield background.
*   **Exploration Tools**: Interactive 3D navigation, file search and filtering, real-time tooltips, and detailed file information modals.
*   **AI Integration**: OpenAI-compatible API integration with configurable AI models for intelligent code analysis and JSON-structured responses.
*   **Repository Insights**: Displays total file count, estimated lines of code, language distribution, file size analysis, and importance scoring.

## 🛠️ Technical Architecture

### Frontend
*   **Framework**: React 18 with TypeScript
*   **Build Tool**: Vite 5
*   **3D Graphics**: Three.js
*   **Physics Simulation**: D3-Force-3D
*   **UI Components**: Radix UI + shadcn/ui
*   **Styling**: Tailwind CSS
*   **State Management**: React Query (TanStack Query)
*   **Routing**: React Router

### Backend
*   **Platform**: Supabase Edge Functions (Deno)
*   **Functions**:
    *   `analyze-repo`: Processes GitHub repository structure.
    *   `summarize-code`: Generates AI-powered code summaries.
*   **Database**: Supabase (for potential future features)

### APIs Used
*   **GitHub API**: For repository tree and file content.
*   **AI API**: For code analysis and summarization (OpenAI or compatible).

## ⚙️ Local Setup and Running Guide

### Prerequisites

Ensure you have the following installed:

1.  **Node.js** (version 20.19+ or 22.12+)
2.  **npm** (comes with Node.js)
3.  **Supabase CLI** (for local Supabase functions): Install via `npm install -g supabase`
4.  **Git** (for cloning repositories)

### Initial Setup

1.  **Navigate to the Project Directory**:
    ```powershell
    cd CodeNebula
    ```

2.  **Install Dependencies**:
    ```powershell
    npm install
    ```
    This installs all required dependencies, including React, Vite, Three.js, and Supabase.

3.  **Environment Variables Setup**:
    Create a `.env` file in the project root (`CodeNebula/.env`) with the following variables. Obtain these from your Supabase and AI service providers.

    ```env
    # Supabase Configuration
    VITE_SUPABASE_URL=your_supabase_project_url
    VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key

    # AI API Configuration (for code summarization)
    # Option 1: Use OpenAI
    OPENAI_API_KEY=your_openai_api_key

    # Option 2: Use a custom OpenAI-compatible API
    AI_API_KEY=your_ai_api_key
    AI_API_URL=https://api.openai.com/v1/chat/completions
    AI_MODEL=gpt-4o-mini
    ```
    *Note: You can use either `OPENAI_API_KEY` or `AI_API_KEY`. If using a custom API, set `AI_API_URL` and `AI_MODEL` accordingly.*

4.  **Supabase Functions Environment Variables**:
    For Supabase Edge Functions (located in `supabase/functions/`), set the following secrets in your Supabase project dashboard (**Settings** → **Edge Functions** → **Secrets**):
    *   `AI_API_KEY` or `OPENAI_API_KEY`
    *   `AI_API_URL` (optional)
    *   `AI_MODEL` (optional)

### Running the Application

*   **Development Mode**:
    ```powershell
    npm run dev
    ```
    The application will start on `http://localhost:8080`.

*   **Building for Production**:
    ```powershell
    npm run build
    ```
    Creates an optimized production build in the `dist/` directory.

*   **Preview Production Build**:
    ```powershell
    npm run preview
    ```

### Supabase Functions Setup (Optional for Local Development)

To run Supabase functions locally:

```powershell
supabase start
supabase functions deploy analyze-repo
supabase functions deploy summarize-code
```

To deploy functions to your Supabase project:

```powershell
supabase login
supabase link --project-ref your-project-ref
supabase functions deploy analyze-repo
supabase functions deploy summarize-code
```

## ⚠️ Troubleshooting

*   **Node.js Version Error**: Ensure Node.js is 20.19+ or 22.12+.
*   **Port Already in Use**: Change the port in `vite.config.ts` or terminate the conflicting process.
*   **Missing Environment Variables**: Verify `.env` file exists with all required variables and restart the dev server.
*   **Supabase Connection Issues**: Check `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, project status, and function deployment.
*   **AI API Errors**: Validate API key, check credits/quota, and ensure correct API endpoint URL.

## 👨‍💻 Development Workflow

1.  Make changes to your code.
2.  Save files for automatic hot module replacement (HMR).
3.  Test changes instantly in the browser.
4.  Monitor the console for errors or warnings.

### Project Structure

```
CodeNebula/
├── src/                    # Source code
│   ├── components/        # React components
│   ├── pages/            # Page components
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility functions
│   └── integrations/     # Supabase integration
├── supabase/
│   └── functions/       # Edge Functions
├── public/               # Static assets
├── package.json         # Dependencies
├── vite.config.ts      # Vite configuration
└── .env                 # Environment variables (create this)
```

### Additional Commands

*   `npm run lint` - Run ESLint to check code quality.
*   `npm run build:dev` - Build in development mode.

## 📖 Expanding the ESLint Configuration

For production applications, update your ESLint configuration to enable type-aware lint rules:

1.  **Configure `parserOptions`**:
    ```js
    export default {
      // other rules...
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: ['./tsconfig.json', './tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: __dirname,
      },
    }
    ```

2.  **Update `extends` list**:
    *   Replace `plugin:@typescript-eslint/recommended` with `plugin:@typescript-eslint/recommended-type-checked` or `plugin:@typescript-eslint/strict-type-checked`.
    *   Optionally add `plugin:@typescript-eslint/stylistic-type-checked`.
    *   Install `eslint-plugin-react` and add `plugin:react/recommended` & `plugin:react/jsx-runtime`.

---

Built by Jai Reddy
