# Linktree Multi-Tenant App

This repository contains one React application that can build several separate Linktree-style websites. The application code is shared. Each website gets its own configuration and image files.

The three included tenants are:

| Tenant ID | Configuration | Intended Netlify site |
| --- | --- | --- |
| `arhatest` | `config/arhatest/` | `arhatest.netlify.app` |
| `arhatanzan` | `config/arhatanzan/` | `arhatanzan.netlify.app` |
| `kaif` | `config/kaif/` | `kaif.netlify.app` |

The tenant ID must match the Netlify site name. The build stops with an error when Netlify reports a different `*.netlify.app` site name.

## 1. Install The Tools

You need:

- Git
- Node.js and npm
- Netlify CLI only if you want to run Netlify functions locally or manage Netlify from a terminal

Check whether Node.js and npm are installed:

```bash
node --version
npm --version
```

If you use NVM and the commands are not found, load it first:

```bash
export NVM_DIR="$HOME/.nvm"
. "$NVM_DIR/nvm.sh"
```

To install Node.js LTS with NVM:

```bash
nvm install --lts
nvm alias default 'lts/*'
```

Install the Netlify CLI when needed:

```bash
npm install --global netlify-cli
netlify --version
```

## 2. Install This Project

Clone the repository and enter its directory:

```bash
git clone https://github.com/arhatanzan/linktree.git
cd linktree
```

Install the exact dependency versions recorded in `package-lock.json`:

```bash
npm install
```

## 3. Configure Local Environment Variables

Copy the example file:

```bash
cp .env.example .env.local
```

`.env.local` is ignored by Git. Never commit passwords or tokens.

For the default local tenant, the file should contain values similar to:

```env
VITE_TENANT_ID=arhatest
ADMIN_PASSWORD=your-local-admin-password
REPO_NAME=linktree
REPO_OWNER=arhatanzan
SESSION_TIMEOUT=30
```

`GITHUB_TOKEN` is not needed for ordinary frontend development. It is needed by the production admin save function when the admin panel must commit changes to GitHub.

## 4. Run The App Locally

### Frontend only

Start Vite:

```bash
npm run dev
```

Open `http://localhost:5173/` in your browser. The public profile is available at `/` and the admin page is at `/admin`.

This mode serves the React application only. The admin page's login and save requests need Netlify functions, so a plain Vite server will return `404` for those function URLs.

### Frontend plus Netlify functions

For a complete local test, authenticate the Netlify CLI once:

```bash
netlify login
```

Then start Netlify's local proxy:

```bash
netlify dev --port 8888
```

Open `http://localhost:8888/`. Use `http://localhost:8888/admin` to test admin login and function-backed behavior.

## 5. Useful Commands

```bash
npm run dev      # Start the Vite development server
npm run build    # Stage tenant images and create a production build
npm run lint     # Check JavaScript and JSX
npm run preview  # Preview the latest dist/ build
```

The `build` command automatically runs the prebuild script. It copies images from the selected tenant directory into the generated `public/images/` directory. The generated images and `dist/` output are ignored by Git.

Build a specific tenant locally:

```bash
VITE_TENANT_ID=kaif npm run build
VITE_TENANT_ID=arhatanzan npm run build
VITE_TENANT_ID=arhatest npm run build
```

## 6. How Tenant Loading Works

The shared React application reads `VITE_TENANT_ID` during the Vite build. The loader in `src/tenantData.js` imports the matching JSON file from `config/<tenant>/data.json`.

The prebuild script also copies that tenant's image files into `public/images/`. This is necessary because files in `config/` are application configuration, while Vite serves files in `public/` as static browser assets.

To add a future tenant:

1. Create `config/<new-tenant>/data.json`.
2. Add that tenant's image files to the same directory.
3. Create a Netlify site named `<new-tenant>`.
4. Set `VITE_TENANT_ID=<new-tenant>` in that site's production environment.
5. Push the changes and trigger a deploy.

Do not duplicate the React source code for a new tenant.

## 7. Netlify Setup

The repository is connected to the `arhatest` Netlify site. For another tenant, create a separate Netlify site connected to the same GitHub repository.

Use these build settings:

- Base directory: leave blank
- Build command: `npm run build`
- Publish directory: `dist`
- Functions directory: `netlify/functions`

Set these environment variables in each site's **Production** environment:

| Variable | Example | Purpose |
| --- | --- | --- |
| `VITE_TENANT_ID` | `arhatest` | Selects the tenant configuration and assets |
| `ADMIN_PASSWORD` | your private password | Protects the admin panel |
| `REPO_NAME` | `linktree` | GitHub repository name for admin saves |
| `REPO_OWNER` | `arhatanzan` | GitHub repository owner for admin saves |
| `SESSION_TIMEOUT` | `30` | Admin session lifetime in minutes |
| `GITHUB_TOKEN` | your private token | Allows the admin function to update tenant JSON on GitHub |

Use the redacted checklist in `.netlify.env.example`. Enter real passwords and tokens only in Netlify's encrypted environment-variable settings.

The GitHub token needs permission to read and update repository contents in `arhatanzan/linktree`. Do not put it in `VITE_` variables because Vite exposes `VITE_` values to browser code.

After changing a production environment variable, start a new deploy. Netlify injects the variables only when the build starts.

## 8. Admin Panel

Open `/admin` and enter `ADMIN_PASSWORD`.

The admin panel can edit tenant data and save it through the Netlify function. In production, the function commits the selected tenant's JSON file to GitHub using `GITHUB_TOKEN`. A successful commit triggers a new Netlify build.

If the admin login works but saving reports missing GitHub variables, check `GITHUB_TOKEN`, `REPO_OWNER`, and `REPO_NAME` in the Netlify site settings.

## 9. Project Structure

```text
config/
  arhatanzan/       Tenant JSON and images
  arhatest/         Tenant JSON and images
  kaif/             Tenant JSON and images
netlify/
  functions/        Login and GitHub-save serverless functions
scripts/
  copy-tenant-assets.js
src/
  admin/             Admin panel and editors
  user/              Public profile components and styles
  tenantData.js      Environment-based tenant loader
package.json         Scripts and dependencies
netlify.toml         Netlify build and redirect settings
```

## 10. Troubleshooting

### `npm` or `netlify` is not found

Load NVM in the current terminal, then retry:

```bash
export NVM_DIR="$HOME/.nvm"
. "$NVM_DIR/nvm.sh"
```

### Build says `Unknown tenant`

The value of `VITE_TENANT_ID` does not have a matching directory under `config/`. Check the spelling and use one of the existing tenant IDs.

### Build says `Tenant mismatch`

The Netlify site name and `VITE_TENANT_ID` do not match. Rename the Netlify site or change the environment variable so both use the same identifier.

### Admin login returns `404` locally

Use `netlify dev --port 8888` instead of `npm run dev`. The plain Vite server does not run Netlify functions.

### Admin save reports missing variables

Set `GITHUB_TOKEN`, `REPO_OWNER`, and `REPO_NAME` in the Netlify site's Production environment, then redeploy.

### A tenant image is missing

Confirm the image is inside the matching `config/<tenant>/` directory. Run `npm run build` again so the prebuild script copies it into `public/images/`.
