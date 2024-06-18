'use client';


import Link from 'next/link';
import { useUser } from '@clerk/clerk-react';
import { UserNav } from './common/UserNav';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { useStoreUserEffect } from '@/useUseStoreEffect';

type NavigationItem = {
  name: string;
  href: string;
  current: boolean;
};

const navigation: NavigationItem[] = [
  { name: 'Benefits', href: '#Benefits', current: true },
  { name: 'Reviews', href: '#reviews', current: false },
];


export default function Header() {
  const { user } = useStoreUserEffect();
  const pathname = usePathname();

  function getStyle(target:string){
    if(pathname == "/" + target) {
      return "navigation-selected"
    }else if(["episode","episodes"].includes(target)){
      return "navigation-off"
      //TODO remove link when navigation-off, remember last choosen
    }else{
      return "navigation"
    }
  }
  function navigation(target: string, label?: string) {
    const label_string: string = label ? label : target

    return <Link className={getStyle(target)} href={target}>{label_string}</Link>
  }

  return (
    <>
      <div className='header-center'>
        <Link href="/">
          <Image src={'/images/icons8-nautilus-96.png'} width={40} height={40} alt="logo" />
        </Link>
        <Link href="/">
          <h1 className="rainbow-text">
            everwzh
          </h1>
        </Link>
        {user ? (
          <div >
            <UserNav
              image={user?.imageUrl}
              name={user?.fullName!}
              email={user?.primaryEmailAddress?.emailAddress!}
            />
          </div>
        ) : (
          <div className=''>
            <Link
              href='/'
              className='border rounded-lg border-solid border-[#2D2D2D] text-[#2D2D2D] text-center text-xl not-italic font-normal leading-[normal] font-montserrat px-[22px] py-2.5'
            >
              Sign in
            </Link>
            <Link
              href='/'
              className=' text-white text-center text-xl not-italic font-normal leading-[normal] font-montserrat px-[22px] py-[11px] button'
            >
              Get Started
            </Link>
          </div>
        )}

      </div>
      <div className='header-center'>
        <div>
          {navigation("timeline")} | {navigation("podcasts")} | {navigation("episodes")} | {navigation("episode")}</div>
      </div>
    </>
  );
}
