'use client';

import { useState, useTransition } from 'react';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { EssentialItem } from '@/lib/types';
import { getAiSuggestions } from '@/lib/actions';
import type { MonthlyEssentialsOutput } from '@/ai/flows/calculate-monthly-food-cost-and-reduction';
import { Plus, Trash, Sparkles, Loader2, NotebookText } from 'lucide-react';
import { AiResultsDialog } from './ai-results-dialog';

const formSchema = z.object({
  name: z.string().min(2, { message: 'يجب أن يتكون اسم العنصر من حرفين على الأقل.' }),
  quantity: z.coerce.number().min(1, { message: 'يجب أن تكون الكمية 1 على الأقل.' }),
});

export function EssentialsManager() {
  const [items, setItems] = useState<EssentialItem[]>([]);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [aiResult, setAiResult] = useState<MonthlyEssentialsOutput | null>(null);
  const [isDialogVisible, setDialogVisible] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      quantity: 1,
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    const newItem: EssentialItem = {
      id: crypto.randomUUID(),
      name: values.name,
      quantity: values.quantity,
    };
    setItems((prev) => [...prev, newItem]);
    form.reset();
    toast({
      title: 'تمت إضافة العنصر',
      description: `تمت إضافة "${values.name}" إلى قائمتك.`,
    });
  }

  function deleteItem(id: string) {
    const itemName = items.find((item) => item.id === id)?.name;
    setItems((prev) => prev.filter((item) => item.id !== id));
    if (itemName) {
      toast({
        title: 'تمت إزالة العنصر',
        description: `تمت إزالة "${itemName}" من قائمتك.`,
        variant: 'destructive',
      });
    }
  }

  const handleAiAnalysis = () => {
    startTransition(async () => {
      const itemNames = items.map((item) => `${item.name} (الكمية: ${item.quantity})`);
      const result = await getAiSuggestions(itemNames);
      if (result.success && result.data) {
        setAiResult(result.data);
        setDialogVisible(true);
      } else {
        toast({
          title: 'خطأ',
          description: result.error || 'فشل في الحصول على اقتراحات الذكاء الاصطناعي.',
          variant: 'destructive',
        });
      }
    });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl">المستلزمات الشهرية</CardTitle>
          <CardDescription>
            أضف عناصر إلى قائمة التسوق الشهرية.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col sm:flex-row gap-4 items-end mb-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="flex-grow">
                    <FormLabel>اسم العنصر</FormLabel>
                    <FormControl>
                      <Input placeholder="مثال: حليب" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem className="w-full sm:w-auto">
                    <FormLabel>الكمية</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" className="w-full sm:w-24" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full sm:w-auto bg-primary hover:bg-primary/90">
                <Plus />
                إضافة عنصر
              </Button>
            </form>
          </Form>

          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>العنصر</TableHead>
                  <TableHead className="w-[100px] text-center">الكمية</TableHead>
                  <TableHead className="w-[100px] text-right">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length > 0 ? (
                  items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-center">{item.quantity}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteItem(item.id)}
                          aria-label={`حذف ${item.name}`}
                        >
                          <Trash className="text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <NotebookText className="h-8 w-8" />
                        <span>لا توجد عناصر حتى الآن. أضف واحدة أعلاه للبدء.</span>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleAiAnalysis}
            disabled={isPending || items.length === 0}
            className="ml-auto bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            {isPending ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Sparkles />
            )}
            تحليل الإنفاق
          </Button>
        </CardFooter>
      </Card>
      <AiResultsDialog
        isOpen={isDialogVisible}
        onClose={() => setDialogVisible(false)}
        estimatedCost={aiResult?.estimatedCost}
        costReductionPlan={aiResult?.costReductionPlan}
      />
    </>
  );
}
