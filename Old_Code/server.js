const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;

const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.txt': 'text/plain',
};

const server = http.createServer((req, res) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);

    // Handle default /
    let filePath = '.' + req.url;
    if (filePath === './') {
        filePath = './index.html';
    }

    // Parse query params (remove them for file lookup)
    const q = filePath.indexOf('?');
    if (q !== -1) {
        filePath = filePath.substring(0, q);
    }

    const extname = path.extname(filePath);

    // SPA / Dynamic Routing Logic
    // If the path has NO extension (e.g. /kali, /view/graph1), serve index.html
    // and let the frontend handle the routing.
    // Exception: data/ folders might be requested directly? No, usually data/file.txt has extension.
    // Exception: verify if it is a directory.

    let contentType = MIME_TYPES[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                // File not found. 
                // If it looks like a route (no extension), serve index.html (SPA Fallback)
                if (!extname) {
                    fs.readFile('./index.html', (err, indexContent) => {
                        if (err) {
                            res.writeHead(500);
                            res.end('Error loading index.html');
                        } else {
                            res.writeHead(200, { 'Content-Type': 'text/html' });
                            res.end(indexContent, 'utf-8');
                        }
                    });
                    return;
                }

                // Genuine 404 for existing extensions
                res.writeHead(404);
                res.end(`File not found: ${filePath}`);
            } else {
                // Server error
                res.writeHead(500);
                res.end(`Server Error: ${error.code}`);
            }
        } else {
            // Success
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
    console.log(`Try: http://localhost:${PORT}/kali (maps to data/kali.txt)`);
});
