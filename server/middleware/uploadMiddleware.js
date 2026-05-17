const multer = require('multer');
const path = require('path');

// 1. Storage Configuration: Where to save the files?
const storage = multer.diskStorage({
  destination(req, file, cb) {
    // Save to the 'uploads' folder in the root of server
    cb(null, 'uploads/');
  },
  filename(req, file, cb) {
    // Rename file to: fieldname-date.extension (to avoid duplicates)
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

// 2. File Filter: Only allow Images
function checkFileType(file, cb) {
  const filetypes = /jpg|jpeg|png|webp/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb('Error: Images Only!');
  }
}

// 3. The actual middleware function
const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
});

module.exports = upload;