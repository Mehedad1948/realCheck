'use client';

import * as React from "react";
import { useHashParams } from "@/hooks/useHashParams"; 
import { cn } from "@/lib/utils";
import { useMediaQuery } from '@/hooks/useMediaQuery'; // Ensure this path is correct

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";

interface ResponsiveModalProps {
  identifier: string; 
  children: React.ReactNode;
  trigger?: React.ReactNode; 
  title?: string;
  description?: string;
  className?: string;
}

export function ResponsiveModal({ 
  identifier, 
  children, 
  trigger, 
  title, 
  description,
  className 
}: ResponsiveModalProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const { hashParams, setHashParams } = useHashParams();

  const isOpen = hashParams[identifier] === 'true';

  const setOpen = (open: boolean) => {
    if (open) {
      setHashParams({ [identifier]: 'true' });
    } else {
      setHashParams({ [identifier]: null });
    }
  };

  if (isDesktop) {
    return (
      <Dialog open={isOpen} onOpenChange={setOpen}>
        {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
        <DialogContent className={cn("sm:max-w-[425px]", className)}>
          <DialogHeader>
            {title && <DialogTitle>{title}</DialogTitle>}
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
          <div className="mt-2">
            {children}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={isOpen} onOpenChange={setOpen}>
      {trigger && <DrawerTrigger asChild>{trigger}</DrawerTrigger>}
      <DrawerContent>
        <DrawerHeader className="text-left">
          {title && <DrawerTitle>{title}</DrawerTitle>}
          {description && <DrawerDescription>{description}</DrawerDescription>}
        </DrawerHeader>
        
        <div className={cn("px-4 pb-4 overflow-y-auto", className)}>
          {children}
        </div>

        <DrawerFooter className="pt-2">
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
