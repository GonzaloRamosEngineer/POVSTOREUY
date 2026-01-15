'use client';

import { useState } from 'react';
import Icon from '@/components/ui/AppIcon';

interface BankTransferFormProps {
  onSubmit: () => void;
  referenceNumber: string;
}

export default function BankTransferForm({ onSubmit, referenceNumber }: BankTransferFormProps) {
  const [copied, setCopied] = useState(false);

  const bankDetails = {
    bank: 'Banco República',
    accountType: 'Cuenta Corriente',
    accountNumber: '001-123456-00001',
    accountHolder: 'POV Store Uruguay S.A.',
    rut: '217654320018',
    reference: referenceNumber
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="flex items-start gap-3 p-4 bg-accent/10 border border-accent/20 rounded-lg">
        <Icon name="InformationCircleIcon" size={20} className="text-accent flex-shrink-0 mt-0.5" variant="solid" />
        <div>
          <p className="text-sm font-medium text-foreground">
            Instrucciones de Transferencia
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Realiza la transferencia a la cuenta indicada e incluye el número de referencia. Tu pedido se procesará en 24-48 horas.
          </p>
        </div>
      </div>

      {/* Bank Details */}
      <div className="space-y-4">
        <h3 className="text-lg font-heading font-semibold text-foreground">
          Datos Bancarios
        </h3>

        <div className="space-y-3">
          {/* Bank Name */}
          <div className="p-4 bg-card border border-border rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Banco</p>
                <p className="text-sm font-medium text-foreground mt-1">
                  {bankDetails.bank}
                </p>
              </div>
              <Icon name="BuildingLibraryIcon" size={20} className="text-primary" />
            </div>
          </div>

          {/* Account Type */}
          <div className="p-4 bg-card border border-border rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Tipo de Cuenta</p>
                <p className="text-sm font-medium text-foreground mt-1">
                  {bankDetails.accountType}
                </p>
              </div>
            </div>
          </div>

          {/* Account Number */}
          <div className="p-4 bg-card border border-border rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Número de Cuenta</p>
                <p className="text-sm font-mono font-medium text-foreground mt-1">
                  {bankDetails.accountNumber}
                </p>
              </div>
              <button
                onClick={() => handleCopy(bankDetails.accountNumber)}
                className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-muted transition-smooth focus-ring"
                aria-label="Copy account number"
              >
                <Icon
                  name={copied ? 'CheckIcon' : 'ClipboardDocumentIcon'}
                  size={18}
                  className={copied ? 'text-success' : 'text-muted-foreground'}
                />
              </button>
            </div>
          </div>

          {/* Account Holder */}
          <div className="p-4 bg-card border border-border rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Titular</p>
                <p className="text-sm font-medium text-foreground mt-1">
                  {bankDetails.accountHolder}
                </p>
              </div>
            </div>
          </div>

          {/* RUT */}
          <div className="p-4 bg-card border border-border rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">RUT</p>
                <p className="text-sm font-mono font-medium text-foreground mt-1">
                  {bankDetails.rut}
                </p>
              </div>
            </div>
          </div>

          {/* Reference Number */}
          <div className="p-4 bg-primary/10 border-2 border-primary rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs text-primary font-medium">Número de Referencia (IMPORTANTE)</p>
                <p className="text-base font-mono font-bold text-primary mt-1">
                  {bankDetails.reference}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Incluye este número en el concepto de la transferencia
                </p>
              </div>
              <button
                onClick={() => handleCopy(bankDetails.reference)}
                className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-primary/20 transition-smooth focus-ring"
                aria-label="Copy reference number"
              >
                <Icon
                  name={copied ? 'CheckIcon' : 'ClipboardDocumentIcon'}
                  size={18}
                  className={copied ? 'text-success' : 'text-primary'}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-foreground">Próximos Pasos:</h4>
        <div className="space-y-2">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-6 h-6 bg-primary text-primary-foreground text-xs font-bold rounded-full flex-shrink-0">
              1
            </div>
            <p className="text-sm text-muted-foreground">
              Realiza la transferencia bancaria con los datos proporcionados
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-6 h-6 bg-primary text-primary-foreground text-xs font-bold rounded-full flex-shrink-0">
              2
            </div>
            <p className="text-sm text-muted-foreground">
              Incluye el número de referencia en el concepto
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-6 h-6 bg-primary text-primary-foreground text-xs font-bold rounded-full flex-shrink-0">
              3
            </div>
            <p className="text-sm text-muted-foreground">
              Recibirás un email de confirmación cuando procesemos tu pago
            </p>
          </div>
        </div>
      </div>

      {/* Confirm Button */}
      <button
        onClick={onSubmit}
        className="w-full px-6 py-4 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg transition-smooth focus-ring flex items-center justify-center gap-2"
      >
        <Icon name="CheckCircleIcon" size={20} className="text-primary-foreground" variant="solid" />
        Confirmar Pedido
      </button>

      {/* Support Info */}
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Icon name="QuestionMarkCircleIcon" size={16} className="text-muted-foreground" />
        <span>¿Necesitas ayuda? Contáctanos a pagos@povstore.uy</span>
      </div>
    </div>
  );
}