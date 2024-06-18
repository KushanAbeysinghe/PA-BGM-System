const express = require('express');
const fileUpload = require('express-fileupload');
const cors = require('cors');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const path = require('path');
const fs = require('fs');

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(fileUpload());

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'online_radio'
});

db.connect(err => {
  if (err) throw err;
  console.log('MySQL Connected...');
});

app.post('/upload', (req, res) => {
  if (req.files === null) {
    return res.status(400).json({ msg: 'No file uploaded' });
  }

  const file = req.files.file;

  file.mv(`${__dirname}/uploads/${file.name}`, err => {
    if (err) {
      console.error(err);
      return res.status(500).send(err);
    }

    const sql = 'INSERT INTO tracks (trackName) VALUES (?)';
    db.query(sql, [file.name], (err, result) => {
      if (err) throw err;
      res.json({ fileName: file.name, filePath: `/uploads/${file.name}` });
    });
  });
});

app.post('/addTrack', (req, res) => {
  const { trackName, timestamp } = req.body;
  const sql = 'INSERT INTO tracks (trackName, timestamp) VALUES (?, ?)';
  db.query(sql, [trackName, timestamp], (err, result) => {
    if (err) throw err;
    res.send('Track added...');
  });
});

app.get('/tracks', (req, res) => {
  const sql = 'SELECT * FROM tracks';
  db.query(sql, (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});

app.delete('/deleteTrack/:trackName', (req, res) => {
  const trackName = req.params.trackName;
  const sql = 'DELETE FROM tracks WHERE trackName = ?';
  db.query(sql, [trackName], err => {
    if (err) throw err;

    fs.unlink(`${__dirname}/uploads/${trackName}`, err => {
      if (err) {
        console.error(err);
        return res.status(500).send(err);
      }

      res.send('Track deleted...');
    });
  });
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const PORT = 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
