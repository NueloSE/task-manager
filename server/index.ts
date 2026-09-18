import express from 'express';

const app = express();

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.listen(3001, () => console.log('API running on http://localhost:3001'));
