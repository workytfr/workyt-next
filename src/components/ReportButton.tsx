'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Flag, MoreHorizontal } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import ReportModal from './ReportModal';

interface ReportButtonProps {
    contentId: string;
    contentType: 'revision' | 'course' | 'forum_answer' | 'forum_question';
    variant?: 'button' | 'dropdown';
    size?: 'sm' | 'default' | 'lg';
    className?: string;
}

export default function ReportButton({ 
    contentId, 
    contentType, 
    variant = 'button',
    size = 'sm',
    className = ''
}: ReportButtonProps) {
    const { data: session } = useSession();
    const [showReportModal, setShowReportModal] = useState(false);

    // Ne pas afficher le bouton si l'utilisateur n'est pas connecté
    if (!session) {
        return null;
    }

    if (variant === 'dropdown') {
        return (
            <>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                            onClick={() => setShowReportModal(true)}
                            className="text-red-600 focus:text-red-600"
                        >
                            <Flag className="mr-2 h-4 w-4" />
                            Signaler
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                {showReportModal && (
                    <ReportModal
                        contentId={contentId}
                        contentType={contentType}
                        trigger={null}
                    />
                )}
            </>
        );
    }

    return (
        <ReportModal
            contentId={contentId}
            contentType={contentType}
            trigger={
                <Button 
                    variant="outline" 
                    size={size} 
                    className={`text-red-600 hover:text-red-700 ${className}`}
                >
                    <Flag className="w-4 h-4 mr-2" />
                    Signaler
                </Button>
            }
        />
    );
}
