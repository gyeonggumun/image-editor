import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  const { userId } = req.query;
  
  if (!userId || typeof userId !== 'string' || userId.length > 128 || !/^[\w-]+$/.test(userId)) {
    return res.status(400).json({ error: '사용자 ID가 필요합니다.' });
  }

  const storageAvailable = Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

  try {
    if (req.method === 'GET') {
      if (!storageAvailable) return res.status(200).json({ templates: [], storageAvailable: false });
      const templates = await kv.get(`templates:${userId}`);
      return res.status(200).json({ templates: Array.isArray(templates) ? templates : [], storageAvailable: true });
    }
    
    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
      const { templates } = body;
      if (!Array.isArray(templates) || templates.length > 100) {
        return res.status(400).json({ error: '템플릿 목록 형식이 올바르지 않습니다.' });
      }
      if (!storageAvailable) return res.status(200).json({ success: false, storageAvailable: false });
      await kv.set(`templates:${userId}`, templates);
      return res.status(200).json({ success: true, storageAvailable: true });
    }

    return res.status(405).json({ error: '허용되지 않은 메서드입니다.' });
  } catch {
    return res.status(500).json({ error: '데이터베이스 연결 오류' });
  }
}
