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
import { Plus, Trash, NotebookText } from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';

const formSchema = z.object({
  name: z.string().min(2, { message: 'يجب أن يتكون اسم العنصر من حرفين على الأقل.' }),
  quantity: z.coerce.number().min(1, { message: 'يجب أن تكون الكمية 1 على الأقل.' }),
  price: z.coerce.number().min(0, { message: 'يجب أن يكون السعر رقمًا موجبًا.' }).optional(),
});

export function EssentialsManager() {
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

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
    };
    addDocumentNonBlocking(essentialsCollection, newItem);
    
    form.reset();
    toast({
      title: 'تمت إضافة العنصر',
      description: `تمت إضافة "${values.name}" إلى قائمتك.`,
    });
  }

  function deleteItem(id: string) {
    if(!user || !items) return;
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

  const totalCost = (items ?? []).reduce((total, item) => total + (item.price ?? 0) * item.quantity, 0);

  const showLoading = isUserLoading || isLoading;

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
                  <TableHead className="w-[100px] text-right">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {showLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
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
        </CardFooter>
      </Card>
    </div>
  );
}
