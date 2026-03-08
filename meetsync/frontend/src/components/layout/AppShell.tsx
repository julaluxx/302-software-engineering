import type { ReactNode } from "react";
import Topbar from "./Topbar";

type Props = {
    children: ReactNode;
};

export default function AppShell({ children }: Props) {
    return (
        <div className="app-shell">
            <Topbar />
            <main className="container">{children}</main>
        </div>
    );
}