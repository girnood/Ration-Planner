'use client';

import { useState, useTransition, useEffect, useMemo } from 'react';
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
import { Plus, Trash, Sparkles, Loader2, NotebookText, BarChart2 } from 'lucide-react';
import { AiResultsDialog } from './ai-results-dialog';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';


const formSchema = z.object({
  name: z.string().min(2, { message: 'يجب أن يتكون اسم العنصر من حرفين على الأقل.' }),
  quantity: z.coerce.number().min(1, { message: 'يجب أن تكون الكمية 1 على الأقل.' }),
  price: z.coerce.number().min(0, { message: 'يجب أن يكون السعر رقمًا موجبًا.' }).optional(),
});

export function EssentialsManager() {
  const [items, setItems] = useState<EssentialItem[]>([]);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [aiResult, setAiResult] = useState<MonthlyEssentialsOutput | null>(null);
  const [isDialogVisible, setDialogVisible] = useState(false);

  useEffect(() => {
    const storedItems = localStorage.getItem('essentialItems');
    if (storedItems) {
      try {
        setItems(JSON.parse(storedItems));
      } catch (error) {
        console.error("Failed to parse essential items from localStorage", error);
        setItems([]);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('essentialItems', JSON.stringify(items));
  }, [items]);
  
  const chartData = useMemo(() => {
    return items
      .filter(item => item.price !== undefined && item.price > 0)
      .map(item => ({
        name: item.name,
        cost: (item.price ?? 0) * item.quantity,
      }));
  }, [items]);

  const chartConfig = {
    cost: {
      label: 'التكلفة',
      color: 'hsl(var(--primary))',
    },
  } satisfies ChartConfig;


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      quantity: 1,
      price: undefined
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    const newItem: EssentialItem = {
      id: crypto.randomUUID(),
      name: values.name,
      quantity: values.quantity,
      price: values.price,
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
      const itemNames = items.map((item) => {
        let text = `${item.name} (الكمية: ${item.quantity})`;
        if (item.price !== undefined) {
          text += ` (السعر: ${item.price.toFixed(2)} ر.ع.)`
        }
        return text;
      });
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

  const totalCost = items.reduce((total, item) => total + (item.price ?? 0) * item.quantity, 0);

  return (
    <div className="space-y-6">
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
                name="price"
                render={({ field }) => (
                  <FormItem className="w-full sm:w-32">
                    <FormLabel>السعر (اختياري)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem className="w-full sm:w-24">
                    <FormLabel>الكمية</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" className="w-full" {...field} />
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
                  <TableHead className="w-[120px] text-center">السعر الفردي</TableHead>
                  <TableHead className="w-[100px] text-center">الكمية</TableHead>
                  <TableHead className="w-[120px] text-center">السعر الإجمالي</TableHead>
                  <TableHead className="w-[100px] text-right">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length > 0 ? (
                  items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-center">
                        {item.price !== undefined ? `${item.price.toFixed(2)} ر.ع.` : '-'}
                      </TableCell>
                      <TableCell className="text-center">{item.quantity}</TableCell>
                      <TableCell className="text-center">
                        {item.price !== undefined ? `${(item.price * item.quantity).toFixed(2)} ر.ع.` : '-'}
                      </TableCell>
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
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
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
        <CardFooter className="flex-col items-start gap-4">
           <div className="flex justify-between w-full">
            <span className="font-semibold text-lg">التكلفة الإجمالية:</span>
            <span className="font-bold text-lg text-primary">{totalCost.toFixed(2)} ر.ع.</span>
          </div>
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
      {chartData.length > 0 && (
         <Card>
          <CardHeader>
            <CardTitle className="font-headline text-2xl flex items-center gap-2">
                <BarChart2 />
                إحصائيات الإنفاق
            </CardTitle>
            <CardDescription>
                رسم بياني يوضح توزيع تكلفة المستلزمات الشهرية.
            </CardDescription>
          </CardHeader>
          <CardContent>
              <ChartContainer config={chartConfig} className="w-full h-[250px]">
                <BarChart accessibilityLayer data={chartData} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis 
                        dataKey="name" 
                        tickLine={false} 
                        axisLine={false} 
                        tickMargin={8} 
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    />
                    <YAxis 
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        tickFormatter={(value) => `${value} ر.ع.`}
                    />
                    <Tooltip
                        cursor={false}
                        content={<ChartTooltipContent 
                            formatter={(value) => `${Number(value).toFixed(2)} ر.ع.`}
                            indicator="dot"
                        />}
                        
                    />
                    <Bar dataKey="cost" fill="hsl(var(--primary))" radius={4} />
                </BarChart>
              </ChartContainer>
          </CardContent>
        </Card>
      )}
      <AiResultsDialog
        isOpen={isDialogVisible}
        onClose={() => setDialogVisible(false)}
        estimatedCost={aiResult?.estimatedCost}
        costReductionPlan={aiResult?.costReductionPlan}
      />
    </div>
  );
}
