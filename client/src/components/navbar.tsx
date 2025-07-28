import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Bell, ChevronDown, User, Settings, LogOut, Gavel, Shield, X } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Notification } from "@shared/schema";

export default function Navbar() {
  const [location, setLocation] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
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

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/?search=${encodeURIComponent(searchQuery)}`);
    }
  };

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
              <Link href="/?status=active">
                <Button variant="ghost" className="text-gray-600 hover:text-primary text-sm font-medium">
                  Lelang Aktif
                </Button>
              </Link>
              <Button variant="ghost" className="text-gray-600 hover:text-primary text-sm font-medium">
                Kategori
              </Button>
              <Button variant="ghost" className="text-gray-600 hover:text-primary text-sm font-medium">
                Cara Kerja
              </Button>
            </div>
          </div>

          {/* Search and User Actions */}
          <div className="flex items-center space-x-4">
            {/* Search Bar */}
            <div className="hidden md:block">
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Cari lelang..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </form>
            </div>

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
                      <h3 className="font-semibold text-sm">Notifikasi</h3>
                      <p className="text-xs text-gray-500">
                        {unreadCount} notifikasi belum dibaca
                      </p>
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
                        {notifications.slice(0, 10).map((notification) => (
                          <div
                            key={notification.id}
                            className={`p-3 border-b last:border-b-0 hover:bg-gray-50 cursor-pointer ${
                              !notification.isRead ? "bg-blue-50" : ""
                            }`}
                            onClick={() => {
                              if (!notification.isRead) {
                                markAsReadMutation.mutate(notification.id);
                              }
                            }}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <h4 className={`text-sm font-medium ${
                                    !notification.isRead ? "text-blue-900" : "text-gray-900"
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
                                  {new Date(notification.createdAt).toLocaleString("id-ID", {
                                    dateStyle: "short",
                                    timeStyle: "short",
                                  })}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
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
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="flex items-center cursor-pointer">
                        <User className="h-4 w-4 mr-2" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
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