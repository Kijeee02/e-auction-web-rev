import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Search, Bell, ChevronDown, User, Settings, LogOut, Gavel, Shield } from "lucide-react";

export default function Navbar() {
  const [location, setLocation] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

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
                <Button variant="ghost" size="sm" className="relative">
                  <Bell className="h-5 w-5 text-gray-600" />
                  <Badge className="absolute -top-2 -right-2 bg-destructive text-white text-xs w-5 h-5 flex items-center justify-center p-0">
                    3
                  </Badge>
                </Button>

                {/* User Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center space-x-2 text-gray-700 hover:text-primary">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-primary text-white text-sm">
                          {getInitials(user.firstName, user.lastName)}
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
                    <DropdownMenuItem>
                      <Settings className="h-4 w-4 mr-2" />
                      Pengaturan
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
