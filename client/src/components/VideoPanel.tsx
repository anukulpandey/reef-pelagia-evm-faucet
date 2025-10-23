const VideoPanel = () => {
    return (
      <div className="video-container">
        <video
          autoPlay
          loop
          muted
          className="video-bg"
          // src="https://cdn.pixabay.com/video/2025/03/07/263235_tiny.mp4"
          src="https://cdn.pixabay.com/video/2025/03/07/263254_tiny.mp4"
        />
        <div className="video-overlay">
          <h1 className="text-xl p-3"><strong>Pelagia Network Faucet</strong> | REEF</h1>
        </div>
      </div>
    );
  };
  
  export default VideoPanel;
  