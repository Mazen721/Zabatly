const cloudinary = require('../config/cloudinary.js');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const ALLOWED_IMAGE_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp']);

/** Cloudinary-side guard (multer still filters by MIME first). JPEG is stored as jpg. */
const ALLOWED_CLOUDINARY_FORMATS = ['jpg', 'png', 'webp'];

function imageFileFilter(req, file, cb) {
  if (ALLOWED_IMAGE_MIMES.has(file.mimetype)) {
    return cb(null, true);
  }
  cb(new Error('Only JPEG, PNG, and WebP images are allowed.'));
}

function createUploader(folder) {
  const storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder,
      allowed_formats: ALLOWED_CLOUDINARY_FORMATS,
    },
  });
  return multer({ storage, fileFilter: imageFileFilter });
}

const uploadVehicleImages = createUploader('zabatly/vehicles').array('images', 10);
const uploadProfilePhoto = createUploader('zabatly/profiles').single('profilePhoto');
const uploadKycDocument = createUploader('zabatly/kyc').single('file');
const uploadPaymentProof = createUploader('zabatly/payments').single('paymentProof');

module.exports = {
  uploadVehicleImages,
  uploadProfilePhoto,
  uploadKycDocument,
  uploadPaymentProof,
};
