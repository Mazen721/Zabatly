import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import DashboardShell from '../components/dashboard/DashboardShell';
import { API } from '../config/api';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation('profile');
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [section, setSection] = useState('account');

  // Profile form

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [localPreview, setLocalPreview] = useState(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [cropSource, setCropSource] = useState(null);
  const [cropFileName, setCropFileName] = useState('profile-picture.jpg');
  const [crop, setCrop] = useState({ x: 50, y: 50, zoom: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const initialCropRef = useRef({ x: 50, y: 50 });
  const overflowRef = useRef({ w: 1, h: 1 });

  const handleDragStart = (clientX, clientY, currentTarget) => {
    setIsDragging(true);
    dragStartRef.current = { x: clientX, y: clientY };
    initialCropRef.current = { x: crop.x, y: crop.y };

    const img = currentTarget.querySelector('img');
    if (img) {
      const rect = currentTarget.getBoundingClientRect();
      const containerWidth = rect.width;
      const containerHeight = rect.height;
      const naturalWidth = img.naturalWidth || containerWidth;
      const naturalHeight = img.naturalHeight || containerHeight;
      const aspectRatio = naturalWidth / naturalHeight;
      const containerAspectRatio = containerWidth / containerHeight;

      let wOverflow = 0;
      let hOverflow = 0;

      if (aspectRatio > containerAspectRatio) {
        const hScaled = containerHeight * crop.zoom;
        const wScaled = hScaled * aspectRatio;
        wOverflow = wScaled - containerWidth;
        hOverflow = hScaled - containerHeight;
      } else {
        const wScaled = containerWidth * crop.zoom;
        const hScaled = wScaled / aspectRatio;
        wOverflow = wScaled - containerWidth;
        hOverflow = hScaled - containerHeight;
      }

      overflowRef.current = {
        w: Math.max(1, wOverflow),
        h: Math.max(1, hOverflow),
      };
    }
  };

  const onMouseDown = (e) => {
    e.preventDefault();
    handleDragStart(e.clientX, e.clientY, e.currentTarget);

    const handleMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - dragStartRef.current.x;
      const deltaY = moveEvent.clientY - dragStartRef.current.y;

      const deltaPercentX = (deltaX / overflowRef.current.w) * 100;
      const deltaPercentY = (deltaY / overflowRef.current.h) * 100;

      setCrop((prev) => ({
        ...prev,
        x: Math.max(0, Math.min(100, initialCropRef.current.x - deltaPercentX)),
        y: Math.max(0, Math.min(100, initialCropRef.current.y - deltaPercentY)),
      }));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const onTouchStart = (e) => {
    if (!e.touches[0]) return;
    const touch = e.touches[0];
    handleDragStart(touch.clientX, touch.clientY, e.currentTarget);

    const handleTouchMove = (moveEvent) => {
      if (!moveEvent.touches[0]) return;
      const deltaX = moveEvent.touches[0].clientX - dragStartRef.current.x;
      const deltaY = moveEvent.touches[0].clientY - dragStartRef.current.y;

      const deltaPercentX = (deltaX / overflowRef.current.w) * 100;
      const deltaPercentY = (deltaY / overflowRef.current.h) * 100;

      setCrop((prev) => ({
        ...prev,
        x: Math.max(0, Math.min(100, initialCropRef.current.x - deltaPercentX)),
        y: Math.max(0, Math.min(100, initialCropRef.current.y - deltaPercentY)),
      }));
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };

    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);
  };

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
  
        setDriverDetails(getDriverDetails(fresh));
        setProfileDetails(getProfileDetails(fresh));
        setPreview(getProfilePictureUrl(fresh.profilePicture));
      } catch {
        showToast(t('refreshError'), 'error');
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

    Object.entries(profileDetails).forEach(([key, value]) => {
      formData.append(key, value);
    });
    // Synchronize currentLocation with city and contactDetails with phone
    formData.append('currentLocation', profileDetails.city);
    formData.append('contactDetails', profileDetails.phone);

    if (file) formData.append('profilePhoto', file);
    if (removeProfilePicture) formData.append('removeProfilePicture', 'true');
    if (user.role === 'driver') {
      Object.entries(driverDetails).forEach(([key, value]) => {
        if (key !== 'currentLocation' && key !== 'contactDetails') {
          formData.append(key, value);
        }
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
      showToast(t('profileUpdated'));
    } catch (err) {
      showToast(err.response?.data?.message || t('profileSaveError'), 'error');
    } finally {
      setSaving(false);
    }
  };

  // --- KYC Submit ---
  const handleKycSubmit = async (e) => {
    e.preventDefault();
    if (!kycFile) return showToast(t('selectDocFirst'), 'error');

    const formData = new FormData();
    formData.append('file', kycFile);
    formData.append('doc_type', docType);

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
          ...(updated.driving_license || {}),
          is_verified: data.status === 'verified',
          status: data.status,
          extracted_data: {
            ...(updated.driving_license?.extracted_data || {}),
            status: data.status,
          },
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
  const [confirmUpgrade, setConfirmUpgrade] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const becomeHost = async () => {
    try {
      setUpgrading(true);
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.post(`${API}/api/users/upgrade-to-host`, {}, config);
      localStorage.setItem('userInfo', JSON.stringify(data));
      setUser(data);
      setConfirmUpgrade(false);
      showToast(t('youAreHost'));
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      showToast(err.response?.data?.message || t('upgradeError'), 'error');
      setConfirmUpgrade(false);
    } finally {
      setUpgrading(false);
    }
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
      showToast(t('deleteError'), 'error');
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
      showToast(t('cropError'), 'error');
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
      label: t('account'),
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="8" cy="5" r="3" />
          <path d="M2 14c0-3.3 2.7-5 6-5s6 1.7 6 5" />
        </svg>
      ),
    },
    {
      id: 'verification',
      label: t('verification'),
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
      label: t('dangerZone'),
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
      label: t('dashboard'),
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
                <h2 className="text-[1rem] font-semibold text-sand-950">{t('cropTitle')}</h2>
                <p className="mt-1 text-[0.8125rem] text-sand-500">
                  {t('cropDesc')}
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
              <div
                onMouseDown={onMouseDown}
                onTouchStart={onTouchStart}
                className="relative h-64 w-64 overflow-hidden rounded-full border border-sand-200 bg-sand-100 cursor-grab active:cursor-grabbing hover:scale-[1.01] transition-transform duration-200 select-none touch-none"
              >
                <img
                  src={cropSource}
                  alt="Profile crop preview"
                  className="h-full w-full object-cover pointer-events-none"
                  style={{
                    objectPosition: `${crop.x}% ${crop.y}%`,
                    transform: `scale(${crop.zoom})`,
                    transformOrigin: `${crop.x}% ${crop.y}%`,
                  }}
                />
                {/* 3x3 Instagram-style Grid Overlay */}
                <div className={`absolute inset-0 grid grid-cols-3 grid-rows-3 transition-opacity duration-300 pointer-events-none rounded-full overflow-hidden ${isDragging ? 'opacity-100' : 'opacity-0'}`}>
                  <div className="border-r border-b border-white/30 border-dashed" />
                  <div className="border-r border-b border-white/30 border-dashed" />
                  <div className="border-b border-white/30 border-dashed" />
                  <div className="border-r border-b border-white/30 border-dashed" />
                  <div className="border-r border-b border-white/30 border-dashed" />
                  <div className="border-b border-white/30 border-dashed" />
                  <div className="border-r border-white/30 border-dashed" />
                  <div className="border-r border-white/30 border-dashed" />
                  <div className="" />
                </div>
                <div className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset ring-primary-950/10" />
              </div>

              <div className="flex items-center gap-1.5 text-[0.75rem] font-medium text-sand-500 select-none pointer-events-none">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-pulse text-primary-600">
                  <polyline points="5 9 2 12 5 15" />
                  <polyline points="9 5 12 2 15 5" />
                  <polyline points="15 19 12 22 9 19" />
                  <polyline points="19 9 22 12 19 15" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <line x1="12" y1="2" x2="12" y2="22" />
                </svg>
                <span>Drag photo inside circle to adjust</span>
              </div>

              <div className="w-full space-y-3">
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
          <h1 className="text-[1.25rem] font-semibold text-sand-950">{t('account')}</h1>

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
                  {t(`roles.${user.role}`, user.role)}
                </span>
                {isFullyVerified && (
                  <span className="inline-block px-2 py-0.5 rounded-subtle text-[0.7rem] font-semibold bg-green-50 text-green-700 border border-green-200">
                    {t('verified')}
                  </span>
                )}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-subtle bg-sand-100 px-3 py-1.5 text-[0.75rem] font-semibold text-sand-700 transition-colors hover:bg-sand-200/70">
                  <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7 2v10M2 7h10" />
                  </svg>
                  {preview ? t('changeProfilePicture') : t('addProfilePicture')}
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
                    {t('removeProfilePicture')}
                  </button>
                )}
              </div>
            </div>
          </div>

          {user.role === 'driver' && (
            <div className="rounded-soft border border-primary-200 bg-primary-50 px-4 py-3">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.04em] text-primary-700">
                {t('driverCoverage')}
              </p>
              <p className="mt-1 text-[1rem] font-semibold text-primary-950">
                {driverDetails.currentLocation || t('addLocation')}
              </p>
              <p className="mt-1 text-[0.8125rem] leading-5 text-primary-700">
                {driverDetails.coveredAreas
                  ? t('coversAreas', { areas: driverDetails.coveredAreas })
                  : t('addAreasHint')}
              </p>
            </div>
          )}

          {/* Trust stats */}
          <div className="flex gap-px rounded-soft overflow-hidden border border-sand-200 bg-sand-200">
            <div className="flex-1 bg-sand-50 px-4 py-3">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.04em] text-sand-500 mb-0.5">
                {t('rating')}
              </p>
              <p className="text-[1.1rem] font-bold text-sand-900 tabular-nums">
                {user.rating || t('new')}
              </p>
            </div>
            <div className="flex-1 bg-sand-50 px-4 py-3">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.04em] text-sand-500 mb-0.5">
                {t('reviews')}
              </p>
              <p className="text-[1.1rem] font-bold text-sand-900 tabular-nums">
                {user.numReviews || 0}
              </p>
            </div>
          </div>

          {/* Become a Host (renter only) */}
          {user.role === 'user' && (
            <div className="border border-primary-200 bg-primary-50 rounded-soft p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[0.875rem] font-semibold text-primary-900">
                    {t('becomeHost')}
                  </p>
                  <p className="text-[0.8125rem] text-primary-700">
                    {t('becomeHostDesc')}
                  </p>
                </div>
                <button
                  onClick={() => setConfirmUpgrade(true)}
                  className="flex-shrink-0 bg-primary-800 text-white text-[0.8125rem] font-semibold px-4 py-2 rounded-subtle hover:bg-primary-900 transition-colors"
                >
                  {t('upgrade')}
                </button>
              </div>

              {confirmUpgrade && (
                <div className="mt-3 border-t border-primary-200 pt-3">
                  <p className="text-[0.8125rem] font-medium text-primary-800 mb-3">
                    {t('upgradeConfirmMsg')}
                  </p>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={becomeHost}
                      disabled={upgrading}
                      className="text-[0.8125rem] font-semibold bg-primary-800 text-white px-4 py-2 rounded-subtle hover:bg-primary-900 transition-colors disabled:opacity-60"
                    >
                      {upgrading ? t('upgrading') : t('confirmUpgrade')}
                    </button>
                    <button
                      onClick={() => setConfirmUpgrade(false)}
                      disabled={upgrading}
                      className="text-[0.8125rem] font-medium text-sand-600 hover:text-sand-800 transition-colors"
                    >
                      {t('cancel')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Edit profile form */}
          <form onSubmit={handleSaveProfile} className="space-y-4">

            <div className="grid gap-4 sm:grid-cols-2">
              <ProfileInput id="profile-dob" label={t('dateOfBirth')} type="date" value={profileDetails.dateOfBirth} onChange={(value) => setProfileDetails((prev) => ({ ...prev, dateOfBirth: value }))} />
              <div>
                <label htmlFor="profile-gender" className="block text-[0.8125rem] font-medium text-sand-700 mb-1.5">
                  {t('gender')}
                </label>
                <select
                  id="profile-gender"
                  value={profileDetails.gender}
                  onChange={(e) => setProfileDetails((prev) => ({ ...prev, gender: e.target.value }))}
                  className="w-full bg-sand-100 border border-sand-200 rounded-subtle px-3 py-2.5 text-[0.875rem] text-sand-900 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
                >
                  <option value="">{t('selectGender')}</option>
                  <option value="male">{t('male')}</option>
                  <option value="female">{t('female')}</option>
                  <option value="other">{t('other')}</option>
                  <option value="prefer_not_to_say">{t('preferNotToSay')}</option>
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <ProfileInput id="profile-phone" label={t('phone')} type="tel" value={profileDetails.phone} placeholder="01012345678" onChange={(value) => setProfileDetails((prev) => ({ ...prev, phone: value }))} />
              <ProfileInput id="profile-city" label={t('city')} value={profileDetails.city} placeholder={t('cityPlaceholder')} onChange={(value) => setProfileDetails((prev) => ({ ...prev, city: value }))} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <ProfileInput id="profile-nationality" label={t('nationality')} value={profileDetails.nationality} placeholder={t('nationalityPlaceholder')} onChange={(value) => setProfileDetails((prev) => ({ ...prev, nationality: value }))} />
              <ProfileInput id="profile-language" label={t('preferredLanguage')} value={profileDetails.preferredLanguage} placeholder={t('languagePlaceholder')} onChange={(value) => setProfileDetails((prev) => ({ ...prev, preferredLanguage: value }))} />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <ProfileInput id="profile-emergency-name" label={t('emergencyContact')} value={profileDetails.emergencyContactName} placeholder={t('namePlaceholder')} onChange={(value) => setProfileDetails((prev) => ({ ...prev, emergencyContactName: value }))} />
              <ProfileInput id="profile-emergency-phone" label={t('emergencyPhone')} type="tel" value={profileDetails.emergencyContactPhone} placeholder={t('phonePlaceholder')} onChange={(value) => setProfileDetails((prev) => ({ ...prev, emergencyContactPhone: value }))} />
              <ProfileInput id="profile-emergency-relation" label={t('emergencyRelation')} value={profileDetails.emergencyContactRelation} placeholder={t('relationPlaceholder')} onChange={(value) => setProfileDetails((prev) => ({ ...prev, emergencyContactRelation: value }))} />
            </div>

            {user.role === 'driver' && (
              <div className="space-y-4 border-t border-sand-200 pt-4">
                <div>
                  <label htmlFor="profile-availability" className="block text-[0.8125rem] font-medium text-sand-700 mb-1.5">
                  {t('availability')}
                  </label>
                  <select
                    id="profile-availability"
                    value={driverDetails.availability}
                    onChange={(e) => setDriverDetails((prev) => ({ ...prev, availability: e.target.value }))}
                    className="w-full bg-sand-100 border border-sand-200 rounded-subtle px-3 py-2.5 text-[0.875rem] text-sand-900 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
                  >
                    <option value="">{t('selectAvailability')}</option>
                    <option value="Full-time">{t('fullTime')}</option>
                    <option value="Weekdays">{t('weekdays')}</option>
                    <option value="Weekends">{t('weekends')}</option>
                    <option value="Evenings">{t('evenings')}</option>
                    <option value="Flexible">{t('flexible')}</option>
                  </select>
                </div>

                <DriverInput
                  id="profile-covered-areas"
                  label={t('coveredAreas')}
                  value={driverDetails.coveredAreas}
                  placeholder={t('coveredAreasPlaceholder')}
                  onChange={(value) => setDriverDetails((prev) => ({ ...prev, coveredAreas: value }))}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <DriverInput
                    id="profile-driving-experience"
                    label={t('drivingExperience')}
                    value={driverDetails.drivingExperience}
                    placeholder={t('drivingExpPlaceholder')}
                    onChange={(value) => setDriverDetails((prev) => ({ ...prev, drivingExperience: value }))}
                  />
                  <DriverInput
                    id="profile-vehicle-types"
                    label={t('vehicleTypes')}
                    value={driverDetails.vehicleTypes}
                    placeholder={t('vehicleTypesPlaceholder')}
                    onChange={(value) => setDriverDetails((prev) => ({ ...prev, vehicleTypes: value }))}
                  />
                </div>

                <DriverInput
                  id="profile-license-info"
                  label={t('licenseInfo')}
                  value={driverDetails.licenseInfo}
                  placeholder={t('licensePlaceholder')}
                  onChange={(value) => setDriverDetails((prev) => ({ ...prev, licenseInfo: value }))}
                />

                <DriverInput
                  id="profile-languages"
                  label={t('languagesSpoken')}
                  value={driverDetails.languagesSpoken}
                  placeholder={t('languagesPlaceholder')}
                  onChange={(value) => setDriverDetails((prev) => ({ ...prev, languagesSpoken: value }))}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="bg-primary-800 text-white text-[0.8125rem] font-semibold px-5 py-2.5 rounded-subtle hover:bg-primary-900 transition-colors disabled:opacity-50"
            >
              {saving ? t('saving') : t('saveChanges')}
            </button>
          </form>
        </div>
      )}

      {/* === VERIFICATION === */}
      {section === 'verification' && (
        <div className="max-w-xl space-y-6">
          <h1 className="text-[1.25rem] font-semibold text-sand-950">
            {t('verification')}
          </h1>

          {/* Status banner */}
          {isFullyVerified ? (
            <div className="bg-green-50 border border-green-200 rounded-soft px-4 py-3">
              <p className="text-[0.875rem] font-semibold text-green-800">
                {t('accountVerified')}
              </p>
              <p className="text-[0.8125rem] text-green-700">
                {t('accountVerifiedDesc')}
              </p>
            </div>
          ) : (
            <div className="bg-signal-50 border border-signal-200 rounded-soft px-4 py-3">
              <p className="text-[0.875rem] font-semibold text-signal-800">
                {t('verificationNeeded')}
              </p>
              <p className="text-[0.8125rem] text-signal-700">
                {t('verificationNeededDesc')}
              </p>
            </div>
          )}

          {/* Checklist */}
          <div className="space-y-2">
            {/* Identity document */}
            <ChecklistItem
              label={t('nationalIdOrPassport')}
              description={t('requiredForAll')}
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
              label={t('drivingLicense')}
                description={
                  user.role === 'driver'
                    ? t('requiredForDriverJobs')
                    : t('requiredForSelfDrive')
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
                {t('uploadDocument')}
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="sm:w-44 bg-sand-100 border border-sand-200 rounded-subtle px-3 py-2.5 text-[0.8125rem] text-sand-800 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                >
                  {!idVerified && !idPending && (
                    <option value="national_id">{t('nationalId')}</option>
                  )}
                  {!idVerified && !idPending && (
                    <option value="passport">{t('passport')}</option>
                  )}
                  {!licenseVerified &&
                    !licensePending &&
                    user.role !== 'agency' && (
                      <option value="driver_license">{t('drivingLicense')}</option>
                    )}
                </select>

                <label className="flex-1 flex items-center gap-2 bg-sand-100 border border-sand-200 rounded-subtle px-3 py-2.5 cursor-pointer hover:bg-sand-200/60 transition-colors">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-sand-500 flex-shrink-0">
                    <path d="M7 1v9M3.5 4.5 7 1l3.5 3.5" />
                    <path d="M1 9.5V12a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V9.5" />
                  </svg>
                  <span className="text-[0.8125rem] text-sand-600 truncate">
                    {kycFile ? kycFile.name : t('chooseFile')}
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
                {kycLoading ? t('scanning') : t('upload')}
              </button>
            </form>
          )}
        </div>
      )}

      {/* === DANGER ZONE === */}
      {section === 'danger' && (
        <div className="max-w-xl space-y-6">
          <h1 className="text-[1.25rem] font-semibold text-sand-950">
            {t('dangerZone')}
          </h1>

          <div className="border border-red-200 rounded-soft p-4 bg-red-50/50">
            <p className="text-[0.875rem] font-semibold text-red-800 mb-1">
              {t('deleteAccount')}
            </p>
            <p className="text-[0.8125rem] text-red-700 mb-4">
              {t('deleteAccountDesc')}
            </p>

            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="text-[0.8125rem] font-semibold text-red-700 bg-red-100 border border-red-200 px-4 py-2 rounded-subtle hover:bg-red-200 transition-colors"
              >
                {t('deleteMyAccount')}
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={deleteAccount}
                  className="text-[0.8125rem] font-semibold bg-red-600 text-white px-4 py-2 rounded-subtle hover:bg-red-700 transition-colors"
                >
                  {t('confirmDeletion')}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="text-[0.8125rem] font-medium text-sand-600 hover:text-sand-800 transition-colors"
                >
                  {t('cancel')}
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
  const { t } = useTranslation('profile');
  const styles = {
    verified: {
      dot: 'bg-green-100 text-green-700',
      badge: 'bg-green-50 text-green-700 border border-green-200',
      text: t('statusVerified'),
    },
    pending: {
      dot: 'bg-primary-100 text-primary-700',
      badge: 'bg-primary-50 text-primary-700 border border-primary-200',
      text: t('statusPending'),
    },
    rejected: {
      dot: 'bg-red-100 text-red-700',
      badge: 'bg-red-50 text-red-700 border border-red-200',
      text: t('statusRejected'),
    },
    missing: {
      dot: 'bg-signal-100 text-signal-700',
      badge: 'bg-signal-50 text-signal-700 border border-signal-200',
      text: t('statusMissing'),
    },
    optional: {
      dot: 'bg-sand-100 text-sand-500',
      badge: 'bg-sand-100 text-sand-500 border border-sand-200',
      text: t('statusOptional'),
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
