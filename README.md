# MP2

MP2 is an experimental multiplayer strategy game built with a MERN stack. The project consists of an Express + MongoDB API server and a React client application.

## Features

- JWT based authentication with role management (`player`, `president`, `admin`).
- Countries with weekly elections and scheduled promotion of winners.
- Resource system (money, oil) that grows over time.
- Unit and building types that players can create and purchase.
- Events for attacking, spying and nuking other countries.
- Cron job to resolve weekly elections and pending events automatically.
- React front end with pages for login, signup, dashboard, building and buying units, and more.
- Admin routes to seed initial data and manage gameplay.

## Tech Stack

- **Server**: Node.js, Express, Mongoose and MongoDB
- **Client**: React (Create React App)
- **Auth**: JSON Web Tokens
- **Background jobs**: node-cron

## Development

### Prerequisites

- Node.js (v14 or later)
- MongoDB instance
- npm

### Setup

1. Install dependencies for both server and client:
   ```bash
   cd server && npm install
   cd ../client && npm install
   ```
2. Create an `.env` file inside `server` with the following variables:
   ```
   MONGO_URI=mongodb://localhost:27017/mp2
   JWT_SECRET=supersecret
   PORT=5000
   ```
3. (Optional) Seed default unit types and resources using the admin route:
   ```bash
   curl -X POST -H "Authorization: Bearer <TOKEN>" http://localhost:5000/api/admin/seed
   ```

### Running

Start the Express server:
```bash
cd server
npm run dev
```

Start the React client:
```bash
cd client
npm start
```

The client will be available at [http://localhost:3000](http://localhost:3000) and the API at [http://localhost:5000](http://localhost:5000).

### Testing

`npm test` is currently a placeholder; there are no automated tests yet.

## License

This project is licensed under the [Apache 2.0 License](LICENSE).
