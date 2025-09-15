/*
 SmartMeet UNZA Backend (Admin-first)
 - Serves the front-end statically
 - Provides Admin API endpoints for room bookings
 - Provides a Google Meet-style link generator
 - Provides simple authentication and user management endpoints

 How to run (after creating package.json with express, cors):
   1) npm init -y
   2) npm i express cors
   3) node server.js
 The server will start at http://localhost:3000 and serve the smartmeet-unza front-end.
*/

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;
const { randomUUID } = require('crypto');
const bcrypt = require('bcrypt');

// Bcrypt configuration
const SALT_ROUNDS = 10;

const app = express();
const PORT = process.env.PORT || 3000;

// Paths
const ROOT_DIR = path.resolve(__dirname, '..');
const FRONTEND_DIR = path.join(ROOT_DIR, 'smartmeet-unza');
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '1mb' }));

// In-memory sessions map (token -> userId)
const SESSIONS = new Map();

/**
 * Secure password hashing with bcrypt
 */
async function hashPassword(password) {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify password against hash
 */
async function verifyPassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

// Simple JSON file storage
async function readDB() {
  try {
    const txt = await fs.readFile(DB_FILE, 'utf8');
    const obj = JSON.parse(txt);
    
    // Initialize required arrays if they don't exist
    const defaults = {
      users: [],
      meetings: [],
      venues: [],
      bookings: [],
      notifications: [],
      documents: [],
      departments: [],
      settings: {
        bookingWindow: 30, // days in advance
        maxMeetingDuration: 240, // minutes
        minMeetingNotice: 30, // minutes
        workingHours: {
          start: '08:00',
          end: '17:00',
          days: [1, 2, 3, 4, 5] // Monday to Friday
        },
        emailNotifications: true,
        smsNotifications: false,
        maintenanceMode: false
      },
      _migrated: obj?._migrated || false
    };

    // Migrate existing users to use bcrypt if not already migrated
    if (!obj._migrated && obj.users) {
      console.log('Migrating users to use bcrypt...');
      for (const user of obj.users) {
        if (user.passwordHash && !user.passwordHash.startsWith('$2b$')) {
          user.passwordHash = await hashPassword(user.passwordHash);
        }
      }
      obj._migrated = true;
      await writeDB(obj);
    }

    return { ...defaults, ...obj };
  } catch (e) {
    console.error('Error reading DB:', e);
    return { 
      users: [], 
      meetings: [], 
      venues: [], 
      bookings: [], 
      notifications: [], 
      documents: [],
      departments: [],
      settings: {
        bookingWindow: 30, // days in advance
        maxMeetingDuration: 240, // minutes
        minMeetingNotice: 30, // minutes
        workingHours: {
          start: '08:00',
          end: '17:00',
          days: [1, 2, 3, 4, 5] // Monday to Friday
        },
        emailNotifications: true,
        smsNotifications: false,
        maintenanceMode: false
      },
      _migrated: true
    };
  }
}

// Write database to file
async function writeDB(data) {
  try {
    // Create a clean copy of the data without methods
    const dataToSave = {
      users: data.users || [],
      meetings: data.meetings || [],
      venues: data.venues || [],
      bookings: data.bookings || [],
      notifications: data.notifications || [],
      documents: data.documents || [],
      departments: data.departments || [],
      settings: data.settings || {
        bookingWindow: 30, // days in advance
        maxMeetingDuration: 240, // minutes
        minMeetingNotice: 30, // minutes
        workingHours: {
          start: '08:00',
          end: '17:00',
          days: [1, 2, 3, 4, 5] // Monday to Friday
        },
        emailNotifications: true,
        smsNotifications: false,
        maintenanceMode: false
      }
    };
    
    await fs.mkdir(path.dirname(DB_FILE), { recursive: true });
    await fs.writeFile(DB_FILE, JSON.stringify(dataToSave, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing to database:', error);
    return false;
  }
}

// Helpers
function timeToMinutes(t) { const [h, m] = String(t||'0:0').split(':').map(Number); return (h||0)*60 + (m||0); }
function overlap(aStart, aEnd, bStart, bEnd) { const as = timeToMinutes(aStart), ae = timeToMinutes(aEnd), bs = timeToMinutes(bStart), be = timeToMinutes(bEnd); return as < be && bs < ae; }
function looksLikeEmail(s){ return /@/.test(String(s||'')); }
function sha256Hex(s){ return crypto.createHash('sha256').update(String(s||'')).digest('hex'); }

function generateMeetCode() {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz';
  const seg = len => Array.from({ length: len }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
  return `${seg(3)}-${seg(4)}-${seg(3)}`;
}
function generateMeetLink() { return `https://meet.google.com/${generateMeetCode()}`; }

function publicUser(u){ if(!u) return null; const { passwordHash, ...rest } = u; return rest; }
function ensureArray(a){ return Array.isArray(a) ? a : []; }
function addNotification(db, payload){
  db.notifications = ensureArray(db.notifications);
  const item = { id: randomUUID(), userEmail: payload.userEmail || null, title: payload.title||'', message: payload.message||'', type: payload.type||'system', createdAt: new Date().toISOString(), readBy: [] };
  db.notifications.unshift(item);
  return item;
}

/**
 * Authentication middleware
 * Verifies the JWT token and attaches user data to the request
 */
async function authMiddleware(req, res, next) {
  try {
    const token = req.headers.authorization?.split(' ')[1] || req.cookies?.token;
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!SESSIONS.has(token)) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const userId = SESSIONS.get(token);
    const db = await readDB();
    const user = db.users?.find(u => u.id === userId);

    if (!user || !user.active) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    // Attach user data to the request
    req.user = user;
    req.userId = user.id;
    req.userEmail = user.email;
    req.userRole = user.role;

    // Update last active time
    user.lastActiveAt = new Date().toISOString();
    await writeDB(db);

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
}

// Optional auth middleware for public routes
async function authOptional(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1] || req.cookies?.token;
  if (token && SESSIONS.has(token)) {
    const userId = SESSIONS.get(token);
    req.userId = userId;
    // Read fresh user data from DB
    readDB().then(db => {
      const user = db.users?.find(u => u.id === userId);
      if (user) {
        req.userEmail = user.email;
        req.userRole = user.role;
      }
      next();
    }).catch(err => {
      console.error('Error reading user data:', err);
      next();
    });
  } else {
    next();
  }
}
app.use(authOptional);

// API: Google Meet link generator
app.get('/api/meet/generate', (req, res) => {
  // Note: Real Google Meet creation requires Google API and credentials; this returns a valid-looking link.
  res.json({ link: generateMeetLink() });
});

// API: Authentication
// Register first admin (if no admin exists yet)
app.post('/api/auth/register-admin', async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    if (!name || !looksLikeEmail(email) || !password) return res.status(400).json({ error: 'name, email, password required' });
    if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    
    const db = await readDB();
    const hasAdmin = (db.users||[]).some(u => (u.role === 'admin'));
    if (hasAdmin) return res.status(409).json({ error: 'Admin already exists' });
    
    // Check if email already exists
    const emailExists = (db.users||[]).some(u => u.email === String(email).toLowerCase());
    if (emailExists) return res.status(409).json({ error: 'Email already registered' });
    
    const now = new Date().toISOString();
    const passwordHash = await hashPassword(password);
    const user = { 
      id: randomUUID(), 
      name, 
      email: String(email).toLowerCase(), 
      role: 'admin', 
      phone: '', 
      active: true, 
      passwordHash, 
      firstLogin: true,
      createdAt: now, 
      updatedAt: now 
    };
    db.users.push(user);
    await writeDB(db);
    const token = randomUUID();
    SESSIONS.set(token, user.id);
    res.status(201).json({ token, user: publicUser(user) });
  } catch(e){ res.status(500).json({ error:'Failed to register admin' }); }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!looksLikeEmail(email) || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const db = await readDB();
    const user = (db.users || []).find(u => u.email === String(email).toLowerCase());
    
    // Prevent user enumeration by not revealing if email exists
    if (!user || !user.active) {
      // Simulate password verification to prevent timing attacks
      await bcrypt.compare('dummy-password', '$2b$10$dummyhash');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate session token
    const token = randomUUID();
    SESSIONS.set(token, user.id);

    // Handle first login
    if (user.firstLogin) {
      addNotification(db, { 
        userEmail: user.email, 
        type: 'account', 
        title: 'Welcome to SmartMeet', 
        message: 'Please change your password on first login.'
      });
      user.firstLogin = false;
      user.updatedAt = new Date().toISOString();
      await writeDB(db);
    }

    // Set secure, HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    res.json({ 
      token, 
      user: publicUser(user), 
      message: `Welcome back, ${user.name || user.email}` 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to process login' });
  }
});

// API: Admin - Users
app.get('/api/admin/users', async (req, res) => {
  const db = await readDB();
  res.json((db.users||[]).map(publicUser));
});

app.post('/api/admin/users', async (req, res) => {
  try {
    const { name, email, role = 'user', phone = '', password } = req.body || {};
    
    // Input validation
    if (!name || !looksLikeEmail(email)) {
      return res.status(400).json({ error: 'Name and valid email are required' });
    }

    // Password requirements
    if (password && (password.length < 8 || !/[A-Z]/.test(password) || ![0-9]/test(password))) {
      return res.status(400).json({ 
        error: 'Password must be at least 8 characters long and include at least one uppercase letter and one number' 
      });
    }

    const db = await readDB();
    
    // Check for existing user
    if ((db.users || []).some(u => u.email === String(email).toLowerCase())) {
      return res.status(409).json({ error: 'Email already exists' });
    }

    // Hash the password
    const passwordHash = await hashPassword(password || generateSecurePassword());
    const now = new Date().toISOString();
    
    const user = { 
      id: randomUUID(), 
      name: name.trim(), 
      email: String(email).toLowerCase().trim(), 
      role, 
      phone: phone.trim(), 
      active: true, 
      passwordHash, 
      createdAt: now, 
      updatedAt: now, 
      createdByEmail: req.userEmail || null, 
      firstLogin: true 
    };

    // Generate a secure random password
    function generateSecurePassword() {
      const length = 12;
      const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()';
      let password = '';
      const values = new Uint32Array(length);
      crypto.getRandomValues(values);
      for (let i = 0; i < length; i++) {
        password += charset[values[i] % charset.length];
      }
      return password;
    }
    db.users.push(user);
    // Notify user
    addNotification(db, { userEmail: user.email, type: 'account', title: 'Account created', message: 'Your account has been created by Admin. Default password: 123456789' });
    await writeDB(db);
    res.status(201).json(publicUser(user));
  } catch(e){ res.status(500).json({ error:'Failed to create user' }); }
});

app.patch('/api/admin/users/:id', async (req, res) => {
  try {
    const { id } = req.params; const payload = req.body || {};
    const db = await readDB();
    const idx = (db.users||[]).findIndex(u => String(u.id) === String(id));
    if (idx === -1) return res.status(404).json({ error:'Not found' });
    const current = db.users[idx];
    const updates = { ...current };
    if (payload.name) updates.name = payload.name;
    if (payload.email && looksLikeEmail(payload.email)) updates.email = String(payload.email).toLowerCase();
    if (payload.role) updates.role = payload.role;
    if (payload.phone !== undefined) updates.phone = payload.phone;
    if (payload.active !== undefined) updates.active = !!payload.active;
    if (payload.password) updates.passwordHash = sha256Hex(payload.password);
    updates.updatedAt = new Date().toISOString();
    // unique email check
    if (updates.email !== current.email && (db.users||[]).some(u => u.email === updates.email)) return res.status(409).json({ error:'Email already exists' });
    db.users[idx] = updates;
    await writeDB(db);
    res.json(publicUser(updates));
  } catch(e){ res.status(500).json({ error:'Failed to update user' }); }
});

app.delete('/api/admin/users/:id', async (req, res) => {
  try {
    const { id } = req.params; const db = await readDB();
    const idx = (db.users||[]).findIndex(u => String(u.id) === String(id));
    if (idx === -1) return res.status(404).json({ error:'Not found' });
    db.users.splice(idx, 1);
    await writeDB(db);
    res.json({ ok:true });
  } catch(e){ res.status(500).json({ error:'Failed to delete user' }); }
});

// API: Admin - Venues CRUD
app.get('/api/admin/venues', async (req, res) => {
  const db = await readDB();
  res.json(db.venues || []);
});
app.post('/api/admin/venues', async (req, res) => {
  try {
    const { name, capacity=0, location='' } = req.body || {};
    if (!name) return res.status(400).json({ error: 'name required' });
    const db = await readDB();
    const venue = { id: randomUUID(), name: String(name).trim(), capacity: Number(capacity)||0, location: String(location||'').trim(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    db.venues = db.venues || [];
    db.venues.push(venue);
    // Broadcast notification
    addNotification(db, { userEmail: null, type: 'venue', title: 'New venue added', message: `Venue '${venue.name}' is now available for booking.` });
    await writeDB(db);
    res.status(201).json(venue);
  } catch(e){ res.status(500).json({ error: 'Failed to add venue' }); }
});
app.patch('/api/admin/venues/:id', async (req, res) => {
  try {
    const { id } = req.params; const payload = req.body || {};
    const db = await readDB();
    const idx = (db.venues||[]).findIndex(v => String(v.id) === String(id));
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    const current = db.venues[idx];
    const next = { ...current, ...payload, updatedAt: new Date().toISOString() };
    db.venues[idx] = next; await writeDB(db); res.json(next);
  } catch(e){ res.status(500).json({ error:'Failed to update venue' }); }
});
app.delete('/api/admin/venues/:id', async (req, res) => {
  try {
    const db = await readDB(); const { id } = req.params;
    const idx = (db.venues||[]).findIndex(v => String(v.id) === String(id)); if (idx===-1) return res.status(404).json({ error:'Not found' });
    db.venues.splice(idx,1); await writeDB(db); res.json({ ok:true });
  } catch(e){ res.status(500).json({ error:'Failed to delete venue' }); }
});

// API: User - Venues list (with optional simple availability mark)
app.get('/api/venues', async (req, res) => {
  try {
    const db = await readDB();
    const venues = db.venues || [];
    const date = String(req.query.date || '');
    let out = venues.map(v => ({ ...v, status: 'Available' }));
    if (date) {
      const dayBookings = (db.bookings||[]).filter(b => b.date === date);
      out = out.map(v => {
        const booked = dayBookings.some(b => b.venue === v.name && b.status !== 'rejected' && b.status !== 'cancelled');
        return { ...v, status: booked ? 'Booked' : 'Available' };
      });
    }
    res.json(out);
  } catch(e){ res.status(500).json({ error:'Failed to load venues' }); }
});

// API: Admin - Room Bookings (compatible with admin/js/room-booking.js)
// GET all bookings
app.get('/api/admin/venues/bookings', async (req, res) => {
  const db = await readDB();
  res.json(db.bookings || []);
});

// POST create booking
app.post('/api/admin/venues/bookings', async (req, res) => {
  try {
    const { title, venue, date, startTime, endTime, description, type, link, bookedBy, role } = req.body || {};
    if (!title || !venue || !date || !startTime || !endTime) {
      return res.status(400).json({ error: 'Missing required fields: title, venue, date, startTime, endTime' });
    }

    const db = await readDB();
    const sameDayVenue = (db.bookings || []).filter(b => (b.venue === venue) && (b.date === date));
    const hasConflict = sameDayVenue.some(b => overlap(startTime, endTime, b.startTime, b.endTime));
    if (hasConflict) {
      return res.status(409).json({ error: 'Time conflict for this venue and date' });
    }

    // Auto-approve if role indicates admin, else pending
    const st = (String(role||'').toLowerCase() === 'admin') ? 'approved' : 'pending';
    let meetLink = link;
    if (!meetLink && String(type||'').toLowerCase() === 'virtual') {
      meetLink = generateMeetLink();
    }

    const item = {
      id: randomUUID(),
      title,
      venue, // CL1/CL2/CL3
      date,  // YYYY-MM-DD
      startTime,
      endTime,
      description: description || '',
      status: st, // approved | pending | rejected | cancelled
      type: (type || 'physical'),
      link: meetLink || null,
      bookedBy: bookedBy || req.get('x-user-email') || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.bookings = db.bookings || [];
    db.bookings.push(item);
    await writeDB(db);
    res.status(201).json(item);
  } catch (e) {
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

// PATCH update booking (fields or status)
app.patch('/api/admin/venues/bookings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const payload = req.body || {};
    const db = await readDB();
    const idx = (db.bookings || []).findIndex(b => String(b.id) === String(id));
    if (idx === -1) return res.status(404).json({ error: 'Not found' });

    // If times or venue/date change, check conflicts
    const b = db.bookings[idx];
    const newVenue = payload.venue ?? b.venue;
    const newDate = payload.date ?? b.date;
    const newStart = payload.startTime ?? b.startTime;
    const newEnd = payload.endTime ?? b.endTime;

    const conflict = (db.bookings || [])
      .filter(x => String(x.id) !== String(id) && x.venue === newVenue && x.date === newDate)
      .some(x => overlap(newStart, newEnd, x.startTime, x.endTime));
    if (conflict) return res.status(409).json({ error: 'Time conflict for this venue and date' });

    const prevStatus = b.status;
    const next = { ...b, ...payload, updatedAt: new Date().toISOString() };
    db.bookings[idx] = next;

    // Notifications on status change
    if (payload.status && payload.status !== prevStatus && next.bookedBy) {
      const msgType = payload.status === 'approved' ? 'Meeting approved' : (payload.status === 'rejected' ? 'Meeting rejected' : 'Meeting update');
      const msgBody = payload.status === 'approved'
        ? `Your meeting '${next.title}' has been approved at ${next.venue} on ${next.date}.`
        : (payload.status === 'rejected' ? `Your meeting '${next.title}' was rejected. Please choose another venue/time.` : `Your meeting '${next.title}' was updated.`);
      addNotification(db, { userEmail: next.bookedBy, type: 'meeting', title: msgType, message: msgBody });
    }

    await writeDB(db);
    res.json(next);
  } catch (e) {
    res.status(500).json({ error: 'Failed to update booking' });
  }
});

// DELETE booking
app.delete('/api/admin/venues/bookings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = await readDB();
    const idx = (db.bookings || []).findIndex(b => String(b.id) === String(id));
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    db.bookings.splice(idx, 1);
    await writeDB(db);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete booking' });
  }
});

// API: User - Profile (lightweight)
app.get('/api/me', async (req, res) => {
  try {
    const db = await readDB();
    let user = null;
    if (req.userId) {
      user = (db.users || []).find(u => String(u.id) === String(req.userId));
    }
    if (!user && req.userEmail) {
      user = (db.users || []).find(u => String(u.email).toLowerCase() === String(req.userEmail).toLowerCase());
    }
    if (!user) return res.status(401).json({ error: 'Not authenticated' });
    res.json(publicUser(user));
  } catch (e) {
    res.status(500).json({ error: 'Failed to load profile' });
  }
});

// API: User - Get user's meetings
app.get('/api/user/meetings', authMiddleware, async (req, res) => {
  try {
    const db = await readDB();
    const userId = req.userId;
    
    // Get all meetings for the current user
    const userMeetings = (db.bookings || [])
      .filter(b => b.userId === userId)
      .map(meeting => ({
        id: meeting.id,
        title: meeting.title,
        venue: meeting.venue,
        date: meeting.date,
        startTime: meeting.startTime,
        endTime: meeting.endTime,
        status: meeting.status || 'pending',
        reason: meeting.rejectionReason,
        meetLink: meeting.meetLink
      }));
    
    res.json(userMeetings);
  } catch (e) {
    console.error('Error getting user meetings:', e);
    res.status(500).json({ error: 'Failed to get user meetings' });
  }
});

// API: Get available venues
app.get('/api/venues/available', authOptional, async (req, res) => {
  try {
    const db = await readDB();
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().substring(0, 5);
    
    // Get all active bookings for today and future dates
    const activeBookings = (db.bookings || []).filter(booking => {
      return booking.status === 'approved' && 
             (booking.date > currentDate || 
              (booking.date === currentDate && booking.endTime > currentTime));
    });
    
    // Get all venues
    const allVenues = db.venues || [];
    
    // Mark venues as booked if they have active bookings
    const venuesWithStatus = allVenues.map(venue => {
      const isBooked = activeBookings.some(booking => booking.venueId === venue.id);
      return {
        ...venue,
        status: isBooked ? 'booked' : 'available'
      };
    });
    
    res.json(venuesWithStatus);
  } catch (e) {
    console.error('Error getting available venues:', e);
    res.status(500).json({ error: 'Failed to get available venues' });
  }
});

// API: Get all venues
app.get('/api/venues', authOptional, async (req, res) => {
  try {
    const db = await readDB();
    res.json(db.venues || []);
  } catch (e) {
    console.error('Error getting venues:', e);
    res.status(500).json({ error: 'Failed to get venues' });
  }
});

// API: Submit meeting request
app.post('/api/meetings/request', authMiddleware, async (req, res) => {
  try {
    const { title, date, startTime, endTime, venueId, description } = req.body;
    const userId = req.userId;
    
    if (!title || !date || !startTime || !endTime || !venueId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const db = await readDB();
    
    // Check if venue exists
    const venue = (db.venues || []).find(v => v.id === venueId);
    if (!venue) {
      return res.status(404).json({ error: 'Venue not found' });
    }
    
    // Check for time conflicts
    const hasConflict = (db.bookings || []).some(booking => {
      return booking.venueId === venueId && 
             booking.date === date && 
             booking.status === 'approved' &&
             !(endTime <= booking.startTime || startTime >= booking.endTime);
    });
    
    if (hasConflict) {
      return res.status(409).json({ error: 'Selected time slot is not available' });
    }
    
    // Create new meeting
    const newMeeting = {
      id: randomUUID(),
      title: title.trim(),
      date: date.trim(),
      startTime: startTime.trim(),
      endTime: endTime.trim(),
      venueId,
      venue: venue.name,
      venueLocation: venue.location,
      venueCapacity: venue.capacity,
      userId,
      userEmail: req.userEmail,
      description: description?.trim() || '',
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Add to bookings
    db.bookings = [...(db.bookings || []), newMeeting];
    
    // Add notification for all admins
    const adminUsers = (db.users || []).filter(u => u.role === 'admin' && u.active);
    adminUsers.forEach(admin => {
      addNotification(db, {
        userEmail: admin.email,
        type: 'meeting_request',
        title: 'New Meeting Request',
        message: `New meeting request from ${req.user?.name || req.userEmail}: ${title}`,
        meetingId: newMeeting.id
      });
    });
    
    await writeDB(db);
    
    res.status(201).json({
      message: 'Meeting request submitted successfully',
      meeting: newMeeting
    });
    
  } catch (e) {
    console.error('Error creating meeting request:', e);
    res.status(500).json({ error: 'Failed to create meeting request' });
  }
});

// API: Cancel meeting
app.post('/api/meetings/:id/cancel', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.userId;
    
    const db = await readDB();
    const meetingIndex = (db.bookings || []).findIndex(m => m.id === id && m.userId === userId);
    
    if (meetingIndex === -1) {
      return res.status(404).json({ error: 'Meeting not found or unauthorized' });
    }
    
    // Update meeting status
    db.bookings[meetingIndex] = {
      ...db.bookings[meetingIndex],
      status: 'cancelled',
      cancellationReason: reason,
      updatedAt: new Date().toISOString()
    };
    
    // Add notification for admin
    const adminUsers = (db.users || []).filter(u => u.role === 'admin' && u.active);
    adminUsers.forEach(admin => {
      addNotification(db, {
        userEmail: admin.email,
        type: 'meeting_cancelled',
        title: 'Meeting Cancelled',
        message: `Meeting "${db.bookings[meetingIndex].title}" has been cancelled by the user.`,
        meetingId: id
      });
    });
    
    await writeDB(db);
    
    res.json({ message: 'Meeting cancelled successfully' });
    
  } catch (e) {
    console.error('Error cancelling meeting:', e);
    res.status(500).json({ error: 'Failed to cancel meeting' });
  }
});

// API: Get unread notifications count
app.get('/api/notifications/unread/count', authMiddleware, async (req, res) => {
  try {
    const db = await readDB();
    const userEmail = req.userEmail;
    
    const unreadCount = (db.notifications || []).filter(n => 
      n.userEmail === userEmail && !n.readBy?.includes(userEmail)
    ).length;
    
    res.json({ count: unreadCount });
  } catch (e) {
    console.error('Error getting unread notifications count:', e);
    res.status(500).json({ error: 'Failed to get unread notifications count' });
  }
});

// API: User - Dashboard
app.get('/api/user/dashboard', authMiddleware, async (req, res) => {
  try {
    const db = await readDB();
    const userId = req.userId;
    const today = new Date().toISOString().split('T')[0];
    
    // Get user's upcoming meetings (approved and not yet started)
    const upcomingMeetings = (db.bookings || []).filter(booking => 
      booking.userId === userId && 
      booking.status === 'approved' &&
      (booking.date > today || 
       (booking.date === today && booking.endTime > new Date().toTimeString().substring(0, 5)))
    ).length;
    
    // Get pending meeting requests
    const pendingRequests = (db.bookings || []).filter(booking => 
      booking.userId === userId && booking.status === 'pending'
    ).length;
    
    // Get recent notifications
    const recentNotifications = (db.notifications || [])
      .filter(n => n.userEmail === req.userEmail)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);
    
    res.json({
      upcomingCount: upcomingMeetings,
      pendingRequests,
      recentNotifications,
      recentDocuments: [] // Placeholder for documents
    });
  } catch (e) {
    console.error('Error getting dashboard data:', e);
    res.status(500).json({ error: 'Failed to get dashboard data' });
  }
});

// API: User - Dashboard summary
app.get('/api/user/dashboard', async (req, res) => {
  try {
    const db = await readDB();
    const bookings = db.bookings || [];
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    const todayStr = `${y}-${m}-${d}`;

    const upcoming = bookings.filter(b => (b.date || '') >= todayStr);

    // Unread notifications for current user
    const me = (req.userEmail || '').toLowerCase();
    const notifs = (db.notifications||[]).filter(n => (!n.userEmail || String(n.userEmail).toLowerCase() === me));
    const unread = notifs.filter(n => !(n.readBy||[]).includes(me)).length;

    const result = {
      upcomingCount: upcoming.length,
      documentsCount: 0,
      unreadNotificationsCount: unread,
      quickActionsCount: 0,
      upcomingDelta: `${Math.max(0, upcoming.length)} from yesterday`,
      documentsDelta: '0 this week'
    };
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: 'Failed to load dashboard' });
  }
});

// API: User - Request a meeting (creates pending booking)
app.post('/api/user/meetings/request', authMiddleware, async (req, res) => {
  try {
    const { title, venueId, date, startTime, endTime, description } = req.body || {};
    const userId = req.userId;
    const userEmail = req.userEmail;
    
    if (!title || !venueId || !date || !startTime || !endTime) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const db = await readDB();
    
    // Check if venue exists
    const venue = (db.venues || []).find(v => v.id === venueId);
    if (!venue) {
      return res.status(404).json({ error: 'Venue not found' });
    }
    
    // Check for time conflicts with approved bookings
    const hasTimeConflict = (db.bookings || []).some(booking => {
      return booking.venueId === venueId && 
             booking.date === date && 
             booking.status === 'approved' &&
             !(endTime <= booking.startTime || startTime >= booking.endTime);
    });
    
    if (hasTimeConflict) {
      return res.status(409).json({ error: 'Selected time slot is not available' });
    }
    
    // Create new meeting
    const newMeeting = {
      id: randomUUID(),
      title: title.trim(),
      date: date.trim(),
      startTime: startTime.trim(),
      endTime: endTime.trim(),
      venueId,
      venue: venue.name,
      venueLocation: venue.location || '',
      venueCapacity: venue.capacity || 0,
      userId,
      userEmail,
      description: (description || '').trim(),
      status: 'pending',
      type: 'physical',
      link: null,
      bookedBy: userEmail,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Add to bookings
    db.bookings = [...(db.bookings || []), newMeeting];
    
    // Notify user
    addNotification(db, { 
      userEmail: userEmail, 
      type: 'meeting', 
      title: 'Meeting request submitted', 
      message: 'Your meeting request is pending Admin approval.' 
    });
    
    // Notify admins
    const adminUsers = (db.users || []).filter(u => u.role === 'admin' && u.active);
    adminUsers.forEach(admin => {
      addNotification(db, {
        userEmail: admin.email,
        type: 'meeting_request',
        title: 'New Meeting Request',
        message: `New meeting request from ${req.user?.name || userEmail}: ${title}`,
        meetingId: newMeeting.id
      });
    });
    
    await writeDB(db);
    res.status(201).json({
      message: 'Meeting request submitted successfully',
      meeting: newMeeting
    });
  } catch (e) { 
    console.error('Error creating meeting request:', e);
    res.status(500).json({ error: 'Failed to request meeting' }); 
  }
});

// API: User - Meetings listing (virtual + physical)
app.get('/api/user/meetings', async (req, res) => {
  try {
    const db = await readDB();
    let items = (db.bookings || []).slice();

    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    const todayStr = `${y}-${m}-${d}`;

    if (String(req.query.upcoming || '').toLowerCase() === 'true') {
      items = items.filter(b => (b.date || '') >= todayStr);
    }

    // Map to UI-friendly format
    const mapped = items.map(b => {
      const start = `${b.date || todayStr}T${(b.startTime || '00:00')}:00`;
      const end = `${b.date || todayStr}T${(b.endTime || '00:00')}:00`;
      const isVirtual = String(b.type || '').toLowerCase() === 'virtual' || !!b.link;
      return {
        id: b.id,
        title: b.title || 'Meeting',
        start,
        end,
        link: isVirtual ? (b.link || null) : null,
        location: isVirtual ? null : (b.venue || null),
        createdBy: (b.bookedBy && String(b.bookedBy).toLowerCase() === String(req.userEmail || '').toLowerCase()) ? 'user' : 'admin'
      };
    });

    // Sort by start ascending
    mapped.sort((a, b) => String(a.start).localeCompare(String(b.start)));

    // Apply limit
    const limit = parseInt(String(req.query.limit || ''), 10);
    const result = Number.isFinite(limit) && limit > 0 ? mapped.slice(0, limit) : mapped;

    res.json(result);
  } catch (e) {
    res.status(500).json({ error: 'Failed to load meetings' });
  }
});

// API: User - Notifications
app.get('/api/user/notifications', async (req, res) => {
  try {
    const db = await readDB();
    const me = (req.userEmail || '').toLowerCase();
    const list = (db.notifications||[]).filter(n => (!n.userEmail) || String(n.userEmail).toLowerCase() === me)
      .map(n => ({ id:n.id, title:n.title, message:n.message, type:n.type, createdAt:n.createdAt, unread: !(n.readBy||[]).includes(me) }));
    res.json(list);
  } catch(e){ res.status(500).json({ error:'Failed to load notifications' }); }
});
app.post('/api/user/notifications/read', async (req, res) => {
  try {
    const db = await readDB();
    const me = (req.userEmail || '').toLowerCase();
    db.notifications = (db.notifications||[]).map(n => {
      n.readBy = ensureArray(n.readBy);
      if ((!n.userEmail) || String(n.userEmail).toLowerCase() === me) {
        if (!n.readBy.includes(me)) n.readBy.push(me);
      }
      return n;
    });
    await writeDB(db);
    res.json({ ok:true });
  } catch(e){ res.status(500).json({ error:'Failed to mark read' }); }
});

// API: Feedback
app.post('/api/feedback', async (req, res) => {
  try {
    const { meetingId=null, title=null, rating=null, comments='', anonymous=false, user=null } = req.body || {};
    const db = await readDB();
    const item = { id: randomUUID(), meetingId, title, rating: rating?Number(rating):null, comments: String(comments||'').slice(0,1000), anonymous: !!anonymous, user: anonymous? null : (user || req.userEmail || null), createdAt: new Date().toISOString() };
    db.feedback = db.feedback || [];
    db.feedback.push(item);
    await writeDB(db);
    res.status(201).json({ ok:true });
  } catch(e){ res.status(500).json({ error:'Failed to submit feedback' }); }
});

// API: User profile and password
app.patch('/api/user/profile', async (req, res) => {
  try {
    const db = await readDB();
    const me = (req.userEmail || '').toLowerCase();
    const idx = (db.users||[]).findIndex(u => u.email === me);
    if (idx === -1) return res.status(404).json({ error:'Not found' });
    const current = db.users[idx];
    const payload = req.body || {};
    const next = { ...current };
    if (payload.name) next.name = String(payload.name);
    if (payload.phone !== undefined) next.phone = String(payload.phone||'');
    next.updatedAt = new Date().toISOString();
    db.users[idx] = next; await writeDB(db);
    res.json(publicUser(next));
  } catch(e){ res.status(500).json({ error:'Failed to update profile' }); }
});
app.post('/api/user/password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    
    // Input validation
    if (!newPassword) {
      return res.status(400).json({ error: 'New password is required' });
    }

    // Password requirements
    if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      return res.status(400).json({ 
        error: 'Password must be at least 8 characters long and include at least one uppercase letter and one number' 
      });
    }

    const db = await readDB();
    const user = db.users.find(u => u.id === req.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // For non-first login, verify current password
    if (!user.firstLogin) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Current password is required' });
      }
      
      const isCurrentPasswordValid = await verifyPassword(currentPassword, user.passwordHash);
      if (!isCurrentPasswordValid) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }
    }

    // Update password
    user.passwordHash = await hashPassword(newPassword);
    user.updatedAt = new Date().toISOString();
    
    // Clear first login flag if this was the first login
    if (user.firstLogin) {
      user.firstLogin = false;
      // Remove the first login notification if it exists
      db.notifications = db.notifications || [];
      db.notifications = db.notifications.filter(n => 
        !(n.userEmail === user.email && n.type === 'account' && n.message.includes('first login'))
      );
    }

    // Add notification for password change
    addNotification(db, { 
      userEmail: user.email, 
      type: 'security', 
      title: 'Password Updated', 
      message: 'Your password was successfully updated.' 
    });

    await writeDB(db);
    res.json({ 
      success: true, 
      message: 'Password updated successfully',
      requiresPasswordChange: false // Frontend can use this to redirect from password change screen
    });
  } catch (error) {
    console.error('Password update error:', error);
    res.status(500).json({ error: 'Failed to update password. Please try again.' });
  }
});

// Serve the front-end statically so relative /api calls work
app.use(express.static(FRONTEND_DIR));
// Default to login if route not found
app.get('*', (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, 'auth', 'login.html'));
});

app.listen(PORT, () => {
  console.log(`SmartMeet UNZA backend running on http://localhost:${PORT}`);
  console.log(`Serving front-end from: ${FRONTEND_DIR}`);
  console.log(`Data file: ${DB_FILE}`);
});
