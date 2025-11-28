import React, { useState } from 'react';
import { IAP_PRODUCTS } from '../constants';
import { X, CreditCard, Coins, CheckCircle } from 'lucide-react';
import { IAPProduct } from '../types';

interface IAPModalProps {
    onClose: () => void;
    onPurchase: (amount: number) => void;
}

const IAPModal: React.FC<IAPModalProps> = ({ onClose, onPurchase }) => {
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [successId, setSuccessId] = useState<string | null>(null);

    const handleBuy = (product: IAPProduct) => {
        setProcessingId(product.id);
        
        // Simulate API latency
        setTimeout(() => {
            setProcessingId(null);
            setSuccessId(product.id);
            onPurchase(product.goldAmount);
            
            // Close after showing success
            setTimeout(() => {
                onClose();
            }, 1000);
        }, 1500);
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-slate-900 border border-slate-600 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl relative">
                <div className="bg-slate-950 p-4 border-b border-slate-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-yellow-400 flex items-center gap-2">
                        <Coins /> 儲值金幣
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white"><X /></button>
                </div>
                
                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    {IAP_PRODUCTS.map(product => (
                        <div key={product.id} className={`relative flex flex-col items-center p-6 rounded-xl border transition-all ${product.color} border-white/10 hover:border-yellow-400 hover:transform hover:scale-105`}>
                            <Coins size={48} className="text-yellow-300 mb-4 drop-shadow-lg" />
                            <h3 className="text-xl font-bold text-white mb-1">{product.name}</h3>
                            <p className="text-yellow-200 font-bold mb-4">{product.goldAmount} G</p>
                            
                            {successId === product.id ? (
                                <button className="w-full py-2 rounded-lg bg-green-500 text-white font-bold flex items-center justify-center gap-2">
                                    <CheckCircle size={18}/> 已購買
                                </button>
                            ) : (
                                <button 
                                    onClick={() => handleBuy(product)}
                                    disabled={!!processingId}
                                    className={`w-full py-2 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors ${processingId === product.id ? 'bg-slate-500 cursor-wait' : 'bg-white text-slate-900 hover:bg-yellow-400'}`}
                                >
                                    {processingId === product.id ? (
                                        <div className="w-4 h-4 border-2 border-slate-800 border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                        <>NT$ {product.priceTWD}</>
                                    )}
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                <div className="p-4 bg-slate-950/50 text-center text-slate-500 text-xs flex justify-center items-center gap-2">
                    <CreditCard size={14} /> 安全支付由虛擬銀行提供 (測試模式)
                </div>
            </div>
        </div>
    );
};

export default IAPModal;