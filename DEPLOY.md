# Deploy your own Senior Tech Support instance

This guide is for students, mentors, and coding agents setting up the app for a local community. Each instance uses its own MongoDB database. The app runs on Next.js and Payload CMS; the steps below work on a Node.js host or virtual server that can keep a process and uploaded files running.

## Before you start

You need:

- A copy of this repository, Node.js 22, and pnpm 10.
- A MongoDB database that your app server can reach. Use a **new database** for your area; do not reuse the local demo database.
- A hosting service with a persistent filesystem for Payload uploads, or a storage adapter configured in the code. The current `media` collection stores uploaded files on disk.
- A domain and HTTPS before inviting other people to use the app.

The included `docker-compose.yml` runs a **development** server and a local MongoDB instance. The current `Dockerfile` expects a Next.js standalone build, which `next.config.ts` does not enable. Use the Node.js deployment below unless you update and verify that Docker setup.

## 1. Get the code

Fork or copy the repository into your own project, then work from the directory containing `package.json`:

```bash
corepack enable
corepack prepare pnpm@10 --activate
pnpm install --frozen-lockfile
```

Keep your fork so you can pull fixes later. Each community can use the same source code with a different database and domain.

## 2. Configure the server

Set these environment variables in your host's secret or environment settings:

```dotenv
NODE_ENV=production
DATABASE_URL=mongodb://username:password@your-mongo-host:27017/your-area-db?authSource=admin
PAYLOAD_SECRET=replace-with-a-unique-random-secret
```

Use your MongoDB provider's actual connection string; it may start with `mongodb+srv://`. Generate a unique secret, for example with `openssl rand -hex 32`, and keep it private. Do not commit a populated `.env` file. For a server you manage yourself, you can copy `.env.example` to `.env` and set the same values there.

Keep `PAYLOAD_SECRET` stable after launch so existing sessions remain valid. Give the database its own credentials, enable backups, and restrict database access to the app server.

## 3. Build and run

In the project directory, with the environment variables available:

```bash
pnpm build
pnpm start
```

The app listens on port 3000 by default. On a Node.js hosting platform, set the install command to `pnpm install --frozen-lockfile`, the build command to `pnpm build`, and the start command to `pnpm start`. Run one app instance unless you have set up shared upload storage. Put a reverse proxy or your host's HTTPS endpoint in front of the app, and configure the host to restart the process after a reboot or crash.

The build downloads the site's Google fonts, so the build environment needs outbound internet access.

Production skips the development seed in `src/payload.config.ts`. A **fresh** database starts empty. Existing demo records in an older database are not removed automatically.

## 4. Set up your area before opening the site

Keep the new site private through your host's access controls or a firewall during initial setup. Visit `/admin` and create the first user; the first account becomes the super admin. Use a strong, unique password. Then:

1. Create your local centers in the Payload admin panel.
2. Create a staff user for each participating center and assign that user to the correct center.
3. Sign in at `/staff` to check the staff view.
4. Open registration to students, who can request membership at a center. Staff approve requests before students can take work there.

The local demo accounts (`admin@example.com`, `alex@student.edu`, and others) should not exist in a new production database. If they do, stop and connect to a fresh database before opening the site.

## 5. Make it yours

- Change the displayed name in `src/app/(frontend)/components/Header.tsx`, `src/app/(frontend)/staff/components/SiteHeader.tsx`, `src/app/(frontend)/layout.tsx`, and `src/payload.config.ts` if you want local branding.
- Replace the gallery assets in `src/assets/gallery/` and update their descriptions in `src/app/(frontend)/components/HeroGallery.tsx` with photos you have permission to use.
- Review local wording in the frontend pages. The San Diego phone placeholder is in `src/app/(frontend)/staff/components/SeniorForm.tsx`.
- Keep demo data in `src/seed/` for development only. Add real centers through the admin panel on your production instance.

Rebuild and restart after changing code. Plan how your team will handle real senior contact information before entering it, and give staff access only to the centers they serve.

## 6. Check the launch

Before sharing the URL, confirm that:

- The home page, `/admin`, and `/staff/login` load over HTTPS.
- Your super admin can create a center and a center staff account.
- A student can register, request a center, and be approved by that center's staff.
- A staff member can create a ticket or event, and a student can see the work after approval.
- A media upload still loads after restarting the server. Back up both MongoDB and the persistent `media/` directory.
- No demo centers, users, or passwords are present in the production database.

For local development and demo accounts, see [README.md](README.md#run-locally).
