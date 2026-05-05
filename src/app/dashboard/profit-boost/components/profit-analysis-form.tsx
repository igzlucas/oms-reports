
"use client"

import { useState, useMemo } from "react"
import { useForm, SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { TrendingUp, LoaderCircle } from "lucide-react"
import { collection, query, where } from "firebase/firestore"

import { generateProfitAnalysis, ProfitAnalysisOutput } from "@/ai/flows/profit-analysis-flow"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Product } from "@/lib/types"
import { useCollection, useFirebase } from "@/firebase"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { useDashboard } from "../../layout"

const formSchema = z.object({
  productId: z.string().min(1, { message: "Por favor, selecciona un producto." }),
  desiredProfitMargin: z.coerce.number().min(1, { message: "El margen de ganancia debe ser al menos 1%." }).max(1000, { message: "El margen de ganancia parece demasiado alto." }),
  competitorPrice: z.coerce.number().min(0, { message: "El precio de la competencia no puede ser negativo." }).optional(),
  demandAdjustment: z.coerce.number().optional(),
})

type FormValues = z.infer<typeof formSchema>

export function ProfitAnalysisForm() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [analysisResult, setAnalysisResult] = useState<ProfitAnalysisOutput | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const { firestore, user } = useFirebase();
  const { activeStore } = useDashboard();

  const productsQuery = useMemo(() => {
    if (!user || !activeStore) return null;
    return query(collection(firestore, `products`), where("storeId", "==", activeStore.id));
  }, [user, firestore, activeStore]);

  const { data: products, isLoading: isLoadingProducts } = useCollection<Product>(productsQuery);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productId: "",
      desiredProfitMargin: 20,
      competitorPrice: "" as unknown as undefined,
      demandAdjustment: "" as unknown as undefined,
    },
  })

  const handleProductChange = (productId: string) => {
    const product = products?.find((p) => p.id === productId)
    setSelectedProduct(product || null)
  }

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    if (!selectedProduct) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Por favor, selecciona un producto primero.",
      })
      return
    }

    setIsLoading(true)
    setAnalysisResult(null)

    try {
      const result = await generateProfitAnalysis({
        productName: selectedProduct.name,
        costPrice: selectedProduct.costPrice || 0,
        sellingPrice: selectedProduct.price,
        desiredProfitMargin: data.desiredProfitMargin,
        competitorPrice: data.competitorPrice,
        demandAdjustment: data.demandAdjustment,
      })
      setAnalysisResult(result)
    } catch (error) {
      console.error("Error al generar el análisis de ganancias:", error)
      toast({
        variant: "destructive",
        title: "Análisis Fallido",
        description: "Ocurrió un error al generar el análisis. Por favor, inténtalo de nuevo.",
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  if (!activeStore) {
    return (
        <div className="text-center p-8">
            <Alert>
                <AlertTitle>No hay Tienda Activa Seleccionada</AlertTitle>
                <AlertDescription>
                    Por favor <Link href="/dashboard/stores" className="font-bold underline">selecciona una tienda</Link> para analizar las ganancias.
                </AlertDescription>
            </Alert>
        </div>
    )
  }

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Análisis de Ganancias</CardTitle>
          <CardDescription>Completa los detalles para obtener una estrategia de precios impulsada por IA.</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="grid gap-4">
              <FormField
                control={form.control}
                name="productId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Producto</FormLabel>
                    <Select onValueChange={(value) => {
                      field.onChange(value)
                      handleProductChange(value)
                    }} defaultValue={field.value} disabled={isLoadingProducts}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un producto" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {isLoadingProducts ? (
                            <SelectItem value="loading" disabled>Cargando productos...</SelectItem>
                        ) : (
                            products?.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                                {p.name}
                            </SelectItem>
                            ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {selectedProduct && (
                <div className="text-sm text-muted-foreground grid grid-cols-2 gap-4">
                    <div>Tu Costo (Compra): <strong>${(selectedProduct.costPrice || 0).toFixed(2)}</strong></div>
                    <div>Tu Precio (Venta): <strong>${selectedProduct.price.toFixed(2)}</strong></div>
                </div>
              )}
               <FormField
                control={form.control}
                name="desiredProfitMargin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Margen de Ganancia Deseado (%)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="ej., 20" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="competitorPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precio de la Competencia (Opcional)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="ej., 150.00" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="demandAdjustment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ajuste de Precio por Demanda (%) (Opcional)</FormLabel>
                    <FormControl>
                      <Input type="number" step="1" placeholder="ej., 15 si la demanda permite subir el precio un 15%" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isLoading || !selectedProduct} className="w-full">
                {isLoading ? (
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <TrendingUp className="mr-2 h-4 w-4" />
                )}
                Generar Análisis
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
      
      <div className="flex items-center justify-center">
        {isLoading && (
          <Card className="w-full flex flex-col items-center justify-center min-h-[300px] border-dashed">
            <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">La IA está analizando los datos...</p>
          </Card>
        )}
        {!isLoading && analysisResult && (
          <Card className="w-full border-primary bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-primary" />
                Resultado del Análisis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="text-center">
                 <p className="text-sm text-muted-foreground">Precio de Venta Sugerido</p>
                 <p className="text-4xl font-bold text-primary">${analysisResult.suggestedSellingPrice.toFixed(2)}</p>
               </div>
               <div className="text-center">
                 <p className="text-sm text-muted-foreground">Ganancia Proyectada por Unidad</p>
                 <p className="text-2xl font-semibold">${analysisResult.projectedProfitPerUnit.toFixed(2)}</p>
               </div>
               <Alert>
                <AlertTitle>Análisis de la IA</AlertTitle>
                <AlertDescription>
                    {analysisResult.analysisMessage}
                </AlertDescription>
               </Alert>
            </CardContent>
          </Card>
        )}
        {!isLoading && !analysisResult && (
             <Card className="w-full flex flex-col items-center justify-center min-h-[300px] border-dashed">
                <TrendingUp className="h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-muted-foreground text-center">Tu análisis de precios y ganancias aparecerá aquí.</p>
             </Card>
        )}
      </div>
    </div>
  )
}
