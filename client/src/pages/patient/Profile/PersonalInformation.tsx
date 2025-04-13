import { useState, useEffect } from 'react';
import axios from 'axios';
import ProfileCard from './ProfileCard';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  validateName,
  validateNumeric,
  validatePhone,
} from '../../../utils/validation';

const PersonalInformation = ({ patientId }: { patientId: string }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    age: '',
    gender: '',
    address: '',
    pincode: '',
  });
  const [errors, setErrors] = useState<Record<string, string | null>>({});

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get(
          `http://localhost:5000/api/patients/${patientId}`,
          { withCredentials: true }
        );
        const data = response.data;
        setFormData({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          age: data.age || '',
          gender: data.gender || '',
          address: data.address || '',
          pincode: data.pincode || '',
        });
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };
    fetchProfile();
  }, [patientId]);

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
              : null),
        }));
        break;
      case 'gender':
        setErrors((prev) => ({
          ...prev,
          gender: !value ? 'Gender is required' : null,
        }));
        break;
      case 'address':
        setErrors((prev) => ({
          ...prev,
          address: !value ? 'Address is required' : null,
        }));
        break;
      case 'pincode':
        setErrors((prev) => ({
          ...prev,
          pincode:
            validateNumeric(value, 'Pincode') ||
            (value.length !== 6 ? 'Pincode must be 6 digits' : null),
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
                const response = await axios.patch(
                  `http://localhost:5000/api/patients/${patientId}`,
                  formData,
                  { withCredentials: true }
                );
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
              }
              closeToast();
            }}
            className="bg-green-500 text-white px-2 py-1 rounded mr-2"
          >
            Yes
          </button>
          <button
            onClick={closeToast}
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
    <div className="flex flex-col md:flex-row gap-6">
      <ToastContainer position="bottom-right" />
      <div className="w-full md:w-80">
        <ProfileCard />
      </div>
      <div className="flex-1">
        <form onSubmit={handleSubmit}>
          <h2 className="text-lg font-bold text-white bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent mb-6">
            Personal Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">
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
                <p className="text-red-500 text-sm">{errors.name}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                disabled
                className="w-full p-3 bg-white/20 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none opacity-75"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">
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
                <p className="text-red-500 text-sm">{errors.phone}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">
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
                <p className="text-red-500 text-sm">{errors.age}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">
                Gender <span className="text-red-500">*</span>
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
              >
                <option value="" className="text-gray-400">
                  Select Gender
                </option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              {errors.gender && (
                <p className="text-red-500 text-sm">{errors.gender}</p>
              )}
            </div>
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-200 mb-1">
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
              <p className="text-red-500 text-sm">{errors.address}</p>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">
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
                <p className="text-red-500 text-sm">{errors.pincode}</p>
              )}
            </div>
          </div>
          <div>
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold text-base rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Update Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PersonalInformation;
