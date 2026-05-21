import { useState } from 'react'
import { updateProfile } from '../lib/data.js'
import { isDemoMode } from '../lib/supabase.js'
import { useApp } from '../App.jsx'

const inp = { width: '100%', padding: '10px 12px', border: '1.5px solid #e0e0d8', borderRadius: 8, fontSize: 14, outline: 'none', marginBottom: 14, background: '#fff', color: '#1a1a18' }
const lbl = { fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 5, display: 'block' }

export default function ProfilePage({ onSignOut }) {
  const { user, profile, setProfile, refreshProfile } = useApp()

  const [editing, setEditing] = useState(false)
  const [form, setForm]   = useState({ name: profile?.name || '', city: profile?.city || 'Chennai' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]  = useState(false)
  const [error, setError]  = useState('')

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSave = async () => {
    setSaving(true); setError('')
    const { error } = await updateProfile(user.id, { name: form.name, city: form.city })
    setSaving(false)
    if (error) { setError(error.message); return }
    setProfile(p => ({ ...p, ...form }))
    setEditing(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const displayName = profile?.name || user?.email || 'User'
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div style={{ background: '#f4f4f0', minHeight: '100dvh' }}>
      <div style={{ background: '#fff', padding: '16px', borderBottom: '1px solid #eee' }}>
        <h1 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>👤 Profile</h1>
      </div>

      <div style={{ padding: '20px 14px' }}>
        {/* Avatar */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#d0e8d8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 800, color: '#2d7a4f', margin: '0 auto 10px' }}>{initials}</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#1a1a18' }}>{displayName}</div>
          <div style={{ fontSize: 13, color: '#888', marginTop: 3 }}>{user?.email}</div>
          {isDemoMode && <span style={{ display: 'inline-block', marginTop: 8, fontSize: 12, background: '#fffbe6', color: '#7a6000', padding: '3px 10px', borderRadius: 20, fontWeight: 600 }}>Demo mode</span>}
        </div>

        {/* Edit profile form */}
        <div style={{ background: '#fff', borderRadius: 12, padding: '16px', marginBottom: 14, border: '1px solid #eee' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: editing ? 16 : 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Profile details</div>
            <button onClick={() => { setEditing(e => !e); setForm({ name: profile?.name || '', city: profile?.city || 'Chennai' }) }}
              style={{ background: 'none', border: 'none', fontSize: 13, color: '#2d7a4f', fontWeight: 700, cursor: 'pointer' }}>
              {editing ? 'Cancel' : 'Edit'}
            </button>
          </div>

          {editing ? (
            <>
              <label style={lbl}>Name</label>
              <input style={inp} value={form.name} onChange={set('name')} placeholder="Your name" />
              <label style={lbl}>City</label>
              <select style={{ ...inp, appearance: 'none' }} value={form.city} onChange={set('city')}>
                {['Chennai', 'Bengaluru', 'Mumbai', 'Delhi', 'Hyderabad', 'Kolkata', 'Pune', 'Ahmedabad'].map(c => <option key={c}>{c}</option>)}
              </select>
              {error && <div style={{ fontSize: 13, color: '#c00', marginBottom: 12 }}>{error}</div>}
              <button onClick={handleSave} disabled={saving} style={{ width: '100%', padding: 12, background: saving ? '#aaa' : '#2d7a4f', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: saving ? 'default' : 'pointer' }}>
                {saving ? 'Saving...' : 'Save changes'}
              </button>
            </>
          ) : (
            <div style={{ paddingTop: 12 }}>
              {[['Name', profile?.name || '—'], ['City', profile?.city || '—'], ['Email', user?.email || '—']].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f5f5f0', fontSize: 14 }}>
                  <span style={{ color: '#888' }}>{k}</span>
                  <span style={{ fontWeight: 600, color: '#1a1a18' }}>{v}</span>
                </div>
              ))}
            </div>
          )}

          {saved && <div style={{ marginTop: 10, fontSize: 13, color: '#2d7a4f', fontWeight: 600, textAlign: 'center' }}>✓ Profile updated</div>}
        </div>

        {/* About this project */}
        <div style={{ background: '#fff', borderRadius: 12, padding: '16px', marginBottom: 14, border: '1px solid #eee' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#555', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>About this project</div>
          {[
            ['Project', 'Stray Dogs Directory'],
            ['Database', isDemoMode ? 'In-memory (demo)' : 'Supabase PostgreSQL'],
            ['Breeds supported', '13 Indian dog types'],
            ['Maps', 'OpenStreetMap / Leaflet'],
            ['GPS', 'Browser Geolocation API'],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #f5f5f0', fontSize: 13 }}>
              <span style={{ color: '#888' }}>{k}</span>
              <span style={{ fontWeight: 600, color: '#1a1a18', textAlign: 'right', maxWidth: '60%' }}>{v}</span>
            </div>
          ))}
        </div>

        {/* Sign out */}
        <button onClick={onSignOut} style={{ width: '100%', padding: 13, background: '#fff', color: '#c00', border: '1.5px solid #ffb0b0', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', marginBottom: 24 }}>
          Sign out
        </button>
      </div>
    </div>
  )
}
