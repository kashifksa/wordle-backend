const axios = require('axios');
const config = require('../config');
const logger = require('../utils/logger');

async function generateHints(word) {
  const template = config.ai.promptTemplate;
  const prompt = template.replace('{{WORD}}', word);
  
  try {
    // We assume an OpenAI-compatible API endpoint
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: config.ai.model,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: "json_object" }
      },
      {
        headers: {
          'Authorization': `Bearer ${config.ai.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000 // 15 seconds timeout
      }
    );

    const result = response.data.choices[0].message.content;
    const hints = JSON.parse(result);
    return {
      hint1: hints.hint1 || '',
      hint2: hints.hint2 || '',
      hint3: hints.hint3 || '',
      final_hint: hints.final_hint || ''
    };
  } catch (error) {
    logger.error('Failed to generate hints from AI', error);
    
    if (config.flags.enableFallbackHints) {
      logger.info('Using fallback hints');
      return generateFallbackHints(word);
    }
    
    throw new Error('AI Hint Generation Failed');
  }
}

function generateFallbackHints(word) {
  const w = word.toUpperCase();
  return {
    hint1: `The word has ${w.length} letters.`,
    hint2: `It starts with the letter ${w[0]}.`,
    hint3: `It ends with the letter ${w[w.length - 1]}.`,
    final_hint: `It has these vowels: ${Array.from(new Set(w.match(/[AEIOU]/g) || [])).join(', ')}.`
  };
}

module.exports = {
  generateHints
};
