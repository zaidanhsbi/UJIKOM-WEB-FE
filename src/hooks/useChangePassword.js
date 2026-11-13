import { useState } from 'react';
import { changeAdminPasswordApi } from '../services/setting.service';

/** Hook untuk mengelola proses ubah kata sandi pengguna. */
export function useChangePassword() {
  const [form, setForm] = useState({
    current_password: '',
    new_password: '',
    new_password_confirmation: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError('');
    setSuccess('');
  };

  const submitPassword = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setSuccess('');

    if (form.new_password.length < 8) {
      setError('Password baru minimal 8 karakter.');
      return;
    }
    if (form.new_password !== form.new_password_confirmation) {
      setError('Konfirmasi password baru tidak cocok.');
      return;
    }

    setSaving(true);
    try {
      const res = await changeAdminPasswordApi(form);
      setSuccess(res.message || 'Password berhasil diperbarui.');
      setForm({
        current_password: '',
        new_password: '',
        new_password_confirmation: '',
      });
    } catch (err) {
      setError(err.message || 'Gagal mengganti password.');
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
    saving,
    error,
    success,
    updateField,
    submitPassword,
    clearAlert,
  };
}
