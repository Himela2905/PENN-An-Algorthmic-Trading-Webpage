'use client';

import { useEffect, useRef, useState } from 'react';

interface SearchResult {
  symbol:   string;
  name:     string;
  exchange: string;
}

interface Props {
  value:          string;
  onChange:       (symbol: string) => void;
  placeholder?:   string;
  inputClassName?: string;
  inputStyle?:    React.CSSProperties;
}

export default function SymbolSearchInput({
  value,
  onChange,
  placeholder    = 'Search company or symbol...',
  inputClassName = '',
  inputStyle     = {},
}: Props) {
  const [query,    setQuery]    = useState(value);
  const [results,  setResults]  = useState<SearchResult[]>([]);
  const [open,     setOpen]     = useState(false);
  const [loading,  setLoading]  = useState(false);
  const debounce   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const container  = useRef<HTMLDivElement>(null);

  // keep local query in sync if parent resets value
  useEffect(() => { setQuery(value); }, [value]);

  // debounced search — waits 350ms after typing stops
  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    if (!query || query.length < 2) { setResults([]); return; }

    debounce.current = setTimeout(async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('access_token') ?? '';
        const res   = await fetch(
          `http://localhost:5000/search?q=${encodeURIComponent(query)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data  = await res.json();
        setResults((data.results || []).slice(0, 8));
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => { if (debounce.current) clearTimeout(debounce.current); };
  }, [query]);

  // close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (container.current && !container.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function handleSelect(result: SearchResult) {
    setQuery(result.symbol);
    onChange(result.symbol);
    setOpen(false);
    setResults([]);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setQuery(v);
    onChange(v);  // keep parent in sync for direct symbol typing too
  }

  return (
    <div ref={container} style={{ position: 'relative', width: '100%' }}>
      <input
        type="text"
        value={query}
        onChange={handleChange}
        onFocus={() => results.length > 0 && setOpen(true)}
        placeholder={placeholder}
        className={inputClassName}
        style={inputStyle}
        autoComplete="off"
      />

      {open && (loading || results.length > 0) && (
        <div style={{
          position:    'absolute',
          top:         'calc(100% + 4px)',
          left:        0,
          right:       0,
          zIndex:      50,
          background:  '#0A0E18',
          border:      '1px solid rgba(255,255,255,0.1)',
          borderRadius: 10,
          maxHeight:   260,
          overflowY:   'auto',
          boxShadow:   '0 8px 24px rgba(0,0,0,0.5)',
        }}>
          {loading && (
            <div style={{ padding: '12px 16px', fontSize: 13, color: '#8A93A8' }}>
              Searching...
            </div>
          )}

          {!loading && results.length === 0 && (
            <div style={{ padding: '12px 16px', fontSize: 13, color: '#8A93A8' }}>
              No matches found
            </div>
          )}

          {!loading && results.map((r, i) => (
            <div
              key={`${r.symbol}-${i}`}
              onClick={() => handleSelect(r)}
              style={{
                padding:      '10px 16px',
                cursor:       'pointer',
                display:      'flex',
                justifyContent: 'space-between',
                alignItems:   'center',
                borderBottom: i < results.length - 1
                  ? '1px solid rgba(255,255,255,0.05)'
                  : 'none',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,255,136,0.06)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <div>
                <div style={{ fontSize: 14, color: '#E6EAF2', fontWeight: 600 }}>
                  {r.name}
                </div>
                <div style={{ fontSize: 12, color: '#5A6A8A', fontFamily: 'monospace' }}>
                  {r.symbol}{r.exchange ? ` · ${r.exchange}` : ''}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}