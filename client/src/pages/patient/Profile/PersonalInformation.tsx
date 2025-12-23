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
import { FaRegEye, FaRegEyeSlash } from 'react-icons/fa';
import {
  changePatientPassword,
  setPatientPassword,
} from '../../../services/patientService';
import api from '../../../services/api';

interface FormData {
  name: string;
  email: string;
  phone: string;
  age: string;
  gender: string;
  address: string;
  pincode: string;
}

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

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isSetPassword, setIsSetPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordErrors, setPasswordErrors] = useState<{
    current: string;
    new: string;
    confirm: string;
  }>({
    current: '',
    new: '',
    confirm: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { user } = useAppSelector((state: RootState) => state.auth);
  const patientId = user?._id;
  const navigate = useNavigate();

  useEffect(() => {
    if (!patientId) {
      navigate(ROUTES.PUBLIC.LOGIN);
    }
  }, [patientId, navigate]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get(
          ROUTES.API.PATIENT.PATIENT_BY_ID.replace(
            ':patientId',
            patientId as string
          ),
          { withCredentials: true }
        );
        const data = response.data;
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
        const imageUrl = getImageUrl(data.profilePicture);
        setProfilePicture(imageUrl);
        setPreviewImage(imageUrl);
      } catch {
        showError('Failed to load profile data');
      }
    };
    if (patientId) fetchProfile();
  }, [patientId]);

  useEffect(() => {
    if (!initialFormData) return;
    const isFormDataChanged = () => {
      const fields: (keyof FormData)[] = [
        'name',
        'email',
        'phone',
        'age',
        'gender',
        'address',
        'pincode',
      ];
      return fields.some((field) => formData[field] !== initialFormData[field]);
    };
    const hasFileChanged = file !== null;
    setHasChanges(isFormDataChanged() || hasFileChanged);
  }, [formData, file, initialFormData]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (name === 'age' && value.length > 2) return;
    if (name === 'phone' && value.length > 10) return;
    if (name === 'pincode' && value.length > 6) return;
    setFormData((prev) => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewImage(reader.result as string);
      reader.readAsDataURL(selectedFile);
    }
  };

  const validateField = (name: string, value: string) => {
    switch (name) {
      case 'name':
        setErrors((prev) => ({ ...prev, name: validateName(value) }));
        break;
      case 'phone':
        setErrors((prev) => ({ ...prev, phone: validatePhone(value) }));
        break;
      case 'age':
        setErrors((prev) => ({
          ...prev,
          age:
            validateNumeric(value, 'Age') ||
            (value && (parseInt(value) < 0 || parseInt(value) > 120)
              ? 'Age must be between 0-120'
              : undefined),
        }));
        break;
      case 'gender':
        setErrors((prev) => ({
          ...prev,
          gender: !value ? 'Gender is required' : undefined,
        }));
        break;
      case 'address':
        setErrors((prev) => ({
          ...prev,
          address: !value ? 'Address is required' : undefined,
        }));
        break;
      case 'pincode':
        setErrors((prev) => ({
          ...prev,
          pincode:
            validateNumeric(value, 'Pincode') ||
            (value.length !== 6 ? 'Pincode must be 6 digits' : undefined),
        }));
        break;
      default:
        break;
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string | undefined> = {};
    let isValid = true;
    Object.entries(formData).forEach(([key, value]) => {
      if (key !== 'email') {
        validateField(key, value);
        if (!value) {
          newErrors[key] =
            `${key.charAt(0).toUpperCase() + key.slice(1)} is required`;
          isValid = false;
        } else if (errors[key]) {
          newErrors[key] = errors[key];
          isValid = false;
        }
      }
    });
    setErrors(newErrors);
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
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('phone', formData.phone);
      formDataToSend.append('age', formData.age);
      formDataToSend.append('gender', formData.gender);
      formDataToSend.append('address', formData.address);
      formDataToSend.append('pincode', formData.pincode);
      if (file) formDataToSend.append('profilePicture', file);

      const response = await api.patch(
        ROUTES.API.PATIENT.PATIENT_BY_ID.replace(
          ':patientId',
          patientId as string
        ),
        formDataToSend,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          withCredentials: true,
        }
      );

      const updatedFormData: FormData = {
        ...formData,
        age: response.data.age?.toString() || formData.age,
      };
      setFormData(updatedFormData);
      setInitialFormData(updatedFormData);
      const imageUrl = getImageUrl(response.data.profilePicture);
      setProfilePicture(imageUrl);
      setPreviewImage(imageUrl);
      setFile(null);
      setIsModalOpen(false);
      showSuccess('Profile updated successfully!');
    } catch {
      setPreviewImage(profilePicture);
      setFile(null);
      setIsModalOpen(false);
      showError('Error updating profile');
    }
  };

  // Password Management Handlers
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

    const newError = validatePassword(newPassword) || '';
    const confirmError =
      validateConfirmPassword(newPassword, confirmPassword) || '';
    let currentError = '';

    if (!isSetPassword) {
      currentError = !currentPassword ? 'Current password is required' : '';
    }

    setPasswordErrors({
      current: currentError,
      new: newError,
      confirm: confirmError,
    });

    if (currentError || newError || confirmError) {
      showError('Please correct the errors');
      return;
    }

    try {
      if (isSetPassword) {
        await setPatientPassword(newPassword);
      } else {
        await changePatientPassword(currentPassword, newPassword);
      }
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
    }
  };

  if (!user) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-800 to-indigo-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto">
        <div className="bg-white/10 backdrop-blur-lg py-8 rounded-2xl border border-white/20 mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent mb-6 text-center">
            Personal Information
          </h1>
        </div>

        <div className="bg-white/10 backdrop-blur-lg border border-white/20 p-6 rounded-2xl shadow-xl">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex flex-col items-center gap-4">
              <div className="w-32 h-32 bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center rounded-full shadow-lg overflow-hidden border-4 border-white/20">
                {previewImage ? (
                  <img
                    src={previewImage}
                    alt="Profile Preview"
                    className="w-full h-full object-cover"
                    onError={(e) =>
                      ((e.target as HTMLImageElement).src =
                        '/images/avatar.png')
                    }
                  />
                ) : (
                  <span className="text-4xl font-bold text-white">PT</span>
                )}
              </div>
              <label className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 px-4 rounded-full hover:from-purple-700 hover:to-blue-700 transition-all duration-300 shadow-md hover:shadow-lg cursor-pointer text-sm font-medium">
                Change Photo
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handlePhotoChange}
                />
              </label>

              <button
                onClick={() => openPasswordModal(user?.hasPassword === false)}
                className="mt-2 bg-gradient-to-r from-red-600 to-pink-600 text-white py-2 px-6 rounded-full hover:from-red-700 hover:to-pink-700 transition-all duration-300 shadow-md hover:shadow-lg text-sm font-medium"
              >
                {user?.hasPassword ? 'Change Password' : 'Set Password'}
              </button>
            </div>

            <div className="flex-1">
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-200 mb-2">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      maxLength={50}
                      className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
                    />
                    {errors.name && (
                      <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm text-gray-200 mb-2">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <div className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white">
                      {formData.email}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-200 mb-2">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      maxLength={10}
                      className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
                    />
                    {errors.phone && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.phone}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm text-gray-200 mb-2">
                      Age <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="age"
                      value={formData.age}
                      onChange={handleChange}
                      maxLength={2}
                      className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
                    />
                    {errors.age && (
                      <p className="text-red-500 text-xs mt-1">{errors.age}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm text-gray-200 mb-2">
                      Gender <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400 appearance-none"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%23ffffff' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
                        backgroundPosition: 'right 0.75rem center',
                        backgroundSize: '1.25rem',
                        backgroundRepeat: 'no-repeat',
                      }}
                    >
                      <option value="" className="bg-gray-800 text-gray-400">
                        Select Gender
                      </option>
                      <option value="Male" className="bg-gray-800 text-white">
                        Male
                      </option>
                      <option value="Female" className="bg-gray-800 text-white">
                        Female
                      </option>
                      <option value="Other" className="bg-gray-800 text-white">
                        Other
                      </option>
                    </select>
                    {errors.gender && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.gender}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm text-gray-200 mb-2">
                      Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      maxLength={100}
                      className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
                    />
                    {errors.address && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.address}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm text-gray-200 mb-2">
                      Pincode <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleChange}
                      maxLength={6}
                      className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
                    />
                    {errors.pincode && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.pincode}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-4">
                  <button
                    type="submit"
                    disabled={!hasChanges}
                    className={`py-3 px-6 text-white font-bold rounded-lg transition-all duration-300 shadow-md hover:shadow-lg ${
                      hasChanges
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700'
                        : 'bg-gray-600 cursor-not-allowed'
                    }`}
                  >
                    Update Profile
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Profile Update Confirmation Modal */}
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
                onClick={handleConfirmUpdate}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300"
              >
                Yes
              </button>
              <button
                onClick={() => {
                  setPreviewImage(profilePicture);
                  setFile(null);
                  setIsModalOpen(false);
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-300"
              >
                No
              </button>
            </>
          }
        >
          <p className="text-white">
            Are you sure you want to update your profile?
          </p>
        </Modal>

        {/* Password Management Modal (Set / Change) */}
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
          footer={
            <>
              <button
                onClick={handlePasswordSubmit}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300"
              >
                {isSetPassword ? 'Set Password' : 'Change Password'}
              </button>
              <button
                onClick={() => {
                  setIsPasswordModalOpen(false);
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                  setPasswordErrors({ current: '', new: '', confirm: '' });
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-300"
              >
                Cancel
              </button>
            </>
          }
        >
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            {!isSetPassword && (
              <div>
                <label className="block text-sm text-gray-200 mb-1">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    name="currentPassword"
                    value={currentPassword}
                    onChange={handlePasswordChange}
                    className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  >
                    {showCurrentPassword ? <FaRegEyeSlash /> : <FaRegEye />}
                  </button>
                </div>
                {passwordErrors.current && (
                  <p className="text-red-500 text-xs mt-1">
                    {passwordErrors.current}
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm text-gray-200 mb-1">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  name="newPassword"
                  value={newPassword}
                  onChange={handlePasswordChange}
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                >
                  {showNewPassword ? <FaRegEyeSlash /> : <FaRegEye />}
                </button>
              </div>
              {passwordErrors.new && (
                <p className="text-red-500 text-xs mt-1">
                  {passwordErrors.new}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm text-gray-200 mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={confirmPassword}
                  onChange={handlePasswordChange}
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                >
                  {showConfirmPassword ? <FaRegEyeSlash /> : <FaRegEye />}
                </button>
              </div>
              {passwordErrors.confirm && (
                <p className="text-red-500 text-xs mt-1">
                  {passwordErrors.confirm}
                </p>
              )}
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
};

export default PersonalInformation;
