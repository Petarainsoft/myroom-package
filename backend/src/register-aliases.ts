/**
 * Register module aliases for path resolution
 * This file should be imported at the very beginning of the application
 */

import path from 'path';

// In development, we use ts-node which handles path aliases via tsconfig.json
// In production, we need to use module-alias package
if (process.env.NODE_ENV !== 'development') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const moduleAlias = require('module-alias');
  
  // Register aliases relative to the dist directory
  moduleAlias.addAliases({
    '@': path.join(__dirname, '/'),
    '@/config': path.join(__dirname, '/config'),
    '@/controllers': path.join(__dirname, '/controllers'),
    '@/middleware': path.join(__dirname, '/middleware'),
    '@/models': path.join(__dirname, '/models'),
    '@/routes': path.join(__dirname, '/routes'),
    '@/services': path.join(__dirname, '/services'),
    '@/utils': path.join(__dirname, '/utils'),
    '@/types': path.join(__dirname, '/types'),
    '@/schemas': path.join(__dirname, '/schemas'),
    '@/validators': path.join(__dirname, '/validators')
  });
}