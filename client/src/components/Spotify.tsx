import React from 'react';

const Spotify: React.FC = () => {
  return (
    <div className="bg-white shadow-sm rounded-lg p-4">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Spotify</h2>
      <div className="w-full">
        <iframe
          data-testid="embed-iframe"
          style={{ borderRadius: '12px' }}
          src="https://open.spotify.com/embed/playlist/37i9dQZF1DX7QOv5kjbU68?utm_source=generator&theme=0"
          width="100%"
          height="380"
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
