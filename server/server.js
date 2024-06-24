const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const cors = require('cors');
const { addDays, differenceInDays } = require('date-fns');
const schedule = require('node-schedule');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 5000;

const upload = multer({ dest: 'uploads/' });

app.use(express.json());
app.use(cors());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const profilesFile = path.join(__dirname, 'radioProfiles.json');
const schedulesFile = path.join(__dirname, 'radioSchedules.json');
const historyFile = path.join(__dirname, 'history.json');
const usersFile = path.join(__dirname, 'users.json');
const adminFile = path.join(__dirname, 'admin.json');

fs.ensureFileSync(profilesFile);
fs.ensureFileSync(schedulesFile);
fs.ensureFileSync(historyFile);
fs.ensureFileSync(usersFile);
fs.ensureFileSync(adminFile);

let radioStreams = [];
let schedules = {};
let history = [];
let users = [];
let admins = [];

const loadProfiles = async () => {
  const data = await fs.readJson(profilesFile).catch(() => []);
  radioStreams = data;
};

const loadSchedules = async () => {
  const data = await fs.readJson(schedulesFile).catch(() => ({}));
  schedules = data;
};

const loadHistory = async () => {
  const data = await fs.readJson(historyFile).catch(() => []);
  history = data;
};

const loadUsers = async () => {
  const data = await fs.readJson(usersFile).catch(() => []);
  users = data;
};

const loadAdmins = async () => {
  const data = await fs.readJson(adminFile).catch(() => []);
  admins = data;
};

const saveProfiles = async () => {
  await fs.writeJson(profilesFile, radioStreams);
};

const saveSchedules = async () => {
  await fs.writeJson(schedulesFile, schedules);
};

const saveHistory = async () => {
  await fs.writeJson(historyFile, history);
};

const saveUsers = async () => {
  await fs.writeJson(usersFile, users);
};

loadProfiles();
loadSchedules();
loadHistory();
loadUsers();
loadAdmins();

const getSubscriptionDays = (plan) => {
  switch (plan) {
    case '1 Day':
      return 1;
    case '1 Month':
      return 30;
    case '3 Months':
      return 90;
    case '6 Months':
      return 180;
    case '1 Year':
      return 365;
    default:
      return 0;
  }
};

const addToHistory = async (streamId, action, details) => {
  const stream = radioStreams.find(stream => stream.id == streamId);
  if (stream) {
    history.push({
      id: streamId,
      companyName: stream.companyName || 'N/A',
      name: stream.name || 'N/A',
      action,
      timestamp: new Date(),
      details
    });
    await saveHistory();
  }
};

app.get('/radiostreams', (req, res) => {
  console.log('Fetching all radio streams...');
  res.send(radioStreams);
});

app.get('/radiostreams/:id', (req, res) => {
  const { id } = req.params;
  console.log(`Fetching radio stream with ID: ${id}`);
  const stream = radioStreams.find(stream => stream.id == id);
  if (stream) {
    res.send(stream);
  } else {
    res.status(404).send('Radio stream not found');
  }
});

app.post('/radiostreams', upload.single('logo'), async (req, res) => {
  console.log('Creating new radio stream...');
  const { name, url, subscriptionPlan, companyName, email, username, password } = req.body;
  const logo = req.file ? req.file.filename : null;
  const createdDate = new Date();
  const expirationDate = addDays(createdDate, getSubscriptionDays(subscriptionPlan));
  const newStream = { id: Date.now(), name, url, companyName, email, logo, blocked: false, alarmBlocked: true, subscriptionPlan, createdDate, expirationDate };
  radioStreams.push(newStream);

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = { username, password: hashedPassword, radioProfileId: newStream.id };
  users.push(newUser);

  await saveProfiles();
  await saveUsers();
  await addToHistory(newStream.id, 'Account created', `Initial subscription plan: ${subscriptionPlan}`);
  res.send(newStream);
});

app.put('/radiostreams/:id', upload.single('logo'), async (req, res) => {
  const { id } = req.params;
  const { name, url, subscriptionPlan, companyName, email } = req.body;
  const logo = req.file ? req.file.filename : null;
  console.log(`Updating radio stream with ID: ${id}`);
  const stream = radioStreams.find(stream => stream.id == id);
  if (stream) {
    const now = new Date();
    if (name && name !== stream.name) {
      stream.name = name;
      await addToHistory(id, 'Name updated', `Updated to: ${name}`);
    }
    if (url && url !== stream.url) {
      stream.url = url;
      await addToHistory(id, 'URL updated', `Updated to: ${url}`);
    }
    if (subscriptionPlan && subscriptionPlan !== stream.subscriptionPlan) {
      const daysToAdd = getSubscriptionDays(subscriptionPlan);
      stream.subscriptionPlan = subscriptionPlan;
      stream.createdDate = now;
      stream.expirationDate = addDays(now, daysToAdd);
      await addToHistory(id, 'Subscription plan updated', `New plan: ${subscriptionPlan}`);
    }
    if (companyName && companyName !== stream.companyName) {
      stream.companyName = companyName;
      await addToHistory(id, 'Company name updated', `Updated to: ${companyName}`);
    }
    if (email && email !== stream.email) {
      stream.email = email;
      await addToHistory(id, 'Email updated', `Updated to: ${email}`);
    }
    if (logo) {
      stream.logo = logo;
      await addToHistory(id, 'Logo updated', `New logo uploaded`);
    }
    await saveProfiles();
    res.send(stream);
  } else {
    res.status(404).send('Radio stream not found');
  }
});

app.put('/radiostreams/:id/block', async (req, res) => {
  const { id } = req.params;
  console.log(`Blocking radio stream with ID: ${id}`);
  const stream = radioStreams.find(stream => stream.id == id);
  if (stream) {
    stream.blocked = true;
    await saveProfiles();
    await addToHistory(id, 'Profile blocked', 'Profile was blocked');
    res.send('Radio stream blocked');
  } else {
    res.status(404).send('Radio stream not found');
  }
});

app.put('/radiostreams/:id/unblock', async (req, res) => {
  const { id } = req.params;
  console.log(`Unblocking radio stream with ID: ${id}`);
  const stream = radioStreams.find(stream => stream.id == id);
  if (stream) {
    stream.blocked = false;
    await saveProfiles();
    await addToHistory(id, 'Profile unblocked', 'Profile was unblocked');
    res.send('Radio stream unblocked');
  } else {
    res.status(404).send('Radio stream not found');
  }
});

app.put('/radiostreams/:id/block-alarm', async (req, res) => {
  const { id } = req.params;
  console.log(`Blocking alarm for radio stream with ID: ${id}`);
  const stream = radioStreams.find(stream => stream.id == id);
  if (stream) {
    stream.alarmBlocked = true;
    await saveProfiles();
    await addToHistory(id, 'Alarm blocked', 'Alarm was blocked');
    res.send('Radio alarm system blocked');
  } else {
    res.status(404).send('Radio stream not found');
  }
});

app.put('/radiostreams/:id/unblock-alarm', async (req, res) => {
  const { id } = req.params;
  console.log(`Unblocking alarm for radio stream with ID: ${id}`);
  const stream = radioStreams.find(stream => stream.id == id);
  if (stream) {
    stream.alarmBlocked = false;
    await saveProfiles();
    await addToHistory(id, 'Alarm unblocked', 'Alarm was unblocked');
    res.send('Radio alarm system unblocked');
  } else {
    res.status(404).send('Radio stream not found');
  }
});

app.put('/radiostreams/:id/paid', async (req, res) => {
  const { id } = req.params;
  console.log(`Processing payment for radio stream with ID: ${id}`);
  const stream = radioStreams.find(stream => stream.id == id);
  if (stream) {
    const currentDate = new Date();
    const expirationDate = new Date(stream.expirationDate);
    const subscriptionDays = getSubscriptionDays(stream.subscriptionPlan);

    // Calculate days difference between currentDate and expirationDate
    const daysDifference = differenceInDays(currentDate, expirationDate);

    // Calculate the new expiration date by adding subscriptionDays + (daysDifference * 2)
    const newExpirationDate = addDays(expirationDate, subscriptionDays + (daysDifference * 2));

    stream.alarmBlocked = false;
    stream.createdDate = expirationDate;
    stream.expirationDate = newExpirationDate;

    await saveProfiles();
    await addToHistory(id, 'Subscription renewed', `New expiration date: ${newExpirationDate}`);
    res.send('Subscription renewed and alarm unblocked');
  } else {
    res.status(404).send('Radio stream not found');
  }
});

app.delete('/radiostreams/:id', async (req, res) => {
  const { id } = req.params;
  console.log(`Deleting radio stream with ID: ${id}`);
  const stream = radioStreams.find(stream => stream.id == id);

  if (stream) {
    if (stream.logo) {
      const logoPath = path.join(__dirname, 'uploads', stream.logo);
      if (await fs.pathExists(logoPath)) {
        await fs.unlink(logoPath);
      }
    }

    const trackPath = path.join(__dirname, 'uploads', 'tracks');
    const files = await fs.readdir(trackPath);
    await Promise.all(
      files.filter(file => file.startsWith(`${id}-`)).map(file => fs.unlink(path.join(trackPath, file)))
    );

    users = users.filter(user => user.radioProfileId != id);

    radioStreams = radioStreams.filter(stream => stream.id != id);
    delete schedules[id];
    await saveProfiles();
    await saveUsers();
    await saveSchedules();
    await addToHistory(id, 'Account deleted', 'All associated files deleted');
    res.send('Radio stream and associated files deleted');
  } else {
    res.status(404).send('Radio stream not found');
  }
});

app.delete('/radio/:id/tracks/:track', async (req, res) => {
  const { id, track } = req.params;
  console.log(`Deleting track: ${track} for radio stream with ID: ${id}`);
  const trackPath = path.join(__dirname, 'uploads', 'tracks', `${id}-${track}`);
  
  if (await fs.pathExists(trackPath)) {
    await fs.unlink(trackPath);
    await addToHistory(id, 'Track deleted', `Track: ${track} deleted`);
    res.send('Track deleted successfully');
  } else {
    res.status(404).send('Track not found');
  }
});

app.post('/radio/:id/upload', upload.single('file'), async (req, res) => {
  const file = req.file;
  const radioId = req.params.id;
  console.log(`Uploading track for radio stream with ID: ${radioId}`);
  if (!file) {
    return res.status(400).send('No file uploaded.');
  }

  const targetPath = path.join(__dirname, 'uploads', 'tracks', `${radioId}-${file.originalname}`);
  await fs.move(file.path, targetPath);
  await addToHistory(radioId, 'Track uploaded', `Track: ${file.originalname} uploaded`);
  res.send({ fileName: `${radioId}-${file.originalname}` });
});

app.get('/radio/:id/tracks', async (req, res) => {
  const radioId = req.params.id;
  console.log(`Fetching tracks for radio stream with ID: ${radioId}`);
  try {
    const files = await fs.readdir(path.join(__dirname, 'uploads', 'tracks'));
    const filteredFiles = files.filter(file => file.startsWith(`${radioId}-`));
    res.send(filteredFiles);
  } catch (err) {
    res.status(500).send('Error reading tracks directory.');
  }
});

// Handle streaming of MP3 files with range requests
app.get('/uploads/tracks/:file', (req, res) => {
  const file = req.params.file;
  const filePath = path.join(__dirname, 'uploads', 'tracks', file);
  fs.stat(filePath, (err, stats) => {
    if (err) {
      if (err.code === 'ENOENT') {
        return res.status(404).send('Track not found');
      }
      return res.status(500).send(err);
    }

    const range = req.headers.range;
    if (!range) {
      const head = {
        'Content-Length': stats.size,
        'Content-Type': 'audio/mpeg',
      };
      res.writeHead(200, head);
      fs.createReadStream(filePath).pipe(res);
    } else {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1;

      if (start >= stats.size) {
        res.status(416).send(`Requested range not satisfiable\n${start} >= ${stats.size}`);
        return;
      }

      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(filePath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${stats.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'audio/mpeg',
      };
      res.writeHead(206, head);
      file.pipe(res);
    }
  });
});

app.get('/radio/:id/schedule', (req, res) => {
  const radioId = req.params.id;
  console.log(`Fetching schedule for radio stream with ID: ${radioId}`);
  res.send(schedules[radioId] || []);
});

app.post('/radio/:id/schedule', async (req, res) => {
  const radioId = req.params.id;
  console.log(`Updating schedule for radio stream with ID: ${radioId}`);
  schedules[radioId] = req.body;
  await saveSchedules();
  await addToHistory(radioId, 'Schedule updated', 'Schedule updated');
  res.send('Schedule updated successfully.');
});

app.post('/register', async (req, res) => {
  const { username, password, radioProfileId } = req.body;
  console.log(`Registering new user with username: ${username}`);
  const existingUser = users.find(user => user.username === username);
  if (existingUser) {
    return res.status(400).send({ error: 'Username already taken' });
  }
  
  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = { username, password: hashedPassword, radioProfileId };
  users.push(newUser);
  
  await saveUsers();
  res.status(201).send({ message: 'User registered successfully' });
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  console.log(`User login attempt with username: ${username}`);
  const user = users.find(user => user.username === username);
  if (!user) {
    return res.status(400).send({ error: 'Invalid username or password' });
  }
  
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(400).send({ error: 'Invalid username or password' });
  }
  
  const token = jwt.sign({ username: user.username, radioProfileId: user.radioProfileId }, 'rfwfrgfehg65778695f%£4534564hfghFGHRYT^%$&^*&Tghtdhgd32436y547575354GDThgrh', { expiresIn: '1h' });
  res.send({ token, user: { id: user.radioProfileId, username: user.username } });
});

app.post('/admin/login', async (req, res) => {
  const { username, password } = req.body;
  console.log(`Admin login attempt with username: ${username}`);
  const admin = admins.find(user => user.username === username);
  if (!admin) {
    return res.status(400).send({ error: 'Invalid username or password' });
  }

  if (password !== admin.password) {
    return res.status(400).send({ error: 'Invalid username or password' });
  }

  const token = jwt.sign({ username: admin.username }, 'rfwfrgfehg65778695f%£4534564hfghFGHRYT^%$&^*&Tghtdhgd32436y547575354GDThgrh', { expiresIn: '1h' });
  res.send({ token });
});

const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  console.log(`Authenticating user with token: ${token}`);
  if (!token) {
    return res.status(401).send({ error: 'Please authenticate' });
  }

  try {
    const decoded = jwt.verify(token, 'rfwfrgfehg65778695f%£4534564hfghFGHRYT^%$&^*&Tghtdhgd32436y547575354GDThgrh');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).send({ error: 'Please authenticate' });
  }
};

const adminAuth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  console.log(`Authenticating admin with token: ${token}`);
  if (!token) {
    return res.status(401).send({ error: 'Please authenticate as admin' });
  }

  try {
    const decoded = jwt.verify(token, 'rfwfrgfehg65778695f%£4534564hfghFGHRYT^%$&^*&Tghtdhgd32436y547575354GDThgrh');
    req.admin = decoded;
    next();
  } catch (error) {
    res.status(401).send({ error: 'Please authenticate as admin' });
  }
};

app.get('/radio/:id', auth, (req, res) => {
  res.send('Protected radio profile data');
});

app.get('/dashboard', adminAuth, (req, res) => {
  res.send('This is the protected dashboard.');
});

app.get('/history', (req, res) => {
  res.send(history);
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
