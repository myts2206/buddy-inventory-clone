
interface GoogleAccounts {
  id: {
    initialize: (config: any) => void;
    renderButton: (element: HTMLElement | null, options: any) => void;
    prompt: () => void;
  };
  oauth2: {
    initTokenClient: (config: any) => {
      requestAccessToken: (options?: any) => void;
    };
    revoke: (token: string, callback: () => void) => void;
  };
}

interface Window {
  google: {
    accounts: GoogleAccounts;
    picker?: any;
  };
  gapi: {
    load: (api: string, options: any) => void;
    client?: any;
  };
}
