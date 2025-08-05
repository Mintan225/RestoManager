import { useEffect } from 'react';
import { authService } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();

  useEffect(() => {
    const handleApiError = (event: CustomEvent) => {
      if (event.detail.status === 401 || event.detail.status === 403) {
        console.log("Auth error detected, logging out user");
        toast({
          title: "Session expirée",
          description: "Veuillez vous reconnecter pour continuer",
          variant: "destructive",
        });
        authService.logout();
        // Force redirect to login page
        window.location.href = '/login';
      }
    };

    window.addEventListener('apiError', handleApiError as EventListener);
    
    return () => {
      window.removeEventListener('apiError', handleApiError as EventListener);
    };
  }, [toast]);

  return <>{children}</>;
}