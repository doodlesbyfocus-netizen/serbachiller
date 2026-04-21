// pages/api/questions.js
// Usa Groq API — tier gratuito, muy rápido

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { subject, difficulty, count } = req.body;
  if (!subject || !difficulty || !count) {
    return res.status(400).json({ error: "Faltan campos requeridos" });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "GROQ_API_KEY no configurada en variables de entorno" });
  }

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama3-70b-8192",
        temperature: 0.7,
        max_tokens: 3000,
        messages: [
          {
            role: "system",
            content: "Eres un generador experto de preguntas para el examen Ser Bachiller de Ecuador. Respondes ÚNICAMENTE con JSON válido, sin texto extra, sin backticks. Las explicaciones deben mencionar la regla o concepto específico que aplica, ser claras y nunca repetir las mismas palabras al comparar opciones.",
          },
          {
            role: "user",
            content: `Genera ${count} preguntas de opción múltiple para el examen Ser Bachiller de Ecuador.
Área: ${subject}
Dificultad: ${difficulty}

Responde SOLO con este JSON exacto:
{"questions":[{"question":"texto de la pregunta","options":["A) opción","B) opción","C) opción","D) opción"],"correct":0,"explanation":"explicación breve de por qué es correcta"}]}

Reglas:
- "correct" es el índice (0, 1, 2 o 3) de la opción correcta
- Las preguntas deben ser del estilo real del examen Ser Bachiller
- "explanation" máximo 2 oraciones claras y educativas
- Genera exactamente ${count} preguntas`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return res.status(502).json({ error: err?.error?.message || `Groq API error ${response.status}` });
    }

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content;

    if (!text) {
      return res.status(502).json({ error: "Respuesta vacía de Groq" });
    }

    // Robust JSON extraction
    let parsed = null;
    try { parsed = JSON.parse(text); } catch {}
    if (!parsed) {
      const clean = text.replace(/```(?:json)?/gi, "").trim();
      try { parsed = JSON.parse(clean); } catch {}
    }
    if (!parsed) {
      const start = text.indexOf("{"), end = text.lastIndexOf("}");
      if (start !== -1 && end !== -1) {
        try { parsed = JSON.parse(text.slice(start, end + 1)); } catch {}
      }
    }

    if (!parsed?.questions?.length) {
      return res.status(502).json({ error: "No se pudo parsear las preguntas. Raw: " + text.slice(0, 200) });
    }

    return res.status(200).json({ questions: parsed.questions });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
