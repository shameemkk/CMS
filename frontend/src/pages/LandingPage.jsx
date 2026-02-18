import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

// Counter Component
const Counter = ({ end, suffix = '', duration = 2000 }) => {
  const [count, setCount] = useState(0);
  const counterRef = useRef(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated.current) {
            hasAnimated.current = true;
            let startTime = null;
            const startValue = 0;
            const endValue = end;

            const animate = (currentTime) => {
              if (startTime === null) startTime = currentTime;
              const timeElapsed = currentTime - startTime;
              const progress = Math.min(timeElapsed / duration, 1);

              // Easing function for smooth animation
              const easeOutQuart = 1 - Math.pow(1 - progress, 4);
              const currentCount = Math.floor(startValue + (endValue - startValue) * easeOutQuart);

              setCount(currentCount);

              if (progress < 1) {
                requestAnimationFrame(animate);
              } else {
                setCount(endValue);
              }
            };

            requestAnimationFrame(animate);
          }
        });
      },
      { threshold: 0.5 }
    );

    if (counterRef.current) {
      observer.observe(counterRef.current);
    }

    return () => {
      if (counterRef.current) {
        observer.unobserve(counterRef.current);
      }
    };
  }, [end, duration]);

  return (
    <div ref={counterRef}>
      <span className="text-3xl md:text-4xl font-bold text-[#6e0718]">
        {count.toLocaleString()}
      </span>
      <span className="text-3xl md:text-4xl font-bold text-[#6e0718]">{suffix}</span>
    </div>
  );
};

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-md border-b-1 border-gray-300">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <img 
              src="/newlogo.webp" 
              alt="Safa College Logo" 
              className="h-12 w-auto"
            />
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/announcements')}
              className=" relative bg-[#6e0718] text-white px-6 py-2.5 rounded-lg hover:from-orange-600 hover:to-red-700 transition-all duration-300 font-semibold shadow-lg"
            >
              <span className="relative z-10 flex items-center gap-2">
                <span className="text-lg animate-bounce inline-block">🔔</span>
                <span>Announcements!</span>
              </span>
              {/* <span className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-ping"></span> */}
              {/* <span className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full"></span> */}
            </button>
            <button
              onClick={() => navigate('/login')}
              className="bg-[#6e0718] text-white px-6 py-2 rounded-lg hover:bg-[#8a0a1f] transition-colors duration-200 font-semibold"
            >
              Sign In
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-grow">
        <div className="flex flex-col md:flex-row h-[calc(100vh-200px)] min-h-[600px]">
          {/* Left Side - text content */}
          <div className="w-full md:w-3/5 bg-white flex items-center justify-center px-6 md:px-12 py-12">
            <div className="max-w-3xl w-full">
              <h1 className="text-4xl md:text-5xl font-semibold mb-6 text-[#6e0718]">
                Classroom Management System
              </h1>
              <p className="text-lg md:text-xl mb-8 text-gray-700 leading-relaxed">
                Streamline your academic journey with our comprehensive platform designed for students, teachers, and administrators.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <button
                  onClick={() => navigate('/register')}
                  className="bg-white text-[#6e0718] border-1 border-[#6e0718] px-8 py-3 rounded-lg hover:bg-[#6e0718] hover:text-white transition-colors duration-200 font-medium text-lg shadow-lg"
                >
                  Get Started
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="bg-white text-[#6e0718] border-1 border-[#6e0718] px-8 py-3 rounded-lg hover:bg-[#6e0718] hover:text-white transition-colors duration-200 font-medium text-lg shadow-lg"
                >
                  Sign In
                </button>
              </div>

              {/* Stats Counter Section */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8 border-t border-gray-200">
                <div className="text-center">
                  <Counter end={1000} suffix="+" duration={1000} />
                  <p className="text-sm md:text-base text-gray-600 mt-2 font-medium">Students</p>
                </div>
                <div className="text-center">
                  <Counter end={100} suffix="+" duration={1000} />
                  <p className="text-sm md:text-base text-gray-600 mt-2 font-medium">Staffs</p>
                </div>
                <div className="text-center">
                  <Counter end={30} suffix="+" duration={1000} />
                  <p className="text-sm md:text-base text-gray-600 mt-2 font-medium">Departments</p>
                </div>
                <div className="text-center">
                  <Counter end={10} suffix="+" duration={1000} />
                  <p className="text-sm md:text-base text-gray-600 mt-2 font-medium">Programs</p>
                </div>
              </div>
            </div>
          </div>
          

          {/* Right Side - Image */}
          <div className="w-full md:w-2/5 flex items-center justify-center p-6 md:p-8">
            <div className="max-w-sm w-full">
              <img 
                src="/hero.png" 
                alt="Classroom Management System" 
                className="w-full h-auto object-contain"
              />
            </div>
          </div>
        </div>
      </main>

      {/* Programs Section - Clubs Carousel */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-[#6e0718] mb-12">
            Our Programs & Clubs
          </h2>
          <div className="relative overflow-hidden">
            {/* Left gradient overlay */}
            <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-gray-50 to-transparent z-10 pointer-events-none"></div>
            {/* Right gradient overlay */}
            <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-gray-50 to-transparent z-10 pointer-events-none"></div>
            
            <div className="flex animate-scroll">
              {/* First set of images */}
              {[
                '/BiodiversityClub.webp',
                '/forestryclub.png',
                '/HealthClubsafa.png',
                '/IEARNCLUB.png',
                '/NARCOTICCLUB.jpeg',
                '/NSS.png',
                '/raisemeclub.png',
                '/REDRIBBONCLUB.png',
                '/SIP.webp',
                '/sKILL.png'
              ].map((club, index) => (
                <div key={`club-1-${index}`} className="flex-shrink-0 mx-4">
                  <div className="w-64 h-48 bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-105">
                    <img 
                      src={club} 
                      alt={`Club ${index + 1}`}
                      className="w-full h-full object-contain p-4"
                    />
                  </div>
                </div>
              ))}
              {/* Duplicate set for seamless loop */}
              {[
                '/BiodiversityClub.webp',
                '/forestryclub.png',
                '/HealthClubsafa.png',
                '/IEARNCLUB.png',
                '/NARCOTICCLUB.jpeg',
                '/NSS.png',
                '/raisemeclub.png',
                '/REDRIBBONCLUB.png',
                '/SIP.webp',
                '/sKILL.png'
              ].map((club, index) => (
                <div key={`club-2-${index}`} className="flex-shrink-0 mx-4">
                  <div className="w-64 h-48 bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-105">
                    <img 
                      src={club} 
                      alt={`Club ${index + 1}`}
                      className="w-full h-full object-contain p-4"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Students of the Year Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-[#6e0718] mb-12">
            Students of the Year
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-8 max-w-6xl mx-auto">
            {[
              { id: 1, name: 'Student One', achievement: 'Academic Excellence' },
              { id: 2, name: 'Student Two', achievement: 'Research Excellence' },
              { id: 3, name: 'Student Three', achievement: 'Sports Excellence' },
              { id: 4, name: 'Student Four', achievement: 'Cultural Excellence' },
              { id: 5, name: 'Student Five', achievement: 'Leadership Excellence' }
            ].map((student) => (
              <div key={student.id} className="text-center">
                <div className="relative mb-4 group">
                  <div className="w-40 h-40 mx-auto rounded-full overflow-hidden border-4 border-[#6e0718] shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <img 
                      src="/00.jpg" 
                      alt={student.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-[#6e0718] text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-md">
                    #{student.id}
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-1">{student.name}</h3>
                <p className="text-sm text-gray-600">{student.achievement}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-[#6e0718] mb-12">
            Gallery
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 max-w-6xl mx-auto">
            {['/00.jpg', '/13.jpg', '/2.jpg', '/5.jpg', '/1.jpg', '/4.jpeg', '/3.jpeg', '/7.jpeg'].map((image, index) => (
              <div key={`gallery-${index}`} className="relative group overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300">
                <div className="aspect-square overflow-hidden">
                  <img 
                    src={image} 
                    alt={`Gallery ${index + 1}`}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                {/* <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity duration-300"></div> */}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#fff] text-[#6e0718] border-t-1 border-gray-300">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            {/* College Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <img 
                  src="/newlogo.webp" 
                  alt="Safa College Logo" 
                  className="h-14 w-auto"
                />
              </div>
              <p className="text-sm opacity-90 leading-relaxed">
                Empowering education through innovation and excellence. Building tomorrow's leaders today.
              </p>
            </div>

            {/* Contact Us */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold mb-4">Contact Us</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div>
                    <p className="opacity-90 leading-relaxed">
                      Pookkattiri-Edayur Road,<br />
                      Valanchery<br />
                      Kerala 676552<br />
                      Malappuram Dist.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <div>
                    <p className="opacity-90">0494 2988810</p>
                    <p className="opacity-90">0494 2988808</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <a href="mailto:safacollegeoffice@gmail.com" className="opacity-90 hover:opacity-100 transition-opacity">
                    safacollegeoffice@gmail.com
                  </a>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <button
                    onClick={() => navigate('/')}
                    className="opacity-90 hover:opacity-100 hover:underline transition-all"
                  >
                    Home
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate('/login')}
                    className="opacity-90 hover:opacity-100 hover:underline transition-all"
                  >
                    Sign In
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate('/register')}
                    className="opacity-90 hover:opacity-100 hover:underline transition-all"
                  >
                    Register
                  </button>
                </li>
                <li>
                  <a href="#" className="opacity-90 hover:opacity-100 hover:underline transition-all">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#" className="opacity-90 hover:opacity-100 hover:underline transition-all">
                    Departments
                  </a>
                </li>
                <li>
                  <a href="#" className="opacity-90 hover:opacity-100 hover:underline transition-all">
                    Courses
                  </a>
                </li>
              </ul>
            </div>

            {/* Social Media */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold mb-4">Follow Us</h3>
              <div className="flex gap-4">
                <a
                  href="#"
                  className="w-10 h-10 rounded-full bg-[#6e0718] text-white flex items-center justify-center hover:bg-[#8a0a1f] transition-colors"
                  aria-label="Facebook"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                <a
                  href="#"
                  className="w-10 h-10 rounded-full bg-[#6e0718] text-white flex items-center justify-center hover:bg-[#8a0a1f] transition-colors"
                  aria-label="Twitter"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </a>
                <a
                  href="#"
                  className="w-10 h-10 rounded-full bg-[#6e0718] text-white flex items-center justify-center hover:bg-[#8a0a1f] transition-colors"
                  aria-label="Instagram"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
                <a
                  href="#"
                  className="w-10 h-10 rounded-full bg-[#6e0718] text-white flex items-center justify-center hover:bg-[#8a0a1f] transition-colors"
                  aria-label="LinkedIn"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
                <a
                  href="#"
                  className="w-10 h-10 rounded-full bg-[#6e0718] text-white flex items-center justify-center hover:bg-[#8a0a1f] transition-colors"
                  aria-label="YouTube"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </a>
              </div>
              <p className="text-sm opacity-75 mt-4">
                Stay connected with us on social media for the latest updates and news.
              </p>
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t border-gray-300 pt-8 mt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
              <p className="opacity-90">
                © 2024 Safa College of Arts & Science. All rights reserved.
              </p>
              <div className="flex gap-6">
                <a href="#" className="opacity-90 hover:opacity-100 hover:underline transition-all">
                  Privacy Policy
                </a>
                <a href="#" className="opacity-90 hover:opacity-100 hover:underline transition-all">
                  Terms of Service
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

