const notesRepo = require('../db/repositories/notes.repo');

class NotesController {
  async create(req, res) {
    try {
      const { title, content, category, color, pinned } = req.body;

      if (!title) {
        return res.status(400).json({ 
          error: 'Title is required' 
        });
      }

      const note = await notesRepo.create({
        title,
        content: content || '',
        category: category || 'general',
        color: color || '#3B82F6',
        pinned: pinned || false
      });
      
      res.status(201).json(note);
    } catch (error) {
      console.error('Create note error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getAll(req, res) {
    try {
      const notes = await notesRepo.findAll();
      res.json(notes);
    } catch (error) {
      console.error('Get notes error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getOne(req, res) {
    try {
      const note = await notesRepo.findById(req.params.id);
      
      if (!note) {
        return res.status(404).json({ error: 'Note not found' });
      }

      res.json(note);
    } catch (error) {
      console.error('Get note error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getByCategory(req, res) {
    try {
      const notes = await notesRepo.findByCategory(req.params.category);
      res.json(notes);
    } catch (error) {
      console.error('Get notes by category error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async update(req, res) {
    try {
      const { title, content, category, color, pinned } = req.body;
      const { id } = req.params;

      if (!title) {
        return res.status(400).json({ 
          error: 'Title is required' 
        });
      }

      const note = await notesRepo.update(id, {
        title,
        content: content || '',
        category: category || 'general',
        color: color || '#3B82F6',
        pinned: pinned || false
      });

      if (!note) {
        return res.status(404).json({ error: 'Note not found' });
      }

      res.json(note);
    } catch (error) {
      console.error('Update note error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async togglePin(req, res) {
    try {
      const note = await notesRepo.togglePin(req.params.id);
      
      if (!note) {
        return res.status(404).json({ error: 'Note not found' });
      }

      res.json(note);
    } catch (error) {
      console.error('Toggle pin error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async delete(req, res) {
    try {
      const deleted = await notesRepo.delete(req.params.id);
      
      if (!deleted) {
        return res.status(404).json({ error: 'Note not found' });
      }

      res.json({ message: 'Note deleted successfully' });
    } catch (error) {
      console.error('Delete note error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getCategories(req, res) {
    try {
      const categories = await notesRepo.getCategories();
      res.json(categories);
    } catch (error) {
      console.error('Get categories error:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new NotesController();