import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAppSelector } from '../../../redux/hooks';
import { RootState } from '../../../redux/store';
import { API_BASE_URL } from '../../../utils/config';

const ProfileCard = () => {
  const { user } = useAppSelector((state: RootState) => state.auth);
  const [profileImage, setProfileImage] = useState<string>('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [patientData, setPatientData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?._id) return;
      try {
        const response = await axios.get(
          `http://localhost:5000/api/patients/${user?._id}`,
          {
            withCredentials: true,
          }
        );
        setPatientData(response.data);
        const imageUrl = response.data.profilePicture
          ? `${API_BASE_URL}${response.data.profilePicture}`
          : '/images/avatar.png';
        setProfileImage(imageUrl);
      } catch (error) {
        console.error('Error fetching profile:', error);
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
      console.log('File selected:', file.name);
    }
  };

  const handleUpload = async () => {
    if (!previewImage || !user?._id || !selectedFile) return;

    setLoading(true);

    const formData = new FormData();
    formData.append('profilePicture', selectedFile);

    try {
      console.log('Uploading file:', selectedFile.name);
      const response = await axios.patch(
        `http://localhost:5000/api/patients/${user._id}`,
        formData,
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      console.log('Upload response:', response.data);
      setProfileImage(response.data.profilePicture || null);
      setPreviewImage(null);
      setSelectedFile(null);
    } catch (error) {
      console.error('Error uploading photo:', error);
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
              src={previewImage || profileImage || undefined}
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
        <p className="text-sm text-gray-200">{patientData?.address || 'N/A'}</p>
        <p className="text-sm text-gray-200">
          Joined:{' '}
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
