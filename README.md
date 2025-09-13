

### Database Setup (Docker)

1. Start PostgreSQL
   - `docker compose up -d`
   - Default DB: user `homi`, password `homi`, database `homi` (see `docker-compose.yml`).

2. Configure server environment
   - `cp server/.env.example server/.env`
   - The API runs on `PORT=5001`. DB host defaults to `127.0.0.1`.

3. Install server dependencies
   - `cd server && npm install`

4. Apply schema and seed from CSVs
   - `npm run db:setup` (applies `server/db/schema.sql`)
   - `npm run db:seed` (imports `public/inventory.csv` and `public/shopping-list.csv`)

5. Run the API and frontend
   - API: `npm run dev` (http://localhost:5001)
   - Frontend: in repo root `npm start` (http://localhost:3000)
   - The CRA proxy forwards `/api/*` to the API.

6. Verify
   - Health: http://localhost:5001/api/health (expect `{ ok: true, db: true }`)
   - Data: http://localhost:5001/api/inventory, http://localhost:5001/api/shopping-list

### Troubleshooting

- API port in use (5000/5001):
  - We use 5001 for the API to avoid conflicts. If you prefer another port, set `PORT` in `server/.env` and update the root `package.json` `proxy` to match, then restart `npm start`.

- DB port 5432 in use:
  - Edit `docker-compose.yml` to map another port, e.g. `ports: ["5433:5432"]`.
  - Set `PGPORT=5433` in `server/.env`.
  - `docker compose up -d`, then re-run `npm run db:setup` and `npm run db:seed`.

- IPv6 localhost connection refused:
  - Ensure `PGHOST=127.0.0.1` in `server/.env` (not `localhost`) to avoid IPv6 `::1` resolution.

### API Endpoints

- `GET /api/inventory` — list inventory items
- `POST /api/inventory` — create `{ item_name, owner, category, tag?, description? }`
- `DELETE /api/inventory/:id` — delete by id
- `GET /api/shopping-list` — list shopping items
- `POST /api/shopping-list` — create `{ item_name, owner, category, priority?, notes? }`
- `DELETE /api/shopping-list/:id` — delete by id

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
