
"use client"

import { ProfitAnalysisForm } from "./components/profit-analysis-form";
import { useDashboard } from "../layout";
import { TrendingUp } from "lucide-react";
import Link from "next/link";

export default function ProfitBoostPage() {
     const { stores } = useDashboard();

    if (!stores || stores.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg h-96">
                <TrendingUp className="w-16 h-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">Primero, crea una tienda</h3>
                <p className="text-muted-foreground mb-4">No puedes analizar ganancias si no tienes productos en una tienda.</p>
                <Link href="/dashboard/stores" className="text-primary underline">
                    Ir a la sección de tiendas para crear una.
                </Link>
            </div>
        )
    }
    return (
        <div>
            <ProfitAnalysisForm />
        </div>
    );
}
