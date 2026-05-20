import { useState } from 'react';
import axios from 'axios';
import { API } from '../config/api';

const CarLicenseUpload = ({ vehicleId, onVerificationSuccess }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return setError('Please upload the car license image.');

    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    const formData = new FormData();
    formData.append('file', file);
    formData.append('doc_type', 'car_license');
    if (vehicleId) {
      formData.append('vehicleId', vehicleId); // Optional: Tells the backend which car this is (if available)
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

      await axios.post(`${API}/api/users/kyc/verify`, formData, config);
      
      setSuccess(true);
      if (onVerificationSuccess) onVerificationSuccess(); // Trigger parent component to move forward

    } catch (err) {
      setError(
        err.response?.data?.message || 
        err.response?.data?.reason || 
        'Failed to verify car license. Ensure the image is clear.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-green-50 p-6 rounded-2xl text-center border border-green-200">
        <h3 className="text-xl font-extrabold text-green-900 mb-2">🚗 Car License Verified!</h3>
        <p className="text-sm font-medium text-green-700">Your vehicle is now legally registered on Zabatly.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 mt-6">
      <h3 className="text-xl font-extrabold text-slate-900 mb-2">Step 2: Vehicle Registration (OCR)</h3>
      <p className="text-sm text-slate-500 font-medium mb-6">Upload the official car license for AI verification.</p>

      {error && <p className="text-sm font-bold text-red-600 bg-red-50 p-3 rounded-lg mb-4">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input 
          type="file" 
          onChange={(e) => setFile(e.target.files[0])} 
          accept="image/*"
          className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 rounded-full font-extrabold transition-all ${
            loading ? 'bg-slate-200 text-slate-500' : 'bg-slate-900 text-white hover:bg-slate-800'
          }`}
        >
          {loading ? 'Scanning...' : 'Verify Car License'}
        </button>
      </form>
    </div>
  );
};

export default CarLicenseUpload;