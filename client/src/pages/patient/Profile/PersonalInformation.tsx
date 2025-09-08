import { useState, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  validateName,
  validateNumeric,
  validatePhone,
} from '../../../utils/validation';
import api from '../../../services/api';
import ROUTES from '../../../constants/routeConstants';
import { getImageUrl } from '../../../utils/config';
import { useAppSelector } from '../../../redux/hooks';
import { RootState } from '../../../redux/store';
import { useNavigate } from 'react-router-dom';

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
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast.error('Failed to load profile', {
          position: 'bottom-right',
          autoClose: 3000,
        });
      }
    };
    fetchProfile();
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
      for (const field of fields) {
        if (formData[field] !== initialFormData[field]) {
          return true;
        }
      }
      return false;
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
          newErrors[key] = `${
            key.charAt(0).toUpperCase() + key.slice(1)
          } is required`;
          isValid = false;
        } else if (errors[key]) {
          newErrors[key] = errors[key];
          isValid = false;
        } else {
          newErrors[key] = undefined;
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
                const formDataToSend = new FormData();
                formDataToSend.append('name', formData.name);
                formDataToSend.append('phone', formData.phone);
                formDataToSend.append('age', formData.age);
                formDataToSend.append('gender', formData.gender);
                formDataToSend.append('address', formData.address);
                formDataToSend.append('pincode', formData.pincode);
                if (file) {
                  formDataToSend.append('profilePicture', file);
                }

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

                toast.success('Profile updated successfully!', {
                  position: 'bottom-right',
                  autoClose: 3000,
                });
                console.log('Profile updated:', response.data);
              } catch (error) {
                toast.error('Error updating profile', {
                  position: 'bottom-right',
                  autoClose: 3000,
                });
                console.error('Error updating profile:', error);
                setPreviewImage(profilePicture);
                setFile(null);
              }
              closeToast();
            }}
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg mr-2 hover:from-purple-700 hover:to-blue-700 transition-all duration-300"
          >
            Yes
          </button>
          <button
            onClick={() => {
              setPreviewImage(profilePicture);
              setFile(null);
              closeToast();
            }}
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg mr-2 hover:from-purple-700 hover:to-blue-700 transition-all duration-300"
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
        className:
          'bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl',
      }
    );
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-800 to-indigo-900 py-8 px-4 sm:px-6 lg:px-8">
      <ToastContainer position="bottom-right" />
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
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/avatar.png';
                    }}
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
                <div className="mt-6 flex justify-end">
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
      </div>
    </div>
  );
};

export default PersonalInformation;
