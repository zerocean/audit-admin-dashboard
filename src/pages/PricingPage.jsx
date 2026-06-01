import { useState } from 'react';
import { Plus, Pencil, X, Check } from 'lucide-react';
import { mockPricing } from '../mock/data';

export default function PricingPage() {
  const [pricing, setPricing] = useState(mockPricing);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const [showAdd, setShowAdd] = useState(false);
  const [newModel, setNewModel] = useState({
    model_name: '',
    model_alias: '',
    input_price_per_1k: '',
    output_price_per_1k: '',
    description: '',
  });

  const handleEdit = (item) => {
    setEditingId(item.id);
    setEditForm({ ...item });
  };

  const handleSave = () => {
    setPricing(pricing.map((p) => (p.id === editingId ? { ...p, ...editForm } : p)));
    setEditingId(null);
    alert('演示版本：修改已保存（本地模拟）');
  };

  const handleCancel = () => {
    setEditingId(null);
  };

  const handleAdd = () => {
    if (!newModel.model_name) return;
    const newId = Math.max(...pricing.map((p) => p.id)) + 1;
    setPricing([
      ...pricing,
      {
        id: newId,
        ...newModel,
        input_price_per_1k: parseFloat(newModel.input_price_per_1k),
        output_price_per_1k: parseFloat(newModel.output_price_per_1k),
        is_active: true,
      },
    ]);
    setShowAdd(false);
    setNewModel({ model_name: '', model_alias: '', input_price_per_1k: '', output_price_per_1k: '', description: '' });
    alert('演示版本：新模型已添加（本地模拟）');
  };

  const toggleActive = (id) => {
    setPricing(pricing.map((p) => (p.id === id ? { ...p, is_active: !p.is_active } : p)));
  };

  return (
    <div>
      {/* 添加按钮 */}
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => setShowAdd(!showAdd)}
        >
          <Plus size={14} /> 新增模型
        </button>
      </div>

      {/* 新增表单 */}
      {showAdd && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header">
            <h3>新增模型定价</h3>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowAdd(false)}>
              <X size={14} />
            </button>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label>模型名称</label>
                <input
                  placeholder="如: qwen3.6-plus"
                  value={newModel.model_name}
                  onChange={(e) => setNewModel({ ...newModel, model_name: e.target.value })}
                />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label>显示名称</label>
                <input
                  placeholder="如: 通义千问 3.6 Plus"
                  value={newModel.model_alias}
                  onChange={(e) => setNewModel({ ...newModel, model_alias: e.target.value })}
                />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label>输入价格 (¥/千Token)</label>
                <input
                  type="number"
                  step="0.001"
                  placeholder="0.002"
                  value={newModel.input_price_per_1k}
                  onChange={(e) => setNewModel({ ...newModel, input_price_per_1k: e.target.value })}
                />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label>输出价格 (¥/千Token)</label>
                <input
                  type="number"
                  step="0.001"
                  placeholder="0.006"
                  value={newModel.output_price_per_1k}
                  onChange={(e) => setNewModel({ ...newModel, output_price_per_1k: e.target.value })}
                />
              </div>
              <div className="form-group" style={{ margin: 0, gridColumn: 'span 2' }}>
                <label>描述</label>
                <input
                  placeholder="模型说明"
                  value={newModel.description}
                  onChange={(e) => setNewModel({ ...newModel, description: e.target.value })}
                />
              </div>
            </div>
            <button className="btn btn-primary btn-sm" onClick={handleAdd}>
              <Check size={14} /> 确认添加
            </button>
          </div>
        </div>
      )}

      {/* 定价表格 */}
      <div className="card">
        <div className="card-header">
          <h3>模型定价配置</h3>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>模型名称</th>
                  <th>显示名称</th>
                  <th>输入价格 (¥/千Token)</th>
                  <th>输出价格 (¥/千Token)</th>
                  <th>状态</th>
                  <th>描述</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {pricing.map((item) => (
                  <tr key={item.id}>
                    {editingId === item.id ? (
                      <>
                        <td>
                          <input
                            style={{ width: 140, padding: '4px 8px', border: '1px solid var(--gray-300)', borderRadius: 4, fontSize: 13 }}
                            value={editForm.model_name}
                            onChange={(e) => setEditForm({ ...editForm, model_name: e.target.value })}
                          />
                        </td>
                        <td>
                          <input
                            style={{ width: 140, padding: '4px 8px', border: '1px solid var(--gray-300)', borderRadius: 4, fontSize: 13 }}
                            value={editForm.model_alias}
                            onChange={(e) => setEditForm({ ...editForm, model_alias: e.target.value })}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            step="0.001"
                            style={{ width: 100, padding: '4px 8px', border: '1px solid var(--gray-300)', borderRadius: 4, fontSize: 13 }}
                            value={editForm.input_price_per_1k}
                            onChange={(e) => setEditForm({ ...editForm, input_price_per_1k: parseFloat(e.target.value) || 0 })}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            step="0.001"
                            style={{ width: 100, padding: '4px 8px', border: '1px solid var(--gray-300)', borderRadius: 4, fontSize: 13 }}
                            value={editForm.output_price_per_1k}
                            onChange={(e) => setEditForm({ ...editForm, output_price_per_1k: parseFloat(e.target.value) || 0 })}
                          />
                        </td>
                        <td>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={editForm.is_active}
                              onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                            />
                            <span style={{ fontSize: 12 }}>{editForm.is_active ? '启用' : '停用'}</span>
                          </label>
                        </td>
                        <td>
                          <input
                            style={{ width: 200, padding: '4px 8px', border: '1px solid var(--gray-300)', borderRadius: 4, fontSize: 13 }}
                            value={editForm.description || ''}
                            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                          />
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button className="btn btn-sm" style={{ background: 'var(--success)', color: 'white', border: 'none' }} onClick={handleSave}>
                              <Check size={14} />
                            </button>
                            <button className="btn btn-sm btn-secondary" onClick={handleCancel}>
                              <X size={14} />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{item.model_name}</td>
                        <td>{item.model_alias}</td>
                        <td>¥{item.input_price_per_1k.toFixed(4)}</td>
                        <td>¥{item.output_price_per_1k.toFixed(4)}</td>
                        <td>
                          <span className={`status-badge ${item.is_active ? 'status-success' : 'status-pending'}`}>
                            {item.is_active ? '启用' : '停用'}
                          </span>
                        </td>
                        <td style={{ fontSize: 13, color: 'var(--gray-500)' }}>{item.description || '-'}</td>
                        <td>
                          <button className="btn btn-link" onClick={() => handleEdit(item)}>
                            <Pencil size={14} /> 编辑
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
