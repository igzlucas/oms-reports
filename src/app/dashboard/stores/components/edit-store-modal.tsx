
"use client";

import { useState, useEffect } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { LoaderCircle, Upload } from "lucide-react";
import { doc, setDoc } from "firebase/firestore";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useFirebase, errorEmitter, FirestorePermissionError } from "@/firebase";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { mexicoLocations } from "@/lib/mexico-locations";
import type { Store } from "@/lib/types";

const MAX_FILE_SIZE_MB = 1;
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;

const formSchema = z.object({
  name: z.string().min(3, "El nombre de la tienda debe tener al menos 3 caracteres."),
  bannerImage: z.any().optional(),
  description: z.string().optional(),
  phone: z.string().optional(),
  whatsapp: z.string().min(10, "El número de WhatsApp es requerido y debe tener al menos 10 dígitos."),
  facebook: z.string().url().optional().or(z.literal('')),
  instagram: z.string().url().optional().or(z.literal('')),
  x: z.string().url().optional().or(z.literal('')),
  state: z.string().min(1, "El estado es requerido."),
  municipality: z.string().min(1, "El municipio/alcaldía es requerido."),
});

type FormValues = z.infer<typeof formSchema>;

interface EditStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  store: Store;
}

const createSlug = (name: string) => {
    return name
        .toLowerCase()
        .replace(/ /g, '-')
        .replace(/[^\w-]+/g, '');
};

export function EditStoreModal({ isOpen, onClose, store }: EditStoreModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedState, setSelectedState] = useState(store.state || "");
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const { toast } = useToast();
  const { firestore } = useFirebase();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    if (store) {
        form.reset({
            name: store.name,
            description: store.description,
            phone: store.phone,
            whatsapp: store.whatsapp,
            facebook: store.socials?.facebook,
            instagram: store.socials?.instagram,
            x: store.socials?.x,
            state: store.state,
            municipality: store.municipality,
        });
        setSelectedState(store.state);
        setBannerPreview(store.bannerUrl || null);
    }
  }, [store, form]);

  const handleBannerChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        toast({
            variant: "destructive",
            title: "Imagen Demasiado Grande",
            description: `El tamaño máximo es de ${MAX_FILE_SIZE_MB}MB.`
        });
        form.setValue("bannerImage", undefined);
        setBannerPreview(store.bannerUrl || null);
        if(event.target) event.target.value = "";
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setBannerPreview(store.bannerUrl || null);
    }
  };


  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    if (!firestore) {
        toast({ variant: "destructive", title: "Error", description: "Error de conexión con la base de datos." });
        return;
    }

    setIsLoading(true);

    const slug = createSlug(data.name);

    let bannerUrl = store.bannerUrl;

    if (data.bannerImage && data.bannerImage.length > 0) {
        const file = data.bannerImage[0];
        if (file.size > MAX_FILE_SIZE) {
            toast({
                variant: "destructive",
                title: "Imagen Demasiado Grande",
                description: `El tamaño máximo es de ${MAX_FILE_SIZE_MB}MB.`
            });
            setIsLoading(false);
            return;
        }
        try {
            bannerUrl = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = error => reject(error);
            });
        } catch (error) {
             console.error("Error converting new banner image to Base64:", error);
            toast({
                variant: "destructive",
                title: "Error al Procesar Imagen",
                description: "No se pudo procesar la nueva imagen del banner. Se mantendrá la imagen actual.",
            });
            setIsLoading(false);
            return;
        }
    }


    const storeData = {
        ...store, // Preserve existing fields like id and ownerId
        name: data.name,
        slug: slug,
        description: data.description,
        bannerUrl,
        phone: data.phone,
        whatsapp: data.whatsapp,
        socials: {
            facebook: data.facebook,
            instagram: data.instagram,
            x: data.x,
        },
        state: data.state,
        municipality: data.municipality,
    };
    
    const storeDocRef = doc(firestore, `stores`, store.id);
    setDoc(storeDocRef, storeData, { merge: true }).catch(error => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: storeDocRef.path,
            operation: 'update',
            requestResourceData: storeData,
        }));
    });
    
    toast({
        title: "¡Tienda Actualizada!",
        description: `${data.name} ha sido actualizada exitosamente.`,
    });
    
    setIsLoading(false);
    onClose();
  };
  
  const handleStateChange = (stateName: string) => {
    setSelectedState(stateName);
    form.setValue("state", stateName);
    form.setValue("municipality", ""); // Reset municipality when state changes
  };

  const municipalities = mexicoLocations.find(s => s.nombre === selectedState)?.municipios || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Editar Tienda</DialogTitle>
          <DialogDescription>
            Actualiza los detalles de tu tienda.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nombre de la Tienda</Label>
            <Input id="name" {...form.register("name")} />
            {form.formState.errors.name && <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>}
          </div>

           <div className="grid gap-2">
            <Label htmlFor="bannerImage">Banner de la Tienda</Label>
            {bannerPreview ? (
              <img src={bannerPreview} alt="Vista previa del banner" className="w-full h-32 object-cover rounded-md" />
            ) : (
              <div className="w-full h-32 rounded-md bg-muted flex items-center justify-center">
                  <Upload className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
            <Input
              id="bannerImage"
              type="file"
              accept="image/*"
              {...form.register("bannerImage")}
              onChange={handleBannerChange}
              disabled={isLoading}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Descripción (Opcional)</Label>
            <Textarea id="description" {...form.register("description")} />
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="grid gap-2">
                <Label htmlFor="state">Estado</Label>
                <Select onValueChange={handleStateChange} value={form.watch("state")}>
                    <SelectTrigger>
                        <SelectValue placeholder="Selecciona un estado" />
                    </SelectTrigger>
                    <SelectContent>
                        {mexicoLocations.map(state => (
                            <SelectItem key={state.nombre} value={state.nombre}>{state.nombre}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {form.formState.errors.state && <p className="text-sm text-destructive">{form.formState.errors.state.message}</p>}
             </div>
              <div className="grid gap-2">
                <Label htmlFor="municipality">Municipio / Alcaldía</Label>
                <Select {...form.register("municipality")} onValueChange={(value) => form.setValue("municipality", value)} value={form.watch("municipality")} disabled={!selectedState}>
                    <SelectTrigger>
                        <SelectValue placeholder="Selecciona un municipio" />
                    </SelectTrigger>
                    <SelectContent>
                        {municipalities.map(mun => (
                            <SelectItem key={mun.nombre} value={mun.nombre}>{mun.nombre}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                 {form.formState.errors.municipality && <p className="text-sm text-destructive">{form.formState.errors.municipality.message}</p>}
             </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="phone">Número de Teléfono (Opcional)</Label>
            <Input id="phone" type="tel" {...form.register("phone")} />
          </div>
           <div className="grid gap-2">
            <Label htmlFor="whatsapp">Número de WhatsApp</Label>
            <Input id="whatsapp" type="tel" {...form.register("whatsapp")} />
            {form.formState.errors.whatsapp && <p className="text-sm text-destructive">{form.formState.errors.whatsapp.message}</p>}
          </div>
          <div>
            <Label className="text-base">Redes Sociales (Opcional)</Label>
            <div className="grid gap-2 mt-2">
                <div className="grid gap-1">
                    <Label htmlFor="facebook" className="text-xs">URL de Facebook</Label>
                    <Input id="facebook" {...form.register("facebook")} />
                </div>
                <div className="grid gap-1">
                    <Label htmlFor="instagram" className="text-xs">URL de Instagram</Label>
                    <Input id="instagram" {...form.register("instagram")} />
                </div>
                <div className="grid gap-1">
                    <Label htmlFor="x" className="text-xs">URL de X (Twitter)</Label>
                    <Input id="x" {...form.register("x")} />
                </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
              Guardar Cambios
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
