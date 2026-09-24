"use client";

import { useCallback, useRef, useState } from "react";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { Trash2 } from "lucide-react";

interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  /** Action irréversible : bouton rouge et icône de corbeille */
  danger?: boolean;
}

/**
 * Remplace window.confirm() par une popup aux couleurs de la charte.
 *
 *   const { confirm, confirmDialog } = useConfirm();
 *   if (!(await confirm({ title: "Supprimer ?", danger: true }))) return;
 *   ...
 *   return <>{confirmDialog}…</>;
 */
export function useConfirm() {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((ok: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions) => {
    setOptions(opts);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const close = (ok: boolean) => {
    resolver.current?.(ok);
    resolver.current = null;
    setOptions(null);
  };

  const confirmDialog = (
    <AlertDialogPrimitive.Root open={options !== null} onOpenChange={(open) => !open && close(false)}>
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Overlay className="dash-dialog-overlay fixed inset-0 z-50" />
        <AlertDialogPrimitive.Content className="dash-dialog fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 p-6">
          <div className="flex gap-4">
            {options?.danger && (
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e5484d] text-white">
                <Trash2 className="h-5 w-5" />
              </span>
            )}
            <div className="min-w-0">
              <AlertDialogPrimitive.Title className="dash-dialog-title">
                {options?.title}
              </AlertDialogPrimitive.Title>
              {options?.description && (
                <AlertDialogPrimitive.Description className="mt-1.5 text-sm text-[#6b625c]">
                  {options.description}
                </AlertDialogPrimitive.Description>
              )}
            </div>
          </div>
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <AlertDialogPrimitive.Cancel className="dash-button dash-button-secondary justify-center rounded-full">
              Annuler
            </AlertDialogPrimitive.Cancel>
            <AlertDialogPrimitive.Action
              onClick={() => close(true)}
              className={
                options?.danger
                  ? "dash-button justify-center rounded-full bg-[#c2272d] text-white hover:bg-[#a51f24]"
                  : "dash-button dash-button-primary justify-center rounded-full"
              }
            >
              {options?.confirmLabel ?? "Confirmer"}
            </AlertDialogPrimitive.Action>
          </div>
        </AlertDialogPrimitive.Content>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  );

  return { confirm, confirmDialog };
}
