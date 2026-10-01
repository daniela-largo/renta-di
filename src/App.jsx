import { useState } from 'react'
import { HashRouter, Routes, Route, Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { autos, sedes, IVA } from './data'

const usd = n => `US$ ${n.toLocaleString('en-US')}`
const hoy = d => new Date(Date.now() + d * 864e5).toISOString().slice(0, 10)
const dias = (a, b) => Math.max(0, Math.round((new Date(b) - new Date(a)) / 864e5))

// ---------- Layouts ----------
function AuthLayout({ titulo, children }) {
  return (
    <div className="auth">
      <aside>Movilidad segura para misiones diplomáticas</aside>
      <section><h1>Renta Diplomática</h1><h2>{titulo}</h2>{children}</section>
    </div>
  )
}
function Shell({ children }) {
  return (
    <>
      <nav>
        <b>Renta Diplomática</b>
        <Link to="/catalogo">Catálogo</Link>
        <Link to="/reservas">Mis reservas</Link>
        <Link to="/emergencia" className="sos">Emergencia</Link>
      </nav>
      <main>{children}</main>
    </>
  )
}

// ---------- Pantallas de autenticación (HU-01, HU-02) ----------
function Login() {
  const nav = useNavigate()
  return (
    <AuthLayout titulo="Iniciar sesión">
      <form onSubmit={e => { e.preventDefault(); nav('/2fa') }}>
        <label>Correo institucional<input type="email" required /></label>
        <label>Contraseña<input type="password" required /></label>
        <button>Continuar</button>
      </form>
      <p>Eres nuevo<Link to="/registro">Crear cuenta</Link></p>
    </AuthLayout>
  )
}
function Registro() {
  const nav = useNavigate()
  return (
    <AuthLayout titulo="Registro diplomático">
      <form onSubmit={e => { e.preventDefault(); alert('Verificamos tu credencial y te enviamos un correo.'); nav('/') }}>
        <label>Nombre completo<input required /></label>
        <label>País<input required /></label>
        <label>Misión diplomática<input required /></label>
        <label>Número de credencial<input required /></label>
        <label>Correo institucional<input type="email" required /></label>
        <button>Registrarme</button>
      </form>
    </AuthLayout>
  )
}
function Dos2FA() {
  const nav = useNavigate()
  const [cod, setCod] = useState('')
  return (
    <AuthLayout titulo="Verificación en dos pasos">
      <p>Ingresa el código de 6 dígitos (en el demo sirve cualquiera).</p>
      <form onSubmit={e => { e.preventDefault(); cod.length === 6 ? nav('/catalogo') : alert('El código debe tener 6 dígitos') }}>
        <label>Código<input value={cod} maxLength={6} onChange={e => setCod(e.target.value)} /></label>
        <button>Verificar</button>
      </form>
    </AuthLayout>
  )
}

// ---------- Catálogo y detalle (HU-03) ----------
function Catalogo() {
  const [cat, setCat] = useState('Todos')
  const [bl, setBl] = useState('Todos')
  const [max, setMax] = useState(300)
  const lista = autos.filter(a =>
    (cat === 'Todos' || a.categoria === cat) &&
    (bl === 'Todos' || a.blindado === (bl === 'Sí')) &&
    a.precio <= max)
  return (
    <Shell>
      <h1>Catálogo de vehículos</h1>
      <div className="filtros">
        <label>Tipo<select value={cat} onChange={e => setCat(e.target.value)}><option>Todos</option><option>Sedán</option><option>SUV</option></select></label>
        <label>Blindaje<select value={bl} onChange={e => setBl(e.target.value)}><option>Todos</option><option>Sí</option><option>No</option></select></label>
        <label>Precio máx. (US$/día): {max}<input type="range" min="50" max="300" step="10" value={max} onChange={e => setMax(+e.target.value)} /></label>
      </div>
      <div className="grid">
        {lista.map(a => (
          <div className="card" key={a.id}>
            <div className="emoji">{a.emoji}</div>
            {a.blindado && <span className="tag">Blindado</span>}
            <strong>{a.nombre}</strong>
            <span>{a.categoria} · {a.transmision} · {a.plazas} plazas</span>
            <span className="ok">Disponible</span>
            <div className="precio">{usd(a.precio)} / día</div>
            <Link className="btn" to={`/auto/${a.id}`}>Ver detalle</Link>
          </div>
        ))}
      </div>
      {!lista.length && <p>No hay vehículos con esos filtros.</p>}
    </Shell>
  )
}
function Detalle({ setSel }) {
  const { id } = useParams(), nav = useNavigate()
  const auto = autos.find(a => a.id === +id)
  const [desde, setDesde] = useState(hoy(1))
  const [hasta, setHasta] = useState(hoy(4))
  const [sede, setSede] = useState(sedes[0])
  const n = dias(desde, hasta)
  return (
    <Shell>
      <h1>{auto.emoji} {auto.nombre}</h1>
      <div className="panel">
        <p>{auto.categoria} · {auto.transmision} · {auto.plazas} plazas · {auto.blindado ? 'Blindado' : 'Sin blindaje'}</p>
        <p>Seguro de cobertura total incluido. Cancelación gratis hasta 24 h antes.</p>
        <label>Recogida<input type="date" value={desde} onChange={e => setDesde(e.target.value)} /></label>
        <label>Devolución<input type="date" value={hasta} onChange={e => setHasta(e.target.value)} /></label>
        <label>Lugar de entrega<select value={sede} onChange={e => setSede(e.target.value)}>{sedes.map(s => <option key={s}>{s}</option>)}</select></label>
        <button onClick={() => n ? (setSel({ auto, desde, hasta, sede }), nav('/resumen')) : alert('La devolución debe ser posterior a la recogida')}>Continuar a resumen</button>
      </div>
    </Shell>
  )
}

// ---------- Resumen con exención fiscal (HU-04, HU-05) ----------
function Resumen({ sel, reservas, setReservas }) {
  const nav = useNavigate()
  if (!sel) return <Navigate to="/catalogo" />
  const n = dias(sel.desde, sel.hasta)
  const sub = sel.auto.precio * n
  const iva = Math.round(sub * IVA)
  const confirmar = () => {
    const r = { codigo: 'RD-' + Math.floor(1000 + Math.random() * 9000), auto: sel.auto.nombre, desde: sel.desde, hasta: sel.hasta, total: sub, estado: 'Confirmada' }
    setReservas([r, ...reservas]); nav('/confirmacion/' + r.codigo)
  }
  return (
    <Shell>
      <h1>Resumen de reserva</h1>
      <div className="panel">
        <div className="fila"><span>Vehículo</span><b>{sel.auto.nombre}</b></div>
        <div className="fila"><span>Fechas</span><b>{sel.desde} → {sel.hasta} ({n} días)</b></div>
        <div className="fila"><span>Entrega</span><b>{sel.sede}</b></div>
        <div className="fila"><span>Subtotal</span><b>{usd(sub)}</b></div>
        <div className="fila"><span>IVA ({IVA * 100}%)</span><b>{usd(iva)}</b></div>
        <div className="fila ok"><span>Exención diplomática</span><b>− {usd(iva)}</b></div>
        <div className="fila total"><span>Total a pagar</span><span>{usd(sub)}</span></div>
        <br /><button onClick={confirmar}>Confirmar reserva</button>
      </div>
    </Shell>
  )
}
function Confirmacion() {
  const { codigo } = useParams()
  return (
    <Shell>
      <div className="panel">
        <h1>✅ ¡Reserva confirmada!</h1>
        <p>Tu código de reserva es:</p>
        <p className="total">{codigo}</p>
        <Link className="btn" to="/reservas">Ver mis reservas</Link>
      </div>
    </Shell>
  )
}

// ---------- Historial (HU-06, HU-07) y emergencia (HU-10) ----------
function Reservas({ reservas, setReservas }) {
  const cancelar = c => setReservas(reservas.map(r => r.codigo === c ? { ...r, estado: 'Cancelada' } : r))
  return (
    <Shell>
      <h1>Mis reservas</h1>
      {!reservas.length && <p>Aún no tienes reservas.</p>}
      {reservas.map(r => (
        <div className="card" key={r.codigo} style={{ marginBottom: '1rem' }}>
          <strong>{r.codigo} · {r.auto}</strong>
          <span>{r.desde} → {r.hasta} · {usd(r.total)}</span>
          <span className={r.estado === 'Confirmada' ? 'ok' : ''}>{r.estado}</span>
          {r.estado === 'Confirmada' && <button onClick={() => cancelar(r.codigo)}>Cancelar reserva</button>}
        </div>
      ))}
    </Shell>
  )
}
function Emergencia() {
  const [enviado, setEnviado] = useState(false)
  return (
    <Shell>
      <h1>Emergencia</h1>
      <button className="sosbtn" onClick={() => setEnviado(true)}>🚨 Solicitar ayuda inmediata</button>
      {enviado && <p className="ok">Ubicación y datos del vehículo enviados al centro de soporte. Contactando a la misión...</p>}
    </Shell>
  )
}

// ---------- App: rutas y estado compartido ----------
export default function App() {
  const [sel, setSel] = useState(null)
  const [reservas, setReservas] = useState([])
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/2fa" element={<Dos2FA />} />
        <Route path="/catalogo" element={<Catalogo />} />
        <Route path="/auto/:id" element={<Detalle setSel={setSel} />} />
        <Route path="/resumen" element={<Resumen sel={sel} reservas={reservas} setReservas={setReservas} />} />
        <Route path="/confirmacion/:codigo" element={<Confirmacion />} />
        <Route path="/reservas" element={<Reservas reservas={reservas} setReservas={setReservas} />} />
        <Route path="/emergencia" element={<Emergencia />} />
      </Routes>
    </HashRouter>
  )
}
