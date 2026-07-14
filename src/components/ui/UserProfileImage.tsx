'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ASSETS } from '@/constants';

interface UserProfileImageProps {
  src?: string | null;
  alt?: string;
  width?: number;
  height?: number;
  className?: string;
}

export default function UserProfileImage({
  src,
  alt = 'Profile Picture',
  width = 48,
  height = 48,
  className = '',
}: UserProfileImageProps) {
  const [imageSrc, setImageSrc] = useState<string>(ASSETS.DEFAULT_PROFILE_PICTURE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (src) {
      setImageSrc(src);
    } else {
      setImageSrc(ASSETS.DEFAULT_PROFILE_PICTURE);
    }
  }, [src]);

  return (
    <div 
      className={`relative overflow-hidden shrink-0 ${className}`}
      style={{ width, height }}
    >
      {loading && (
        <div className="absolute inset-0 shimmer-placeholder rounded-inherit z-10" />
      )}
      <Image
        src={imageSrc}
        alt={alt}
        width={width}
        height={height}
        unoptimized
        className={`w-full h-full object-cover ${imageSrc === ASSETS.DEFAULT_PROFILE_PICTURE ? 'dark:invert dark:opacity-85' : ''}`}
        style={{ opacity: loading ? 0 : 1 }}
        onLoad={() => setLoading(false)}
        onError={() => {
          setImageSrc(ASSETS.DEFAULT_PROFILE_PICTURE);
          setLoading(false);
        }}
      />
    </div>
  );
}
