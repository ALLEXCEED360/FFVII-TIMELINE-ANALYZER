# Deploying

Three free services, set up once; after that, every push to `main` redeploys on its own.

| Part     | Host   | From                                                                             |
| -------- | ------ | -------------------------------------------------------------------------------- |
| Database | Neon   | Filled by the API on every start (ADR 0006)                                      |
| API      | Render | [`render.yaml`](../render.yaml), [`apps/api/Dockerfile`](../apps/api/Dockerfile) |
| Site     | Vercel | [`apps/web`](../apps/web), [`vercel.json`](../apps/web/vercel.json)              |

Order matters: the API needs the database's address, and the site needs the API's.

## 1. Database — Neon

1. Sign up at [neon.tech](https://neon.tech) and create a project: name `ffvii-timeline`, region **AWS US West 2 (Oregon)** (next to Render's default region).
2. **Connect** → turn **Connection pooling off** → copy the connection string. It looks like
   `postgresql://neondb_owner:…@ep-….us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require`.
   (`channel_binding` is dropped by the API's client; it can stay.)
3. Keep it private: it holds the password. It goes only into Render.

The tables don't need creating: the API applies the migrations and seeds from `data/` each time it starts.

## 2. API — Render

1. Sign up at [render.com](https://render.com) with GitHub and allow it to see this repository.
2. **New → Blueprint** → pick the repository. Render reads `render.yaml` and offers one service, `ffvii-timeline-api` (Docker, free).
3. When it asks for `DATABASE_URL`, paste Neon's connection string. Apply.
4. Wait for the first build (a few minutes). The log should end with `migrations applied`, `seeded 115 entities…` and `Server listening`.
5. Open `https://<service>.onrender.com/health` — it answers `{"status":"ok"}`. Note this address: it's the API's.

If Render asks for a card for a Blueprint, create it by hand instead: **New → Web Service** → the repository → Language **Docker**, Dockerfile path `./apps/api/Dockerfile`, context `.`, plan **Free**, health check `/health`, and the environment variables `DATABASE_URL` (Neon's), `CORS_ORIGIN` = `*`, `LOG_LEVEL` = `info`.

The free plan sleeps after 15 minutes without visits; the next visit wakes it in about a minute.

## 3. Site — Vercel

1. Sign up at [vercel.com](https://vercel.com) with GitHub. **Add New → Project** → import the repository.
2. **Root Directory:** `apps/web`. Vercel finds Vite and the pnpm workspace; leave the build settings as they are.
3. **Environment Variables:**
   - `VITE_API_URL` = the Render address, with no `/` at the end.
   - `ENABLE_EXPERIMENTAL_COREPACK` = `1`, so the build uses the pnpm version in `package.json`.
4. Deploy. Then, in **Settings → General → Node.js Version**, check it's **24.x**.
5. Open the `….vercel.app` address: the title screen, then the home menu; every section should load.

`VITE_API_URL` is read when the site is built, so after changing it, redeploy.

## After

- **Updates:** push to `main`; Render and Vercel each rebuild. A change to `data/` reaches the live database when the API restarts with it.
- **Locking the API to the site (optional):** in Render, set `CORS_ORIGIN` to the site's address (several may be separated by commas). The API only answers reads, so `*` is also safe.
- **If something fails:** Render's **Logs** for the API (a wrong `DATABASE_URL` stops it before `Server listening`); the browser console for the site (requests going to `localhost:3000` mean `VITE_API_URL` wasn't set when it was built).
