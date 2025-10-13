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
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Debt } from '@/lib/types';
import { Plus, Landmark, HandCoins, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';

const addDebtSchema = z.object({
  creditor: z.string().min(2, { message: 'Creditor name is required.' }),
  initialAmount: z.coerce.number().positive({ message: 'Amount must be positive.' }),
});

const addPaymentSchema = z.object({
  amount: z.coerce.number().positive({ message: 'Payment must be positive.' }),
});

function DebtCard({ debt, onAddPayment }: { debt: Debt; onAddPayment: (debtId: string, amount: number) => void }) {
  const [isPaymentDialogOpen, setPaymentDialogOpen] = useState(false);
  
  const form = useForm<z.infer<typeof addPaymentSchema>>({
    resolver: zodResolver(addPaymentSchema),
    defaultValues: { amount: 0 },
  });

  const totalPaid = debt.payments.reduce((sum, p) => sum + p.amount, 0);
  const remaining = debt.initialAmount - totalPaid;
  const progress = (totalPaid / debt.initialAmount) * 100;

  function onSubmit(values: z.infer<typeof addPaymentSchema>) {
    if (values.amount > remaining) {
      form.setError('amount', { message: `Cannot pay more than remaining $${remaining.toFixed(2)}`});
      return;
    }
    onAddPayment(debt.id, values.amount);
    form.reset();
    setPaymentDialogOpen(false);
  }

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="font-headline text-xl">{debt.creditor}</CardTitle>
        <CardDescription>
          Initial Debt: ${debt.initialAmount.toFixed(2)}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-4">
        <div>
          <div className="flex justify-between mb-1 text-sm">
            <span className="font-medium text-muted-foreground">Paid</span>
            <span className="font-medium text-primary">${totalPaid.toFixed(2)}</span>
          </div>
          <Progress value={progress} />
          <div className="text-right mt-1 text-sm font-medium">
            Remaining: ${remaining.toFixed(2)}
          </div>
        </div>
        <Separator />
         <h4 className="text-sm font-medium">Payment History</h4>
        <div className="text-sm text-muted-foreground space-y-1 max-h-24 overflow-y-auto">
          {debt.payments.length > 0 ? (
            debt.payments.map((p) => (
              <div key={p.id} className="flex justify-between">
                <span>{new Date(p.date).toLocaleDateString()}</span>
                <span>${p.amount.toFixed(2)}</span>
              </div>
            ))
          ) : (
            <p>No payments made yet.</p>
          )}
        </div>
      </CardContent>
      <CardFooter>
         <Dialog open={isPaymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={remaining <= 0}>
              <HandCoins /> {remaining > 0 ? 'Add Payment' : 'Paid in Full'}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Payment for {debt.creditor}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Amount</FormLabel>
                      <FormControl>
                         <Input type="number" placeholder="0.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="secondary">Cancel</Button>
                  </DialogClose>
                  <Button type="submit">Add Payment</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}


export function DebtManager() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [isAddDebtOpen, setAddDebtOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof addDebtSchema>>({
    resolver: zodResolver(addDebtSchema),
    defaultValues: { creditor: '', initialAmount: 0 },
  });

  function onAddDebt(values: z.infer<typeof addDebtSchema>) {
    const newDebt: Debt = {
      id: crypto.randomUUID(),
      ...values,
      payments: [],
    };
    setDebts((prev) => [...prev, newDebt]);
    form.reset();
    setAddDebtOpen(false);
    toast({
      title: 'Debt Added',
      description: `Debt to ${values.creditor} for $${values.initialAmount.toFixed(2)} has been added.`,
    });
  }
  
  function onAddPayment(debtId: string, amount: number) {
     setDebts(prevDebts => prevDebts.map(debt => {
      if (debt.id === debtId) {
        const newPayment = { id: crypto.randomUUID(), amount, date: new Date() };
        return { ...debt, payments: [...debt.payments, newPayment] };
      }
      return debt;
    }));
    toast({
      title: "Payment Added",
      description: `Payment of $${amount.toFixed(2)} recorded.`
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-2xl">Debt Tracker</h1>
          <p className="text-muted-foreground">Manage your outstanding debts and payments.</p>
        </div>
         <Dialog open={isAddDebtOpen} onOpenChange={setAddDebtOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus />
              Add New Debt
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add a New Debt</DialogTitle>
              <DialogDescription>
                Enter the details of the debt you want to track.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onAddDebt)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="creditor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Creditor Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Bank Loan" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="initialAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Initial Amount</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="secondary">Cancel</Button>
                  </DialogClose>
                  <Button type="submit">Add Debt</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {debts.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {debts.map((debt) => (
            <DebtCard key={debt.id} debt={debt} onAddPayment={onAddPayment} />
          ))}
        </div>
      ) : (
        <Card className="flex flex-col items-center justify-center py-24">
          <CardContent className="text-center text-muted-foreground">
            <Landmark className="mx-auto h-12 w-12 mb-4" />
            <p className="font-semibold">No debts tracked yet.</p>
            <p>Click "Add New Debt" to get started.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
