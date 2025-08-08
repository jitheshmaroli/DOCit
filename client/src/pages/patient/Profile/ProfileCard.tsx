/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { AxiosError } from 'axios';
import { useAppSelector } from '../../../redux/hooks';
import { RootState } from '../../../redux/store';
import { getImageUrl } from '../../../utils/config';
import { Patient } from '../../../types/authTypes';
import { toast } from 'react-toastify';
import api from '../../../services/api';

interface ApiError {
  message: string;
  status?: number;
}

const ProfileCard = () => {
  const { user } = useAppSelector((state: RootState) => state.auth);
  const [profileImage, setProfileImage] = useState<string>('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [patientData, setPatientData] = useState<Patient | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?._id) return;
      try {
        const response = await api.get(`/api/patients/${user._id}`);
        setPatientData(response.data);
        setProfileImage(getImageUrl(response.data.profilePicture));
      } catch (error) {
        const axiosError = error as AxiosError<ApiError>;
        toast.error(
          axiosError.response?.data.message || 'Error fetching profile'
        );
      }
    };
    fetchProfile();
  }, [user?._id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setPreviewImage(previewUrl);
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!previewImage || !user?._id || !selectedFile) return;

    setLoading(true);

    const formData = new FormData();
    formData.append('profilePicture', selectedFile);

    try {
      const response = await api.patch(`/api/patients/${user._id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setProfileImage(getImageUrl(response.data.profilePicture));
      setPatientData(response.data);
      setPreviewImage(null);
      setSelectedFile(null);
      toast.success('Profile picture updated successfully');
    } catch (error: any) {
      const message = error.message || 'Error uploading profile picture';
      toast.error(message, {
        position: 'bottom-right',
        autoClose: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (previewImage) {
        URL.revokeObjectURL(previewImage);
      }
    };
  }, [previewImage]);

  if (!user?._id) {
    return <div>Please log in to view your profile</div>;
  }

  return (
    <div className="w-full max-w-sm bg-white/20 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl">
      <div className="flex flex-col items-center pt-6 pb-4">
        <div className="w-32 h-32 mb-4 bg-gray-200 rounded-full overflow-hidden shadow-md relative">
          {previewImage || profileImage ? (
            <img
              src={previewImage || profileImage}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              No Image
            </div>
          )}
        </div>
        <h2 className="text-lg font-bold text-white">
          {patientData?.name || 'Loading...'}
        </h2>
        <p className="text-sm text-gray-200">
          Joined:
          {patientData?.createdAt
            ? new Date(patientData.createdAt).toLocaleDateString()
            : 'N/A'}
        </p>
      </div>
      <div className="w-full px-4 pb-6">
        <label className="w-full py-3 bg-purple-500/20 text-purple-300 text-sm font-medium rounded-lg hover:bg-purple-500/30 transition-colors block text-center cursor-pointer">
          Edit Profile Photo
          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
          />
        </label>
        {previewImage && (
          <button
            onClick={handleUpload}
            disabled={loading}
            className={`w-full mt-2 py-3 text-sm font-medium rounded-lg transition-colors ${
              loading
                ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                : 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30'
            }`}
          >
            {loading ? 'Uploading...' : 'Upload Photo'}
          </button>
        )}
      </div>
    </div>
  );
};

export default ProfileCard;
