// Vercel Serverless Function Entry Point
// This file proxies all /api/* requests to the Express server

import handler from '../dist/index.js';

export default handler;
