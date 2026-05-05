"use client";

import { useState, useMemo } from 'react';
import { Star, MessageCircle, Send, LoaderCircle, User, LogIn, BadgeCheck, MessageSquareQuote, ShieldCheck, Heart, CheckCircle2, Award } from 'lucide-react';
import { setDoc, doc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';
import { getAuth } from 'firebase/auth';

import { useUser, useFirebase, useDoc } from '@/firebase';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Rating, Store, UserProfile } from '@/lib/types';
import { cn } from '@/lib/utils';

interface StoreReviewsProps {
  store: Store;
  reviews?: Rating[] | null;
}

export function StoreReviews({ store, reviews }: StoreReviewsProps) {
  const { user, isUserLoading: isAuthLoading } = useUser();
  const { firestore } = useFirebase();
  const { toast } = useToast();

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [isReplying, setIsReplying] = useState<Record<string, boolean>>({});

  const userProfileRef = useMemo(() => {
    if (!user?.uid || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [user?.uid, firestore]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  const isStoreOwner = useMemo(() => {
    return user && store && user.uid === store.ownerId;
  }, [user, store]);

  const hasAlreadyReviewed = useMemo(() => {
    return !!user && !!reviews && reviews.some(r => r.userId === user.uid);
  }, [user, reviews]);

  const isMetadataLoading = isAuthLoading || isProfileLoading;
  
  const canReview = !!user && !isStoreOwner && !hasAlreadyReviewed;
  const isVisitorSeller = userProfile?.role === 'seller' && !isStoreOwner;

  const handleSubmitReview = async () => {
    if (!user || !firestore || !store.id) return;
  
    if (isStoreOwner) {
      toast({
        variant: 'destructive',
        title: 'Acción no permitida',
        description: 'No puedes calificar tu propia tienda.',
      });
      return;
    }

    if (hasAlreadyReviewed) {
        toast({
          variant: 'destructive',
          title: 'Ya has calificado',
          description: 'Solo se permite una calificación por usuario para cada tienda.',
        });
        return;
      }
  
    if (rating < 1 || rating > 5) {
      toast({
        variant: 'destructive',
        title: 'Selecciona una puntuación',
        description: 'Por favor, elige cuántas estrellas quieres dar.',
      });
      return;
    }
  
    setIsSubmitting(true);
  
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      
      if (currentUser) {
        await currentUser.getIdToken(true);
      }
  
      const reviewId = uuidv4();
      
      // Priorizar el nombre real: Perfil de Firestore > Nombre de Auth > Email
      const finalUserName = userProfile?.displayName || user.displayName || user.email?.split('@')[0] || 'Miembro de Mi Bazar';
  
      const reviewData: Rating = {
        id: reviewId,
        storeId: store.id,
        userId: user.uid,
        userName: finalUserName,
        userRole: userProfile?.role || 'buyer',
        rating: rating,
        date: new Date().toISOString(),
      };
  
      const cleanComment = comment.trim();
      if (cleanComment) {
        reviewData.comment = cleanComment;
      }
  
      const reviewRef = doc(firestore, 'stores', store.id, 'ratings', reviewId);
      await setDoc(reviewRef, reviewData);
      
      setRating(0);
      setComment("");
      toast({ 
        title: "¡Gracias!", 
        description: "Tu calificación ha sido publicada con éxito." 
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error al publicar',
        description: 'No se pudo guardar tu opinión. Inténtalo de nuevo.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReply = async (reviewId: string) => {
    if (!firestore || !replyText[reviewId] || !isStoreOwner) return;

    setIsReplying(prev => ({ ...prev, [reviewId]: true }));
    try {
        const replyData = {
            ownerReply: replyText[reviewId].trim(),
            replyDate: new Date().toISOString(),
        };

        const reviewDocRef = doc(firestore, 'stores', store.id, 'ratings', reviewId);
        await setDoc(reviewDocRef, replyData, { merge: true });
        
        toast({ title: 'Respuesta publicada', description: 'Tu respuesta oficial ha sido añadida.' });
        setReplyText(prev => ({ ...prev, [reviewId]: "" }));
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudo publicar la respuesta.' });
    } finally {
        setIsReplying(prev => ({ ...prev, [reviewId]: false }));
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-8">
        {!isMetadataLoading && canReview && (
          <Card className="border-primary/20 bg-white shadow-md rounded-[2rem] overflow-hidden">
            <CardHeader className="bg-primary/5 border-b border-primary/10">
              <CardTitle className="text-xl font-black text-primary flex items-center gap-2">
                {isVisitorSeller ? <Award className="h-5 w-5 fill-primary" /> : <Star className="h-5 w-5 fill-primary" />}
                {isVisitorSeller ? '¡Tu opinión como Socio Destacado!' : '¡Tu opinión importa!'}
              </CardTitle>
              <CardDescription className="text-muted-foreground font-bold">
                {isVisitorSeller 
                  ? `Hola ${userProfile?.displayName || 'Socio'}, tu recomendación para "${store.name}" fortalece nuestra comunidad profesional.`
                  : `Comparte tu experiencia con "${store.name}" para ayudar a otras compradoras.`}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 pl-1">Calificación</label>
                <div className="flex gap-2 p-4 bg-slate-50 rounded-2xl w-fit border shadow-inner">
                    {[1, 2, 3, 4, 5].map((s) => (
                    <button
                        key={s}
                        type="button"
                        onClick={() => setRating(s)}
                        className="focus:outline-none transition-all active:scale-90 hover:scale-110"
                    >
                        <Star className={cn("h-10 w-10 transition-colors", rating >= s ? "fill-primary text-primary" : "text-slate-200")} />
                    </button>
                    ))}
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 pl-1">Comentario (Opcional)</label>
                <Textarea
                    placeholder="Cuéntanos tu experiencia o simplemente deja tu calificación..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="min-h-[120px] bg-white border-slate-200 focus-visible:ring-primary rounded-2xl shadow-sm resize-none"
                />
              </div>

              <Button onClick={handleSubmitReview} disabled={isSubmitting || rating === 0} className="w-full sm:w-auto shadow-lg rounded-full px-10 h-12 font-black uppercase tracking-tighter">
                {isSubmitting ? <LoaderCircle className="mr-2 h-5 w-5 animate-spin" /> : <Send className="mr-2 h-5 w-5" />}
                Publicar Opinión
              </Button>
            </CardContent>
          </Card>
        )}

        {!isMetadataLoading && hasAlreadyReviewed && !isStoreOwner && (
          <Card className="bg-primary/5 border-2 border-primary/10 rounded-[2rem] shadow-sm overflow-hidden">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <CheckCircle2 className="h-10 w-10 text-primary" />
              </div>
              <p className="text-primary text-xl font-black uppercase tracking-tighter mb-2">¡Gracias por tu participación!</p>
              <p className="text-muted-foreground font-medium max-w-md">Ya has calificado esta tienda. Tu opinión ayuda a mantener la integridad y confianza en la comunidad de Mi Bazar.</p>
            </CardContent>
          </Card>
        )}

        {!isMetadataLoading && isStoreOwner && (
          <Card className="bg-primary/5 border-2 border-dashed border-primary/20 rounded-[2rem] shadow-sm">
            <CardContent className="flex flex-col items-center justify-center py-10 text-center">
              <BadgeCheck className="h-12 w-12 text-primary mb-4" />
              <p className="text-primary text-xl font-black uppercase tracking-tighter mb-2">Tu Centro de Reputación</p>
              <p className="text-muted-foreground font-medium max-w-md">Responde a tus clientas para generar más confianza en la comunidad de Mi Bazar.</p>
            </CardContent>
          </Card>
        )}

        {!isMetadataLoading && !user && (
          <Card className="bg-white border-2 border-dashed border-muted rounded-[2rem] shadow-sm">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-20 w-20 rounded-full bg-slate-50 flex items-center justify-center mb-6 text-slate-200 shadow-inner">
                <User className="h-10 w-10" />
              </div>
              <p className="text-slate-800 text-xl font-black uppercase tracking-tighter mb-2">¡Únete a la conversación!</p>
              <p className="text-slate-500 font-medium mb-8 max-w-md">Inicia sesión para calificar esta tienda y ayudar a crecer a la comunidad.</p>
              <Button asChild className="rounded-full px-10 h-12 font-black uppercase tracking-tighter shadow-md">
                  <Link href="/login">
                      <LogIn className="mr-2 h-5 w-5" />
                      Ingresar a Calificar
                  </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="space-y-8">
        <div className="flex items-center justify-between border-b-2 border-slate-100 pb-6">
            <h3 className="text-2xl font-black flex items-center gap-3 text-slate-900 tracking-tighter">
                <MessageCircle className="h-8 w-8 text-primary" />
                Voces de la Comunidad
            </h3>
            {reviews && reviews.length > 0 && (
                <Badge className="rounded-full font-black px-4 py-1 bg-primary text-white border-none shadow-sm">
                    {reviews.length} {reviews.length === 1 ? 'Opinión' : 'Opiniones'}
                </Badge>
            )}
        </div>
        
        {reviews && reviews.length > 0 ? (
          <div className="grid gap-8">
            {[...reviews].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((review) => (
              <div key={review.id} className="bg-white rounded-[2rem] border border-slate-100 p-8 space-y-6 shadow-sm hover:shadow-xl transition-all duration-300">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-full bg-primary/5 flex items-center justify-center border-2 border-white shadow-md">
                      <User className="h-7 w-7 text-primary/40" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-black text-slate-900 text-lg tracking-tight">
                        {review.userName === 'Vendedor' ? 'Socio Mi Bazar' : (review.userName || 'Miembro de Mi Bazar')}
                        </p>
                        <Badge className={cn(
                          "border-none text-[10px] font-black uppercase px-2 py-0.5 rounded-lg flex items-center gap-1 shadow-sm",
                          review.userRole === 'seller' ? "bg-primary text-white" : "bg-slate-100 text-slate-600"
                        )}>
                          {review.userRole === 'seller' && <Award className="h-3 w-3 mr-1" />}
                          {review.userRole === 'seller' ? 'Vendedor' : 'Compradora'}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-widest">
                        {review.date ? format(new Date(review.date), "d 'de' MMMM, yyyy", { locale: es }) : 'Hace un momento'}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1 bg-primary/5 p-2 rounded-2xl border border-primary/10 shadow-inner">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className={cn("h-4 w-4", review.rating >= s ? "fill-primary text-primary" : "text-slate-200")} />
                    ))}
                  </div>
                </div>
                
                <div className="relative pl-4">
                    <MessageSquareQuote className="h-12 w-12 text-primary/5 absolute -top-4 -left-4" />
                    <p className="text-slate-700 leading-relaxed font-medium text-lg relative z-10">
                        {review.comment || <span className="italic text-muted-foreground/60 text-sm">Calificó la tienda con {review.rating} estrellas.</span>}
                    </p>
                </div>

                {review.ownerReply && (
                  <div className="ml-4 md:ml-12 bg-slate-50 rounded-3xl p-6 border-l-8 border-primary shadow-sm space-y-3 transition-transform hover:scale-[1.01]">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-primary" />
                      <span className="text-xs font-black text-slate-900 uppercase tracking-tighter">Respuesta Oficial de {store.name}</span>
                      <Badge className="bg-primary/10 text-primary border-none text-[9px] font-black px-2 py-0.5 rounded-lg uppercase tracking-widest">Verificada</Badge>
                    </div>
                    <p className="text-slate-600 italic font-medium leading-relaxed">"{review.ownerReply}"</p>
                  </div>
                )}

                {isStoreOwner && !review.ownerReply && (
                  <div className="ml-4 md:ml-12 space-y-4 bg-primary/5 p-6 rounded-3xl border-2 border-dashed border-primary/20">
                    <label className="text-[10px] font-black uppercase tracking-widest text-primary/60 pl-1">Escribe tu respuesta oficial</label>
                    <Textarea
                      placeholder="Agradece el comentario o responde dudas..."
                      value={replyText[review.id] || ""}
                      onChange={(e) => setReplyText(prev => ({ ...prev, [review.id]: e.target.value }))}
                      className="text-sm min-h-[100px] bg-white border-slate-200 rounded-2xl shadow-inner resize-none"
                    />
                    <div className="flex justify-end">
                      <Button 
                        size="sm"
                        onClick={() => handleReply(review.id)}
                        disabled={isReplying[review.id] || !replyText[review.id]?.trim()}
                        className="rounded-full font-black text-xs px-6 shadow-md"
                      >
                        {isReplying[review.id] ? <LoaderCircle className="h-4 w-4 animate-spin mr-2" /> : <BadgeCheck className="h-4 w-4 mr-2" />}
                        Publicar Respuesta Oficial
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 border-4 border-dashed rounded-[3rem] bg-white/50 border-slate-100 shadow-inner">
            <MessageCircle className="h-16 w-16 text-slate-200 mx-auto mb-6" />
            <p className="text-slate-400 font-black text-xl uppercase tracking-tighter mb-2">Sin opiniones todavía</p>
            <p className="text-slate-300 font-bold uppercase text-xs tracking-widest">Sé la primera en compartir tu experiencia MB.</p>
          </div>
        )}
      </div>
    </div>
  );
}
