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
    console.log("Mentor User: mentor@example.com / mentor123");
    console.log("==============================\n");

    // Create test mentor
    await createTestMentor();

    // Create default categories
    await createDefaultCategories();

    // Test email connection
    await testEmailConnection();
  } catch (error) {
    console.error("Failed to create test users:", error);
  }
}

async function createTestMentor() {
  try {
    // Check if mentor already exists
    const existingMentor = await storage.getMentorByEmail("mentor@example.com");
    if (existingMentor) {
      console.log("Test mentor already exists: mentor@example.com");
      return;
    }

    // Create mentor user first
    const hashedPassword = await hashPassword("mentor123");
    const mentorUser = await storage.createUser({
      email: "mentor@example.com",
      username: "mentoruser",
      password: hashedPassword,
      fullName: "Dr. Sarah Johnson",
      isVerified: true,
      isAdmin: false,
    });

    // Create mentor profile
    const mentor = await storage.createMentor({
      name: "Dr. Sarah Johnson",
      email: "mentor@example.com",
      profession: "Senior Software Engineer & Tech Lead",
      bio: "Passionate software engineer with over 10 years of experience in full-stack development, cloud architecture, and team leadership. I love mentoring developers and sharing knowledge about modern web technologies, DevOps practices, and career growth in tech.",
      photo: null,
      isActive: true,
    });

    // Create mentor credentials linking the user to the mentor
    await storage.createMentorCredentials({
      userId: mentorUser.id,
      mentorId: mentor.id,
    });

    console.log("✓ Test mentor created: mentor@example.com / mentor123");
  } catch (error) {
    console.error("Error creating test mentor:", error);
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
          
          // First, try to find a regular user
          const user = await storage.getUserByEmail(email);
          console.log(`Regular user found: ${!!user}`);
          
          if (user && await comparePasswords(password, user.password)) {
            console.log(`Regular user password valid`);
            if (!user.isVerified) {
              console.log(`Regular user not verified`);
              return done(null, false, { message: 'Email not verified' });
            }
            console.log(`Regular user login successful`);
            return done(null, user);
          }

          // If no regular user found, check for mentor
          const mentor = await storage.getMentorByEmail(email);
          console.log(`Mentor found: ${!!mentor}, Active: ${mentor?.isActive}`);
          
          if (mentor && mentor.isActive) {
            const mentorCredentials = await storage.getMentorCredentials(mentor.id);
            console.log(`Mentor credentials found: ${!!mentorCredentials}`);
            
            if (mentorCredentials) {
              const passwordMatch = await comparePasswords(password, mentorCredentials.password);
              console.log(`Mentor password match: ${passwordMatch}`);
              
              if (passwordMatch) {
                // Create a user-like object for mentors
                const mentorUser = {
                  id: mentor.id,
                  email: mentor.email,
                  username: mentor.email.split('@')[0], // Use email prefix as username
                  fullName: mentor.name,
                  isVerified: true,
                  isAdmin: false,
                  isMentor: true, // Special flag to identify mentors
                  mentorProfile: {
                    profession: mentor.profession,
                    bio: mentor.bio,
                    photo: mentor.photo,
                  }
                };
                console.log(`Mentor login successful for: ${mentor.name}`);
                return done(null, mentorUser);
              }
            }
          }

          // No valid user or mentor found
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
    // Store both id and type for proper deserialization
    done(null, { id: user.id, isMentor: user.isMentor || false });
  });
  
  passport.deserializeUser(async (data: { id: number; isMentor: boolean }, done) => {
    try {
      if (data.isMentor) {
        // Deserialize mentor
        const mentor = await storage.getMentor(data.id);
        if (mentor && mentor.isActive) {
          const mentorUser = {
            id: mentor.id,
            email: mentor.email,
            username: mentor.email.split('@')[0],
            fullName: mentor.name,
            isVerified: true,
            isAdmin: false,
            isMentor: true,
            mentorProfile: {
              profession: mentor.profession,
              bio: mentor.bio,
              photo: mentor.photo,
            }
          };
          return done(null, mentorUser);
        }
      } else {
        // Deserialize regular user
        const user = await storage.getUser(data.id);
        if (user) {
          return done(null, user);
        }
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

      const existingUsername = await storage.getUserByUsername(username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }

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
