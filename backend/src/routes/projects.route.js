const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Project = require('../models/Project.model');

// Get all projects, or projects by owner
router.get('/', async (req, res) => {
  try {
    const { ownerId } = req.query;
    const query = {};

    if (ownerId) {
      if (!mongoose.Types.ObjectId.isValid(ownerId)) {
        return res.status(400).json({ error: 'Owner ID non valide.' });
      }
      query.owner = ownerId;
    }

    const projects = await Project.find(/*query*/);
    return res.status(200).json(projects);
  } catch (err) {
    console.error('Erreur lister projets:', err);
    return res.status(500).json({ error: 'Erreur serveur lors de la récupération des projets.' });
  }
});

// Create a new project
router.post('/', async (req, res) => {
  try {
    const { name, description, owner } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Le nom du projet est requis.' });
    }

    // validate owner if provided: must be a valid ObjectId
    let ownerId = undefined
    if (owner) {
      if (mongoose.Types.ObjectId.isValid(owner)) {
        ownerId = owner
      } else {
        // ignore invalid owner instead of throwing a CastError
        console.warn('Owner fourni non valide, ignoré:', owner)
      }
    }

    const project = new Project({
      name: name.trim(),
      description: description || '',
      owner: ownerId
    });

    await project.save();

    return res.status(201).json(project);
  } catch (err) {
    console.error('Erreur création projet:', err);
    return res.status(500).json({ error: 'Erreur serveur lors de la création du projet.' });
  }
});

// Get a project by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'ID de projet non valide.' });
    }

    const project = await Project.findById(id);

    if (!project) {
      return res.status(404).json({ error: 'Projet non trouvé.' });
    }

    return res.status(200).json(project);
  } catch (err) {
    console.error('Erreur récupération projet:', err);
    return res.status(500).json({ error: 'Erreur serveur lors de la récupération du projet.' });
  }
});

module.exports = router;
