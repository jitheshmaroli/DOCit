/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import {
  validateName,
  validatePhone,
  validateNumeric,
  validatePassword,
  validateConfirmPassword,
} from '../../utils/validation';
import { RootState } from '../../redux/store';
import { useAppSelector } from '../../redux/hooks';
import { getImageUrl } from '../../utils/config';
import { Experience, Speciality } from '../../types/doctorTypes';
import { showError, showSuccess } from '../../utils/toastConfig';
import Modal from '../../components/common/Modal';
import {
  Eye,
  EyeOff,
  Camera,
  FileText,
  Plus,
  X,
  Lock,
  AlertTriangle,
} from 'lucide-react';
import {
  changeDoctorPassword,
  fetchSpecialities,
  setDoctorPassword,
} from '../../services/doctorService';
import api from '../../services/api';

interface FormData {
  name: string;
  email: string;
  phone: string;
  licenseNumber: string;
  qualifications: string;
  location: string;
  speciality: string;
  gender: string;
  allowFreeBooking: boolean;
  experiences: Experience[];
  licenseProof?: string;
}

const FieldError = ({ msg }: { msg?: string }) =>
  msg ? <p className="error-text mt-1">{msg}</p> : null;

const DoctorProfilePage: React.FC = () => {
  const { user } = useAppSelector((state: RootState) => state.auth);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    licenseNumber: '',
    qualifications: '',
    location: '',
    speciality: '',
    gender: '',
    allowFreeBooking: true,
    experiences: [],
    licenseProof: '',
  });
  const [initialFormData, setInitialFormData] = useState<FormData | null>(null);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [licenseProofFile, setLicenseProofFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [experienceErrors, setExperienceErrors] = useState<
    Array<Record<string, string | undefined>>
  >([]);
  const [specialities, setSpecialities] = useState<Speciality[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
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
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);

  const doctorId = user?._id;

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const specialitiesData = await fetchSpecialities();
        setSpecialities(specialitiesData);
        const response = await api.get(`/api/doctors/profile`);
        const data = response.data;
        let specialityName = '';
        if (data.speciality) {
          const sid = Array.isArray(data.speciality)
            ? data.speciality[0]
            : data.speciality;
          const sp = specialitiesData.find((s: Speciality) => s._id === sid);
          specialityName = sp ? sp.name : '';
        }
        const newFD: FormData = {
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          licenseNumber: data.licenseNumber || '',
          qualifications: data.qualifications?.join(', ') || '',
          location: data.location || '',
          speciality: specialityName,
          gender: data.gender || '',
          allowFreeBooking: data.allowFreeBooking ?? true,
          experiences:
            data.experiences?.map((e: any) => ({
              hospitalName: e.hospitalName || '',
              department: e.department || '',
              years: e.years?.toString() || '',
            })) || [],
          licenseProof: data.licenseProof || '',
        };
        setFormData(newFD);
        setInitialFormData(newFD);
        const img = getImageUrl(data.profilePicture);
        setProfilePicture(img);
        setPreviewImage(img);
        setExperienceErrors(data.experiences?.map(() => ({})) || []);
      } catch {
        showError('Failed to load profile');
      }
    };
    if (doctorId) fetchProfile();
  }, [doctorId]);

  useEffect(() => {
    if (!initialFormData) return;
    const simpleFields: (keyof FormData)[] = [
      'name',
      'email',
      'phone',
      'licenseNumber',
      'qualifications',
      'location',
      'speciality',
      'gender',
      'allowFreeBooking',
      'licenseProof',
    ];
    let changed =
      simpleFields.some((f) => formData[f] !== initialFormData[f]) ||
      file !== null ||
      licenseProofFile !== null;
    if (
      !changed &&
      formData.experiences.length !== initialFormData.experiences.length
    )
      changed = true;
    if (!changed) {
      changed = formData.experiences.some((exp, i) => {
        const init = initialFormData.experiences[i];
        return (
          init &&
          (exp.hospitalName !== init.hospitalName ||
            exp.department !== init.department ||
            exp.years !== init.years)
        );
      });
    }
    setHasChanges(changed);
  }, [formData, file, licenseProofFile, initialFormData]);

  const validateField = (name: string, value: string) => {
    const map: Record<string, () => string | undefined> = {
      name: () => validateName(value),
      phone: () => validatePhone(value),
      licenseNumber: () => (!value ? 'License Number is required' : undefined),
      qualifications: () =>
        !value ? 'Qualifications are required' : undefined,
      location: () => (!value ? 'Location is required' : undefined),
      speciality: () => (!value ? 'Speciality is required' : undefined),
      gender: () => (!value ? 'Gender is required' : undefined),
    };
    if (map[name]) setErrors((p) => ({ ...p, [name]: map[name]() }));
  };

  const validateExperienceField = (
    index: number,
    field: keyof Experience,
    value: string
  ) => {
    setExperienceErrors((prev) => {
      const ne = [...prev];
      ne[index] = { ...ne[index] };
      switch (field) {
        case 'hospitalName':
          ne[index].hospitalName = !value
            ? 'Hospital Name is required'
            : value.length > 100
              ? 'Max 100 characters'
              : undefined;
          break;
        case 'department':
          ne[index].department = !value
            ? 'Department is required'
            : value.length > 50
              ? 'Max 50 characters'
              : undefined;
          break;
        case 'years':
          ne[index].years =
            validateNumeric(value, 'Years') ||
            (value && (parseInt(value) < 0 || parseInt(value) > 99)
              ? 'Years must be 0–99'
              : undefined);
          break;
      }
      return ne;
    });
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;
    const newValue =
      type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    if (
      name === 'phone' &&
      typeof newValue === 'string' &&
      newValue.length > 10
    )
      return;
    setFormData((p) => ({ ...p, [name]: newValue }));
    if (typeof newValue === 'string') validateField(name, newValue);
  };

  const handleExperienceChange = (
    index: number,
    field: keyof Experience,
    value: string
  ) => {
    if (field === 'years' && value.length > 2) return;
    setFormData((p) => ({
      ...p,
      experiences: p.experiences.map((e, i) =>
        i === index ? { ...e, [field]: value } : e
      ),
    }));
    validateExperienceField(index, field, value);
  };

  const addExperience = () => {
    setFormData((p) => ({
      ...p,
      experiences: [
        ...p.experiences,
        { hospitalName: '', department: '', years: '' },
      ],
    }));
    setExperienceErrors((p) => [...p, {}]);
  };

  const removeExperience = (index: number) => {
    setFormData((p) => ({
      ...p,
      experiences: p.experiences.filter((_, i) => i !== index),
    }));
    setExperienceErrors((p) => p.filter((_, i) => i !== index));
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

  const handleLicenseProofChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const f = e.target.files[0];
      if (f.type !== 'application/pdf') {
        showError('License proof must be a PDF file');
        return;
      }
      setLicenseProofFile(f);
    }
  };

  const validateForm = () => {
    let isValid = true;
    const skip = ['email', 'experiences', 'allowFreeBooking', 'licenseProof'];
    Object.entries(formData).forEach(([key, value]) => {
      if (!skip.includes(key)) {
        validateField(key, value as string);
        if (!value) isValid = false;
        else if (errors[key]) isValid = false;
      }
    });
    const expErrs = formData.experiences.map((exp, i) => {
      validateExperienceField(i, 'hospitalName', exp.hospitalName);
      validateExperienceField(i, 'department', exp.department);
      validateExperienceField(i, 'years', exp.years);
      const e: Record<string, string | undefined> = {
        hospitalName: !exp.hospitalName
          ? 'Hospital Name is required'
          : undefined,
        department: !exp.department ? 'Department is required' : undefined,
        years:
          validateNumeric(exp.years, 'Years') ||
          (exp.years && (parseInt(exp.years) < 0 || parseInt(exp.years) > 99)
            ? 'Years must be 0–99'
            : undefined),
      };
      if (!exp.hospitalName || !exp.department || !exp.years || e.years)
        isValid = false;
      return e;
    });
    setExperienceErrors(expErrs);
    return isValid;
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
    try {
      const fd = new FormData();
      fd.append('name', formData.name);
      fd.append('phone', formData.phone);
      fd.append('licenseNumber', formData.licenseNumber);
      fd.append('qualifications', formData.qualifications);
      fd.append('location', formData.location);
      fd.append('speciality', formData.speciality);
      fd.append('gender', formData.gender);
      fd.append('allowFreeBooking', String(formData.allowFreeBooking));
      fd.append(
        'experiences',
        JSON.stringify(
          formData.experiences.map((e) => ({ ...e, years: parseInt(e.years) }))
        )
      );
      if (file) fd.append('profilePicture', file);
      if (licenseProofFile) fd.append('licenseProof', licenseProofFile);
      const response = await api.patch(`/api/doctors/profile`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const sp = specialities.find((s) => s._id === response.data.speciality);
      const updated: FormData = {
        ...formData,
        speciality: sp ? sp.name : formData.speciality,
        licenseProof: response.data.licenseProof || formData.licenseProof,
      };
      setFormData(updated);
      setInitialFormData(updated);
      const img = getImageUrl(response.data.profilePicture);
      setProfilePicture(img);
      setPreviewImage(img);
      setFile(null);
      setLicenseProofFile(null);
      setIsModalOpen(false);
      showSuccess('Profile updated successfully!');
    } catch (error: any) {
      setPreviewImage(profilePicture);
      setFile(null);
      setLicenseProofFile(null);
      setIsModalOpen(false);
      showError(error.response?.data?.message || 'Error updating profile');
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
    setPasswordErrors((prev) => ({
      ...prev,
      [name === 'newPassword'
        ? 'new'
        : name === 'confirmPassword'
          ? 'confirm'
          : 'current']:
        name === 'newPassword'
          ? validatePassword(value) || ''
          : name === 'confirmPassword'
            ? validateConfirmPassword(newPassword, value) || ''
            : prev.current,
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
    try {
      if (isSetPassword) {
        await setDoctorPassword(newPassword);
      } else {
        await changeDoctorPassword(currentPassword, newPassword);
      }
      showSuccess(
        isSetPassword
          ? 'Password set successfully'
          : 'Password changed successfully'
      );
      setIsPasswordModalOpen(false);
    } catch (error) {
      showError(
        (error as { message?: string }).message || 'Failed to update password'
      );
    }
  };

  const inputCls = (err?: string) => `input ${err ? 'input-error' : ''}`;

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Profile</h1>
          <p className="page-subtitle">Manage your professional information</p>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex flex-col md:flex-row gap-8">
          {/* ── Left column ── */}
          <div className="flex flex-col items-center gap-4 md:w-48 flex-shrink-0">
            {/* Avatar */}
            <label className="relative group cursor-pointer">
              <div className="w-28 h-28 rounded-2xl overflow-hidden border-2 border-surface-border shadow-card bg-primary-100 flex items-center justify-center">
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
                  <span className="text-2xl font-bold text-primary-600">
                    {formData.name?.slice(0, 2).toUpperCase() || 'DR'}
                  </span>
                )}
              </div>
              <div className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera size={20} className="text-white" />
              </div>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handlePhotoChange}
              />
            </label>
            <p className="text-xs text-text-muted text-center">
              Click to change photo
            </p>

            {/* License PDF */}
            <div className="w-full">
              <p className="text-xs text-text-muted mb-1.5">
                License Proof (PDF)
              </p>
              <label className="btn-secondary text-xs w-full justify-center cursor-pointer">
                <FileText size={14} /> Upload PDF
                <input
                  type="file"
                  className="hidden"
                  accept="application/pdf"
                  onChange={handleLicenseProofChange}
                />
              </label>
              {formData.licenseProof && (
                <a
                  href={formData.licenseProof}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary-600 hover:underline mt-1.5 block text-center"
                >
                  View Current Document
                </a>
              )}
            </div>

            {/* Password */}
            <button
              type="button"
              onClick={() => openPasswordModal(user?.hasPassword === false)}
              className="btn-secondary text-xs w-full"
            >
              <Lock size={14} />{' '}
              {user?.hasPassword ? 'Change Password' : 'Set Password'}
            </button>
          </div>

          {/* ── Right column ── */}
          <div className="flex-1 min-w-0">
            <h2 className="font-display font-bold text-text-primary text-lg mb-1">
              Dr. {formData.name}
            </h2>
            <p className="text-sm text-text-muted mb-5">Personal Information</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Basic info grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label mb-1">
                    Name <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    maxLength={50}
                    className={inputCls(errors.name)}
                  />
                  <FieldError msg={errors.name} />
                </div>

                <div>
                  <label className="label mb-1">Email Address</label>
                  <div className="input bg-surface-bg text-text-muted cursor-not-allowed">
                    {formData.email}
                  </div>
                </div>

                <div>
                  <label className="label mb-1">
                    Phone Number <span className="text-error">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    maxLength={10}
                    className={inputCls(errors.phone)}
                  />
                  <FieldError msg={errors.phone} />
                </div>

                <div>
                  <label className="label mb-1">
                    License Number <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    name="licenseNumber"
                    value={formData.licenseNumber}
                    onChange={handleChange}
                    maxLength={20}
                    className={inputCls(errors.licenseNumber)}
                  />
                  <FieldError msg={errors.licenseNumber} />
                </div>

                <div>
                  <label className="label mb-1">
                    Qualifications (comma-separated){' '}
                    <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    name="qualifications"
                    value={formData.qualifications}
                    onChange={handleChange}
                    maxLength={100}
                    className={inputCls(errors.qualifications)}
                  />
                  <FieldError msg={errors.qualifications} />
                </div>

                <div>
                  <label className="label mb-1">
                    Location <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    maxLength={50}
                    className={inputCls(errors.location)}
                  />
                  <FieldError msg={errors.location} />
                </div>

                <div>
                  <label className="label mb-1">
                    Speciality <span className="text-error">*</span>
                  </label>
                  <select
                    name="speciality"
                    value={formData.speciality}
                    onChange={handleChange}
                    className={inputCls(errors.speciality)}
                  >
                    <option value="">Select Speciality</option>
                    {specialities.map((s) => (
                      <option key={s._id} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  <FieldError msg={errors.speciality} />
                </div>

                <div>
                  <label className="label mb-1">
                    Gender <span className="text-error">*</span>
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className={inputCls(errors.gender)}
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  <FieldError msg={errors.gender} />
                </div>
              </div>

              {/* Free booking toggle */}
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <div className="relative">
                  <input
                    type="checkbox"
                    name="allowFreeBooking"
                    checked={formData.allowFreeBooking}
                    onChange={handleChange}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-6 bg-surface-border rounded-full peer-checked:bg-primary-500 transition-colors" />
                  <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4" />
                </div>
                <span className="text-sm font-medium text-text-primary">
                  Allow Free Booking
                </span>
                <span
                  className={`badge text-xs ${formData.allowFreeBooking ? 'badge-success' : 'badge-neutral'}`}
                >
                  {formData.allowFreeBooking ? 'Enabled' : 'Disabled'}
                </span>
              </label>

              {/* Experiences */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="label">Work Experience</label>
                  <button
                    type="button"
                    onClick={addExperience}
                    className="btn-ghost text-sm text-primary-600"
                  >
                    <Plus size={14} /> Add Experience
                  </button>
                </div>
                <div className="space-y-3">
                  {formData.experiences.map((exp, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-xl border border-surface-border bg-surface-bg space-y-3"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                          Experience {i + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeExperience(i)}
                          className="p-1 text-text-muted hover:text-error rounded-lg hover:bg-red-50 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="label mb-1">Hospital Name</label>
                          <input
                            type="text"
                            value={exp.hospitalName}
                            onChange={(e) =>
                              handleExperienceChange(
                                i,
                                'hospitalName',
                                e.target.value
                              )
                            }
                            maxLength={100}
                            className={inputCls(
                              experienceErrors[i]?.hospitalName
                            )}
                          />
                          <FieldError msg={experienceErrors[i]?.hospitalName} />
                        </div>
                        <div>
                          <label className="label mb-1">
                            Department / Position
                          </label>
                          <input
                            type="text"
                            value={exp.department}
                            onChange={(e) =>
                              handleExperienceChange(
                                i,
                                'department',
                                e.target.value
                              )
                            }
                            maxLength={50}
                            className={inputCls(
                              experienceErrors[i]?.department
                            )}
                          />
                          <FieldError msg={experienceErrors[i]?.department} />
                        </div>
                        <div>
                          <label className="label mb-1">Years</label>
                          <input
                            type="text"
                            value={exp.years}
                            onChange={(e) =>
                              handleExperienceChange(i, 'years', e.target.value)
                            }
                            maxLength={2}
                            className={inputCls(experienceErrors[i]?.years)}
                          />
                          <FieldError msg={experienceErrors[i]?.years} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <div className="flex justify-end pt-2 border-t border-surface-border">
                <button
                  type="submit"
                  disabled={!hasChanges}
                  className={`btn-primary ${!hasChanges ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Confirm update modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setPreviewImage(profilePicture);
          setFile(null);
          setLicenseProofFile(null);
          setIsModalOpen(false);
        }}
        title="Confirm Profile Update"
        size="sm"
        footer={
          <>
            <button
              onClick={() => {
                setPreviewImage(profilePicture);
                setFile(null);
                setLicenseProofFile(null);
                setIsModalOpen(false);
              }}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button onClick={handleConfirmUpdate} className="btn-primary">
              Save Changes
            </button>
          </>
        }
      >
        <div className="flex items-start gap-3 p-3.5 bg-primary-50 border border-primary-100 rounded-xl">
          <AlertTriangle
            size={15}
            className="text-primary-500 flex-shrink-0 mt-0.5"
          />
          <p className="text-sm text-primary-700">
            Are you sure you want to update your profile?
          </p>
        </div>
      </Modal>

      {/* Password modal */}
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
        size="sm"
        footer={
          <>
            <button
              onClick={() => {
                setIsPasswordModalOpen(false);
              }}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button onClick={handlePasswordSubmit} className="btn-primary">
              {isSetPassword ? 'Set Password' : 'Change Password'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          {!isSetPassword && (
            <div>
              <label className="label mb-1">Current Password</label>
              <div className="relative">
                <input
                  type={showCurrentPwd ? 'text' : 'password'}
                  name="currentPassword"
                  value={currentPassword}
                  onChange={handlePasswordChange}
                  placeholder="Enter current password"
                  className={`input pr-10 ${passwordErrors.current ? 'input-error' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPwd((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
                >
                  {showCurrentPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <FieldError msg={passwordErrors.current} />
            </div>
          )}
          <div>
            <label className="label mb-1">New Password</label>
            <div className="relative">
              <input
                type={showNewPwd ? 'text' : 'password'}
                name="newPassword"
                value={newPassword}
                onChange={handlePasswordChange}
                placeholder="Enter new password"
                className={`input pr-10 ${passwordErrors.new ? 'input-error' : ''}`}
              />
              <button
                type="button"
                onClick={() => setShowNewPwd((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
              >
                {showNewPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <FieldError msg={passwordErrors.new} />
          </div>
          <div>
            <label className="label mb-1">Confirm New Password</label>
            <div className="relative">
              <input
                type={showConfirmPwd ? 'text' : 'password'}
                name="confirmPassword"
                value={confirmPassword}
                onChange={handlePasswordChange}
                placeholder="Confirm new password"
                className={`input pr-10 ${passwordErrors.confirm ? 'input-error' : ''}`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPwd((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
              >
                {showConfirmPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <FieldError msg={passwordErrors.confirm} />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DoctorProfilePage;
