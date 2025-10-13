'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Calculator } from 'lucide-react';

export function IncomeCalculator() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-headline text-2xl">حساب الدخل</h1>
        <p className="text-muted-foreground">
          أدخل مصادر دخلك لتتبع أرباحك الشهرية.
        </p>
      </div>

      <Card className="flex flex-col items-center justify-center py-24">
        <CardContent className="text-center text-muted-foreground">
          <Calculator className="mx-auto h-12 w-12 mb-4" />
          <p className="font-semibold">لم يتم تنفيذ هذه الميزة بعد.</p>
          <p>ترقبوا تحديثات حاسبة الدخل.</p>
        </CardContent>
      </Card>
    </div>
  );
}
