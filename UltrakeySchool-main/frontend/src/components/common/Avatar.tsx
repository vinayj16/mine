import React, { useState, useEffect } from 'react';

interface AvatarProps {
  name?: string;
  src?: string | null;
  size?: number;
  className?: string;
  variant?: 'circle' | 'rounded' | 'square';
}

const avatarColors = [
  '#6366f1', '#8b5cf6', '#a855f7', '#ec4899',
  '#f43f5e', '#ef4444', '#f97316', '#eab308',
  '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
];

function getColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

const Avatar: React.FC<AvatarProps> = ({
  name = 'U',
  src,
  size = 36,
  className = '',
  variant = 'circle',
}) => {
  const [imgError, setImgError] = useState(false);
  const borderRadius = variant === 'circle' ? '50%' : variant === 'rounded' ? '8px' : '4px';

  // Reset error state when src changes (e.g., after re-upload)
  useEffect(() => {
    setImgError(false);
  }, [src]);

  if (src && !imgError) {
    return (
      <img
        src={src}
        alt={name}
        className={className}
        style={{ width: size, height: size, borderRadius, objectFit: 'cover', flexShrink: 0 }}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div
      className={`d-inline-flex align-items-center justify-content-center text-white fw-semibold ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius,
        backgroundColor: getColor(name),
        fontSize: Math.max(size * 0.38, 11),
        flexShrink: 0,
        lineHeight: 1,
        userSelect: 'none',
      }}
      title={name}
    >
      {getInitials(name)}
    </div>
  );
};

export default Avatar;
