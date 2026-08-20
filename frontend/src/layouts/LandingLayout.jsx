import React from 'react';
import FooterLanding from '../components/landing/FooterLanding';

export default function LandingLayout({ children }){
  return (
    <div className="landing-root">
      <main>{children}</main>
      <FooterLanding />
    </div>
  );
}
