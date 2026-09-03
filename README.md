# 🎮 Gamified Learning

A MERN + TypeScript platform that turns coding practice into a game — tracks GitHub and LeetCode activity as XP, shows a GitHub-style contribution heatmap, and connects students through a college-wise community chat.

## Features

- 🔐 JWT-based authentication (signup/login)
- 👤 User profiles with editable bio, skills, socials, and college
- ⭐ XP system calculated from GitHub commits/PRs/issues/reviews and LeetCode submissions
- 🔥 App's own daily activity streak (independent of GitHub/LeetCode)
- 🟩 Coding activity heatmap (GitHub + LeetCode combined, cached in MongoDB for instant load)
- 💬 College-wise community chat on the Dashboard — students only see messages from their own college

## Tech Stack

- **Frontend:** React, TypeScript, Tailwind CSS, Vite
- **Backend:** Node.js, Express, TypeScript
- **Database:** MongoDB (Mongoose)
- **Auth:** JWT

## Project Structure

\`\`\`
client/   - React frontend
server/   - Express + MongoDB backend
\`\`\`

## Getting Started

### Prerequisites

- Node.js
- MongoDB (local or Atlas)

### Installation

\`\`\`bash
git clone https://github.com/your-username/gamified-learning.git
cd gamified-learning

# Backend
cd server
npm install

# Frontend
cd ../client
npm install
\`\`\`

### Environment Variables

Create \`server/.env\`:

\`\`\`
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secret
GITHUB_TOKEN=your_github_personal_access_token
PORT=5000
\`\`\`

### Running locally

\`\`\`bash
# Backend (from /server)
npm run dev

# Frontend (from /client)
npm run dev
\`\`\`

Frontend runs at \`http://localhost:5173\`, backend at \`http://localhost:5000\`.

## License

MIT