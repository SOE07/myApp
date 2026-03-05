const SYSTEM_PROMPT = `Du bist ein Instagram Content Creator für einen deutschsprachigen Trading/Finanz-Kanal. Zielgruppe: 35-55 Jahre, Einsteiger & Fortgeschrittene. Stil: direkt, motivierend, lehrreich. Antworte NUR mit validem JSON, kein Markdown, keine Erklärungen.`

const USER_PROMPT = (thema) => `Erstelle Instagram Story Content zum Thema: "${thema}"

JSON-Format (exakt so, keine Abweichungen):
{
  "titel": "max 60 Zeichen, starker Hook, keine Anführungszeichen",
  "subheadline": "max 100 Zeichen, ergänzt den Titel",
  "bullets": [
    "Bullet 1 max 80 Zeichen",
    "Bullet 2 max 80 Zeichen",
    "Bullet 3 max 80 Zeichen",
    "Bullet 4 max 80 Zeichen",
    "Bullet 5 max 80 Zeichen"
  ],
  "cta": "max 50 Zeichen, Call-to-Action"
}`

async function callClaude(thema, apiKey) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: USER_PROMPT(thema) }],
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Claude API error ${response.status}: ${err}`)
  }

  const data = await response.json()
  return data.content[0].text
}

async function callGemini(thema, apiKey) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ parts: [{ text: USER_PROMPT(thema) }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 1000 },
      }),
    },
  )

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Gemini API error ${response.status}: ${err}`)
  }

  const data = await response.json()
  return data.candidates[0].content.parts[0].text
}

export async function generateSlideContent(thema, apiKey, provider) {
  const raw = provider === 'gemini'
    ? await callGemini(thema, apiKey)
    : await callClaude(thema, apiKey)

  // Strip markdown code fences if present
  const cleaned = raw.replace(/^```json?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim()
  return JSON.parse(cleaned)
}

export default generateSlideContent
