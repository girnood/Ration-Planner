'use client';

import { useState, useMemo } from 'react';
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
import { Plus, Trash, NotebookText, Sparkles, Loader2, Pencil } from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { addDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
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
import { analyzeReceipt } from '@/ai/flows/analyze-receipt-flow';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip as ChartTooltip, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { format } from 'date-fns';

const formSchema = z.object({
  name: z.string().min(2, { message: 'يجب أن يتكون اسم العنصر من حرفين على الأقل.' }),
  quantity: z.coerce.number().min(1, { message: 'يجب أن تكون الكمية 1 على الأقل.' }),
  price: z.coerce.number().min(0, { message: 'يجب أن يكون السعر رقمًا موجبًا.' }).optional(),
});

function EssentialsStats({ items }: { items: EssentialItem[] }) {
  const monthlyData = useMemo(() => {
    if (!items || items.length === 0) {
      return [];
    }

    const monthlyTotals = items.reduce((acc, item) => {
      const month = format(new Date(item.createdAt), 'yyyy-MM');
      const cost = (item.price || 0) * item.quantity;
      if (!acc[month]) {
        acc[month] = 0;
      }
      acc[month] += cost;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(monthlyTotals)
      .map(([month, total]) => ({
        month: format(new Date(month), 'MMM'),
        total,
      }))
      .sort((a, b) => new Date(a.month).getMonth() - new Date(b.month).getMonth());

  }, [items]);

  if (monthlyData.length === 0) {
    return null; // Don't render the card if there's no data
  }

  const chartConfig = {
    total: {
      label: "الإجمالي",
      color: "hsl(var(--primary))",
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>الإحصائيات الشهرية</CardTitle>
        <CardDescription>نظرة عامة على إنفاقك على المستلزمات الأساسية شهريًا.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyData} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <YAxis
                tickFormatter={(value) => `${value} ر.ع`}
                tickLine={false}
                axisLine={false}
                width={80}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent
                  formatter={(value) => `${(value as number).toFixed(2)} ر.ع`}
                  labelClassName="font-bold"
                />}
              />
              <Bar dataKey="total" fill="var(--color-total)" radius={4} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}


export function EssentialsManager() {
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [isAiDialogOpen, setAiDialogOpen] = useState(false);
  const [isAiProcessing, setAiProcessing] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<EssentialItem | null>(null);

  const essentialsCollection = useMemoFirebase(() => {
    if (!user) return null;
    return collection(firestore, 'userProfiles', user.uid, 'essentials');
  }, [firestore, user]);

  const { data: items, isLoading } = useCollection<EssentialItem>(essentialsCollection);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      quantity: 1,
      price: undefined
    },
  });

  const editForm = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  function openEditDialog(item: EssentialItem) {
    setCurrentItem(item);
    editForm.reset({
      name: item.name,
      quantity: item.quantity,
      price: item.price,
    });
    setEditDialogOpen(true);
  }

  function onEditSubmit(values: z.infer<typeof formSchema>) {
    if (!user || !currentItem) return;
    const itemRef = doc(firestore, 'userProfiles', user.uid, 'essentials', currentItem.id);
    updateDocumentNonBlocking(itemRef, values);
    toast({
      title: 'تم تحديث العنصر',
      description: `تم تحديث "${values.name}" بنجاح.`,
    });
    setEditDialogOpen(false);
    setCurrentItem(null);
  }

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user || !essentialsCollection) return;

    const newItem = {
      userId: user.uid,
      name: values.name,
      quantity: values.quantity,
      price: values.price ?? 0,
      createdAt: new Date().toISOString(),
    };
    addDocumentNonBlocking(essentialsCollection, newItem);

    form.reset();
    toast({
      title: 'تمت إضافة العنصر',
      description: `تمت إضافة "${values.name}" إلى قائمتك.`,
    });
  }

  function deleteItem(id: string) {
    if (!user || !items) return;
    const itemRef = doc(firestore, 'userProfiles', user.uid, 'essentials', id);
    const itemName = items.find((item) => item.id === id)?.name;
    deleteDocumentNonBlocking(itemRef);

    if (itemName) {
      toast({
        title: 'تمت إزالة العنصر',
        description: `تمت إزالة "${itemName}" من قائمتك.`,
        variant: 'destructive',
      });
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setReceiptFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(reader.result as string);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleAiAnalyze = async () => {
    if (!receiptFile || !user || !essentialsCollection) return;
    setAiProcessing(true);
    try {
      const photoDataUri = await fileToDataUri(receiptFile);
      const { items: extractedItems } = await analyzeReceipt({ photoDataUri });
      
      extractedItems.forEach(item => {
          const newItem = {
          userId: user.uid,
          name: item.name,
          quantity: item.quantity,
          price: item.price ?? 0,
          createdAt: new Date().toISOString(),
        };
        addDocumentNonBlocking(essentialsCollection, newItem);
      });

      toast({
        title: 'اكتمل التحليل',
        description: `تمت إضافة ${extractedItems.length} عناصر من فاتورتك.`,
      });
      setAiDialogOpen(false);
      setReceiptFile(null);
      setPreviewUrl(null);

    } catch (error) {
      console.error("AI analysis failed", error);
      toast({
        title: 'فشل التحليل',
        description: 'حدث خطأ أثناء تحليل الفاتورة. يرجى المحاولة مرة أخرى.',
        variant: 'destructive',
      });
    } finally {
      setAiProcessing(false);
    }
  };

  const totalCost = (items ?? []).reduce((total, item) => total + (item.price ?? 0) * item.quantity, 0);

  const showLoading = isUserLoading || isLoading;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="font-headline text-2xl">المستلزمات الشهرية</CardTitle>
              <CardDescription>
                أضف عناصر إلى قائمة التسوق الشهرية يدويًا أو باستخدام الذكاء الاصطناعي.
              </CardDescription>
            </div>
            <Dialog open={isAiDialogOpen} onOpenChange={(isOpen) => {
              setAiDialogOpen(isOpen);
              if (!isOpen) {
                setReceiptFile(null);
                setPreviewUrl(null);
              }
            }}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Sparkles className="text-primary" />
                  تحليل الفاتورة
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>تحليل فاتورة باستخدام الذكاء الاصطناعي</DialogTitle>
                  <DialogDescription>
                    قم بتحميل صورة من فاتورتك، وسيقوم الذكاء الاصطناعي باستخلاص العناصر لك.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <Input type="file" accept="image/*" onChange={handleFileChange} disabled={isAiProcessing} />
                  {previewUrl && (
                    <div className="mt-4 rounded-md border p-2">
                      <img src={previewUrl} alt="معاينة الفاتورة" className="w-full h-auto rounded-md" />
                    </div>
                  )}
                </div>
                <DialogFooter>
                   <DialogClose asChild>
                      <Button type="button" variant="secondary" disabled={isAiProcessing}>إلغاء</Button>
                    </DialogClose>
                  <Button onClick={handleAiAnalyze} disabled={!receiptFile || isAiProcessing}>
                    {isAiProcessing ? <Loader2 className="animate-spin" /> : <Sparkles />}
                    {isAiProcessing ? 'جاري التحليل...' : 'تحليل'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
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
              <Button type="submit" className="w-full sm:w-auto bg-primary hover:bg-primary/90" disabled={!user}>
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
                  <TableHead className="w-[150px] text-center">تاريخ الإضافة</TableHead>
                  <TableHead className="w-[100px] text-right">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {showLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      جارٍ تحميل البيانات...
                    </TableCell>
                  </TableRow>
                ) : items && items.length > 0 ? (
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
                       <TableCell className="text-center">
                        {new Date(item.createdAt).toLocaleDateString('ar-OM')}
                      </TableCell>
                      <TableCell className="text-right">
                         <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(item)}
                          aria-label={`تعديل ${item.name}`}
                          className="mr-2"
                        >
                          <Pencil className="text-blue-500" />
                        </Button>
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
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
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
        </CardFooter>
      </Card>
      
      {items && <EssentialsStats items={items} />}

      {/* Edit Item Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعديل العنصر</DialogTitle>
            <DialogDescription>
              قم بتحديث تفاصيل العنصر أدناه.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>اسم العنصر</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>السعر (اختياري)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الكمية</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="secondary">إلغاء</Button>
                </DialogClose>
                <Button type="submit">حفظ التغييرات</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

    