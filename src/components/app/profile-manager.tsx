'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Save, Loader2 } from 'lucide-react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';

const profileSchema = z.object({
  budget: z.coerce.number().positive({ message: 'يجب أن تكون الميزانية رقمًا موجبًا.' }),
  name: z.string().min(2, { message: 'يجب أن يتكون الاسم من حرفين على الأقل.' }).optional(),
});

export function ProfileManager() {
  const { toast } = useToast();
  const avatarImage = PlaceHolderImages.find((img) => img.id === 'profile-avatar');
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const userProfileRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'userProfiles', user.uid);
  }, [firestore, user]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<{budget: number, name?: string}>(userProfileRef);

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      budget: 1000,
      name: '',
    },
  });

  const { formState: { isSubmitting } } = form;

  useEffect(() => {
    if (userProfile) {
      form.reset({
        budget: userProfile.budget || 1000,
        name: userProfile.name || user?.displayName || '',
      });
    } else if (user) {
      form.reset({
        budget: 1000,
        name: user.displayName || '',
      });
    }
  }, [userProfile, user, form.reset]);

  async function onSubmit(values: z.infer<typeof profileSchema>) {
    if (!userProfileRef || !user) return;
    
    const profileData = {
      budget: values.budget,
      name: values.name,
      email: user.email,
      userId: user.uid,
    };

    try {
      await setDocumentNonBlocking(userProfileRef, profileData, { merge: true });

      toast({
        title: 'تم تحديث الملف الشخصي',
        description: 'تم حفظ إعداداتك بنجاح.',
      });
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast({
        title: 'حدث خطأ',
        description: 'لم نتمكن من حفظ التغييرات. يرجى المحاولة مرة أخرى.',
        variant: 'destructive',
      });
    }
  }

  const isDataLoading = isUserLoading || isProfileLoading;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-headline text-2xl">الملف الشخصي والإعدادات</h1>
        <p className="text-muted-foreground">إدارة ميزانيتك ومعلوماتك الشخصية.</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <Avatar className="h-16 w-16">
            {avatarImage && <AvatarImage src={avatarImage.imageUrl} alt="User Avatar" data-ai-hint={avatarImage.imageHint} />}
            <AvatarFallback>{userProfile?.name?.charAt(0) || user?.displayName?.charAt(0) || 'U'}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="font-headline text-xl">
              {isDataLoading ? 'جار التحميل...' : `أهلاً بك، ${userProfile?.name || user?.displayName || 'مستخدم'}!`}
            </CardTitle>
            <CardDescription>
              حدد هدف الإنفاق الشهري وأدر معلوماتك.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-w-sm">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الاسم</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="اسمك"
                        {...field}
                        disabled={isDataLoading || isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="budget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الميزانية الشهرية</FormLabel>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground">ر.ع</span>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="1000.00"
                          className="pl-10"
                          {...field}
                          disabled={isDataLoading || isSubmitting}
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isDataLoading || isSubmitting} className="w-40">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    جارِ الحفظ
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    حفظ التغييرات
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
