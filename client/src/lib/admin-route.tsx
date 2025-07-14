import { useAuth } from "@/hooks/use-auth";
import { Route, Redirect } from "wouter";
import { ComponentType } from "react";

type AdminRouteProps = {
    path: string;
    component: ComponentType<any>; // Gunakan ComponentType dari React
};

export function AdminRoute({ path, component: Component }: AdminRouteProps) {
    const { user, isLoading } = useAuth();

    return (
        <Route
            path={path}
            component={(params: any) => {
                if (isLoading) return <div>Loading...</div>;

                if (!user || user.role !== "admin") {
                    return <Redirect to="/" />;
                }

                return <Component {...params} />;
            }}
        />
    );
}
