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
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
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
      const existing = await storage.getCategoryBySlug(category.slug);
      if (!existing) {
        await storage.createCategory(category);
        console.log(`Created category: ${category.name}`);
      }
    }
  } catch (error) {
    console.error("Failed to create default categories:", error);
  }
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || 'Zmartclass-Default-Secret-' + Date.now(),
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
          // First check admin users
          const user = await storage.getUserByEmail(email);
          if (user && (await comparePasswords(password, user.password))) {
            if (!user.isVerified) {
              return done(null, false, { message: 'Email not verified' });
            }
            return done(null, user);
          }
          
          // Then check public users
          const publicUser = await storage.getPublicUserByEmail(email);
          if (publicUser && (await comparePasswords(password, publicUser.password))) {
            if (!publicUser.isVerified) {
              return done(null, false, { message: 'Email not verified' });
            }
            // Convert public user to user format for session
            return done(null, {
              ...publicUser,
              username: publicUser.email,
              isAdmin: false,
              role: 'student'
            });
          }
          
          return done(null, false);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user, done) => done(null, { id: user.id, isPublic: !user.isAdmin && !user.username }));
  passport.deserializeUser(async (sessionData: any, done) => {
    try {
      if (sessionData.isPublic) {
        // Deserialize public user
        const publicUser = await storage.getPublicUser(sessionData.id);
        if (publicUser) {
          done(null, {
            ...publicUser,
            username: publicUser.email,
            isAdmin: false,
            role: 'student'
          });
        } else {
          done(null, false);
        }
      } else {
        // Deserialize admin user
        const user = await storage.getUser(sessionData.id);
        done(null, user);
      }
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const { username, password, fullName } = req.body;
      const email = username; // Frontend sends email as username

      // Check if user already exists in either table
      const existingUser = await storage.getUserByEmail(email);
      const existingPublicUser = await storage.getPublicUserByEmail(email);
      
      if (existingUser || existingPublicUser) {
        return res.status(400).json({ message: "Email already exists" });
      }

      // Create public user (unverified)
      const hashedPassword = await hashPassword(password);
      const publicUser = await storage.createPublicUser({
        email,
        fullName,
        password: hashedPassword,
        isVerified: false,
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
          email: publicUser.email 
        });
      } catch (emailError) {
        console.error('Email sending failed, providing OTP in response for testing:', emailError);
        res.status(201).json({ 
          message: `Registration successful. Email service unavailable - use this verification code: ${otp}`,
          email: publicUser.email,
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

      // Mark OTP as used
      await storage.markOtpAsUsed(otp.id);

      // Check if it's an admin user or public user
      const user = await storage.getUserByEmail(email);
      const publicUser = await storage.getPublicUserByEmail(email);

      if (user) {
        // Admin user
        await storage.verifyUser(email);
        req.login(user, (err) => {
          if (err) return res.status(500).json({ message: "Login failed" });
          res.json({ message: "Email verified successfully", user });
        });
      } else if (publicUser) {
        // Public user
        await storage.verifyPublicUser(email);
        const userSession = {
          ...publicUser,
          username: publicUser.email,
          isAdmin: false,
          role: 'student'
        };
        req.login(userSession, (err) => {
          if (err) return res.status(500).json({ message: "Login failed" });
          res.json({ message: "Email verified successfully", user: userSession });
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

      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      // Check if user exists (either admin or public user)
      const user = await storage.getUserByEmail(email);
      const publicUser = await storage.getPublicUserByEmail(email);

      if (!user && !publicUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if already verified
      if ((user && user.isVerified) || (publicUser && publicUser.isVerified)) {
        return res.status(400).json({ message: "Email already verified" });
      }

      // Generate new OTP
      const otp = generateOtp();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      await storage.createOtp({
        email,
        code: otp,
        expiresAt,
      });

      try {
        await sendOtpEmail(email, otp);
        res.json({ 
          message: "Verification code sent to your email",
          email 
        });
      } catch (emailError) {
        console.error('Email sending failed, providing OTP in response for testing:', emailError);
        res.json({ 
          message: `Email service unavailable - use this verification code: ${otp}`,
          email,
          testOtp: otp // Temporary for testing
        });
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      res.status(500).json({ message: "Failed to resend verification code" });
    }
  });

  app.post("/api/resend-otp", async (req, res) => {
    try {
      const { email } = req.body;

      const user = await storage.getUserByEmail(email);
      const publicUser = await storage.getPublicUserByEmail(email);

      if (!user && !publicUser) {
        return res.status(404).json({ message: "User not found" });
      }

      if ((user && user.isVerified) || (publicUser && publicUser.isVerified)) {
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
