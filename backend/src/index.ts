// Register module aliases first
import './register-aliases';

// Fix BigInt serialization globally at startup
(BigInt.prototype as any).toJSON = function() {
  return Number(this);
};

import App from '@/app';
import { config } from '@/config/config';
import { logger } from '@/utils/logger';

// Create and start the application
const app = new App();

// Start the server
app.start(config.PORT).catch((error) => {
  logger.error('Failed to start application', {
    error: error instanceof Error ? error.message : 'Unknown error',
    stack: error instanceof Error ? error.stack : undefined,
  });
  process.exit(1);
});

// Export the app instance for testing
export default app.getApp();