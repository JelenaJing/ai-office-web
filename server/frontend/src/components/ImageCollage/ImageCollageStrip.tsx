/**
 * 底部展示柜：上传 / 拖入素材，缩略图可拖到画布
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { COLLAGE_DRAG_MIME } from './ImageCollageWorkspace';

interface CollageAsset {
  id: string;
  url: string;
}

function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function ImageCollageStrip() {
  const [assets, setAssets] = useState<CollageAsset[]>([]);
  const assetsRef = useRef<CollageAsset[]>([]);

  useLayoutEffect(() => {
    assetsRef.current = assets;
  }, [assets]);

  useEffect(() => {
    return () => {
      assetsRef.current.forEach((a) => URL.revokeObjectURL(a.url));
    };
  }, []);

  const addImageFiles = useCallback((fileList: FileList | null) => {
    if (!fileList?.length) return;
    const next: CollageAsset[] = [];
    for (const file of Array.from(fileList)) {
      if (!file.type.startsWith('image/')) continue;
      next.push({ id: newId(), url: URL.createObjectURL(file) });
    }
    if (next.length) setAssets((prev) => [...prev, ...next]);
  }, []);

  const removeAsset = useCallback((id: string) => {
    setAssets((prev) => {
      const t = prev.find((x) => x.id === id);
      if (t) URL.revokeObjectURL(t.url);
      return prev.filter((x) => x.id !== id);
    });
  }, []);

  const onStripDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const onStripDrop = (e: React.DragEvent) => {
    e.preventDefault();
    addImageFiles(e.dataTransfer.files);
  };

  const onThumbDragStart = (e: React.DragEvent, url: string) => {
    e.dataTransfer.setData(COLLAGE_DRAG_MIME, url);
    e.dataTransfer.setData('text/plain', url);
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="image-collage-strip">
      <div className="image-collage-strip-header">
        <h4>展示柜</h4>
        <p className="image-collage-strip-sub">拖入图片或上传，再拖到上方白板中组合</p>
      </div>
      <div
        className="image-collage-strip-body"
        onDragOver={onStripDragOver}
        onDrop={onStripDrop}
      >
        <label className="image-collage-upload-btn">
          <input
            type="file"
            accept="image/*"
            multiple
            className="image-collage-file-input"
            onChange={(ev) => {
              addImageFiles(ev.target.files);
              ev.target.value = '';
            }}
          />
          上传图片
        </label>
        <div className="image-collage-thumbs">
          {assets.length === 0 ? (
            <span className="image-collage-strip-empty">暂无素材，请上传或将图片拖入此区域</span>
          ) : (
            assets.map((a) => (
              <div key={a.id} className="image-collage-thumb-wrap">
                <img
                  src={a.url}
                  alt=""
                  draggable
                  onDragStart={(e) => onThumbDragStart(e, a.url)}
                  className="image-collage-thumb"
                />
                <button
                  type="button"
                  className="image-collage-thumb-remove"
                  onClick={() => removeAsset(a.id)}
                  title="从展示柜移除"
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
