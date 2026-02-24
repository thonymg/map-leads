/**
 * Serveur HTTP local pour les tests
 * Sert des pages HTML statiques pour les tests d'intégration
 */

import { createServer, type Server } from "http";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { readFileSync, existsSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PAGES_DIR = join(__dirname, "pages");

export interface TestServerOptions {
  port?: number;
  hostname?: string;
}

export interface TestServer {
  server: Server;
  port: number;
  url: string;
  start: () => Promise<void>;
  stop: () => Promise<void>;
  getPageUrl: (page: string) => string;
}

// MIME types pour les fichiers statiques
const MIME_TYPES: Record<string, string> = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

/**
 * Crée un serveur HTTP local pour servir les pages de test
 */
export function createTestServer(options: TestServerOptions = {}): TestServer {
  const port = options.port || 3000;
  const hostname = options.hostname || "localhost";

  let server: Server;

  const serverInstance: TestServer = {
    server: null as unknown as Server,
    port,
    url: `http://${hostname}:${port}`,
    start: async () => {
      return new Promise<void>((resolve) => {
        server = createServer((req, res) => {
          const urlPath = req.url === "/" ? "/simple.html" : req.url;
          const cleanPath = urlPath.replace(/^\//, "").split("?")[0];
          const filePath = join(PAGES_DIR, cleanPath);

          // Vérifier que le fichier existe et est dans le dossier pages
          if (!filePath.startsWith(PAGES_DIR) || !existsSync(filePath)) {
            res.writeHead(404, { "Content-Type": "text/plain" });
            res.end("404 - Page not found");
            return;
          }

          // Lire et servir le fichier
          try {
            const content = readFileSync(filePath, "utf-8");
            const ext = "." + cleanPath.split(".").pop() || ".html";
            const contentType = MIME_TYPES[ext] || "text/plain";
            
            res.writeHead(200, { "Content-Type": contentType });
            res.end(content);
          } catch (error) {
            res.writeHead(500, { "Content-Type": "text/plain" });
            res.end("500 - Internal server error");
          }
        });

        server.listen(port, hostname, () => {
          resolve();
        });
      });
    },
    stop: async () => {
      return new Promise<void>((resolve, reject) => {
        if (server) {
          server.close((err) => {
            if (err) reject(err);
            else resolve();
          });
        } else {
          resolve();
        }
      });
    },
    getPageUrl: (page: string) => {
      return `${serverInstance.url}/${page}`;
    },
  };

  serverInstance.server = serverInstance.server || server;

  return serverInstance;
}

/**
 * Pages HTML de test générées dynamiquement
 */
export const TestPages = {
  /**
   * Page simple avec titre et liens
   */
  simple: `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Page de Test Simple</title>
</head>
<body>
  <header>
    <h1 id="main-title">Bienvenue sur la page de test</h1>
    <p class="subtitle">Cette page sert aux tests de navigation et d'extraction</p>
  </header>
  
  <nav>
    <ul>
      <li><a href="/simple.html" id="link-home">Accueil</a></li>
      <li><a href="/form.html" id="link-form">Formulaire</a></li>
      <li><a href="/list.html" id="link-list">Liste</a></li>
      <li><a href="/pagination.html" id="link-pagination">Pagination</a></li>
    </ul>
  </nav>
  
  <main>
    <section id="content">
      <h2>Section de contenu</h2>
      <p class="description">Ceci est un paragraphe de description.</p>
      <div class="info-box" data-info="test-value">
        <span class="label">Information:</span>
        <span class="value">Valeur de test</span>
      </div>
    </section>
    
    <section id="dynamic-content">
      <button id="load-more" onclick="loadMore()">Charger plus</button>
      <div id="dynamic-items"></div>
    </section>
  </main>
  
  <footer>
    <p>&copy; 2026 - Page de test pour scraper</p>
  </footer>
  
  <script>
    function loadMore() {
      const container = document.getElementById('dynamic-items');
      for (let i = 0; i < 3; i++) {
        const item = document.createElement('div');
        item.className = 'dynamic-item';
        item.textContent = 'Élément dynamique ' + (container.children.length + 1);
        container.appendChild(item);
      }
    }
  </script>
</body>
</html>`,

  /**
   * Page avec formulaire
   */
  form: `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Formulaire de Test</title>
</head>
<body>
  <h1 id="page-title">Formulaire de Test</h1>
  
  <form id="test-form" action="/submit" method="POST">
    <div class="form-group">
      <label for="username">Nom d'utilisateur:</label>
      <input type="text" id="username" name="username" placeholder="Entrez votre nom" required>
    </div>
    
    <div class="form-group">
      <label for="email">Email:</label>
      <input type="email" id="email" name="email" placeholder="exemple@email.com">
    </div>
    
    <div class="form-group">
      <label for="password">Mot de passe:</label>
      <input type="password" id="password" name="password">
    </div>
    
    <div class="form-group">
      <label for="category">Catégorie:</label>
      <select id="category" name="category">
        <option value="">Sélectionnez...</option>
        <option value="cat1">Catégorie 1</option>
        <option value="cat2">Catégorie 2</option>
        <option value="cat3">Catégorie 3</option>
      </select>
    </div>
    
    <div class="form-group">
      <label for="message">Message:</label>
      <textarea id="message" name="message" rows="4"></textarea>
    </div>
    
    <div class="form-group">
      <label>
        <input type="checkbox" id="accept-terms" name="accept-terms">
        J'accepte les conditions
      </label>
    </div>
    
    <div class="form-actions">
      <button type="submit" id="submit-btn">Envoyer</button>
      <button type="reset" id="reset-btn">Réinitialiser</button>
      <button type="button" id="cancel-btn">Annuler</button>
    </div>
  </form>
  
  <div id="form-result"></div>
  
  <script>
    document.getElementById('test-form').addEventListener('submit', function(e) {
      e.preventDefault();
      const result = document.getElementById('form-result');
      result.innerHTML = '<p class="success">Formulaire soumis avec succès!</p>';
    });
  </script>
</body>
</html>`,

  /**
   * Page avec liste d'éléments pour extraction
   */
  list: `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Liste d'Éléments</title>
</head>
<body>
  <h1 id="page-title">Liste de Produits</h1>
  
  <div id="products-list" class="items-container">
    <article class="item" data-id="1">
      <h2 class="item-title">Produit Alpha</h2>
      <p class="item-description">Description du produit Alpha</p>
      <span class="item-price" data-currency="EUR">29.99</span>
      <span class="item-category">Électronique</span>
      <a href="/product/1" class="item-link">Voir détails</a>
      <img src="/images/product1.jpg" alt="Produit Alpha" class="item-image">
      <span class="item-stock" data-available="true">En stock</span>
    </article>
    
    <article class="item" data-id="2">
      <h2 class="item-title">Produit Bêta</h2>
      <p class="item-description">Description du produit Bêta</p>
      <span class="item-price" data-currency="EUR">49.99</span>
      <span class="item-category">Maison</span>
      <a href="/product/2" class="item-link">Voir détails</a>
      <img src="/images/product2.jpg" alt="Produit Bêta" class="item-image">
      <span class="item-stock" data-available="true">En stock</span>
    </article>
    
    <article class="item" data-id="3">
      <h2 class="item-title">Produit Gamma</h2>
      <p class="item-description">Description du produit Gamma</p>
      <span class="item-price" data-currency="EUR">19.99</span>
      <span class="item-category">Livres</span>
      <a href="/product/3" class="item-link">Voir détails</a>
      <img src="/images/product3.jpg" alt="Produit Gamma" class="item-image">
      <span class="item-stock" data-available="false">Rupture</span>
    </article>
    
    <article class="item" data-id="4">
      <h2 class="item-title">Produit Delta</h2>
      <p class="item-description"></p>
      <span class="item-price" data-currency="EUR">99.99</span>
      <span class="item-category">Électronique</span>
      <a href="/product/4" class="item-link">Voir détails</a>
      <img src="/images/product4.jpg" alt="Produit Delta" class="item-image">
    </article>
    
    <article class="item" data-id="5">
      <h2 class="item-title"></h2>
      <p class="item-description">Produit sans titre</p>
      <span class="item-price" data-currency="EUR">9.99</span>
      <span class="item-category">Accessoires</span>
      <a href="/product/5" class="item-link">Voir détails</a>
    </article>
  </div>
  
  <div id="empty-list" class="items-container" style="display:none;">
    <p class="empty-message">Aucun élément trouvé</p>
  </div>
  
  <footer>
    <p>Total: <span id="total-items">5</span> produits</p>
  </footer>
</body>
</html>`,

  /**
   * Page avec pagination
   */
  pagination: `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Liste Paginée</title>
  <style>
    .pagination { margin: 20px 0; }
    .pagination button { margin: 0 5px; padding: 5px 10px; }
    .pagination .disabled { opacity: 0.5; pointer-events: none; }
    .item { border: 1px solid #ccc; padding: 10px; margin: 5px 0; }
  </style>
</head>
<body>
  <h1 id="page-title">Liste Paginée</h1>
  
  <div id="current-page-indicator">Page: <span id="page-number">1</span> sur <span id="total-pages">5</span></div>
  
  <div id="items-container">
    <!-- Les items seront injectés par JavaScript -->
  </div>
  
  <nav class="pagination">
    <button id="prev-btn" onclick="goToPage(currentPage - 1)">Précédent</button>
    <button id="next-btn" onclick="goToPage(currentPage + 1)">Suivant</button>
    <span id="page-info"></span>
  </nav>
  
  <script>
    const itemsPerPage = 3;
    const totalPages = 5;
    let currentPage = 1;
    
    // Données simulées pour chaque page
    const allItems = [
      { id: 1, name: 'Item 1', value: 'Valeur 1' },
      { id: 2, name: 'Item 2', value: 'Valeur 2' },
      { id: 3, name: 'Item 3', value: 'Valeur 3' },
      { id: 4, name: 'Item 4', value: 'Valeur 4' },
      { id: 5, name: 'Item 5', value: 'Valeur 5' },
      { id: 6, name: 'Item 6', value: 'Valeur 6' },
      { id: 7, name: 'Item 7', value: 'Valeur 7' },
      { id: 8, name: 'Item 8', value: 'Valeur 8' },
      { id: 9, name: 'Item 9', value: 'Valeur 9' },
      { id: 10, name: 'Item 10', value: 'Valeur 10' },
      { id: 11, name: 'Item 11', value: 'Valeur 11' },
      { id: 12, name: 'Item 12', value: 'Valeur 12' },
      { id: 13, name: 'Item 13', value: 'Valeur 13' },
      { id: 14, name: 'Item 14', value: 'Valeur 14' },
      { id: 15, name: 'Item 15', value: 'Valeur 15' },
    ];
    
    function renderPage(page) {
      const container = document.getElementById('items-container');
      const start = (page - 1) * itemsPerPage;
      const end = start + itemsPerPage;
      const pageItems = allItems.slice(start, end);
      
      container.innerHTML = pageItems.map(item => \`
        <div class="item" data-id="\${item.id}">
          <h3 class="item-name">\${item.name}</h3>
          <p class="item-value">\${item.value}</p>
        </div>
      \`).join('');
      
      document.getElementById('page-number').textContent = page;
      document.getElementById('total-pages').textContent = totalPages;
      
      // Gestion des boutons
      document.getElementById('prev-btn').classList.toggle('disabled', page === 1);
      document.getElementById('next-btn').classList.toggle('disabled', page === totalPages);
    }
    
    function goToPage(page) {
      if (page >= 1 && page <= totalPages) {
        currentPage = page;
        renderPage(page);
      }
    }
    
    // Initialisation
    renderPage(currentPage);
  </script>
</body>
</html>`,
};

/**
 * Écrit les pages HTML dans le dossier fixtures
 */
export function writeFixturePages(): void {
  const { writeFileSync } = require("fs");
  
  writeFileSync(join(PAGES_DIR, "simple.html"), TestPages.simple);
  writeFileSync(join(PAGES_DIR, "form.html"), TestPages.form);
  writeFileSync(join(PAGES_DIR, "list.html"), TestPages.list);
  writeFileSync(join(PAGES_DIR, "pagination.html"), TestPages.pagination);
}

export default createTestServer;
