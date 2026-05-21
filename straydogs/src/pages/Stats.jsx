import { useState, useEffect } from 'react'
import { getDogs, getModelStats } from '../lib/data.js'

function StatBox({ label, value, sub, color }) {
  return (
    <div style={{ background: '#fff', borderRadius: 10, padding: '14px', border: '1px solid #eee', textAlign: 'center' }}>
      <div style={{ fontSize: 26, fontWeight: 800, color: color || '#1a1a18' }}>{value}</div>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#444', marginTop: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

function Bar({ label, value, max, color = '#2d7a4f' }) {
  const pct = max ? Math.round((value / max) * 100) : 0
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
        <span style={{ color: '#555', maxWidth: '70%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
        <span style={{ fontWeight: 700, color: '#1a1a18' }}>{value} <span style={{ color: '#aaa', fontWeight: 400 }}>({pct}%)</span></span>
      </div>
      <div style={{ height: 8, background: '#f0f0e8', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: pct + '%', background: color, borderRadius: 4, transition: 'width 0.5s ease' }} />
      </div>
    </div>
  )
}

export default function StatsPage() {
  const [dogs, setDogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)

  useEffect(() => {
    getDogs().then(({ data }) => {
      setDogs(data || [])
      setStats(getModelStats(data || []))
      setLoading(false)
    })
  }, [])

  if (loading) return <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: 14 }}>Loading stats...</div>

  const confColor = v => v >= 80 ? '#2d7a4f' : v >= 60 ? '#e08000' : '#c00'
  const breedsSorted = stats ? Object.entries(stats.breedDist).sort((a, b) => b[1] - a[1]) : []

  return (
    <div style={{ background: '#f4f4f0', minHeight: '100dvh' }}>
      <div style={{ background: '#fff', padding: '16px', borderBottom: '1px solid #eee' }}>
        <h1 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>📊 Model performance</h1>
        <p style={{ fontSize: 13, color: '#888', marginTop: 4 }}>Real-time AI analysis quality metrics</p>
      </div>

      <div style={{ padding: '14px' }}>
        {/* Overview grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
          <StatBox label="Total sightings" value={stats.total} />
          <StatBox label="Avg confidence" value={stats.avgConfidence + '%'} color={confColor(stats.avgConfidence)} />
          <StatBox label="Avg breed conf." value={stats.avgBreedConf + '%'} color={confColor(stats.avgBreedConf)} />
        </div>

        {/* Confidence distribution */}
        <div style={{ background: '#fff', borderRadius: 12, padding: '16px', marginBottom: 14, border: '1px solid #eee' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#555', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Confidence distribution</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
            {[
              { label: 'High (≥80%)', count: stats.confDist.high, color: '#2d7a4f', bg: '#eef6f1' },
              { label: 'Mid (60–79%)', count: stats.confDist.mid, color: '#e08000', bg: '#fffbe6' },
              { label: 'Low (<60%)', count: stats.confDist.low, color: '#c00', bg: '#fff0f0' },
            ].map(b => (
              <div key={b.label} style={{ background: b.bg, borderRadius: 8, padding: '10px 8px', textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: b.color }}>{b.count}</div>
                <div style={{ fontSize: 10, color: b.color, fontWeight: 600, marginTop: 2 }}>{b.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Breed distribution */}
        {breedsSorted.length > 0 && (
          <div style={{ background: '#fff', borderRadius: 12, padding: '16px', marginBottom: 14, border: '1px solid #eee' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#555', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Breed distribution</div>
            {breedsSorted.map(([breed, count], i) => (
              <Bar key={breed} label={breed} value={count} max={stats.total} color={['#2d7a4f','#4a9e70','#6db890','#90d2b0'][i % 4]} />
            ))}
          </div>
        )}

        {/* Per-sighting table */}
        <div style={{ background: '#fff', borderRadius: 12, padding: '16px', marginBottom: 14, border: '1px solid #eee' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#555', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>All sightings — confidence log</div>
          {dogs.length === 0
            ? <div style={{ fontSize: 13, color: '#aaa', textAlign: 'center', padding: '20px 0' }}>No sightings yet</div>
            : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #f0f0e8' }}>
                      {['ID', 'Breed', 'Conf.', 'Breed conf.'].map(h => (
                        <th key={h} style={{ padding: '6px 8px', textAlign: 'left', color: '#888', fontWeight: 600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dogs.map(d => (
                      <tr key={d.id} style={{ borderBottom: '1px solid #f5f5f0' }}>
                        <td style={{ padding: '7px 8px', fontWeight: 700, color: '#2d7a4f', whiteSpace: 'nowrap' }}>{d.dog_id}</td>
                        <td style={{ padding: '7px 8px', color: '#444', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.breed}</td>
                        <td style={{ padding: '7px 8px', fontWeight: 700, color: confColor(d.confidence) }}>{d.confidence}%</td>
                        <td style={{ padding: '7px 8px', fontWeight: 700, color: confColor(d.breed_confidence) }}>{d.breed_confidence}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          }
        </div>

        {/* Injured summary */}
        <div style={{ background: '#fff', borderRadius: 12, padding: '16px', marginBottom: 24, border: '1px solid #eee' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#555', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Health summary</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, padding: '6px 0', borderBottom: '1px solid #f5f5f0' }}>
            <span style={{ color: '#888' }}>Injured dogs</span>
            <span style={{ fontWeight: 700, color: stats.injuredCount > 0 ? '#c00' : '#2d7a4f' }}>{stats.injuredCount} / {stats.total}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, padding: '6px 0' }}>
            <span style={{ color: '#888' }}>Healthy</span>
            <span style={{ fontWeight: 700, color: '#2d7a4f' }}>{stats.total - stats.injuredCount} / {stats.total}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
