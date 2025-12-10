const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Venue = require('../models/Venue');
const authenticate = require('../middleware/auth');

// GET /api/venues - Get all venues
router.get('/', authenticate, async (req, res) => {
  try {
    const venues = await Venue.find().sort({ name: 1 });
    res.json(venues);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching venues', error: error.message });
  }
});

// GET /api/venues/:id - Get venue by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const venue = await Venue.findById(req.params.id);
    if (!venue) {
      return res.status(404).json({ message: 'Venue not found' });
    }
    res.json(venue);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching venue', error: error.message });
  }
});

// POST /api/venues - Create new venue
router.post('/', authenticate, [
  body('name').notEmpty().withMessage('Venue name is required'),
  body('address.city').notEmpty().withMessage('City is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const venue = new Venue(req.body);
    await venue.save();
    res.status(201).json(venue);
  } catch (error) {
    res.status(500).json({ message: 'Error creating venue', error: error.message });
  }
});

// PUT /api/venues/:id - Update venue
router.put('/:id', authenticate, async (req, res) => {
  try {
    const venue = await Venue.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!venue) {
      return res.status(404).json({ message: 'Venue not found' });
    }
    res.json(venue);
  } catch (error) {
    res.status(500).json({ message: 'Error updating venue', error: error.message });
  }
});

// DELETE /api/venues/:id - Delete venue
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const venue = await Venue.findByIdAndDelete(req.params.id);
    if (!venue) {
      return res.status(404).json({ message: 'Venue not found' });
    }
    res.json({ message: 'Venue deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting venue', error: error.message });
  }
});

module.exports = router;

