import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AuctionWithDetails, Category } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import Navbar from "@/components/navbar";
import AuctionCard from "@/components/auction-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Gavel, Filter, SlidersHorizontal, Grid, List } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AuctionsPage() {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedCondition, setSelectedCondition] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const { data: auctions = [], isLoading: auctionsLoading } = useQuery<AuctionWithDetails[]>({
    queryKey: ["/api/auctions"],
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // Filter auctions
  const filteredAuctions = auctions.filter(auction => {
    const matchesCategory = selectedCategory === "all" || auction.categoryId === parseInt(selectedCategory);
    const matchesLocation = selectedLocation === "all" || auction.location.toLowerCase().includes(selectedLocation.toLowerCase());
    const matchesStatus = selectedStatus === "all" || auction.status === selectedStatus;
    const matchesCondition = selectedCondition === "all" || auction.condition === selectedCondition;
    const matchesSearch = !searchQuery ||
      auction.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      auction.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesLocation && matchesStatus && matchesCondition && matchesSearch;
  });

  // Sort auctions
  const sortedAuctions = [...filteredAuctions].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
      case "oldest":
        return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
      case "price-high":
        return b.currentPrice - a.currentPrice;
      case "price-low":
        return a.currentPrice - b.currentPrice;
      case "ending-soon":
        return new Date(a.endTime).getTime() - new Date(b.endTime).getTime();
      case "most-bids":
        const aBidCount = a._count?.bids || a.bids?.length || 0;
        const bBidCount = b._count?.bids || b.bids?.length || 0;
        return bBidCount - aBidCount;
      default:
        return 0;
    }
  });

  // Statistics
  const activeAuctions = auctions.filter(auction => {
    const now = new Date();
    const endTime = new Date(auction.endTime);
    return auction.status === "active" && endTime > now && !auction.archived;
  });

  const locations = Array.from(new Set(auctions.map(auction => auction.location)));

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Header Section */}
      <section className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Semua Lelang</h1>
            <p className="text-lg text-gray-600 mb-6">
              Temukan berbagai produk berkualitas dalam lelang online terpercaya
            </p>

            {/* Statistics */}
            <div className="flex justify-center space-x-8 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">{auctions.length}</div>
                <div className="text-sm text-gray-500">Total Lelang</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{activeAuctions.length}</div>
                <div className="text-sm text-gray-500">Sedang Aktif</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{categories.length}</div>
                <div className="text-sm text-gray-500">Kategori</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Search and Filters */}
      <section className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Cari produk, merk, atau deskripsi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-3 text-lg"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-4">
              {/* Category Filter */}
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Pilih Kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kategori</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Location Filter */}
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Pilih Lokasi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Lokasi</SelectItem>
                  {locations.map((location) => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Status Filter */}
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Status Lelang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="ended">Berakhir</SelectItem>
                </SelectContent>
              </Select>

              {/* Condition Filter */}
              <Select value={selectedCondition} onValueChange={setSelectedCondition}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Kondisi Barang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kondisi</SelectItem>
                  <SelectItem value="new">Baru</SelectItem>
                  <SelectItem value="like_new">Seperti Baru</SelectItem>
                  <SelectItem value="good">Baik</SelectItem>
                  <SelectItem value="fair">Cukup Baik</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-4">
              {/* Sort */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Urutkan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Terbaru</SelectItem>
                  <SelectItem value="oldest">Terlama</SelectItem>
                  <SelectItem value="price-high">Harga Tertinggi</SelectItem>
                  <SelectItem value="price-low">Harga Terendah</SelectItem>
                  <SelectItem value="ending-soon">Berakhir Segera</SelectItem>
                  <SelectItem value="most-bids">Paling Populer</SelectItem>
                </SelectContent>
              </Select>

              {/* View Mode */}
              <div className="flex border rounded-lg overflow-hidden">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="rounded-none"
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="rounded-none"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Active Filters */}
          {(selectedCategory !== "all" || selectedLocation !== "all" || selectedStatus !== "all" || selectedCondition !== "all" || searchQuery) && (
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-sm text-gray-500">Filter aktif:</span>
              {selectedCategory !== "all" && (
                <Badge variant="secondary" className="text-xs">
                  Kategori: {categories.find(c => c.id.toString() === selectedCategory)?.name}
                  <button
                    onClick={() => setSelectedCategory("all")}
                    className="ml-2 text-gray-500 hover:text-gray-700"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {selectedLocation !== "all" && (
                <Badge variant="secondary" className="text-xs">
                  Lokasi: {selectedLocation}
                  <button
                    onClick={() => setSelectedLocation("all")}
                    className="ml-2 text-gray-500 hover:text-gray-700"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {selectedStatus !== "all" && (
                <Badge variant="secondary" className="text-xs">
                  Status: {selectedStatus}
                  <button
                    onClick={() => setSelectedStatus("all")}
                    className="ml-2 text-gray-500 hover:text-gray-700"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {selectedCondition !== "all" && (
                <Badge variant="secondary" className="text-xs">
                  Kondisi: {selectedCondition}
                  <button
                    onClick={() => setSelectedCondition("all")}
                    className="ml-2 text-gray-500 hover:text-gray-700"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {searchQuery && (
                <Badge variant="secondary" className="text-xs">
                  Pencarian: "{searchQuery}"
                  <button
                    onClick={() => setSearchQuery("")}
                    className="ml-2 text-gray-500 hover:text-gray-700"
                  >
                    ×
                  </button>
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedCategory("all");
                  setSelectedLocation("all");
                  setSelectedStatus("all");
                  setSelectedCondition("all");
                  setSearchQuery("");
                }}
                className="text-xs h-6"
              >
                Hapus Semua
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Results */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Results Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {sortedAuctions.length} Lelang Ditemukan
              </h2>
              <p className="text-sm text-gray-600">
                {searchQuery && `Hasil pencarian untuk "${searchQuery}"`}
              </p>
            </div>
          </div>

          {/* Loading State */}
          {auctionsLoading ? (
            <div className={`grid ${viewMode === "grid"
              ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              : "grid-cols-1"} gap-6`}>
              {[...Array(8)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="aspect-square bg-gray-200 rounded-lg mb-4"></div>
                    <div className="space-y-3">
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-8 bg-gray-200 rounded"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : sortedAuctions.length === 0 ? (
            <div className="text-center py-12">
              <Gavel className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada lelang ditemukan</h3>
              <p className="text-gray-600 mb-6">
                Coba ubah filter atau kata kunci pencarian Anda.
              </p>
              <Button
                onClick={() => {
                  setSelectedCategory("all");
                  setSelectedLocation("all");
                  setSelectedStatus("all");
                  setSelectedCondition("all");
                  setSearchQuery("");
                }}
              >
                Reset Filter
              </Button>
            </div>
          ) : (
            <div className={`grid ${viewMode === "grid"
              ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              : "grid-cols-1"} gap-6`}>
              {sortedAuctions.map((auction) => (
                <AuctionCard
                  key={auction.id}
                  auction={auction}
                  viewMode={viewMode}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
