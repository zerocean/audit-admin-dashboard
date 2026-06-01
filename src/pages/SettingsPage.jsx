import { useState } from 'react';
import { Save } from 'lucide-react';
import { mockSettings } from '../mock/data';

export default function SettingsPage() {
  const [settings, setSettings] = useState({ ...mockSettings });
  const [editingKey, setEditingKey] = useState(null);
  const [editValue, setEditValue] = useState('');

  const settingLabels = {
    data_retention_days: '数据保留天数',
    default_currency: '默认货币单位',
    oss_bucket_name: 'OSS Bucket 名称',
    oss_region: 'OSS 区域',
  };

  const settingDescriptions = {
    data_retention_days: '超过此天数的数据将被自动清理',
    default_currency: '费用统计的默认货币',
    oss_bucket_name: '阿里云 OSS 存储桶名称',
    oss_region: '阿里云 OSS 区域代码',
  };

  const handleEdit = (key, value) => {
    setEditingKey(key);
    setEditValue(value);
  };

  const handleSave = () => {
    setSettings({ ...settings, [editingKey]: editValue });
    setEditingKey(null);
    alert('演示版本：设置已保存（本地模拟）');
  };

  const handleCancel = () => {
    setEditingKey(null);
  };

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h3>系统参数配置</h3>
        </div>
        <div className="card-body settings-table">
          {Object.entries(settingLabels).map(([key, label]) => (
            <div key={key} className="setting-row">
              <div>
                <div className="setting-label">{label}</div>
                <div className="setting-desc">{settingDescriptions[key]}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {editingKey === key ? (
                  <>
                    <input
                      style={{
                        padding: '6px 12px',
                        border: '1px solid var(--primary)',
                        borderRadius: 'var(--radius)',
                        fontSize: 14,
                        fontFamily: 'monospace',
                        minWidth: 200,
                        textAlign: 'right',
                        outline: 'none',
                        boxShadow: '0 0 0 2px rgba(59,130,246,0.1)',
                      }}
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSave();
                        if (e.key === 'Escape') handleCancel();
                      }}
                    />
                    <button className="btn btn-sm" style={{ background: 'var(--success)', color: 'white', border: 'none' }} onClick={handleSave}>
                      <Save size={14} />
                    </button>
                    <button className="btn btn-sm btn-secondary" onClick={handleCancel}>
                      取消
                    </button>
                  </>
                ) : (
                  <>
                    <span className="setting-value">{settings[key]}</span>
                    <button className="btn btn-link" onClick={() => handleEdit(key, settings[key])}>
                      编辑
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-header">
          <h3>关于系统</h3>
        </div>
        <div className="card-body">
          <div className="detail-grid">
            <div className="detail-item">
              <span className="label">系统版本</span>
              <span className="value">v1.0.0</span>
            </div>
            <div className="detail-item">
              <span className="label">框架</span>
              <span className="value">React 18 + Vite</span>
            </div>
            <div className="detail-item">
              <span className="label">设计日期</span>
              <span className="value">2026-05-22</span>
            </div>
            <div className="detail-item">
              <span className="label">作者</span>
              <span className="value">Dylan + AI Assistant</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
