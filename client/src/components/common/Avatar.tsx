import React, { useMemo } from 'react';

interface AvatarProps {
  name: string;
  id: string;
  profilePicture?: string;
  className?: string;
}

const Avatar = React.memo(({ name, id, profilePicture, className }: AvatarProps) => {
  const initials = useMemo(() => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  }, [name]);

  const getBackgroundColor = useMemo(() => {
    const colors = ['purple', 'blue', 'indigo', 'violet', 'fuchsia'];
    const colorIndex = id.charCodeAt(0) % colors.length;
    const colorMap: Record<string, string> = {
      purple: 'bg-purple-500/20 text-purple-300',
      blue: 'bg-blue-500/20 text-blue-300',
      indigo: 'bg-indigo-500/20 text-indigo-300',
      violet: 'bg-violet-500/20 text-violet-300',
      fuchsia: 'bg-fuchsia-500/20 text-fuchsia-300',
    };
    return colorMap[colors[colorIndex]] || 'bg-gray-500/20 text-gray-300';
  }, [id]);

  const imageUrl = useMemo(() => {
    if (!profilePicture) return null;

    // Check if it's already an absolute URL
    if (profilePicture.startsWith('http') || profilePicture.startsWith('//')) {
      return profilePicture;
    }

    return `${import.meta.env.VITE_API_BASE_URL}${profilePicture}`;
  }, [profilePicture]);

  return (
    <div
      className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${getBackgroundColor} ${className || ''}`}
    >
      {imageUrl ? (
        <img src={imageUrl} alt={name} className="h-full w-full rounded-full object-cover" />
      ) : (
        initials
      )}
    </div>
  );
});

export default Avatar;
