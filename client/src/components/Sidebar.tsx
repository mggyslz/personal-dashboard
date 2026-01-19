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
  { icon: MessageCircle, url: 'https://www.messenger.com/e2ee/t/7717579328294432/', label: 'Messenger', color: 'bg-blue-500' },
  { icon: Facebook, url: 'https://facebook.com', label: 'Facebook', color: 'bg-blue-600' },
  { icon: Instagram, url: 'https://instagram.com', label: 'Instagram', color: 'bg-pink-600' },
  { icon: Youtube, url: 'https://youtube.com', label: 'YouTube', color: 'bg-red-600' },
  { icon: Code, url: 'https://leetcode.com/u/miggymiggyimperialcea/', label: 'LeetCode', color: 'bg-orange-500' },
  { icon: SiOpenai, url: 'https://chat.openai.com', label: 'ChatGPT', color: 'bg-green-500' },
  { icon: SiSpotify, url: 'https://open.spotify.com', label: 'Spotify', color: 'bg-green-400' },
  { icon: SiGithub, url: 'https://github.com/mggyslz', label: 'GitHub', color: 'bg-gray-800' },
];

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-screen w-20 z-50">
      {/* Background */}
      <div className="absolute inset-0 bg-white border-r-2 border-black" />

      {/* Content */}
      <div className="relative h-full flex flex-col items-center py-6">
        {/* Brand - Red only */}
        <div className="mb-8">
          <div className="w-12 h-12 border-2 border-black bg-red-400 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center overflow-hidden hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] transition-all duration-150">
            <div className="font-black text-lg">MZ</div>
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
                  className={`group relative w-12 h-12 border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] transition-all duration-150`}
                >
                  {/* Colored background on hover */}
                  <div className={`absolute inset-0 ${link.color} opacity-0 group-hover:opacity-100 transition-opacity duration-150`} />
                  
                  {/* Icon */}
                  <Icon className="w-5 h-5 text-black group-hover:text-white transition-colors duration-150 relative z-10" />
                </a>
              );
            })}
          </nav>
        </div>

        {/* Settings */}
        <div className="mt-auto">
          <button className="group w-12 h-12 border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] hover:bg-black transition-all duration-150">
            <Settings className="w-5 h-5 text-black group-hover:text-white transition-colors duration-150" />
          </button>
        </div>
      </div>
    </aside>
  );
}