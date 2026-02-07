import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { env, isDev } from './config/env';
import publicRoutes from './routes/public.routes';
import adminRoutes from './routes/admin.routes';
import adminAuthRoutes from './routes/admin-auth.routes';

const app = express();

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests from this IP, please try again after 15 minutes'
});

// Security & Middlewares
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

// Log incoming requests (useful for debugging deployed routing)
app.use((req, res, next) => {
    console.log('[req] method=%s url=%s host=%s headers=%j', req.method, req.originalUrl, req.headers.host, {
        origin: req.headers.origin,
        referer: req.headers.referer,
        'x-vercel-deployment': req.headers['x-vercel-deployment'] || null,
    });
    next();
});

// Strict CORS Policy
const allowedOrigins = [
    env.FRONTEND_URL,
    env.ADMIN_URL,
];

if (isDev) {
    allowedOrigins.push('http://localhost:3000'); // React/Next dev default
    allowedOrigins.push('http://localhost:5173'); // Vite dev default
    allowedOrigins.push('http://localhost:8080'); // Vite custom port
    allowedOrigins.push('http://localhost:8081'); // Vite alternate port
}

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like server-to-server tools or curl)
        if (!origin) return callback(null, true);

        // Allow explicitly configured origins
        if (allowedOrigins.indexOf(origin) !== -1) {
            return callback(null, true);
        }

        // During development allow any localhost or 127.0.0.1 origin (any port)
        try {
            const url = new URL(origin);
            if (isDev && (url.hostname === 'localhost' || url.hostname === '127.0.0.1')) {
                return callback(null, true);
            }
        } catch (err) {
            // if origin is not a valid URL, reject
        }

        const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
        return callback(new Error(msg), false);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-key', 'x-session-id'],
    optionsSuccessStatus: 204,
}));

// Apply rate limiter after CORS so preflight responses include CORS headers
app.use(limiter); // Apply globally

// Routes: mount under several common prefixes so serverless routing mismatches
// (some platforms strip parts of the path). This makes the backend more resilient
// to differences between local and deployed environments.
const publicPrefixes = ['/api/v1/public', '/v1/public', '/public', '/api/public'];
publicPrefixes.forEach((p) => app.use(p, publicRoutes));

const adminAuthPrefixes = ['/api/v1/admin/auth', '/v1/admin/auth', '/admin/auth', '/api/admin/auth'];
adminAuthPrefixes.forEach((p) => app.use(p, adminAuthRoutes));

const adminPrefixes = ['/api/v1/admin', '/v1/admin', '/admin', '/api/admin'];
adminPrefixes.forEach((p) => app.use(p, adminRoutes));

// Google OAuth (root-level routes for popup authentication)
app.get('/auth/google', (req, res) => {
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${env.GOOGLE_CLIENT_ID}` +
        `&redirect_uri=${encodeURIComponent(env.GOOGLE_CALLBACK_URL || '')}` +
        `&response_type=code` +
        `&scope=${encodeURIComponent('openid email profile')}` +
        `&access_type=offline` +
        `&prompt=consent`;

    res.redirect(googleAuthUrl);
});

app.get('/auth/google/callback', async (req, res) => {
    try {
        const { code } = req.query;

        console.log('🔁 /auth/google/callback received', { query: req.query });

        if (!code) {
            console.error('No authorization code received');
            throw new Error('No authorization code received');
        }

        // Exchange code for tokens
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                code,
                client_id: env.GOOGLE_CLIENT_ID,
                client_secret: env.GOOGLE_CLIENT_SECRET,
                redirect_uri: env.GOOGLE_CALLBACK_URL,
                grant_type: 'authorization_code'
            })
        });

        let tokens: any;
        try {
            tokens = await tokenResponse.json();
        } catch (e) {
            const text = await tokenResponse.text().catch(() => '<no-body>');
            console.error('Failed to parse token response', { status: tokenResponse.status, body: text });
            throw new Error('Failed to parse token response');
        }

        console.log('Token exchange response', { status: tokenResponse.status, tokens });

        if (!tokens || !tokens.access_token) {
            console.error('No access_token in token response', tokens);
            throw new Error('Failed to get access token');
        }

        // Get user info
        const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${tokens.access_token}` }
        });

        const googleUser: any = await userResponse.json();
        console.log('Google user info', googleUser);

        // Create or update user in database
        const authService = require('./services/auth.service');
        const user = await authService.createOrUpdateGoogleUser(
            googleUser.email,
            googleUser.name,
            googleUser.id
        );

        const token = authService.generateToken(user);

        // Send token back to parent window via postMessage
        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Authentication Successful</title>
                <style>
                    body {
                        font-family: system-ui, -apple-system, sans-serif;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        height: 100vh;
                        margin: 0;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                    }
                    .container {
                        text-align: center;
                        padding: 2rem;
                        background: rgba(255, 255, 255, 0.1);
                        border-radius: 1rem;
                        backdrop-filter: blur(10px);
                    }
                    .checkmark {
                        width: 80px;
                        height: 80px;
                        border-radius: 50%;
                        display: block;
                        margin: 0 auto 1rem;
                        stroke-width: 3;
                        stroke: white;
                        stroke-miterlimit: 10;
                        box-shadow: inset 0px 0px 0px white;
                        animation: fill .4s ease-in-out .4s forwards, scale .3s ease-in-out .9s both;
                    }
                    @keyframes scale {
                        0%, 100% { transform: none; }
                        50% { transform: scale3d(1.1, 1.1, 1); }
                    }
                    @keyframes fill {
                        100% { box-shadow: inset 0px 0px 0px 30px white; }
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <svg class="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                        <circle class="checkmark__circle" cx="26" cy="26" r="25" fill="none"/>
                        <path class="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
                    </svg>
                    <h1>Authentication Successful!</h1>
                    <p>You can close this window now.</p>
                </div>
                <script>
                    if (window.opener) {
                        window.opener.postMessage({
                            type: 'GOOGLE_AUTH_SUCCESS',
                            token: ${JSON.stringify(token)},
                            user: ${JSON.stringify(user)}
                        }, '*');
                        setTimeout(() => window.close(), 1500);
                    }
                </script>
            </body>
            </html>
        `);
    } catch (error: any) {
        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Authentication Failed</title>
                <style>
                    body {
                        font-family: system-ui, -apple-system, sans-serif;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        height: 100vh;
                        margin: 0;
                        background: linear-gradient(135deg, #f85032 0%, #e73827 100%);
                        color: white;
                    }
                    .container {
                        text-align: center;
                        padding: 2rem;
                        background: rgba(255, 255, 255, 0.1);
                        border-radius: 1rem;
                        backdrop-filter: blur(10px);
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>❌ Authentication Failed</h1>
                    <p>${error.message}</p>
                    <p>You can close this window.</p>
                </div>
                <script>
                    if (window.opener) {
                        window.opener.postMessage({
                            type: 'GOOGLE_AUTH_ERROR',
                            error: ${JSON.stringify(error.message)}
                        }, '*');
                        setTimeout(() => window.close(), 3000);
                    }
                </script>
            </body>
            </html>
        `);
    }
});

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', time: new Date().toISOString() });
});

// Debug probe for deployed environment diagnostics (safe - does not return secret values)
app.get('/__probe', (req, res) => {
    res.json({
        success: true,
        message: 'probe',
        method: req.method,
        url: req.originalUrl,
        path: req.path,
        headers: {
            host: req.headers.host,
            origin: req.headers.origin || null,
            referer: req.headers.referer || null
        },
        env: {
            SUPABASE_URL: !!process.env.SUPABASE_URL,
            SUPABASE_ANON_KEY: !!process.env.SUPABASE_ANON_KEY,
            SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
            NODE_ENV: process.env.NODE_ENV || null
        }
    });
});

// 404 Handler
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Endpoint not found' });
});

export default app;
