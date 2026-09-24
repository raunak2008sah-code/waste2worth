import { Router, Response } from 'express';
import crypto from 'node:crypto';
import { db } from '../db';
import { aiService } from '../services/aiService';
import { analyticsService } from '../services/analyticsService';
import { upload } from '../middleware/upload';
import { optionalAuthMiddleware, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Standard Supported Material Types
export const SUPPORTED_MATERIALS = [
  'Cardboard',
  'Paper',
  'Plastic bottle',
  'Plastic container',
  'Plastic wrapper',
  'Plastic packaging',
  'Glass',
  'Metal',
  'Old clothes/textiles',
  'Wood',
  'Electronic waste',
  'Packaging',
  'Rubber',
  'Organic waste',
  'Food/fruit/vegetable waste',
  'Mixed waste',
  'Other'
];

router.get('/materials', (req, res) => {
  res.json({ materials: SUPPORTED_MATERIALS });
});

// Scan Waste Upload & Analysis
router.post('/', optionalAuthMiddleware, upload.single('image'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const file = req.file;
    const samplePreset = req.body.samplePreset; // Allow sample preset selection for instant testing
    const sampleUrl = req.body.imageUrl;

    if (!file && !samplePreset && !sampleUrl) {
      return res.status(400).json({ error: 'Please provide an image or select a sample waste preset.' });
    }

    const imageUrl = file ? `/uploads/${file.filename}` : (sampleUrl || '/sample-waste.jpg');
    const imageHint = samplePreset || (file ? file.originalname : 'cardboard');

    analyticsService.track('scan_started', req.user?.id, { hint: imageHint });

    // AI identification
    const analysis = await aiService.identifyWaste(file ? file.filename : imageHint, imageHint);

    const scanId = crypto.randomUUID();
    const rawResultJson = JSON.stringify(analysis.raw_ai_result);
    const categoriesJson = JSON.stringify(analysis.categories);
    const safetyJson = JSON.stringify(analysis.safety_notes);

    db.prepare(`
      INSERT INTO waste_scans (
        id, user_id, image_url, detected_material, confidence, condition, 
        is_reusable, categories, safety_notes, raw_ai_result
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      scanId,
      req.user?.id || null,
      imageUrl,
      analysis.material,
      analysis.confidence,
      analysis.condition,
      analysis.is_reusable ? 1 : 0,
      categoriesJson,
      safetyJson,
      rawResultJson
    );

    analyticsService.track('scan_completed', req.user?.id, {
      scanId,
      material: analysis.material,
      confidence: analysis.confidence
    });

    res.status(201).json({
      scan: {
        id: scanId,
        imageUrl,
        detected_material: analysis.material,
        subtype: analysis.subtype,
        confidence: analysis.confidence,
        confidence_percent: Math.round(analysis.confidence * 100),
        condition: analysis.condition,
        is_reusable: analysis.is_reusable,
        categories: analysis.categories,
        safety_notes: analysis.safety_notes,
        possible_uses: analysis.possible_uses,
        is_mock: analysis.is_mock,
        ai_provider: aiService.getProviderName()
      }
    });
  } catch (err: any) {
    console.error('Scan processing error:', err);
    res.status(500).json({ error: 'Unable to analyze image. Please try again with clear lighting.' });
  }
});

// Get Scan by ID
router.get('/:id', (req, res) => {
  const scan = db.prepare('SELECT * FROM waste_scans WHERE id = ?').get(req.params.id) as any;
  if (!scan) {
    return res.status(404).json({ error: 'Scan record not found' });
  }

  res.json({
    scan: {
      ...scan,
      categories: scan.categories ? JSON.parse(scan.categories) : [],
      safety_notes: scan.safety_notes ? JSON.parse(scan.safety_notes) : [],
      raw_ai_result: scan.raw_ai_result ? JSON.parse(scan.raw_ai_result) : {}
    }
  });
});

// Manual correction of detected material (Section 6)
router.post('/:id/correct', optionalAuthMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { correctedMaterial } = req.body;
    if (!correctedMaterial || typeof correctedMaterial !== 'string') {
      return res.status(400).json({ error: 'Please provide a valid material name' });
    }

    const scan = db.prepare('SELECT * FROM waste_scans WHERE id = ?').get(req.params.id) as any;
    if (!scan) {
      return res.status(404).json({ error: 'Scan not found' });
    }

    db.prepare(`
      UPDATE waste_scans 
      SET user_corrected_material = ?,
          detected_material = ?
      WHERE id = ?
    `).run(correctedMaterial, correctedMaterial, scan.id);

    // Re-generate updated analysis profile for the corrected material
    const updatedAnalysis = await aiService.identifyWaste(correctedMaterial, correctedMaterial);

    res.json({
      message: 'Material corrected successfully',
      scan: {
        id: scan.id,
        imageUrl: scan.image_url,
        detected_material: correctedMaterial,
        subtype: updatedAnalysis.subtype,
        confidence: 1.0,
        condition: updatedAnalysis.condition,
        is_reusable: updatedAnalysis.is_reusable,
        categories: updatedAnalysis.categories,
        safety_notes: updatedAnalysis.safety_notes,
        possible_uses: updatedAnalysis.possible_uses
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update material correction' });
  }
});

// User's past scans
router.get('/my/history', optionalAuthMiddleware, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.json({ scans: [] });
  }

  const scans = db.prepare(`
    SELECT id, image_url, detected_material, confidence, condition, created_at
    FROM waste_scans
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 20
  `).all(req.user.id);

  res.json({ scans });
});

export default router;
