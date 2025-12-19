import React from 'react';
import { Music } from 'lucide-react';

const Spotify: React.FC = () => {
  return (
    <div className="bg-white/60 backdrop-blur-sm p-8 rounded-3xl border border-gray-200/50 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center gap-2 mb-6">
        <Music className="text-gray-400" size={20} strokeWidth={1.5} />
        <h2 className="text-lg font-light text-gray-700">Music</h2>
      </div>
      <div className="w-full">
        <iframe
          style={{ borderRadius: '16px' }}
          src="https://open.spotify.com/embed/playlist/37i9dQZF1DX7QOv5kjbU68?utm_source=generator&theme=0"
          width="100%"
          height="352"
          frameBorder="0"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          title="Spotify Playlist"
        ></iframe>
      </div>
    </div>
  );
};

export default Spotify;