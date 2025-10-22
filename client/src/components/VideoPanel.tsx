const VideoPanel = () => {
    return (
      <div className="video-container">
        <video
          autoPlay
          loop
          muted
          className="video-bg"
          src="https://replicate.delivery/xezq/mryc62SvSpp3NpOedDNQD7njZlmd5re5e8ClPltdEwWF7BopA/tmp7uoz8hjv.mp4"
        />
        <div className="video-overlay">
          <h2><strong>Pelagia Network Faucet</strong> | REEF</h2>
        </div>
      </div>
    );
  };
  
  export default VideoPanel;
  