import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
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

  // Featured auctions: hanya tampilkan produk yang aktif dan masih berjalan
  const featuredAuctions = auctionsToDisplay.filter(auction => {
    const now = new Date();
    const endTime = new Date(auction.endTime);

    // Kondisi untuk featured: status aktif, belum berakhir, dan belum diarsipkan
    return auction.status === "active" &&
      endTime > now &&
      !auction.archived;
  })
    .sort((a, b) => {
      // Prioritaskan berdasarkan jumlah bid (popularitas)
      const aBidCount = a._count?.bids || a.bids?.length || 0;
      const bBidCount = b._count?.bids || b.bids?.length || 0;

      if (aBidCount !== bBidCount) {
        return bBidCount - aBidCount; // Lebih banyak bid = lebih prioritas
      }

      // Jika jumlah bid sama, prioritaskan yang lebih baru dibuat
      const aStartTime = new Date(a.startTime).getTime();
      const bStartTime = new Date(b.startTime).getTime();
      return bStartTime - aStartTime; // Lebih baru = lebih prioritas
    })
    .slice(0, 4); // Ambil maksimal 4 produk featured untuk beranda

  // Filter for search on featured auctions
  const filteredFeaturedAuctions = featuredAuctions.filter(auction => {
    if (!searchQuery) return true;
    return auction.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      auction.description.toLowerCase().includes(searchQuery.toLowerCase());
  });

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
                    {featuredAuctions.length > 0 ? (
                      <Card className="bg-white shadow-lg">
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-3 mb-3">
                            <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden">
                              {featuredAuctions[0].imageUrls.length > 0 ? (
                                <img
                                  src={featuredAuctions[0].imageUrls[0]}
                                  alt={featuredAuctions[0].title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                                  <Gavel className="w-6 h-6 text-gray-500" />
                                </div>
                              )}
                            </div>
                            <div>
                              <h4 className="text-gray-900 font-semibold line-clamp-1">{featuredAuctions[0].title}</h4>
                              <p className="text-gray-600 text-sm">Kondisi: {
                                featuredAuctions[0].condition === 'new' ? 'Baru' :
                                  featuredAuctions[0].condition === 'like_new' ? 'Seperti Baru' :
                                    featuredAuctions[0].condition === 'good' ? 'Baik' : 'Cukup Baik'
                              }</p>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-gray-600 text-sm">Penawaran Tertinggi</p>
                              <p className="text-2xl font-bold text-primary">
                                Rp {featuredAuctions[0].currentPrice.toLocaleString('id-ID')}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-gray-600 text-sm">Berakhir dalam</p>
                              <p className="text-lg font-bold text-destructive">
                                {(() => {
                                  const now = new Date();
                                  const endTime = new Date(featuredAuctions[0].endTime);
                                  const timeDiff = endTime.getTime() - now.getTime();

                                  if (timeDiff <= 0) return "Berakhir";

                                  const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
                                  const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                                  const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

                                  if (days > 0) return `${days}h ${hours}j`;
                                  if (hours > 0) return `${hours}j ${minutes}m`;
                                  return `${minutes}m`;
                                })()}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      <Card className="bg-white shadow-lg">
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-3 mb-3">
                            <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                              <Gavel className="w-6 h-6 text-gray-500" />
                            </div>
                            <div>
                              <h4 className="text-gray-900 font-semibold">Belum Ada Lelang Aktif</h4>
                              <p className="text-gray-600 text-sm">Nantikan lelang terbaru</p>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-gray-600 text-sm">Status</p>
                              <p className="text-xl font-bold text-gray-500">Menunggu</p>
                            </div>
                            <div className="text-right">
                              <p className="text-gray-600 text-sm">Info</p>
                              <p className="text-sm text-gray-500">Segera Hadir</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                    <div className="text-center">
                      <span className="text-accent font-semibold">
                        🔥 {featuredAuctions.length > 0 ? `${featuredAuctions.length} lelang aktif` : 'Nantikan lelang'} tersedia hari ini
                      </span>
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
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Lelang Aktif Terpopuler</h2>
            <p className="text-lg text-gray-600">Produk berkualitas yang sedang berlangsung dengan penawaran terbaik</p>
            <div className="flex justify-center items-center mt-3">
              <Badge variant="secondary" className="text-green-700 bg-green-100">
                <Zap className="w-4 h-4 mr-1" />
                Sedang Berlangsung
              </Badge>
            </div>
          </div>

          {/* Quick Search */}
          <div className="mb-8">
            <div className="max-w-xl mx-auto">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Cari lelang cepat..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              {searchQuery && (
                <p className="text-sm text-gray-600 mt-2 text-center">
                  Menampilkan hasil untuk "{searchQuery}" -
                  <Link href="/auctions" className="text-primary hover:underline ml-1">
                    Lihat semua hasil
                  </Link>
                </p>
              )}
            </div>
          </div>

          {/* Auction Grid */}
          {isLoadingAuctions ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4].map((i) => (
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
          ) : filteredFeaturedAuctions.length === 0 && !searchQuery ? (
            <div className="text-center py-12">
              <Gavel className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada lelang aktif saat ini</h3>
              <p className="text-gray-600">Belum ada produk yang sedang dilelang. Silakan cek kembali nanti.</p>
            </div>
          ) : filteredFeaturedAuctions.length === 0 && searchQuery ? (
            <div className="text-center py-12">
              <Gavel className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ditemukan hasil untuk "{searchQuery}"</h3>
              <p className="text-gray-600">Coba gunakan kata kunci lain atau lihat semua lelang tersedia.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredFeaturedAuctions.map((auction) => (
                <AuctionCard key={auction.id} auction={auction} />
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Link href="/auctions">
              <Button size="lg" className="bg-accent text-gray-900 hover:bg-yellow-500">
                Lihat Semua Lelang
              </Button>
            </Link>
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