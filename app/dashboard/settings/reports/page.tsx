'use client';

import { useState, useEffect } from 'react';
import { API_BASE_URL, getClientToken } from '@/lib/config';
import {
  REPORT_FIELD_CATALOG,
  REPORT_FIELD_DEFAULTS,
  REPORT_TYPE_LABELS,
  REPORT_COLOR_PRESETS,
  REPORT_ORIENTATIONS,
  REPORT_DENSITIES,
  REPORT_BORDER_STYLES,
} from '@/lib/reportDesign';

const REPORT_TYPES = Object.keys(REPORT_FIELD_CATALOG);

export default function ReportDesignerPage() {
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState(REPORT_TYPES[0]);
  const [fieldsByType, setFieldsByType] = useState<Record<string, string[]>>({});
  const [headerColor, setHeaderColor] = useState('E0E0E0');
  const [accentColor, setAccentColor] = useState('0D9488');
  const [density, setDensity] = useState('normal');
  const [borderStyle, setBorderStyle] = useState('bordered');
  const [orientation, setOrientation] = useState('portrait');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      const token = getClientToken();
      const res = await fetch(`${API_BASE_URL}/settings/company`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        const merged: Record<string, string[]> = {};
        for (const type of REPORT_TYPES) {
          merged[type] = data.reportFieldsJson?.[type]?.length ? data.reportFieldsJson[type] : REPORT_FIELD_DEFAULTS[type];
        }
        setFieldsByType(merged);
        setHeaderColor(data.reportHeaderColor || 'E0E0E0');
        setAccentColor(data.reportAccentColor || '0D9488');
        setDensity(data.reportDensity || 'normal');
        setBorderStyle(data.reportBorderStyle || 'bordered');
        setOrientation(data.reportOrientation || 'portrait');
      }
      setLoading(false);
    };
    load();
  }, []);

  const toggleField = (key: string) => {
    const current = fieldsByType[selectedType] || [];
    const catalogOrder = REPORT_FIELD_CATALOG[selectedType].map((f) => f.key);
    const next = current.includes(key)
      ? current.filter((k) => k !== key)
      : catalogOrder.filter((k) => current.includes(k) || k === key);
    setFieldsByType({ ...fieldsByType, [selectedType]: next });
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    setError('');
    const token = getClientToken();
    const res = await fetch(`${API_BASE_URL}/settings/company`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        reportFieldsJson: fieldsByType,
        reportHeaderColor: headerColor,
        reportAccentColor: accentColor,
        reportDensity: density,
        reportBorderStyle: borderStyle,
        reportOrientation: orientation,
      }),
    });
    if (res.ok) {
      setSaved(true);
    } else {
      setError('Failed to save Report Designer settings.');
    }
    setSaving(false);
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;

  const catalog = REPORT_FIELD_CATALOG[selectedType];
  const visible = new Set(fieldsByType[selectedType] || []);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-800">Report Designer</h1>
        <p className="text-sm text-gray-500 mt-1">Choose which columns each report shows, and the color/density/layout used across every printed report.</p>
      </div>

      {saved && <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded-md"><p className="text-sm text-purple-700 font-medium">Report Designer settings saved.</p></div>}
      {error && <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md"><p className="text-sm text-red-700 font-medium">{error}</p></div>}

      {/* COLUMN VISIBILITY */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-bold text-gray-800">Columns</h2>
        </div>
        <div className="p-6 space-y-4">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="border border-gray-300 rounded-md px-4 py-2.5 text-black bg-white font-bold"
          >
            {REPORT_TYPES.map((t) => <option key={t} value={t}>{REPORT_TYPE_LABELS[t]}</option>)}
          </select>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {catalog.map((f) => (
              <label key={f.key} className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                <input type="checkbox" checked={visible.has(f.key)} onChange={() => toggleField(f.key)} className="w-4 h-4" />
                {f.label}
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* STYLING */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-bold text-gray-800">Style</h2>
        </div>
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Header Color</label>
            <div className="flex gap-2 flex-wrap">
              {Object.entries(REPORT_COLOR_PRESETS).map(([name, hex]) => (
                <button
                  key={name}
                  type="button"
                  title={name}
                  onClick={() => setHeaderColor(hex)}
                  className={`w-9 h-9 rounded-full border-2 ${headerColor === hex ? 'border-gray-900' : 'border-gray-200'}`}
                  style={{ backgroundColor: `#${hex}` }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Accent Color</label>
            <div className="flex gap-2 flex-wrap">
              {Object.entries(REPORT_COLOR_PRESETS).map(([name, hex]) => (
                <button
                  key={name}
                  type="button"
                  title={name}
                  onClick={() => setAccentColor(hex)}
                  className={`w-9 h-9 rounded-full border-2 ${accentColor === hex ? 'border-gray-900' : 'border-gray-200'}`}
                  style={{ backgroundColor: `#${hex}` }}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Density</label>
              <div className="space-y-1.5">
                {REPORT_DENSITIES.map((d) => (
                  <label key={d} className="flex items-center gap-2 text-sm text-gray-700 capitalize">
                    <input type="radio" name="density" checked={density === d} onChange={() => setDensity(d)} />
                    {d}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Border Style</label>
              <div className="space-y-1.5">
                {REPORT_BORDER_STYLES.map((b) => (
                  <label key={b} className="flex items-center gap-2 text-sm text-gray-700 capitalize">
                    <input type="radio" name="borderStyle" checked={borderStyle === b} onChange={() => setBorderStyle(b)} />
                    {b}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Orientation</label>
              <div className="space-y-1.5">
                {REPORT_ORIENTATIONS.map((o) => (
                  <label key={o} className="flex items-center gap-2 text-sm text-gray-700 capitalize">
                    <input type="radio" name="orientation" checked={orientation === o} onChange={() => setOrientation(o)} />
                    {o}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-gray-900 hover:bg-black text-white font-bold py-4 px-4 rounded-md disabled:bg-gray-400"
      >
        {saving ? 'Saving...' : 'Save Report Designer Settings'}
      </button>
    </div>
  );
}
