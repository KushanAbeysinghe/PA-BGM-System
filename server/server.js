const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const cors = require('cors');
const { addDays, differenceInDays } = require('date-fns'); // Use date-fns for date calculations

const app = express();
const PORT = process.env.PORT || 5000;

const upload = multer({ dest: 'uploads/' });

app.use(express.json());
app.use(cors());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));  // Serve static files from the uploads directory

const profilesFile = path.join(__dirname, 'radioProfiles.json');
const schedulesFile = path.join(__dirname, 'radioSchedules.json');

// Initialize JSON files if they don't exist
fs.ensureFileSync(profilesFile);
fs.ensureFileSync(schedulesFile);

let radioStreams = [];
let schedules = {};

const loadProfiles = async () => {
  const data = await fs.readJson(profilesFile).catch(() => []);
  radioStreams = data;
};

const loadSchedules = async () => {
  const data = await fs.readJson(schedulesFile).catch(() => ({}));
  schedules = data;
};

const saveProfiles = async () => {
  await fs.writeJson(profilesFile, radioStreams);
};

const saveSchedules = async () => {
  await fs.writeJson(schedulesFile, schedules);
};

// Load profiles and schedules on startup
loadProfiles();
loadSchedules();

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

app.post('/radiostreams', async (req, res) => {
  const { name, url, subscriptionPlan } = req.body;
  const createdDate = new Date();
  const expirationDate = addDays(createdDate, getSubscriptionDays(subscriptionPlan));
  const newStream = { id: Date.now(), name, url, blocked: false, alarmBlocked: true, subscriptionPlan, createdDate, expirationDate }; // Add subscription details
  radioStreams.push(newStream);
  await saveProfiles();
  res.send(newStream);
});

app.put('/radiostreams/:id', async (req, res) => {
  const { id } = req.params;
  const { name, url, subscriptionPlan } = req.body;
  const stream = radioStreams.find(stream => stream.id == id);
  if (stream) {
    stream.name = name;
    stream.url = url;
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

app.delete('/radiostreams/:id', async (req, res) => {
  const { id } = req.params;
  radioStreams = radioStreams.filter(stream => stream.id != id);
  delete schedules[id];
  await saveProfiles();
  await saveSchedules();
  res.send('Radio stream deleted');
});

app.post('/radio/:id/upload', upload.single('file'), (req, res) => {
  const file = req.file;
  const radioId = req.params.id;
  if (!file) {
    return res.status(400).send('No file uploaded.');
  }

  // Move the file to a permanent location
  const targetPath = path.join(__dirname, 'uploads', file.originalname);
  fs.renameSync(file.path, targetPath);

  res.send({ fileName: file.originalname });
});

app.get('/radio/:id/tracks', (req, res) => {
  fs.readdir(path.join(__dirname, 'uploads'), (err, files) => {
    if (err) {
      return res.status(500).send('Error reading tracks directory.');
    }
    res.send(files);
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

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
