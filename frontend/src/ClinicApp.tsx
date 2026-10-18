import { useCallback, useDeferredValue, useEffect, useState } from 'react'
import type { CSSProperties, FormEvent } from 'react'
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Boxes,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Download,
  Eye,
  EyeOff,
  FileText,
  Flame,
  Gauge,
  LoaderCircle,
  LogOut,
  Menu,
  Pencil,
  Play,
  Plus,
  Search,
  ShieldCheck,
  Stethoscope,
  Trash2,
  Users,
  Wrench,
  X,
  XCircle,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { api, queryString } from './api'
import './clinic.css'

type Role = 'ADMIN' | 'STAFF'
type Page = 'dashboard' | 'equipment' | 'instruments' | 'maintenance' | 'sterilization' | 'analytics' | 'reports' | 'users'
type User = { id: string; email: string; firstName: string; lastName: string; role: Role; isActive?: boolean; createdAt?: string }
type Equipment = { id: string; name: string; serialNumber: string; type: string; manufacturer?: string | null; model?: string | null; status: string; updatedAt: string }
type Instrument = { id: string; name: string; instrumentCode: string; status: string; updatedAt: string }
type Maintenance = { id: string; equipment: Equipment; performedAt: string; intervalMonths: number; nextMaintenanceAt: string; notes?: string | null; updatedAt: string }
type Batch = { id: string; equipment: Equipment; instruments: Instrument[]; status: string; startedAt?: string | null; completedAt?: string | null; notes?: string | null; createdAt: string; updatedAt: string }
type Item = Equipment | Instrument | Maintenance | Batch | User
type FormValues = Record<string, string | string[]>
type Paginated<T> = { items: T[]; meta: { page: number; limit: number; totalItems: number; totalPages: number } }
type Session = { accessToken: string; user: User }
type Toast = { id: number; message: string; tone: 'success' | 'error' }
const appStartedAt = new Date()
const appStartedAtMs = appStartedAt.getTime()

const navItems: Array<{ page: Page; label: string; icon: LucideIcon; admin?: boolean }> = [
  { page: 'dashboard', label: 'Dashboard', icon: Gauge },
  { page: 'equipment', label: 'Equipment', icon: Boxes },
  { page: 'instruments', label: 'Instruments', icon: Stethoscope },
  { page: 'maintenance', label: 'Maintenance', icon: Wrench },
  { page: 'sterilization', label: 'Sterilization', icon: Flame },
  { page: 'reports', label: 'Reports', icon: FileText },
  { page: 'analytics', label: 'Analytics', icon: BarChart3 },
  { page: 'users', label: 'Users', icon: Users, admin: true },
]

const pageCopy: Record<Page, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dashboard', subtitle: 'Clinic operations at a glance.' },
  equipment: { title: 'Equipment', subtitle: 'Autoclaves, cleaners, and clinic devices.' },
  instruments: { title: 'Instruments', subtitle: 'Availability across the sterilization workflow.' },
  maintenance: { title: 'Maintenance', subtitle: 'Service history and upcoming due dates.' },
  sterilization: { title: 'Sterilization', subtitle: 'Prepare, run, and complete instrument batches.' },
  reports: { title: 'Reports', subtitle: 'Generate auditable maintenance and cycle records.' },
  analytics: { title: 'Analytics', subtitle: 'Operational health and sterilization performance.' },
  users: { title: 'Users', subtitle: 'Access and role management.' },
}

const statusOptions: Partial<Record<Page, string[]>> = {
  equipment: ['ACTIVE', 'MAINTENANCE', 'INACTIVE'],
  instruments: ['AVAILABLE', 'IN_STERILIZATION', 'STERILE'],
  sterilization: ['DRAFT', 'IN_PROGRESS', 'PASSED', 'FAILED'],
}

const resourcePaths: Partial<Record<Page, string>> = {
  equipment: '/equipment', instruments: '/instruments', maintenance: '/maintenance', sterilization: '/sterilization-batches', users: '/users',
}

function humanize(value?: string | null) {
  if (!value) return '—'
  return value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function formatDate(value?: string | null, withTime = false) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}) }).format(new Date(value))
}

function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem('clinic-session')
    return raw ? (JSON.parse(raw) as Session) : null
  } catch {
    return null
  }
}

function StatusBadge({ value }: { value: string }) {
  return <span className={`status status-${value.toLowerCase()}`}>{humanize(value)}</span>
}

function EmptyState({ icon: Icon, title, text }: { icon: LucideIcon; title: string; text: string }) {
  return <div className="empty-state"><span className="empty-icon"><Icon size={22} /></span><h3>{title}</h3><p>{text}</p></div>
}

function Login({ onLogin }: { onLogin: (session: Session) => void }) {
  const [email, setEmail] = useState('admin@clinic.test')
  const [password, setPassword] = useState('Admin123!')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const session = await api<Session>('/auth/login', undefined, { method: 'POST', body: JSON.stringify({ email, password }) })
      localStorage.setItem('clinic-session', JSON.stringify(session))
      onLogin(session)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to sign in.')
    } finally {
      setLoading(false)
    }
  }

  return <main className="login-layout">
    <section className="login-panel">
      <form className="login-form" onSubmit={submit}>
        <div className="brand brand-login"><span className="brand-mark"><ShieldCheck size={20} /></span><span>Clinic Tracker</span></div>
        <div className="login-heading"><span className="eyebrow">Secure operations</span><h1>Sign in to your clinic</h1><p>Manage equipment, maintenance, and sterilization records.</p></div>
        {error && <div className="alert alert-error"><AlertTriangle size={17} />{error}</div>}
        <label><span>Email</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
        <label><span>Password</span><div className="password-field"><input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} required /><button type="button" className="icon-button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></label>
        <button className="button button-primary login-button" type="submit" disabled={loading}>{loading && <LoaderCircle className="spin" size={17} />}{loading ? 'Signing in' : 'Sign in'}</button>
        <p className="demo-account">Demo admin: admin@clinic.test / Admin123!</p>
      </form>
    </section>
    <section className="login-visual" aria-label="Clinic sterilization overview"><div className="visual-grid" aria-hidden="true" /><div className="visual-content"><div className="visual-kicker"><Activity size={16} />Operational control</div><h2>Every instrument.<br />Every cycle. Accounted for.</h2><div className="process-line"><span><Check size={16} />Registered</span><span><Flame size={16} />Sterilized</span><span><ClipboardCheck size={16} />Auditable</span></div></div></section>
  </main>
}

function Dashboard({ token, user, onNavigate }: { token: string; user: User; onNavigate: (page: Page) => void }) {
  const [overview, setOverview] = useState({ equipment: 0, instruments: 0, maintenanceRecords: 0, sterilizationBatches: 0 })
  const [maintenance, setMaintenance] = useState<Maintenance[]>([])
  const [batches, setBatches] = useState<Batch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    Promise.all([api<typeof overview>('/analytics/overview', token), api<Paginated<Maintenance>>('/maintenance?limit=5', token), api<Paginated<Batch>>('/sterilization-batches?limit=5', token)])
      .then(([overviewData, maintenanceData, batchData]) => { if (active) { setOverview(overviewData); setMaintenance(maintenanceData.items); setBatches(batchData.items) } })
      .catch((requestError) => { if (active) setError(requestError instanceof Error ? requestError.message : 'Dashboard data could not be loaded.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [token])

  const metrics = [
    { label: 'Equipment', value: overview.equipment, icon: Boxes, page: 'equipment' as Page },
    { label: 'Instruments', value: overview.instruments, icon: Stethoscope, page: 'instruments' as Page },
    { label: 'Maintenance records', value: overview.maintenanceRecords, icon: Wrench, page: 'maintenance' as Page },
    { label: 'Sterilization batches', value: overview.sterilizationBatches, icon: Flame, page: 'sterilization' as Page },
  ]

  return <div className="page-stack">
    <section className="welcome-row"><div><span className="eyebrow">{new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }).format(appStartedAt)}</span><h1>Good {appStartedAt.getHours() < 12 ? 'morning' : appStartedAt.getHours() < 18 ? 'afternoon' : 'evening'}, {user.firstName}</h1><p>Here is the latest from your clinic.</p></div><button className="button button-primary" onClick={() => onNavigate('sterilization')}><Plus size={17} />New batch</button></section>
    {error && <div className="alert alert-error"><AlertTriangle size={17} />{error}</div>}
    <section className="metric-grid" aria-label="Clinic overview">{metrics.map(({ label, value, icon: Icon, page }) => <button className="metric-card" key={label} onClick={() => onNavigate(page)}><span className="metric-icon"><Icon size={19} /></span><span className="metric-value">{loading ? '—' : value}</span><span className="metric-label">{label}</span><ChevronRight size={17} className="metric-arrow" /></button>)}</section>
    <section className="dashboard-grid">
      <div className="panel"><div className="panel-heading"><div><h2>Maintenance watch</h2><p>Nearest scheduled service dates</p></div><button className="text-button" onClick={() => onNavigate('maintenance')}>View all <ChevronRight size={15} /></button></div><div className="activity-list">{maintenance.map((record) => { const days = Math.ceil((new Date(record.nextMaintenanceAt).getTime() - appStartedAtMs) / 86400000); const state = days < 0 ? 'OVERDUE' : days <= 30 ? 'DUE_SOON' : 'HEALTHY'; return <button className="activity-row" key={record.id} onClick={() => onNavigate('maintenance')}><span className="activity-icon"><Wrench size={17} /></span><span className="activity-main"><strong>{record.equipment.name}</strong><small>Next service {formatDate(record.nextMaintenanceAt)}</small></span><StatusBadge value={state} /></button> })}{!loading && maintenance.length === 0 && <EmptyState icon={Wrench} title="No maintenance records" text="Logged maintenance will appear here." />}</div></div>
      <div className="panel"><div className="panel-heading"><div><h2>Recent cycles</h2><p>Latest sterilization activity</p></div><button className="text-button" onClick={() => onNavigate('sterilization')}>View all <ChevronRight size={15} /></button></div><div className="activity-list">{batches.map((batch) => <button className="activity-row" key={batch.id} onClick={() => onNavigate('sterilization')}><span className="activity-icon"><Flame size={17} /></span><span className="activity-main"><strong>{batch.equipment.name}</strong><small>{batch.instruments.length} instrument{batch.instruments.length === 1 ? '' : 's'} · {formatDate(batch.updatedAt, true)}</small></span><StatusBadge value={batch.status} /></button>)}{!loading && batches.length === 0 && <EmptyState icon={Flame} title="No sterilization batches" text="New cycles will appear here." />}</div></div>
    </section>
  </div>
}

function ResourcePage({ kind, token, user, notify }: { kind: Page; token: string; user: User; notify: (message: string, tone?: Toast['tone']) => void }) {
  const [items, setItems] = useState<Item[]>([])
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [instruments, setInstruments] = useState<Instrument[]>([])
  const [meta, setMeta] = useState({ page: 1, limit: 8, totalItems: 0, totalPages: 1 })
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)
  const [status, setStatus] = useState('')
  const [pageNumber, setPageNumber] = useState(1)
  const [refreshKey, setRefreshKey] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState<Item | 'new' | null>(null)
  const [values, setValues] = useState<FormValues>({})
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const path = resourcePaths[kind] || ''

  useEffect(() => {
    if (!['maintenance', 'sterilization'].includes(kind)) return
    Promise.all([api<Paginated<Equipment>>('/equipment?limit=100', token), api<Paginated<Instrument>>('/instruments?limit=100', token)])
      .then(([equipmentData, instrumentData]) => { setEquipment(equipmentData.items); setInstruments(instrumentData.items) }).catch(() => undefined)
  }, [kind, token, refreshKey])

  useEffect(() => {
    let active = true
    const query = kind === 'users' ? '' : queryString({ page: pageNumber, limit: 8, search: deferredSearch, status })
    api<Paginated<Item> | User[]>(`${path}${query}`, token).then((data) => {
      if (!active) return
      if (Array.isArray(data)) {
        const filtered = deferredSearch ? data.filter((entry) => `${entry.firstName} ${entry.lastName} ${entry.email}`.toLowerCase().includes(deferredSearch.toLowerCase())) : data
        setItems(filtered); setMeta({ page: 1, limit: filtered.length, totalItems: filtered.length, totalPages: 1 })
      } else { setItems(data.items); setMeta(data.meta) }
    }).catch((requestError) => { if (active) setError(requestError instanceof Error ? requestError.message : 'Records could not be loaded.') }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [deferredSearch, kind, pageNumber, path, refreshKey, status, token])

  function defaults(): FormValues {
    if (kind === 'equipment') return { name: '', serialNumber: '', type: 'AUTOCLAVE', manufacturer: '', model: '', status: 'ACTIVE' }
    if (kind === 'instruments') return { name: '', instrumentCode: '' }
    if (kind === 'maintenance') return { equipmentId: '', performedAt: new Date().toISOString().slice(0, 16), intervalMonths: '6', notes: '' }
    if (kind === 'sterilization') return { equipmentId: '', instrumentIds: [], notes: '' }
    return { email: '', password: '', firstName: '', lastName: '', role: 'STAFF' }
  }

  function openForm(item: Item | 'new') {
    setFormError(''); setEditing(item)
    if (item === 'new') { setValues(defaults()); return }
    if (kind === 'equipment') { const entry = item as Equipment; setValues({ name: entry.name, serialNumber: entry.serialNumber, type: entry.type, manufacturer: entry.manufacturer || '', model: entry.model || '', status: entry.status }) }
    else if (kind === 'instruments') { const entry = item as Instrument; setValues({ name: entry.name, instrumentCode: entry.instrumentCode }) }
    else if (kind === 'maintenance') { const entry = item as Maintenance; setValues({ equipmentId: entry.equipment.id, performedAt: entry.performedAt.slice(0, 16), intervalMonths: String(entry.intervalMonths), notes: entry.notes || '' }) }
    else if (kind === 'sterilization') { const entry = item as Batch; setValues({ equipmentId: entry.equipment.id, instrumentIds: entry.instruments.map((instrument) => instrument.id), notes: entry.notes || '' }) }
    else { const entry = item as User; setValues({ email: entry.email, password: '', firstName: entry.firstName, lastName: entry.lastName, role: entry.role }) }
  }

  async function save(event: FormEvent) {
    event.preventDefault(); setSaving(true); setFormError('')
    const creating = editing === 'new'
    const body: Record<string, string | string[] | number> = { ...values }
    if (kind === 'maintenance') { body.performedAt = new Date(String(values.performedAt)).toISOString(); body.intervalMonths = Number(values.intervalMonths); if (!creating) delete body.equipmentId }
    if (kind === 'sterilization' && !creating) delete body.equipmentId
    if (kind === 'equipment' && !creating) delete body.serialNumber
    if (kind === 'instruments' && !creating) delete body.instrumentCode
    if (kind === 'users' && !body.password) delete body.password
    try {
      const itemPath = creating ? path : `${path}/${(editing as Item).id}`
      await api(itemPath, token, { method: creating ? 'POST' : 'PATCH', body: JSON.stringify(body) })
      setEditing(null); setRefreshKey((value) => value + 1); notify(creating ? 'Record created.' : 'Changes saved.')
    } catch (requestError) { setFormError(requestError instanceof Error ? requestError.message : 'The record could not be saved.') }
    finally { setSaving(false) }
  }

  async function remove(item: Item) {
    if (!window.confirm('Delete this record? This action cannot be undone.')) return
    try { await api(`${path}/${item.id}`, token, { method: 'DELETE' }); setRefreshKey((value) => value + 1); notify('Record deleted.') }
    catch (requestError) { notify(requestError instanceof Error ? requestError.message : 'The record could not be deleted.', 'error') }
  }

  async function workflow(batch: Batch, action: 'start' | 'PASSED' | 'FAILED') {
    try {
      if (action === 'start') await api(`${path}/${batch.id}/start`, token, { method: 'POST' })
      else await api(`${path}/${batch.id}/complete`, token, { method: 'POST', body: JSON.stringify({ result: action }) })
      setRefreshKey((value) => value + 1); notify(action === 'start' ? 'Sterilization batch started.' : `Batch marked ${humanize(action).toLowerCase()}.`)
    } catch (requestError) { notify(requestError instanceof Error ? requestError.message : 'The workflow action failed.', 'error') }
  }

  function headers() {
    if (kind === 'equipment') return ['Equipment', 'Type', 'Manufacturer / model', 'Status', 'Updated', '']
    if (kind === 'instruments') return ['Instrument', 'Code', 'Status', 'Updated', '']
    if (kind === 'maintenance') return ['Equipment', 'Performed', 'Interval', 'Next due', 'State', '']
    if (kind === 'sterilization') return ['Batch', 'Autoclave', 'Instruments', 'Status', 'Started', '']
    return ['User', 'Email', 'Role', 'Status', '']
  }

  function row(item: Item) {
    if (kind === 'equipment') { const entry = item as Equipment; return <><td><strong>{entry.name}</strong><small>{entry.serialNumber}</small></td><td><StatusBadge value={entry.type} /></td><td>{[entry.manufacturer, entry.model].filter(Boolean).join(' · ') || '—'}</td><td><StatusBadge value={entry.status} /></td><td>{formatDate(entry.updatedAt)}</td></> }
    if (kind === 'instruments') { const entry = item as Instrument; return <><td><strong>{entry.name}</strong></td><td><code>{entry.instrumentCode}</code></td><td><StatusBadge value={entry.status} /></td><td>{formatDate(entry.updatedAt)}</td></> }
    if (kind === 'maintenance') { const entry = item as Maintenance; const days = Math.ceil((new Date(entry.nextMaintenanceAt).getTime() - appStartedAtMs) / 86400000); const due = days < 0 ? 'OVERDUE' : days <= 30 ? 'DUE_SOON' : 'HEALTHY'; return <><td><strong>{entry.equipment.name}</strong><small>{entry.equipment.serialNumber}</small></td><td>{formatDate(entry.performedAt)}</td><td>{entry.intervalMonths} months</td><td>{formatDate(entry.nextMaintenanceAt)}</td><td><StatusBadge value={due} /></td></> }
    if (kind === 'sterilization') { const entry = item as Batch; return <><td><strong className="mono">#{entry.id.slice(0, 8).toUpperCase()}</strong><small>{formatDate(entry.createdAt)}</small></td><td>{entry.equipment.name}</td><td>{entry.instruments.length} item{entry.instruments.length === 1 ? '' : 's'}</td><td><StatusBadge value={entry.status} /></td><td>{formatDate(entry.startedAt, true)}</td></> }
    const entry = item as User; return <><td><strong>{entry.firstName} {entry.lastName}</strong></td><td>{entry.email}</td><td><StatusBadge value={entry.role} /></td><td><StatusBadge value={entry.isActive === false ? 'INACTIVE' : 'ACTIVE'} /></td></>
  }

  const canEdit = (item: Item) => kind !== 'sterilization' || (item as Batch).status === 'DRAFT'
  const emptyCopy = kind === 'equipment' ? 'Add the first device to begin tracking maintenance.' : kind === 'instruments' ? 'Register instruments to assign them to sterilization batches.' : kind === 'maintenance' ? 'Log a service visit to begin tracking due dates.' : kind === 'sterilization' ? 'Create a batch to begin a sterilization cycle.' : 'Create a user to grant clinic access.'

  return <div className="page-stack">
    <section className="page-heading"><div><h1>{pageCopy[kind].title}</h1><p>{pageCopy[kind].subtitle}</p></div>{(kind !== 'users' || user.role === 'ADMIN') && <button className="button button-primary" onClick={() => openForm('new')}><Plus size={17} />{kind === 'maintenance' ? 'Log maintenance' : kind === 'sterilization' ? 'New batch' : kind === 'users' ? 'Add user' : `Add ${kind === 'equipment' ? 'equipment' : 'instrument'}`}</button>}</section>
    <section className="toolbar"><label className="search-field"><Search size={17} /><input value={search} onChange={(event) => { setSearch(event.target.value); setPageNumber(1) }} placeholder={`Search ${pageCopy[kind].title.toLowerCase()}…`} /></label>{statusOptions[kind] && <select value={status} onChange={(event) => { setStatus(event.target.value); setPageNumber(1) }} aria-label="Filter by status"><option value="">All statuses</option>{statusOptions[kind]?.map((option) => <option key={option} value={option}>{humanize(option)}</option>)}</select>}<span className="record-count">{meta.totalItems} record{meta.totalItems === 1 ? '' : 's'}</span></section>
    {error && <div className="alert alert-error"><AlertTriangle size={17} />{error}</div>}
    <section className="table-panel">{loading ? <div className="loading-state"><LoaderCircle className="spin" size={22} />Loading records</div> : items.length === 0 ? <EmptyState icon={kind === 'sterilization' ? Flame : kind === 'maintenance' ? Wrench : kind === 'equipment' ? Boxes : kind === 'users' ? Users : Stethoscope} title={`No ${pageCopy[kind].title.toLowerCase()} found`} text={emptyCopy} /> : <div className="table-scroll"><table><thead><tr>{headers().map((header, index) => <th key={`${header}-${index}`}>{header}</th>)}</tr></thead><tbody>{items.map((item) => <tr key={item.id}>{row(item)}<td className="row-actions">{kind === 'sterilization' && (item as Batch).status === 'DRAFT' && <button className="icon-button action-start" title="Start batch" onClick={() => workflow(item as Batch, 'start')}><Play size={16} /></button>}{kind === 'sterilization' && (item as Batch).status === 'IN_PROGRESS' && <><button className="icon-button action-pass" title="Mark passed" onClick={() => workflow(item as Batch, 'PASSED')}><CheckCircle2 size={16} /></button><button className="icon-button action-fail" title="Mark failed" onClick={() => workflow(item as Batch, 'FAILED')}><XCircle size={16} /></button></>}{canEdit(item) && (kind !== 'users' || user.role === 'ADMIN') && <button className="icon-button" title="Edit" onClick={() => openForm(item)}><Pencil size={16} /></button>}{user.role === 'ADMIN' && canEdit(item) && <button className="icon-button danger" title="Delete" onClick={() => remove(item)}><Trash2 size={16} /></button>}</td></tr>)}</tbody></table></div>}{meta.totalPages > 1 && <div className="pagination"><button className="icon-button" disabled={pageNumber <= 1} onClick={() => setPageNumber((value) => value - 1)} aria-label="Previous page"><ChevronLeft size={17} /></button><span>Page {meta.page} of {meta.totalPages}</span><button className="icon-button" disabled={pageNumber >= meta.totalPages} onClick={() => setPageNumber((value) => value + 1)} aria-label="Next page"><ChevronRight size={17} /></button></div>}</section>
    {editing && <div className="modal-backdrop" role="presentation" onMouseDown={() => !saving && setEditing(null)}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="form-title" onMouseDown={(event) => event.stopPropagation()}><div className="modal-heading"><div><span className="eyebrow">{editing === 'new' ? 'New record' : 'Edit record'}</span><h2 id="form-title">{editing === 'new' ? `Add ${kind === 'maintenance' ? 'maintenance' : kind === 'sterilization' ? 'sterilization batch' : kind.slice(0, -1)}` : `Edit ${pageCopy[kind].title.toLowerCase()}`}</h2></div><button className="icon-button" onClick={() => setEditing(null)} aria-label="Close"><X size={19} /></button></div>
      <form className="record-form" onSubmit={save}>
        {kind === 'equipment' && <><label><span>Name</span><input required minLength={2} value={values.name as string} onChange={(event) => setValues({ ...values, name: event.target.value })} /></label><label><span>Serial number</span><input required disabled={editing !== 'new'} value={values.serialNumber as string} onChange={(event) => setValues({ ...values, serialNumber: event.target.value })} /></label><label><span>Type</span><select value={values.type as string} onChange={(event) => setValues({ ...values, type: event.target.value })}><option value="AUTOCLAVE">Autoclave</option><option value="ULTRASONIC_CLEANER">Ultrasonic cleaner</option><option value="OTHER">Other</option></select></label><label><span>Status</span><select value={values.status as string} onChange={(event) => setValues({ ...values, status: event.target.value })}>{statusOptions.equipment?.map((option) => <option key={option} value={option}>{humanize(option)}</option>)}</select></label><label><span>Manufacturer <em>Optional</em></span><input value={values.manufacturer as string} onChange={(event) => setValues({ ...values, manufacturer: event.target.value })} /></label><label><span>Model <em>Optional</em></span><input value={values.model as string} onChange={(event) => setValues({ ...values, model: event.target.value })} /></label></>}
        {kind === 'instruments' && <><label className="field-wide"><span>Name</span><input required minLength={2} value={values.name as string} onChange={(event) => setValues({ ...values, name: event.target.value })} /></label><label className="field-wide"><span>Instrument code</span><input required disabled={editing !== 'new'} value={values.instrumentCode as string} onChange={(event) => setValues({ ...values, instrumentCode: event.target.value })} /></label></>}
        {kind === 'maintenance' && <><label className="field-wide"><span>Equipment</span><select required disabled={editing !== 'new'} value={values.equipmentId as string} onChange={(event) => setValues({ ...values, equipmentId: event.target.value })}><option value="">Select equipment</option>{equipment.map((entry) => <option key={entry.id} value={entry.id}>{entry.name} · {entry.serialNumber}</option>)}</select></label><label><span>Performed at</span><input required type="datetime-local" value={values.performedAt as string} onChange={(event) => setValues({ ...values, performedAt: event.target.value })} /></label><label><span>Interval (months)</span><input required type="number" min="1" max="60" value={values.intervalMonths as string} onChange={(event) => setValues({ ...values, intervalMonths: event.target.value })} /></label><label className="field-wide"><span>Notes <em>Optional</em></span><textarea rows={4} value={values.notes as string} onChange={(event) => setValues({ ...values, notes: event.target.value })} /></label></>}
        {kind === 'sterilization' && <><label className="field-wide"><span>Autoclave</span><select required disabled={editing !== 'new'} value={values.equipmentId as string} onChange={(event) => setValues({ ...values, equipmentId: event.target.value })}><option value="">Select autoclave</option>{equipment.filter((entry) => entry.type === 'AUTOCLAVE' && entry.status === 'ACTIVE').map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}</select></label><label className="field-wide"><span>Instruments</span><select required multiple size={6} value={values.instrumentIds as string[]} onChange={(event) => setValues({ ...values, instrumentIds: Array.from(event.target.selectedOptions, (option) => option.value) })}>{instruments.filter((entry) => entry.status === 'AVAILABLE' || (values.instrumentIds as string[]).includes(entry.id)).map((entry) => <option key={entry.id} value={entry.id}>{entry.instrumentCode} · {entry.name}</option>)}</select><small>Hold Command or Ctrl to select multiple instruments.</small></label><label className="field-wide"><span>Notes <em>Optional</em></span><textarea rows={4} value={values.notes as string} onChange={(event) => setValues({ ...values, notes: event.target.value })} /></label></>}
        {kind === 'users' && <><label><span>First name</span><input required value={values.firstName as string} onChange={(event) => setValues({ ...values, firstName: event.target.value })} /></label><label><span>Last name</span><input required value={values.lastName as string} onChange={(event) => setValues({ ...values, lastName: event.target.value })} /></label><label className="field-wide"><span>Email</span><input required type="email" value={values.email as string} onChange={(event) => setValues({ ...values, email: event.target.value })} /></label><label><span>Password {editing !== 'new' && <em>Optional</em>}</span><input required={editing === 'new'} type="password" minLength={8} value={values.password as string} onChange={(event) => setValues({ ...values, password: event.target.value })} /></label><label><span>Role</span><select value={values.role as string} onChange={(event) => setValues({ ...values, role: event.target.value })}><option value="STAFF">Staff</option><option value="ADMIN">Admin</option></select></label></>}
        {formError && <div className="alert alert-error field-wide"><AlertTriangle size={17} />{formError}</div>}<div className="form-actions field-wide"><button type="button" className="button button-secondary" onClick={() => setEditing(null)}>Cancel</button><button className="button button-primary" disabled={saving}>{saving && <LoaderCircle className="spin" size={17} />}{saving ? 'Saving' : editing === 'new' ? 'Create record' : 'Save changes'}</button></div>
      </form></section></div>}
  </div>
}

type AnalyticsData = {
  overview: { equipment: number; instruments: number; maintenanceRecords: number; sterilizationBatches: number }
  equipment: { total: number; byStatus: Array<{ status: string; count: number }>; byType: Array<{ type: string; count: number }> }
  instruments: { total: number; byStatus: Array<{ status: string; count: number }> }
  sterilization: { total: number; completed: number; passed: number; failed: number; successRate: number; averageDurationMinutes: number; byStatus: Array<{ status: string; count: number }> }
  maintenance: { totalRecords: number; overdue: number; dueSoon: number; byEquipment: Array<{ equipmentId: string; equipmentName: string; count: number }> }
}

function Bars({ rows, total }: { rows: Array<{ label: string; count: number }>; total: number }) {
  return <div className="bar-list">{rows.map((row) => <div className="bar-row" key={row.label}><div className="bar-label"><span>{humanize(row.label)}</span><strong>{row.count}</strong></div><div className="bar-track"><span style={{ width: `${total ? Math.max(4, row.count / total * 100) : 0}%` }} /></div></div>)}</div>
}

function AnalyticsPage({ token }: { token: string }) {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    Promise.all([api<AnalyticsData['overview']>('/analytics/overview', token), api<AnalyticsData['equipment']>('/analytics/equipment', token), api<AnalyticsData['instruments']>('/analytics/instruments', token), api<AnalyticsData['sterilization']>('/analytics/sterilization', token), api<AnalyticsData['maintenance']>('/analytics/maintenance', token)])
      .then(([overview, equipment, instruments, sterilization, maintenance]) => { if (active) setData({ overview, equipment, instruments, sterilization, maintenance }) })
      .catch((requestError) => { if (active) setError(requestError instanceof Error ? requestError.message : 'Analytics could not be loaded.') })
    return () => { active = false }
  }, [token])
  return <div className="page-stack"><section className="page-heading"><div><h1>Analytics</h1><p>{pageCopy.analytics.subtitle}</p></div></section>{error && <div className="alert alert-error"><AlertTriangle size={17} />{error}</div>}{!data ? <div className="loading-state"><LoaderCircle className="spin" size={22} />Loading analytics</div> : <><section className="analytics-hero"><div><span className="eyebrow">Sterilization success</span><strong>{data.sterilization.successRate}%</strong><p>{data.sterilization.passed} of {data.sterilization.completed} completed cycles passed</p></div><div className="analytics-ring" style={{ '--rate': `${data.sterilization.successRate * 3.6}deg` } as CSSProperties}><span>{data.sterilization.successRate}%</span></div><div className="analytics-facts"><span><small>Average cycle</small><strong>{data.sterilization.averageDurationMinutes} min</strong></span><span><small>Overdue service</small><strong className={data.maintenance.overdue ? 'danger-text' : ''}>{data.maintenance.overdue}</strong></span><span><small>Due soon</small><strong>{data.maintenance.dueSoon}</strong></span></div></section><section className="analytics-grid"><div className="panel"><div className="panel-heading"><div><h2>Equipment status</h2><p>{data.equipment.total} devices</p></div></div><Bars total={data.equipment.total} rows={data.equipment.byStatus.map((row) => ({ label: row.status, count: row.count }))} /></div><div className="panel"><div className="panel-heading"><div><h2>Instrument status</h2><p>{data.instruments.total} instruments</p></div></div><Bars total={data.instruments.total} rows={data.instruments.byStatus.map((row) => ({ label: row.status, count: row.count }))} /></div><div className="panel"><div className="panel-heading"><div><h2>Cycle outcomes</h2><p>{data.sterilization.total} batches</p></div></div><Bars total={data.sterilization.total} rows={data.sterilization.byStatus.map((row) => ({ label: row.status, count: row.count }))} /></div><div className="panel"><div className="panel-heading"><div><h2>Service history</h2><p>Records by equipment</p></div></div><Bars total={Math.max(...data.maintenance.byEquipment.map((row) => row.count), 1)} rows={data.maintenance.byEquipment.map((row) => ({ label: row.equipmentName, count: row.count }))} /></div></section></>}</div>
}

function ReportsPage({ token, notify }: { token: string; notify: (message: string, tone?: Toast['tone']) => void }) {
  const [maintenance, setMaintenance] = useState<Maintenance[]>([])
  const [batches, setBatches] = useState<Batch[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    Promise.all([api<Paginated<Maintenance>>('/maintenance?limit=100', token), api<Paginated<Batch>>('/sterilization-batches?limit=100', token)])
      .then(([maintenanceData, batchData]) => { setMaintenance(maintenanceData.items); setBatches(batchData.items.filter((batch) => ['PASSED', 'FAILED'].includes(batch.status))) })
      .catch((requestError) => notify(requestError instanceof Error ? requestError.message : 'Reports could not be loaded.', 'error')).finally(() => setLoading(false))
  }, [notify, token])
  async function generate(path: string, filename: string) {
    try { const html = await api<string>(path, token, { method: 'POST' }); const url = URL.createObjectURL(new Blob([html], { type: 'text/html' })); const link = document.createElement('a'); link.setAttribute('href', url); link.setAttribute('download', filename); link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); notify('Report downloaded.') }
    catch (requestError) { notify(requestError instanceof Error ? requestError.message : 'Report generation failed.', 'error') }
  }
  return <div className="page-stack"><section className="page-heading"><div><h1>Reports</h1><p>{pageCopy.reports.subtitle}</p></div></section>{loading ? <div className="loading-state"><LoaderCircle className="spin" size={22} />Loading report records</div> : <section className="report-grid"><div className="panel report-panel"><div className="report-title"><span className="metric-icon"><Wrench size={19} /></span><div><h2>Maintenance reports</h2><p>{maintenance.length} service records</p></div></div><div className="report-list">{maintenance.slice(0, 8).map((record) => <div className="report-row" key={record.id}><div><strong>{record.equipment.name}</strong><small>{formatDate(record.performedAt)} · {record.intervalMonths} month interval</small></div><button className="icon-button" title="Download report" onClick={() => generate(`/reports/maintenance/${record.id}`, `maintenance-${record.id.slice(0, 8)}.html`)}><Download size={17} /></button></div>)}</div></div><div className="panel report-panel"><div className="report-title"><span className="metric-icon"><Flame size={19} /></span><div><h2>Sterilization reports</h2><p>{batches.length} completed cycles</p></div></div><div className="report-list">{batches.slice(0, 8).map((batch) => <div className="report-row" key={batch.id}><div><strong>Batch #{batch.id.slice(0, 8).toUpperCase()}</strong><small>{batch.equipment.name} · {formatDate(batch.completedAt)}</small></div><button className="icon-button" title="Download report" onClick={() => generate(`/reports/sterilization/${batch.id}`, `sterilization-${batch.id.slice(0, 8)}.html`)}><Download size={17} /></button></div>)}</div></div></section>}</div>
}

function ClinicApp() {
  const [session, setSession] = useState<Session | null>(() => loadSession())
  const [page, setPage] = useState<Page>(() => { const value = window.location.hash.replace('#/', '') as Page; return pageCopy[value] ? value : 'dashboard' })
  const [mobileNav, setMobileNav] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])
  useEffect(() => { const onHash = () => { const value = window.location.hash.replace('#/', '') as Page; if (pageCopy[value]) setPage(value) }; window.addEventListener('hashchange', onHash); return () => window.removeEventListener('hashchange', onHash) }, [])
  function navigate(nextPage: Page) { window.history.pushState(null, '', `#/${nextPage}`); setPage(nextPage); setMobileNav(false); window.scrollTo({ top: 0 }) }
  function logout() { localStorage.removeItem('clinic-session'); setSession(null); window.history.replaceState(null, '', window.location.pathname + window.location.search) }
  const notify = useCallback((message: string, tone: Toast['tone'] = 'success') => { const id = Date.now(); setToasts((current) => [...current, { id, message, tone }]); window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 3500) }, [])
  if (!session) return <Login onLogin={setSession} />
  const currentPage = session.user.role !== 'ADMIN' && page === 'users' ? 'dashboard' : page
  const visibleNav = navItems.filter((item) => !item.admin || session.user.role === 'ADMIN')
  const resourcePages: Page[] = ['equipment', 'instruments', 'maintenance', 'sterilization', 'users']
  return <div className="app-shell">{mobileNav && <button className="nav-scrim" aria-label="Close navigation" onClick={() => setMobileNav(false)} />}<aside className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`}><div className="brand"><span className="brand-mark"><ShieldCheck size={20} /></span><span>Clinic Tracker</span></div><nav aria-label="Main navigation">{visibleNav.map(({ page: navPage, label, icon: Icon }) => <button key={navPage} className={currentPage === navPage ? 'nav-active' : ''} onClick={() => navigate(navPage)}><Icon size={18} /><span>{label}</span></button>)}</nav><div className="sidebar-footer"><div className="user-summary"><span className="avatar">{`${session.user.firstName[0] || ''}${session.user.lastName[0] || ''}`.toUpperCase()}</span><span><strong>{session.user.firstName} {session.user.lastName}</strong><small>{humanize(session.user.role)}</small></span></div><button className="icon-button" onClick={logout} title="Sign out"><LogOut size={18} /></button></div></aside><div className="app-main"><header className="topbar"><button className="icon-button menu-button" onClick={() => setMobileNav(true)} aria-label="Open navigation"><Menu size={20} /></button><div><span>Clinic Tracker</span><ChevronRight size={14} /><strong>{pageCopy[currentPage].title}</strong></div><span className="topbar-role"><span className="live-dot" />{humanize(session.user.role)}</span></header><main className="content">{currentPage === 'dashboard' && <Dashboard token={session.accessToken} user={session.user} onNavigate={navigate} />}{resourcePages.includes(currentPage) && <ResourcePage key={currentPage} kind={currentPage} token={session.accessToken} user={session.user} notify={notify} />}{currentPage === 'analytics' && <AnalyticsPage token={session.accessToken} />}{currentPage === 'reports' && <ReportsPage token={session.accessToken} notify={notify} />}</main></div><div className="toast-stack" aria-live="polite">{toasts.map((toast) => <div className={`toast toast-${toast.tone}`} key={toast.id}>{toast.tone === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}<span>{toast.message}</span></div>)}</div></div>
}

export default ClinicApp