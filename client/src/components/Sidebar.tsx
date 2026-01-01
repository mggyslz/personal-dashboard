import {
  MessageCircle,
  Facebook,
  Instagram,
  Youtube,
  Code,
  Settings,
} from 'lucide-react';

import { SiOpenai, SiSpotify, SiGithub } from 'react-icons/si';

const socialLinks = [
  { icon: MessageCircle, url: 'https://messenger.com', label: 'Messenger', hover: 'group-hover:text-blue-600' },
  { icon: Facebook, url: 'https://facebook.com', label: 'Facebook', hover: 'group-hover:text-blue-700' },
  { icon: Instagram, url: 'https://instagram.com', label: 'Instagram', hover: 'group-hover:text-pink-600' },
  { icon: Youtube, url: 'https://youtube.com', label: 'YouTube', hover: 'group-hover:text-red-600' },
  { icon: Code, url: 'https://leetcode.com', label: 'LeetCode', hover: 'group-hover:text-orange-600' },
  { icon: SiOpenai, url: 'https://chat.openai.com', label: 'ChatGPT', hover: 'group-hover:text-purple-600' },
  { icon: SiSpotify, url: 'https://open.spotify.com', label: 'Spotify', hover: 'group-hover:text-green-600' },
  { icon: SiGithub, url: 'https://github.com/mggyslz', label: 'GitHub', hover: 'group-hover:text-black' },
];

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-screen w-20 z-50">
      {/* Background */}
      <div className="absolute inset-0 backdrop-blur-xl bg-white/20 border-r border-white/40" />

      {/* Content */}
      <div className="relative h-full flex flex-col items-center py-6">
        {/* Brand */}
        <div className="mb-8">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-gray-900 to-gray-700 flex items-center justify-center shadow-lg overflow-hidden">
            <img 
              src="/favicon.ico" 
              alt="MZ Logo" 
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Social Links */}
        <div className="flex-1 flex flex-col items-center gap-2">
          <nav className="flex flex-col gap-2">
            {socialLinks.map((link, index) => {
              const Icon = link.icon;

              return (
                <a
                  key={index}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative p-3 rounded-2xl hover:bg-white/30 transition-all duration-200 hover:scale-105"
                  title={link.label}
                >
                  <Icon className={`w-[22px] h-[22px] text-gray-500 transition-colors ${link.hover}`} />
                  {/* Tooltip */}
                  <span className="absolute left-full ml-4 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {link.label}
                  </span>
                </a>
              );
            })}
          </nav>
        </div>

        {/* Settings */}
        <div className="mt-auto">
          <button className="group relative p-3 rounded-2xl hover:bg-white/30 transition-all hover:scale-105">
            <Settings className="w-[22px] h-[22px] text-gray-600 group-hover:text-gray-900" />
            <span className="absolute left-full ml-4 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Settings
            </span>
          </button>
        </div>
      </div>
    </aside>
  );
}
