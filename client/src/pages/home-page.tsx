import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { AuctionWithDetails, Category } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import Navbar from "@/components/navbar";
import AuctionCard from "@/components/auction-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Gavel, Shield, Zap, Users } from "lucide-react";

export default function HomePage() {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedCondition, setSelectedCondition] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: auctions = [], isLoading: auctionsLoading } = useQuery<AuctionWithDetails[]>({
    queryKey: ["/api/auctions"],
  });

  

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // Use all auctions (remove active filter dependency from URL)
  const auctionsToDisplay = auctions;
  const isLoadingAuctions = auctionsLoading;

  const filteredAuctions = auctionsToDisplay.filter(auction => {
    const matchesCategory = selectedCategory === "all" || auction.categoryId === parseInt(selectedCategory);
    const matchesLocation = selectedLocation === "all" || auction.location.toLowerCase().includes(selectedLocation.toLowerCase());
    const matchesStatus = selectedStatus === "all" || auction.status === selectedStatus;
    const matchesCondition = selectedCondition === "all" || auction.condition === selectedCondition;
    const matchesSearch = !searchQuery || 
      auction.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      auction.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesLocation && matchesStatus && matchesCondition && matchesSearch;
  });

  const featuredAuctions = filteredAuctions.slice(0, 6);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero Section */}
      <section className="gradient-bg text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl lg:text-6xl font-bold mb-6">
                Platform Lelang Online
                <span className="text-accent"> Terpercaya</span>
              </h1>
              <p className="text-xl mb-8 text-blue-100">
                Ikuti lelang barang berkualitas di wilayah Jabodetabek. Dapatkan produk terbaik dengan harga terjangkau melalui sistem penawaran yang aman dan transparan.
              </p>
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <Button size="lg" className="bg-accent text-gray-900 hover:bg-yellow-500">
                  Mulai Lelang Sekarang
                </Button>
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-primary">
                  Pelajari Lebih Lanjut
                </Button>
              </div>
            </div>
            <div className="relative">
              <Card className="bg-white/10 backdrop-blur border-white/20">
                <CardContent className="p-8">
                  <div className="space-y-6">
                    <Card className="bg-white shadow-lg">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
                          <div>
                            <h4 className="text-gray-900 font-semibold">iPhone 14 Pro Max</h4>
                            <p className="text-gray-600 text-sm">Kondisi: Sangat Baik</p>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-gray-600 text-sm">Penawaran Tertinggi</p>
                            <p className="text-2xl font-bold text-primary">Rp 12.500.000</p>
                          </div>
                          <div className="text-right">
                            <p className="text-gray-600 text-sm">Berakhir dalam</p>
                            <p className="text-lg font-bold text-destructive">02:14:35</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <div className="text-center">
                      <span className="text-accent font-semibold">🔥 Trending: {filteredAuctions.length} lelang tersedia hari ini</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Auctions */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Lelang Populer</h2>
            <p className="text-lg text-gray-600">Temukan produk berkualitas dengan penawaran terbaik</p>
          </div>

          {/* Search and Comprehensive Filter */}
          <div className="mb-8 space-y-6">
            {/* Search Bar */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Cari lelang..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filter Section */}
            <Card className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Category Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Kategori</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="all">Semua Kategori</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id.toString()}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Location Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Lokasi</label>
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="all">Semua Lokasi</option>
                    <option value="jakarta">Jakarta</option>
                    <option value="bogor">Bogor</option>
                    <option value="depok">Depok</option>
                    <option value="tangerang">Tangerang</option>
                    <option value="bekasi">Bekasi</option>
                  </select>
                </div>

                {/* Status Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="all">Semua Status</option>
                    <option value="active">Aktif</option>
                    <option value="ended">Berakhir</option>
                    <option value="cancelled">Dibatalkan</option>
                  </select>
                </div>

                {/* Condition Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Kondisi</label>
                  <select
                    value={selectedCondition}
                    onChange={(e) => setSelectedCondition(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="all">Semua Kondisi</option>
                    <option value="new">Baru</option>
                    <option value="like_new">Seperti Baru</option>
                    <option value="good">Baik</option>
                    <option value="fair">Cukup</option>
                  </select>
                </div>
              </div>

              {/* Reset Filters Button */}
              <div className="mt-4 flex justify-between items-center">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedCategory("all");
                    setSelectedLocation("all");
                    setSelectedStatus("all");
                    setSelectedCondition("all");
                    setSearchQuery("");
                  }}
                  className="text-sm"
                >
                  Reset Filter
                </Button>
                <div className="text-sm text-gray-600">
                  Menampilkan {filteredAuctions.length} dari {auctionsToDisplay.length} lelang
                </div>
              </div>
            </Card>
          </div>

          {/* Auction Grid */}
          {isLoadingAuctions ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="auction-card animate-pulse">
                  <div className="h-48 bg-gray-200"></div>
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-8 bg-gray-200 rounded"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : featuredAuctions.length === 0 ? (
            <div className="text-center py-12">
              <Gavel className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada lelang ditemukan</h3>
              <p className="text-gray-600">Coba ubah filter atau kata kunci pencarian Anda.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredAuctions.map((auction) => (
                <AuctionCard key={auction.id} auction={auction} />
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Button size="lg" className="bg-accent text-gray-900 hover:bg-yellow-500">
              Lihat Semua Lelang
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Mengapa Memilih e-auction Jabodetabek?</h2>
            <p className="text-lg text-gray-600">Platform lelang online terpercaya dengan fitur lengkap dan keamanan terjamin</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Aman & Terpercaya</h3>
              <p className="text-gray-600">Sistem keamanan berlapis dengan verifikasi identitas dan jaminan transaksi aman</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Real-Time Bidding</h3>
              <p className="text-gray-600">Sistem penawaran real-time yang memungkinkan Anda berpartisipasi langsung dalam lelang</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Dukungan 24/7</h3>
              <p className="text-gray-600">Tim customer service siap membantu Anda kapan saja untuk kelancaran transaksi</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-2xl font-bold mb-4">e-auction</h3>
              <p className="text-gray-400 mb-4">Platform lelang online terpercaya untuk wilayah Jabodetabek</p>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Layanan</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Cara Kerja</li>
                <li>Biaya & Komisi</li>
                <li>Panduan Lelang</li>
                <li>Verifikasi Akun</li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Bantuan</h4>
              <ul className="space-y-2 text-gray-400">
                <li>FAQ</li>
                <li>Kontak Support</li>
                <li>Laporan Masalah</li>
                <li>Kebijakan Privasi</li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Kontak</h4>
              <ul className="space-y-2 text-gray-400">
                <li>📍 Jakarta, Indonesia</li>
                <li>📞 +62 21 1234 5678</li>
                <li>✉️ support@e-auction.id</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-gray-400">
              © 2024 e-auction Jabodetabek. Semua hak cipta dilindungi undang-undang.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}