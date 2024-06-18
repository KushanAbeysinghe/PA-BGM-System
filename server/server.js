const express = require('express');
const fileUpload = require('express-fileupload');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());
app.use(fileUpload());
app.use('/upload', express.static(path.join(__dirname, 'upload')));

const scheduleFilePath = path.join(__dirname, 'schedule.json');

// Ensure the schedule file exists and is properly formatted
if (!fs.existsSync(scheduleFilePath)) {
  fs.writeFileSync(scheduleFilePath, JSON.stringify([]));
} else {
  try {
    const data = fs.readFileSync(scheduleFilePath, 'utf8');
    JSON.parse(data);
  } catch (e) {
    fs.writeFileSync(scheduleFilePath, JSON.stringify([]));
  }
}

app.post('/upload', (req, res) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send('No files were uploaded.');
  }

  let sampleFile = req.files.file;
  let uploadPath = path.join(__dirname, 'upload', sampleFile.name);

  sampleFile.mv(uploadPath, (err) => {
    if (err) {
      return res.status(500).send(err);
    }
    res.send('File uploaded!');
  });
});

app.get('/tracks', (req, res) => {
  const directoryPath = path.join(__dirname, 'upload');
  fs.readdir(directoryPath, (err, files) => {
    if (err) {
      return res.status(500).send('Unable to scan files!');
    }
    res.send(files);
  });
});

app.get('/schedule', (req, res) => {
  fs.readFile(scheduleFilePath, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).send('Error reading schedule file');
    }
    try {
      const schedule = JSON.parse(data);
      res.send(schedule);
    } catch (e) {
      res.send([]);
    }
  });
});

app.post('/schedule', (req, res) => {
  const schedule = req.body;
  fs.writeFile(scheduleFilePath, JSON.stringify(schedule, null, 2), (err) => {
    if (err) {
      return res.status(500).send('Error saving schedule');
    }
    res.send('Schedule saved');
  });
});

app.listen(5000, () => {
  console.log('Server started on http://localhost:5000');
});
