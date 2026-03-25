'use client';

import Icon from '@/components/ui/AppIcon';
// IMPORTAMOS EL DICCIONARIO
import { checkoutMessages } from '@/messages/checkoutMessages';

interface BankTransferFormProps {
  onSubmit: () => void; 
  referenceNumber: string;
  isProcessing: boolean;
}

export default function BankTransferForm({ referenceNumber, onSubmit, isProcessing }: BankTransferFormProps) {
  const { bankTransferForm } = checkoutMessages;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      
      {/* Tarjeta de Beneficio */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 text-center shadow-sm relative overflow-hidden">
        {/* Decoración de fondo */}
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-green-200/50 rounded-full blur-2xl"></div>
        
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-md mb-4 border border-green-100">
             <Icon name="BanknotesIcon" size={32} className="text-green-600" />
          </div>
          
          <h3 className="text-xl font-heading font-bold text-green-900 mb-2">
            {bankTransferForm.benefitTitle}
          </h3>
          
          <p className="text-green-700 text-sm max-w-xs mx-auto mb-6">
            {bankTransferForm.benefitDesc}
          </p>

          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-green-200 shadow-sm mb-2">
             <Icon name="TagIcon" size={18} className="text-green-600" variant="solid" />
             <span className="font-bold text-green-800">{bankTransferForm.discountApplied}</span>
          </div>
        </div>
      </div>

      {/* Explicación Simple */}
      <div className="flex items-start gap-3 px-2">
        <Icon name="InformationCircleIcon" size={20} className="text-gray-400 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-gray-500">
          {bankTransferForm.explanationPrefix}
          <strong>{bankTransferForm.explanationBold}</strong>
        </p>
      </div>

      {/* Botón de Acción Principal */}
      <button
        onClick={onSubmit}
        disabled={isProcessing}
        className="group relative w-full flex items-center justify-center gap-3 px-6 py-4 bg-[#25D366] hover:bg-[#1ebd59] text-white font-bold text-lg rounded-xl transition-all duration-300 shadow-lg shadow-green-200 hover:shadow-green-300 hover:-translate-y-1 disabled:opacity-70 disabled:cursor-wait"
      >
        {isProcessing ? (
          <>
            <Icon name="ArrowPathIcon" size={24} className="animate-spin" />
            <span>{bankTransferForm.processing}</span>
          </>
        ) : (
          <>
            <Icon name="ChatBubbleLeftRightIcon" size={28} className="text-white" />
            <span>{bankTransferForm.payButton}</span>
            <Icon name="ArrowRightIcon" size={20} className="group-hover:translate-x-1 transition-transform" />
          </>
        )}
      </button>

      <p className="text-center text-xs text-gray-400">
        {bankTransferForm.referenceLabel} <span className="font-mono font-bold text-gray-600">{referenceNumber}</span>
      </p>

    </div>
  );
}