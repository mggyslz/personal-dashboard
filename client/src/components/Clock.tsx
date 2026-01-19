import { useEffect, useState } from "react";

export default function Clock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const minutes = time.getMinutes();
  const hours = time.getHours() % 12 || 12;

  const minuteDeg = minutes * 6;
  const hourDeg = hours * 30 + minutes * 0.5;

  return (
    <div className="border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-200 h-full bg-white">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-black">ANALOG CLOCK</h2>
        <div className="px-3 py-1 border-2 border-black text-sm font-bold">
          LIVE
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        {/* Digital Time */}
        <div className="flex flex-col">
          <div className="text-5xl font-black tracking-tight mb-2">
            {time.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            })}
          </div>

          <div className="text-sm font-black mt-4 tracking-wide border-t-2 border-black pt-3">
            {time.toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            }).toUpperCase()}
          </div>
        </div>

        {/* Analog Clock */}
        <div className="relative w-32 h-32">
          {/* Clock face */}
          <div className="absolute inset-0 rounded-full border-4 border-black" />
          
          {/* Hour marks */}
          {Array.from({ length: 12 }).map((_, i) => {
            const isMajor = i % 3 === 0; // Major marks at 12, 3, 6, 9
            return (
              <div
                key={i}
                className={`absolute ${isMajor ? 'w-3 h-4' : 'w-2 h-3'}`}
                style={{
                  left: '50%',
                  top: '4px',
                  transform: `translateX(-50%) rotate(${i * 30}deg)`,
                  transformOrigin: 'bottom center',
                }}
              />
            );
          })}
          
          {/* Decorative dots at each hour */}
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={`dot-${i}`}
              className="absolute w-1.5 h-1.5 rounded-full border border-black"
              style={{
                left: '50%',
                top: '50%',
                transform: `translate(-50%, -50%) translate(${Math.sin(i * 30 * Math.PI / 180) * 50}px, ${-Math.cos(i * 30 * Math.PI / 180) * 50}px)`,
              }}
            />
          ))}
          
          {/* Center dot */}
          <div className="absolute w-4 h-4 rounded-full z-10 border border-black" style={{
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
          }} />
          
          {/* Hour hand */}
          <div
            className="absolute w-3 h-10 rounded-full z-5 border border-black"
            style={{
              left: '50%',
              bottom: '50%',
              transform: `translateX(-50%) rotate(${hourDeg}deg)`,
              transformOrigin: 'bottom center',
            }}
          />
          
          {/* Minute hand */}
          <div
            className="absolute w-2 h-14 rounded-full z-5 border border-black"
            style={{
              left: '50%',
              bottom: '50%',
              transform: `translateX(-50%) rotate(${minuteDeg}deg)`,
              transformOrigin: 'bottom center',
            }}
          />
        </div>
      </div>
    </div>
  );
}