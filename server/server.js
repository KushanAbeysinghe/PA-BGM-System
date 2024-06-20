const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const cors = require('cors');
const { addDays, differenceInDays } = require('date-fns');
const schedule = require('node-schedule');
const emailjs = require('emailjs-com');
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
const usersFile = path.join(__dirname, 'users.json');
const adminFile = path.join(__dirname, 'admin.json');

fs.ensureFileSync(profilesFile);
fs.ensureFileSync(schedulesFile);
fs.ensureFileSync(usersFile);
fs.ensureFileSync(adminFile);

let radioStreams = [];
let schedules = {};
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

const saveUsers = async () => {
  await fs.writeJson(usersFile, users);
};

loadProfiles();
loadSchedules();
loadUsers();
loadAdmins();

app.get('/radiostreams', (req, res) => {
  res.send(radioStreams);
});

app.get('/radiostreams/:id', (req, res) => {
  const { id } = req.params;
  const stream = radioStreams.find(stream => stream.id == id);
  if (stream) {
    res.send(stream);
  } else {
    res.status(404).send('Radio stream not found');
  }
});

app.post('/radiostreams', upload.single('logo'), async (req, res) => {
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
  res.send(newStream);
});

app.put('/radiostreams/:id', upload.single('logo'), async (req, res) => {
  const { id } = req.params;
  const { name, url, subscriptionPlan, companyName, email } = req.body;
  const logo = req.file ? req.file.filename : null;
  const stream = radioStreams.find(stream => stream.id == id);
  if (stream) {
    stream.name = name;
    stream.url = url;
    stream.companyName = companyName;
    stream.email = email;
    if (logo) {
      stream.logo = logo;
    }
    if (subscriptionPlan && subscriptionPlan !== stream.subscriptionPlan) {
      const now = new Date();
      const daysToAdd = getSubscriptionDays(subscriptionPlan);
      stream.subscriptionPlan = subscriptionPlan;
      stream.createdDate = now;
      stream.expirationDate = addDays(now, daysToAdd);
    }
    await saveProfiles();
    res.send(stream);
  } else {
    res.status(404).send('Radio stream not found');
  }
});

app.put('/radiostreams/:id/block', async (req, res) => {
  const { id } = req.params;
  const stream = radioStreams.find(stream => stream.id == id);
  if (stream) {
    stream.blocked = true;
    await saveProfiles();
    res.send('Radio stream blocked');
  } else {
    res.status(404).send('Radio stream not found');
  }
});

app.put('/radiostreams/:id/unblock', async (req, res) => {
  const { id } = req.params;
  const stream = radioStreams.find(stream => stream.id == id);
  if (stream) {
    stream.blocked = false;
    await saveProfiles();
    res.send('Radio stream unblocked');
  } else {
    res.status(404).send('Radio stream not found');
  }
});

app.put('/radiostreams/:id/block-alarm', async (req, res) => {
  const { id } = req.params;
  const stream = radioStreams.find(stream => stream.id == id);
  if (stream) {
    stream.alarmBlocked = true;
    await saveProfiles();
    res.send('Radio alarm system blocked');
  } else {
    res.status(404).send('Radio stream not found');
  }
});

app.put('/radiostreams/:id/unblock-alarm', async (req, res) => {
  const { id } = req.params;
  const stream = radioStreams.find(stream => stream.id == id);
  if (stream) {
    const now = new Date();
    const daysToAdd = getSubscriptionDays(stream.subscriptionPlan);
    stream.alarmBlocked = false;
    stream.createdDate = now;
    stream.expirationDate = addDays(now, daysToAdd);
    await saveProfiles();
    res.send('Radio alarm system unblocked and subscription renewed');
  } else {
    res.status(404).send('Radio stream not found');
  }
});

app.put('/radiostreams/:id/subscription-paid', async (req, res) => {
  const { id } = req.params;
  const stream = radioStreams.find(stream => stream.id == id);
  if (stream) {
    const now = new Date();
    stream.createdDate = now;
    stream.expirationDate = addDays(now, getSubscriptionDays(stream.subscriptionPlan));
    await saveProfiles();
    res.send('Subscription marked as paid');
  } else {
    res.status(404).send('Radio stream not found');
  }
});

app.delete('/radiostreams/:id', async (req, res) => {
  const { id } = req.params;
  const stream = radioStreams.find(stream => stream.id == id);

  if (stream) {
    if (stream.logo) {
      const logoPath = path.join(__dirname, 'uploads', stream.logo);
      if (fs.existsSync(logoPath)) {
        fs.unlinkSync(logoPath);
      }
    }

    const trackPath = path.join(__dirname, 'uploads', 'tracks');
    const files = fs.readdirSync(trackPath);
    files.forEach(file => {
      if (file.startsWith(`${id}-`)) {
        fs.unlinkSync(path.join(trackPath, file));
      }
    });

    users = users.filter(user => user.radioProfileId != id);

    radioStreams = radioStreams.filter(stream => stream.id != id);
    delete schedules[id];
    await saveProfiles();
    await saveUsers();
    await saveSchedules();

    res.send('Radio stream and associated files deleted');
  } else {
    res.status(404).send('Radio stream not found');
  }
});

app.delete('/radio/:id/tracks/:track', async (req, res) => {
  const { id, track } = req.params;
  const trackPath = path.join(__dirname, 'uploads', 'tracks', `${id}-${track}`);
  
  if (fs.existsSync(trackPath)) {
    fs.unlinkSync(trackPath);
    res.send('Track deleted successfully');
  } else {
    res.status(404).send('Track not found');
  }
});

app.post('/radio/:id/upload', upload.single('file'), (req, res) => {
  const file = req.file;
  const radioId = req.params.id;
  if (!file) {
    return res.status(400).send('No file uploaded.');
  }

  const targetPath = path.join(__dirname, 'uploads', 'tracks', `${radioId}-${file.originalname}`);
  fs.renameSync(file.path, targetPath);

  res.send({ fileName: `${radioId}-${file.originalname}` });
});

app.get('/radio/:id/tracks', (req, res) => {
  const radioId = req.params.id;
  fs.readdir(path.join(__dirname, 'uploads', 'tracks'), (err, files) => {
    if (err) {
      return res.status(500).send('Error reading tracks directory.');
    }
    const filteredFiles = files.filter(file => file.startsWith(`${radioId}-`));
    res.send(filteredFiles);
  });
});

app.get('/radio/:id/schedule', (req, res) => {
  const radioId = req.params.id;
  res.send(schedules[radioId] || []);
});

app.post('/radio/:id/schedule', async (req, res) => {
  const radioId = req.params.id;
  schedules[radioId] = req.body;
  await saveSchedules();
  res.send('Schedule updated successfully.');
});

app.post('/register', async (req, res) => {
  const { username, password, radioProfileId } = req.body;
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
  const token = req.header('Authorization').replace('Bearer ', '');
  try {
    const decoded = jwt.verify(token, 'rfwfrgfehg65778695f%£4534564hfghFGHRYT^%$&^*&Tghtdhgd32436y547575354GDThgrh');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).send({ error: 'Please authenticate' });
  }
};

const adminAuth = (req, res, next) => {
  const token = req.header('Authorization').replace('Bearer ', '');
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

const EMAILJS_SERVICE_ID = 'your_service_id';
const EMAILJS_TEMPLATE_ID = 'your_template_id';
const EMAILJS_USER_ID = 'your_user_id';

const sendEmailNotification = (email, name) => {
  const templateParams = {
    to_email: email,
    to_name: name,
  };

  emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams, EMAILJS_USER_ID)
    .then(response => {
      console.log('Email sent successfully:', response.status, response.text);
    })
    .catch(err => {
      console.error('Error sending email:', err);
    });
};

schedule.scheduleJob('0 0 * * *', () => {
  const now = new Date();
  radioStreams.forEach(stream => {
    const daysLeft = differenceInDays(new Date(stream.expirationDate), now);
    if (daysLeft === 2) {
      sendEmailNotification(stream.email, stream.name);
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
