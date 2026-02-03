# Admin

Manage the book catalog. Changes are committed directly to the repository via GitHub API.

<div id="admin-app">
  <section id="auth-section" class="admin-section">
    <h2>Authentication</h2>
    <p>Enter your GitHub Personal Access Token with <code>contents:write</code> permission for this repository.</p>
    <div class="form-group">
      <label for="github-token">GitHub Token</label>
      <input type="password" id="github-token" placeholder="ghp_xxxxxxxxxxxx">
      <button id="save-token-btn" class="btn btn-secondary">Save Token</button>
    </div>
    <div class="form-group">
      <label for="repo-owner">Repository Owner</label>
      <input type="text" id="repo-owner" placeholder="username">
    </div>
    <div class="form-group">
      <label for="repo-name">Repository Name</label>
      <input type="text" id="repo-name" placeholder="mdbook_builder">
    </div>
    <button id="load-catalog-btn" class="btn btn-primary">Load Catalog</button>
    <div id="auth-status" class="status"></div>
  </section>

  <section id="catalog-section" class="admin-section hidden">
    <h2>Current Books</h2>
    <div id="books-list" class="books-list"></div>

    <h2>Add New Book</h2>
    <div class="form-group">
      <label for="book-name">Book Name</label>
      <input type="text" id="book-name" placeholder="My Awesome Book">
    </div>
    <div class="form-group">
      <label for="book-slug">Slug</label>
      <input type="text" id="book-slug" placeholder="my-awesome-book">
      <small>URL-friendly identifier (lowercase, hyphens only)</small>
    </div>
    <div class="form-group">
      <label for="book-repo">GitHub Repository URL</label>
      <input type="text" id="book-repo" placeholder="https://github.com/owner/repo">
    </div>
    <div class="form-group">
      <label for="book-type">Content Type</label>
      <select id="book-type">
        <option value="mdbook">mdBook (has book.toml)</option>
        <option value="markdown">Markdown (plain .md files)</option>
        <option value="html">HTML (static site)</option>
      </select>
      <small>Choose based on the repository content format</small>
    </div>
    <div class="form-group">
      <label for="book-branch">Branch</label>
      <input type="text" id="book-branch" placeholder="main" value="main">
    </div>
    <div class="form-group">
      <label for="book-path">Content Path</label>
      <input type="text" id="book-path" placeholder="." value=".">
      <small>Path to content root (for mdBook: path to book.toml)</small>
    </div>
    <button id="add-book-btn" class="btn btn-primary">Add Book</button>
    <div id="add-status" class="status"></div>
  </section>
</div>
