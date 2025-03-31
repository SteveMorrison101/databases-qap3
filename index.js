const express = require('express');
const mongoose = require('mongoose');
const app = express();
const PORT = 3000;

// Parse JSON
app.use(express.json());

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/cd_library', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// CD model
const cdSchema = new mongoose.Schema({
  title: { type: String, required: true },
  artist: { type: String, required: true },
  genre: { type: String, required: true },
  year: { type: Number, required: true }
});

const CD = mongoose.model('CD', cdSchema);

// Retrieve all CDs (with added filtering and field selection)
app.get('/cds', async (req, res) => {
  try {
    const { artist, genre, before, fields } = req.query;
    const filter = {};

    if (artist) {
      filter.artist = new RegExp(`^${artist}$`, 'i');
    }

    if (genre) {
      filter.genre = new RegExp(`^${genre}$`, 'i');
    }

    if (before) {
      const year = parseInt(before);
      if (!isNaN(year)) {
        filter.year = { $lt: year };
      }
    }

    let projection = null;
    if (fields) {
      const fieldsArray = fields.split(',');
      projection = {};
      fieldsArray.forEach(field => {
        projection[field.trim()] = 1;
      });
    }

    const cds = await CD.find(filter, projection);
    res.json(cds);
  } catch (err) {
    res.status(500).json({ error: 'Server error while fetching CDs' });
  }
});

// Add a new CD
app.post('/cds', async (req, res) => {
  try {
    const { title, artist, genre, year } = req.body;
    const newCd = new CD({ title, artist, genre, year });
    await newCd.save();
    res.status(201).json(newCd);
  } catch (err) {
    res.status(400).json({ error: 'Invalid CD data' });
  }
});

// Update an existing CD
app.put('/cds/:id', async (req, res) => {
  try {
    const updatedCd = await CD.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedCd) return res.status(404).json({ error: 'CD not found' });
    res.json(updatedCd);
  } catch (err) {
    res.status(400).json({ error: 'Error updating CD' });
  }
});

// Delete a CD
app.delete('/cds/:id', async (req, res) => {
  try {
    const deletedCd = await CD.findByIdAndDelete(req.params.id);
    if (!deletedCd) return res.status(404).json({ error: 'CD not found' });
    res.json(deletedCd);
  } catch (err) {
    res.status(400).json({ error: 'Error deleting CD' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});