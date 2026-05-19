const express = require('express');
const router = express.Router();
const multer = require('multer');
const supabase = require('../lib/supabase');
const { authenticate } = require('../middleware/auth');

// Multer: memory storage (then upload to Supabase Storage / Cloudinary)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/', 'application/pdf', 'application/msword', 'application/vnd', 'text/', 'video/'];
    const isAllowed = allowed.some(type => file.mimetype.startsWith(type));
    cb(isAllowed ? null : new Error('File type not allowed'), isAllowed);
  },
});

// POST /api/files/upload
router.post('/upload', authenticate, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file provided' });

    const { entity_type, entity_id } = req.body;
    const fileName = `${Date.now()}-${req.file.originalname.replace(/\s/g, '_')}`;
    const filePath = `${entity_type || 'misc'}/${req.user.id}/${fileName}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('pm-files')
      .upload(filePath, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage.from('pm-files').getPublicUrl(filePath);

    // Save to files table
    const { data: fileRecord, error: dbError } = await supabase
      .from('files')
      .insert({
        name: req.file.originalname,
        url: publicUrl,
        size: req.file.size,
        mime_type: req.file.mimetype,
        entity_type,
        entity_id,
        uploaded_by: req.user.id,
      })
      .select()
      .single();

    if (dbError) throw dbError;
    res.status(201).json(fileRecord);
  } catch (err) {
    console.error('File upload error:', err);
    res.status(500).json({ error: err.message || 'Upload failed' });
  }
});

// GET /api/files
router.get('/', authenticate, async (req, res) => {
  try {
    const { entity_type, entity_id } = req.query;
    let query = supabase.from('files').select('*, uploader:profiles(id, full_name)').order('created_at', { ascending: false });
    if (entity_type) query = query.eq('entity_type', entity_type);
    if (entity_id) query = query.eq('entity_id', entity_id);
    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (err) { res.status(500).json({ error: 'Failed to fetch files' }); }
});

// DELETE /api/files/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { data: file } = await supabase.from('files').select('*').eq('id', req.params.id).single();
    if (!file) return res.status(404).json({ error: 'File not found' });
    if (file.uploaded_by !== req.user.id && !['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    await supabase.from('files').delete().eq('id', req.params.id);
    res.json({ message: 'File deleted' });
  } catch (err) { res.status(500).json({ error: 'Failed to delete file' }); }
});

module.exports = router;
