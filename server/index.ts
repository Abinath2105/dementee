import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { testDatabaseConnection } from "./db";

// Validate required environment variables gracefully
function validateEnvironment() {
  const requiredEnvVars = ['DATABASE_URL'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    const errorMessage = `Missing required environment variables: ${missingVars.join(', ')}`;
    console.error(errorMessage);
    throw new Error(errorMessage);
  }

  // Warn about optional but recommended variables
  const optionalVars = ['SESSION_SECRET', 'SMTP_USER', 'SMTP_PASS'];
  const missingOptional = optionalVars.filter(varName => !process.env[varName]);
  
  if (missingOptional.length > 0) {
    console.warn('Missing optional environment variables (using defaults):', missingOptional.join(', '));
  }
  
  console.log('✓ Environment variables validated successfully');
}

const app = express();

// Health check endpoints - registered first for deployment requirements
app.get("/api/health", async (req, res) => {
  try {
    const healthStatus = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      service: "Zmartclass",
      environment: process.env.NODE_ENV || 'unknown',
      version: "1.0.0",
      checks: {
        database: false,
        email: false
      }
    };

    // Quick database health check (don't fail if down)
    try {
      await testDatabaseConnection();
      healthStatus.checks.database = true;
    } catch (error) {
      console.warn('Health check: Database connection failed');
    }

    // Email service health check
    try {
      healthStatus.checks.email = await import('./services/email').then(m => m.testEmailConnection());
    } catch (error) {
      console.warn('Health check: Email service check failed');
    }

    res.status(200).json(healthStatus);
  } catch (error) {
    res.status(500).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      service: "Zmartclass",
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Root health check for deployment platforms (lightweight version)
app.get("/health", (req, res) => {
  res.status(200).json({ 
    status: "healthy", 
    timestamp: new Date().toISOString(),
    service: "Zmartclass",
    uptime: process.uptime()
  });
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Enhanced initialization function with comprehensive error handling
async function initializeServer() {
  console.log('🚀 Starting Zmartclass server initialization...');
  
  try {
    // Step 1: Validate environment variables
    console.log('Step 1: Validating environment variables...');
    validateEnvironment();

    // Step 2: Test database connection
    console.log('Step 2: Testing database connection...');
    await testDatabaseConnection();

    // Step 3: Set NODE_ENV if not provided (for production compatibility)
    if (!process.env.NODE_ENV) {
      process.env.NODE_ENV = 'production';
      console.log('✓ NODE_ENV set to production (default)');
    } else {
      console.log(`✓ NODE_ENV: ${process.env.NODE_ENV}`);
    }

    // Step 4: Register routes and setup authentication
    console.log('Step 3: Setting up routes and authentication...');
    const server = await registerRoutes(app);
    console.log('✓ Routes and authentication configured');

    // Step 5: Setup error handling middleware
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      
      console.error(`Error ${status}:`, message);
      res.status(status).json({ message });
      
      // Don't throw in production - log and continue
      if (process.env.NODE_ENV === 'development') {
        throw err;
      }
    });

    // Step 6: Setup Vite or static serving
    console.log('Step 4: Setting up frontend serving...');
    if (process.env.NODE_ENV === "development") {
      await setupVite(app, server);
      console.log('✓ Vite development server configured');
    } else {
      serveStatic(app);
      console.log('✓ Static file serving configured');
    }

    // Step 7: Start the server
    console.log('Step 5: Starting HTTP server...');
    const port = parseInt(process.env.PORT || '5000', 10);
    
    return new Promise<void>((resolve, reject) => {
      const serverInstance = server.listen(port, "0.0.0.0", async () => {
        try {
          console.log('✅ Server initialization completed successfully!');
          log(`serving on port ${port} in ${process.env.NODE_ENV} mode`);
          
          // Log additional connection info for debugging
          if (process.env.REPL_SLUG) {
            log(`Replit app should be accessible at: https://${process.env.REPL_SLUG}-${process.env.REPL_OWNER}.replit.app`);
          }
          
          // Final readiness check
          console.log('🔍 Performing final readiness check...');
          
          // Verify we can handle a basic request
          const testHealthCheck = await fetch(`http://localhost:${port}/health`).catch(() => null);
          if (testHealthCheck?.ok) {
            console.log('✓ Health check endpoint responding correctly');
          } else {
            console.warn('⚠️  Health check endpoint not responding as expected');
          }
          
          console.log('🎉 Zmartclass is ready to accept connections!');
          resolve();
        } catch (error) {
          console.warn('Warning during final readiness check:', error);
          // Don't fail the startup for readiness check issues
          resolve();
        }
      });

      serverInstance.on('error', (err) => {
        console.error('Failed to start HTTP server:', err);
        reject(err);
      });

      // Graceful shutdown handling
      process.on('SIGTERM', () => {
        console.log('SIGTERM signal received: closing HTTP server gracefully');
        serverInstance.close(() => {
          console.log('HTTP server closed');
          process.exit(0);
        });
      });

      process.on('SIGINT', () => {
        console.log('SIGINT signal received: closing HTTP server gracefully');
        serverInstance.close(() => {
          console.log('HTTP server closed');
          process.exit(0);
        });
      });
    });

  } catch (error) {
    console.error('❌ Server initialization failed:', error instanceof Error ? error.message : 'Unknown error');
    
    // Provide helpful error messages for common issues
    if (error instanceof Error) {
      if (error.message.includes('DATABASE_URL')) {
        console.error('💡 Fix: Ensure your PostgreSQL database is properly configured and DATABASE_URL is set');
      } else if (error.message.includes('EADDRINUSE')) {
        console.error('💡 Fix: Port is already in use. Try a different PORT or stop the conflicting process');
      } else if (error.message.includes('connect')) {
        console.error('💡 Fix: Check your database connection string and network connectivity');
      }
    }
    
    throw error; // Re-throw to be caught by outer handler
  }
}

// Initialize server with error handling
(async () => {
  try {
    await initializeServer();
  } catch (error) {
    console.error('🚨 Fatal error during server startup:', error);
    console.error('Server will not start. Please check the configuration and try again.');
    
    // In production, we might want to restart or notify monitoring systems
    // For now, we'll exit gracefully with an error code
    process.exit(1);
  }
})();
