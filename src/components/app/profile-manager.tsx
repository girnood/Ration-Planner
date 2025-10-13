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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { DollarSign, Save } from 'lucide-react';

const profileSchema = z.object({
  budget: z.coerce.number().positive({ message: 'Budget must be a positive number.' }),
});

export function ProfileManager() {
  const [budget, setBudget] = useState<number>(1000);
  const { toast } = useToast();
  const avatarImage = PlaceHolderImages.find((img) => img.id === 'profile-avatar');

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      budget: budget,
    },
  });

  function onSubmit(values: z.infer<typeof profileSchema>) {
    setBudget(values.budget);
    toast({
      title: 'Budget Updated',
      description: `Your monthly budget has been set to $${values.budget.toFixed(2)}.`,
    });
  }

  return (
    <div className="space-y-6">
       <div>
          <h1 className="font-headline text-2xl">Profile & Settings</h1>
          <p className="text-muted-foreground">Manage your budget and personal information.</p>
        </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <Avatar className="h-16 w-16">
            {avatarImage && <AvatarImage src={avatarImage.imageUrl} alt="User Avatar" data-ai-hint={avatarImage.imageHint} />}
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="font-headline text-xl">Welcome!</CardTitle>
            <CardDescription>
              Set your monthly spending target below.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-w-sm">
              <FormField
                control={form.control}
                name="budget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monthly Budget</FormLabel>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="1000.00"
                          className="pl-8"
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
                Save Budget
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
