import { useState, useEffect } from 'react'
import { getDog, deleteDog, updateDog, getDogs } from '../lib/data.js'
import { useApp } from '../App.jsx'

function timeAgo(iso) {
  const s = (Date.now() - new Date(iso)) / 1000
  if (s < 3600) return `${Math.floor(s/60)}m ago`
  if (s < 86400) return `${Math.floor(s/3600)}h ago`
  return `${Math.floor(s/86400)}d ago`
}

function Row({ label, value, highlight }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid #f5f5f0', fontSize: 14 }}>
      <span style={{ color: '#888' }}>{label}</span>
      <span style={{ fontWeight: 600, color: highlight || '#1a1a18' }}>{value}</span>
    </div>
  )
}

const STATUS_OPTIONS = [
  { value: 'sighted',       label: 'Sighted' },
  { value: 'being_rescued', label: '🚑 Being rescued' },
  { value: 'in_shelter',    label: '🏠 In shelter' },
  { value: 'reunited',      label: '✅ Reunited' },
]

const STATUS_COLORS = {
  sighted:       '#888',
  being_rescued: '#e65100',
  in_shelter:    '#1565c0',
  reunited:      '#2e7d32',
}

export default function DogPage({ dogId }) {
  const { nav, user } = useApp()
  const [dog, setDog]           = useState(null)
  const [loading, setLoading]   = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [confirm, setConfirm]   = useState(false)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [status, setStatus]     = useState('')
  const [statusSaving, setStatusSaving] = useState(false)
  const [statusSaved, setStatusSaved]   = useState(false)
  const [matches, setMatches]   = useState([])

  useEffect(() => {
    if (!dogId) { nav('feed'); return }
    getDog(dogId).then(({ data }) => {
      setDog(data)
      setStatus(data?.status || 'sighted')
      setLoading(false)
    })
  }, [dogId])

  // Load potential matches after dog data arrives
  useEffect(() => {
    if (!dog) return
    const otherType = dog.report_type === 'lost_pet' ? 'stray' : 'lost_pet'
    getDogs({ report_type: otherType, city: dog.city }).then(({ data }) => {
      if (!data) return
      const filtered = data.filter(d => {
        const colorMatch = d.color && dog.color && d.color.toLowerCase().includes(dog.color.toLowerCase().split(' ')[0])
        const breedMatch = d.breed && dog.breed && d.breed.toLowerCase().includes(dog.breed.toLowerCase().split(' ')[0])
        return colorMatch || breedMatch
      })
      setMatches(filtered.slice(0, 5))
    })
  }, [dog])

  // Load Leaflet map once dog data is available
  useEffect(() => {
    if (!dog?.lat || !dog?.lng || mapLoaded) return
    const L = window.L
    if (!L) return
    setTimeout(() => {
      const el = document.getElementById('dog-map')
      if (!el || el._leaflet_id) return
      const map = L.map(el, { zoomControl: false, attributionControl: false }).setView([dog.lat, dog.lng], 15)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map)
      L.circleMarker([dog.lat, dog.lng], { radius: 10, color: '#2d7a4f', fillColor: '#2d7a4f', fillOpacity: 0.8 }).addTo(map)
      setMapLoaded(true)
    }, 100)
  }, [dog, mapLoaded])

  const handleDelete = async () => {
    setDeleting(true)
    await deleteDog(dogId)
    nav('feed')
  }

  const handleStatusChange = async (newStatus) => {
    setStatus(newStatus)
    setStatusSaving(true)
    await updateDog(dog.id, { status: newStatus })
    setStatusSaving(false)
    setStatusSaved(true)
    setTimeout(() => setStatusSaved(false), 2000)
  }

  if (loading) return <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#aaa' }}>Loading...</div>
  if (!dog) return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
      <div style={{ fontSize: 40 }}>🐕</div>
      <div style={{ fontSize: 15, color: '#888' }}>Dog not found</div>
      <button onClick={() => nav('feed')} style={{ padding: '8px 16px', background: '#2d7a4f', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>← Back</button>
    </div>
  )

  const isLostPet = dog.report_type === 'lost_pet'

  return (
    <div style={{ background: '#f4f4f0', minHeight: '100dvh' }}>
      {/* Header */}
      <div style={{ background: '#fff', padding: '14px 16px', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', gap: 10, position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={() => nav('feed')} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', padding: 0 }}>←</button>
        <span style={{ fontSize: 16, fontWeight: 700 }}>
          {isLostPet ? `🔍 ${dog.pet_name || 'Lost Pet'}` : dog.dog_id}
        </span>
        <span style={{ marginLeft: 'auto', fontSize: 12, color: '#aaa' }}>{timeAgo(dog.created_at)}</span>
      </div>

      <div style={{ padding: '14px' }}>
        {/* Photo / placeholder */}
        {dog.photo_url
          ? <img src={dog.photo_url} alt="dog" style={{ width: '100%', height: 220, objectFit: 'cover', borderRadius: 12, marginBottom: 14 }} />
          : <div style={{ width: '100%', height: 160, background: isLostPet ? '#fff3e0' : '#e8f0e8', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64, marginBottom: 14 }}>
              {isLostPet ? '🔍' : '🐕'}
            </div>
        }

        {/* Lost pet banner */}
        {isLostPet && (
          <div style={{ background: '#fff3e0', border: '1.5px solid #ffe0b2', borderRadius: 10, padding: '12px 14px', marginBottom: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#e65100' }}>🔍 Lost Pet Report</div>
            <div style={{ fontSize: 13, color: '#bf360c', marginTop: 3 }}>
              {dog.date_lost ? `Last seen on ${dog.date_lost}` : 'Date unknown'} · Reported by {dog.reporter_name || 'Anonymous'}
            </div>
          </div>
        )}

        {/* Vaccinated banner */}
        {dog.vaccinated && (
          <div style={{ background: '#eef6f1', border: '1.5px solid #b0d8c0', borderRadius: 10, padding: '12px 14px', marginBottom: 14, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 20 }}>💉</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#2d7a4f' }}>Vaccinated</div>
              <div style={{ fontSize: 13, color: '#2d7a4f', marginTop: 3 }}>{dog.vaccination_notes || 'No details provided'}</div>
            </div>
          </div>
        )}

        {/* Injured banner */}
        {dog.injured && (
          <div style={{ background: '#fff0f0', border: '1.5px solid #ffb0b0', borderRadius: 10, padding: '12px 14px', marginBottom: 14, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 20 }}>⚠️</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#c00' }}>Injuries observed</div>
              <div style={{ fontSize: 13, color: '#c00', marginTop: 3 }}>{dog.injury_notes || 'No details provided'}</div>
            </div>
          </div>
        )}

        {/* Owner contact card — lost pets only */}
        {isLostPet && (
          <div style={{ background: '#fff', borderRadius: 12, padding: '16px', marginBottom: 14, border: '1px solid #eee' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#555', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Owner Contact</div>
            <Row label="Owner" value={dog.reporter_name || 'Anonymous'} />
            {dog.owner_phone && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid #f5f5f0', fontSize: 14 }}>
                <span style={{ color: '#888' }}>Phone</span>
                <a href={`tel:${dog.owner_phone}`} style={{ fontWeight: 600, color: '#2d7a4f', textDecoration: 'none' }}>{dog.owner_phone}</a>
              </div>
            )}
            {dog.date_lost && <Row label="Date lost" value={dog.date_lost} />}
          </div>
        )}

        {/* Main info */}
        <div style={{ background: '#fff', borderRadius: 12, padding: '16px', marginBottom: 14, border: '1px solid #eee' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#555', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {isLostPet ? 'Pet Description' : 'Identification'}
          </div>
          {isLostPet && dog.pet_name && <Row label="Name" value={dog.pet_name} />}
          <Row label="Breed" value={dog.breed} />
          <Row label="Colour" value={dog.color} />
          <Row label="Size" value={dog.size} />
          <Row label="Sex" value={dog.sex} />
          <Row label="Age" value={dog.age} />
          {dog.notes && <Row label="Notes" value={dog.notes} />}
        </div>

        {/* AI confidence — strays only */}
        {!isLostPet && (
          <div style={{ background: '#fff', borderRadius: 12, padding: '16px', marginBottom: 14, border: '1px solid #eee' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#555', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Model confidence</div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
              <div style={{ flex: 1, background: '#f5f5f0', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: dog.confidence >= 80 ? '#2d7a4f' : dog.confidence >= 60 ? '#e08000' : '#c00' }}>{dog.confidence}%</div>
                <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>Overall</div>
              </div>
              <div style={{ flex: 1, background: '#f5f5f0', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: dog.breed_confidence >= 80 ? '#2d7a4f' : dog.breed_confidence >= 60 ? '#e08000' : '#c00' }}>{dog.breed_confidence}%</div>
                <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>Breed</div>
              </div>
            </div>
          </div>
        )}

        {/* Location */}
        <div style={{ background: '#fff', borderRadius: 12, padding: '16px', marginBottom: 14, border: '1px solid #eee' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#555', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Location</div>
          <Row label="Area" value={dog.area || 'Unknown'} />
          <Row label="City" value={dog.city || 'Unknown'} />
          {dog.lat && <Row label="Coordinates" value={`${dog.lat.toFixed(4)}°N, ${dog.lng.toFixed(4)}°E`} />}
          {!isLostPet && <Row label="Reported by" value={dog.reporter_name || 'Anonymous'} />}
          {dog.lat && (
            <div id="dog-map" style={{ width: '100%', height: 180, borderRadius: 8, marginTop: 12, background: '#e8f0e8', overflow: 'hidden' }} />
          )}
        </div>

        {/* Status — strays only, visible to logged-in users */}
        {!isLostPet && user && (
          <div style={{ background: '#fff', borderRadius: 12, padding: '16px', marginBottom: 14, border: '1px solid #eee' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#555', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</div>
            <select
              value={status}
              onChange={e => handleStatusChange(e.target.value)}
              disabled={statusSaving}
              style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e0e0d8', borderRadius: 8, fontSize: 14, outline: 'none', background: '#fff', color: STATUS_COLORS[status] || '#1a1a18', fontWeight: 600, cursor: 'pointer', appearance: 'none' }}>
              {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            {statusSaving && <div style={{ fontSize: 12, color: '#888', marginTop: 6 }}>Saving...</div>}
            {statusSaved && <div style={{ fontSize: 12, color: '#2d7a4f', marginTop: 6, fontWeight: 600 }}>✓ Status updated</div>}
          </div>
        )}

        {/* Status read-only for non-logged-in users */}
        {!isLostPet && !user && status !== 'sighted' && (
          <div style={{ background: '#fff', borderRadius: 12, padding: '16px', marginBottom: 14, border: '1px solid #eee' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#555', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: STATUS_COLORS[status] || '#888' }}>
              {STATUS_OPTIONS.find(o => o.value === status)?.label || status}
            </div>
          </div>
        )}

        {/* Possible matches */}
        {matches.length > 0 && (
          <div style={{ background: '#fff', borderRadius: 12, padding: '16px', marginBottom: 14, border: '1px solid #eee' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#555', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {isLostPet ? '🐕 Possible Stray Matches' : '🔍 Owner Looking?'}
            </div>
            <div style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>
              {isLostPet
                ? 'Strays in the same city with similar breed/colour'
                : 'Lost pet reports in the same city with similar breed/colour'}
            </div>
            {matches.map(m => (
              <div key={m.id} onClick={() => nav('dog', { dogId: m.id })}
                style={{ display: 'flex', gap: 10, padding: '10px 0', borderBottom: '1px solid #f5f5f0', cursor: 'pointer', alignItems: 'center' }}>
                <div style={{ width: 44, height: 44, borderRadius: 8, background: '#f0f0e8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                  {m.report_type === 'lost_pet' ? '🔍' : '🐕'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{m.report_type === 'lost_pet' ? (m.pet_name || 'Unknown') : m.dog_id}</div>
                  <div style={{ fontSize: 12, color: '#888' }}>{m.breed} · {m.color} · {m.area}</div>
                </div>
                <div style={{ fontSize: 11, color: '#aaa' }}>{timeAgo(m.created_at)}</div>
              </div>
            ))}
          </div>
        )}

        {/* Delete */}
        {user && (
          <div style={{ marginBottom: 24 }}>
            {confirm ? (
              <div style={{ background: '#fff0f0', borderRadius: 12, padding: 16, border: '1px solid #ffb0b0' }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#c00', marginBottom: 12 }}>Delete this record?</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setConfirm(false)} style={{ flex: 1, padding: 11, background: '#fff', border: '1.5px solid #ddd', borderRadius: 8, fontSize: 14, cursor: 'pointer' }}>Cancel</button>
                  <button onClick={handleDelete} disabled={deleting} style={{ flex: 1, padding: 11, background: '#c00', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>{deleting ? 'Deleting...' : 'Yes, delete'}</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setConfirm(true)} style={{ width: '100%', padding: 11, background: '#fff', color: '#c00', border: '1.5px solid #ffb0b0', borderRadius: 8, fontSize: 14, cursor: 'pointer' }}>Delete record</button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
