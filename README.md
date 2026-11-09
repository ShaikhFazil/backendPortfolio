# Portfolio Backend

REST API behind the portfolio site and its admin dashboard. Node.js, Express, MongoDB
(Mongoose), JWT auth in httpOnly cookies, Multer uploads and Cloudinary storage.

---

## Quick start

```bash
cp .env.example .env     # then fill it in (see below)
npm install
npm run seed:admin       # creates your admin account
npm run seed:content     # loads the portfolio content from your resume
npm run dev              # http://localhost:5000
```

Check it is alive:

```bash
curl http://localhost:5000/health
```

---

## Environment

| Variable | Required | Notes |
|---|---|---|
| `PORT` | no | Defaults to `5000`. |
| `NODE_ENV` | no | `development` or `production`. |
| `MONGODB_URI` | **yes** | Local `mongodb://127.0.0.1:27017/portfolio` or an Atlas URI. |
| `JWT_SECRET` | **yes** | Long random string. Generate with the command below. |
| `JWT_EXPIRES_IN` | no | Defaults to `7d`. |
| `COOKIE_NAME` | no | Defaults to `portfolio_token`. |
| `COOKIE_CROSS_SITE` | no | Set `true` only when the frontend and API are on **different** domains over HTTPS. |
| `FRONTEND_URL` | no | Allowed CORS origins, comma separated. Defaults to `http://localhost:3000`. |
| `CLOUDINARY_CLOUD_NAME` / `_API_KEY` / `_API_SECRET` | for uploads | Without these the upload endpoints return `503` and everything else still works. |
| `CLOUDINARY_FOLDER` | no | Defaults to `portfolio`. |
| `MAX_IMAGE_SIZE_MB` | no | Defaults to `5`. |
| `MAX_PDF_SIZE_MB` | no | Defaults to `10`. |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME` | no | Read by `npm run seed:admin` only. |

Generate a secret:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Never commit a filled-in `.env`.

---

## Creating the administrator

There is **no public registration endpoint**. The first account is created on the server:

```bash
# interactive (password is masked, nothing lands in your shell history)
npm run seed:admin

# or non-interactive
ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='a-long-password' npm run seed:admin

# or with flags
node scripts/seedAdmin.js --email you@example.com --password 'a-long-password'
```

Re-running with an existing email resets that account's password. Passwords are hashed
with bcrypt (cost 12) and the hash is never returned by the API.

---

## Seeding content

`npm run seed:content` loads `scripts/seed-data.json` (profile, skills, experience,
projects, education, certifications). It only fills collections that are empty, so it is
safe to re-run. To wipe and reload the content collections:

```bash
npm run seed:content -- --force
```

Admin accounts, resumes and contact messages are never touched by this script.

---

## Project layout

```
src/
  config/      env validation, Mongo connection, Cloudinary client
  models/      AdminUser, Profile, Skill, Experience, Project,
               Education, Certification, Resume, ContactMessage
  middleware/  auth, validation, uploads, rate limits, error handler
  controllers/ one per resource, plus a shared CRUD factory
  routes/      every endpoint, mounted under /api
  services/    Cloudinary upload and cleanup
  validators/  zod schemas for every write
  utils/       ApiError, asyncHandler, response helpers
  app.js       express app (security, CORS, parsers, routes)
  server.js    connects to Mongo, listens, handles shutdown
scripts/       seedAdmin.js, seedContent.js, seed-data.json, smoke.test.js
```

---

## API

Every response is `{ success, data }` or `{ success: false, error: { message, details? } }`.
List endpoints also return `meta` with pagination.

### Auth
| Method | Path | Access |
|---|---|---|
| POST | `/api/auth/login` | public, rate limited to 8 attempts / 15 min |
| POST | `/api/auth/logout` | public |
| GET | `/api/auth/me` | authenticated |
| POST | `/api/auth/change-password` | admin |

### Content
| Method | Path | Access |
|---|---|---|
| GET | `/api/portfolio` | public, everything the homepage needs in one request |
| GET | `/api/stats` | admin, dashboard metrics computed from the database |
| GET | `/api/profile` | public |
| PUT | `/api/profile` | admin |
| POST | `/api/profile/avatar` | admin, multipart `file` |
| POST | `/api/profile/og-image` | admin, multipart `file` |

### Resources
`skills`, `experience`, `projects`, `education`, `certifications` all expose the same shape:

| Method | Path | Access |
|---|---|---|
| GET | `/api/<resource>` | public, published records only |
| GET | `/api/<resource>/all` | admin, includes unpublished |
| GET | `/api/<resource>/:id` | public, by id or slug |
| POST | `/api/<resource>` | admin |
| PUT | `/api/<resource>/:id` | admin |
| PATCH | `/api/<resource>/reorder` | admin, body `{ items: [{ id, order }] }` |
| DELETE | `/api/<resource>/:id` | admin |

Query parameters on the list endpoints: `page`, `limit`, `search`, `category`,
`featured`, `kind`, `published`.

### Resume
| Method | Path | Access |
|---|---|---|
| GET | `/api/resume/active` | public |
| GET | `/api/resume` | admin, all versions |
| POST | `/api/resume` | admin, multipart `file`, PDF only; the upload becomes active |
| PUT | `/api/resume/:id/activate` | admin |
| PUT | `/api/resume/:id/deactivate` | admin |
| DELETE | `/api/resume/:id` | admin |

### Uploads
| Method | Path | Access |
|---|---|---|
| POST | `/api/uploads/image` | admin, multipart `file` + optional `folder` |
| POST | `/api/uploads/images` | admin, multipart `files` (up to 8) |
| DELETE | `/api/uploads` | admin, body `{ publicId, resourceType }` |

### Contact
| Method | Path | Access |
|---|---|---|
| POST | `/api/contact` | public, rate limited to 10 / hour, honeypot field |
| GET | `/api/contact` | admin |
| PUT | `/api/contact/:id` | admin, `{ read, archived }` |
| DELETE | `/api/contact/:id` | admin |

---

## Security

- JWT in an httpOnly, SameSite cookie. No token is ever exposed to JavaScript.
- bcrypt password hashing, cost 12. `passwordHash` is `select: false` and stripped from JSON.
- Login rate limiting, plus a global API limiter and a stricter one on the contact form.
- Helmet security headers, `x-powered-by` disabled, compression.
- CORS restricted to `FRONTEND_URL`, with credentials enabled.
- `express-mongo-sanitize` against operator injection.
- Every write body is validated with zod before it reaches Mongoose.
- 1MB JSON body limit; 5MB images and 10MB PDFs enforced by Multer **and** by MIME type.
- Error responses never include stack traces, and 5xx messages are generic in production.
- No public registration endpoint.

Hiding the dashboard UI is not security on its own: every admin route here is guarded
server side, so a direct API call without a valid cookie is rejected.

---

## Cloudinary

Images upload as `image` resources under `<CLOUDINARY_FOLDER>/<folder>`. Resumes upload
as `raw` so the delivery URL serves the original PDF with its filename intact.

When a record is deleted, the API checks whether any other record still references the
same `publicId` before asking Cloudinary to remove the asset, so shared images are never
pulled out from under a live record. A failed cleanup is logged and never fails the
request that triggered it.

If Cloudinary credentials are missing the server still starts; upload endpoints return
`503` with a message naming the variables to set.

---

## Tests

```bash
npm test
```

Runs an offline smoke test (17 cases) over routing, auth guards, validation, the honeypot
and the security headers. It needs no database because every case is rejected before any
query runs. Full CRUD against a live MongoDB is not covered by an automated test; see
the checklist in the frontend README.

---

## Deployment

Works on any Node host (Render, Railway, Fly.io, a VPS). Steps:

1. Set every environment variable from the table above. `NODE_ENV=production`.
2. Point `MONGODB_URI` at MongoDB Atlas and allow your host's IP range.
3. Set `FRONTEND_URL` to your deployed frontend origin.
4. If the API and frontend are on different domains, set `COOKIE_CROSS_SITE=true`. Both
   sides must then be served over HTTPS, otherwise the browser drops the auth cookie.
5. `npm ci && npm start`.
6. Run `npm run seed:admin` once against the production database.

The app trusts one proxy hop (`trust proxy = 1`), which is what the rate limiters need to
see real client IPs behind a load balancer.
