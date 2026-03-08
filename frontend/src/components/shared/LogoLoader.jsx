export default function LogoLoader({ fullscreen = false, compact = false }) {
  return (
    <div className={`el-wrap ${fullscreen ? 'fullscreen' : ''} ${compact ? 'compact' : ''}`}>
      <div className="el-logo" aria-label="EduTrack loading">
        <span className="el-mark">e</span>
      </div>
    </div>
  );
}
