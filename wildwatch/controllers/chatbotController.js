const { GoogleGenerativeAI } = require('@google/generative-ai');

const SYSTEM_PROMPT = `You are WildWatch Assistant, a campus animal safety chatbot for Belgium Campus iTversity in South Africa. You help students report animal sightings, provide safety tips for dangerous animals found on campus (snakes, bees, stray dogs, cockroaches, lizards, ants, spiders, rats), and advise on immediate safety actions. Always recommend contacting campus security (ext. 101) for dangerous animals. Be friendly, concise, and safety-focused. If asked about anything unrelated to campus safety or animals, politely redirect the conversation.`;

// In-memory session store (simple, keyed by IP)
const sessions = new Map();

exports.chatbotPage = (req, res) => {
  res.render('chatbot', { title: 'Safety Chatbot - BC WildWatch' });
};

exports.sendMessage = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Message is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key') {
      return res.json({
        success: true,
        reply: "The AI chatbot is not configured yet. Please set your GEMINI_API_KEY. In the meantime, for campus animal emergencies, contact security at Ext. 101."
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Get or init session history
    const sessionKey = req.ip || 'default';
    if (!sessions.has(sessionKey)) sessions.set(sessionKey, []);
    const history = sessions.get(sessionKey);

    const chat = model.startChat({
      history: [
        { role: 'user', parts: [{ text: SYSTEM_PROMPT }] },
        { role: 'model', parts: [{ text: 'Understood! I am WildWatch Assistant, ready to help with campus animal safety at Belgium Campus iTversity. How can I assist you today?' }] },
        ...history
      ]
    });

    const result = await chat.sendMessage(message);
    const reply = result.response.text();

    // Keep last 10 exchanges
    history.push({ role: 'user', parts: [{ text: message }] });
    history.push({ role: 'model', parts: [{ text: reply }] });
    if (history.length > 20) history.splice(0, 2);
    sessions.set(sessionKey, history);

    res.json({ success: true, reply });
  } catch (err) {
    console.error('Chatbot error:', err);
    res.status(500).json({ success: false, error: 'Failed to get response. Please try again.' });
  }
};
