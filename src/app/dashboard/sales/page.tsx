
"use client"

import { SalesTable } from "./components/sales-table";
import { useDashboard } from "../layout";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";

export default function SalesPage() {
    const { stores } = useDashboard();

    if (!stores || stores.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg h-96">
                <ShoppingCart className="w-16 h-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">Primero, crea una tienda</h3>
                <p className="text-muted-foreground mb-4">No puedes registrar ventas si no tienes una tienda.</p>
                <Link href="/dashboard/stores" className="text-primary underline">
                    Ir a la sección de tiendas para crear una.
                </Link>
            </div>
        )
    }
    return (
        <div>
            <SalesTable />
        </div>
    );
}
