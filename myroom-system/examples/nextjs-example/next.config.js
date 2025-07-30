/** @type {import('next').NextConfig} */
const nextConfig = {
  // React configuration
  reactStrictMode: true,
  swcMinify: true,
  
  // Experimental features
  experimental: {
    // Enable modern bundling
    esmExternals: true,
    // Optimize for MyRoom System
    optimizeCss: true,
    // Enable server components (optional)
    serverComponentsExternalPackages: ['myroom-system']
  },
  
  // Webpack configuration for MyRoom System
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Handle Babylon.js and 3D libraries
    config.module.rules.push({
      test: /\.(glb|gltf|babylon|obj|mtl)$/,
      use: {
        loader: 'file-loader',
        options: {
          publicPath: '/_next/static/assets/',
          outputPath: 'static/assets/',
        },
      },
    });
    
    // Handle shader files
    config.module.rules.push({
      test: /\.(glsl|vs|fs|vert|frag)$/,
      use: 'raw-loader',
    });
    
    // Optimize for client-side rendering
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }
    
    // Bundle analyzer (optional)
    if (process.env.ANALYZE === 'true') {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'server',
          analyzerPort: isServer ? 8888 : 8889,
          openAnalyzer: true,
        })
      );
    }
    
    return config;
  },
  
  // Image optimization
  images: {
    domains: [
      'localhost',
      // Add your backend domain here
      'api.myroom.com',
      // Add CDN domains if using
      'cdn.myroom.com',
    ],
    formats: ['image/webp', 'image/avif'],
  },
  
  // Environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // Public runtime config
  publicRuntimeConfig: {
    // Will be available on both server and client
    staticFolder: '/static',
  },
  
  // Server runtime config
  serverRuntimeConfig: {
    // Will only be available on the server side
    mySecret: 'secret',
  },
  
  // Headers for security and performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
      {
        // Cache static assets
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  
  // Redirects (if needed)
  async redirects() {
    return [
      // Example redirect
      // {
      //   source: '/old-path',
      //   destination: '/new-path',
      //   permanent: true,
      // },
    ];
  },
  
  // Rewrites for API proxy (if needed)
  async rewrites() {
    return [
      // Proxy API calls to backend
      {
        source: '/api/myroom/:path*',
        destination: `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'}/api/:path*`,
      },
    ];
  },
  
  // Compression
  compress: true,
  
  // Power by header
  poweredByHeader: false,
  
  // Generate ETags
  generateEtags: true,
  
  // Page extensions
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
  
  // Trailing slash
  trailingSlash: false,
  
  // Base path (if deploying to subdirectory)
  // basePath: '/myroom',
  
  // Asset prefix (if using CDN)
  // assetPrefix: 'https://cdn.myroom.com',
  
  // Output configuration
  output: 'standalone', // For Docker deployment
  
  // TypeScript configuration
  typescript: {
    // Dangerously allow production builds to successfully complete even if
    // your project has TypeScript errors.
    ignoreBuildErrors: false,
  },
  
  // ESLint configuration
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: false,
  },
};

module.exports = nextConfig;