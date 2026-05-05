
"use client"

import { useParams, useSearchParams } from "next/navigation";
import { SaleTicketDetails } from "../components/sale-ticket-details";
import { useDashboard } from "../../layout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";
import { LoaderCircle } from "lucide-react";


export default function SaleTicketPage() {
    const params = useParams();
    const ticketId = params.ticketId as string;
    const { activeStore, isLoadingStores } = useDashboard();

    if (isLoadingStores) {
        return (
             <div className="flex justify-center items-center h-64">
                <LoaderCircle className="w-10 h-10 animate-spin text-primary" />
            </div>
        )
    }

    if (!activeStore) {
        return (
            <Alert>
                <AlertTitle>No hay Tienda Activa Seleccionada</AlertTitle>
                <AlertDescription>
                    Por favor <Link href="/dashboard/stores" className="font-bold underline">selecciona una tienda</Link> para ver los detalles del ticket.
                </AlertDescription>
            </Alert>
        )
    }

    return (
        <SaleTicketDetails ticketId={ticketId} store={activeStore} />
    );
}

