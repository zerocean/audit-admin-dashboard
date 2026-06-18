import { useState, useEffect } from 'react'
import { getPricing, createPricing, updatePricing, deletePricing } from '../api/client'

export default function PricingPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({ provider: '', model_name: '', model_alias: '', input_price_per_1k: 0, output_price_per_1k: 0 })

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    try { setItems((await getPricing()).data) } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const handleSubmit = async () => {
    try {
      if (editId) { await updatePricing(editId, form) }
      else { await createPricing(form) }
      setShowForm(false); setEditId(null); load()
    } catch (e) { alert(e.message) }
  }

  const openEdit = (item) => {
    setForm({ provider: item.provider, model_name: item.model_name, model_alias: item.model_alias || '', input_price_per_1k: item.input_price_per_1k, output_price_per_1k: item.output_price_per_1k })
    setEditId(item.id); setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('确定删除？')) return
    await deletePricing(id); load()
  }

  return (
    <div style={{ padding: 24, height: '100%', overflow: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>模型定价管理</h2>
        <button onClick={() => { setForm({ provider: '', model_name: '', model_alias: '', input_price_per_1k: 0, output_price_per_1k: 0 }); setEditId(null); setShowForm(true) }}
          style={{ padding: '8px 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>
          + 新增</button>
      </div>

      {loading ? <div style={{ textAlign: 'center', color: '#888' }}>加载中...</div> : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead><tr style={{ textAlign: 'left', borderBottom: '2px solid #f0f0f0' }}>
            <th style={{ padding: 10 }}>提供商</th><th>模型</th><th>别名</th><th>输入/千t</th><th>输出/千t</th><th style={{ width: 100 }}>操作</th></tr></thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} style={{ borderBottom: '1px solid #f8f8f8' }}>
                <td style={{ padding: 10 }}>{item.provider}</td><td>{item.model_name}</td><td>{item.model_alias || '-'}</td>
                <td>¥{item.input_price_per_1k}</td><td>¥{item.output_price_per_1k}</td>
                <td>
                  <button onClick={() => openEdit(item)} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: 12, marginRight: 8 }}>编辑</button>
                  <button onClick={() => handleDelete(item.id)} style={{ background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer', fontSize: 12 }}>删除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: 380 }}>
            <h3 style={{ marginBottom: 16 }}>{editId ? '编辑定价' : '新增定价'}</h3>
            {['provider', 'model_name', 'model_alias'].map(f => (
              <input key={f} value={(form)[f]} onChange={e => setForm({ ...form, [f]: e.target.value })}
                placeholder={{ provider: '提供商', model_name: '模型名', model_alias: '别名(可选)' }[f]}
                style={{ display: 'block', width: '100%', padding: '8px 12px', marginBottom: 10, border: '1px solid #e0e0e0', borderRadius: 6, fontSize: 13 }} />
            ))}
            {['input_price_per_1k', 'output_price_per_1k'].map(f => (
              <input key={f} type="number" step="0.000001" value={(form)[f]}
                onChange={e => setForm({ ...form, [f]: parseFloat(e.target.value) || 0 })}
                placeholder={f === 'input_price_per_1k' ? '输入价格(元/千token)' : '输出价格(元/千token)'}
                style={{ display: 'block', width: '100%', padding: '8px 12px', marginBottom: 10, border: '1px solid #e0e0e0', borderRadius: 6, fontSize: 13 }} />
            ))}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowForm(false)}
                style={{ padding: '8px 16px', border: '1px solid #e0e0e0', borderRadius: 8, background: '#fff', cursor: 'pointer' }}>取消</button>
              <button onClick={handleSubmit}
                style={{ padding: '8px 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
