import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import DashboardShell from '../components/dashboard/DashboardShell';
import { API } from '../config/api';

function joinList(value) {
  return Array.isArray(value) ? value.join(', ') : value || '';
}

function getProfilePictureUrl(path) {
  if (!path) return null;
  return path;
}

function getDriverDetails(user = {}) {
  return {
    currentLocation: user.currentLocation || '',
    coveredAreas: joinList(user.coveredAreas),
    availability: user.availability || '',
    drivingExperience: user.drivingExperience || '',
    vehicleTypes: joinList(user.vehicleTypes),
    licenseInfo: user.licenseInfo || '',
    languagesSpoken: joinList(user.languagesSpoken),
    contactDetails: user.contactDetails || '',
  };
}

function toDateInput(value) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
}

function getProfileDetails(user = {}) {
  return {
    dateOfBirth: toDateInput(user.dateOfBirth),
    gender: user.gender || '',
    phone: user.phone || '',
    city: user.city || user.currentLocation || '',
    nationality: user.nationality || '',
    preferredLanguage: user.preferredLanguage || 'English',
    emergencyContactName: user.emergencyContact?.name || '',
    emergencyContactPhone: user.emergencyContact?.phone || '',
    emergencyContactRelation: user.emergencyContact?.relation || '',
  };
}

function createCroppedAvatar(sourceUrl, crop) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      const size = 512;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#f2efea';
      ctx.fillRect(0, 0, size, size);

      const baseScale = Math.max(size / image.width, size / image.height);
      const scale = baseScale * crop.zoom;
      const width = image.width * scale;
      const height = image.height * scale;
      const focusX = width * (crop.x / 100);
      const focusY = height * (crop.y / 100);
      const minX = Math.min(0, size - width);
      const minY = Math.min(0, size - height);
      const dx = Math.max(minX, Math.min(0, size / 2 - focusX));
      const dy = Math.max(minY, Math.min(0, size / 2 - focusY));

      ctx.drawImage(image, dx, dy, width, height);
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Could not crop image'));
        },
        'image/jpeg',
        0.92
      );
    };
    image.onerror = reject;
    image.src = sourceUrl;
  });
}

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [section, setSection] = useState('account');

  // Profile form
  const [age, setAge] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [localPreview, setLocalPreview] = useState(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [cropSource, setCropSource] = useState(null);
  const [cropFileName, setCropFileName] = useState('profile-picture.jpg');
  const [crop, setCrop] = useState({ x: 50, y: 50, zoom: 1 });
  const [removeProfilePicture, setRemoveProfilePicture] = useState(false);
  const [saving, setSaving] = useState(false);
  const [driverDetails, setDriverDetails] = useState({
    currentLocation: '',
    coveredAreas: '',
    availability: '',
    drivingExperience: '',
    vehicleTypes: '',
    licenseInfo: '',
    languagesSpoken: '',
    contactDetails: '',
  });
  const [profileDetails, setProfileDetails] = useState(getProfileDetails());

  // KYC
  const [kycFile, setKycFile] = useState(null);
  const [docType, setDocType] = useState('national_id');
  const [kycLoading, setKycLoading] = useState(false);

  // Feedback
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('userInfo');
    if (!stored) return navigate('/login');
    const parsed = JSON.parse(stored);
    const token = parsed.token;
    setUser(parsed);
    setAge(parsed.age || '');
    setDriverDetails(getDriverDetails(parsed));
    setProfileDetails(getProfileDetails(parsed));
    setPreview(getProfilePictureUrl(parsed.profilePicture));

    const fetchFreshProfile = async () => {
      try {
        const { data } = await axios.get(`${API}/api/users/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const fresh = { ...data, token };
        localStorage.setItem('userInfo', JSON.stringify(fresh));
        setUser(fresh);
        setAge(fresh.age || '');
        setDriverDetails(getDriverDetails(fresh));
        setProfileDetails(getProfileDetails(fresh));
        setPreview(getProfilePictureUrl(fresh.profilePicture));
      } catch {
        showToast('Could not refresh profile details.', 'error');
      }
    };

    fetchFreshProfile();
  }, [navigate]);

  useEffect(() => {
    if (!lightboxOpen) return undefined;
    const closeOnEsc = (event) => {
      if (event.key === 'Escape') setLightboxOpen(false);
    };
    window.addEventListener('keydown', closeOnEsc);
    return () => window.removeEventListener('keydown', closeOnEsc);
  }, [lightboxOpen]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // --- Profile Save ---
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    const formData = new FormData();
    if (age) formData.append('age', age);
    Object.entries(profileDetails).forEach(([key, value]) => {
      formData.append(key, value);
    });
    formData.append('currentLocation', profileDetails.city);
    if (file) formData.append('profilePhoto', file);
    if (removeProfilePicture) formData.append('removeProfilePicture', 'true');
    if (user.role === 'driver') {
      Object.entries(driverDetails).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
          'Content-Type': 'multipart/form-data',
        },
      };
      const { data } = await axios.put(`${API}/api/users/profile`, formData, config);
      localStorage.setItem('userInfo', JSON.stringify(data));
      setUser(data);
      setDriverDetails(getDriverDetails(data));
      setProfileDetails(getProfileDetails(data));
      setPreview(getProfilePictureUrl(data.profilePicture));
      setFile(null);
      setRemoveProfilePicture(false);
      showToast('Profile updated.');
    } catch {
      showToast('Could not save profile. Try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // --- KYC Submit ---
  const handleKycSubmit = async (e) => {
    e.preventDefault();
    if (!kycFile) return showToast('Select a document image first.', 'error');

    const formData = new FormData();
    formData.append('file', kycFile);
    formData.append('doc_type', docType);
    formData.append('run_fraud_check', 'true');

    try {
      setKycLoading(true);
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${user.token}`,
        },
      };
      const { data } = await axios.post(`${API}/api/users/kyc/verify`, formData, config);

      const updated = { ...user };
      if (docType === 'driver_license') {
        updated.driving_license = {
          is_verified: data.status === 'verified',
          extracted_data: { status: data.status },
        };
      } else {
        updated.kyc_status = data.status;
      }
      localStorage.setItem('userInfo', JSON.stringify(updated));
      setUser(updated);
      setKycFile(null);

      if (updated.role !== 'agency') setDocType('driver_license');

      showToast(
        data.status === 'verified'
          ? 'Document verified.'
          : 'Document uploaded, pending review.'
      );
    } catch (err) {
      showToast(
        err.response?.data?.message ||
          err.response?.data?.reason ||
          'Upload failed. Try a clearer image.',
        'error'
      );
    } finally {
      setKycLoading(false);
    }
  };

  // --- Become Host ---
  const becomeHost = async () => {
    const updated = { ...user, role: 'agency' };
    localStorage.setItem('userInfo', JSON.stringify(updated));
    setUser(updated);
    showToast('You are now a vehicle host.');
    setTimeout(() => window.location.reload(), 1500);
  };

  // --- Delete Account ---
  const [confirmDelete, setConfirmDelete] = useState(false);
  const deleteAccount = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.delete(`${API}/api/users/${user._id}`, config);
      localStorage.removeItem('userInfo');
      navigate('/');
    } catch {
      showToast('Could not delete account.', 'error');
    }
  };

  // --- File change ---
  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      const source = URL.createObjectURL(selected);
      setCropSource(source);
      setCropFileName(selected.name || 'profile-picture.jpg');
      setCrop({ x: 50, y: 50, zoom: 1 });
    }
  };

  const applyProfileCrop = async () => {
    if (!cropSource) return;
    try {
      const blob = await createCroppedAvatar(cropSource, crop);
      const croppedFile = new File([blob], cropFileName, { type: 'image/jpeg' });
      const nextPreview = URL.createObjectURL(blob);
      if (localPreview) URL.revokeObjectURL(localPreview);
      setFile(croppedFile);
      setLocalPreview(nextPreview);
      setPreview(nextPreview);
      setRemoveProfilePicture(false);
      URL.revokeObjectURL(cropSource);
      setCropSource(null);
    } catch {
      showToast('Could not crop this image. Try another photo.', 'error');
    }
  };

  const cancelProfileCrop = () => {
    if (cropSource) URL.revokeObjectURL(cropSource);
    setCropSource(null);
  };

  const removePicture = () => {
    if (localPreview) URL.revokeObjectURL(localPreview);
    setFile(null);
    setLocalPreview(null);
    setPreview(null);
    setRemoveProfilePicture(true);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sand-50">
        <div className="animate-pulse space-y-3 text-center">
          <div className="h-4 w-32 bg-sand-200 rounded mx-auto" />
          <div className="h-3 w-20 bg-sand-100 rounded mx-auto" />
        </div>
      </div>
    );
  }

  // --- KYC Status Computation ---
  const idVerified = user.kyc_status === 'verified';
  const idPending = user.kyc_status === 'pending';
  const idRejected = user.kyc_status === 'rejected';
  const idRejectReason = user.identity_document?.extracted_data?.rejection_reason;

  const licenseVerified = user.driving_license?.is_verified;
  const licensePending =
    !licenseVerified && user.driving_license?.extracted_data?.status === 'pending';
  const licenseRejected =
    !licenseVerified && user.driving_license?.extracted_data?.status === 'rejected';
  const licenseRejectReason = user.driving_license?.extracted_data?.rejection_reason;

  let isFullyVerified = false;
  if (user.role === 'agency') {
    isFullyVerified = idVerified;
  } else if (user.role === 'driver') {
    isFullyVerified = idVerified && licenseVerified;
  } else {
    isFullyVerified = idVerified;
  }

  const showUploadForm =
    (!idVerified && !idPending) ||
    (user.role !== 'agency' && !licenseVerified && !licensePending);

  // --- Nav items ---
  const navItems = [
    {
      id: 'account',
      label: 'Account',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="8" cy="5" r="3" />
          <path d="M2 14c0-3.3 2.7-5 6-5s6 1.7 6 5" />
        </svg>
      ),
    },
    {
      id: 'verification',
      label: 'Verification',
      badge: isFullyVerified ? null : 1,
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 1.5l5.5 2v4.5c0 3.5-2.5 5.5-5.5 7-3-1.5-5.5-3.5-5.5-7V3.5L8 1.5z" />
          <path d="M6 8l1.5 1.5L10.5 6" />
        </svg>
      ),
    },
    { id: 'div1', type: 'divider', label: '' },
    {
      id: 'danger',
      label: 'Danger Zone',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 6v3M8 11h.01" />
          <path d="M6.86 2.57L1.21 12.14a1.33 1.33 0 0 0 1.14 2h11.3a1.33 1.33 0 0 0 1.14-2L9.14 2.57a1.33 1.33 0 0 0-2.28 0z" />
        </svg>
      ),
    },
  ];

  const bottomActions = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      href: user.role === 'admin' ? '/admin' : '/dashboard',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="5" height="5" rx="1" />
          <rect x="9" y="2" width="5" height="5" rx="1" />
          <rect x="2" y="9" width="5" height="5" rx="1" />
          <rect x="9" y="9" width="5" height="5" rx="1" />
        </svg>
      ),
    },
  ];

  return (
    <DashboardShell
      navItems={navItems}
      activeSection={section}
      onSectionChange={setSection}
      contextStrip={null}
      user={user}
      bottomActions={bottomActions}
    >
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-subtle text-[0.8125rem] font-semibold shadow-md transition-opacity duration-200 ${
            toast.type === 'error'
              ? 'bg-red-50 border border-red-200 text-red-700'
              : 'bg-green-50 border border-green-200 text-green-700'
          }`}
        >
          {toast.message}
        </div>
      )}

      {cropSource && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-primary-950/45 px-4 py-4 sm:items-center">
          <div className="w-full max-w-md rounded-soft border border-sand-200 bg-sand-50 p-5 shadow-xl shadow-primary-950/15">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-[1rem] font-semibold text-sand-950">Crop Profile Picture</h2>
                <p className="mt-1 text-[0.8125rem] text-sand-500">
                  Move the focal point and zoom until the preview feels right.
                </p>
              </div>
              <button
                type="button"
                onClick={cancelProfileCrop}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-subtle text-sand-500 transition-colors hover:bg-sand-100 hover:text-sand-800"
                aria-label="Cancel crop"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M2.5 2.5l9 9M11.5 2.5l-9 9" />
                </svg>
              </button>
            </div>

            <div className="flex flex-col items-center gap-5">
              <div className="relative h-64 w-64 overflow-hidden rounded-full border border-sand-200 bg-sand-100">
                <img
                  src={cropSource}
                  alt="Profile crop preview"
                  className="h-full w-full object-cover"
                  style={{
                    objectPosition: `${crop.x}% ${crop.y}%`,
                    transform: `scale(${crop.zoom})`,
                    transformOrigin: `${crop.x}% ${crop.y}%`,
                  }}
                />
                <div className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset ring-primary-950/10" />
              </div>

              <div className="w-full space-y-3">
                <CropSlider
                  label="Horizontal"
                  value={crop.x}
                  min="0"
                  max="100"
                  step="1"
                  onChange={(value) => setCrop((prev) => ({ ...prev, x: value }))}
                />
                <CropSlider
                  label="Vertical"
                  value={crop.y}
                  min="0"
                  max="100"
                  step="1"
                  onChange={(value) => setCrop((prev) => ({ ...prev, y: value }))}
                />
                <CropSlider
                  label="Zoom"
                  value={crop.zoom}
                  min="1"
                  max="2.5"
                  step="0.05"
                  onChange={(value) => setCrop((prev) => ({ ...prev, zoom: value }))}
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2 border-t border-sand-200 pt-4">
              <button
                type="button"
                onClick={cancelProfileCrop}
                className="rounded-subtle bg-sand-100 px-4 py-2 text-[0.8125rem] font-semibold text-sand-700 transition-colors hover:bg-sand-200/70"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={applyProfileCrop}
                className="rounded-subtle bg-primary-800 px-4 py-2 text-[0.8125rem] font-semibold text-white transition-colors hover:bg-primary-900"
              >
                Use This Crop
              </button>
            </div>
          </div>
        </div>
      )}

      {lightboxOpen && preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-primary-950/80 px-4 py-6 animate-[profilePreviewIn_180ms_cubic-bezier(0.25,1,0.5,1)]"
          onMouseDown={() => setLightboxOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            onMouseDown={(event) => event.stopPropagation()}
            onClick={() => setLightboxOpen(false)}
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-subtle bg-sand-50/95 text-sand-700 transition-colors hover:bg-sand-100"
            aria-label="Close profile picture preview"
          >
            <svg width="15" height="15" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
              <path d="M2.5 2.5l9 9M11.5 2.5l-9 9" />
            </svg>
          </button>
          <img
            src={preview}
            alt={`${user.name} profile preview`}
            className="max-h-[86vh] max-w-[92vw] rounded-soft object-contain shadow-xl shadow-primary-950/35"
            onMouseDown={(event) => event.stopPropagation()}
          />
        </div>
      )}

      {/* === ACCOUNT === */}
      {section === 'account' && (
        <div className="max-w-xl space-y-6">
          <h1 className="text-[1.25rem] font-semibold text-sand-950">Account</h1>

          {/* Profile header */}
          <div className="flex items-center gap-4">
            <div className="relative flex-shrink-0">
              <button
                type="button"
                onClick={() => preview && setLightboxOpen(true)}
                className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-[1.25rem] font-bold text-primary-800 overflow-hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
                aria-label={preview ? 'Open profile picture preview' : 'Profile picture placeholder'}
              >
                {preview ? (
                  <img src={preview} alt="" className="w-full h-full object-cover object-center" />
                ) : (
                  <svg width="24" height="24" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="8" cy="5" r="3" />
                    <path d="M2 14c0-3.3 2.7-5 6-5s6 1.7 6 5" />
                  </svg>
                )}
              </button>
              <label className="absolute -bottom-0.5 -right-0.5 w-6 h-6 bg-sand-50 border border-sand-200 rounded-full flex items-center justify-center cursor-pointer hover:bg-sand-100 transition-colors" title="Change Profile Picture">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8.5 1.5l2 2M1.5 8.5L1 11l2.5-.5L10 4 8 2 1.5 8.5z" />
                </svg>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </label>
            </div>
            <div className="min-w-0">
              <p className="text-[0.95rem] font-semibold text-sand-900 truncate">
                {user.name}
              </p>
              <p className="text-[0.8125rem] text-sand-500 truncate">{user.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-block px-2 py-0.5 rounded-subtle text-[0.7rem] font-semibold uppercase bg-primary-50 text-primary-700 border border-primary-200">
                  {user.role === 'agency' ? 'Owner' : user.role}
                </span>
                {isFullyVerified && (
                  <span className="inline-block px-2 py-0.5 rounded-subtle text-[0.7rem] font-semibold bg-green-50 text-green-700 border border-green-200">
                    Verified
                  </span>
                )}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-subtle bg-sand-100 px-3 py-1.5 text-[0.75rem] font-semibold text-sand-700 transition-colors hover:bg-sand-200/70">
                  <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7 2v10M2 7h10" />
                  </svg>
                  {preview ? 'Change Profile Picture' : 'Add Profile Picture'}
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </label>
                {preview && (
                  <button
                    type="button"
                    onClick={removePicture}
                    className="inline-flex items-center gap-1.5 rounded-subtle border border-red-200 bg-red-50 px-3 py-1.5 text-[0.75rem] font-semibold text-red-700 transition-colors hover:bg-red-100"
                  >
                    Remove Profile Picture
                  </button>
                )}
              </div>
            </div>
          </div>

          {user.role === 'driver' && (
            <div className="rounded-soft border border-primary-200 bg-primary-50 px-4 py-3">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.04em] text-primary-700">
                Driver coverage
              </p>
              <p className="mt-1 text-[1rem] font-semibold text-primary-950">
                {driverDetails.currentLocation || 'Add your current location'}
              </p>
              <p className="mt-1 text-[0.8125rem] leading-5 text-primary-700">
                {driverDetails.coveredAreas
                  ? `Covers ${driverDetails.coveredAreas}`
                  : 'Add the areas and cities you can cover so renters can find you faster.'}
              </p>
            </div>
          )}

          {/* Trust stats */}
          <div className="flex gap-px rounded-soft overflow-hidden border border-sand-200 bg-sand-200">
            <div className="flex-1 bg-sand-50 px-4 py-3">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.04em] text-sand-500 mb-0.5">
                Rating
              </p>
              <p className="text-[1.1rem] font-bold text-sand-900 tabular-nums">
                {user.rating || 'New'}
              </p>
            </div>
            <div className="flex-1 bg-sand-50 px-4 py-3">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.04em] text-sand-500 mb-0.5">
                Reviews
              </p>
              <p className="text-[1.1rem] font-bold text-sand-900 tabular-nums">
                {user.numReviews || 0}
              </p>
            </div>
          </div>

          {/* Become a Host (renter only) */}
          {user.role === 'user' && (
            <div className="border border-primary-200 bg-primary-50 rounded-soft p-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[0.875rem] font-semibold text-primary-900">
                  Become a vehicle host
                </p>
                <p className="text-[0.8125rem] text-primary-700">
                  List your cars and start earning.
                </p>
              </div>
              <button
                onClick={becomeHost}
                className="flex-shrink-0 bg-primary-800 text-white text-[0.8125rem] font-semibold px-4 py-2 rounded-subtle hover:bg-primary-900 transition-colors"
              >
                Upgrade
              </button>
            </div>
          )}

          {/* Edit profile form */}
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label
                htmlFor="age"
                className="block text-[0.8125rem] font-medium text-sand-700 mb-1.5"
              >
                Age
              </label>
              <input
                id="age"
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="25"
                className="w-full bg-sand-100 border border-sand-200 rounded-subtle px-3 py-2.5 text-[0.875rem] text-sand-900 placeholder:text-sand-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <ProfileInput id="profile-dob" label="Date of birth" type="date" value={profileDetails.dateOfBirth} onChange={(value) => setProfileDetails((prev) => ({ ...prev, dateOfBirth: value }))} />
              <div>
                <label htmlFor="profile-gender" className="block text-[0.8125rem] font-medium text-sand-700 mb-1.5">
                  Gender
                </label>
                <select
                  id="profile-gender"
                  value={profileDetails.gender}
                  onChange={(e) => setProfileDetails((prev) => ({ ...prev, gender: e.target.value }))}
                  className="w-full bg-sand-100 border border-sand-200 rounded-subtle px-3 py-2.5 text-[0.875rem] text-sand-900 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <ProfileInput id="profile-phone" label="Phone number" type="tel" value={profileDetails.phone} placeholder="01012345678" onChange={(value) => setProfileDetails((prev) => ({ ...prev, phone: value }))} />
              <ProfileInput id="profile-city" label="Current city" value={profileDetails.city} placeholder="Alexandria" onChange={(value) => setProfileDetails((prev) => ({ ...prev, city: value }))} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <ProfileInput id="profile-nationality" label="Nationality" value={profileDetails.nationality} placeholder="Egyptian" onChange={(value) => setProfileDetails((prev) => ({ ...prev, nationality: value }))} />
              <ProfileInput id="profile-language" label="Preferred language" value={profileDetails.preferredLanguage} placeholder="English" onChange={(value) => setProfileDetails((prev) => ({ ...prev, preferredLanguage: value }))} />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <ProfileInput id="profile-emergency-name" label="Emergency contact" value={profileDetails.emergencyContactName} placeholder="Name" onChange={(value) => setProfileDetails((prev) => ({ ...prev, emergencyContactName: value }))} />
              <ProfileInput id="profile-emergency-phone" label="Contact phone" type="tel" value={profileDetails.emergencyContactPhone} placeholder="Phone" onChange={(value) => setProfileDetails((prev) => ({ ...prev, emergencyContactPhone: value }))} />
              <ProfileInput id="profile-emergency-relation" label="Relation" value={profileDetails.emergencyContactRelation} placeholder="Brother" onChange={(value) => setProfileDetails((prev) => ({ ...prev, emergencyContactRelation: value }))} />
            </div>

            {user.role === 'driver' && (
              <div className="space-y-4 border-t border-sand-200 pt-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <DriverInput
                    id="profile-current-location"
                    label="Current Location"
                    value={driverDetails.currentLocation}
                    placeholder="Alexandria"
                    onChange={(value) => setDriverDetails((prev) => ({ ...prev, currentLocation: value }))}
                  />
                  <div>
                    <label htmlFor="profile-availability" className="block text-[0.8125rem] font-medium text-sand-700 mb-1.5">
                      Availability
                    </label>
                    <select
                      id="profile-availability"
                      value={driverDetails.availability}
                      onChange={(e) => setDriverDetails((prev) => ({ ...prev, availability: e.target.value }))}
                      className="w-full bg-sand-100 border border-sand-200 rounded-subtle px-3 py-2.5 text-[0.875rem] text-sand-900 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
                    >
                      <option value="">Select availability</option>
                      <option value="Full-time">Full-time</option>
                      <option value="Weekdays">Weekdays</option>
                      <option value="Weekends">Weekends</option>
                      <option value="Evenings">Evenings</option>
                      <option value="Flexible">Flexible</option>
                    </select>
                  </div>
                </div>

                <DriverInput
                  id="profile-covered-areas"
                  label="Areas / Cities Covered"
                  value={driverDetails.coveredAreas}
                  placeholder="Alexandria, Cairo, North Coast"
                  onChange={(value) => setDriverDetails((prev) => ({ ...prev, coveredAreas: value }))}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <DriverInput
                    id="profile-driving-experience"
                    label="Driving Experience"
                    value={driverDetails.drivingExperience}
                    placeholder="6 years, airport routes"
                    onChange={(value) => setDriverDetails((prev) => ({ ...prev, drivingExperience: value }))}
                  />
                  <DriverInput
                    id="profile-vehicle-types"
                    label="Vehicle Types They Can Drive"
                    value={driverDetails.vehicleTypes}
                    placeholder="Sedan, SUV, Van"
                    onChange={(value) => setDriverDetails((prev) => ({ ...prev, vehicleTypes: value }))}
                  />
                </div>

                <DriverInput
                  id="profile-license-info"
                  label="License Information"
                  value={driverDetails.licenseInfo}
                  placeholder="Private license, valid through 2029"
                  onChange={(value) => setDriverDetails((prev) => ({ ...prev, licenseInfo: value }))}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <DriverInput
                    id="profile-languages"
                    label="Languages Spoken"
                    value={driverDetails.languagesSpoken}
                    placeholder="Arabic, English"
                    onChange={(value) => setDriverDetails((prev) => ({ ...prev, languagesSpoken: value }))}
                  />
                  <DriverInput
                    id="profile-contact-details"
                    label="Contact Details"
                    value={driverDetails.contactDetails}
                    placeholder="Phone or WhatsApp"
                    onChange={(value) => setDriverDetails((prev) => ({ ...prev, contactDetails: value }))}
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="bg-primary-800 text-white text-[0.8125rem] font-semibold px-5 py-2.5 rounded-subtle hover:bg-primary-900 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      )}

      {/* === VERIFICATION === */}
      {section === 'verification' && (
        <div className="max-w-xl space-y-6">
          <h1 className="text-[1.25rem] font-semibold text-sand-950">
            Verification
          </h1>

          {/* Status banner */}
          {isFullyVerified ? (
            <div className="bg-green-50 border border-green-200 rounded-soft px-4 py-3">
              <p className="text-[0.875rem] font-semibold text-green-800">
                Account verified
              </p>
              <p className="text-[0.8125rem] text-green-700">
                All required identity checks for your role are complete.
              </p>
            </div>
          ) : (
            <div className="bg-signal-50 border border-signal-200 rounded-soft px-4 py-3">
              <p className="text-[0.875rem] font-semibold text-signal-800">
                Verification needed
              </p>
              <p className="text-[0.8125rem] text-signal-700">
                Complete the checks below to unlock full platform features.
              </p>
            </div>
          )}

          {/* Checklist */}
          <div className="space-y-2">
            {/* Identity document */}
            <ChecklistItem
              label="National ID or Passport"
              description="Required for all users"
              status={
                idVerified
                  ? 'verified'
                  : idPending
                  ? 'pending'
                  : idRejected
                  ? 'rejected'
                  : 'missing'
              }
              reason={idRejected ? idRejectReason : null}
            />

            {/* Driving license (hidden for owners) */}
            {user.role !== 'agency' && (
              <ChecklistItem
                label="Driving License"
                description={
                  user.role === 'driver'
                    ? 'Required to accept driving jobs'
                    : 'Required for self-drive rentals'
                }
                status={
                  licenseVerified
                    ? 'verified'
                    : licensePending
                    ? 'pending'
                    : licenseRejected
                    ? 'rejected'
                    : user.role === 'driver'
                    ? 'missing'
                    : 'optional'
                }
                reason={licenseRejected ? licenseRejectReason : null}
              />
            )}
          </div>

          {/* Upload form */}
          {showUploadForm && (
            <form
              onSubmit={handleKycSubmit}
              className="border border-sand-200 rounded-soft p-4 bg-sand-50 space-y-3"
            >
              <p className="text-[0.875rem] font-semibold text-sand-900">
                Upload document
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="sm:w-44 bg-sand-100 border border-sand-200 rounded-subtle px-3 py-2.5 text-[0.8125rem] text-sand-800 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                >
                  {!idVerified && !idPending && (
                    <option value="national_id">National ID</option>
                  )}
                  {!idVerified && !idPending && (
                    <option value="passport">Passport</option>
                  )}
                  {!licenseVerified &&
                    !licensePending &&
                    user.role !== 'agency' && (
                      <option value="driver_license">Driving License</option>
                    )}
                </select>

                <label className="flex-1 flex items-center gap-2 bg-sand-100 border border-sand-200 rounded-subtle px-3 py-2.5 cursor-pointer hover:bg-sand-200/60 transition-colors">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-sand-500 flex-shrink-0">
                    <path d="M7 1v9M3.5 4.5 7 1l3.5 3.5" />
                    <path d="M1 9.5V12a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V9.5" />
                  </svg>
                  <span className="text-[0.8125rem] text-sand-600 truncate">
                    {kycFile ? kycFile.name : 'Choose file'}
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => setKycFile(e.target.files[0])}
                  />
                </label>
              </div>

              <button
                type="submit"
                disabled={kycLoading}
                className="bg-primary-800 text-white text-[0.8125rem] font-semibold px-5 py-2.5 rounded-subtle hover:bg-primary-900 transition-colors disabled:opacity-50"
              >
                {kycLoading ? 'Scanning...' : 'Upload'}
              </button>
            </form>
          )}
        </div>
      )}

      {/* === DANGER ZONE === */}
      {section === 'danger' && (
        <div className="max-w-xl space-y-6">
          <h1 className="text-[1.25rem] font-semibold text-sand-950">
            Danger Zone
          </h1>

          <div className="border border-red-200 rounded-soft p-4 bg-red-50/50">
            <p className="text-[0.875rem] font-semibold text-red-800 mb-1">
              Delete account
            </p>
            <p className="text-[0.8125rem] text-red-700 mb-4">
              This permanently removes your account, bookings, and all associated
              data. This action cannot be undone.
            </p>

            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="text-[0.8125rem] font-semibold text-red-700 bg-red-100 border border-red-200 px-4 py-2 rounded-subtle hover:bg-red-200 transition-colors"
              >
                Delete my account
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={deleteAccount}
                  className="text-[0.8125rem] font-semibold bg-red-600 text-white px-4 py-2 rounded-subtle hover:bg-red-700 transition-colors"
                >
                  Confirm deletion
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="text-[0.8125rem] font-medium text-sand-600 hover:text-sand-800 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardShell>
  );
}

function DriverInput({ id, label, value, placeholder, onChange }) {
  return (
    <div>
      <label htmlFor={id} className="block text-[0.8125rem] font-medium text-sand-700 mb-1.5">
        {label}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-sand-100 border border-sand-200 rounded-subtle px-3 py-2.5 text-[0.875rem] text-sand-900 placeholder:text-sand-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
      />
    </div>
  );
}

function ProfileInput({ id, label, value, placeholder = '', type = 'text', onChange }) {
  return (
    <div>
      <label htmlFor={id} className="block text-[0.8125rem] font-medium text-sand-700 mb-1.5">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-sand-100 border border-sand-200 rounded-subtle px-3 py-2.5 text-[0.875rem] text-sand-900 placeholder:text-sand-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
      />
    </div>
  );
}

function CropSlider({ label, value, min, max, step, onChange }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[0.75rem] font-semibold uppercase tracking-[0.04em] text-sand-500">
        {label}
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-primary-800"
      />
    </label>
  );
}

// --- Checklist item ---
function ChecklistItem({ label, description, status, reason }) {
  const styles = {
    verified: {
      dot: 'bg-green-100 text-green-700',
      badge: 'bg-green-50 text-green-700 border border-green-200',
      text: 'Verified',
    },
    pending: {
      dot: 'bg-primary-100 text-primary-700',
      badge: 'bg-primary-50 text-primary-700 border border-primary-200',
      text: 'Pending',
    },
    rejected: {
      dot: 'bg-red-100 text-red-700',
      badge: 'bg-red-50 text-red-700 border border-red-200',
      text: 'Rejected',
    },
    missing: {
      dot: 'bg-signal-100 text-signal-700',
      badge: 'bg-signal-50 text-signal-700 border border-signal-200',
      text: 'Missing',
    },
    optional: {
      dot: 'bg-sand-100 text-sand-500',
      badge: 'bg-sand-100 text-sand-500 border border-sand-200',
      text: 'Optional',
    },
  };

  const s = styles[status] || styles.missing;

  return (
    <div className="flex items-center gap-3 border border-sand-200 rounded-soft px-4 py-3 bg-sand-50">
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-[0.75rem] font-bold flex-shrink-0 ${s.dot}`}
      >
        {status === 'verified' ? (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3.5 7.5 6 10l4.5-5.5" />
          </svg>
        ) : status === 'pending' ? (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="7" cy="7" r="5" />
            <path d="M7 4.5V7l2 1" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="7" cy="7" r="5" />
            <path d="M7 5v3M7 9.5h.01" />
          </svg>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[0.875rem] font-medium text-sand-900">{label}</p>
        <p className="text-[0.75rem] text-sand-500">{description}</p>
        {reason && (
          <p className="text-[0.7rem] text-red-600 mt-0.5">{reason}</p>
        )}
      </div>
      <span
        className={`flex-shrink-0 inline-block px-2 py-0.5 rounded-subtle text-[0.7rem] font-semibold ${s.badge}`}
      >
        {s.text}
      </span>
    </div>
  );
}
