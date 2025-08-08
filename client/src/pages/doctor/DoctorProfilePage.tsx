/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  validateName,
  validatePhone,
  validateNumeric,
} from '../../utils/validation';
import { RootState } from '../../redux/store';
import { useAppSelector } from '../../redux/hooks';
import { getImageUrl } from '../../utils/config';
import api from '../../services/api';

interface Speciality {
  _id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

interface Experience {
  hospitalName: string;
  department: string;
  years: string;
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
    gender: '',
    experiences: [] as Experience[],
  });
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [experienceErrors, setExperienceErrors] = useState<
    Array<Record<string, string | null>>
  >([]);
  const [specialities, setSpecialities] = useState<Speciality[]>([]);

  const doctorId = user?._id;

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get(`/api/doctors/${doctorId}`);
        const data = response.data;
        console.log('datadoctor:', data);
        setFormData({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          licenseNumber: data.licenseNumber || '',
          qualifications: data.qualifications?.join(', ') || '',
          location: data.location || '',
          speciality: data.speciality || '',
          gender: data.gender || '',
          experiences:
            data.experiences?.map((exp: any) => ({
              hospitalName: exp.hospitalName || '',
              department: exp.department || '',
              years: exp.years?.toString() || '',
            })) || [],
        });
        const imageUrl = getImageUrl(data.profilePicture);
        setProfilePicture(imageUrl);
        setPreviewImage(imageUrl);
        setExperienceErrors(data.experiences?.map(() => ({})) || []);
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
        const response = await api.get(`/api/doctors/specialities`);
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

    setFormData((prev) => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  const handleExperienceChange = (
    index: number,
    field: keyof Experience,
    value: string
  ) => {
    if (field === 'years' && value.length > 2) return;

    setFormData((prev) => ({
      ...prev,
      experiences: prev.experiences.map((exp, i) =>
        i === index ? { ...exp, [field]: value } : exp
      ),
    }));
    validateExperienceField(index, field, value);
  };

  const addExperience = () => {
    setFormData((prev) => ({
      ...prev,
      experiences: [
        ...prev.experiences,
        { hospitalName: '', department: '', years: '' },
      ],
    }));
    setExperienceErrors((prev) => [...prev, {}]);
  };

  const removeExperience = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      experiences: prev.experiences.filter((_, i) => i !== index),
    }));
    setExperienceErrors((prev) => prev.filter((_, i) => i !== index));
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

  const validateExperienceField = (
    index: number,
    field: keyof Experience,
    value: string
  ) => {
    setExperienceErrors((prev) => {
      const newErrors = [...prev];
      newErrors[index] = { ...newErrors[index] };

      switch (field) {
        case 'hospitalName':
          newErrors[index].hospitalName = !value
            ? 'Hospital Name is required'
            : value.length > 100
              ? 'Hospital Name must be 100 characters or less'
              : null;
          break;
        case 'department':
          newErrors[index].department = !value
            ? 'Department is required'
            : value.length > 50
              ? 'Department must be 50 characters or less'
              : null;
          break;
        case 'years':
          newErrors[index].years =
            validateNumeric(value, 'Years') ||
            (value && (parseInt(value) < 0 || parseInt(value) > 99)
              ? 'Years must be between 0-99'
              : null);
          break;
        default:
          break;
      }
      return newErrors;
    });
  };

  const validateForm = () => {
    const newErrors: Record<string, string | null> = {};
    let isValid = true;

    Object.entries(formData).forEach(([key, value]) => {
      if (key !== 'email' && key !== 'experiences') {
        validateField(key, value as string);
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

    const newExperienceErrors = formData.experiences.map((exp, index) => {
      validateExperienceField(index, 'hospitalName', exp.hospitalName);
      validateExperienceField(index, 'department', exp.department);
      validateExperienceField(index, 'years', exp.years);
      if (
        !exp.hospitalName ||
        !exp.department ||
        !exp.years ||
        (exp.years && (parseInt(exp.years) < 0 || parseInt(exp.years) > 99))
      ) {
        isValid = false;
      }
      return {
        hospitalName: !exp.hospitalName ? 'Hospital Name is required' : null,
        department: !exp.department ? 'Department is required' : null,
        years:
          validateNumeric(exp.years, 'Years') ||
          (exp.years && (parseInt(exp.years) < 0 || parseInt(exp.years) > 99)
            ? 'Years must be between 0-99'
            : null),
      };
    });

    setErrors(newErrors);
    setExperienceErrors(newExperienceErrors);
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
                const formDataToSend = new FormData();
                formDataToSend.append('name', formData.name);
                formDataToSend.append('phone', formData.phone);
                formDataToSend.append('licenseNumber', formData.licenseNumber);
                formDataToSend.append(
                  'qualifications',
                  formData.qualifications
                );
                formDataToSend.append('location', formData.location);
                formDataToSend.append('speciality', formData.speciality);
                formDataToSend.append('gender', formData.gender);
                formDataToSend.append(
                  'experiences',
                  JSON.stringify(
                    formData.experiences.map((exp) => ({
                      ...exp,
                      years: parseInt(exp.years),
                    }))
                  )
                );
                if (file) {
                  formDataToSend.append('profilePicture', file);
                }

                const response = await api.patch(`/api/doctors/${doctorId}`,
                  formDataToSend,
                  {
                    headers: { 'Content-Type': 'multipart/form-data' },
                  }
                );

                const imageUrl = getImageUrl(response.data.profilePicture);
                setProfilePicture(imageUrl);
                setPreviewImage(imageUrl);
                setFile(null);

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
                      <option value="" className="bg-gray-800 text-white">
                        Select Speciality
                      </option>
                      {specialities.map((speciality) => (
                        <option
                          key={speciality._id}
                          value={speciality.name}
                          className="bg-gray-800 text-white"
                        >
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

                  {/* Experiences */}
                  <div className="col-span-2">
                    <label className="text-[12px] text-gray-200">
                      Work Experience
                    </label>
                    {formData.experiences.map((exp, index) => (
                      <div
                        key={index}
                        className="border border-white/20 rounded-lg p-4 mb-4 bg-white/10"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="text-[12px] text-gray-200">
                              Hospital Name
                            </label>
                            <input
                              type="text"
                              value={exp.hospitalName}
                              onChange={(e) =>
                                handleExperienceChange(
                                  index,
                                  'hospitalName',
                                  e.target.value
                                )
                              }
                              maxLength={100}
                              className="w-full h-[60.93px] bg-white/10 border border-white/20 rounded-lg px-4 mt-1 text-[14px] text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                            />
                            {experienceErrors[index]?.hospitalName && (
                              <p className="text-red-500 text-[12px]">
                                {experienceErrors[index].hospitalName}
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="text-[12px] text-gray-200">
                              Department/Position
                            </label>
                            <input
                              type="text"
                              value={exp.department}
                              onChange={(e) =>
                                handleExperienceChange(
                                  index,
                                  'department',
                                  e.target.value
                                )
                              }
                              maxLength={50}
                              className="w-full h-[60.93px] bg-white/10 border border-white/20 rounded-lg px-4 mt-1 text-[14px] text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                            />
                            {experienceErrors[index]?.department && (
                              <p className="text-red-500 text-[12px]">
                                {experienceErrors[index].department}
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="text-[12px] text-gray-200">
                              Years
                            </label>
                            <input
                              type="text"
                              value={exp.years}
                              onChange={(e) =>
                                handleExperienceChange(
                                  index,
                                  'years',
                                  e.target.value
                                )
                              }
                              maxLength={2}
                              className="w-full h-[60.93px] bg-white/10 border border-white/20 rounded-lg px-4 mt-1 text-[14px] text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                            />
                            {experienceErrors[index]?.years && (
                              <p className="text-red-500 text-[12px]">
                                {experienceErrors[index].years}
                              </p>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeExperience(index)}
                          className="mt-2 bg-red-500 text-white px-2 py-1 rounded text-[12px]"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addExperience}
                      className="bg-purple-500 text-white px-2 py-1 rounded text-[12px]"
                    >
                      Add Experience
                    </button>
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
