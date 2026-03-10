import { useState, useEffect } from 'react';
import {
  validateName,
  validateNumeric,
  validatePhone,
  validatePassword,
  validateConfirmPassword,
} from '../../../utils/validation';
import ROUTES from '../../../constants/routeConstants';
import { getImageUrl } from '../../../utils/config';
import { useAppSelector } from '../../../redux/hooks';
import { RootState } from '../../../redux/store';
import { useNavigate } from 'react-router-dom';
import { showError, showSuccess } from '../../../utils/toastConfig';
import Modal from '../../../components/common/Modal';
import {
  changePatientPassword,
  setPatientPassword,
} from '../../../services/patientService';
import api from '../../../services/api';
import {
  Camera,
  Eye,
  EyeOff,
  Lock,
  User,
  Mail,
  Phone,
  Hash,
  MapPin,
  CheckCircle,
  Loader2,
} from 'lucide-react';

interface FormData {
  name: string;
  email: string;
  phone: string;
  age: string;
  gender: string;
  address: string;
  pincode: string;
}

const fields: {
  name: keyof FormData;
  label: string;
  type?: string;
  maxLength?: number;
  icon: React.ReactNode;
  readOnly?: boolean;
}[] = [
  {
    name: 'name',
    label: 'Full Name',
    type: 'text',
    maxLength: 50,
    icon: <User size={14} />,
  },
  {
    name: 'email',
    label: 'Email Address',
    type: 'email',
    icon: <Mail size={14} />,
    readOnly: true,
  },
  {
    name: 'phone',
    label: 'Phone Number',
    type: 'tel',
    maxLength: 10,
    icon: <Phone size={14} />,
  },
  {
    name: 'age',
    label: 'Age',
    type: 'text',
    maxLength: 2,
    icon: <Hash size={14} />,
  },
  {
    name: 'address',
    label: 'Address',
    type: 'text',
    maxLength: 100,
    icon: <MapPin size={14} />,
  },
  {
    name: 'pincode',
    label: 'Pincode',
    type: 'text',
    maxLength: 6,
    icon: <Hash size={14} />,
  },
];

const PersonalInformation = () => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    age: '',
    gender: '',
    address: '',
    pincode: '',
  });
  const [initialFormData, setInitialFormData] = useState<FormData | null>(null);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isSetPassword, setIsSetPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordErrors, setPasswordErrors] = useState({
    current: '',
    new: '',
    confirm: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

  const { user } = useAppSelector((state: RootState) => state.auth);
  const patientId = user?._id;
  const navigate = useNavigate();

  useEffect(() => {
    if (!patientId) navigate(ROUTES.PUBLIC.LOGIN);
  }, [patientId, navigate]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await api.get(
          ROUTES.API.PATIENT.PATIENT_BY_ID.replace(
            ':patientId',
            patientId as string
          ),
          { withCredentials: true }
        );
        const newFormData: FormData = {
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          age: data.age?.toString() || '',
          gender: data.gender || '',
          address: data.address || '',
          pincode: data.pincode || '',
        };
        setFormData(newFormData);
        setInitialFormData(newFormData);
        const url = getImageUrl(data.profilePicture);
        setProfilePicture(url);
        setPreviewImage(url);
      } catch {
        showError('Failed to load profile data');
      }
    };
    if (patientId) fetchProfile();
  }, [patientId]);

  useEffect(() => {
    if (!initialFormData) return;
    const changed = (Object.keys(formData) as (keyof FormData)[]).some(
      (k) => k !== 'email' && formData[k] !== initialFormData[k]
    );
    setHasChanges(changed || file !== null);
  }, [formData, file, initialFormData]);

  const validateField = (name: string, value: string) => {
    const set = (err: string | undefined) =>
      setErrors((p) => ({ ...p, [name]: err }));
    switch (name) {
      case 'name':
        set(validateName(value));
        break;
      case 'phone':
        set(validatePhone(value));
        break;
      case 'age':
        set(
          validateNumeric(value, 'Age') ||
            (value && (parseInt(value) < 0 || parseInt(value) > 120)
              ? 'Age must be 0–120'
              : undefined)
        );
        break;
      case 'gender':
        set(!value ? 'Gender is required' : undefined);
        break;
      case 'address':
        set(!value ? 'Address is required' : undefined);
        break;
      case 'pincode':
        set(
          validateNumeric(value, 'Pincode') ||
            (value.length !== 6 ? 'Pincode must be 6 digits' : undefined)
        );
        break;
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (name === 'age' && value.length > 2) return;
    if (name === 'phone' && value.length > 10) return;
    if (name === 'pincode' && value.length > 6) return;
    setFormData((p) => ({ ...p, [name]: value }));
    validateField(name, value);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const f = e.target.files[0];
      setFile(f);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewImage(reader.result as string);
      reader.readAsDataURL(f);
    }
  };

  const validateForm = () => {
    let valid = true;
    (Object.entries(formData) as [keyof FormData, string][]).forEach(
      ([key, value]) => {
        if (key === 'email') return;
        validateField(key, value);
        if (!value || errors[key]) valid = false;
      }
    );
    return valid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      showError('Please fill all required fields correctly');
      return;
    }
    setIsModalOpen(true);
  };

  const handleConfirmUpdate = async () => {
    setIsSaving(true);
    try {
      const fd = new FormData();
      ['name', 'phone', 'age', 'gender', 'address', 'pincode'].forEach((k) =>
        fd.append(k, formData[k as keyof FormData])
      );
      if (file) fd.append('profilePicture', file);
      const { data } = await api.patch(
        ROUTES.API.PATIENT.PATIENT_BY_ID.replace(
          ':patientId',
          patientId as string
        ),
        fd,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          withCredentials: true,
        }
      );
      const updated = {
        ...formData,
        age: data.age?.toString() || formData.age,
      };
      setFormData(updated);
      setInitialFormData(updated);
      const url = getImageUrl(data.profilePicture);
      setProfilePicture(url);
      setPreviewImage(url);
      setFile(null);
      setIsModalOpen(false);
      showSuccess('Profile updated successfully!');
    } catch {
      setPreviewImage(profilePicture);
      setFile(null);
      setIsModalOpen(false);
      showError('Error updating profile');
    } finally {
      setIsSaving(false);
    }
  };

  const openPasswordModal = (isSet: boolean) => {
    setIsSetPassword(isSet);
    setIsPasswordModalOpen(true);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordErrors({ current: '', new: '', confirm: '' });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'currentPassword') setCurrentPassword(value);
    if (name === 'newPassword') setNewPassword(value);
    if (name === 'confirmPassword') setConfirmPassword(value);
    setPasswordErrors((p) => ({
      ...p,
      ...(name === 'newPassword' ? { new: validatePassword(value) || '' } : {}),
      ...(name === 'confirmPassword'
        ? { confirm: validateConfirmPassword(newPassword, value) || '' }
        : {}),
    }));
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErr = validatePassword(newPassword) || '';
    const confirmErr =
      validateConfirmPassword(newPassword, confirmPassword) || '';
    const currentErr =
      !isSetPassword && !currentPassword ? 'Current password is required' : '';
    setPasswordErrors({
      current: currentErr,
      new: newErr,
      confirm: confirmErr,
    });
    if (currentErr || newErr || confirmErr) {
      showError('Please correct the errors');
      return;
    }
    setIsSubmittingPassword(true);
    try {
      if (isSetPassword) await setPatientPassword(newPassword);
      else await changePatientPassword(currentPassword, newPassword);
      showSuccess(
        isSetPassword
          ? 'Password set successfully'
          : 'Password changed successfully'
      );
      setIsPasswordModalOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordErrors({ current: '', new: '', confirm: '' });
    } catch (error) {
      const err = error as { message?: string };
      showError(err.message || 'Failed to update password');
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  if (!user)
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={28} className="animate-spin text-primary-500" />
      </div>
    );

  const initials = formData.name
    ? formData.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'PT';

  return (
    <div className="animate-fade-in max-w-3xl mx-auto">
      {/* ── Page header ── */}
      <div className="page-header mb-6">
        <div>
          <h1 className="page-title">Personal Information</h1>
          <p className="page-subtitle">
            Manage your profile and account security
          </p>
        </div>
      </div>

      {/* ── Profile card ── */}
      <div className="card p-6 mb-5">
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-3 flex-shrink-0">
            <div className="relative group">
              <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-surface-border bg-primary-50 flex items-center justify-center shadow-card">
                {previewImage ? (
                  <img
                    src={previewImage}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    onError={(e) =>
                      ((e.target as HTMLImageElement).src =
                        '/images/avatar.png')
                    }
                  />
                ) : (
                  <span className="text-2xl font-bold text-primary-500">
                    {initials}
                  </span>
                )}
              </div>
              <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <Camera size={20} className="text-white" />
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handlePhotoChange}
                />
              </label>
            </div>
            <label className="btn-secondary text-xs cursor-pointer flex items-center gap-1.5">
              <Camera size={12} /> Change Photo
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handlePhotoChange}
              />
            </label>
            <button
              onClick={() => openPasswordModal(user?.hasPassword === false)}
              className="btn-ghost text-xs flex items-center gap-1.5 text-text-secondary hover:text-primary-600"
            >
              <Lock size={12} />{' '}
              {user?.hasPassword ? 'Change Password' : 'Set Password'}
            </button>
          </div>

          {/* Form */}
          <div className="flex-1 min-w-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {fields.map(
                ({ name, label, type, maxLength, icon, readOnly }) => (
                  <div
                    key={name}
                    className={name === 'address' ? 'sm:col-span-2' : ''}
                  >
                    <label className="label mb-1.5 flex items-center gap-1.5">
                      <span className="text-text-muted">{icon}</span>
                      {label}{' '}
                      {!readOnly && <span className="text-error">*</span>}
                    </label>
                    {readOnly ? (
                      <div className="input bg-surface-muted text-text-muted cursor-not-allowed flex items-center gap-2">
                        {formData[name]}
                      </div>
                    ) : (
                      <input
                        type={type || 'text'}
                        name={name}
                        value={formData[name]}
                        onChange={handleChange}
                        maxLength={maxLength}
                        className={`input ${errors[name] ? 'input-error' : ''}`}
                      />
                    )}
                    {errors[name] && (
                      <p className="error-text">{errors[name]}</p>
                    )}
                  </div>
                )
              )}

              {/* Gender */}
              <div>
                <label className="label mb-1.5">
                  Gender <span className="text-error">*</span>
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className={`input ${errors.gender ? 'input-error' : ''}`}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                {errors.gender && <p className="error-text">{errors.gender}</p>}
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!hasChanges}
                className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <Loader2 size={15} className="animate-spin" /> Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Confirm update modal ── */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setPreviewImage(profilePicture);
          setFile(null);
          setIsModalOpen(false);
        }}
        title="Confirm Profile Update"
        footer={
          <>
            <button
              onClick={() => {
                setPreviewImage(profilePicture);
                setFile(null);
                setIsModalOpen(false);
              }}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmUpdate}
              className="btn-primary"
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Saving...
                </>
              ) : (
                'Yes, Update'
              )}
            </button>
          </>
        }
      >
        <div className="flex items-start gap-3 p-3.5 bg-primary-50 border border-primary-100 rounded-xl">
          <CheckCircle
            size={16}
            className="text-primary-500 flex-shrink-0 mt-0.5"
          />
          <p className="text-sm text-primary-700">
            Are you sure you want to update your profile? Your information will
            be saved.
          </p>
        </div>
      </Modal>

      {/* ── Password modal ── */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => {
          setIsPasswordModalOpen(false);
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
          setPasswordErrors({ current: '', new: '', confirm: '' });
        }}
        title={isSetPassword ? 'Set Password' : 'Change Password'}
        description="Password must be at least 8 characters."
        footer={
          <>
            <button
              onClick={() => setIsPasswordModalOpen(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handlePasswordSubmit}
              className="btn-primary"
              disabled={isSubmittingPassword}
            >
              {isSubmittingPassword ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Saving...
                </>
              ) : isSetPassword ? (
                'Set Password'
              ) : (
                'Change Password'
              )}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          {!isSetPassword && (
            <div>
              <label className="label mb-1.5">
                Current Password <span className="text-error">*</span>
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  name="currentPassword"
                  value={currentPassword}
                  onChange={handlePasswordChange}
                  className={`input pr-10 ${passwordErrors.current ? 'input-error' : ''}`}
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
                >
                  {showCurrentPassword ? (
                    <EyeOff size={15} />
                  ) : (
                    <Eye size={15} />
                  )}
                </button>
              </div>
              {passwordErrors.current && (
                <p className="error-text">{passwordErrors.current}</p>
              )}
            </div>
          )}
          {[
            {
              name: 'newPassword',
              label: 'New Password',
              value: newPassword,
              show: showNewPassword,
              toggle: () => setShowNewPassword(!showNewPassword),
              error: passwordErrors.new,
            },
            {
              name: 'confirmPassword',
              label: 'Confirm New Password',
              value: confirmPassword,
              show: showConfirmPassword,
              toggle: () => setShowConfirmPassword(!showConfirmPassword),
              error: passwordErrors.confirm,
            },
          ].map(({ name, label, value, show, toggle, error }) => (
            <div key={name}>
              <label className="label mb-1.5">
                {label} <span className="text-error">*</span>
              </label>
              <div className="relative">
                <input
                  type={show ? 'text' : 'password'}
                  name={name}
                  value={value}
                  onChange={handlePasswordChange}
                  className={`input pr-10 ${error ? 'input-error' : ''}`}
                  placeholder={`Enter ${label.toLowerCase()}`}
                />
                <button
                  type="button"
                  onClick={toggle}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
                >
                  {show ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {error && <p className="error-text">{error}</p>}
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
};

export default PersonalInformation;
