const VideoPanel = () => {
    return (
      <div className="video-container">
        <video
          autoPlay
          loop
          muted
          className="video-bg"
          src="https://fls-9f4cda08-9784-422f-a21a-ef31a931ffab.367be3a2035528943240074d0096e0cd.r2.cloudflarestorage.com/videos/b7e76967-f86e-40cc-bb55-8a0a6dcc4d76.mp4?X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=70c1e651316bfeabed63bee5c738690d%2F20251022%2Fauto%2Fs3%2Faws4_request&X-Amz-Date=20251022T155124Z&X-Amz-SignedHeaders=host&X-Amz-Expires=86400&X-Amz-Signature=6193296c91836c9326f2ddbc79cb5b36acbe932dd95b54fbb47ed1c0d73ccc1e"
        />
        <div className="video-overlay">
          <h1 className="text-xl p-3"><strong>Pelagia Network Faucet</strong> | REEF</h1>
        </div>
      </div>
    );
  };
  
  export default VideoPanel;
  