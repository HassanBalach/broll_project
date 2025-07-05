import { login, signup } from './actions'

export default function LoginPage() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f5f6fa'
    }}>
      <form style={{
        background: '#fff',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        minWidth: '320px',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <h2 style={{ textAlign: 'center', margin: 0 }}>Login</h2>
        <label htmlFor="email" style={{ fontWeight: 500 }}>Email:</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          style={{
            padding: '0.5rem',
            borderRadius: '4px',
            border: '1px solid #ccc'
          }}
        />
        <label htmlFor="password" style={{ fontWeight: 500 }}>Password:</label>
        <input
          id="password"
          name="password"
          type="password"
          required
          style={{
            padding: '0.5rem',
            borderRadius: '4px',
            border: '1px solid #ccc'
          }}
        />
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <button
            type="submit"
            formAction={login}
            style={{
              flex: 1,
              padding: '0.75rem',
              borderRadius: '4px',
              border: 'none',
              background: '#4f8cff',
              color: '#fff',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Log in
          </button>
          <button
            type="submit"
            formAction={signup}
            style={{
              flex: 1,
              padding: '0.75rem',
              borderRadius: '4px',
              border: 'none',
              background: '#eee',
              color: '#333',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Sign up
          </button>
        </div>
      </form>
    </div>
  )
}