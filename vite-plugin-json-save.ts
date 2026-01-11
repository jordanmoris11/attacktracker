
import type { Plugin } from 'vite';
import fs from 'fs';
import path from 'path';

export function jsonSavePlugin(): Plugin {
    return {
        name: 'vite-plugin-json-save',
        configureServer(server) {
            server.middlewares.use('/api/save', (req, res, next) => {
                if (req.method === 'POST') {
                    let body = '';
                    req.on('data', chunk => {
                        body += chunk.toString();
                    });

                    req.on('end', () => {
                        try {
                            const { filePath, content } = JSON.parse(body);

                            // Security: Ensure path is relative and inside public/data
                            // Use process.cwd() to get the project root
                            const publicDir = path.resolve(process.cwd(), 'public/data');

                            // Normalize the requested path to remove leading slash
                            // e.g. "/data/shai.json" -> "shai.json"
                            // But wait, the stores load it as `/data/shai.json` or just `shai.json`?
                            // Let's assume the frontend sends the key it used to load, which might be relative url.
                            // We will enforce that filePath MUST be just a filename inside public/data for safety.

                            const filename = path.basename(filePath);
                            const targetPath = path.join(publicDir, filename);

                            // Verify directory traversal attempts
                            if (!targetPath.startsWith(publicDir)) {
                                throw new Error('Invalid path: Must be inside public/data');
                            }

                            console.log(`[Server] Saving JSON to: ${targetPath}`);

                            // Format JSON nicely
                            const jsonString = JSON.stringify(content, null, 2);
                            fs.writeFileSync(targetPath, jsonString);

                            res.statusCode = 200;
                            res.end(JSON.stringify({ success: true }));
                        } catch (err) {
                            console.error('[Server] Error saving file:', err);
                            res.statusCode = 500;
                            res.end(JSON.stringify({ error: (err as Error).message }));
                        }
                    });
                } else {
                    next();
                }
            });
        }
    };
}
