# Reef Pelagia EVM Faucet (GitHub OAuth Protected)

A minimal open-source EVM faucet that allows users to log in via GitHub and request tokens to their wallet addresses. Tokens are only sent to authenticated users.

---

<img width="2704" height="1524" alt="image" src="https://github.com/user-attachments/assets/d26fa7ac-569b-49fc-a897-1cf25624885d" />

<img width="2704" height="1526" alt="image" src="https://github.com/user-attachments/assets/0aae4b89-114f-4775-8d5b-b832f4666c70" />

<img width="2704" height="1522" alt="image" src="https://github.com/user-attachments/assets/18811d42-348a-4851-9e4c-61941e7934dd" />

<img width="2000" height="1238" alt="image" src="https://github.com/user-attachments/assets/c746555e-42c1-4bf9-97ff-2d3a8dd6076f" />

<img width="2704" height="1598" alt="image" src="https://github.com/user-attachments/assets/c1f92592-cd99-4c3e-a0e9-c161e9e9cbbc" />

## **Features**

* Login with GitHub OAuth
* Protected `/tokens` route (only accessible if GitHub authenticated)
* Input wallet address and request tokens
* Minimal backend with Express.js
* Frontend in React.js TS

---

## **Directory Structure**

```
root/
├── server/      # Node.js backend
│   ├── index.js
│   └── package.json
├── client/      # React frontend
│   ├── src/
│   │   └── App.tsx
│   └── package.json
└── README.md
```

---

## **Setup Instructions**

### **1. GitHub OAuth App Setup**

1. Go to **GitHub → Settings → Developer Settings → OAuth Apps → Register a new OAuth app**.
2. Fill the form:

   * **Application Name:** `Reef Pelagia EVM Faucet` (or any recognizable name)
   * **Homepage URL:** `http://localhost:5173` (React frontend URL)
   * **Authorization Callback URL:** `http://localhost:4000/auth/github/callback` (Node backend endpoint)
3. After registering, save the:

   * **Client ID** → `.env` as `GITHUB_CLIENT_ID`
   * **Client Secret** → `.env` as `GITHUB_CLIENT_SECRET`

---

### **2. Backend Setup (Node.js + Express)**

1. Navigate to the server folder:

```bash
cd server
```

2. Create a `.env` file with:

```env
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
GITHUB_REDIRECT_URI=http://localhost:4000/auth/github/callback
FRONTEND_URL=http://localhost:5173
PORT=4000
```

3. Install dependencies:

```bash
npm install
```

4. Start the backend server:

```bash
npm run dev
```

The backend will run on `http://localhost:4000`.

---

### **3. Frontend Setup (React.js)**

1. Navigate to the client folder:

```bash
cd client
```

2. Install dependencies:

```bash
npm install
```

3. Start the React app:

```bash
npm run dev
```

The frontend will run on `http://localhost:5173`.

---

## **Usage**

1. Open `http://localhost:5173` in your browser.
2. Click **Login with GitHub** → authorize OAuth app.
3. Once logged in, an input field appears to enter your **wallet address**.
4. Enter the address and click **Send Tokens**.
5. Backend verifies GitHub token and responds with:

```json
{ "message": "Tokens sent" }
```

---

## **How It Works**

1. **Frontend**: React app handles GitHub login and stores the OAuth token in state.
2. **Backend**: Express server handles:

   * `/auth/github` → redirects to GitHub for OAuth
   * `/auth/github/callback` → exchanges code for GitHub access token
   * `/tokens` → protected route that requires a valid GitHub token
3. **Protected route**: `/tokens` requires `Authorization: Bearer <token>` header. Only verified users can request tokens.
4. **Token request**: Backend validates the token via GitHub API and responds with `"Tokens sent"`.
