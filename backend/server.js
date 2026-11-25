const dotenvResult = require("dotenv").config({
  path: require("path").join(__dirname, ".env"),
});

console.log("Loaded .env variable names:", Object.keys(dotenvResult.parsed || {}));
console.log("Email loaded:", Boolean(process.env.EMAIL_USER));
console.log("App password loaded:", Boolean(process.env.EMAIL_APP_PASSWORD));
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const nodemailer = require("nodemailer");



const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET;
console.log("Email configuration:", {
  emailLoaded: Boolean(process.env.EMAIL_USER),
  passwordLoaded: Boolean(process.env.EMAIL_APP_PASSWORD),
  emailLength: process.env.EMAIL_USER?.length || 0,
  passwordLength: process.env.EMAIL_APP_PASSWORD?.replace(/\s/g, "").length || 0,
});

const emailTransporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER?.trim(),
    pass: process.env.EMAIL_APP_PASSWORD?.replace(/\s/g, ""),
  },
});

function hashValue(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}
const uploadRoot = path.join(__dirname, "uploads");
const resumeDir = path.join(uploadRoot, "resumes");
const projectDir = path.join(uploadRoot, "projects");

fs.mkdirSync(resumeDir, { recursive: true });
fs.mkdirSync(projectDir, { recursive: true });
const resumeStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, resumeDir);
  },
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    cb(null, `${crypto.randomUUID()}${extension}`);
  },
});

const resumeUpload = multer({
  storage: resumeStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = {
      ".pdf": "application/pdf",
      ".doc": "application/msword",
      ".docx":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    };

    const extension = path.extname(file.originalname).toLowerCase();

    if (allowed[extension] === file.mimetype) {
      return cb(null, true);
    }

    cb(new Error("Only PDF, DOC, and DOCX resume files are allowed."));
  },
});
const projectStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, projectDir);
  },
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    cb(null, `${crypto.randomUUID()}${extension}`);
  },
});

const projectUpload = multer({
  storage: projectStorage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = {
      ".pdf": ["application/pdf"],
      ".zip": ["application/zip", "application/x-zip-compressed"],
      ".png": ["image/png"],
      ".jpg": ["image/jpeg"],
      ".jpeg": ["image/jpeg"],
      ".doc": ["application/msword"],
      ".docx": [
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ],
    };

    const extension = path.extname(file.originalname).toLowerCase();
    const allowedTypes = allowed[extension];

    if (allowedTypes && allowedTypes.includes(file.mimetype)) {
      return cb(null, true);
    }

    cb(new Error("Unsupported project file type."));
  },
});
// -----------------------------
// HOME / API TEST
// -----------------------------

app.get('/', (req, res) => {
    res.json({ message: 'SkillBridge API is running!' });
});

// -----------------------------
// AUTHENTICATION MIDDLEWARE
// -----------------------------

function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Login required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid or expired token' });
        }

        req.user = user;
        next();
    });
}

function allowRoles(...roles) {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                message: 'You are not authorized for this action'
            });
        }
        next();
    };
}

// -----------------------------
// REGISTER USER
// -----------------------------

app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password, role, degree, cgpa } = req.body;

        if (!name?.trim() || !email?.trim() || !password) {
            return res.status(400).json({
                message: 'Name, email and password are required'
            });
        }

        // MVP supports student and faculty registration.
        if (!['student', 'faculty'].includes(role)) {
            return res.status(400).json({
                message: 'Invalid user role'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                message: 'Password must contain at least 6 characters'
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const [existing] = await db.execute(
            'SELECT id FROM users WHERE email = ?',
            [normalizedEmail]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                message: 'Email is already registered'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await db.execute(
            `INSERT INTO users
            (name, email, password, role, degree, cgpa)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [
                name.trim(),
                normalizedEmail,
                hashedPassword,
                role,
                degree || null,
                cgpa || null
            ]
        );

        res.status(201).json({
            message: 'Registration successful',
            userId: result.insertId
        });

    } catch (error) {
        console.error('Registration error:', error.message);
        res.status(500).json({ message: 'Registration failed' });
    }
});

// -----------------------------
// LOGIN USER
// -----------------------------

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: 'Email and password are required'
            });
        }

        const [users] = await db.execute(
            'SELECT * FROM users WHERE email = ?',
            [email.trim().toLowerCase()]
        );

        if (users.length === 0) {
            return res.status(401).json({
                message: 'Invalid email or password'
            });
        }

        const user = users[0];

        const validPassword = await bcrypt.compare(
            password,
            user.password
        );

        if (!validPassword) {
            return res.status(401).json({
                message: 'Invalid email or password'
            });
        }

        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role
            },
            JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                degree: user.degree,
                cgpa: user.cgpa
            }
        });

    } catch (error) {
        console.error('Login error:', error.message);
        res.status(500).json({ message: 'Login failed' });
    }
});

// -----------------------------
// FORGOT PASSWORD - SEND OTP
// -----------------------------



app.post("/api/auth/forgot-password", async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const [users] = await db.execute(
      "SELECT id, name, email FROM users WHERE email = ?",
      [email]
    );

    // Do not reveal whether an email is registered.
    if (!users.length) {
      return res.json({
        message: "If this email is registered, an OTP will be sent."
      });
    }

    const user = users[0];

    const [existing] = await db.execute(
      "SELECT last_sent_at FROM password_reset_otps WHERE user_id = ?",
      [user.id]
    );

    if (
      existing.length &&
      Date.now() - new Date(existing[0].last_sent_at).getTime() < 60 * 1000
    ) {
      return res.status(429).json({
        message: "Please wait one minute before requesting another OTP."
      });
    }

    const otp = crypto.randomInt(100000, 1000000).toString();
    const otpHash = hashValue(otp);

    await db.execute(
      `INSERT INTO password_reset_otps
       (user_id, otp_hash, expires_at, attempts, last_sent_at,
        verified_at, reset_token_hash)
       VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE), 0, NOW(), NULL, NULL)
       ON DUPLICATE KEY UPDATE
         otp_hash = VALUES(otp_hash),
         expires_at = VALUES(expires_at),
         attempts = 0,
         last_sent_at = NOW(),
         verified_at = NULL,
         reset_token_hash = NULL`,
      [user.id, otpHash]
    );

    try {
      await emailTransporter.sendMail({
        from: `"SkillBridge" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: "Your SkillBridge password reset OTP",
        text: `Hello ${user.name}, your password reset OTP is ${otp}. It expires in 10 minutes. If you did not request this, ignore this email.`,
        html: `
          <div style="font-family:Arial,sans-serif;padding:24px">
            <h2>SkillBridge Password Reset</h2>
            <p>Hello ${user.name},</p>
            <p>Use this OTP to reset your password:</p>
            <h1 style="letter-spacing:8px;color:#4f46e5">${otp}</h1>
            <p>This OTP expires in <b>10 minutes</b>.</p>
            <p>If you did not request this, please ignore this email.</p>
          </div>
        `,
      });
    } catch (mailError) {
      await db.execute(
        "DELETE FROM password_reset_otps WHERE user_id = ?",
        [user.id]
      );
      throw mailError;
    }

    res.json({
      message: "If this email is registered, an OTP will be sent."
    });

  } catch (error) {
    console.error("Send OTP error:", error);
    res.status(500).json({ message: "Unable to send OTP. Please try again." });
  }
});


// -----------------------------
// VERIFY PASSWORD RESET OTP
// -----------------------------

app.post("/api/auth/verify-reset-otp", async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const otp = req.body.otp?.trim();

    if (!email || !otp) {
      return res.status(400).json({
        message: "Email and OTP are required"
      });
    }

    const [rows] = await db.execute(
      `SELECT u.id, o.otp_hash, o.expires_at, o.attempts
       FROM users u
       JOIN password_reset_otps o ON o.user_id = u.id
       WHERE u.email = ?`,
      [email]
    );

    if (!rows.length) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    const record = rows[0];

    if (new Date(record.expires_at).getTime() < Date.now()) {
      await db.execute(
        "DELETE FROM password_reset_otps WHERE user_id = ?",
        [record.id]
      );
      return res.status(400).json({ message: "OTP has expired. Request a new one." });
    }

    if (record.attempts >= 5) {
      return res.status(429).json({
        message: "Too many incorrect attempts. Request a new OTP."
      });
    }

    if (hashValue(otp) !== record.otp_hash) {
      await db.execute(
        "UPDATE password_reset_otps SET attempts = attempts + 1 WHERE user_id = ?",
        [record.id]
      );
      return res.status(400).json({ message: "Incorrect OTP" });
    }

    const resetToken = jwt.sign(
      { id: record.id, purpose: "password_reset" },
      JWT_SECRET,
      { expiresIn: "10m" }
    );

    await db.execute(
      `UPDATE password_reset_otps
       SET verified_at = NOW(), reset_token_hash = ?
       WHERE user_id = ?`,
      [hashValue(resetToken), record.id]
    );

    res.json({
      message: "OTP verified successfully",
      resetToken
    });

  } catch (error) {
    console.error("OTP verification error:", error);
    res.status(500).json({ message: "OTP verification failed" });
  }
});


// -----------------------------
// RESET PASSWORD
// -----------------------------

app.post("/api/auth/reset-password", async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      return res.status(400).json({
        message: "Reset token and new password are required"
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "Password must contain at least 6 characters"
      });
    }

    let decoded;

    try {
      decoded = jwt.verify(resetToken, JWT_SECRET);
    } catch {
      return res.status(400).json({
        message: "Reset session expired. Please verify your OTP again."
      });
    }

    if (decoded.purpose !== "password_reset") {
      return res.status(400).json({ message: "Invalid reset token" });
    }

    const [rows] = await db.execute(
      `SELECT user_id
       FROM password_reset_otps
       WHERE user_id = ?
         AND verified_at IS NOT NULL
         AND reset_token_hash = ?
         AND expires_at > NOW()`,
      [decoded.id, hashValue(resetToken)]
    );

    if (!rows.length) {
      return res.status(400).json({
        message: "Invalid or expired password reset session"
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db.execute(
      "UPDATE users SET password = ? WHERE id = ?",
      [hashedPassword, decoded.id]
    );

    // Makes the reset token unusable after a successful password change.
    await db.execute(
      "DELETE FROM password_reset_otps WHERE user_id = ?",
      [decoded.id]
    );

    res.json({
      message: "Password reset successfully. You can now log in."
    });

  } catch (error) {
    console.error("Password reset error:", error);
    res.status(500).json({ message: "Unable to reset password" });
  }
});
// -----------------------------
// GET LOGGED-IN USER PROFILE
// -----------------------------

app.get('/api/users/me',
    authenticateToken,
    async (req, res) => {
        try {
            const [users] = await db.query(
  `SELECT
    id, name, email, role, degree, cgpa,
    bio, university, github_url,
    linkedin_url, portfolio_url
   FROM users
   WHERE id = ?`,
  [req.user.id]
);

            if (users.length === 0) {
                return res.status(404).json({
                    message: 'User not found'
                });
            }

            res.json(users[0]);

        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Failed to fetch profile' });
        }
    }
);



app.put('/api/users/me', authenticateToken, allowRoles('student'), async (req, res) => {
  try {
    const {
      name,
      degree,
      cgpa,
      bio,
      university,
      github_url,
      linkedin_url,
      portfolio_url
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: 'Name is required'
      });
    }

    if (
      cgpa !== null &&
      cgpa !== undefined &&
      cgpa !== '' &&
      (Number(cgpa) < 0 || Number(cgpa) > 10 || !Number.isFinite(Number(cgpa)))
    ) {
      return res.status(400).json({
        message: 'CGPA must be between 0 and 10'
      });
    }

    await db.query(
      `UPDATE users SET
        name = ?,
        degree = ?,
        cgpa = ?,
        bio = ?,
        university = ?,
        github_url = ?,
        linkedin_url = ?,
        portfolio_url = ?
       WHERE id = ?`,
      [
        name.trim(),
        degree || null,
        cgpa === '' || cgpa === undefined ? null : cgpa,
        bio || null,
        university || null,
        github_url || null,
        linkedin_url || null,
        portfolio_url || null,
        req.user.id
      ]
    );

    const [users] = await db.query(
      `SELECT id, name, email, role, degree, cgpa,
              bio, university, github_url,
              linkedin_url, portfolio_url
       FROM users
       WHERE id = ?`,
      [req.user.id]
    );

    res.json({
      message: 'Profile updated successfully',
      user: users[0]
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      message: 'Unable to update profile'
    });
  }
});



// -----------------------------
// UPLOAD / REPLACE STUDENT RESUME
// -----------------------------

app.get(
  '/api/users/resume/info',
  authenticateToken,
  allowRoles('student'),
  async (req, res) => {
    try {
      const [users] = await db.execute(
        `SELECT resume_original_name, resume_uploaded_at
         FROM users WHERE id = ?`,
        [req.user.id]
      );

      if (!users.length) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({
        resume: users[0].resume_original_name
          ? {
              name: users[0].resume_original_name,
              uploadedAt: users[0].resume_uploaded_at
            }
          : null
      });

    } catch (error) {
      console.error('Resume info error:', error);
      res.status(500).json({
        message: 'Unable to fetch resume information'
      });
    }
  }
);

app.post(
  '/api/users/resume',
  authenticateToken,
  allowRoles('student'),
  (req, res) => {
    resumeUpload.single('resume')(req, res, async (error) => {
      if (error) {
        return res.status(error.code === 'LIMIT_FILE_SIZE' ? 413 : 400)
          .json({ message: error.message });
      }

      if (!req.file) {
        return res.status(400).json({ message: 'Please select a resume file' });
      }

      try {
        const [users] = await db.execute(
          'SELECT resume_path FROM users WHERE id = ?',
          [req.user.id]
        );

        const oldResume = users[0]?.resume_path;

        await db.execute(
          `UPDATE users
           SET resume_path = ?,
               resume_original_name = ?,
               resume_uploaded_at = NOW()
           WHERE id = ?`,
          [req.file.filename, req.file.originalname, req.user.id]
        );

        // Delete the previous resume after successful replacement.
        if (oldResume) {
          const oldPath = path.join(resumeDir, path.basename(oldResume));

          if (fs.existsSync(oldPath)) {
            fs.unlinkSync(oldPath);
          }
        }

        res.status(200).json({
          message: 'Resume uploaded successfully',
          resume: {
            name: req.file.originalname,
            uploadedAt: new Date()
          }
        });

      } catch (error) {
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }

        console.error('Resume upload error:', error);
        res.status(500).json({ message: 'Resume upload failed' });
      }
    });
  }
);


// -----------------------------
// DOWNLOAD STUDENT RESUME
// -----------------------------

app.get(
  '/api/users/resume',
  authenticateToken,
  allowRoles('student'),
  async (req, res) => {
    try {
      const [users] = await db.execute(
        `SELECT resume_path, resume_original_name
         FROM users WHERE id = ?`,
        [req.user.id]
      );

      if (!users.length || !users[0].resume_path) {
        return res.status(404).json({ message: 'No resume uploaded yet' });
      }

      const filename = path.basename(users[0].resume_path);
      const filePath = path.join(resumeDir, filename);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: 'Resume file not found' });
      }

      res.download(
        filePath,
        users[0].resume_original_name || filename
      );

    } catch (error) {
      console.error('Resume download error:', error);
      res.status(500).json({ message: 'Unable to download resume' });
    }
  }
);



// -----------------------------
// FACULTY WORKSPACE APIs
// -----------------------------

// Get students assigned to the logged-in faculty member
app.get(
  "/api/faculty/students",
  authenticateToken,
  allowRoles("faculty"),
  async (req, res) => {
    try {
      const [students] = await db.execute(
        `SELECT
          u.id, u.name, u.email, u.degree, u.cgpa,
          u.bio, u.university, u.github_url,
          u.linkedin_url, u.portfolio_url,
          u.resume_original_name, u.resume_uploaded_at,
          a.assigned_at,
          COUNT(DISTINCT ar.id) AS total_projects
         FROM faculty_student_assignments a
         JOIN users u ON u.id = a.student_id
         LEFT JOIN artifacts ar ON ar.student_id = u.id
         WHERE a.faculty_id = ?
         GROUP BY u.id, a.assigned_at
         ORDER BY u.name`,
        [req.user.id]
      );

      res.json(students);
    } catch (error) {
      console.error("Faculty students error:", error);
      res.status(500).json({ message: "Could not load students" });
    }
  }
);

// Get students who have not yet been assigned
app.get(
  "/api/faculty/unassigned-students",
  authenticateToken,
  allowRoles("faculty"),
  async (req, res) => {
    try {
      const [students] = await db.execute(
        `SELECT id, name, email, degree, cgpa
         FROM users
         WHERE role = 'student'
         AND id NOT IN (
           SELECT student_id FROM faculty_student_assignments
         )
         ORDER BY name`
      );

      res.json(students);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Could not load unassigned students" });
    }
  }
);

// Faculty can assign an unassigned student to themselves
app.post(
  "/api/faculty/assign/:studentId",
  authenticateToken,
  allowRoles("faculty"),
  async (req, res) => {
    try {
      const studentId = Number(req.params.studentId);

      if (!Number.isInteger(studentId) || studentId <= 0) {
        return res.status(400).json({ message: "Invalid student ID" });
      }

      const [students] = await db.execute(
        "SELECT id FROM users WHERE id = ? AND role = 'student'",
        [studentId]
      );

      if (!students.length) {
        return res.status(404).json({ message: "Student not found" });
      }

      await db.execute(
        `INSERT INTO faculty_student_assignments (student_id, faculty_id)
         VALUES (?, ?)`,
        [studentId, req.user.id]
      );

      res.status(201).json({ message: "Student assigned successfully" });
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY") {
        return res.status(409).json({
          message: "This student is already assigned to a faculty member"
        });
      }

      console.error(error);
      res.status(500).json({ message: "Assignment failed" });
    }
  }
);

// Faculty downloads a resume belonging to an assigned student
app.get(
  "/api/faculty/students/:studentId/resume",
  authenticateToken,
  allowRoles("faculty"),
  async (req, res) => {
    try {
      const studentId = Number(req.params.studentId);

      const [rows] = await db.execute(
        `SELECT u.resume_path, u.resume_original_name
         FROM users u
         JOIN faculty_student_assignments a
           ON a.student_id = u.id
         WHERE u.id = ? AND a.faculty_id = ?`,
        [studentId, req.user.id]
      );

      if (!rows.length) {
        return res.status(404).json({ message: "Assigned student not found" });
      }

      if (!rows[0].resume_path) {
        return res.status(404).json({ message: "No resume uploaded" });
      }

      const safePath = path.join(
        resumeDir,
        path.basename(rows[0].resume_path)
      );

      if (!fs.existsSync(safePath)) {
        return res.status(404).json({ message: "Resume file not found" });
      }

      res.download(safePath, rows[0].resume_original_name);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Resume download failed" });
    }
  }
);


// -----------------------------
// FACULTY SKILL VERIFICATION
// -----------------------------

// Get skills of an assigned student

app.get(
  "/api/faculty/students/:studentId/skills",
  authenticateToken,
  allowRoles("faculty"),
  async (req, res) => {
    try {
      const studentId = Number(req.params.studentId);

      if (!Number.isInteger(studentId) || studentId <= 0) {
        return res.status(400).json({
          message: "Invalid student ID"
        });
      }

      // Confirm this student is assigned to this faculty member
      const [assigned] = await db.execute(
        `SELECT id
         FROM faculty_student_assignments
         WHERE student_id = ? AND faculty_id = ?`,
        [studentId, req.user.id]
      );

      if (!assigned.length) {
        return res.status(403).json({
          message: "This student is not assigned to you"
        });
      }

      // Fetch the selected student's skills
      const [skills] = await db.execute(
        `SELECT
          s.id AS skill_id,
          s.skill_name,
          s.status,
          s.verified_at,
          a.id AS project_id,
          a.title AS project_title
         FROM skills s
         LEFT JOIN artifacts a
           ON a.id = s.artifact_id
         WHERE s.user_id = ?
         ORDER BY s.id DESC`,
        [studentId]
      );

      res.json(skills);

    } catch (error) {
      console.error("Fetch student skills error:", error);
      res.status(500).json({
        message: "Could not fetch student skills"
      });
    }
  }
);



// Approve or reject an individual skill
app.put(
  "/api/skills/:skillId/status",
  authenticateToken,
  allowRoles("faculty"),
  async (req, res) => {
    try {
      const skillId = Number(req.params.skillId);
      const { status } = req.body;

      if (
        !Number.isInteger(skillId) ||
        skillId <= 0 ||
        !["verified", "rejected"].includes(status)
      ) {
        return res.status(400).json({
          message: "Invalid skill ID or status"
        });
      }

      // Confirm this skill belongs to an assigned student
      const [assignedSkill] = await db.execute(
        `SELECT s.id
         FROM skills s
         JOIN faculty_student_assignments fsa
           ON fsa.student_id = s.user_id
         WHERE s.id = ? AND fsa.faculty_id = ?`,
        [skillId, req.user.id]
      );

      if (!assignedSkill.length) {
        return res.status(403).json({
          message: "This skill does not belong to your assigned students"
        });
      }

      const [result] = await db.execute(
        `UPDATE skills
         SET status = ?, verified_by = ?, verified_at = NOW()
         WHERE id = ? AND status = 'pending'`,
        [status, req.user.id, skillId]
      );

      if (result.affectedRows === 0) {
        return res.status(409).json({
          message: "This skill has already been reviewed"
        });
      }

      res.json({
        message: `Skill ${status} successfully`
      });

    } catch (error) {
      console.error("Skill verification error:", error);
      res.status(500).json({
        message: "Skill verification failed"
      });
    }
  }
);



app.get(
  "/api/users/skills",
  authenticateToken,
  allowRoles("student"),
  async (req, res) => {
    try {
      const [skills] = await db.execute(
        `SELECT
          s.id AS skill_id,
          s.skill_name,
          s.status,
          s.verified_at,
          a.id AS project_id,
          a.title AS project_title
        FROM skills s
        LEFT JOIN artifacts a
          ON a.id = s.artifact_id
        WHERE s.user_id = ?
        ORDER BY s.id DESC`,
        [req.user.id]
      );

      res.json(skills);

    } catch (error) {
      console.error("Get student skills error:", error);

      res.status(500).json({
        message: "Failed to fetch skills"
      });
    }
  }
);



app.post(
  "/api/users/skills",
  authenticateToken,
  allowRoles("student"),
  async (req, res) => {
    try {
      const skillName = req.body.skill_name?.trim();

      if (!skillName) {
        return res.status(400).json({
          message: "Skill name is required"
        });
      }

      if (skillName.length > 100) {
        return res.status(400).json({
          message: "Skill name cannot exceed 100 characters"
        });
      }

      const [existing] = await db.execute(
        `SELECT id FROM skills
         WHERE user_id = ? AND LOWER(skill_name) = LOWER(?)`,
        [req.user.id, skillName]
      );

      if (existing.length) {
        return res.status(409).json({
          message: "You have already added this skill"
        });
      }

      const [result] = await db.execute(
        `INSERT INTO skills (user_id, artifact_id, skill_name, status)
         VALUES (?, NULL, ?, 'pending')`,
        [req.user.id, skillName]
      );

      res.status(201).json({
        message: "Skill added successfully",
        skill_id: result.insertId
      });
    } catch (error) {
      console.error("Add skill error:", error);
      res.status(500).json({ message: "Failed to add skill" });
    }
  }
);


// -----------------------------
// GET ARTIFACTS
// -----------------------------

app.get('/api/artifacts',
    authenticateToken,
    async (req, res) => {
        try {
            const { student_id, status } = req.query;

            let sql = `
                SELECT a.*, u.name AS student_name,
                       u.email AS student_email
                FROM artifacts a
                JOIN users u ON a.student_id = u.id
                WHERE 1=1
            `;

            const params = [];

            // Students can only see their own submissions.
            if (req.user.role === "student") {
    sql += " AND a.student_id = ?";
    params.push(req.user.id);

} else if (req.user.role === "faculty") {
    sql += ` AND EXISTS (
        SELECT 1 FROM faculty_student_assignments fsa
        WHERE fsa.student_id = a.student_id
        AND fsa.faculty_id = ?
    )`;
    params.push(req.user.id);

    if (student_id) {
        sql += " AND a.student_id = ?";
        params.push(student_id);
    }
}

            if (status) {
                sql += ' AND a.status = ?';
                params.push(status);
            }

            sql += ' ORDER BY a.created_at DESC';

            const [artifacts] = await db.execute(sql, params);

            for (const artifact of artifacts) {
                const [skills] = await db.execute(
                    'SELECT * FROM skills WHERE artifact_id = ?',
                    [artifact.id]
                );

                artifact.skills = skills;
            }

            res.json(artifacts);

        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Failed to fetch artifacts' });
        }
    }
);

// -----------------------------
// STUDENT SUBMITS ARTIFACT
// -----------------------------

app.post('/api/artifacts',
    authenticateToken,
    allowRoles('student'),
    async (req, res) => {
        const connection = await db.getConnection();

        try {
            const { title, description, project_link, skills } = req.body;

            if (!title?.trim() || !Array.isArray(skills) ||
                skills.length === 0 ||
                skills.some(skill => typeof skill !== 'string' || !skill.trim())) {
                return res.status(400).json({
                    message: 'Title and at least one valid skill are required'
                });
            }

            await connection.beginTransaction();

            const [result] = await connection.execute(
                `INSERT INTO artifacts
                (student_id, title, description, project_link)
                VALUES (?, ?, ?, ?)`,
                [
                    req.user.id,
                    title.trim(),
                    description || '',
                    project_link || null
                ]
            );

            const artifactId = result.insertId;

            for (const skill of [...new Set(skills.map(s => s.trim()))]) {
                await connection.execute(
                    `INSERT INTO skills
                    (user_id, artifact_id, skill_name)
                    VALUES (?, ?, ?)`,
                    [req.user.id, artifactId, skill]
                );
            }

            await connection.commit();

            res.status(201).json({
                message: 'Project submitted successfully',
                artifactId
            });

        } catch (error) {
            await connection.rollback();
            console.error(error);
            res.status(500).json({ message: 'Project submission failed' });

        } finally {
            connection.release();
        }
    }
);


// -----------------------------
// SUBMIT PROJECT WITH FILE ATTACHMENT
// -----------------------------

app.post(
  '/api/artifacts/upload',
  authenticateToken,
  allowRoles('student'),
  (req, res) => {
    projectUpload.single('projectFile')(req, res, async (error) => {

      if (error) {
        return res.status(
          error.code === 'LIMIT_FILE_SIZE' ? 413 : 400
        ).json({ message: error.message });
      }

      let connection;

      try {
        const { title, description, project_link } = req.body;

        let skills;

        try {
          skills = JSON.parse(req.body.skills || '[]');
        } catch {
          return res.status(400).json({
            message: 'Invalid skills format'
          });
        }

        if (
          !title?.trim() ||
          !Array.isArray(skills) ||
          skills.length === 0 ||
          skills.some(skill =>
            typeof skill !== 'string' || !skill.trim()
          )
        ) {
          return res.status(400).json({
            message: 'Title and at least one valid skill are required'
          });
        }

        connection = await db.getConnection();
        await connection.beginTransaction();

        const [result] = await connection.execute(
          `INSERT INTO artifacts
           (student_id, title, description, project_link,
            file_path, original_file_name)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            req.user.id,
            title.trim(),
            description || '',
            project_link || null,
            req.file ? req.file.filename : null,
            req.file ? req.file.originalname : null
          ]
        );

        const artifactId = result.insertId;

        const uniqueSkills = [
          ...new Set(skills.map(skill => skill.trim()))
        ];

        for (const skill of uniqueSkills) {
          await connection.execute(
            `INSERT INTO skills
             (user_id, artifact_id, skill_name)
             VALUES (?, ?, ?)`,
            [req.user.id, artifactId, skill]
          );
        }

        await connection.commit();

        res.status(201).json({
          message: 'Project submitted successfully',
          artifactId
        });

      } catch (error) {

        if (connection) {
          await connection.rollback();
        }

        // Remove uploaded file if database submission fails.
        if (req.file && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }

        console.error('Project upload error:', error);

        res.status(500).json({
          message: 'Project submission failed'
        });

      } finally {
        if (connection) {
          connection.release();
        }
      }
    });
  }
);


// -----------------------------
// SECURE PROJECT FILE DOWNLOAD
// -----------------------------

app.get(
  '/api/artifacts/:id/file',
  authenticateToken,
  async (req, res) => {
    try {
      const artifactId = Number(req.params.id);

      if (!Number.isInteger(artifactId) || artifactId <= 0) {
        return res.status(400).json({
          message: 'Invalid project ID'
        });
      }

      const [artifacts] = await db.execute(
        'SELECT student_id, file_path, original_file_name FROM artifacts WHERE id = ?',
        [artifactId]
      );

      if (!artifacts.length || !artifacts[0].file_path) {
        return res.status(404).json({
          message: 'Project attachment not found'
        });
      }

      const artifact = artifacts[0];
      // Faculty can access files only from their assigned students
if (req.user.role === 'faculty') {
    const [assigned] = await db.execute(
        `SELECT id
         FROM faculty_student_assignments
         WHERE student_id = ? AND faculty_id = ?`,
        [artifact.student_id, req.user.id]
    );

    if (!assigned.length) {
        return res.status(403).json({
            message: 'You are not authorized to access this project file'
        });
    }
}

      // Students can only download their own project files.
      // Faculty can download submitted project files.
      if (
        req.user.role === 'student' &&
        artifact.student_id !== req.user.id
      ) {
        return res.status(403).json({
          message: 'You are not authorized to access this file'
        });
      }

      if (!['student', 'faculty'].includes(req.user.role)) {
        return res.status(403).json({
          message: 'Access denied'
        });
      }

      const filename = path.basename(artifact.file_path);
      const filePath = path.join(projectDir, filename);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          message: 'File not found on server'
        });
      }

      res.download(
        filePath,
        artifact.original_file_name || filename
      );

    } catch (error) {
      console.error('Project download error:', error);

      res.status(500).json({
        message: 'Unable to download project file'
      });
    }
  }
);


// -----------------------------
// FACULTY APPROVES / REJECTS
// -----------------------------

app.put('/api/artifacts/:id/status',
    authenticateToken,
    allowRoles('faculty'),
    async (req, res) => {
        const connection = await db.getConnection();

        try {
            const { status } = req.body;
            const artifactId = Number(req.params.id);

            if (!Number.isInteger(artifactId) || artifactId <= 0 ||
                !['verified', 'rejected'].includes(status)) {
                return res.status(400).json({
                    message: 'Invalid artifact ID or status'
                });
            }
            // Check whether this project belongs to the logged-in faculty member
const [assignedProject] = await connection.execute(
    `SELECT a.id
     FROM artifacts a
     JOIN faculty_student_assignments fsa
       ON fsa.student_id = a.student_id
     WHERE a.id = ? AND fsa.faculty_id = ?`,
    [artifactId, req.user.id]
);

if (!assignedProject.length) {
    return res.status(403).json({
        message: "This project does not belong to your assigned students"
    });
}

            await connection.beginTransaction();

            const [result] = await connection.execute(
                `UPDATE artifacts
                 SET status = ?
                 WHERE id = ? AND status = 'pending'`,
                [status, artifactId]
            );

            if (result.affectedRows === 0) {
                await connection.rollback();
                return res.status(404).json({
                    message: 'Pending artifact not found'
                });
            }

            await connection.execute(
                `UPDATE skills
                 SET status = ?, verified_by = ?, verified_at = NOW()
                 WHERE artifact_id = ?`,
                [status, req.user.id, artifactId]
            );

            await connection.commit();

            res.json({
                message: `Project ${status} successfully`
            });

        } catch (error) {
            await connection.rollback();
            console.error(error);
            res.status(500).json({ message: 'Verification failed' });

        } finally {
            connection.release();
        }
    }
);

// -----------------------------
// START SERVER
// -----------------------------

async function startServer() {
    try {
        if (!JWT_SECRET) {
            throw new Error('JWT_SECRET is missing from .env');
        }

        await db.query('SELECT 1');

        console.log('MySQL connected successfully!');

        app.listen(PORT, () => {
            console.log(`SkillBridge API running at http://localhost:${PORT}`);
        });

    } catch (error) {
        console.error('Server startup failed:', error.message);
        process.exit(1);
    }
}

startServer();
