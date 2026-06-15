const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const CHAT_MODEL = 'gemini-3.1-flash-lite';
const OCR_MODEL = 'gemini-3.5-flash';
const OCR_FALLBACK_MODEL = 'gemini-3.1-flash-lite';

const MIME_TYPES = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

const hasGeminiApiKey = () => Boolean(process.env.GEMINI_API_KEY);

const getGeminiClient = () => {
  if (!hasGeminiApiKey()) {
    throw new Error('GEMINI_API_KEY is not configured.');
  }
  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
};

const stripJsonMarkdown = (text = '') => {
  const trimmed = String(text).trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced ? fenced[1].trim() : trimmed;
};

const extractJsonObject = (text = '') => {
  const cleaned = stripJsonMarkdown(text);
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');

  if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
    throw new Error('Gemini did not return a JSON object.');
  }

  return cleaned.slice(firstBrace, lastBrace + 1);
};

const parseGeminiJson = (text = '') => JSON.parse(extractJsonObject(text));

const generateGeminiJson = async (modelName, prompt) => {
  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature: 0.2,
      responseMimeType: 'application/json',
    },
  });

  const result = await model.generateContent(prompt);
  return parseGeminiJson(result.response.text());
};

const getImageMimeType = (filePath, fallback = 'image/jpeg') => {
  const ext = path.extname(filePath || '').toLowerCase();
  return MIME_TYPES[ext] || fallback;
};

const generateGeminiVisionJson = async (modelName, prompt, filePath, mimeType, useFallback = true) => {
  const genAI = getGeminiClient();
  const imageBytes = fs.readFileSync(filePath);

  // Warn if image is very large — may cause slower processing
  const sizeMB = imageBytes.length / (1024 * 1024);
  if (sizeMB > 4) {
    console.warn(`Gemini OCR: Large image (${sizeMB.toFixed(1)}MB). Processing may be slower.`);
  }

  const tryModel = async (currentModelName) => {
    const model = genAI.getGenerativeModel({
      model: currentModelName,
      generationConfig: {
        temperature: 0.1,
        responseMimeType: 'application/json',
      },
    });

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: imageBytes.toString('base64'),
          mimeType: mimeType || getImageMimeType(filePath),
        },
      },
    ]);

    return parseGeminiJson(result.response.text());
  };

  try {
    return await tryModel(modelName);
  } catch (error) {
    if (useFallback && modelName === OCR_MODEL) {
      console.warn(`Gemini OCR with ${modelName} failed. Falling back to ${OCR_FALLBACK_MODEL}. Error: ${error.message}`);
      return await tryModel(OCR_FALLBACK_MODEL);
    }
    throw error;
  }
};

module.exports = {
  CHAT_MODEL,
  OCR_MODEL,
  OCR_FALLBACK_MODEL,
  generateGeminiJson,
  generateGeminiVisionJson,
  getImageMimeType,
  hasGeminiApiKey,
  parseGeminiJson,
  stripJsonMarkdown,
};
