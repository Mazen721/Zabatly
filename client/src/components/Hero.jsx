import { useState } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { API } from '../config/api';

const Hero = () => {
  const { t } = useTranslation('ai');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null); // Stores the AI response

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query) return;

    setLoading(true);
    setAiResult(null); // Clear previous results

    try {
      // 1. Send the user's sentence to your AI Backend
      const { data } = await axios.post(`${API}/api/chat`, {
        message: query
      });

      // 2. Save the AI's smart answer
      setAiResult(data);
    } catch (error) {
      console.error("AI Error:", error);
      alert(t('aiError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative bg-blue-900 min-h-[600px] flex flex-col items-center justify-center text-white pb-20">
      {/* Background Overlay */}
      <div className="absolute inset-0 bg-black opacity-50"></div>

      {/* Main Content */}
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto mt-20">
        <h1 className="text-4xl md:text-6xl font-bold mb-4">
          {t('heroTitle')}
        </h1>
        <p className="text-xl mb-8 text-gray-200">
          {t('heroDescription')}
        </p>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex bg-white rounded-full overflow-hidden p-1 shadow-lg mb-10">
          <input 
            type="text" 
            placeholder={t('heroPlaceholder')}
            className="flex-grow px-6 py-4 text-gray-800 outline-none text-lg"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button 
            type="submit" 
            disabled={loading}
            className={`${loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'} text-white px-8 py-3 rounded-full font-bold transition flex items-center gap-2`}
          >
            {loading ? t('thinking') : t('planTrip')}
          </button>
        </form>

        {/* AI RESULTS SECTION (The Magic Part) */}
        {aiResult && (
          <div className="bg-white text-left text-gray-800 rounded-xl shadow-2xl p-6 animate-fade-in-up">
            <div className="flex items-start gap-4">
              <div className="bg-blue-100 p-3 rounded-full text-2xl">🤖</div>
              <div>
                <h3 className="text-xl font-bold text-blue-900 mb-2">{t('recommendation')}</h3>
                <p className="text-lg leading-relaxed mb-4">{aiResult.reply}</p>
                
                {/* Savings Tip Badge */}
                {aiResult.savings_tip && (
                  <span className="inline-block bg-green-100 text-green-800 text-sm font-bold px-3 py-1 rounded-full mb-4">
                    💰 {aiResult.savings_tip}
                  </span>
                )}
              </div>
            </div>

            {/* Suggested Vehicles Grid */}
            {aiResult.vehicles.length > 0 && (
              <div className="mt-6 border-t pt-6">
                <h4 className="font-bold text-gray-600 mb-4">{t('recommendedVehicles')}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {aiResult.vehicles.map((car) => (
                    <div key={car._id} className="border rounded-lg p-3 flex gap-3 hover:bg-gray-50 transition">
                      {/* Thumbnail */}
                      <img 
                        src={car.images?.[0]} 
                        alt={car.make} 
                        className="w-20 h-20 object-cover rounded-md bg-gray-200"
                      />
                      {/* Car Info */}
                      <div>
                        <h5 className="font-bold">{car.make} {car.model}</h5>
                        <p className="text-sm text-gray-500">{car.type} • {car.capacity} {t('seats')}</p>
                        <p className="text-blue-600 font-bold mt-1">{car.price_per_day} EGP <span className="text-xs font-normal text-gray-400">{t('perDay')}</span></p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Hero;
