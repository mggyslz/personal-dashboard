const notesRepo = require('../db/repositories/notes.repo');
const axios = require('axios');

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

async summarize(req, res) {
    try {
      const { text, maxLength = 250 } = req.body; // Increased default maxLength for better rephrasing

      if (!text || text.trim().length === 0) {
        return res.status(400).json({ error: 'Text is required for summarization' });
      }

      // Check if Ollama is available
      const OLLAMA_ENABLED = process.env.OLLAMA_ENABLED === 'true';
      const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';

      if (!OLLAMA_ENABLED) {
        // Fallback to a simple algorithmic summary if Ollama is disabled
        const summary = this.createSimpleSummary(text, maxLength);
        return res.json({
          summary,
          originalLength: text.length,
          summaryLength: summary.length,
          readTimeSaved: Math.round((text.length - summary.length) / 1000)
        });
  	  }

      // Call Ollama Mistral for summarization
      
      // === UPDATED PROMPT HERE ===
      const prompt = `
Please rephrase the following notes to be exceptionally concise, clear, and easy to understand.
Act as a personal assistant who is making the notes better. Do not just summarize; restructure the information for maximum clarity and retention.
The final output must be approximately ${maxLength} characters or less.

Notes to rephrase:
---
${text}
---

Rephrased, Clear Notes:
`;
      // ===========================

      console.log('Calling Ollama for rephrasing/clarification...');
      
      const response = await axios.post(`${OLLAMA_URL}/api/generate`, {
        model: 'mistral',
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.4, // Slightly higher temp might encourage better rephrasing
          top_p: 0.9,
          max_tokens: Math.ceil(maxLength * 1.5)
        }
      }, {
        timeout: 30000 // 30 second timeout
      });

      const summary = response.data.response.trim();
      console.log('Notes rephrased successfully');

      res.json({
        summary,
        originalLength: text.length,
        summaryLength: summary.length,
        readTimeSaved: Math.round((text.length - summary.length) / 1000)
      });

    } catch (error) {
      console.error('Rephrasing error:', error.message);
      
      // Fallback to simple summary on error
      const summary = this.createSimpleSummary(text, maxLength);
      
      res.json({
        summary,
        originalLength: text.length,
        summaryLength: summary.length,
        readTimeSaved: Math.round((text.length - summary.length) / 1000),
        note: 'AI rephrasing unavailable, using algorithmic summary'
      });
    }
  }

  // ... (Keep createSimpleSummary method) ...
  createSimpleSummary(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) {
      return text;
    }

    // Split into sentences
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    
    // Take first few sentences that fit within maxLength
    let summary = '';
    for (const sentence of sentences) {
      if (summary.length + sentence.length <= maxLength) {
        summary += sentence;
      } else {
        break;
      }
    }

    // If no sentences fit, take first maxLength characters
    if (summary.length === 0) {
      summary = text.substring(0, maxLength - 3) + '...';
    }

    return summary.trim();
  }
}

// Export the controller class instance
const notesController = new NotesController();
module.exports = notesController;