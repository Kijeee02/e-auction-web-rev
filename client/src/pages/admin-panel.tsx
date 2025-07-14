import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AuctionWithDetails } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Navbar from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Users,
  Gavel,
  CheckCircle,
  DollarSign,
  Plus,
  FileText,
  Edit,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminPanel() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAuction, setNewAuction] = useState({
    title: "",
    startingPrice: "",
    endTime: "",
  });

  // mutation untuk simpan lelang
  const createAuctionMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/auctions", data);
      return await res.json();
    },
    onSuccess: () => {
      setShowAddModal(false);
      setNewAuction({ title: "", startingPrice: "", endTime: "" });
      queryClient.invalidateQueries({ queryKey: ["/api/auctions"] });
      toast({
        title: "Sukses",
        description: "Lelang berhasil ditambahkan",
      });
    },
    onError: () => {
      toast({
        title: "Gagal",
        description: "Gagal menambahkan lelang",
        variant: "destructive",
      });
    },
  });

  // Redirect if not admin
  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600">You need admin privileges to access this page.</p>
          </div>
        </div>
      </div>
    );
  }

  type AdminStats = {
    totalUsers: number;
    completedTransactions: number;
  };

  const { data: adminStats } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
    queryFn: async () => {
      const res = await fetch("/api/admin/stats");
      if (!res.ok) throw new Error("Gagal mengambil statistik admin");
      return await res.json();
    },
  });


  const { data: auctions = [], isLoading } = useQuery<AuctionWithDetails[]>({
    queryKey: ["/api/auctions"],
  });

  const deleteAuctionMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/auctions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auctions"] });
      toast({
        title: "Success",
        description: "Auction deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete auction",
        variant: "destructive",
      });
    },
  });

  const endAuctionMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("POST", `/api/auctions/${id}/end`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auctions"] });
      toast({
        title: "Success",
        description: "Auction ended successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to end auction",
        variant: "destructive",
      });
    },
  });

  const filteredAuctions = auctions.filter(auction => {
    const matchesStatus = statusFilter === "all" || auction.status === statusFilter;
    const matchesSearch = !searchQuery ||
      auction.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      auction.seller.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      auction.seller.lastName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-gray-600 mt-2">Kelola sistem lelang e-auction Jabodetabek</p>
        </div>

        {/* Admin Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Pengguna</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {adminStats?.totalUsers || "1,247"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Gavel className="h-8 w-8 text-accent" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Lelang Aktif</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {auctions.filter(a => a.status === "active").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Transaksi Selesai</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {adminStats?.completedTransactions || "1,892"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Revenue Bulan Ini</p>
                  <p className="text-2xl font-bold text-gray-900">Rp 850jt</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Admin Tabs */}
        <Tabs defaultValue="auctions" className="w-full">
          <Card>
            <CardHeader>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="auctions">Kelola Lelang</TabsTrigger>
                <TabsTrigger value="users">Pengguna</TabsTrigger>
                <TabsTrigger value="reports">Laporan</TabsTrigger>
                <TabsTrigger value="settings">Pengaturan</TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent>
              <TabsContent value="auctions" className="space-y-6">
                {/* Action Bar */}
                <div className="flex justify-between items-center">
                  <div className="flex space-x-3">
                    <Button onClick={() => setShowAddModal(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Tambah Lelang
                    </Button>
                    <Button variant="outline">
                      <FileText className="h-4 w-4 mr-2" />
                      Export Data
                    </Button>
                  </div>

                  <div className="flex space-x-3">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Semua Status</SelectItem>
                        <SelectItem value="active">Aktif</SelectItem>
                        <SelectItem value="ended">Selesai</SelectItem>
                        <SelectItem value="cancelled">Dibatalkan</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="Cari lelang..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-64"
                    />
                  </div>
                </div>

                {/* Auctions Table */}
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-pulse space-y-4">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="h-16 bg-gray-200 rounded"></div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">
                            <Checkbox />
                          </TableHead>
                          <TableHead>Produk</TableHead>
                          <TableHead>Penjual</TableHead>
                          <TableHead>Harga Awal</TableHead>
                          <TableHead>Penawaran Tertinggi</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Berakhir</TableHead>
                          <TableHead>Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredAuctions.map((auction) => (
                          <TableRow key={auction.id}>
                            <TableCell>
                              <Checkbox />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <img
                                  src={auction.imageUrl || "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=60&h=60&fit=crop"}
                                  alt={auction.title}
                                  className="w-12 h-12 object-cover rounded-lg mr-3"
                                />
                                <div>
                                  <p className="font-medium text-gray-900">{auction.title}</p>
                                  <p className="text-sm text-gray-600">ID: AUC-{auction.id.toString().padStart(3, '0')}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium text-gray-900">
                                  {auction.seller.firstName} {auction.seller.lastName}
                                </p>
                                <p className="text-sm text-gray-600">⭐ {auction.seller.rating} rating</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="font-medium text-gray-900">
                                Rp {auction.startingPrice.toLocaleString('id-ID')}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="font-bold text-primary">
                                Rp {auction.startingPrice.toLocaleString('id-ID')}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge className={`status-${auction.status}`}>
                                {auction.status === "active" ? "Aktif" :
                                  auction.status === "ended" ? "Berakhir" : "Dibatalkan"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-gray-600">
                                {new Date(auction.endTime).toLocaleDateString('id-ID')}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button variant="ghost" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                {auction.status === "active" && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => endAuctionMutation.mutate(auction.id)}
                                    disabled={endAuctionMutation.isPending}
                                  >
                                    End
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteAuctionMutation.mutate(auction.id)}
                                  disabled={deleteAuctionMutation.isPending}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    {/* Pagination */}
                    <div className="flex items-center justify-between mt-6">
                      <div className="text-sm text-gray-600">
                        Menampilkan 1-{Math.min(10, filteredAuctions.length)} dari {filteredAuctions.length} lelang
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="bg-primary text-white">
                          1
                        </Button>
                        <Button variant="outline" size="sm">
                          2
                        </Button>
                        <Button variant="outline" size="sm">
                          3
                        </Button>
                        <Button variant="outline" size="sm">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="users" className="space-y-4">
                <div className="text-center py-8">
                  <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">User Management</h3>
                  <p className="text-gray-600">User management features will be implemented here.</p>
                </div>
              </TabsContent>

              <TabsContent value="reports" className="space-y-4">
                <div className="text-center py-8">
                  <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Reports & Analytics</h3>
                  <p className="text-gray-600">Reporting features will be implemented here.</p>
                </div>
              </TabsContent>

              <TabsContent value="settings" className="space-y-4">
                <div className="text-center py-8">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">System Settings</h3>
                  <p className="text-gray-600">System configuration options will be implemented here.</p>
                </div>
              </TabsContent>
            </CardContent>
          </Card>
        </Tabs>

        {showAddModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded shadow w-full max-w-md">
              <h2 className="text-lg font-bold mb-4">Tambah Lelang</h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  createAuctionMutation.mutate({
                    title: newAuction.title,
                    starting_price: parseFloat(newAuction.startingPrice),
                    end_time: newAuction.endTime,
                  });
                }}
                className="space-y-4"
              >
                <Input
                  placeholder="Judul Produk"
                  value={newAuction.title}
                  onChange={(e) =>
                    setNewAuction({ ...newAuction, title: e.target.value })
                  }
                />
                <Input
                  placeholder="Harga Awal"
                  type="number"
                  value={newAuction.startingPrice}
                  onChange={(e) =>
                    setNewAuction({ ...newAuction, startingPrice: e.target.value })
                  }
                />
                <Input
                  placeholder="Waktu Berakhir"
                  type="datetime-local"
                  value={newAuction.endTime}
                  onChange={(e) =>
                    setNewAuction({ ...newAuction, endTime: e.target.value })
                  }
                />
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
                    Batal
                  </Button>
                  <Button type="submit" disabled={createAuctionMutation.isPending}>
                    Simpan
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
