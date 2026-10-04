# Copilot Instructions for StockPrediction

## Project Overview
- This is a full-stack stock prediction web app with a Node.js/Express backend and a static HTML/JS frontend.
- Backend code is in `backend/` (API, authentication, user management).
- Frontend code is in `frontend/` (HTML, CSS, vanilla JS for UI and API calls).

## Architecture & Data Flow
- API endpoints are defined in `backend/routes/` and implemented in `backend/controllers/`.
- User authentication uses JWT, with logic in `backend/controllers/authController.js` and middleware in `backend/middleware/auth.js`.
- User data model is in `backend/models/User.js`.
- The frontend makes HTTP requests (typically via `fetch`) to backend endpoints for login, signup, and stock data.
- Static assets are served from the `frontend/` directory.

## Developer Workflows
- Start the backend: `cd backend && node server.js` (ensure dependencies from `package.json` are installed).
- No build step for the frontend; open HTML files directly in a browser.
- Environment variables are managed via `.env` in `backend/`.
- No test suite or test runner is present by default.

## Project-Specific Patterns
- All backend routes are grouped by resource (e.g., `auth.js` for authentication) and use controller functions for logic separation.
- Middleware is used for authentication checks on protected routes.
- Frontend JS files (e.g., `main.js`, `stock-data.js`) are responsible for DOM updates and API calls.
- No frontend framework is used; all UI logic is vanilla JS.

## Integration Points
- Backend and frontend communicate via RESTful HTTP endpoints (see `backend/routes/`).
- User authentication is handled via JWT tokens stored in the browser (usually in localStorage or cookies).
- To add a new API, create a route in `backend/routes/`, implement logic in `backend/controllers/`, and register the route in `server.js`.

## Examples
- To add a new protected stock data endpoint:
  1. Add route in `backend/routes/stock.js`.
  2. Implement handler in `backend/controllers/stockController.js`.
  3. Register the route in `server.js`.
  4. Call the endpoint from a frontend JS file.

## Key Files
- `backend/server.js`: Main server entry point, route registration.
- `backend/routes/`: API route definitions.
- `backend/controllers/`: Business logic for each route.
- `backend/middleware/auth.js`: JWT authentication middleware.
- `frontend/`: All static assets and client-side logic.

---
For more details, see the structure in each directory. Update this file if you add new major features or change architectural patterns.
