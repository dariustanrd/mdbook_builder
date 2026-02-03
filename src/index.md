# mdBook Library

Welcome to the mdBook Library — a curated collection of books built from GitHub repositories.

<div id="book-list" class="book-grid">
  <p class="loading">Loading books...</p>
</div>

<script>
(function() {
  const CATALOG_URL = 'catalog.json';
  const bookList = document.getElementById('book-list');

  async function loadBooks() {
    try {
      const response = await fetch(CATALOG_URL);
      if (!response.ok) {
        throw new Error('Failed to load catalog');
      }
      const catalog = await response.json();
      renderBooks(catalog.books || []);
    } catch (error) {
      bookList.innerHTML = `
        <p class="error">Unable to load book catalog.</p>
        <p class="hint">If this is a fresh install, add books via the <a href="admin.html">Admin page</a>.</p>
      `;
    }
  }

  function renderBooks(books) {
    if (books.length === 0) {
      bookList.innerHTML = `
        <p class="empty">No books yet.</p>
        <p class="hint">Add your first book via the <a href="admin.html">Admin page</a>.</p>
      `;
      return;
    }

    bookList.innerHTML = books.map(book => `
      <a href="books/${book.slug}/index.html" class="book-card">
        <div class="book-title">${escapeHtml(book.name)}</div>
        <div class="book-repo">${escapeHtml(book.repo.replace('https://github.com/', ''))}</div>
      </a>
    `).join('');
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  loadBooks();
})();
</script>
