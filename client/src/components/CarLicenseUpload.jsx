import { useState } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { API } from '../config/api';

const ALLOWED_KYC_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_KYC_SIZE_MB = 10;

const CarLicenseUpload = ({ vehicleId, onVerificationSuccess }) => {
  const { t } = useTranslation('profile');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [fileError, setFileError] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;

    // Reset errors
    setFileError('');
    setError('');

    // Validate file type
    if (!ALLOWED_KYC_TYPES.includes(selected.type)) {
      setFileError(
        t('carLicense.errors.fileType', 'Only JPG, PNG, and WebP images are supported. Please convert your file and try again.')
      );
      setFile(null);
      if (preview) URL.revokeObjectURL(preview);
      setPreview(null);
      return;
    }

    // Validate file size
    const sizeMB = selected.size / (1024 * 1024);
    if (sizeMB > MAX_KYC_SIZE_MB) {
      setFileError(
        t('carLicense.errors.fileSize', `File is too large (${sizeMB.toFixed(1)}MB). Maximum size is ${MAX_KYC_SIZE_MB}MB.`)
      );
      setFile(null);
      if (preview) URL.revokeObjectURL(preview);
      setPreview(null);
      return;
    }

    // Set file and create preview
    setFile(selected);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(selected));
  };

  const clearFile = () => {
    setFile(null);
    setFileError('');
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return setError(t('carLicense.errors.required', 'Please upload the car license image.'));
    if (fileError) return;

    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    const formData = new FormData();
    formData.append('file', file);
    formData.append('doc_type', 'car_license');
    if (vehicleId) {
      formData.append('vehicleId', vehicleId);
    }

    try {
      setLoading(true);
      setError('');
      
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${userInfo.token}`,
        },
      };

      const { data } = await axios.post(`${API}/api/users/kyc/verify`, formData, config);
      
      setSuccess(true);
      if (onVerificationSuccess) onVerificationSuccess();

    } catch (err) {
      const serverMsg =
        err.response?.data?.message ||
        err.response?.data?.reason ||
        '';
      const suggestions = err.response?.data?.suggestions;

      if (suggestions && suggestions.length > 0) {
        setError(suggestions.join(' '));
      } else if (serverMsg) {
        setError(serverMsg);
      } else {
        setError(
          t('carLicense.errors.verify', 'Failed to verify car license. Please use a clear, well-lit photo.')
        );
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-green-50 p-6 rounded-2xl text-center border border-green-200">
        <h3 className="text-xl font-extrabold text-green-900 mb-2">{t('carLicense.verifiedTitle', 'Car License Verified!')}</h3>
        <p className="text-sm font-medium text-green-700">{t('carLicense.verifiedBody', 'Your vehicle is now legally registered on Zabatly.')}</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 mt-6">
      <h3 className="text-xl font-extrabold text-slate-900 mb-2">{t('carLicense.title', 'Step 2: Vehicle Registration (OCR)')}</h3>
      <p className="text-sm text-slate-500 font-medium mb-4">{t('carLicense.subtitle', 'Upload the official car license for AI verification.')}</p>

      {/* Upload guidance */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-4">
        <p className="text-xs font-semibold text-blue-800 mb-1">
          {t('carLicense.guidanceTitle', '📷 Tips for a successful scan:')}
        </p>
        <ul className="text-xs text-blue-700 space-y-0.5 list-disc list-inside">
          <li>{t('carLicense.tip1', 'Use good lighting — avoid shadows on the document.')}</li>
          <li>{t('carLicense.tip2', 'Avoid glare — tilt the document if it has a glossy surface.')}</li>
          <li>{t('carLicense.tip3', 'Keep the entire document visible and in focus.')}</li>
          <li>{t('carLicense.tip4', 'Supported formats: JPG, PNG, WebP (max 10MB).')}</li>
        </ul>
      </div>

      {error && <p className="text-sm font-bold text-red-600 bg-red-50 p-3 rounded-lg mb-4">{error}</p>}
      {fileError && <p className="text-sm font-bold text-red-600 bg-red-50 p-3 rounded-lg mb-4">{fileError}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input 
          type="file" 
          onChange={handleFileChange} 
          accept="image/jpeg,image/png,image/webp"
          className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />

        {/* Image preview */}
        {preview && (
          <div className="relative rounded-xl border border-slate-200 overflow-hidden bg-slate-50">
            <img
              src={preview}
              alt="Car license preview"
              className="w-full max-h-48 object-contain"
            />
            <button
              type="button"
              onClick={clearFile}
              className="absolute top-2 right-2 bg-white/90 border border-slate-200 rounded-full w-6 h-6 flex items-center justify-center text-slate-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
              aria-label="Remove selected file"
            >
              <svg width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M2.5 2.5l9 9M11.5 2.5l-9 9" />
              </svg>
            </button>
            <p className="text-xs text-slate-400 text-center py-1.5">
              {t('carLicense.previewHint', 'Check that the document is clear and fully visible before uploading.')}
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !!fileError}
          className={`w-full py-3 rounded-full font-extrabold transition-all ${
            loading || fileError ? 'bg-slate-200 text-slate-500' : 'bg-slate-900 text-white hover:bg-slate-800'
          }`}
        >
          {loading ? t('carLicense.scanning', 'Scanning...') : t('carLicense.verify', 'Verify Car License')}
        </button>
      </form>
    </div>
  );
};

export default CarLicenseUpload;
