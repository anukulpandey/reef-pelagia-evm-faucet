import React from "react";

const VideoSection: React.FC = () => {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-l-2xl">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-70"
      >
        <source src="/assets/pelagia-bg.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-gradient-to-l from-gray-950/60 to-transparent" />
    </div>
  );
};

export default VideoSection;
