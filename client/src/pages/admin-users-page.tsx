import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
import { useLocation } from "wouter";

type User = {
    id: string;
    username: string;
    email: string;
    role: string;
};

export default function AdminUsersPage() {
    const { user } = useAuth();
    const [, setLocation] = useLocation();

    // Redirect kalau bukan admin
    useEffect(() => {
        if (user && user.role !== "admin") {
            setLocation("/");
        }
    }, [user, setLocation]);

    const { data: users, isLoading, error } = useQuery<User[], Error>({
        queryKey: ["admin-users"],
        queryFn: async () => {
            const res = await fetch("/api/admin/users");
            if (!res.ok) throw new Error("Gagal memuat data user");
            return await res.json();
        },
    });


    if (isLoading) return <div className="p-6">Memuat data pengguna...</div>;
    if (error) return <div className="p-6 text-red-500">Gagal memuat data: {(error as Error).message}</div>;

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Kelola Pengguna</h1>
            <table className="w-full border-collapse">
                <thead>
                    <tr className="border-b bg-gray-100">
                        <th className="text-left p-2">Username</th>
                        <th className="text-left p-2">Email</th>
                        <th className="text-left p-2">Role</th>
                        <th className="text-left p-2">Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    {users?.map((u: User) => (
                        <tr key={u.id}>
                            <td>{u.username}</td>
                            <td>{u.email}</td>
                            <td>{u.role}</td>
                            <td>...</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
