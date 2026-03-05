async function generateSlideContent(thema, apiKey) {
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
      system: `Du bist ein Instagram Content Creator für einen deutschsprachigen Trading/Finanz-Kanal. Zielgruppe: 35-55 Jahre, Einsteiger & Fortgeschrittene. Stil: direkt, motivierend, lehrreich. Antworte NUR mit validem JSON, kein Markdown, keine Erklärungen.`,
      messages: [
        {
          role: 'user',
          content: `Erstelle Instagram Story Content zum Thema: "${thema}"

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
}`,
        },
      ],
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`API error ${response.status}: ${err}`)
  }

  const data = await response.json()
  const text = data.content[0].text
  return JSON.parse(text)
}

export default generateSlideContent
