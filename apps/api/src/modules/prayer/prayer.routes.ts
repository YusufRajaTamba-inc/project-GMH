import { Router, Request, Response } from 'express';
import { db } from '../../config/db.js';
import { authenticateJwt } from '../../middleware/auth.middleware.js';
import { publicSubmissionRateLimiter } from '../../middleware/rateLimit.middleware.js';
import { parsePagination, formatPaginationMeta } from '../../utils/pagination.js';

const router = Router();

// Public prayer request submission (anti-spam rate limited)
router.post('/public/submit', publicSubmissionRateLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { senderName, senderPhone, senderEmail, isAnonymous, prayerContent } = req.body;
    if (!prayerContent) {
      res.status(400).json({ success: false, message: 'Pokok doa wajib diisi.' });
      return;
    }

    const result = await db.query(
      `INSERT INTO prayer_requests (sender_name, sender_phone, sender_email, is_anonymous, prayer_content, status)
       VALUES ($1, $2, $3, $4, $5, 'NEW')
       RETURNING id, sender_name, is_anonymous, status, created_at`,
      [senderName || 'Hamba Tuhan (Anonim)', senderPhone || null, senderEmail || null, Boolean(isAnonymous), prayerContent]
    );

    res.status(201).json({
      success: true,
      message: 'Pokok doa telah kami terima dan akan didoakan oleh tim pendoa yayasan.',
      data: result.rows[0],
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal mengirim pokok doa.', error: err.message });
  }
});

// Admin management
router.get('/', authenticateJwt, async (req: Request, res: Response): Promise<void> => {
  try {
    const { page, limit, offset, cursor } = parsePagination(req, { defaultLimit: 10, maxLimit: 100 });

    let whereClause = '';
    const params: any[] = [];

    if (cursor) {
      whereClause = ` WHERE created_at < $1`;
      params.push(cursor);
    }

    const countRes = await db.query(`SELECT COUNT(*)::int as total FROM prayer_requests ${whereClause}`, params);
    const total = countRes.rows[0]?.total || 0;

    let dataQuery = `SELECT * FROM prayer_requests ${whereClause} ORDER BY created_at DESC`;
    const dataParams = [...params];

    if (!cursor) {
      dataParams.push(limit);
      dataQuery += ` LIMIT $${dataParams.length}`;
      dataParams.push(offset);
      dataQuery += ` OFFSET $${dataParams.length}`;
    } else {
      dataParams.push(limit);
      dataQuery += ` LIMIT $${dataParams.length}`;
    }

    const result = await db.query(dataQuery, dataParams);
    const pagination = formatPaginationMeta(result.rows, total, page, limit, 'created_at');

    res.status(200).json({
      success: true,
      count: result.rows.length,
      prayers: result.rows,
      data: result.rows,
      pagination,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal memuat permohonan doa.', error: err.message });
  }
});

router.put('/:id/status', authenticateJwt, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, counselorNotes, answeredNotes } = req.body;
    const noteVal = counselorNotes !== undefined ? counselorNotes : answeredNotes;

    let query: string;
    let params: any[];

    if (noteVal !== undefined) {
      query = `UPDATE prayer_requests 
               SET status = $1, counselor_notes = $2
               WHERE id = $3
               RETURNING *`;
      params = [status, noteVal && String(noteVal).trim() ? String(noteVal).trim() : null, id];
    } else {
      query = `UPDATE prayer_requests 
               SET status = $1
               WHERE id = $2
               RETURNING *`;
      params = [status, id];
    }

    const result = await db.query(query, params);
    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal memperbarui status doa.', error: err.message });
  }
});


export default router;
