'use client';

import { useState } from 'react';
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
import { PiggyBank, Save } from 'lucide-react';

const savingsSchema = z.object({
  amount: z.coerce.number().positive({ message: 'يجب أن يكون مبلغ الادخار رقمًا موجبًا.' }),
});

export function IncomeCalculator() {
  const [savings, setSavings] = useState<number>(0);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof savingsSchema>>({
    resolver: zodResolver(savingsSchema),
    defaultValues: {
      amount: savings,
    },
  });

   function onSubmit(values: z.infer<typeof savingsSchema>) {
    setSavings(values.amount);
    form.reset({ amount: values.amount });
    toast({
      title: 'تم تحديث المدخرات',
      description: `تم تحديد مدخراتك الشهرية بمبلغ ${values.amount.toFixed(2)} ر.ع.`,
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-headline text-2xl">حساب الادخار</h1>
        <p className="text-muted-foreground">
          أدخل المبلغ الذي تهدف إلى توفيره شهريًا.
        </p>
      </div>

      <Card>
        <CardHeader>
           <div className="flex items-center gap-4">
            <PiggyBank className="h-10 w-10 text-primary" />
            <div>
              <CardTitle>مدخراتك الشهرية</CardTitle>
              <CardDescription>
                حدد هدف الادخار الشهري الخاص بك.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-w-sm">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>مبلغ الادخار الشهري</FormLabel>
                     <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground">ر.ع</span>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0.00"
                            className="pl-10"
                            {...field}
                          />
                        </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit">
                <Save />
                حفظ مبلغ الادخار
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
       {savings > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>الادخار الحالي</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">{savings.toFixed(2)} ر.ع.</p>
            <p className="text-muted-foreground">هذا هو المبلغ الذي تخطط لتوفيره كل شهر.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
