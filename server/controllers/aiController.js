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

const buildConciergePrompt = (message, fleetData) => `
      You are an elite, highly intelligent car rental concierge for 'Zabatly', operating in Alexandria, Egypt.
      Your goal is to recommend the perfect vehicle from our garage based on the user's request.

      === CURRENT USER REQUEST ===
      ${message}

      === AVAILABLE FLEET ===
      ${fleetData}

      === INSTRUCTIONS ===
      1. BE DECISIVE: Pick the 1 or 2 absolute BEST matches from the available fleet. 
      2. JUSTIFY YOUR CHOICE: Explain exactly WHY you chose this car. Keep your tone professional, modern, and helpful.
      3. CRITICAL RULE: NEVER mention, show, or type the raw Vehicle ID in your "reply" text. The user does not want to see database IDs. Only use the car's Make and Model when talking to the user. The ID should ONLY be used inside the "recommended_ids" array.
      4. STRICT JSON FORMAT: You MUST return a valid JSON object matching this exact structure:
      {
        "reply": "Your conversational response here (NO IDs ALLOWED)...",
        "savings_tip": "A smart, short tip about renting this car or driving in Alexandria...",
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
    const prompt = buildConciergePrompt(message, fleetData);

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
