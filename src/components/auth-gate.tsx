'use client';

import { useAppContext } from "@/providers/app-provider";
import { LoginModal } from "@/components/login-modal";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

interface AuthGateProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;  // Optional fallback content
    asChild?: boolean;           // If true, clones the child to add onClick
    className?: string;
    onInteract?: () => void;     // Callback if auth exists
}

export function AuthGate({ children, fallback, asChild, className, onInteract }: AuthGateProps) {
    const { loggedInUser } = useAppContext();
    const [showLogin, setShowLogin] = useState(false);

    const handleClick = (e: React.MouseEvent) => {
        if (!loggedInUser) {
            e.stopPropagation();
            e.preventDefault();
            setShowLogin(true);
        } else {
            onInteract?.();
        }
    };

    if (!asChild) {
        return (
            <>
                <div onClick={handleClick} className={className}>
                    {children}
                </div>
                <LoginModal open={showLogin} onOpenChange={setShowLogin} />
            </>
        )
    }

    // If asChild (advanced usage), we perform a simplified check 
    // Ideally we would wrap the child, but for now we'll just encourage simple wrapping
    return (
        <>
            <div onClickCapture={handleClick} className={className} style={{ display: 'contents' }}>
                {children}
            </div>
            <LoginModal open={showLogin} onOpenChange={setShowLogin} />
        </>
    );
}
