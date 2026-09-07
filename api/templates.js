import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  // 클라이언트에서 전달한 고유 식별자
  const { userId } = req.query;
  
  if (!userId) {
    return res.status(400).json({ error: '사용자 ID가 필요합니다.' });
  }

  try {
    if (req.method === 'GET') {
      const templates = await kv.get(`templates:${userId}`);
      return res.status(200).json(templates || []);
    }
    
    if (req.method === 'POST') {
      const { templates } = req.body;
      // Vercel KV에 JSON 형태로 전체 템플릿 덮어쓰기
      await kv.set(`templates:${userId}`, templates);
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: '허용되지 않은 메서드입니다.' });
  } catch (error) {
    return res.status(500).json({ error: '데이터베이스 연결 오류' });
  }
}