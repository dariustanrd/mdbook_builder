/**
 * Admin page functionality for mdBook Builder
 * Manages catalog.yml via GitHub Contents API
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'mdbook_builder_config';
  const CATALOG_PATH = 'catalog.yml';

  // State
  let currentCatalog = null;
  let catalogSha = null;

  // DOM Elements (initialized on page load)
  let elements = {};

  function init() {
    // Only run on admin page
    if (!document.getElementById('admin-app')) return;

    elements = {
      token: document.getElementById('github-token'),
      repoOwner: document.getElementById('repo-owner'),
      repoName: document.getElementById('repo-name'),
      saveTokenBtn: document.getElementById('save-token-btn'),
      loadCatalogBtn: document.getElementById('load-catalog-btn'),
      authStatus: document.getElementById('auth-status'),
      authSection: document.getElementById('auth-section'),
      catalogSection: document.getElementById('catalog-section'),
      booksList: document.getElementById('books-list'),
      bookName: document.getElementById('book-name'),
      bookSlug: document.getElementById('book-slug'),
      bookRepo: document.getElementById('book-repo'),
      bookType: document.getElementById('book-type'),
      bookBranch: document.getElementById('book-branch'),
      bookPath: document.getElementById('book-path'),
      addBookBtn: document.getElementById('add-book-btn'),
      addStatus: document.getElementById('add-status'),
    };

    loadSavedConfig();
    bindEvents();
  }

  function loadSavedConfig() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const config = JSON.parse(saved);
        if (config.token) elements.token.value = config.token;
        if (config.owner) elements.repoOwner.value = config.owner;
        if (config.repo) elements.repoName.value = config.repo;
      }
    } catch (e) {
      console.warn('Failed to load saved config:', e);
    }
  }

  function saveConfig() {
    const config = {
      token: elements.token.value,
      owner: elements.repoOwner.value,
      repo: elements.repoName.value,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  }

  function bindEvents() {
    elements.saveTokenBtn.addEventListener('click', () => {
      saveConfig();
      showStatus(elements.authStatus, 'Configuration saved', 'success');
    });

    elements.loadCatalogBtn.addEventListener('click', loadCatalog);
    elements.addBookBtn.addEventListener('click', addBook);

    // Auto-generate slug from name
    elements.bookName.addEventListener('input', () => {
      const name = elements.bookName.value;
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      elements.bookSlug.value = slug;
    });
  }

  async function loadCatalog() {
    const { token, owner, repo } = getConfig();

    if (!token || !owner || !repo) {
      showStatus(elements.authStatus, 'Please fill in all fields', 'error');
      return;
    }

    saveConfig();
    showStatus(elements.authStatus, 'Loading catalog...', 'info');

    try {
      const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${CATALOG_PATH}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github.v3+json',
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          // Catalog doesn't exist yet, create empty one
          currentCatalog = { books: [] };
          catalogSha = null;
          showStatus(elements.authStatus, 'No catalog found. Creating new one.', 'info');
        } else {
          throw new Error(`GitHub API error: ${response.status}`);
        }
      } else {
        const data = await response.json();
        catalogSha = data.sha;
        const content = atob(data.content);
        currentCatalog = parseYaml(content);
        showStatus(elements.authStatus, 'Catalog loaded successfully', 'success');
      }

      elements.catalogSection.classList.remove('hidden');
      renderBooksList();
    } catch (error) {
      showStatus(elements.authStatus, `Error: ${error.message}`, 'error');
    }
  }

  function renderBooksList() {
    const books = currentCatalog.books || [];

    if (books.length === 0) {
      elements.booksList.innerHTML = '<p class="empty">No books in catalog yet.</p>';
      return;
    }

    elements.booksList.innerHTML = books
      .map(
        (book, index) => `
      <div class="book-item">
        <div class="book-info">
          <strong>${escapeHtml(book.name)}</strong>
          <span class="book-slug">/${book.slug}/</span>
          <span class="book-type">[${book.type || 'mdbook'}]</span>
          <div class="book-meta">${escapeHtml(book.repo)}</div>
        </div>
        <button class="btn btn-danger btn-small" data-index="${index}">Remove</button>
      </div>
    `
      )
      .join('');

    // Bind remove buttons
    elements.booksList.querySelectorAll('.btn-danger').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.target.dataset.index, 10);
        removeBook(index);
      });
    });
  }

  async function addBook() {
    const name = elements.bookName.value.trim();
    const slug = elements.bookSlug.value.trim();
    const repo = elements.bookRepo.value.trim();
    const type = elements.bookType.value || 'mdbook';
    const branch = elements.bookBranch.value.trim() || 'main';
    const path = elements.bookPath.value.trim() || '.';

    if (!name || !slug || !repo) {
      showStatus(elements.addStatus, 'Please fill in name, slug, and repo URL', 'error');
      return;
    }

    // Validate slug
    if (!/^[a-z0-9-]+$/.test(slug)) {
      showStatus(elements.addStatus, 'Slug must be lowercase letters, numbers, and hyphens only', 'error');
      return;
    }

    // Check for duplicate slug
    if (currentCatalog.books.some((b) => b.slug === slug)) {
      showStatus(elements.addStatus, 'A book with this slug already exists', 'error');
      return;
    }

    const newBook = { name, slug, repo, type, branch, path };
    currentCatalog.books.push(newBook);

    showStatus(elements.addStatus, 'Saving catalog...', 'info');

    try {
      await saveCatalog(`Add book: ${name}`);
      showStatus(elements.addStatus, 'Book added successfully!', 'success');
      clearAddForm();
      renderBooksList();
    } catch (error) {
      // Rollback
      currentCatalog.books.pop();
      showStatus(elements.addStatus, `Error: ${error.message}`, 'error');
    }
  }

  async function removeBook(index) {
    const book = currentCatalog.books[index];
    if (!confirm(`Remove "${book.name}" from the catalog?`)) return;

    const removed = currentCatalog.books.splice(index, 1)[0];
    showStatus(elements.addStatus, 'Saving catalog...', 'info');

    try {
      await saveCatalog(`Remove book: ${removed.name}`);
      showStatus(elements.addStatus, 'Book removed successfully!', 'success');
      renderBooksList();
    } catch (error) {
      // Rollback
      currentCatalog.books.splice(index, 0, removed);
      showStatus(elements.addStatus, `Error: ${error.message}`, 'error');
    }
  }

  async function saveCatalog(commitMessage) {
    const { token, owner, repo } = getConfig();
    const content = serializeYaml(currentCatalog);
    const encodedContent = btoa(content);

    const body = {
      message: commitMessage,
      content: encodedContent,
    };

    if (catalogSha) {
      body.sha = catalogSha;
    }

    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${CATALOG_PATH}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `GitHub API error: ${response.status}`);
    }

    const data = await response.json();
    catalogSha = data.content.sha;
  }

  function clearAddForm() {
    elements.bookName.value = '';
    elements.bookSlug.value = '';
    elements.bookRepo.value = '';
    elements.bookType.value = 'mdbook';
    elements.bookBranch.value = 'main';
    elements.bookPath.value = '.';
  }

  function getConfig() {
    return {
      token: elements.token.value,
      owner: elements.repoOwner.value,
      repo: elements.repoName.value,
    };
  }

  function showStatus(element, message, type) {
    element.textContent = message;
    element.className = `status status-${type}`;
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Simple YAML parser (handles our specific format)
  function parseYaml(content) {
    const result = { books: [] };
    const lines = content.split('\n');
    let currentBook = null;

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('#') || trimmed === '') continue;

      if (trimmed.startsWith('- name:')) {
        if (currentBook) result.books.push(currentBook);
        currentBook = { name: extractValue(trimmed.substring(7)) };
      } else if (currentBook) {
        if (trimmed.startsWith('slug:')) {
          currentBook.slug = extractValue(trimmed.substring(5));
        } else if (trimmed.startsWith('repo:')) {
          currentBook.repo = extractValue(trimmed.substring(5));
        } else if (trimmed.startsWith('type:')) {
          currentBook.type = extractValue(trimmed.substring(5));
        } else if (trimmed.startsWith('branch:')) {
          currentBook.branch = extractValue(trimmed.substring(7));
        } else if (trimmed.startsWith('path:')) {
          currentBook.path = extractValue(trimmed.substring(5));
        }
      }
    }

    if (currentBook) result.books.push(currentBook);
    return result;
  }

  function extractValue(str) {
    let value = str.trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    return value;
  }

  // Simple YAML serializer
  function serializeYaml(catalog) {
    let output = '# mdBook Catalog\n# Managed by mdBook Builder Admin\n\nbooks:\n';

    for (const book of catalog.books) {
      output += `  - name: "${book.name}"\n`;
      output += `    slug: "${book.slug}"\n`;
      output += `    repo: "${book.repo}"\n`;
      output += `    type: "${book.type || 'mdbook'}"\n`;
      output += `    branch: "${book.branch || 'main'}"\n`;
      output += `    path: "${book.path || '.'}"\n`;
    }

    return output;
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
