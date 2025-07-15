// Ensure uploads directory exists during deployment
import fs from 'fs';
import path from 'path';

const uploadsDir = path.join(process.cwd(), 'uploads');

// Create uploads directory if it doesn't exist
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Created uploads directory:', uploadsDir);
} else {
  console.log('Uploads directory already exists:', uploadsDir);
}

// Check if uploads directory is writable
try {
  fs.accessSync(uploadsDir, fs.constants.W_OK);
  console.log('Uploads directory is writable');
} catch (err) {
  console.error('Uploads directory is not writable:', err.message);
  process.exit(1);
}

// List current contents
const files = fs.readdirSync(uploadsDir);
console.log('Current uploads:', files.length > 0 ? files : 'No files');

console.log('Upload directory setup completed successfully');