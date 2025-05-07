/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  validateName,
  validatePhone,
  validateNumeric,
} from '../../utils/validation';
import { RootState } from '../../redux/store';
import { useAppSelector } from '../../redux/hooks';
import { API_BASE_URL, getImageUrl } from '../../utils/config';

interface Speciality {
  _id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

const DoctorProfilePage: React.FC = () => {
  const { user } = useAppSelector((state: RootState) => state.auth);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    licenseNumber: '',
    qualifications: '',
    location: '',
    speciality: '',
    age: '',
    gender: '',
  });
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [specialities, setSpecialities] = useState<Speciality[]>([]);

  const doctorId = user?._id;

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/doctors/${doctorId}`,
          { withCredentials: true }
        );
        const data = response.data;
        setFormData({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          licenseNumber: data.licenseNumber || '',
          qualifications: data.qualifications?.join(', ') || '',
          location: data.location || '',
          speciality: data.speciality || '',
          age: data.age || '',
          gender: data.gender || '',
        });
        const imageUrl = getImageUrl(data.profilePicture);
        setProfilePicture(imageUrl);
        setPreviewImage(imageUrl);
      } catch (error) {
        console.error('Error fetching doctor profile:', error);
        toast.error('Failed to load profile', {
          position: 'bottom-right',
          autoClose: 3000,
        });
      }
    };

    const fetchSpecialities = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/doctors/specialities`,
          { withCredentials: true }
        );
        setSpecialities(response.data);
      } catch (error) {
        console.error('Error fetching specialities:', error);
        toast.error('Failed to load specialities', {
          position: 'bottom-right',
          autoClose: 3000,
        });
      }
    };

    fetchProfile();
    fetchSpecialities();
  }, [doctorId]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    if (name === 'phone' && value.length > 10) return;
    if (name === 'age' && value.length > 3) return;

    setFormData((prev) => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const uploadPhoto = async (file: File) => {
    const formData = new FormData();
    formData.append('profilePicture', file);
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/api/doctors/${doctorId}`,
        formData,
        {
          withCredentials: true,
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );
      const imageUrl = getImageUrl(response.data.profilePicture);
      setProfilePicture(imageUrl);
      setPreviewImage(imageUrl);
      setFile(null);
      toast.success('Profile picture updated successfully!', {
        position: 'bottom-right',
        autoClose: 3000,
      });
    } catch (error: any) {
      const message = error.message || 'Error uploading profile picture';
      toast.error(message, {
        position: 'bottom-right',
        autoClose: 3000,
      });
      console.error('Error uploading photo:', error);
      setPreviewImage(profilePicture);
      throw error;
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
      case 'licenseNumber':
        setErrors((prev) => ({
          ...prev,
          licenseNumber: !value ? 'License Number is required' : null,
        }));
        break;
      case 'qualifications':
        setErrors((prev) => ({
          ...prev,
          qualifications: !value ? 'Qualifications are required' : null,
        }));
        break;
      case 'location':
        setErrors((prev) => ({
          ...prev,
          location: !value ? 'Location is required' : null,
        }));
        break;
      case 'speciality':
        setErrors((prev) => ({
          ...prev,
          speciality: !value ? 'Speciality is required' : null,
        }));
        break;
      case 'age':
        setErrors((prev) => ({
          ...prev,
          age:
            validateNumeric(value, 'Age') ||
            (value && (parseInt(value) < 0 || parseInt(value) > 120)
              ? 'Age must be between 0-120'
              : null),
        }));
        break;
      case 'gender':
        setErrors((prev) => ({
          ...prev,
          gender: !value ? 'Gender is required' : null,
        }));
        break;
      default:
        break;
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string | null> = {};
    let isValid = true;

    Object.entries(formData).forEach(([key, value]) => {
      if (key !== 'email') {
        validateField(key, value);
        if (!value) {
          newErrors[key] = `${
            key.charAt(0).toUpperCase() + key.slice(1)
          } is required`;
          isValid = false;
        } else if (errors[key]) {
          newErrors[key] = errors[key];
          isValid = false;
        } else {
          newErrors[key] = null;
        }
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fill all required fields correctly', {
        position: 'bottom-right',
        autoClose: 3000,
      });
      return;
    }

    toast(
      ({ closeToast }) => (
        <div>
          <p>Are you sure you want to update the profile?</p>
          <button
            onClick={async () => {
              try {
                if (file) {
                  await uploadPhoto(file);
                }

                const response = await axios.patch(
                  `${API_BASE_URL}/api/doctors/${doctorId}`,
                  {
                    ...formData,
                    qualifications: formData.qualifications
                      .split(',')
                      .map((q) => q.trim()),
                  },
                  { withCredentials: true }
                );
                toast.success('Profile updated successfully!', {
                  position: 'bottom-right',
                  autoClose: 3000,
                });
                console.log('Profile updated:', response.data);
              } catch (error: any) {
                toast.error(
                  error.response?.data?.message || 'Error updating profile',
                  {
                    position: 'bottom-right',
                    autoClose: 3000,
                  }
                );
                console.error('Error updating profile:', error);
                setPreviewImage(profilePicture);
                setFile(null);
              }
              closeToast();
            }}
            className="bg-green-500 text-white px-2 py-1 rounded mr-2"
          >
            Yes
          </button>
          <button
            onClick={() => {
              setPreviewImage(profilePicture);
              setFile(null);
              closeToast();
            }}
            className="bg-red-500 text-white px-2 py-1 rounded"
          >
            No
          </button>
        </div>
      ),
      {
        position: 'bottom-right',
        autoClose: false,
        closeOnClick: false,
        draggable: false,
      }
    );
  };

  return (
    <div className="p-6">
      <ToastContainer position="bottom-right" />
      <div className="max-w-4xl mx-auto">
        <div className="w-full h-[72px] bg-white/10 backdrop-blur-lg flex items-center px-6 mb-8 border border-white/20 rounded-lg shadow-sm">
          <h1 className="text-[24px] font-bold text-white bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent">
            Profile
          </h1>
        </div>

        <div className="bg-white/20 backdrop-blur-lg border border-white/20 p-6 rounded-lg shadow-xl">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex flex-col items-center gap-4">
              <div className="w-[126.67px] h-[121.87px] bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center rounded-lg shadow-md overflow-hidden">
                {previewImage ? (
                  <img
                    src={previewImage}
                    alt="Profile Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/avatar.png';
                    }}
                  />
                ) : (
                  <span className="text-[24px] font-bold text-white">DR</span>
                )}
              </div>
              <label className="w-[190px] h-[45.7px] bg-purple-500/20 text-purple-300 text-[12px] rounded-lg hover:bg-purple-500/30 transition-colors flex items-center justify-center cursor-pointer">
                Change Photo
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handlePhotoChange}
                />
              </label>
            </div>

            <div className="flex-1">
              <h2 className="text-[18px] font-bold text-white mb-2">
                Dr. {formData.name}
              </h2>
              <p className="text-[14px] text-gray-200 mb-6">
                {formData.speciality || 'Specialty'}
              </p>

              <h3 className="text-[16px] font-bold text-white bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent mb-4">
                Personal Information
              </h3>

              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Name */}
                  <div>
                    <label className="text-[12px] text-gray-200">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      maxLength={50}
                      className="w-full h-[60.93px] bg-white/10 border border-white/20 rounded-lg px-4 mt-1 text-[14px] text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                    />
                    {errors.name && (
                      <p className="text-red-500 text-[12px]">{errors.name}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="text-[12px] text-gray-200">
                      Email Address
                    </label>
                    <div className="w-full h-[60.93px] bg-white/10 border border-white/20 rounded-lg flex items-center px-4 mt-1">
                      <span className="text-[14px] text-white">
                        {formData.email}
                      </span>
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="text-[12px] text-gray-200">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      maxLength={10}
                      className="w-full h-[60.93px] bg-white/10 border border-white/20 rounded-lg px-4 mt-1 text-[14px] text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                    />
                    {errors.phone && (
                      <p className="text-red-500 text-[12px]">{errors.phone}</p>
                    )}
                  </div>

                  {/* License Number */}
                  <div>
                    <label className="text-[12px] text-gray-200">
                      License Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="licenseNumber"
                      value={formData.licenseNumber}
                      onChange={handleChange}
                      maxLength={20}
                      className="w-full h-[60.93px] bg-white/10 border border-white/20 rounded-lg px-4 mt-1 text-[14px] text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                    />
                    {errors.licenseNumber && (
                      <p className="text-red-500 text-[12px]">
                        {errors.licenseNumber}
                      </p>
                    )}
                  </div>

                  {/* Qualifications */}
                  <div>
                    <label className="text-[12px] text-gray-200">
                      Qualifications (comma-separated){' '}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="qualifications"
                      value={formData.qualifications}
                      onChange={handleChange}
                      maxLength={100}
                      className="w-full h-[60.93px] bg-white/10 border border-white/20 rounded-lg px-4 mt-1 text-[14px] text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                    />
                    {errors.qualifications && (
                      <p className="text-red-500 text-[12px]">
                        {errors.qualifications}
                      </p>
                    )}
                  </div>

                  {/* Location */}
                  <div>
                    <label className="text-[12px] text-gray-200">
                      Location <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      maxLength={50}
                      className="w-full h-[60.93px] bg-white/10 border border-white/20 rounded-lg px-4 mt-1 text-[14px] text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                    />
                    {errors.location && (
                      <p className="text-red-500 text-[12px]">
                        {errors.location}
                      </p>
                    )}
                  </div>

                  {/* Speciality */}
                  <div>
                    <label className="text-[12px] text-gray-200">
                      Speciality <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="speciality"
                      value={formData.speciality}
                      onChange={handleChange}
                      className="w-full h-[60.93px] bg-white/10 border border-white/20 rounded-lg px-4 mt-1 text-[14px] text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                    >
                      <option value="">Select Speciality</option>
                      {specialities.map((speciality) => (
                        <option key={speciality._id} value={speciality.name}>
                          {speciality.name}
                        </option>
                      ))}
                    </select>
                    {errors.speciality && (
                      <p className="text-red-500 text-[12px]">
                        {errors.speciality}
                      </p>
                    )}
                  </div>

                  {/* Age */}
                  <div>
                    <label className="text-[12px] text-gray-200">
                      Age <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="age"
                      value={formData.age}
                      onChange={handleChange}
                      maxLength={3}
                      className="w-full h-[60.93px] bg-white/10 border border-white/20 rounded-lg px-4 mt-1 text-[14px] text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                    />
                    {errors.age && (
                      <p className="text-red-500 text-[12px]">{errors.age}</p>
                    )}
                  </div>

                  {/* Gender */}
                  <div>
                    <label className="text-[12px] text-gray-200">
                      Gender <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className="w-full h-[60.93px] bg-white/10 border border-white/20 rounded-lg px-4 mt-1 text-[14px] text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                    {errors.gender && (
                      <p className="text-red-500 text-[12px]">
                        {errors.gender}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    type="submit"
                    className="w-[190px] h-[60.93px] bg-gradient-to-r from-purple-600 to-blue-600 text-white text-[14px] font-bold rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorProfilePage;
