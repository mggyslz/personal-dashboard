const codeSnippetRepo = require('../db/repositories/codeSnippet.repo');

class CodeSnippetController {
  async create(req, res) {
    try {
      const { title, code, language, description } = req.body;

      if (!title) {
        return res.status(400).json({ 
          error: 'Title is required' 
        });
      }

      if (!code) {
        return res.status(400).json({ 
          error: 'Code is required' 
        });
      }

      const snippet = await codeSnippetRepo.create({
        title,
        code,
        language: language || 'javascript',
        description: description || ''
      });
      
      res.status(201).json(snippet);
    } catch (error) {
      console.error('Create snippet error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getAll(req, res) {
    try {
      const snippets = await codeSnippetRepo.findAll();
      res.json(snippets);
    } catch (error) {
      console.error('Get snippets error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getOne(req, res) {
    try {
      const snippet = await codeSnippetRepo.findById(req.params.id);
      
      if (!snippet) {
        return res.status(404).json({ error: 'Code snippet not found' });
      }

      res.json(snippet);
    } catch (error) {
      console.error('Get snippet error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async update(req, res) {
    try {
      const { title, code, language, description } = req.body;
      const { id } = req.params;

      if (!title) {
        return res.status(400).json({ 
          error: 'Title is required' 
        });
      }

      if (!code) {
        return res.status(400).json({ 
          error: 'Code is required' 
        });
      }

      const snippet = await codeSnippetRepo.update(id, {
        title,
        code,
        language: language || 'javascript',
        description: description || ''
      });

      if (!snippet) {
        return res.status(404).json({ error: 'Code snippet not found' });
      }

      res.json(snippet);
    } catch (error) {
      console.error('Update snippet error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async delete(req, res) {
    try {
      const deleted = await codeSnippetRepo.delete(req.params.id);
      
      if (!deleted) {
        return res.status(404).json({ error: 'Code snippet not found' });
      }

      res.json({ message: 'Code snippet deleted successfully' });
    } catch (error) {
      console.error('Delete snippet error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getLanguages(req, res) {
    try {
      const languages = await codeSnippetRepo.getLanguages();
      res.json(languages);
    } catch (error) {
      console.error('Get languages error:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

const codeSnippetController = new CodeSnippetController();
module.exports = codeSnippetController;