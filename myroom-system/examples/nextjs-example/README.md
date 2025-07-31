# MyRoom System - Next.js Integration Example

This example demonstrates how to integrate MyRoom System into a Next.js application with SSR compatibility and full backend connectivity.

## Features

- ✅ Next.js 14+ integration
- ✅ SSR (Server-Side Rendering) compatible
- ✅ Backend API connectivity
- ✅ Dynamic imports for client-side rendering
- ✅ Environment variables support
- ✅ TypeScript support
- ✅ CSS Modules styling
- ✅ Performance optimizations
- ✅ SEO friendly
- ✅ Production ready
- ✅ Webpack optimizations
- ✅ Error boundaries

## Prerequisites

- Node.js 18+
- Next.js 14+
- React 18+
- MyRoom Backend API running

## Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   
   Update `.env.local` with your backend configuration:
   ```bash
   NEXT_PUBLIC_BACKEND_URL=http://localhost:3579
   NEXT_PUBLIC_MYROOM_API_KEY=your-api-key
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to `http://localhost:3579`

## Project Structure

```
nextjs-example/
├── pages/
│   ├── index.js         # Main page with MyRoom integration
│   └── _app.js          # App configuration (optional)
├── styles/
│   ├── Home.module.css  # Page-specific styles
│   └── globals.css      # Global styles (optional)
├── public/
│   └── favicon.ico      # Static assets
├── next.config.js       # Next.js configuration
├── package.json         # Dependencies and scripts
├── .env.example         # Environment variables template
└── README.md           # This file
```

## Key Features

### SSR Compatibility

MyRoom System is loaded dynamically to avoid SSR issues:

```jsx
const MyRoom = dynamic(
  () => import('myroom-system').then(mod => mod.MyRoom),
  { 
    ssr: false,
    loading: () => <div>Loading MyRoom System...</div>
  }
);
```

### Environment Variables

Next.js environment variables with `NEXT_PUBLIC_` prefix:

```jsx
const backendConfig = {
  apiEndpoint: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3579',
  apiKey: process.env.NEXT_PUBLIC_MYROOM_API_KEY
};
```

### Client-Side Mounting

Ensure component only renders on client-side:

```jsx
const [mounted, setMounted] = useState(false);

useEffect(() => {
  setMounted(true);
}, []);

if (!mounted) {
  return <div>Loading...</div>;
}
```

### CSS Modules

Scoped styling with CSS Modules:

```jsx
import styles from '../styles/Home.module.css';

<div className={styles.container}>
  <MyRoom className={styles.myroomContainer} />
</div>
```

## Configuration Files

### next.config.js

Optimized configuration for MyRoom System:

```javascript
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  experimental: {
    esmExternals: true,
    serverComponentsExternalPackages: ['myroom-system']
  },
  
  webpack: (config, { isServer }) => {
    // Handle 3D assets
    config.module.rules.push({
      test: /\.(glb|gltf|babylon)$/,
      use: 'file-loader'
    });
    
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        path: false,
        crypto: false
      };
    }
    
    return config;
  }
};
```

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|----------|
| `NEXT_PUBLIC_BACKEND_URL` | Backend API URL | Yes | `http://localhost:3579` |
| `NEXT_PUBLIC_MYROOM_API_KEY` | API key for authentication | Yes | - |
| `NEXT_PUBLIC_DEBUG_MODE` | Enable debug mode | No | `false` |

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run export` - Export static site
- `npm run type-check` - TypeScript type checking

## Deployment

### Vercel (Recommended)

1. **Connect your repository to Vercel**
2. **Set environment variables:**
   ```bash
   NEXT_PUBLIC_BACKEND_URL=https://your-backend.com
   NEXT_PUBLIC_MYROOM_API_KEY=your-production-api-key
   ```
3. **Deploy automatically on push**

### Other Platforms

#### Netlify
```bash
npm run build
npm run export
# Deploy the 'out' directory
```

#### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3579
CMD ["npm", "start"]
```

## Performance Optimizations

### Bundle Analysis

```bash
npm run analyze
```

### Image Optimization

```jsx
import Image from 'next/image';

<Image
  src="/myroom-preview.jpg"
  alt="MyRoom Preview"
  width={800}
  height={600}
  priority
/>
```

### Code Splitting

```jsx
// Lazy load heavy components
const HeavyComponent = dynamic(() => import('../components/HeavyComponent'), {
  loading: () => <p>Loading...</p>
});
```

### Preloading

```jsx
<Head>
  <link rel="preconnect" href={backendConfig.apiEndpoint} />
  <link rel="dns-prefetch" href={backendConfig.apiEndpoint} />
</Head>
```

## SEO Optimization

### Meta Tags

```jsx
<Head>
  <title>MyRoom System - 3D Room Visualization</title>
  <meta name="description" content="Interactive 3D room and avatar system" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta property="og:title" content="MyRoom System" />
  <meta property="og:description" content="3D Room Visualization" />
  <meta property="og:image" content="/myroom-preview.jpg" />
</Head>
```

### Static Generation

```jsx
export async function getStaticProps() {
  return {
    props: {
      // Pre-fetch data if needed
    },
    revalidate: 3600, // Revalidate every hour
  };
}
```

## Error Handling

### Error Boundaries

```jsx
class MyRoomErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('MyRoom Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div>Something went wrong with MyRoom System.</div>;
    }

    return this.props.children;
  }
}
```

### Custom Error Page

Create `pages/_error.js`:

```jsx
function Error({ statusCode }) {
  return (
    <p>
      {statusCode
        ? `An error ${statusCode} occurred on server`
        : 'An error occurred on client'}
    </p>
  );
}

Error.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default Error;
```

## TypeScript Support

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

### Type Definitions

```typescript
import { MyRoomProps } from 'myroom-system';

interface PageProps {
  initialData?: any;
}

const HomePage: React.FC<PageProps> = ({ initialData }) => {
  // Component implementation
};
```

## Troubleshooting

### Common Issues

1. **"Hydration mismatch"**
   ```jsx
   // Ensure client-side only rendering
   const [mounted, setMounted] = useState(false);
   useEffect(() => setMounted(true), []);
   if (!mounted) return null;
   ```

2. **"Module not found"**
   ```bash
   # Clear Next.js cache
   rm -rf .next
   npm run dev
   ```

3. **"WebGL context lost"**
   ```jsx
   // Handle context loss
   const handleError = (error) => {
     if (error.message.includes('WebGL')) {
       window.location.reload();
     }
   };
   ```

### Debug Mode

```jsx
<MyRoom
  enableDebug={process.env.NODE_ENV === 'development'}
  onError={(error) => {
    if (process.env.NODE_ENV === 'development') {
      console.error('MyRoom Debug:', error);
    }
  }}
/>
```

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

To contribute to this example:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with `npm run build`
5. Submit a pull request

## License

MIT License - see the [LICENSE](../../LICENSE) file for details.

## Support

For support and questions:

- 📧 Email: support@myroom.com
- 💬 Discord: [MyRoom Community](https://discord.gg/myroom)
- 📖 Documentation: [docs.myroom.com](https://docs.myroom.com)
- 🐛 Issues: [GitHub Issues](https://github.com/myroom/myroom-system/issues)