const aiService = require('../services/ai.service');

class AnalyzeController {
  async analyze(req, res) {
    try {
      const { text } = req.body;

      if (!text) {
        return res.status(400).json({ error: 'Text is required' });
      }

      const analysis = await aiService.analyze(text);
      res.json(analysis);
    } catch (error) {
      console.error('Analyze error:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new AnalyzeController();