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
- **Diplomacy System:** Allows countries to form alliances, declare war, make non-aggression pacts, and trade agreements through presidential actions. Includes a dedicated frontend page for managing diplomatic relations.
- **Enhanced Admin City Management:** Admins can now edit and delete cities through the admin panel.
- **Toast Notifications:** Implemented for improved user feedback on various actions across the application.
- Admin routes to seed initial data and manage gameplay.

## Tech Stack

- **Server**: Node.js, Express, Mongoose and MongoDB
- **Client**: React (Create React App), react-hot-toast
- **Auth**: JSON Web Tokens
- **Background jobs**: node-cron
- **Server-side Testing**: Jest, Supertest, @shelf/jest-mongodb
- **Client-side Testing**: Jest, React Testing Library (via Create React App)

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

Automated tests have been implemented for both backend and frontend components.

-   **Backend Testing:**
    *   Tests are written using Jest and Supertest, with an in-memory MongoDB instance managed by `@shelf/jest-mongodb`.
    *   Focuses on API route validation and behavior, particularly for new features like the Diplomacy API.
    *   Run backend tests with `npm test` in the `server` directory.
    *   Example test file: `server/routes/diplomacy.test.js`.

-   **Frontend Testing:**
    *   Tests use Jest and React Testing Library, as configured by Create React App.
    *   Focuses on component rendering, user interaction, and state changes, especially for pages with new functionality like `DiplomacyPage.jsx`.
    *   Run frontend tests with `npm test` in the `client` directory.
    *   Example test file: `client/src/pages/DiplomacyPage.test.jsx`.

## License

This project is licensed under the [Apache 2.0 License](LICENSE).
