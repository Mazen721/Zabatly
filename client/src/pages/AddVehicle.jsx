import { useState, useCallback, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { API } from '../config/api';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import {
  EGYPT_COUNTRY,
  getGovernorateNames,
  getCitiesByGovernorate,
  getCityCoordinates,
} from '../data/egyptLocations';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

function LocationPicker({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      onLocationSelect({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

function MapRecenter({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, { animate: true });
  }, [center, zoom, map]);
  return null;
}

async function reverseGeocode(lat, lng) {
  try {
    const { data } = await axios.get(`${API}/api/geocode/reverse`, {
      params: { lat, lng },
    });
    return data.address || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  } catch {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
}

const inputClass =
  'w-full bg-sand-100 border border-sand-200 rounded-subtle px-3 py-2.5 text-[0.875rem] text-sand-900 placeholder:text-sand-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors';

const selectClass =
  'w-full bg-sand-100 border border-sand-200 rounded-subtle px-3 py-2.5 text-[0.875rem] text-sand-800 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors';

const labelClass =
  'block text-[0.8125rem] font-medium text-sand-700 mb-1.5';

export default function AddVehicle() {
  const navigate = useNavigate();
  const [loadingState, setLoadingState] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const defaultGovernorate = 'Alexandria';
  const defaultCity = 'Alexandria';
  const defaultCoords = getCityCoordinates(defaultGovernorate, defaultCity) || {
    lat: 31.2001,
    lng: 29.9187,
  };

  const [mapCenter, setMapCenter] = useState([defaultCoords.lat, defaultCoords.lng]);
  const [mapZoom, setMapZoom] = useState(13);
  const [position, setPosition] = useState({ lat: defaultCoords.lat, lng: defaultCoords.lng });

  const governorateOptions = useMemo(() => getGovernorateNames(), []);

  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    type: 'sedan',
    capacity: 4,
    transmission: 'automatic',
    fuel: 'petrol',
    ac: true,
    description: '',
    price_per_day: '',
    has_driver: false,
    driver_cost: 0,
    country: EGYPT_COUNTRY,
    governorate: defaultGovernorate,
    city: defaultCity,
    address: '',
  });

  const cityOptions = useMemo(
    () => getCitiesByGovernorate(formData.governorate),
    [formData.governorate]
  );

  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [primaryIndex, setPrimaryIndex] = useState(0);
  const [licenseFile, setLicenseFile] = useState(null);
  const [geocoding, setGeocoding] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleLocationSelect = useCallback(async (coords) => {
    setPosition(coords);
    setGeocoding(true);
    const address = await reverseGeocode(coords.lat, coords.lng);
    setFormData((prev) => ({ ...prev, address }));
    setGeocoding(false);
  }, []);

  const handleGovernorateChange = (e) => {
    const governorate = e.target.value;
    const cities = getCitiesByGovernorate(governorate);
    const firstCity = cities[0]?.name || '';

    setFormData((prev) => ({
      ...prev,
      governorate,
      city: firstCity,
      address: '',
    }));

    if (cities[0]) {
      const coords = cities[0];
      setPosition({ lat: coords.lat, lng: coords.lng });
      setMapCenter([coords.lat, coords.lng]);
      setMapZoom(12);
    }
  };

  const handleCityChange = (e) => {
    const city = e.target.value;
    const coords = getCityCoordinates(formData.governorate, city);

    setFormData((prev) => ({ ...prev, city, address: '' }));

    if (coords) {
      setPosition({ lat: coords.lat, lng: coords.lng });
      setMapCenter([coords.lat, coords.lng]);
      setMapZoom(13);
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    const remaining = 5 - imageFiles.length;
    const added = files.slice(0, remaining);
    setImageFiles((prev) => [...prev, ...added]);
    setImagePreviews((prev) => [
      ...prev,
      ...added.map((f) => URL.createObjectURL(f)),
    ]);
  };

  const removeImage = (index) => {
    URL.revokeObjectURL(imagePreviews[index]);
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    if (primaryIndex === index) setPrimaryIndex(0);
    else if (primaryIndex > index) setPrimaryIndex((p) => p - 1);
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    setError(null);

    if (imageFiles.length === 0) {
      setError('Upload at least one vehicle photo.');
      return;
    }
    if (!licenseFile) {
      setError('Upload the official car license for verification.');
      return;
    }
    if (!formData.governorate || !formData.city) {
      setError('Select a governorate and city for pickup.');
      return;
    }
    if (!formData.address) {
      setError('Click the map to set the exact pickup address.');
      return;
    }

    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    const config = {
      headers: {
        Authorization: `Bearer ${userInfo.token}`,
        'Content-Type': 'multipart/form-data',
      },
    };

    try {
      setLoadingState('Saving vehicle data...');

      const form = new FormData();
      Object.keys(formData).forEach((key) => form.append(key, formData[key]));
      form.append('lat', position.lat);
      form.append('lng', position.lng);
      form.append('primaryIndex', primaryIndex);
      for (let i = 0; i < imageFiles.length; i++) {
        form.append('images', imageFiles[i]);
      }

      const { data: newVehicle } = await axios.post(
        `${API}/api/vehicles`,
        form,
        config
      );

      setLoadingState('Verifying license...');

      const kycForm = new FormData();
      kycForm.append('file', licenseFile);
      kycForm.append('doc_type', 'car_license');
      kycForm.append('run_fraud_check', 'true');
      kycForm.append('vehicleId', newVehicle._id);

      try {
        await axios.post(`${API}/api/users/kyc/verify`, kycForm, config);
        setSuccess('Vehicle listed and license verified.');
        setTimeout(() => navigate('/dashboard'), 1500);
      } catch (kycErr) {
        setSuccess(
          `Vehicle created. License verification failed: ${
            kycErr.response?.data?.message || 'upload a clearer image later.'
          }`
        );
        setTimeout(() => navigate('/dashboard'), 2500);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Could not add vehicle. Try again.'
      );
      setLoadingState('');
    }
  };

  return (
    <div className="min-h-screen bg-sand-50 font-sans antialiased text-sand-950">
      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-sand-50/90 backdrop-blur-md border-b border-sand-200">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <Link
            to="/dashboard"
            className="flex items-center gap-1.5 text-[0.8125rem] font-medium text-sand-600 hover:text-primary-800 transition-colors"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10 3 5 8l5 5" />
            </svg>
            Back to Dashboard
          </Link>
          <Link
            to="/explore"
            className="flex items-center gap-1.5 rounded-subtle border border-sand-200 bg-sand-100 px-3 py-1.5 text-[0.8125rem] font-semibold text-sand-700 transition-colors hover:bg-sand-200/70 hover:text-primary-800"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8.5 3 4.5 7l4 4" />
              <path d="M5 7h6" />
            </svg>
            Back to Fleet
          </Link>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 pb-20">
        <h1 className="text-[1.25rem] font-semibold text-sand-950 mb-1">
          List a Vehicle
        </h1>
        <p className="text-[0.875rem] text-sand-500 mb-8">
          Add your car to the Zabatly fleet.
        </p>

        {/* Feedback banners */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-[0.8125rem] px-4 py-2.5 rounded-subtle mb-6">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-[0.8125rem] px-4 py-2.5 rounded-subtle mb-6">
            {success}
          </div>
        )}

        <form onSubmit={submitHandler} className="space-y-10">
          {/* --- Vehicle Details --- */}
          <section>
            <h2 className="text-[0.95rem] font-semibold text-sand-900 mb-4">
              Vehicle Details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="make" className={labelClass}>
                  Make
                </label>
                <input
                  id="make"
                  type="text"
                  name="make"
                  required
                  placeholder="BMW"
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="model" className={labelClass}>
                  Model
                </label>
                <input
                  id="model"
                  type="text"
                  name="model"
                  required
                  placeholder="X6"
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="type" className={labelClass}>
                  Type
                </label>
                <select
                  id="type"
                  name="type"
                  onChange={handleChange}
                  className={selectClass}
                >
                  <option value="sedan">Sedan</option>
                  <option value="suv">SUV</option>
                  <option value="luxury">Luxury</option>
                  <option value="minibus">Minibus</option>
                </select>
              </div>
              <div>
                <label htmlFor="transmission" className={labelClass}>
                  Transmission
                </label>
                <select
                  id="transmission"
                  name="transmission"
                  onChange={handleChange}
                  className={selectClass}
                >
                  <option value="automatic">Automatic</option>
                  <option value="manual">Manual</option>
                </select>
              </div>
              <div>
                <label htmlFor="fuel" className={labelClass}>
                  Fuel
                </label>
                <select
                  id="fuel"
                  name="fuel"
                  onChange={handleChange}
                  className={selectClass}
                >
                  <option value="petrol">Petrol</option>
                  <option value="diesel">Diesel</option>
                  <option value="electric">Electric</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    name="ac"
                    defaultChecked
                    onChange={handleChange}
                    className="w-4 h-4 rounded border-sand-300 text-primary-800 focus:ring-primary-500"
                  />
                  <span className="text-[0.875rem] font-medium text-sand-800">
                    Air Conditioning
                  </span>
                </label>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="description" className={labelClass}>
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  required
                  onChange={handleChange}
                  placeholder="Condition, features, anything renters should know."
                  className={`${inputClass} h-20 resize-none`}
                />
              </div>
            </div>
          </section>

          {/* --- Pricing --- */}
          <section>
            <h2 className="text-[0.95rem] font-semibold text-sand-900 mb-4">
              Pricing
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="price_per_day" className={labelClass}>
                  Daily Rate (EGP)
                </label>
                <input
                  id="price_per_day"
                  type="number"
                  name="price_per_day"
                  required
                  placeholder="0"
                  onChange={handleChange}
                  className={`${inputClass} font-semibold tabular-nums`}
                />
              </div>
              <div>
                <label htmlFor="capacity" className={labelClass}>
                  Passengers
                </label>
                <input
                  id="capacity"
                  type="number"
                  name="capacity"
                  defaultValue={4}
                  onChange={handleChange}
                  className={`${inputClass} tabular-nums`}
                />
              </div>
            </div>

            {/* Driver option */}
            <div className="mt-4 border border-sand-200 rounded-soft p-4 bg-sand-50">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  name="has_driver"
                  onChange={handleChange}
                  className="w-4 h-4 rounded border-sand-300 text-primary-800 focus:ring-primary-500"
                />
                <div>
                  <span className="text-[0.875rem] font-medium text-sand-900 block">
                    Offer with a driver
                  </span>
                  <span className="text-[0.75rem] text-sand-500">
                    Check if you can provide a driver with this car.
                  </span>
                </div>
              </label>

              {formData.has_driver && (
                <div className="mt-3 pt-3 border-t border-sand-200">
                  <label htmlFor="driver_cost" className={labelClass}>
                    Driver Cost (EGP/day)
                  </label>
                  <input
                    id="driver_cost"
                    type="number"
                    name="driver_cost"
                    onChange={handleChange}
                    placeholder="500"
                    className={`${inputClass} font-semibold tabular-nums`}
                  />
                </div>
              )}
            </div>
          </section>

          {/* --- Location --- */}
          <section>
            <h2 className="text-[0.95rem] font-semibold text-sand-900 mb-1">
              Pickup Location
            </h2>
            <p className="text-[0.8125rem] text-sand-500 mb-4">
              Choose your area, then click the map to pin the exact pickup spot.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <div>
                <label htmlFor="country" className={labelClass}>
                  Country
                </label>
                <select
                  id="country"
                  name="country"
                  value={formData.country}
                  disabled
                  className={`${selectClass} opacity-70 cursor-not-allowed`}
                >
                  <option value={EGYPT_COUNTRY}>{EGYPT_COUNTRY}</option>
                </select>
              </div>

              <div>
                <label htmlFor="governorate" className={labelClass}>
                  Governorate
                </label>
                <select
                  id="governorate"
                  name="governorate"
                  value={formData.governorate}
                  onChange={handleGovernorateChange}
                  className={selectClass}
                  required
                >
                  {governorateOptions.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="city" className={labelClass}>
                  City
                </label>
                <select
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleCityChange}
                  className={selectClass}
                  required
                >
                  {cityOptions.map((city) => (
                    <option key={city.name} value={city.name}>
                      {city.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="relative mb-3">
              <label htmlFor="address" className={labelClass}>
                Exact Address
              </label>
              <input
                id="address"
                type="text"
                name="address"
                value={formData.address}
                readOnly
                placeholder="Click the map to set the exact pickup address"
                className={`${inputClass} bg-sand-50 cursor-default`}
              />
              {geocoding && (
                <div className="absolute right-3 top-9 w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
              )}
            </div>

            <div className="h-64 w-full rounded-soft overflow-hidden border border-sand-200 relative z-0">
              <MapContainer
                center={mapCenter}
                zoom={mapZoom}
                scrollWheelZoom={false}
                className="h-full w-full"
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution="&copy; OpenStreetMap contributors"
                />
                <MapRecenter center={mapCenter} zoom={mapZoom} />
                <LocationPicker onLocationSelect={handleLocationSelect} />
                <Marker position={[position.lat, position.lng]} />
              </MapContainer>
            </div>
            <p className="text-[0.7rem] text-sand-400 mt-1.5 tabular-nums">
              {position.lat.toFixed(4)}, {position.lng.toFixed(4)}
            </p>
          </section>

          {/* --- Photos --- */}
          <section>
            <h2 className="text-[0.95rem] font-semibold text-sand-900 mb-1">
              Photos
            </h2>
            <p className="text-[0.8125rem] text-sand-500 mb-4">
              Up to 5 images. Click the star to set the main thumbnail.
            </p>

            <label className="flex items-center justify-center gap-2 w-full border border-dashed border-sand-300 rounded-soft py-6 cursor-pointer hover:bg-sand-100 transition-colors">
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-sand-400"
              >
                <path d="M8 2v12M2 8h12" />
              </svg>
              <span className="text-[0.8125rem] font-medium text-sand-500">
                {imageFiles.length > 0
                  ? `${imageFiles.length}/5 uploaded`
                  : 'Choose photos'}
              </span>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>

            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mt-3">
                {imagePreviews.map((src, idx) => (
                  <div
                    key={idx}
                    className={`relative group rounded-soft overflow-hidden border-2 ${
                      idx === primaryIndex
                        ? 'border-primary-500'
                        : 'border-sand-200'
                    }`}
                  >
                    <img
                      src={src}
                      alt={`Photo ${idx + 1}`}
                      className="w-full h-20 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setPrimaryIndex(idx)}
                      className={`absolute top-1 left-1 w-5 h-5 rounded-full flex items-center justify-center text-[0.6rem] transition-colors ${
                        idx === primaryIndex
                          ? 'bg-primary-800 text-white'
                          : 'bg-sand-50/80 text-sand-400 hover:text-primary-800'
                      }`}
                      aria-label="Set as primary"
                    >
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 10 10"
                        fill="currentColor"
                      >
                        <path d="M5 0l1.12 3.44H9.9L6.88 5.56l1.12 3.44L5 7l-3 2 1.12-3.44L.1 3.44h3.78L5 0z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-[0.55rem] opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Remove photo"
                    >
                      <svg
                        width="8"
                        height="8"
                        viewBox="0 0 8 8"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      >
                        <path d="M1.5 1.5l5 5M6.5 1.5l-5 5" />
                      </svg>
                    </button>
                    {idx === primaryIndex && (
                      <div className="absolute bottom-0 inset-x-0 bg-primary-800 text-white text-[0.55rem] font-semibold text-center py-0.5 uppercase tracking-[0.04em]">
                        Primary
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* --- License Verification --- */}
          <section>
            <h2 className="text-[0.95rem] font-semibold text-sand-900 mb-1">
              Car License
            </h2>
            <p className="text-[0.8125rem] text-sand-500 mb-4">
              Upload the official car license for AI verification. Required
              before renters can book.
            </p>

            <label className="flex items-center justify-center gap-2 w-full border border-dashed border-signal-300 bg-signal-50/30 rounded-soft py-6 cursor-pointer hover:bg-signal-50 transition-colors">
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-signal-600"
              >
                <path d="M8 1.5l5.5 2v4.5c0 3.5-2.5 5.5-5.5 7-3-1.5-5.5-3.5-5.5-7V3.5L8 1.5z" />
              </svg>
              <span className="text-[0.8125rem] font-medium text-signal-700">
                {licenseFile ? licenseFile.name : 'Choose license image'}
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setLicenseFile(e.target.files[0])}
                className="hidden"
              />
            </label>
          </section>

          {/* --- Submit --- */}
          <button
            type="submit"
            disabled={!!loadingState}
            className="w-full bg-primary-800 text-white text-[0.875rem] font-semibold py-3 rounded-subtle hover:bg-primary-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loadingState ? (
              <>
                <svg
                  className="animate-spin h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                {loadingState}
              </>
            ) : (
              'List Vehicle'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
