import React, { useState } from 'react';
import PrivacyPolicyModal from './PrivacyPolicyModal';

interface PrivacyConsentProps {
    onConsentChange: (hasConsented: boolean) => void;
    required?: boolean;
}

const PrivacyConsent: React.FC<PrivacyConsentProps> = ({ onConsentChange, required = true }) => {
    const [hasConsented, setHasConsented] = useState(false);
    const [showModal, setShowModal] = useState(false);

    const handleConsentChange = (checked: boolean) => {
        setHasConsented(checked);
        onConsentChange(checked);
    };

    const handleAcceptPolicy = () => {
        setHasConsented(true);
        onConsentChange(true);
        setShowModal(false);
    };

    const handleDeclinePolicy = () => {
        setHasConsented(false);
        onConsentChange(false);
        setShowModal(false);
    };

    return (
        <>
            <div className="space-y-3">
                <div className="flex items-start space-x-3">
                    <input
                        type="checkbox"
                        id="privacy-consent"
                        checked={hasConsented}
                        onChange={(e) => handleConsentChange(e.target.checked)}
                        required={required}
                        className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <div className="flex-1">
                        <label htmlFor="privacy-consent" className="text-sm text-gray-700 leading-relaxed">
                            J&apos;accepte la{' '}
                            <button
                                type="button"
                                onClick={() => setShowModal(true)}
                                className="text-blue-600 hover:text-blue-800 underline font-medium"
                            >
                                politique de confidentialité
                            </button>{' '}
                            de Workyt et je consens au traitement de mes données personnelles 
                            dans les conditions décrites.
                            {required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                    </div>
                </div>

                {!hasConsented && required && (
                    <p className="text-sm text-red-600">
                        Vous devez accepter la politique de confidentialité pour continuer.
                    </p>
                )}

                <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                    <p>
                        <strong>Résumé :</strong> Workyt collecte vos données pour créer votre compte, 
                        personnaliser votre expérience d&apos;apprentissage, gérer le système de badges 
                        et améliorer nos services. Vos contributions sont visibles par la communauté. 
                        Vous pouvez modifier ou supprimer vos données à tout moment.
                    </p>
                </div>
            </div>

            <PrivacyPolicyModal
                isOpen={showModal}
                onAccept={handleAcceptPolicy}
                onDecline={handleDeclinePolicy}
            />
        </>
    );
};

export default PrivacyConsent; 