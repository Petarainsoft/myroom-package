import { Suspense } from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import SSRDemoClient from './SSRDemoClient';

export const metadata: Metadata = {
  title: 'MyRoom System - SSR Demo',
  description: 'Server-side rendering demonstration of MyRoom System with Next.js',
  keywords: ['3D', 'Room', 'Avatar', 'SSR', 'Next.js', 'Babylon.js'],
};

// This is a server component that demonstrates SSR compatibility
export default async function SSRDemo({
  searchParams
}: {
  searchParams: Promise<{ apiBaseUrl?: string; apiKey?: string }>
}) {
  const params = await searchParams;
  const apiBaseUrl = params.apiBaseUrl || 'http://localhost:3001/api';
  const apiKey = params.apiKey || 'your-api-key-here';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Rendered on Server */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="text-blue-600 hover:text-blue-800 flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Home
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">SSR Compatibility Demo</h1>
            </div>
            <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
              ✓ Server Rendered
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* SSR Information - Rendered on Server */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Server-Side Rendering (SSR)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Benefits of SSR</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Faster initial page load</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Better SEO optimization</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Improved accessibility</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Progressive enhancement</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Implementation Details</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Dynamic imports for 3D components</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Client-side hydration</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Graceful loading states</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Error boundary protection</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Configuration Display - Rendered on Server */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Configuration (Server Rendered)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                API Base URL
              </label>
              <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded border">
                {apiBaseUrl}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                API Key
              </label>
              <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded border">
                {apiKey.substring(0, 10)}...
              </div>
            </div>
          </div>
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-blue-900">SSR Note</h3>
                <p className="text-sm text-blue-700 mt-1">
                  This configuration is rendered on the server and available immediately when the page loads. 
                  The 3D components will be dynamically loaded on the client side for optimal performance.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Client-side 3D Component */}
        <Suspense
          fallback={
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">3D Scene (Client-side)</h2>
              <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Hydrating 3D Scene...</p>
                  <p className="text-sm text-gray-500 mt-2">Loading Babylon.js and MyRoom components</p>
                </div>
              </div>
            </div>
          }
        >
          <SSRDemoClient apiBaseUrl={apiBaseUrl} apiKey={apiKey} />
        </Suspense>

        {/* Implementation Code - Rendered on Server */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Implementation Code</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Server Component (page.tsx)</h3>
              <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                <code>{`// Server Component - Rendered on Server
export default function SSRDemo({ searchParams }) {
  const apiBaseUrl = searchParams.apiBaseUrl || 'http://localhost:3001/api';
  const apiKey = searchParams.apiKey || 'your-api-key-here';

  return (
    <div>
      {/* Server-rendered content */}
      <header>...</header>
      
      {/* Client component with Suspense */}
      <Suspense fallback={<LoadingSpinner />}>
        <SSRDemoClient apiBaseUrl={apiBaseUrl} apiKey={apiKey} />
      </Suspense>
    </div>
  );
}`}</code>
              </pre>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Client Component (SSRDemoClient.tsx)</h3>
              <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                <code>{`'use client';

// Dynamic import for SSR compatibility
const MyRoom = dynamic(() => import('myroom-system').then(mod => mod.MyRoom), {
  ssr: false,
  loading: () => <LoadingSpinner />
});

export default function SSRDemoClient({ apiBaseUrl, apiKey }) {
  return (
    <MyRoom
      apiBaseUrl={apiBaseUrl}
      apiKey={apiKey}
      // ... other props
    />
  );
}`}</code>
              </pre>
            </div>
          </div>
        </div>

        {/* Performance Metrics - Rendered on Server */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Performance Benefits</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Fast Initial Load</h3>
              <p className="text-sm text-gray-600">Page content loads immediately while 3D components hydrate in background</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">SEO Optimized</h3>
              <p className="text-sm text-gray-600">Search engines can crawl and index the page content effectively</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Progressive Enhancement</h3>
              <p className="text-sm text-gray-600">Works even if JavaScript fails to load, with graceful degradation</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}