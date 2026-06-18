import { useState, useEffect } from 'react'
import { getSettings, updateSetting } from '../api/client'

export default function SettingsPage() {
  const [settings, setSettings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    try { setSettings((await getSettings()).data) } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const handleUpdate = async (key, value) => {
    try { await updateSetting(key, value); load() } catch (e) { alert(e.message) }
  }

  return (
    <div style={{ padding: 24, height: '100%', overflow: 'auto' }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>系统设置</h2>
      {loading ? <div style={{ textAlign: 'center', color: '#888' }}>加载中...</div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {settings.map(s => (
            <div key={s.id} style={{ background: '#fff', borderRadius: 10, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,.06)', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{s.setting_key}</div>
                <div style={{ color: '#888', fontSize: 11 }}>{s.description}</div>
              </div>
              <input defaultValue={s.setting_value} onBlur={e => handleUpdate(s.setting_key, e.target.value)}
                style={{ padding: '6px 12px', border: '1px solid #e0e0e0', borderRadius: 6, fontSize: 13, width: 200 }} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
