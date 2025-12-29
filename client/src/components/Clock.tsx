import { useEffect, useState } from "react";

export default function Clock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const seconds = time.getSeconds();
  const minutes = time.getMinutes();
  const hours = time.getHours() % 12 || 12; // 12-hour format

  const secondDeg = seconds * 6;
  const minuteDeg = minutes * 6 + seconds * 0.1;
  const hourDeg = hours * 30 + minutes * 0.5;

  return (
    <div className="h-full backdrop-blur-xl bg-gradient-to-br from-white/80 to-white/40 rounded-3xl p-8 shadow-lg shadow-black/5 hover:shadow-xl hover:shadow-black/10 transition-all duration-300">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100/50 flex items-center justify-center">
          <div className="text-gray-600 font-light text-xs">TIME</div>
        </div>
        <h2 className="text-lg font-light text-gray-700">Clock</h2>
      </div>

      <div className="flex items-center justify-between">
        {/* Digital Time */}
        <div className="flex flex-col">
          <div className="text-6xl font-thin text-gray-900 tracking-tight">
            {time.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            })}
          </div>

          <div className="text-base text-gray-500 mt-2 font-light">
            {time.getSeconds()} seconds
          </div>

          <div className="text-sm text-gray-400 mt-6 font-light tracking-wide">
            {time.toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </div>
        </div>

        {/* Analog Clock */}
        <div className="relative w-32 h-32">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-gray-50 to-white shadow-inner border border-gray-200/50" />

          {Array.from({ length: 12 }).map((_, i) => {
            const angle = (i * 30 * Math.PI) / 180;
            const length = 8;
            const x1 = 64 + 52 * Math.sin(angle);
            const y1 = 64 - 52 * Math.cos(angle);

            return (
              <div
                key={i}
                className="absolute w-px bg-gray-300/50"
                style={{
                  left: `${x1}px`,
                  top: `${y1}px`,
                  height: `${length}px`,
                  transform: `rotate(${i * 30}deg)`,
                  transformOrigin: "top",
                }}
              />
            );
          })}

          <div
            className="absolute w-1.5 h-12 bg-gray-900 rounded-full"
            style={{
              left: "50%",
              bottom: "50%",
              transform: `translateX(-50%) rotate(${hourDeg}deg)`,
              transformOrigin: "bottom center",
            }}
          />

          <div
            className="absolute w-1 h-16 bg-gray-700 rounded-full"
            style={{
              left: "50%",
              bottom: "50%",
              transform: `translateX(-50%) rotate(${minuteDeg}deg)`,
              transformOrigin: "bottom center",
            }}
          />

          <div
            className="absolute w-0.5 h-20 bg-gradient-to-t from-red-500 to-red-400"
            style={{
              left: "50%",
              bottom: "50%",
              transform: `translateX(-50%) rotate(${secondDeg}deg)`,
              transformOrigin: "bottom center",
            }}
          />

          <div
            className="absolute w-3 h-3 bg-gray-900 rounded-full"
            style={{
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
            }}
          />
        </div>
      </div>
    </div>
  );
}
