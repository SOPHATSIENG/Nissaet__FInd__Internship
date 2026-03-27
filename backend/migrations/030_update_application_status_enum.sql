-- Add shortlisted and unshortlisted statuses to applications
ALTER TABLE applications
  MODIFY COLUMN status ENUM(
    'pending',
    'reviewing',
    'accepted',
    'shortlisted',
    'unshortlisted',
    'rejected',
    'withdrawn'
  ) DEFAULT 'pending';
