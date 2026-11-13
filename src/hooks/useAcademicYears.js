import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  fetchAcademicYearsApi,
  createAcademicYearApi,
  updateAcademicYearApi,
  setActiveAcademicYearApi,
  deleteAcademicYearApi,
} from '../services/academicYear.service';

/** Hook untuk mengelola state dan operasi CRUD tahun ajaran. */
export function useAcademicYears({ onUnauthorized } = {}) {
  const [academicYears, setAcademicYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAcademicYears = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchAcademicYearsApi();
      setAcademicYears(res.data || []);
    } catch (err) {
      if (err.status === 401 && onUnauthorized) {
        onUnauthorized();
        return;
      }
      setError(err.message || 'Gagal memuat data tahun ajaran.');
    } finally {
      setLoading(false);
    }
  }, [onUnauthorized]);

  useEffect(() => {
    loadAcademicYears();
  }, [loadAcademicYears]);

  const activeAcademicYear = useMemo(
    () => academicYears.find((y) => y.is_active) || academicYears[0] || null,
    [academicYears]
  );

  const uniqueAcademicYears = useMemo(() => {
    const map = new Map();
    for (const ay of academicYears) {
      const existing = map.get(ay.name);
      if (!existing || (!existing.is_active && ay.is_active)) {
        map.set(ay.name, ay);
      }
    }
    return Array.from(map.values());
  }, [academicYears]);

  const createAcademicYear = async (payload) => {
    const res = await createAcademicYearApi(payload);
    await loadAcademicYears();
    return res;
  };

  const updateAcademicYear = async (id, payload) => {
    const res = await updateAcademicYearApi(id, payload);
    await loadAcademicYears();
    return res;
  };

  const setActiveAcademicYear = async (id) => {
    const res = await setActiveAcademicYearApi(id);
    await loadAcademicYears();
    return res;
  };

  const deleteAcademicYear = async (id) => {
    const res = await deleteAcademicYearApi(id);
    await loadAcademicYears();
    return res;
  };

  return {
    academicYears,
    uniqueAcademicYears,
    activeAcademicYear,
    loading,
    error,
    reload: loadAcademicYears,
    createAcademicYear,
    updateAcademicYear,
    setActiveAcademicYear,
    deleteAcademicYear,
  };
}
