    import React, { Component, ErrorInfo, ReactNode } from 'react';

    interface ErrorBoundaryProps {
      children: ReactNode;
      fallback?: ReactNode; // Optionnel : un UI de secours personnalisé
    }

    interface ErrorBoundaryState {
      hasError: boolean;
      error: Error | null;
      errorInfo: ErrorInfo | null;
    }

    /**
     * Composant ErrorBoundary pour attraper les erreurs JavaScript dans l'arbre des composants enfants,
     * les logger, et afficher une UI de secours.
     * Les Error Boundaries doivent être des composants de classe.
     */
    class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
      // Initialise l'état de la limite d'erreur
      public state: ErrorBoundaryState = {
        hasError: false,
        error: null,
        errorInfo: null,
      };

      /**
       * componentDidCatch est appelé après qu'une erreur a été générée par un descendant.
       * Il est utilisé pour logguer les informations sur l'erreur.
       * @param error L'erreur qui a été générée.
       * @param errorInfo Un objet contenant des informations sur le composant qui a généré l'erreur.
       */
      public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // Vous pouvez également logguer l'erreur à un service de rapport d'erreurs
        console.error("ErrorBoundary a attrapé une erreur :", error, errorInfo);
        
        // Mettre à jour l'état pour que le prochain rendu affiche l'UI de secours
        this.setState({
          hasError: true,
          error: error,
          errorInfo: errorInfo,
        });
      }

      /**
       * getDerivedStateFromError est appelé après qu'une erreur a été générée par un descendant.
       * Il est utilisé pour mettre à jour l'état afin que le prochain rendu affiche l'UI de secours.
       * @param _error L'erreur qui a été générée.
       * @returns Un objet pour mettre à jour l'état.
       */
      public static getDerivedStateFromError(_error: Error): ErrorBoundaryState {
        // Mettre à jour l'état pour que le prochain rendu affiche l'UI de secours
        return { hasError: true, error: _error, errorInfo: null };
      }

      /**
       * Méthode de rendu du composant.
       * Si une erreur a été attrapée, affiche l'UI de secours.
       * Sinon, rend les composants enfants normalement.
       */
      public render() {
        if (this.state.hasError) {
          // Vous pouvez rendre n'importe quelle UI de secours personnalisée
          if (this.props.fallback) {
            return this.props.fallback;
          }
          return (
            <div style={{ padding: '20px', textAlign: 'center', border: '1px solid #e0e0e0', borderRadius: '8px', margin: '20px auto', maxWidth: '600px', backgroundColor: '#f8f8f8' }}>
              <h2 style={{ color: '#e74c3c' }}>Oups ! Quelque chose s'est mal passé.</h2>
              <p style={{ color: '#555' }}>Nous sommes désolés pour le désagrément. Veuillez réessayer plus tard.</p>
              {/* Pour le débogage en développement, vous pouvez afficher les détails de l'erreur */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details style={{ marginTop: '20px', textAlign: 'left', backgroundColor: '#eee', padding: '10px', borderRadius: '4px' }}>
                  <summary style={{ cursor: 'pointer', color: '#3498db' }}>Détails de l'erreur</summary>
                  <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '0.8em', color: '#333' }}>
                    {this.state.error.toString()}
                    <br />
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}
            </div>
          );
        }

        // Normalement, rend les enfants
        return this.props.children;
      }
    }

    export default ErrorBoundary;
    