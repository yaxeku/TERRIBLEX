// src/middleware/pageServing.js
import fs from 'fs/promises';
import { parse } from 'url';
import path from 'path';
import HTMLTransformerService from '../services/htmlTransformer.js';

const pageServingMiddleware = async (req, res, next) => {
    try {
        // Skip middleware for static assets
        const requestedPath = req.url.split('?')[0];
        if (requestedPath.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg)$/)) {
            return next();
        }

        // Parse URL and get parameters
        const parsedUrl = parse(req.url, true);
        const clientId = parsedUrl.query.client_id;
        const oauthChallenge = parsedUrl.query.oauth_challenge;
        
        // Get requested page from URL
        let requestedPage = requestedPath.substring(1);
        
        // Debug logging
        console.log('Page request:', {
            requestedPage,
            clientId,
            oauthChallenge,
            hasSession: !!sessionManager.getSession(clientId),
            isVerified: sessionManager.isVerified(clientId)
        });

        // Validate session and parameters
        if (!clientId || !oauthChallenge || !sessionManager.validateAccess(clientId, oauthChallenge)) {
            console.log('Invalid or missing session parameters, redirecting to root');
            return res.redirect('/');
        }

        const session = sessionManager.getSession(clientId);
        if (!session) {
            console.log('No valid session found, redirecting to root');
            return res.redirect('/');
        }

        if (!sessionManager.isVerified(clientId)) {
            console.log('Session not verified through Turnstile, redirecting to root');
            return res.redirect('/');
        }

        // Page name validation
        const normalizedRequestedPage = requestedPage.replace('.html', '').toLowerCase();
        const normalizedSessionPage = session.currentPage.toLowerCase();
        
        if (normalizedRequestedPage !== normalizedSessionPage) {
            console.log('Page mismatch:', {
                requested: normalizedRequestedPage,
                current: normalizedSessionPage
            });
            return res.redirect(session.url);
        }

        // Ensure .html extension
        if (!requestedPage.endsWith('.html')) {
            requestedPage += '.html';
        }

        // Get and validate page path
        const pagePath = sessionManager.getPagePath(requestedPage);
        if (!pagePath) {
            console.log('Page not found:', requestedPage);
            return res.redirect('/');
        }

        // Read the HTML file
        const html = await fs.readFile(pagePath, 'utf8');
        
        // Transform the HTML
        const { transformedHtml, nonce } = await HTMLTransformerService.transformHTML(html);

        // Set comprehensive security headers
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('Surrogate-Control', 'no-store');
        res.setHeader('Content-Type', 'text/html; charset=UTF-8');
        
        // Enhanced Content Security Policy
        res.setHeader('Content-Security-Policy', [
            `default-src 'self'`,
            `script-src 'self' 'nonce-${nonce}' https://challenges.cloudflare.com`,
            `style-src 'self' 'unsafe-inline'`,
            `img-src 'self' data: https:`,
            `connect-src 'self' wss: https:`,
            `frame-src https://challenges.cloudflare.com`,
            `object-src 'none'`,
            `base-uri 'self'`
        ].join('; '));

        // Additional security headers
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'SAMEORIGIN');
        res.setHeader('Referrer-Policy', 'same-origin');
        res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

        // Send transformed HTML
        res.send(transformedHtml);

    } catch (error) {
        console.error('Error in page serving middleware:', error);
        
        // Log detailed error for debugging
        console.error({
            errorMessage: error.message,
            stack: error.stack,
            requestPath: req.url,
            clientId: req.query.client_id
        });

        // Fallback: serve original file if transformation fails
        if (error.code !== 'ENOENT') {
            const pagePath = sessionManager.getPagePath(requestedPath.substring(1));
            if (pagePath) {
                return res.sendFile(pagePath);
            }
        }
        
        res.redirect('/');
    }
};

export default pageServingMiddleware;