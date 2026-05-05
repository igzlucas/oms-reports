"use client"

import { ProductTable } from "./components/product-table";
import { useDashboard } from "@/app/dashboard/layout";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { Package } from "lucide-react";

export default function ProductsPage() {
    const { stores } = useDashboard();

    if (!stores || stores.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg h-96">
                <Package className="w-16 h-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">Primero, crea una tienda</h3>
                <p className="text-muted-foreground mb-4">No puedes gestionar productos si no tienes una tienda.</p>
                <Link href="/dashboard/stores" className="text-primary underline">
                    Ir a la sección de tiendas para crear una.
                </Link>
            </div>
        )
    }

    return (
        <div>
            <ProductTable />
        </div>
    );
}
