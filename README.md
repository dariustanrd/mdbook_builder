# mdBook Builder

A static site that aggregates and hosts mdBooks from multiple GitHub repositories. The wrapper site (landing page + admin) is itself an mdBook, ensuring visual consistency across all pages. Uses GitHub Actions to build and GitHub Pages to host.

## How It Works

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Admin Page    │────▶│  catalog.yml     │────▶│  GitHub Action  │
│   (mdBook)      │     │  (via GitHub API)│     │  (build books)  │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                                          │
                                                          ▼
                                                 ┌─────────────────┐
                                                 │  GitHub Pages   │
                                                 │  (mdBook site)  │
                                                 └─────────────────┘
```

1. **Admin**: mdBook page with embedded form, commits changes to `catalog.yml` via GitHub API
2. **Catalog**: A `catalog.yml` file lists the GitHub repos to build
3. **Build**: GitHub Action builds the wrapper mdBook + each catalog book
4. **Deploy**: Everything pushed to GitHub Pages
5. **Browse**: Landing page lists all books; each book under `/books/<slug>/`

## Pages

| Page | URL | Description |
|------|-----|-------------|
| Landing | `/` | mdBook home listing all built books |
| Admin | `/admin.html` | mdBook page with form to manage catalog |
| Books | `/books/<slug>/` | Individual mdBook sites |

## Why mdBook for Everything?

- **Visual consistency**: Same theme, fonts, dark mode across all pages
- **Built-in features**: Search, print view, mobile-friendly navigation
- **Single toolchain**: One tool, one output format
- **Markdown-first**: Easy to maintain and extend

## Folder Structure

```
mdbook_builder/
├── .github/
│   └── workflows/
│       └── build.yml           # GitHub Action workflow
├── src/
│   ├── SUMMARY.md              # mdBook navigation
│   ├── index.md                # Landing page (book catalog)
│   └── admin.md                # Admin page (embeds form)
├── theme/
│   └── head.hbs                # Custom head (optional)
├── js/
│   └── admin.js                # Admin form logic (GitHub API)
├── book.toml                   # Wrapper mdBook config
├── catalog.yml                 # List of books to build
└── README.md
```

After build, the `gh-pages` branch contains:

```
/
├── index.html                  # Landing page
├── admin.html                  # Admin page
├── SUMMARY.html
├── css/
├── js/
│   └── admin.js
└── books/
    ├── my-book/
    │   └── index.html          # Built mdBook
    └── another-book/
        └── index.html
```

## Admin Page

The admin page is an mdBook chapter (`src/admin.md`) with an embedded HTML form and JavaScript.

### Features
- View current catalog
- Add new books (name, repo URL, branch, path)
- Remove existing books
- Commits changes directly to `catalog.yml` via GitHub API

### How It Works
1. JavaScript fetches current `catalog.yml` from the repo via GitHub API
2. User adds/removes entries via form
3. On save, commits updated `catalog.yml` via GitHub Contents API
4. Push triggers the build Action automatically

### Authentication
Requires a GitHub Personal Access Token (PAT) with `contents:write` scope. Token is stored in browser `localStorage` (only sent to GitHub's API, never to any other server).

## Adding a Book (Manual)

You can also edit `catalog.yml` directly:

```yaml
books:
  - name: "My Book Title"
    slug: "my-book"
    repo: "https://github.com/owner/repo"
    branch: "main"           # optional, defaults to main
    path: "."                # optional, path to book.toml
```

Push the change. The Action rebuilds and deploys automatically.

## Triggering Builds

Builds run:
- On push to `main` (when catalog or wrapper content changes)
- On a schedule (daily, to pick up upstream book updates)
- Manually via workflow dispatch

## Requirements

- GitHub repo with Pages enabled
- Repos in catalog must be public (or use a PAT for private repos)
- Each repo needs a valid `book.toml`

## Setup

### 1. Create a GitHub Personal Access Token (for admin page)

1. Go to GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens
2. Create a new token with:
   - Repository access: Select this repo only
   - Permissions: Contents (Read and write)
3. Copy the token and use it in the admin page

### 2. Enable GitHub Pages

1. Go to repo Settings → Pages
2. Source: Deploy from a branch
3. Branch: `gh-pages` / `/ (root)`

### 3. Configure Repository Secrets (optional)

For private book repos, add a `BOOK_PAT` secret with read access to those repos.

## Local Development

```bash
# Install mdBook
cargo install mdbook

# Build and serve locally
mdbook serve --open

# Or just build
mdbook build
```

## Build Process

The GitHub Action performs these steps:

1. Install mdBook
2. Build the wrapper mdBook (`mdbook build`)
3. Read `catalog.yml`
4. For each book:
   - Clone the repo
   - Run `mdbook build`
   - Copy output to `book/books/<slug>/`
5. Generate book list data for landing page
6. Deploy to GitHub Pages

## License

MIT
