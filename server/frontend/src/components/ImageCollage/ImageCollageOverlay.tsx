/**
 * 多图组合：全屏浮层 + 居中白板 + 底部展示柜（不占用中间 PDF 栏位）
 */
import ImageCollageWorkspace from './ImageCollageWorkspace';
import ImageCollageStrip from './ImageCollageStrip';

interface ImageCollageOverlayProps {
  onClose: () => void;
  projectId: string | null;
}

export default function ImageCollageOverlay({ onClose, projectId }: ImageCollageOverlayProps) {
  return (
    <div className="image-collage-overlay" role="dialog" aria-modal="true" aria-labelledby="image-collage-title">
      <div className="image-collage-overlay-backdrop" aria-hidden />
      <div className="image-collage-overlay-inner">
        <div className="image-collage-floating-panel">
          <ImageCollageWorkspace onClose={onClose} projectId={projectId} />
        </div>
        <div className="image-collage-overlay-strip">
          <ImageCollageStrip />
        </div>
      </div>
    </div>
  );
}
