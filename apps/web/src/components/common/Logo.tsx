import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

interface Props {
  isMobile?: boolean;
}

const Logo = () => {
  return (
    <Link href={'/'}>
      <div className="flex gap-2 items-center">
        <Image src={'/images/icons8-nautilus-96.png'} width={40} height={40} alt="logo" />
          <h1 className="rainbow-text">
            everwhz
          </h1>
      </div>
    </Link>
  );
};

export default Logo;
