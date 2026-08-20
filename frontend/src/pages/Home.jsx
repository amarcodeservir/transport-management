import React from "react";
import Hero from '../components/landing/Hero';
import StatsSection from '../components/landing/CTA';
import ProblemSection from '../components/landing/RealProblem';
import Banner from '../components/landing/Banner';
import FeatureSection from '../components/landing/FeatureGrid';
import WhyChooseUs from '../components/landing/Whysection';
import IndiaComplianceSection from '../components/landing/Complaince';
import Footer from '../components/landing/FooterLanding';
import Header from '../components/landing/Header';
import Banners from '../components/landing/Banners';
import IndustriesWeServe from '../components/landing/Industriweservices';
import ScrollTruck from "../components/landing/ScrollTruck";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 overflow-x-hidden">
      <Header />
      <div id="home"><Hero /></div>
      <StatsSection />
      <ProblemSection />
      <Banner />
      <div id="features"><FeatureSection /></div>
      <div id="why-us"><WhyChooseUs /></div>
      <div id="compliance"><IndiaComplianceSection /></div>
      <IndustriesWeServe />
      <Banners />
      <ScrollTruck />
      <div id="contact"><Footer /></div>
    </div>
  );
}