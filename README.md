

# NepText 🇳🇵

NepText is a comprehensive Nepali Natural Language Processing (NLP) toolkit designed to enhance the digital experience of the Nepali language. It provides a suite of tools including sentiment analysis, spell correction, and context-aware word prediction.

## Demo


https://github.com/user-attachments/assets/e4d3e7f8-8e6d-4d9f-b44f-4a7c1204621a



## 🚀 Features

- **Sentiment Analysis**: Analyze the emotional tone of Nepali text with a 5-class classification system:
  - `Positive`
  - `Semi-Positive`
  - `Neutral`
  - `Semi-Negative`
  - `Negative`
- **Spell Correction**: Detect and correct spelling errors in Nepali text with intelligent suggestions.
- **Word Prediction**: Context-aware autocomplete and word predictions to speed up Nepali typing.

## 📦 Project Components

### 🌐 Web Application
A modern, responsive frontend built with **React**, **TypeScript**, and **Tailwind CSS**, providing a user-friendly interface to access all NLP tools.

### 🧩 Browser Extension
A Chrome/Edge compatible extension that brings NepText's capabilities directly into your browser, allowing for seamless text analysis and correction while browsing the web.

### ⚙️ Backend API
A high-performance API powered by **FastAPI** (Python), hosting the machine learning models for sentiment analysis, spell correction, and word prediction.

## 🛠️ Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS, Shadcn UI, TanStack Query.
- **Backend**: FastAPI, Uvicorn, Scikit-learn/Pickle (for ML models).
- **Deployment**: Railway (API), Vercel (Frontend).

## 🚦 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or later)
- [npm](https://www.npmjs.com/) or [bun](https://bun.sh/)

### Running the Frontend
1. Clone the repository:
   \`\`\`bash
   git clone https://github.com/kuusall/neptext.git
   cd neptext
   \`\`\`
2. Install dependencies:
   \`\`\`bash
   npm install
   # or
   bun install
   \`\`\`
3. Start the development server:
   \`\`\`bash
   npm run dev
   # or
   bun run dev
   \`\`\`
4. Open `http://localhost:5173` in your browser.

### Installing the Browser Extension
1. Open your browser's extension management page (e.g., `chrome://extensions/`).
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select the `extension` folder from this project.

## 📡 API Reference

The backend API is hosted at: `https://neptext-server-production.up.railway.app`

### Endpoints

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/health` | `GET` | Check if the server is healthy |
| `/sentiment` | `POST` | Analyze sentiment of the provided text |
| `/spell-correct` | `POST` | Correct spelling or get suggestions |
| `/word-predict` | `POST` | Get context-aware word predictions |

For detailed API documentation, visit the [OpenAPI Docs](https://neptext-server-production.up.railway.app/docs).

## 📜 License
This project is licensed under the MIT License.
