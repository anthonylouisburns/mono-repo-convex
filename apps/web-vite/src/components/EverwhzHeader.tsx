"use client";
import { useAuthActions } from "@convex-dev/auth/react";
import { Authenticated, Unauthenticated } from "convex/react";
import { Link, useLocation } from "react-router-dom";

export default function EverwhzHeader({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { signOut } = useAuthActions();
  const root_page = location.pathname.slice(1).split("/")[0];

  function getStyle(target: string) {
    if (target == root_page) {
      return "navigation-selected";
    }
    if (target == "episodes" || target == "episode") {
      return "navigation-off";
    }
    return "navigation";
  }

  function navigation(target: string, label?: string) {
    const label_string: string = label ? label : target;
    const style = getStyle(target);
    if (style == "navigation-selected") {
      return <span className={style}>{label_string}</span>;
    } else if (style == "navigation-off") {
      return <span>{label_string}</span>;
    } else {
      return (
        <Link className={style} to={target}>
          {label_string}
        </Link>
      );
    }
  }

  return (
    <div className="bg-emerald-50 w-full text-black">
      <div className="header-center">
        <Link to="/">
          <img
            src={"/icons8-nautilus-96.png"}
            width={40}
            height={40}
            alt="logo"
          />
        </Link>
        <div>
          <h1 className="rainbow-text">&nbsp;evrwhz</h1>
        </div>
        <Authenticated>
          <p className="navigation" onClick={() => signOut()}>
            SIGN OUT
          </p>
        </Authenticated>
        <Unauthenticated>
          <p></p>
        </Unauthenticated>
      </div>
      <Authenticated>
        <div className="header-center">
          <div>
            {navigation("timeline")} | 
            {/* {navigation("podcasts")} | */}
            {" "}
            {navigation("episodes")} 
            {/* | {navigation("episode")} */}
          </div>
        </div>
      </Authenticated>
      {children}
    </div>
  );
}
