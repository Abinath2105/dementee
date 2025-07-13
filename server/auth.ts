import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import { testEmailConnection } from "./services/email";
import { sendOtpEmail } from "./services/email";

declare global {
  namespace Express {
    interface User extends SelectUser {
      isMentor?: boolean;
      mentorProfile?: {
        profession: string;
        bio: string | null;
        photo: string | null;
      };
    }
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function createTestUser() {
  try {
    // Check if test user already exists
    const existingUser = await storage.getUserByEmail("test@example.com");
    if (existingUser) {
      console.log("Test user already exists: test@example.com");
    } else {
      // Create regular test user
      const hashedPassword = await hashPassword("password123");
      await storage.createUser({
        email: "test@example.com",
        username: "testuser",
        password: hashedPassword,
        fullName: "Test User",
        isVerified: true,
        isAdmin: false,
      });
      console.log("Regular test user created: test@example.com / password123");
    }

    // Check if admin user already exists
    const existingAdmin = await storage.getUserByEmail("admin@example.com");
    if (existingAdmin) {
      console.log("Admin user already exists: admin@example.com");
    } else {
      // Create admin test user
      const hashedAdminPassword = await hashPassword("admin123");
      await storage.createUser({
        email: "admin@example.com",
        username: "admin",
        password: hashedAdminPassword,
        fullName: "Admin User",
        isVerified: true,
        isAdmin: true,
      });
      console.log("Admin test user created: admin@example.com / admin123");
    }

    console.log("\n=== TEST LOGIN CREDENTIALS ===");
    console.log("Regular User: test@example.com / password123");
    console.log("Admin User: admin@example.com / admin123");
    console.log("==============================\n");

    // Create default categories
    await createDefaultCategories();

    // Test email connection
    await testEmailConnection();
  } catch (error) {
    console.error("Failed to create test users:", error);
  }
}



async function createDefaultCategories() {
  try {
    const defaultCategories = [
      { name: "Programming", slug: "programming" },
      { name: "Web Development", slug: "web-development" },
      { name: "Data Science", slug: "data-science" },
      { name: "Mobile Development", slug: "mobile-development" },
      { name: "DevOps", slug: "devops" },
      { name: "Design", slug: "design" },
    ];

    for (const category of defaultCategories) {
      // For simplified app, just try to create the category
      try {
        await storage.createCategory({
          name: category.name,
          description: `Learn ${category.name} skills and techniques`
        });
        console.log(`Created category: ${category.name}`);
      } catch (error) {
        // Category might already exist, ignore error
        console.log(`Category ${category.name} already exists or error occurred`);
      }
    }
  } catch (error) {
    console.error("Failed to create default categories:", error);
  }
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || 'default-secret-key',
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Create test user on startup
  createTestUser();

  passport.use(
    new LocalStrategy(
      { usernameField: 'email' },
      async (email, password, done) => {
        try {
          console.log(`=== LOGIN ATTEMPT ===`);
          console.log(`Email: ${email}`);
          console.log(`Password length: ${password.length}`);
          
          // Find user by email
          const user = await storage.getUserByEmail(email);
          console.log(`User found: ${!!user}`);
          
          if (user && await comparePasswords(password, user.password)) {
            console.log(`User password valid`);
            if (!user.isVerified) {
              console.log(`User not verified`);
              return done(null, false, { message: 'Email not verified' });
            }
            console.log(`User login successful`);
            return done(null, user);
          }

          // No valid user found
          console.log(`Login failed - no valid credentials found`);
          console.log(`=== END LOGIN ATTEMPT ===`);
          return done(null, false);
        } catch (error) {
          console.error(`Login error:`, error);
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });
  
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      if (user) {
        return done(null, user);
      }
      done(null, false);
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const { email, username, password, fullName } = req.body;

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already exists" });
      }

      // Note: In simplified app, we don't check username uniqueness
      // since our storage interface doesn't have getUserByUsername

      // Create user (unverified)
      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({
        email,
        username,
        password: hashedPassword,
        fullName,
      });

      // Generate and send OTP
      const otp = generateOtp();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      await storage.createOtp({
        email,
        code: otp,
        expiresAt,
      });

      try {
        await sendOtpEmail(email, otp);
        res.status(201).json({ 
          message: "Registration successful. Please check your email for verification code.",
          email: user.email 
        });
      } catch (emailError) {
        console.error('Email sending failed, providing OTP in response for testing:', emailError);
        res.status(201).json({ 
          message: `Registration successful. Email service unavailable - use this verification code: ${otp}`,
          email: user.email,
          testOtp: otp // Temporary for testing
        });
      }
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/verify-otp", async (req, res) => {
    try {
      const { email, code } = req.body;

      const otp = await storage.getValidOtp(email, code);
      if (!otp) {
        return res.status(400).json({ message: "Invalid or expired verification code" });
      }

      // Mark OTP as used and verify user
      await storage.markOtpAsUsed(otp.id);
      await storage.verifyUser(email);

      // Auto-login the user
      const user = await storage.getUserByEmail(email);
      if (user) {
        req.login(user, (err) => {
          if (err) return res.status(500).json({ message: "Login failed" });
          res.json({ message: "Email verified successfully", user });
        });
      } else {
        res.status(404).json({ message: "User not found" });
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      res.status(500).json({ message: "Verification failed" });
    }
  });

  app.post("/api/resend-otp", async (req, res) => {
    try {
      const { email } = req.body;

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.isVerified) {
        return res.status(400).json({ message: "Email already verified" });
      }

      // Generate new OTP
      const otp = generateOtp();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      await storage.createOtp({
        email,
        code: otp,
        expiresAt,
      });

      await sendOtpEmail(email, otp);

      res.json({ message: "Verification code sent" });
    } catch (error) {
      console.error('Resend OTP error:', error);
      res.status(500).json({ message: "Failed to resend verification code" });
    }
  });

  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    res.status(200).json(req.user);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
}
