const axios = require('axios'); 
const Vehicle = require('../models/vehicle'); // Make sure the filename matches your actual model file
const {
  CHAT_MODEL,
  generateGeminiJson,
  hasGeminiApiKey,
} = require('../utils/geminiFallback');

const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(String(id || ''));

const getRecommendedVehicles = async (recommendedIds = []) => {
  const ids = Array.isArray(recommendedIds)
    ? recommendedIds.filter(isValidObjectId)
    : [];

  if (ids.length === 0) return [];

  return Vehicle.find({
    _id: { $in: ids }
  });
};

const parseOllamaResponse = (response) => {
  const raw = response?.data?.response;

  if (!raw || typeof raw !== 'string' || raw.trim() === '') {
    throw new Error('Ollama returned an empty response.');
  }

  return JSON.parse(raw);
};

const buildConciergePrompt = (message, history, fleetData) => `
      You are a friendly, highly intelligent car rental concierge for 'Zabatly' in Egypt.
      Your goal is to help the user find the right vehicle from our garage without guessing.

      === CURRENT USER REQUEST ===
      ${message}

      === CONVERSATION HISTORY ===
      ${history || 'No previous messages.'}

      === AVAILABLE FLEET ===
      ${fleetData}

      === INSTRUCTIONS ===
      1. CLARIFY FIRST: If the user request is vague or missing important details, ask 2 to 4 short follow-up questions instead of recommending a random car.
         Important details include budget, city/pickup area, dates or duration, passenger count, vehicle type, automatic/manual, and driver preference.
         Example vague request: "I need only a car". Good reply: "Got you. Quick questions so I do not throw a random car at you: what is your budget, pickup city, passenger count, and do you prefer SUV or sedan?"
         When clarifying, return an empty "recommended_ids" array.
      2. BE DECISIVE WHEN READY: If the history and request give enough detail, pick the 1 or 2 best matches from the available fleet.
      3. KEEP IT SHORT: Write like a helpful chat assistant. Use a summarized response with only the important points. Avoid long paragraphs, repeated details, and extra explanations.
      4. JUSTIFY BRIEFLY: For each recommended car, give only 1 or 2 practical reasons.
      5. CRITICAL RULE: NEVER mention, show, or type the raw Vehicle ID in your "reply" text. The user does not want to see database IDs. Only use the car's Make and Model when talking to the user. The ID should ONLY be used inside the "recommended_ids" array.
      6. STRICT JSON FORMAT: You MUST return a valid JSON object matching this exact structure:
      {
        "reply": "Your short conversational response here (NO IDs ALLOWED)...",
        "savings_tip": "A smart, short rental tip, or an empty string if you are asking follow-up questions...",
        "recommended_ids": ["insert_vehicle_id_1"]
      }
      Do not output any other text outside the JSON object.
    `;

const callOllama = async (prompt) => {
  const response = await axios.post('http://127.0.0.1:11434/api/generate', {
    model: "llama3", // Specifically calling the model you downloaded
    prompt: prompt,
    stream: false,
    format: "json" // Forces Ollama to reply in strict JSON format
  }, { timeout: 60000 });

  return parseOllamaResponse(response);
};

const callGeminiFallback = async (prompt) => {
  const geminiPrompt = `${prompt}

      Gemini fallback reminder:
      Return strict JSON only with exactly these keys: "reply", "savings_tip", "recommended_ids".
      "recommended_ids" must contain only MongoDB ObjectId strings copied from the fleet context.
      The user-facing "reply" must never include raw IDs.`;

  return generateGeminiJson(CHAT_MODEL, geminiPrompt);
};

// @desc    Calculate best vehicle combination using Local Ollama AI (Llama 3)
// @route   POST /api/chat
const getTripPlan = async (req, res) => {
  const { message, history } = req.body; 

  if (!message) {
    return res.status(400).json({
      reply: "Please provide a message so I can help you plan!",
      vehicles: [],
      savings_tip: ""
    });
  }

  try {
    // 1. Get the available fleet
    const availableVehicles = await Vehicle.find({ isAvailable: true }).limit(30); 

    if (availableVehicles.length === 0) {
      return res.json({ 
        reply: "Sorry, we currently don't have any vehicles available in the garage.", 
        vehicles: [],
        savings_tip: ""
      });
    }

    // 2. Format the fleet data so Llama 3 can read it
    const fleetData = availableVehicles.map(v => 
      `ID: ${v._id} | Make: ${v.make} | Model: ${v.model} | Type: ${v.type} | Capacity: ${v.capacity || '4'} seats | Price: ${v.price_per_day} EGP/day | Driver Available: ${v.has_driver ? 'Yes' : 'No'}`
    ).join('\n');

    // 3. The Mega-Prompt for Llama 3
    const prompt = buildConciergePrompt(message, history, fleetData);

    let aiResponse;
    let ollamaError;

    try {
      // 4. Talk to the Local Ollama Server (Using 127.0.0.1 to avoid network bugs)
      aiResponse = await callOllama(prompt);
      console.log('AI chat provider used: ollama');
    } catch (error) {
      ollamaError = error;
      console.error("Ollama AI Logic Failed:", error.message);

      if (!hasGeminiApiKey()) {
        if (error.code === 'ECONNREFUSED') {
          return res.status(500).json({
            reply: "My local AI engine is currently offline. Please open the Ollama app!",
            vehicles: [],
            savings_tip: ""
          });
        }

        return res.status(500).json({
          reply: "Sorry, my AI brain is having trouble right now. Please try again!",
          vehicles: [],
          savings_tip: ""
        });
      }

      try {
        aiResponse = await callGeminiFallback(prompt);
        console.log('AI chat provider used: gemini');
      } catch (geminiError) {
        console.error("Gemini AI Fallback Failed:", geminiError.message);

        if (ollamaError.code === 'ECONNREFUSED') {
          return res.status(500).json({
            reply: "My local AI engine is currently offline, and the cloud fallback is unavailable. Please try again soon.",
            vehicles: [],
            savings_tip: ""
          });
        }

        return res.status(500).json({
          reply: "Sorry, my AI brain is having trouble right now. Please try again!",
          vehicles: [],
          savings_tip: ""
        });
      }
    }

    // 6. Fetch the actual full vehicle objects from the DB using the IDs Llama 3 chose
    const recommendedVehicles = await getRecommendedVehicles(aiResponse.recommended_ids);

    // 7. Send the smart response back to your React frontend!
    res.json({
      reply: aiResponse.reply || "Here is what I found for you!",
      vehicles: recommendedVehicles, 
      savings_tip: aiResponse.savings_tip || ""
    });

  } catch (error) {
    console.error("AI chat request failed:", error.message);

    res.status(500).json({ 
      reply: "Sorry, my AI brain is having trouble right now. Please try again!", 
      vehicles: [],
      savings_tip: ""
    });
  }
};

module.exports = { getTripPlan };
