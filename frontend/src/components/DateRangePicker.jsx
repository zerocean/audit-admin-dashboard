import { useState, useCallback } from 'react'
import { DateRange } from 'react-date-range'
import { addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import 'react-date-range/dist/styles.css'
import 'react-date-range/dist/theme/default.css'

const PRESETS = [
  { label: '今天', range: () => { const d = new Date(); return { startDate: d, endDate: d } } },
  { label: '昨天', range: () => { const d = subDays(new Date(), 1); return { startDate: d, endDate: d } } },
  { label: '本周', range: () => ({ startDate: startOfWeek(new Date(), { weekStartsOn: 1 }), endDate: endOfWeek(new Date(), { weekStartsOn: 1 }) }) },
  { label: '本月', range: () => ({ startDate: startOfMonth(new Date()), endDate: endOfMonth(new Date()) }) },
  { label: '近7天', range: () => ({ startDate: subDays(new Date(), 6), endDate: new Date() }) },
  { label: '近30天', range: () => ({ startDate: subDays(new Date(), 29), endDate: new Date() }) },
]

const fmtDate = (d) => {
  if (!d) return ''
  return format(d, 'yyyy-MM-dd')
}

export default function DateRangePicker({ onChange }) {
  const today = new Date()
  const [range, setRange] = useState({ startDate: null, endDate: null, key: 'selection' })
  const [activePreset, setActivePreset] = useState('')
  const [open, setOpen] = useState(false)

  const apply = useCallback((r, label) => {
    setRange(r)
    setActivePreset(label)
    setOpen(false)
    onChange(fmtDate(r.startDate), fmtDate(r.endDate))
  }, [onChange])

  const handlePreset = useCallback((preset) => {
    const r = preset.range()
    apply({ ...r, key: 'selection' }, preset.label)
  }, [apply])

  const handleSelect = useCallback((item) => {
    const sel = item.selection
    setRange({ startDate: sel.startDate, endDate: sel.endDate, key: 'selection' })
    setActivePreset('')
  }, [])

  const handleClear = useCallback(() => {
    const empty = { startDate: null, endDate: null, key: 'selection' }
    setRange(empty)
    setActivePreset('')
    setOpen(false)
    onChange('', '')
  }, [onChange])

  const displayText = range.startDate
    ? `${format(range.startDate, 'yyyy年M月d日')} — ${format(range.endDate, 'yyyy年M月d日')}`
    : '全部时间'

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 13, color: '#888', fontWeight: 600, marginRight: 4 }}>时间范围</span>
        {PRESETS.map((p) => (
          <button key={p.label} onClick={() => handlePreset(p)}
            style={{
              padding: '6px 14px', borderRadius: 6, border: '1px solid #d9d9d9',
              background: activePreset === p.label ? '#1677ff' : '#fff',
              color: activePreset === p.label ? '#fff' : '#555',
              fontSize: 12, cursor: 'pointer', fontWeight: 500,
              transition: 'all .15s',
            }}
          >{p.label}</button>
        ))}
        <div style={{ position: 'relative' }}>
          <button onClick={() => setOpen(!open)}
            style={{
              padding: '6px 16px', borderRadius: 6, border: `1px solid ${open ? '#1677ff' : '#d9d9d9'}`,
              background: open ? '#f0f7ff' : '#fff', color: '#333', fontSize: 13,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              minWidth: 220, justifyContent: 'space-between',
              transition: 'all .15s',
            }}
          >
            <span style={{ color: range.startDate ? '#333' : '#aaa' }}>{displayText}</span>
            <span style={{ fontSize: 10, color: '#888', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}>▼</span>
          </button>

          {open && (
            <>
              <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99 }}
                onClick={() => setOpen(false)} />
              <div style={{
                position: 'absolute', top: '100%', left: 0, zIndex: 100, marginTop: 4,
                background: '#fff', borderRadius: 10, boxShadow: '0 4px 24px rgba(0,0,0,.12)',
                border: '1px solid #eee',
              }}>
                <DateRange
                  ranges={[range]}
                  onChange={handleSelect}
                  moveRangeOnFirstSelection={false}
                  months={2}
                  direction="horizontal"
                  maxDate={today}
                  rangeColors={['#1677ff']}
                  showDateDisplay={false}
                  locale={zhCN}
                  weekdayDisplayFormat="EEEEE"
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '0 12px 12px' }}>
                  <button onClick={handleClear}
                    style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #e0e0e0', background: '#fff', fontSize: 13, cursor: 'pointer' }}
                  >清除</button>
                  <button onClick={() => apply(range, '')}
                    style={{ padding: '6px 20px', borderRadius: 6, border: 'none', background: '#1677ff', color: '#fff', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}
                  >确定</button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
