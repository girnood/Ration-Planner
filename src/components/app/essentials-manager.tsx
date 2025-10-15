'use client';

import { useState, useMemo, useEffect } from 'react';
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
import { Plus, Trash, NotebookText, Sparkles, Loader2 } from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
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

const formSchema = z.object({
  name: z.string().min(2, { message: 'يجب أن يتكون اسم العنصر من حرفين على الأقل.' }),
  quantity: z.coerce.number().min(1, { message: 'يجب أن تكون الكمية 1 على الأقل.' }),
  price: z.coerce.number().min(0, { message: 'يجب أن يكون السعر رقمًا موجبًا.' }).optional(),
});

export function EssentialsManager() {
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [isAiDialogOpen, setAiDialogOpen] = useState(false);
  const [isAiProcessing, setAiProcessing] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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
  
  const sortedItems = useMemo(() => {
    return items ? [...items].sort((a, b) => {
        try {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        } catch (e) {
            return 0;
        }
    }) : [];
  }, [items]);

  const totalPages = Math.ceil(sortedItems.length / itemsPerPage);
  const paginatedItems = sortedItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);


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
                ) : paginatedItems && paginatedItems.length > 0 ? (
                  paginatedItems.map((item) => (
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
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString('ar-OM') : '-'}
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
          {totalPages > 1 && (
            <div className="flex items-center justify-end w-full gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                السابق
              </Button>
              <span className="text-sm text-muted-foreground">
                صفحة {currentPage} من {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                التالي
              </Button>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

    