import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
// import { AuctionWithDetails } from "@shared/schema";
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
import { Auction, Payment } from "@shared/schema";
import { useLocation, useParams } from "wouter";
import VehicleInfoModal from "@/components/vehicle-info-modal";
import { Clock } from "lucide-react";



export default function AdminPanel() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [newAuction, setNewAuction] = useState({
    title: "",
    description: "",
    condition: "",
    location: "",
    categoryId: "",
    imageUrl: "",
    startingPrice: "",
    endTime: "",
    productionYear: "",
    plateNumber: "",
    chassisNumber: "",
    engineNumber: "",
    documentInfo: "",
  });
  const [newCategory, setNewCategory] = useState({
    name: "",
    description: "",
  });
  const [verifyPaymentModal, setVerifyPaymentModal] = useState<{
    payment: any;
    action: 'verify' | 'reject';
  } | null>(null);
  const [verificationNotes, setVerificationNotes] = useState("");

  const {
    data: auctions,
    isLoading: isAuctionsLoading,
    error: auctionsError,
    refetch: refetchAuctions,
  } = useQuery<Auction[]>({
    queryKey: ["/api/auctions"],
    queryFn: async () => {
      const res = await fetch("/api/auctions");
      if (!res.ok) throw new Error("Gagal memuat lelang");
      return res.json();
    },
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories");
      if (!res.ok) throw new Error("Failed to fetch categories");
      return res.json();
    },
  });

  // Ambil ID kategori Motor dan Mobil secara dinamis
  const motorCategory = categories.find((cat: any) => cat.name.toLowerCase() === "motor");
  const mobilCategory = categories.find((cat: any) => cat.name.toLowerCase() === "mobil");
  const motorCategoryId = motorCategory?.id?.toString();
  const mobilCategoryId = mobilCategory?.id?.toString();


  // mutation untuk simpan lelang
  const createAuctionMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/auctions", data);
      return await res.json();
    },
    onSuccess: () => {
      setShowAddModal(false);
      setNewAuction({
        title: "",
        description: "",
        condition: "",
        location: "",
        categoryId: "",
        imageUrl: "",
        startingPrice: "",
        endTime: "",
        productionYear: "",
        plateNumber: "",
        chassisNumber: "",
        engineNumber: "",
        documentInfo: "",
      });
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

  // Category mutations
  const createCategoryMutation = useMutation({
    mutationFn: async (categoryData: any) => {
      const res = await apiRequest("POST", "/api/categories", categoryData);
      if (!res.ok) throw new Error("Failed to create category");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({ title: "Sukses", description: "Kategori berhasil dibuat" });
      setShowCategoryModal(false);
      setNewCategory({ name: "", description: "" });
    },
    onError: () => {
      toast({ title: "Gagal", description: "Pembuatan kategori gagal", variant: "destructive" });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest("PUT", `/api/categories/${id}`, data);
      if (!res.ok) throw new Error("Failed to update category");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({ title: "Sukses", description: "Kategori berhasil diubah" });
      setShowCategoryModal(false);
      setEditingCategory(null);
      setNewCategory({ name: "", description: "" });
    },
    onError: () => {
      toast({ title: "Gagal", description: "Update kategori gagal", variant: "destructive" });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/categories/${id}`);
      if (!res.ok) throw new Error("Failed to delete category");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({ title: "Sukses", description: "Kategori berhasil dihapus" });
    },
    onError: () => {
      toast({ title: "Gagal", description: "Penghapusan kategori gagal", variant: "destructive" });
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
      return res.json();
    },
  });

  const { data: archivedAuctions = [], isLoading: loadingArchived } = useQuery<Auction[]>({
    queryKey: ["/api/auctions/archived"],
    staleTime: 0,
  });

  const { data: pendingPayments = [], isLoading: loadingPayments } = useQuery<(Payment & { auction: any; winner: any })[]>({
    queryKey: ["/api/admin/payments/pending"],
    queryFn: async () => {
      const res = await fetch("/api/admin/payments/pending");
      if (!res.ok) throw new Error("Failed to fetch pending payments");
      return res.json();
    },
  });

  const deleteAuctionMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/auctions/${id}`);
      // Tidak usah cek res.ok, apapun hasilnya, lanjut saja.
      try { await res.json(); } catch { } // biar tidak error kalau respons kosong
      return true;
    },
    onSettled: () => {
      // SELALU refresh data lelang
      queryClient.invalidateQueries({ queryKey: ["/api/auctions"] });
      toast({
        title: "Sukses",
        description: "Lelang berhasil dihapus",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message === "Auction not found"
          ? "Data lelang sudah terhapus."
          : error?.message || "Failed to delete auction",
        variant: "destructive",
      });
    },
  });

  const endAuctionMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/auctions/${id}/end`);
      if (!res.ok) throw new Error("Failed to end auction");
      return res.json?.() ?? true;
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

    const checkExpiredMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/admin/check-expired`);
      if (!res.ok) throw new Error("Failed to check expired auctions");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auctions"] });
      toast({
        title: "Success",
        description: "Expired auctions checked successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to check expired auctions",
        variant: "destructive",
      });
    },
  });

  // Auto-check expired auctions every 2 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      checkExpiredMutation.mutate();
    }, 120000); // 2 minutes

    return () => clearInterval(interval);
  }, [checkExpiredMutation]);

  const archiveMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/auctions/${id}/archive`);
      if (!res.ok) throw new Error("Failed to archive auction");
      return res.json?.() ?? true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auctions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auctions/archived"] });
      toast({
        title: "Success",
        description: "Auction archived successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to archive auction",
        variant: "destructive",
      });
    },
  });

  const unarchiveMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/auctions/${id}/unarchive`);
      if (!res.ok) throw new Error("Failed to unarchive auction");
      return res.json?.() ?? true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auctions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auctions/archived"] });
      toast({
        title: "Success",
        description: "Auction unarchived successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to unarchive auction",
        variant: "destructive",
      });
    },
  });

  // Pastikan hanya data yang tidak diarsipkan yang muncul di tab utama
  const filteredAuctions = (auctions ?? []).filter(auction => {
    const notArchived = auction.status !== "archived";
    const matchesStatus = statusFilter === "all" || auction.status === statusFilter;
    const matchesSearch = !searchQuery ||
      auction.title.toLowerCase().includes(searchQuery.toLowerCase());
    return notArchived && matchesStatus && matchesSearch;
  });

  const handleView = (id: number) => {
    if (!id) return toast({ title: "ID Lelang tidak valid", variant: "destructive" });
    navigate(`/auction/${id}`);
  };


  const handleEdit = (id: number) => {
    if (!id) return toast({ title: "ID Lelang tidak valid", variant: "destructive" });
    navigate(`/admin/edit-auction/${id}`);
  };

  const verifyPaymentMutation = useMutation({
    mutationFn: async ({ paymentId, status, notes }: { paymentId: string; status: string; notes?: string }) => {
      const res = await apiRequest("POST", `/api/admin/payments/${paymentId}/verify`, { status, notes });
      if (!res.ok) throw new Error("Failed to verify payment");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payments/pending"] });
      toast({ title: "Success", description: "Payment verified successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to verify payment", variant: "destructive" });
    },
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
                    {(auctions ?? []).filter(a => a.status === "active").length}
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
              <TabsList className="grid w-full grid-cols-7">
                <TabsTrigger value="auctions">Kelola Lelang</TabsTrigger>
                <TabsTrigger value="categories">Kategori</TabsTrigger>
                <TabsTrigger value="payments">Pembayaran</TabsTrigger>
                <TabsTrigger value="archived">Arsip</TabsTrigger>
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
                {isAuctionsLoading ? (
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
                                  <p className="text-sm text-gray-600">ID: {auction.id ? `AUC-${auction.id.toString().padStart(3, '0')}` : "AUC-??? (data error)"}</p>
                                </div>
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
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={!auction.id}
                                  onClick={() => handleView(auction.id)}
                                  title="Lihat Detail"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                {/* Vehicle Info Button - only show for Motor/Mobil */}
                                {(auction.categoryId === parseInt(motorCategoryId || "0") || 
                                  auction.categoryId === parseInt(mobilCategoryId || "0")) && (
                                  <VehicleInfoModal auction={auction}>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      title="View Document/Info"
                                    >
                                      <FileText className="h-4 w-4" />
                                    </Button>
                                  </VehicleInfoModal>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={!auction.id}
                                  onClick={() => handleEdit(auction.id)}
                                  title="Edit"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                {auction.status === "active" && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    disabled={!auction.id || endAuctionMutation.isPending}
                                    onClick={() => auction.id && endAuctionMutation.mutate(auction.id)}
                                    title="End Auction"
                                  >
                                    End
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={!auction.id || archiveMutation.isPending}
                                  onClick={() => auction.id && archiveMutation.mutate(auction.id)}
                                  title="Archive"
                                >
                                  Archive
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={!auction.id || deleteAuctionMutation.isPending}
                                  onClick={() => auction.id && deleteAuctionMutation.mutate(auction.id)}
                                  title="Hapus"
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

              <TabsContent value="payments" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Pending Payments</h3>
                  <Badge variant="secondary">{pendingPayments.length} pending</Badge>
                </div>

                {loadingPayments ? (
                  <div>Loading payments...</div>
                ) : pendingPayments.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600">No pending payments</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Auction</TableHead>
                        <TableHead>Winner</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Payment Method</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingPayments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{payment.auction?.title}</p>
                              {payment.paymentProof && (
                                <a 
                                  href={payment.paymentProof} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-600 text-sm hover:underline"
                                >
                                  View Proof
                                </a>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{payment.winner?.firstName} {payment.winner?.lastName}</p>
                              <p className="text-sm text-gray-600">{payment.winner?.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-bold">Rp {Number(payment.amount).toLocaleString('id-ID')}</span>
                          </TableCell>
                          <TableCell>
                            <div>
                              <span className="capitalize">{payment.paymentMethod.replace('_', ' ')}</span>
                              {payment.bankName && (
                                <p className="text-sm text-gray-600">{payment.bankName}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{new Date(payment.createdAt).toLocaleDateString('id-ID')}</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                onClick={() => {
                                  setVerifyPaymentModal({ payment, action: 'verify' });
                                  setVerificationNotes("");
                                }}
                                disabled={verifyPaymentMutation.isPending}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                ✓ Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  setVerifyPaymentModal({ payment, action: 'reject' });
                                  setVerificationNotes("");
                                }}
                                disabled={verifyPaymentMutation.isPending}
                              >
                                ✗ Reject
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>

              <TabsContent value="archived" className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Lelang yang Diarsipkan</h3>
                    <p className="text-sm text-gray-600">Kelola barang lelang yang sudah diarsipkan</p>
                  </div>
                </div>

                {loadingArchived ? (
                  <div className="text-center py-8">
                    <div className="animate-pulse space-y-4">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="h-16 bg-gray-200 rounded"></div>
                      ))}
                    </div>
                  </div>
                ) : archivedAuctions.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                      <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h8a2 2 0 002-2V8m-9 4h4" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada lelang yang diarsipkan</h3>
                    <p className="text-gray-600">Lelang yang diarsipkan akan muncul di sini.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Produk</TableHead>
                          <TableHead>Harga Awal</TableHead>
                          <TableHead>Penawaran Tertinggi</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Pemenang</TableHead>
                          <TableHead>Diarsipkan</TableHead>
                          <TableHead>Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {archivedAuctions.map((auction) => (
                          <TableRow key={auction.id}>
                            <TableCell>
                              <div className="flex items-center">
                                <img
                                  src={auction.imageUrl || "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=60&h=60&fit=crop"}
                                  alt={auction.title}
                                  className="w-12 h-12 object-cover rounded-lg mr-3"
                                />
                                <div>
                                  <p className="font-medium text-gray-900">{auction.title}</p>
                                  <p className="text-sm text-gray-600">ID: {auction.id ? `AUC-${auction.id.toString().padStart(3, '0')}` : "AUC-??? (data error)"}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="font-medium text-gray-900">
                                Rp {auction.startingPrice.toLocaleString('id-ID')}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="font-bold text-primary">
                                Rp {auction.currentPrice.toLocaleString('id-ID')}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge className={`status-${auction.status}`}>
                                {auction.status === "active" ? "Aktif" :
                                  auction.status === "ended" ? "Berakhir" : "Dibatalkan"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {auction.winnerId ? (
                                <Badge variant="secondary" className="bg-green-100 text-green-800">
                                  Ada Pemenang
                                </Badge>
                              ) : (
                                <span className="text-gray-500 text-sm">Tidak ada pemenang</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-gray-600">
                                {new Date(auction.createdAt).toLocaleDateString('id-ID')}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={!auction.id}
                                  onClick={() => handleView(auction.id)}
                                  title="Lihat Detail"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button><Button
                                  variant="outline"
                                  size="sm"
                                  disabled={!auction.id || unarchiveMutation.isPending}
                                  onClick={() => auction.id && unarchiveMutation.mutate(auction.id)}
                                  title="Kembalikan ke Daftar Aktif"
                                  className="text-blue-600 border-blue-300 hover:bg-blue-50"
                                >
                                  Unarchive
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={!auction.id || deleteAuctionMutation.isPending}
                                  onClick={() => auction.id && deleteAuctionMutation.mutate(auction.id)}
                                  title="Hapus Permanen"
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="categories" className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Kelola Kategori</h3>
                    <p className="text-sm text-gray-600">Tambah, edit, atau hapus kategori lelang</p>
                  </div>
                  <Button onClick={() => setShowCategoryModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Kategori
                  </Button>
                </div>

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nama</TableHead>
                        <TableHead>Deskripsi</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Dibuat</TableHead>
                        <TableHead>Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categories.map((category: any) => (
                        <TableRow key={category.id}>
                          <TableCell>
                            <span className="font-medium text-gray-900">{category.name}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-gray-600">{category.description}</span>
                          </TableCell>
                          <TableCell>
                            <Badge variant={category.isActive ? "default" : "secondary"}>
                              {category.isActive ? "Aktif" : "Nonaktif"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-gray-600">
                              {new Date(category.createdAt).toLocaleDateString('id-ID')}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingCategory(category);
                                  setNewCategory({
                                    name: category.name,
                                    description: category.description || "",
                                  });
                                  setShowCategoryModal(true);
                                }}
                                title="Edit"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={deleteCategoryMutation.isPending}
                                onClick={() => {
                                  if (confirm(`Hapus kategori "${category.name}"?`)) {
                                    deleteCategoryMutation.mutate(category.id);
                                  }
                                }}
                                title="Hapus"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
This code adds a button to manually check expired auctions and integrates automatic periodic checking.                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
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

        {/* Category Modal */}
        {showCategoryModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded shadow w-full max-w-md">
              <h2 className="text-lg font-bold mb-4">
                {editingCategory ? "Edit Kategori" : "Tambah Kategori"}
              </h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (editingCategory) {
                    updateCategoryMutation.mutate({
                      id: editingCategory.id,
                      data: newCategory,
                    });
                  } else {
                    createCategoryMutation.mutate(newCategory);
                  }
                }}
                className="space-y-4"
              >
                <Input
                  placeholder="Nama Kategori"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  required
                />
                <Input
                  placeholder="Deskripsi"
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                />
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCategoryModal(false);
                      setEditingCategory(null);
                      setNewCategory({ name: "", description: "" });
                    }}
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}
                  >
                    {editingCategory ? "Update" : "Simpan"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Auction Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded shadow w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-lg font-bold mb-4">Tambah Lelang</h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const auctionData = {
                    title: newAuction.title,
                    description: newAuction.description,
                    condition: newAuction.condition,
                    location: newAuction.location,
                    categoryId: parseInt(newAuction.categoryId),
                    imageUrl: newAuction.imageUrl || undefined,
                    startingPrice: parseFloat(newAuction.startingPrice),
                    currentPrice: parseFloat(newAuction.startingPrice),
                    endTime: new Date(newAuction.endTime),
                    minimumIncrement: 50000,
                  };

                  // Add vehicle-specific fields for Motor dan Mobil (berdasarkan nama kategori)
                  if (newAuction.categoryId === motorCategoryId || newAuction.categoryId === mobilCategoryId) {
                    Object.assign(auctionData, {
                      productionYear: newAuction.productionYear ? parseInt(newAuction.productionYear) : undefined,
                      plateNumber: newAuction.plateNumber || undefined,
                      chassisNumber: newAuction.chassisNumber || undefined,
                      engineNumber: newAuction.engineNumber || undefined,
                      documentInfo: newAuction.documentInfo || undefined,
                    });
                  }

                  createAuctionMutation.mutate(auctionData);
                }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-6"
              >
                {/* Left Column - Basic Info */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 border-b pb-2">Informasi Dasar</h3>
                  <Input
                    placeholder="Judul Lelang"
                    value={newAuction.title}
                    onChange={(e) => setNewAuction({ ...newAuction, title: e.target.value })}
                    required
                  />
                  <textarea
                    placeholder="Deskripsi"
                    value={newAuction.description}
                    onChange={(e) => setNewAuction({ ...newAuction, description: e.target.value })}
                    className="w-full border rounded p-2 min-h-[80px]"
                    required
                  />
                  <select
                    value={newAuction.condition}
                    onChange={(e) => setNewAuction({ ...newAuction, condition: e.target.value })}
                    className="w-full border rounded p-2"
                    required
                  >
                    <option value="">-- Pilih Kondisi --</option>
                    <option value="new">Baru</option>
                    <option value="like_new">Seperti Baru</option>
                    <option value="good">Baik</option>
                    <option value="fair">Cukup</option>
                  </select>
                  <Input
                    placeholder="Lokasi"
                    value={newAuction.location}
                    onChange={(e) => setNewAuction({ ...newAuction, location: e.target.value })}
                    required
                  />
                  <select
                    value={newAuction.categoryId}
                    onChange={(e) => setNewAuction({ ...newAuction, categoryId: e.target.value })}
                    className="w-full border rounded p-2"
                    required
                  >
                    <option value="">-- Pilih Kategori --</option>
                    {categories.map((category: any) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>

                  {/* File Upload for Image */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Upload Gambar</label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          // For now, we'll create a temporary URL for preview
                          // In production, you'd upload to a file storage service
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            setNewAuction({ ...newAuction, imageUrl: event.target?.result as string });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="w-full border rounded p-2"
                    />
                    {newAuction.imageUrl && (
                      <div className="mt-2">
                        <img
                          src={newAuction.imageUrl}
                          alt="Preview"
                          className="w-32 h-32 object-cover rounded border"
                        />
                      </div>
                    )}
                  </div>

                  <Input
                    placeholder="Harga Awal"
                    type="number"
                    value={newAuction.startingPrice}
                    onChange={(e) => setNewAuction({ ...newAuction, startingPrice: e.target.value })}
                    required
                  />
                  <Input
                    placeholder="Waktu Berakhir"
                    type="datetime-local"
                    value={newAuction.endTime}
                    onChange={(e) => setNewAuction({ ...newAuction, endTime: e.target.value })}
                    required
                  />
                </div>

                {/* Right Column - Vehicle Specific Info */}
                <div className="space-y-4">
                  {(newAuction.categoryId === motorCategoryId || newAuction.categoryId === mobilCategoryId) ? (
                    <>
                      <h3 className="font-semibold text-gray-900 border-b pb-2">
                        Informasi {newAuction.categoryId === motorCategoryId ? "Motor" : "Mobil"}
                      </h3>
                      <Input
                        placeholder="Tahun Produksi"
                        type="number"
                        value={newAuction.productionYear}
                        onChange={(e) => setNewAuction({ ...newAuction, productionYear: e.target.value })}
                      />
                      <Input
                        placeholder="No Polisi"
                        value={newAuction.plateNumber}
                        onChange={(e) => setNewAuction({ ...newAuction, plateNumber: e.target.value })}
                      />
                      <Input
                        placeholder="No Rangka"
                        value={newAuction.chassisNumber}
                        onChange={(e) => setNewAuction({ ...newAuction, chassisNumber: e.target.value })}
                      />
                      <Input
                        placeholder="No Mesin"
                        value={newAuction.engineNumber}
                        onChange={(e) => setNewAuction({ ...newAuction, engineNumber: e.target.value })}
                      />
                      <textarea
                        placeholder="Keterangan Surat (opsional)"
                        value={newAuction.documentInfo}
                        onChange={(e) => setNewAuction({ ...newAuction, documentInfo: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-md min-h-[80px] resize-vertical"
                      />
                      <textarea
                        placeholder="Keterangan Surat (STNK/BPKB/Kelengkapan dokumen)"
                        value={newAuction.documentInfo}
                        onChange={(e) => setNewAuction({ ...newAuction, documentInfo: e.target.value })}
                        className="w-full border rounded p-2 min-h-[100px]"
                      />
                    </>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>Pilih kategori Motor atau Mobil untuk menampilkan field khusus kendaraan</p>
                    </div>
                  )}
                </div>

                {/* Form Actions - Full Width */}
                <div className="lg:col-span-2 flex justify-end space-x-2 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowAddModal(false);
                      setNewAuction({
                        title: "",
                        description: "",
                        condition: "",
                        location: "",
                        categoryId: "",
                        imageUrl: "",
                        startingPrice: "",
                        endTime: "",
                        productionYear: "",
                        plateNumber: "",
                        chassisNumber: "",
                        engineNumber: "",
                        documentInfo: "",
                      });
                    }}
                  >
                    Batal
                  </Button>
                  <Button type="submit" disabled={createAuctionMutation.isPending}>
                    {createAuctionMutation.isPending ? "Menyimpan..." : "Simpan"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Payment Verification Modal */}
        {verifyPaymentModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
              <h2 className="text-lg font-bold mb-4">
                {verifyPaymentModal.action === 'verify' ? 'Approve Payment' : 'Reject Payment'}
              </h2>
              
              <div className="mb-4 p-3 bg-gray-50 rounded">
                <p className="text-sm text-gray-600">Auction</p>
                <p className="font-medium">{verifyPaymentModal.payment.auction?.title}</p>
                <p className="text-sm text-gray-600 mt-1">Amount</p>
                <p className="font-bold text-primary">
                  Rp {Number(verifyPaymentModal.payment.amount).toLocaleString('id-ID')}
                </p>
                <p className="text-sm text-gray-600 mt-1">Winner</p>
                <p className="font-medium">
                  {verifyPaymentModal.payment.winner?.firstName} {verifyPaymentModal.payment.winner?.lastName}
                </p>
                {verifyPaymentModal.payment.paymentProof && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600">Payment Proof</p>
                    <a 
                      href={verifyPaymentModal.payment.paymentProof} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      View Proof →
                    </a>
                  </div>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {verifyPaymentModal.action === 'verify' ? 'Approval Notes (Optional)' : 'Rejection Reason'}
                </label>
                <textarea
                  value={verificationNotes}
                  onChange={(e) => setVerificationNotes(e.target.value)}
                  placeholder={
                    verifyPaymentModal.action === 'verify' 
                      ? "Add any notes about the approval..."
                      : "Please provide reason for rejection..."
                  }
                  className="w-full p-2 border border-gray-300 rounded-md min-h-[80px] resize-vertical"
                  required={verifyPaymentModal.action === 'reject'}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setVerifyPaymentModal(null);
                    setVerificationNotes("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (verifyPaymentModal.action === 'reject' && !verificationNotes.trim()) {
                      toast({ 
                        title: "Error", 
                        description: "Please provide a reason for rejection", 
                        variant: "destructive" 
                      });
                      return;
                    }
                    
                    verifyPaymentMutation.mutate({ 
                      paymentId: verifyPaymentModal.payment.id, 
                      status: verifyPaymentModal.action === 'verify' ? 'verified' : 'rejected',
                      notes: verificationNotes.trim() || undefined
                    });
                    setVerifyPaymentModal(null);
                    setVerificationNotes("");
                  }}
                  disabled={verifyPaymentMutation.isPending}
                  variant={verifyPaymentModal.action === 'verify' ? 'default' : 'destructive'}
                >
                  {verifyPaymentMutation.isPending ? "Processing..." : 
                   verifyPaymentModal.action === 'verify' ? 'Approve Payment' : 'Reject Payment'}
                </Button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}