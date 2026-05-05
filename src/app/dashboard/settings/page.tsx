
"use client"

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { updateProfile, updatePassword, AuthError } from "firebase/auth";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUser, useAuth } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { LoaderCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const profileSchema = z.object({
  displayName: z.string().min(1, "El nombre no puede estar vacío."),
});

const passwordSchema = z.object({
  newPassword: z.string().min(6, "La contraseña debe tener al menos 6 caracteres."),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Las contraseñas no coinciden.",
  path: ["confirmPassword"],
});

type ProfileFormValues = z.infer<typeof profileSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

export default function SettingsPage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const { toast } = useToast();

  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: "",
    },
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    }
  });

  useEffect(() => {
    if (user?.displayName) {
      profileForm.setValue("displayName", user.displayName);
    }
  }, [user, profileForm]);

  const handleUpdateProfile = async (data: ProfileFormValues) => {
    if (!user) {
        toast({ variant: "destructive", title: "Error", description: "No has iniciado sesión." });
        return;
    }
    setIsProfileLoading(true);
    try {
        await updateProfile(user, { displayName: data.displayName });
        toast({ title: "Perfil Actualizado", description: "Tu nombre ha sido actualizado exitosamente." });
    } catch (error) {
        console.error("Error al actualizar el perfil:", error);
        toast({ variant: "destructive", title: "Error", description: "No se pudo actualizar tu nombre." });
    } finally {
        setIsProfileLoading(false);
    }
  };
  
  const handleUpdatePassword = async (data: PasswordFormValues) => {
     if (!user) {
        toast({ variant: "destructive", title: "Error", description: "No has iniciado sesión." });
        return;
    }
    setIsPasswordLoading(true);
    try {
        await updatePassword(user, data.newPassword);
        toast({ title: "Contraseña Actualizada", description: "Tu contraseña ha sido cambiada exitosamente." });
        passwordForm.reset();
    } catch (error: any) {
         console.error("Error al actualizar la contraseña:", error);
         let description = "No se pudo actualizar tu contraseña. Es posible que necesites volver a iniciar sesión.";
         if (error.code === 'auth/requires-recent-login') {
            description = "Por seguridad, debes volver a iniciar sesión para cambiar tu contraseña."
         }
        toast({ variant: "destructive", title: "Error al Actualizar", description });
    } finally {
        setIsPasswordLoading(false);
    }
  };


  if (isUserLoading) {
    return <p>Cargando configuración...</p>
  }

  return (
    <div className="grid gap-6 max-w-2xl mx-auto">
        <Card>
            <CardHeader>
                <CardTitle>Configuración de la Cuenta</CardTitle>
                <CardDescription>
                    Actualiza la información de tu cuenta.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={profileForm.handleSubmit(handleUpdateProfile)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="displayName">Nombre</Label>
                        <Input id="displayName" {...profileForm.register("displayName")} disabled={isProfileLoading} />
                        {profileForm.formState.errors.displayName && <p className="text-sm text-destructive">{profileForm.formState.errors.displayName.message}</p>}
                    </div>
                    <Button type="submit" disabled={isProfileLoading}>
                        {isProfileLoading && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                        Guardar Cambios
                    </Button>
                </form>
            </CardContent>
        </Card>
         <Card>
            <CardHeader>
                <CardTitle>Cambiar Contraseña</CardTitle>
                <CardDescription>
                    Actualiza tu contraseña. Por seguridad, se recomienda cambiarla periódicamente.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={passwordForm.handleSubmit(handleUpdatePassword)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="newPassword">Nueva Contraseña</Label>
                        <Input id="newPassword" type="password" {...passwordForm.register("newPassword")} disabled={isPasswordLoading} />
                        {passwordForm.formState.errors.newPassword && <p className="text-sm text-destructive">{passwordForm.formState.errors.newPassword.message}</p>}
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
                        <Input id="confirmPassword" type="password" {...passwordForm.register("confirmPassword")} disabled={isPasswordLoading} />
                        {passwordForm.formState.errors.confirmPassword && <p className="text-sm text-destructive">{passwordForm.formState.errors.confirmPassword.message}</p>}
                    </div>
                    <Button type="submit" disabled={isPasswordLoading}>
                         {isPasswordLoading && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                        Actualizar Contraseña
                    </Button>
                </form>
            </CardContent>
        </Card>
    </div>
  )
}
