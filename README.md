# BinoExam Dashboard Web (React + Vite)

Frontend dashboard untuk **Admin Sekolah** (kelola tahun ajaran, kelas/rombel, siswa, guru, mapel, pengaturan) dan **Guru** (bank soal, kelola ujian, rekap nilai).

---

## 1. Prerequisites (Yang Harus Di-download)

- **Node.js** (disarankan versi **LTS 20.x** atau **22.x**): https://nodejs.org/
- **npm** (otomatis terpasang bersama Node.js)
- **Git**: https://git-scm.com/downloads

Cek instalasi:
```powershell
node -v
npm -v
```

---

## 2. Langkah-langkah Instalasi

1. Masuk ke folder `dashboard/fe`:
   ```powershell
   cd dashboard/fe
   ```
2. Install seluruh package:
   ```powershell
   npm install
   ```

---

## 3. Konfigurasi

Buat file `.env` di dalam folder `dashboard/fe` (jika belum ada) untuk mengatur alamat API backend:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api
```

> **Catatan:** Setiap perubahan pada file `.env` memerlukan restart server dev (`npm run dev`) atau build ulang (`npm run build`).

---

## 4. Mode Offline (Lokal) vs Online (Produksi)

### A. Mode Offline / Lokal (Development)
1. Pastikan backend Laravel (`dashboard/be`) sudah berjalan di `http://127.0.0.1:8000`.
2. Set `.env` di `dashboard/fe`:
   ```env
   VITE_API_BASE_URL=http://127.0.0.1:8000/api
   ```
   *(Jika diakses dari komputer lain di jaringan LAN sekolah, ganti `127.0.0.1` dengan IP server lokal, misal `http://192.168.1.10:8000/api`.)*
3. Jalankan dev server:
   ```powershell
   npm run dev
   ```

### B. Mode Online / Produksi
1. Ubah `VITE_API_BASE_URL` di `.env` ke domain API produksi:
   ```env
   VITE_API_BASE_URL=https://domainanda/api
   ```
2. Build file statis produksi:
   ```powershell
   npm run build
   ```
3. Hasil build berada di folder `dashboard/fe/dist/` yang siap di-deploy ke Nginx, Apache, Vercel, atau Netlify.
