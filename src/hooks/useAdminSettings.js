import { useState, useEffect, useCallback } from 'react';
import {
  getAdminSettingsApi,
  updateAdminSettingsApi,
} from '../services/setting.service';

/** Hook untuk mengambil dan memperbarui pengaturan aplikasi Admin. */
export function useAdminSettings() {
  const [form, setForm] = useState({
    school_name: '',
    npsn: '',
    active_academic_year: '2026/2027',
    active_semester: 'Ganjil',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getAdminSettingsApi();
      setForm({
        school_name: data.school_name || '',
        npsn: data.npsn || '',
        active_academic_year: data.active_academic_year || '2026/2027',
        active_semester: data.active_semester || 'Ganjil',
      });
    } catch (err) {
      setError(err.message || 'Gagal memuat pengaturan sekolah.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError('');
    setSuccess('');
  };

  const saveSettings = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await updateAdminSettingsApi(form);
      setSuccess(res.message || 'Pengaturan sekolah berhasil diperbarui.');
    } catch (err) {
      setError(err.message || 'Gagal menyimpan pengaturan.');
    } finally {
      setSaving(false);
    }
  };

  const clearAlert = () => {
    setError('');
    setSuccess('');
  };

  return {
    form,
    loading,
    saving,
    error,
    success,
    updateField,
    saveSettings,
    clearAlert,
  };
}
