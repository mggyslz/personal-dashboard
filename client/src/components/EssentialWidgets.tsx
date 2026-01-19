import React from 'react';
import Clock from '../components/Clock';
import Weather from '../components/Weather';
import Quote from '../components/Quotes';

export default function EssentialWidgets() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
      <div className="lg:col-span-4">
        <Clock />
      </div>
      <div className="lg:col-span-4">
        <Weather />
      </div>
      <div className="lg:col-span-4">
        <Quote />
      </div>
    </div>
  );
}