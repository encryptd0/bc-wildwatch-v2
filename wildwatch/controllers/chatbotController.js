const Groq = require('groq-sdk');

const SYSTEM_PROMPT = `You are WildWatch Assistant, a campus animal safety chatbot for Belgium Campus iTversity in South Africa. You help students report animal sightings, provide safety tips for dangerous animals found on campus (snakes, bees, stray dogs, cockroaches, lizards, ants, spiders, rats), and advise on immediate safety actions. Always recommend contacting campus security (ext. 101) for dangerous animals. Be friendly, concise, and safety-focused. If asked about anything unrelated to campus safety or animals, politely redirect the conversation.`;

exports.chatbotPage = (req, res) => {
  res.render('chatbot', { title: 'Safety Chatbot - BC WildWatch' });
};

exports.sendMessage = async (req, res) => {
  try {
    const { message, history: clientHistory } = req.body;
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Message is required' });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return res.json({
        success: true,
        reply: "The AI chatbot is not configured yet. For campus animal emergencies, contact security at Ext. 101."
      });
    }

    const groq = new Groq({ apiKey });

    // Build messages array from client-side history
    const history = Array.isArray(clientHistory) ? clientHistory.slice(-20) : [];
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.map(h => ({ role: h.role === 'model' ? 'assistant' : h.role, content: h.parts[0].text })),
      { role: 'user', content: message }
    ];

    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages,
      max_tokens: 512,
      temperature: 0.7
    });

    const reply = completion.choices[0].message.content;
    res.json({ success: true, reply });
  } catch (err) {
    console.error('Chatbot error:', err);
    res.status(500).json({ success: false, error: 'Failed to get response. Please try again.' });
  }
};
