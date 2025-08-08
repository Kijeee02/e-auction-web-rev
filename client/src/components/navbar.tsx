import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Bell, ChevronDown, User, Settings, LogOut, Gavel, Shield } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Notification } from "@shared/schema";

export default function Navbar() {
  const [location, setLocation] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [notificationOpen, setNotificationOpen] = useState(false);
  const queryClient = useQueryClient();

  // Get notifications based on user role
  const notificationEndpoint = user?.role === "admin" ? "/api/admin/notifications" : "/api/notifications";

  const { data: notifications = [], isLoading: notificationsLoading } = useQuery<Notification[]>({
    queryKey: [notificationEndpoint],
    enabled: !!user,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to mark notification as read");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [notificationEndpoint] });
    },
  });

  // Delete notification
  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to delete notification");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [notificationEndpoint] });
    },
  });

  // Mark all notifications as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/notifications/mark-all-read`, {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to mark all notifications as read");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [notificationEndpoint] });
    },
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      setLocation("/auth");
    } catch (error) {
      // Error handled in useAuth hook
    }
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Navigation */}
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex-shrink-0">
              <div className="flex items-center">
                <Gavel className="h-8 w-8 text-primary mr-2" />
                <div>
                  <h1 className="text-2xl font-bold text-primary">3D Auctions</h1>
                  <p className="text-xs text-secondary -mt-1">Jabodetabek</p>
                </div>
              </div>
            </Link>

            <div className="hidden md:flex space-x-6">
              <Link href="/">
                <Button
                  variant="ghost"
                  className={`text-sm font-medium ${location === '/' ? 'text-primary' : 'text-gray-600 hover:text-primary'}`}
                >
                  Beranda
                </Button>
              </Link>

              <Link href="/auctions">
                <Button
                  variant="ghost"
                  className={`text-sm font-medium ${location === '/auctions' ? 'text-primary' : 'text-gray-600 hover:text-primary'}`}
                >
                  Semua Lelang
                </Button>
              </Link>

              {/* How It Works Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="text-gray-600 hover:text-primary text-sm font-medium">
                    Cara Kerja <ChevronDown className="h-4 w-4 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64">
                  <DropdownMenuItem disabled className="text-gray-900 font-medium">
                    📋 Cara Mengikuti Lelang
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem disabled className="text-xs text-gray-600 px-3 py-2">
                    1. Daftar & login ke akun Anda
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled className="text-xs text-gray-600 px-3 py-2">
                    2. Pilih lelang yang diminati
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled className="text-xs text-gray-600 px-3 py-2">
                    3. Berikan penawaran tertinggi
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled className="text-xs text-gray-600 px-3 py-2">
                    4. Menangkan lelang & lakukan pembayaran
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem disabled className="text-gray-900 font-medium">
                    ⚠️ Syarat & Ketentuan
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled className="text-xs text-gray-600 px-3 py-2">
                    • Pemenang wajib melakukan pembayaran
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled className="text-xs text-gray-600 px-3 py-2">
                    • Verifikasi admin diperlukan
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled className="text-xs text-gray-600 px-3 py-2">
                    • Lokasi pengambilan: Jabodetabek
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <Link href="/" className="cursor-pointer">
                    🏠 Beranda
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/auctions" className="cursor-pointer">
                    🔨 Semua Lelang
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled className="text-gray-900 font-medium">
                  ❓ Cara Kerja
                </DropdownMenuItem>
                <DropdownMenuItem disabled className="text-xs text-gray-600 ml-4">
                  1. Daftar & Login → 2. Pilih Lelang → 3. Bid → 4. Menang & Bayar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* User Actions */}
          <div className="flex items-center space-x-4">

            {user ? (
              // Authenticated User Menu
              <div className="flex items-center space-x-4">
                {/* Notifications */}
                <DropdownMenu open={notificationOpen} onOpenChange={setNotificationOpen}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="relative">
                      <Bell className="h-5 w-5 text-gray-600" />
                      {unreadCount > 0 && (
                        <Badge className="absolute -top-2 -right-2 bg-destructive text-white text-xs w-5 h-5 flex items-center justify-center p-0">
                          {unreadCount > 99 ? "99+" : unreadCount}
                        </Badge>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
                    <div className="p-3 border-b">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-sm">Notifikasi</h3>
                          <p className="text-xs text-gray-500">
                            {unreadCount} notifikasi belum dibaca
                          </p>
                        </div>
                        {unreadCount > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              markAllAsReadMutation.mutate();
                            }}
                            className="text-xs h-6 px-2"
                            disabled={markAllAsReadMutation.isPending}
                          >
                            Tandai Semua
                          </Button>
                        )}
                      </div>
                    </div>

                    {notificationsLoading ? (
                      <div className="p-4 text-center text-sm text-gray-500">
                        Memuat notifikasi...
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="p-4 text-center text-sm text-gray-500">
                        Tidak ada notifikasi
                      </div>
                    ) : (
                      <div className="max-h-64 overflow-y-auto">
                        {notifications.slice(0, 10).map((notification) => {
                          let notificationData: any = {};
                          try {
                            notificationData = typeof notification.data === "string" ? JSON.parse(notification.data) : {};
                          } catch (e) {
                            notificationData = {};
                          }

                          return (
                            <div
                              key={notification.id}
                              className={`p-3 border-b last:border-b-0 hover:bg-gray-50 transition-colors ${!notification.isRead ? "bg-blue-50" : ""
                                }`}
                            >
                              <div className="flex items-start justify-between">
                                <div
                                  className="flex-1 cursor-pointer"
                                  onClick={() => {
                                    // Mark as read
                                    if (!notification.isRead) {
                                      markAsReadMutation.mutate(notification.id);
                                    }

                                    // Handle navigation based on notification type and user role
                                    if (user?.role === "admin") {
                                      // Admin navigation - only handle payment notifications
                                      if (notification.type === "payment") {
                                        setNotificationOpen(false);
                                        setLocation("/admin");
                                        // Use setTimeout to ensure navigation completes before hash change
                                        setTimeout(() => {
                                          window.location.hash = "payments";
                                        }, 100);
                                      } else {
                                        // For any other notification type, go to admin panel
                                        setNotificationOpen(false);
                                        setLocation("/admin");
                                      }
                                    } else {
                                      // Regular user navigation
                                      if (notificationData.auctionId) {
                                        // For any notification with auctionId, go to auction detail
                                        setNotificationOpen(false);
                                        setLocation(`/auction/${notificationData.auctionId}`);
                                      } else if (notification.type === "bid" || notification.type === "auction") {
                                        // For bid/auction notifications without auctionId, go to dashboard
                                        setNotificationOpen(false);
                                        setLocation("/dashboard");
                                      } else if (notification.type === "payment") {
                                        // For payment notifications, go to dashboard
                                        setNotificationOpen(false);
                                        setLocation("/dashboard");
                                      }
                                    }
                                  }}
                                >
                                  <div className="flex items-center space-x-2">
                                    <h4 className={`text-sm font-medium ${!notification.isRead ? "text-blue-900" : "text-gray-900"
                                      }`}>
                                      {notification.title}
                                    </h4>
                                    {!notification.isRead && (
                                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                    {notification.message}
                                  </p>
                                  <p className="text-xs text-gray-400 mt-1">
                                    {notification.createdAt ? new Date(notification.createdAt).toLocaleString("id-ID", {
                                      dateStyle: "short",
                                      timeStyle: "short",
                                    }) : "Tidak diketahui"}
                                  </p>
                                  {(notificationData.auctionId || notification.type === "payment" || notification.type === "bid" || notification.type === "auction") && (
                                    <p className="text-xs text-blue-600 mt-1 font-medium">
                                      📱 Klik untuk melihat detail
                                    </p>
                                  )}
                                </div>
                                <div className="flex flex-col space-y-1 ml-2">
                                  {!notification.isRead && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        markAsReadMutation.mutate(notification.id);
                                      }}
                                      className="text-xs h-6 px-2 text-blue-600 hover:text-blue-800"
                                      disabled={markAsReadMutation.isPending}
                                    >
                                      ✓ Dibaca
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteNotificationMutation.mutate(notification.id);
                                    }}
                                    className="text-xs h-6 px-2 text-red-600 hover:text-red-800"
                                    disabled={deleteNotificationMutation.isPending}
                                  >
                                    🗑️ Hapus
                                  </Button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {notifications.length > 10 && (
                      <div className="p-3 border-t text-center">
                        <Button variant="ghost" size="sm" className="text-xs">
                          Lihat Semua Notifikasi
                        </Button>
                      </div>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* User Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center space-x-2 text-gray-700 hover:text-primary">
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={user.avatar || undefined}
                          alt={`${user.firstName} ${user.lastName}`}
                        />
                        <AvatarFallback className="bg-primary text-white">
                          {user.firstName?.[0]?.toUpperCase()}{user.lastName?.[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden sm:block text-sm font-medium">
                        {user.firstName} {user.lastName}
                      </span>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    {user.role !== "admin" && (
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard" className="flex items-center cursor-pointer">
                          <User className="h-4 w-4 mr-2" />
                          Dashboard
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {user.role === "admin" && (
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="flex items-center cursor-pointer">
                          <Shield className="h-4 w-4 mr-2" />
                          Admin Panel
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild>
                      <Link href="/account-settings" className="flex items-center cursor-pointer">
                        <Settings className="h-4 w-4 mr-2" />
                        Pengaturan Akun
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      disabled={logoutMutation.isPending}
                      className="text-destructive cursor-pointer"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Keluar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              // Guest User Actions
              <div className="flex items-center space-x-3">
                <Link href="/auth">
                  <Button variant="outline" className="bg-white text-primary border-primary hover:bg-primary hover:text-white">
                    Masuk
                  </Button>
                </Link>
                <Link href="/auth">
                  <Button className="bg-primary text-white hover:bg-blue-700">
                    Daftar
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}