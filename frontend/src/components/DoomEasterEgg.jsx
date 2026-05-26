import React, { useEffect, useState } from 'react';
import { X, Maximize } from 'lucide-react';

export default function DoomEasterEgg({ onClose }) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Esc to close
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.95)',
      zIndex: 99999,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      animation: 'fadeIn 1s ease'
    }}>
      <div style={{ position: 'absolute', top: '2rem', right: '2rem', display: 'flex', gap: '1rem' }}>
        <button 
          onClick={onClose}
          style={{ background: 'rgba(239,68,68,0.2)', color: '#ef4444', border: '1px solid #ef4444', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}
        >
          <X size={18} /> ESC
        </button>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ color: '#ef4444', fontFamily: 'monospace', fontSize: '3rem', margin: 0, textShadow: '0 0 10px #ef4444', letterSpacing: '2px' }}>
          IDDQD
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace', margin: '0.5rem 0' }}>Has activado un secreto de desarrollo. Rip and tear!</p>
      </div>

      <div style={{ width: '80%', maxWidth: '900px', height: '600px', backgroundColor: '#000', border: '2px solid #ef4444', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 0 30px rgba(239,68,68,0.3)', position: 'relative' }}>
        {loading && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#ef4444', fontFamily: 'monospace', fontSize: '1.2rem' }}>
            Iniciando MS-DOS...
          </div>
        )}
        <iframe
          src="https://dos.zone/player/?bundleUrl=https%3A%2F%2Fcdn.dos.zone%2Foriginal%2F2X%2F8%2F8a1ef96b6fbfaea0079685ed1b24bf4c861215b2.jsdos?anon=1"
          style={{ width: '100%', height: '100%', border: 'none', position: 'relative', zIndex: 10 }}
          onLoad={() => setLoading(false)}
          title="Doom 93"
        />
      </div>
    </div>
  );
}
