import { useQuery, useMutation } from "@tanstack/react-query";
import { UserStats, Bid, AuctionWithDetails, Payment } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Navbar from "@/components/navbar";
import AuctionCard from "@/components/auction-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Gavel,
  Trophy,
  Eye,
  Star,
  ArrowRight,
  CreditCard,
  Edit,
} from "lucide-react";
import { FileText } from "lucide-react";

export default function UserDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    username: user?.username || "",
    email: user?.email || "",
    phone: user?.phone || "",
  });

  // Update form when user data changes
  useEffect(() => {
    if (user) {
      setProfileForm({
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        email: user.email,
        phone: user.phone || "",
      });
    }
  }, [user]);

  const { data: stats } = useQuery<UserStats>({
    queryKey: ["/api/user/stats"],
  });

  const { data: userBids = [] } = useQuery<(Bid & { auction: any })[]>({
    queryKey: ["/api/user/bids"],
  });

  const { data: watchlist = [] } = useQuery<AuctionWithDetails[]>({
    queryKey: ["/api/user/watchlist"],
  });

  const { data: wonAuctions = [] } = useQuery<AuctionWithDetails[]>({
    queryKey: ["/api/user/won-auctions"],
    queryFn: async () => {
      const res = await fetch("/api/user/won-auctions");
      if (!res.ok) throw new Error("Failed to fetch won auctions");
      return res.json();
    },
    enabled: !!user,
  });

  const { data: userPayments = [] } = useQuery<(Payment & { auction: any })[]>({
    queryKey: ["/api/user/payments"],
    enabled: !!user,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: any) => {
      const res = await apiRequest("PUT", "/api/user/profile", profileData);
      if (!res.ok) throw new Error("Failed to update profile");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      setIsEditingProfile(false);
      toast({
        title: "Sukses",
        description: "Profil berhasil diperbarui",
      });
    },
    onError: () => {
      toast({
        title: "Gagal",
        description: "Gagal memperbarui profil",
        variant: "destructive",
      });
    },
  });

  const handleSaveProfile = () => {
    updateProfileMutation.mutate(profileForm);
  };

  const handleCancelEdit = () => {
    setProfileForm({
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      username: user?.username || "",
      email: user?.email || "",
      phone: user?.phone || "",
    });
    setIsEditingProfile(false);
  };

  // Filter active bids (auctions that are still active)
  const activeBids = userBids.filter(
    (bid) =>
      bid.auction.status === "active" &&
      new Date() < new Date(bid.auction.endTime),
  );

  const bidHistory = userBids.filter(
    (bid) =>
      bid.auction.status === "ended" ||
      new Date() >= new Date(bid.auction.endTime),
  );

  // Get bid status for active auctions
  const getBidStatus = (bid: Bid & { auction: any }) => {
    const currentPrice = parseFloat(bid.auction.currentPrice);
    const bidAmount = parseFloat(bid.amount);

    if (currentPrice === bidAmount) {
      return {
        status: "winning",
        label: "Winning",
        variant: "default" as const,
      };
    } else {
      return {
        status: "outbid",
        label: "Outbid",
        variant: "secondary" as const,
      };
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Saya</h1>
          <p className="text-gray-600 mt-2">
            Selamat datang, {user?.firstName} {user?.lastName}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Gavel className="h-8 w-8 text-primary" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Lelang Aktif
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats?.activeBids || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Trophy className="h-8 w-8 text-accent" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Lelang Dimenangkan
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats?.wonAuctions || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Eye className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Sedang Diikuti
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats?.watchlistCount || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Star className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Rating Saya
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats?.rating || "0.0"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Dashboard Tabs */}
        <Tabs defaultValue="active-bids" className="w-full">
          <Card>
            <CardHeader>
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="active-bids">Penawaran Aktif</TabsTrigger>
                <TabsTrigger value="won">Lelang Dimenangkan</TabsTrigger>
                <TabsTrigger value="payments">Pembayaran</TabsTrigger>
                <TabsTrigger value="watchlist">Watchlist</TabsTrigger>
                <TabsTrigger value="history">Riwayat Lelang</TabsTrigger>
                <TabsTrigger value="profile">Profil</TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent>
              <TabsContent value="active-bids" className="space-y-4">
                {activeBids.length === 0 ? (
                  <div className="text-center py-8">
                    <Gavel className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Tidak ada penawaran aktif
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Mulai ikut lelang untuk melihat penawaran aktif Anda di
                      sini.
                    </p>
                    <Button>Jelajahi Lelang</Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produk</TableHead>
                        <TableHead>Penawaran Saya</TableHead>
                        <TableHead>Tertinggi Saat Ini</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Berakhir</TableHead>
                        <TableHead>Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeBids.map((bid) => {
                        const status = getBidStatus(bid);
                        return (
                          <TableRow key={bid.id}>
                            <TableCell>
                              <div className="flex items-center">
                                <img
                                  src={
                                    bid.auction.imageUrl ||
                                    "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=60&h=60&fit=crop"
                                  }
                                  alt={bid.auction.title}
                                  className="w-12 h-12 object-cover rounded-lg mr-3"
                                />
                                <div>
                                  <p className="font-medium text-gray-900">
                                    {bid.auction.title}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    {bid.auction.condition}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="font-bold text-primary">
                                Rp{" "}
                                {parseFloat(bid.amount).toLocaleString("id-ID")}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="font-bold text-gray-900">
                                Rp{" "}
                                {parseFloat(
                                  bid.auction.currentPrice,
                                ).toLocaleString("id-ID")}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={status.variant}
                                className={`status-${status.status}`}
                              >
                                {status.label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-gray-600">
                                {new Date(
                                  bid.auction.endTime,
                                ).toLocaleDateString("id-ID")}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Button variant="outline" size="sm">
                                <ArrowRight className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>

              <TabsContent value="won" className="space-y-4">
                {wonAuctions.length === 0 ? (
                  <div className="text-center py-8">
                    <Trophy className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Belum ada lelang yang dimenangkan
                    </h3>
                    <p className="text-gray-600">
                      Lelang yang Anda menangkan akan muncul di sini.
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produk</TableHead>
                        <TableHead>Harga Menang</TableHead>
                        <TableHead>Status Bayar</TableHead>
                        <TableHead>Tanggal Berakhir</TableHead>
                        <TableHead>Dokumen</TableHead>
                        <TableHead>Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {wonAuctions.map((auction) => {
                        // Find payment for this auction
                        const payment = userPayments.find(
                          (p) => p.auctionId === auction.id,
                        );

                        return (
                          <TableRow key={auction.id}>
                            <TableCell>
                              <div className="flex items-center">
                                <img
                                  src={
                                    auction.imageUrl ||
                                    "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=60&h=60&fit=crop"
                                  }
                                  alt={auction.title}
                                  className="w-12 h-12 object-cover rounded-lg mr-3"
                                />
                                <div>
                                  <p className="font-medium text-gray-900">
                                    {auction.title}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    {auction.condition}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="font-bold text-primary">
                                Rp{" "}
                                {parseFloat(
                                  auction.currentPrice,
                                ).toLocaleString("id-ID")}
                              </span>
                            </TableCell>
                            <TableCell>
                              {payment ? (
                                <Badge
                                  variant={
                                    payment.status === "verified"
                                      ? "default"
                                      : payment.status === "rejected"
                                        ? "destructive"
                                        : "secondary"
                                  }
                                >
                                  {payment.status === "verified"
                                    ? "Lunas"
                                    : payment.status === "rejected"
                                      ? "Ditolak"
                                      : "Pending"}
                                </Badge>
                              ) : (
                                <Badge variant="destructive">Belum Bayar</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-gray-600">
                                {new Date(auction.endTime).toLocaleDateString(
                                  "id-ID",
                                )}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                {payment && payment.status === "verified" && (
                                  <>
                                    {payment.invoiceDocument && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() =>
                                          window.open(
                                            payment.invoiceDocument,
                                            "_blank",
                                          )
                                        }
                                        className="text-xs h-6"
                                      >
                                        <FileText className="h-3 w-3 mr-1" />
                                        Invoice
                                      </Button>
                                    )}
                                    {payment.releaseLetterDocument && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() =>
                                          window.open(
                                            payment.releaseLetterDocument,
                                            "_blank",
                                          )
                                        }
                                        className="text-xs h-6"
                                      >
                                        <FileText className="h-3 w-3 mr-1" />
                                        Surat Lepas
                                      </Button>
                                    )}
                                    {payment.handoverDocument && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() =>
                                          window.open(
                                            payment.handoverDocument,
                                            "_blank",
                                          )
                                        }
                                        className="text-xs h-6"
                                      >
                                        <FileText className="h-3 w-3 mr-1" />
                                        Serah Terima
                                      </Button>
                                    )}
                                    {!payment.invoiceDocument &&
                                      !payment.releaseLetterDocument &&
                                      !payment.handoverDocument && (
                                        <span className="text-xs text-gray-500">
                                          Dokumen belum tersedia
                                        </span>
                                      )}
                                  </>
                                )}
                                {payment && payment.status === "pending" && (
                                  <span className="text-xs text-yellow-600">
                                    Menunggu verifikasi
                                  </span>
                                )}
                                {payment && payment.status === "rejected" && (
                                  <span className="text-xs text-red-600">
                                    Pembayaran ditolak
                                  </span>
                                )}
                                {!payment && (
                                  <span className="text-xs text-red-600">
                                    Belum upload bukti bayar
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  (window.location.href = `/auctions/${auction.id}`)
                                }
                              >
                                <ArrowRight className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>

              <TabsContent value="payments" className="space-y-4">
                {userPayments.length === 0 ? (
                  <div className="text-center py-8">
                    <CreditCard className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Belum ada riwayat pembayaran
                    </h3>
                    <p className="text-gray-600">
                      Riwayat pembayaran akan muncul di sini setelah Anda
                      memenangkan lelang.
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Lelang</TableHead>
                        <TableHead>Jumlah</TableHead>
                        <TableHead>Metode Bayar</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Dokumen</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {userPayments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>
                            <div className="flex items-center">
                              <img
                                src={
                                  payment.auction?.imageUrl ||
                                  "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=60&h=60&fit=crop"
                                }
                                alt={payment.auction?.title}
                                className="w-12 h-12 object-cover rounded-lg mr-3"
                              />
                              <div>
                                <p className="font-medium text-gray-900">
                                  {payment.auction?.title}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-bold">
                              Rp{" "}
                              {Number(payment.amount).toLocaleString("id-ID")}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="capitalize">
                              {payment.paymentMethod.replace("_", " ")}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                payment.status === "verified"
                                  ? "default"
                                  : payment.status === "rejected"
                                    ? "destructive"
                                    : "secondary"
                              }
                            >
                              {payment.status === "verified"
                                ? "Sukses"
                                : payment.status === "rejected"
                                  ? "Ditolak"
                                  : "Pending"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-gray-600">
                              {new Date(payment.createdAt).toLocaleDateString(
                                "id-ID",
                              )}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {payment.status === "verified" && (
                                <>
                                  {payment.invoiceDocument && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() =>
                                        window.open(
                                          payment.invoiceDocument,
                                          "_blank",
                                        )
                                      }
                                      className="text-xs"
                                    >
                                      <FileText className="h-3 w-3 mr-1" />
                                      Invoice
                                    </Button>
                                  )}
                                  {payment.releaseLetterDocument && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() =>
                                        window.open(
                                          payment.releaseLetterDocument,
                                          "_blank",
                                        )
                                      }
                                      className="text-xs"
                                    >
                                      <FileText className="h-3 w-3 mr-1" />
                                      Surat Lepas
                                    </Button>
                                  )}
                                  {payment.handoverDocument && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() =>
                                        window.open(
                                          payment.handoverDocument,
                                          "_blank",
                                        )
                                      }
                                      className="text-xs"
                                    >
                                      <FileText className="h-3 w-3 mr-1" />
                                      Serah Terima
                                    </Button>
                                  )}
                                  {!payment.invoiceDocument &&
                                    !payment.releaseLetterDocument &&
                                    !payment.handoverDocument && (
                                      <span className="text-xs text-gray-500">
                                        Belum tersedia
                                      </span>
                                    )}
                                </>
                              )}
                              {payment.status === "pending" && (
                                <span className="text-xs text-yellow-600">
                                  Menunggu verifikasi
                                </span>
                              )}
                              {payment.status === "rejected" &&
                                payment.notes && (
                                  <span
                                    className="text-xs text-red-600"
                                    title={payment.notes}
                                  >
                                    Lihat catatan
                                  </span>
                                )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>

              <TabsContent value="history" className="space-y-4">
                {bidHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <Trophy className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Belum ada riwayat lelang
                    </h3>
                    <p className="text-gray-600">
                      Riwayat lelang yang telah berakhir akan muncul di sini.
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produk</TableHead>
                        <TableHead>Penawaran Terakhir</TableHead>
                        <TableHead>Harga Final</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Berakhir</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bidHistory.map((bid) => {
                        const isWinner = bid.auction.winnerId === user?.id;
                        return (
                          <TableRow key={bid.id}>
                            <TableCell>
                              <div className="flex items-center">
                                <img
                                  src={
                                    bid.auction.imageUrl ||
                                    "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=60&h=60&fit=crop"
                                  }
                                  alt={bid.auction.title}
                                  className="w-12 h-12 object-cover rounded-lg mr-3"
                                />
                                <div>
                                  <p className="font-medium text-gray-900">
                                    {bid.auction.title}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    {bid.auction.condition}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="font-medium">
                                Rp{" "}
                                {parseFloat(bid.amount).toLocaleString("id-ID")}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="font-bold">
                                Rp{" "}
                                {parseFloat(
                                  bid.auction.currentPrice,
                                ).toLocaleString("id-ID")}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={isWinner ? "default" : "secondary"}
                              >
                                {isWinner ? "Menang" : "Kalah"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-gray-600">
                                {new Date(
                                  bid.auction.endTime,
                                ).toLocaleDateString("id-ID")}
                              </span>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>

              <TabsContent value="watchlist" className="space-y-4">
                {watchlist.length === 0 ? (
                  <div className="text-center py-8">
                    <Eye className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Watchlist kosong
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Tambahkan lelang ke watchlist untuk memantau
                      perkembangannya.
                    </p>
                    <Button>Jelajahi Lelang</Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {watchlist.map((auction) => (
                      <AuctionCard key={auction.id} auction={auction} />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="profile" className="space-y-4">
                <div className="max-w-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Informasi Profil
                    </h3>
                    {!isEditingProfile ? (
                      <Button
                        onClick={() => setIsEditingProfile(true)}
                        variant="outline"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Profil
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          onClick={handleCancelEdit}
                          variant="outline"
                          size="sm"
                        >
                          Batal
                        </Button>
                        <Button
                          onClick={handleSaveProfile}
                          disabled={updateProfileMutation.isPending}
                          size="sm"
                        >
                          {updateProfileMutation.isPending
                            ? "Menyimpan..."
                            : "Simpan"}
                        </Button>
                      </div>
                    )}
                  </div>

                  {!isEditingProfile ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Nama Depan
                          </label>
                          <p className="mt-1 text-sm text-gray-900">
                            {user?.firstName}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Nama Belakang
                          </label>
                          <p className="mt-1 text-sm text-gray-900">
                            {user?.lastName}
                          </p>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Username
                        </label>
                        <p className="mt-1 text-sm text-gray-900">
                          {user?.username}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Email
                        </label>
                        <p className="mt-1 text-sm text-gray-900">
                          {user?.email}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Nomor Telepon
                        </label>
                        <p className="mt-1 text-sm text-gray-900">
                          {user?.phone || "Belum diisi"}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Rating
                        </label>
                        <div className="flex items-center mt-1">
                          <Star className="h-4 w-4 text-yellow-500 mr-1" />
                          <span className="text-sm text-gray-900">
                            {stats?.rating || "0.0"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <form
                      className="space-y-4"
                      onSubmit={(e) => e.preventDefault()}
                    >
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Nama Depan
                          </label>
                          <Input
                            value={profileForm.firstName}
                            onChange={(e) =>
                              setProfileForm({
                                ...profileForm,
                                firstName: e.target.value,
                              })
                            }
                            placeholder="Nama depan"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Nama Belakang
                          </label>
                          <Input
                            value={profileForm.lastName}
                            onChange={(e) =>
                              setProfileForm({
                                ...profileForm,
                                lastName: e.target.value,
                              })
                            }
                            placeholder="Nama belakang"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Username
                        </label>
                        <Input
                          value={profileForm.username}
                          onChange={(e) =>
                            setProfileForm({
                              ...profileForm,
                              username: e.target.value,
                            })
                          }
                          placeholder="Username"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Email
                        </label>
                        <Input
                          type="email"
                          value={profileForm.email}
                          onChange={(e) =>
                            setProfileForm({
                              ...profileForm,
                              email: e.target.value,
                            })
                          }
                          placeholder="Email"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Nomor Telepon
                        </label>
                        <Input
                          value={profileForm.phone}
                          onChange={(e) =>
                            setProfileForm({
                              ...profileForm,
                              phone: e.target.value,
                            })
                          }
                          placeholder="Nomor telepon"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Rating
                        </label>
                        <div className="flex items-center mt-1">
                          <Star className="h-4 w-4 text-yellow-500 mr-1" />
                          <span className="text-sm text-gray-900">
                            {stats?.rating || "0.0"}
                          </span>
                        </div>
                      </div>
                    </form>
                  )}
                </div>
              </TabsContent>
            </CardContent>
          </Card>
        </Tabs>
      </div>
    </div>
  );
}
