import { Router, Request, Response } from 'express';
import { db } from '../../config/db.js';
import { authenticateJwt } from '../../middleware/auth.middleware.js';
import { parsePagination, formatPaginationMeta } from '../../utils/pagination.js';

const router = Router();

router.use(authenticateJwt);

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { page, limit, offset, cursor } = parsePagination(req, { defaultLimit: 10, maxLimit: 100 });

    let whereClause = '';
    const params: any[] = [];

    if (cursor) {
      whereClause = ` WHERE a.asset_code > $1`;
      params.push(cursor);
    }

    const countRes = await db.query(`SELECT COUNT(*)::int as total FROM assets a ${whereClause}`, params);
    const total = countRes.rows[0]?.total || 0;

    let dataQuery = `
      SELECT a.*, sl.label as category_label
      FROM assets a
      LEFT JOIN system_lookups sl ON a.category_id = sl.id
      ${whereClause}
      ORDER BY a.asset_code ASC
    `;
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
    const pagination = formatPaginationMeta(result.rows, total, page, limit, 'asset_code');

    res.status(200).json({
      success: true,
      count: result.rows.length,
      assets: result.rows,
      data: result.rows,
      pagination,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal mengambil inventaris aset.', error: err.message });
  }
});

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { assetName, categoryId, purchasePrice, physicalCondition, locationRoom, isBorrowable } = req.body;

    const countRes = await db.query(`SELECT COUNT(*)::int as cnt FROM assets`);
    const seq = String((countRes.rows[0]?.cnt || 0) + 1).padStart(3, '0');
    const assetCode = `AST-GMH-${seq}`;

    const insertRes = await db.query(
      `INSERT INTO assets (asset_code, asset_name, category_id, purchase_date, purchase_price, physical_condition, location_room, is_borrowable)
       VALUES ($1, $2, $3, CURRENT_DATE, $4, $5, $6, $7)
       RETURNING *`,
      [
        assetCode,
        assetName,
        categoryId || null,
        purchasePrice ? parseFloat(purchasePrice) : 0,
        physicalCondition || 'GOOD',
        locationRoom || 'Gedung GMH',
        isBorrowable !== undefined ? Boolean(isBorrowable) : true,
      ]
    );

    res.status(201).json({ success: true, message: 'Aset berhasil didaftarkan.', asset: insertRes.rows[0] });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal mendaftarkan aset.', error: err.message });
  }
});

export default router;
