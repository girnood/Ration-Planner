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
  CardFooter,
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
import { Goal, Save, Plus, Trash, Loader2 } from 'lucide-react';
import type { SavingsContribution } from '@/lib/types';
import { Separator } from '@/components/ui/separator';
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { setDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';


const addContributionSchema = z.object({
  contribution: z.coerce
    .number()
    .positive({ message: 'يجب أن يكون مبلغ المساهمة رقمًا موجبًا.' }),
});

const savingsGoalSchema = z.object({
  amount: z.coerce
    .number()
    .positive({ message: 'يجب أن يكون مبلغ الادخار رقمًا موجبًا.' }),
});


export function IncomeCalculator() {
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const userProfileRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'userProfiles', user.uid);
  }, [firestore, user]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<{savingsGoal?: number}>(userProfileRef);

  const contributionsCollection = useMemoFirebase(() => {
    if (!user) return null;
    // For simplicity, contributions are stored in a subcollection of userProfile.
    // This is not the most ideal structure but works for this case. A better approach would be
    // to store them under a separate top-level collection.
    return collection(firestore, 'userProfiles', user.uid, 'savingsContributions');
  }, [firestore, user]);

  const { data: contributions, isLoading: areContributionsLoading } = useCollection<SavingsContribution>(contributionsCollection);

  const goalForm = useForm<z.infer<typeof savingsGoalSchema>>({
    resolver: zodResolver(savingsGoalSchema),
    defaultValues: {
      amount: 0,
    },
  });

  const contributionForm = useForm<z.infer<typeof addContributionSchema>>({
    resolver: zodResolver(addContributionSchema),
    defaultValues: {
      contribution: 0,
    },
  });
  
  useEffect(() => {
    if (userProfile?.savingsGoal) {
      goalForm.reset({ amount: userProfile.savingsGoal });
    }
  }, [userProfile, goalForm]);


  function onGoalSubmit(values: z.infer<typeof savingsGoalSchema>) {
    if (!userProfileRef) return;
    setDocumentNonBlocking(userProfileRef, { savingsGoal: values.amount }, { merge: true });
    toast({
      title: 'تم تحديث هدف الادخار',
      description: `تم تحديد هدف الادخار السنوي بمبلغ ${values.amount.toFixed(
        2
      )} ر.ع.`,
    });
  }

  function onContributionSubmit(
    values: z.infer<typeof addContributionSchema>
  ) {
    if (!user || !contributionsCollection) return;
    const newContribution = {
      userId: user.uid,
      amount: values.contribution,
      date: new Date().toISOString(),
    };
    addDocumentNonBlocking(contributionsCollection, newContribution);
    contributionForm.reset({ contribution: 0 });
    toast({
      title: 'تمت إضافة المساهمة',
      description: `تمت إضافة مبلغ ${values.contribution.toFixed(2)} ر.ع. إلى مدخراتك.`,
    });
  }

  function deleteContribution(id: string) {
    if (!user) return;
    const contributionRef = doc(firestore, 'userProfiles', user.uid, 'savingsContributions', id);
    const contributionAmount = contributions?.find(c => c.id === id)?.amount;
    deleteDocumentNonBlocking(contributionRef);
    if (contributionAmount) {
      toast({
        title: 'تم حذف المساهمة',
        description: `تمت إزالة مساهمة بمبلغ ${contributionAmount.toFixed(2)} ر.ع.`,
        variant: 'destructive'
      });
    }
  }

  const totalSavings = contributions?.reduce(
    (sum, item) => sum + item.amount,
    0
  ) ?? 0;
  
  const showLoading = isUserLoading || isProfileLoading || areContributionsLoading;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-headline text-2xl">حساب الادخار</h1>
        <p className="text-muted-foreground">
          أدخل المبلغ الذي تهدف إلى توفيره سنويًا وسجل مساهماتك.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Goal className="h-10 w-10 text-primary" />
            <div>
              <CardTitle>هدف الادخار السنوي</CardTitle>
              <CardDescription>حدد هدف الادخار السنوي الخاص بك.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...goalForm}>
            <form
              onSubmit={goalForm.handleSubmit(onGoalSubmit)}
              className="space-y-4 max-w-sm"
            >
              <FormField
                control={goalForm.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>مبلغ الادخار السنوي</FormLabel>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground">
                        ر.ع
                      </span>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          className="pl-10"
                          {...field}
                          disabled={showLoading}
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={showLoading}>
                 {showLoading ? <Loader2 className="animate-spin" /> : <Save />}
                حفظ الهدف
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>إدارة المدخرات</CardTitle>
          <CardDescription>أضف مساهماتك في الادخar هنا.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <Form {...contributionForm}>
                <form
                  onSubmit={contributionForm.handleSubmit(onContributionSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={contributionForm.control}
                    name="contribution"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>مبلغ المساهمة الجديد</FormLabel>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground">
                            ر.ع
                          </span>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              className="pl-10"
                              {...field}
                              disabled={showLoading}
                            />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={showLoading}>
                    {showLoading ? <Loader2 className="animate-spin" /> : <Plus />}
                    إضافة مساهمة
                  </Button>
                </form>
              </Form>
            </div>
            <div>
              <h4 className="font-semibold mb-2">سجل المساهمات</h4>
               {showLoading ? (
                <div className="flex justify-center items-center h-24">
                  <Loader2 className="animate-spin" />
                </div>
              ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto rounded-md border p-2 bg-muted/50">
                {contributions && contributions.length > 0 ? (
                  contributions.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-center text-sm p-1 group"
                    >
                      <span>{new Date(item.date).toLocaleDateString()}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {item.amount.toFixed(2)} ر.ع.
                        </span>
                        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => deleteContribution(item.id)}>
                            <Trash className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    لا توجد مساهمات بعد.
                  </p>
                )}
              </div>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex-col items-start gap-2">
          <Separator className="my-2" />
          <div className="flex justify-between w-full">
            <span className="font-semibold text-lg">إجمالي المدخرات:</span>
            <span className="font-bold text-lg text-primary">
              {totalSavings.toFixed(2)} ر.ع.
            </span>
          </div>
          {userProfile?.savingsGoal && userProfile.savingsGoal > 0 && (
             <div className="flex justify-between w-full text-sm">
                <span className="text-muted-foreground">الهدف السنوي:</span>
                <span className="text-muted-foreground">{userProfile.savingsGoal.toFixed(2)} ر.ع.</span>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
