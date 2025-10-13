'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

type AiResultsDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  estimatedCost: number | undefined;
  costReductionPlan: string | undefined;
};

export function AiResultsDialog({
  isOpen,
  onClose,
  estimatedCost,
  costReductionPlan,
}: AiResultsDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline">اكتمل تحليل الذكاء الاصطناعي</DialogTitle>
          <DialogDescription>
            ها هي التكلفة الشهرية المقدرة وخطة لمساعدتك على التوفير.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-lg mb-2">التكلفة الشهرية المقدرة</h3>
            <Badge variant="secondary" className="text-xl font-bold">
              {(estimatedCost ?? 0).toFixed(2)} ر.ع.
            </Badge>
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-2">خطة خفض التكاليف</h3>
            <ScrollArea className="h-48 rounded-md border p-4 bg-muted/50">
              <p className="text-sm whitespace-pre-wrap">{costReductionPlan}</p>
            </ScrollArea>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onClose}>إغلاق</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
