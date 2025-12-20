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
  const hours = time.getHours() % 12;

  const secondDeg = seconds * 6;
  const minuteDeg = minutes * 6 + seconds * 0.1;
  const hourDeg = hours * 30 + minutes * 0.5;

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h2 className="text-lg font-semibold mb-6 text-gray-800">Time</h2>

      <div className="flex items-center justify-between">
        {/* Digital */}
        <div className="flex flex-col justify-center">
          <div className="text-5xl font-bold text-gray-800 leading-none">
            {time.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </div>
          <div className="text-sm text-gray-500 mt-2">
            {time.toLocaleDateString([], {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </div>
        </div>

        {/* Analog */}
        <div className="relative w-28 h-28 flex items-center justify-center">
          {/* Clock face */}
          <div className="absolute inset-0 rounded-full border border-gray-300" />

          {/* Hour hand */}
          <div
            className="absolute w-1 h-7 bg-gray-800 rounded origin-bottom"
            style={{
              transform: `rotate(${hourDeg}deg)`,
              bottom: "50%",
            }}
          />

          {/* Minute hand */}
          <div
            className="absolute w-0.5 h-10 bg-gray-600 rounded origin-bottom"
            style={{
              transform: `rotate(${minuteDeg}deg)`,
              bottom: "50%",
            }}
          />

          {/* Second hand */}
          <div
            className="absolute w-px h-11 bg-red-500 origin-bottom"
            style={{
              transform: `rotate(${secondDeg}deg)`,
              bottom: "50%",
            }}
          />

          {/* Center dot */}
          <div className="absolute w-2 h-2 bg-gray-800 rounded-full" />
        </div>
      </div>
    </div>
  );
}
