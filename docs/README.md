# e-Auction Jabodetabek

Platform lelang online modern untuk wilayah Jakarta, Bogor, Depok, Tangerang, dan Bekasi. Aplikasi web yang dibangun dengan React, Express.js, dan SQLite untuk sistem lelang yang aman dan mudah digunakan.

## 📋 Daftar Isi

- [Fitur Utama](#fitur-utama)
- [Teknologi yang Digunakan](#teknologi-yang-digunakan)
- [Persyaratan Sistem](#persyaratan-sistem)
- [Instalasi](#instalasi)
- [Penggunaan](#penggunaan)
- [Struktur Database](#struktur-database)
- [API Endpoints](#api-endpoints)
- [Panduan Pengembangan](#panduan-pengembangan)
- [Troubleshooting](#troubleshooting)

## 🚀 Fitur Utama

### Untuk Pengguna
- **Registrasi dan Login**: Sistem autentikasi aman dengan session management
- **Jelajahi Lelang**: Browse lelang aktif dengan filter kategori dan pencarian
- **Penawaran Real-time**: Sistem bidding dengan validasi harga minimum
- **Dashboard Pribadi**: Kelola penawaran aktif, riwayat, dan watchlist
- **Watchlist**: Simpan lelang favorit untuk diikuti
- **Profil Pengguna**: Kelola informasi pribadi dan rating

### Untuk Admin
- **Panel Admin**: Interface khusus untuk mengelola sistem
- **Kelola Lelang**: Buat, edit, dan hapus lelang
- **Manajemen Pengguna**: Kontrol akses dan status pengguna
- **Laporan**: Statistik lelang dan transaksi
- **Kategori**: Kelola kategori produk lelang

### Fitur Teknis
- **Real-time Updates**: Pembaruan otomatis status lelang dan penawaran
- **Countdown Timer**: Timer otomatis untuk waktu berakhir lelang
- **Responsive Design**: Optimal untuk desktop dan mobile
- **Data Persisten**: Penyimpanan lokal dengan SQLite
- **Keamanan**: Hashing password dan session management

## 🛠 Teknologi yang Digunakan

### Frontend
- **React 18** - Library UI modern
- **TypeScript** - Type safety dan developer experience
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Komponen UI yang accessible
- **Wouter** - Lightweight client-side routing
- **TanStack React Query** - Server state management
- **React Hook Form** - Form handling dan validasi
- **Zod** - Schema validation
- **Vite** - Build tool yang cepat

### Backend
- **Express.js** - Web framework untuk Node.js
- **TypeScript** - Full-stack type safety
- **Drizzle ORM** - Type-safe database ORM
- **SQLite** - Embedded database
- **Passport.js** - Authentication middleware
- **Better SQLite3** - SQLite driver untuk Node.js

### Development Tools
- **ESBuild** - Fast bundling
- **PostCSS** - CSS processing
- **Drizzle Kit** - Database schema management

## 📋 Persyaratan Sistem

- **Node.js** 18.0 atau lebih baru
- **npm** 8.0 atau lebih baru
- **Git** untuk cloning repository
- **Browser modern** (Chrome, Firefox, Safari, Edge)

## 🔧 Instalasi

### 1. Clone Repository

```bash[
git clone https://github.com/RizqOsman/eauction-jabodetabek.git
cd eauction-jabodetabek
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Database

Database SQLite akan dibuat otomatis saat pertama kali menjalankan aplikasi. File database akan tersimpan sebagai `auction.db` di root directory.

### 4. Jalankan Aplikasi

```bash
npm run dev
```

Aplikasi akan berjalan di:
- **Frontend**: http://localhost:5000
- **Backend API**: http://localhost:5000/api

### 5. Setup Initial Data

Saat pertama kali dijalankan, aplikasi akan otomatis membuat:
- Tabel database yang diperlukan
- Kategori default (Elektronik, Kendaraan, Rumah & Taman, Fashion, Hobi & Koleksi, Olahraga)

## 📱 Penggunaan

### Untuk Pengguna Baru

1. **Registrasi Akun**
   - Klik "Daftar" di halaman login
   - Isi form registrasi dengan data lengkap
   - Login dengan akun yang telah dibuat

2. **Jelajahi Lelang**
   - Browse lelang aktif di halaman utama
   - Gunakan filter kategori untuk mempersempit pencarian
   - Klik pada lelang untuk melihat detail

3. **Melakukan Penawaran**
   - Pada halaman detail lelang, masukkan jumlah penawaran
   - Pastikan penawaran memenuhi minimum increment
   - Konfirmasi penawaran

4. **Mengelola Akun**
   - Akses dashboard untuk melihat penawaran aktif
   - Cek riwayat lelang yang diikuti
   - Kelola watchlist lelang favorit

### Untuk Admin

1. **Akses Panel Admin**
   - Login dengan akun admin
   - Akses panel admin dari menu navigasi

2. **Kelola Lelang**
   - Tambah lelang baru dengan form yang disediakan
   - Edit atau hapus lelang existing
   - Monitor status lelang aktif

3. **Manajemen Pengguna**
   - Lihat daftar pengguna terdaftar
   - Kelola status aktif/non-aktif pengguna
   - Monitor aktivitas pengguna

## 🗄 Struktur Database

### Tabel Users
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'user',
  is_active INTEGER NOT NULL DEFAULT 1,
  rating REAL DEFAULT 0.00,
  created_at INTEGER NOT NULL
);
```

### Tabel Categories
```sql
CREATE TABLE categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL
);
```

### Tabel Auctions
```sql
CREATE TABLE auctions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  starting_price REAL NOT NULL,
  current_price REAL NOT NULL,
  minimum_increment REAL NOT NULL DEFAULT 50000,
  condition TEXT NOT NULL,
  location TEXT NOT NULL,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  start_time INTEGER NOT NULL,
  end_time INTEGER NOT NULL,
  category_id INTEGER NOT NULL REFERENCES categories(id),
  winner_id INTEGER REFERENCES users(id),
  created_at INTEGER NOT NULL
);
```

### Tabel Bids
```sql
CREATE TABLE bids (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  amount REAL NOT NULL,
  bidder_id INTEGER NOT NULL REFERENCES users(id),
  auction_id INTEGER NOT NULL REFERENCES auctions(id),
  created_at INTEGER NOT NULL
);
```

### Tabel Watchlist
```sql
CREATE TABLE watchlist (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  auction_id INTEGER NOT NULL REFERENCES auctions(id),
  created_at INTEGER NOT NULL
);
```

## 🔌 API Endpoints

### Authentication
- `POST /api/register` - Registrasi pengguna baru
- `POST /api/login` - Login pengguna
- `POST /api/logout` - Logout pengguna
- `GET /api/user` - Get user profile

### Auctions
- `GET /api/auctions` - Get semua lelang
- `GET /api/auctions/:id` - Get detail lelang
- `POST /api/auctions` - Buat lelang baru (admin)
- `PUT /api/auctions/:id` - Update lelang (admin)
- `DELETE /api/auctions/:id` - Hapus lelang (admin)

### Bids
- `GET /api/auctions/:id/bids` - Get penawaran untuk lelang
- `POST /api/auctions/:id/bids` - Buat penawaran baru
- `GET /api/users/:id/bids` - Get penawaran pengguna

### Categories
- `GET /api/categories` - Get semua kategori
- `POST /api/categories` - Buat kategori baru (admin)

### Watchlist
- `GET /api/users/:id/watchlist` - Get watchlist pengguna
- `POST /api/users/:id/watchlist` - Tambah ke watchlist
- `DELETE /api/users/:id/watchlist/:auctionId` - Hapus dari watchlist

## 👨‍💻 Panduan Pengembangan

### Setup Development Environment

1. **Clone dan Install**
```bash
git clone <repository-url>
cd e-auction-jabodetabek
npm install
```

2. **Jalankan Development Server**
```bash
npm run dev
```

3. **Build untuk Production**
```bash
npm run build
```

### Struktur Proyek

```
e-auction-jabodetabek/
├── client/                 # Frontend React app
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   └── lib/           # Utility functions
├── server/                # Backend Express app
│   ├── routes.ts         # API route definitions
│   ├── storage.ts        # Database layer
│   ├── auth.ts           # Authentication logic
│   └── db.ts             # Database configuration
├── shared/               # Shared types and schemas
│   └── schema.ts         # Database schema definitions
├── auction.db           # SQLite database file
└── README.md            # This file
```

### Code Style Guidelines

- **TypeScript**: Strict mode enabled untuk type safety
- **ESLint**: Linting rules untuk konsistensi code
- **Prettier**: Code formatting otomatis
- **Conventional Commits**: Format commit message yang konsisten

### Testing

```bash
# Jalankan tests
npm test

# Test coverage
npm run test:coverage
```

## 🔧 Troubleshooting

### Masalah Umum

#### 1. Database Error
**Gejala**: Error saat start aplikasi terkait database
**Solusi**:
```bash
# Hapus database lama dan restart
rm auction.db
npm run dev
```

#### 2. Port Sudah Digunakan
**Gejala**: Error "Port 5000 already in use"
**Solusi**:
```bash
# Kill process di port 5000
lsof -ti:5000 | xargs kill -9
npm run dev
```

#### 3. Dependencies Error
**Gejala**: Error saat install packages
**Solusi**:
```bash
# Clear cache dan reinstall
rm -rf node_modules package-lock.json
npm install
```

#### 4. Build Error
**Gejala**: Error saat build untuk production
**Solusi**:
```bash
# Clean build dan rebuild
rm -rf dist
npm run build
```

### Environment Variables

Aplikasi menggunakan environment variables berikut:
- `NODE_ENV`: Environment mode (development/production)
- `SESSION_SECRET`: Secret key untuk session (auto-generated)

### Performance Tips

1. **Database**: SQLite optimal untuk development, pertimbangkan PostgreSQL untuk production
2. **Images**: Compress images sebelum upload
3. **Caching**: Implementasi Redis untuk session storage di production
4. **Monitoring**: Setup logging dan monitoring untuk production

## 📞 Support

Untuk bantuan atau pertanyaan:
1. Buka issue di repository GitHub
2. Periksa dokumentasi API
3. Review troubleshooting guide di atas

## 📄 License

Project ini menggunakan MIT License. Lihat file LICENSE untuk detail lengkap.

## 🙏 Contributing

Kontribusi sangat diterima! Silakan:
1. Fork repository
2. Buat feature branch
3. Commit perubahan
4. Push ke branch
5. Buat Pull Request

---

**e-Auction Jabodetabek** - Platform lelang online terpercaya untuk wilayah Jabodetabek
