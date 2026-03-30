const crypto = require('crypto');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const MAX_UPLOAD_MB = Number.parseInt(process.env.MAX_UPLOAD_MB || '15', 10);

const getS3Client = () => {
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
  const region = process.env.S3_REGION || 'auto';
  const endpoint = process.env.S3_ENDPOINT;

  if (!accessKeyId || !secretAccessKey || !process.env.S3_BUCKET) {
    throw new Error('S3 configuration is missing.');
  }

  return new S3Client({
    region,
    endpoint,
    forcePathStyle: String(process.env.S3_FORCE_PATH_STYLE || '').toLowerCase() === 'true',
    credentials: { accessKeyId, secretAccessKey }
  });
};

const sanitizeFilename = (value) => {
  const base = String(value || '').trim().replace(/[^a-zA-Z0-9._-]+/g, '-');
  return base || `file-${Date.now()}`;
};

const buildKey = (purpose, scope, filename) => {
  const safePurpose = String(purpose || 'general').trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-');
  const safeScope = String(scope || 'public').trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-');
  const random = crypto.randomBytes(6).toString('hex');
  return `uploads/${safePurpose}/${safeScope}/${Date.now()}-${random}-${sanitizeFilename(filename)}`;
};

const buildPublicUrl = (key) => {
  const base = process.env.S3_PUBLIC_BASE_URL;
  if (base) {
    return `${base.replace(/\/$/, '')}/${key}`;
  }
  const endpoint = process.env.S3_ENDPOINT;
  const bucket = process.env.S3_BUCKET;
  if (!endpoint || !bucket) return key;

  const normalized = endpoint.replace(/\/$/, '');
  const forcePathStyle = String(process.env.S3_FORCE_PATH_STYLE || '').toLowerCase() === 'true';
  if (forcePathStyle) {
    return `${normalized}/${bucket}/${key}`;
  }

  // Default to virtual-hosted style if possible
  return `${normalized.replace('://', `://${bucket}.`)}/${key}`;
};

const createPresignedUpload = async (req, res, scopeOverride) => {
  try {
    const bucket = process.env.S3_BUCKET;
    if (!bucket) {
      return res.status(500).json({ message: 'S3 bucket is not configured.' });
    }

    const { filename, contentType, purpose = 'verification', size } = req.body || {};
    if (!filename) {
      return res.status(400).json({ message: 'filename is required' });
    }

    if (size && Number(size) > MAX_UPLOAD_MB * 1024 * 1024) {
      return res.status(400).json({ message: `File is too large. Max ${MAX_UPLOAD_MB}MB.` });
    }

    const scope = scopeOverride || (req.user?.userId ? `user-${req.user.userId}` : 'public');
    const key = buildKey(purpose, scope, filename);

    const client = getS3Client();
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType || 'application/octet-stream'
    });

    const uploadUrl = await getSignedUrl(client, command, { expiresIn: 60 * 5 });
    const fileUrl = buildPublicUrl(key);

    return res.json({ uploadUrl, fileUrl, key });
  } catch (error) {
    console.error('Create presigned upload error:', error);
    return res.status(500).json({ message: 'Failed to create upload URL.' });
  }
};

const createPresignedUploadPublic = (req, res) => createPresignedUpload(req, res, 'public');

const createPresignedUploadCompany = (req, res) => createPresignedUpload(req, res, `user-${req.user?.userId || 'company'}`);

module.exports = {
  createPresignedUploadPublic,
  createPresignedUploadCompany
};
