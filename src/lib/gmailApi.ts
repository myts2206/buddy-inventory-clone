
import { toast } from "@/hooks/use-toast";

const CLIENT_ID = "570416026363-6vc4d3b0rehro504289npl7sj3sv7h4q.apps.googleusercontent.com";
const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest"];
const SCOPES = "https://www.googleapis.com/auth/gmail.send";

let gapi: any;
let gapiInitPromise: Promise<void> | null = null;

export const initGmailApi = async (): Promise<void> => {
  if (typeof window === "undefined") {
    throw new Error("Not in browser environment");
  }

  if (gapiInitPromise) {
    return gapiInitPromise;
  }

  gapiInitPromise = new Promise<void>(async (resolve, reject) => {
    try {
      // Load the Google API client
      if (!window.gapi) {
        await new Promise<void>((loadResolve, loadReject) => {
          const script = document.createElement('script');
          script.src = 'https://apis.google.com/js/api.js';
          script.async = true;
          script.defer = true;
          script.onload = () => loadResolve();
          script.onerror = () => loadReject(new Error('Failed to load gapi script'));
          document.body.appendChild(script);
        });
      }

      // Load OAuth2 library
      if (!window.google) {
        await new Promise<void>((loadResolve, loadReject) => {
          const script = document.createElement('script');
          script.src = 'https://accounts.google.com/gsi/client';
          script.async = true;
          script.defer = true;
          script.onload = () => loadResolve();
          script.onerror = () => loadReject(new Error('Failed to load Google Identity Services'));
          document.body.appendChild(script);
        });
      }

      gapi = window.gapi;
      
      gapi.load('client', async () => {
        try {
          await gapi.client.init({
            discoveryDocs: DISCOVERY_DOCS,
          });
          resolve();
        } catch (initError) {
          console.error("Gmail API client.init error:", initError);
          toast({
            variant: "destructive",
            title: "Gmail API Error",
            description: "Gmail API initialization failed"
          });
          reject(initError);
        }
      });
    } catch (error) {
      console.error("Gmail API load error:", error);
      toast({
        variant: "destructive",
        title: "Gmail API Error",
        description: "Failed to load Gmail API"
      });
      reject(error);
    }
  });

  return gapiInitPromise;
};

export const isGmailApiInitialized = (): boolean => {
  return !!(gapi && gapi.client && gapi.client.gmail);
};

export const signIn = async (): Promise<boolean> => {
  try {
    await initGmailApi();

    const accessToken = await new Promise<string | null>((resolve) => {
      if (!window.google || !window.google.accounts || !window.google.accounts.oauth2) {
        resolve(null);
        return;
      }

      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: (response: any) => {
          if (response.error) {
            console.error('OAuth error:', response);
            resolve(null);
          } else {
            resolve(response.access_token);
          }
        }
      });

      tokenClient.requestAccessToken({ prompt: '' });
    });

    return !!accessToken;
  } catch (error) {
    console.error("Error signing in with Gmail:", error);
    toast({
      variant: "destructive",
      title: "Gmail Error",
      description: "Failed to sign in with Gmail"
    });
    return false;
  }
};

export const signOut = async (): Promise<void> => {
  try {
    if (window.google && window.google.accounts && window.google.accounts.oauth2) {
      window.google.accounts.oauth2.revoke(
        localStorage.getItem('googleToken') || '',
        () => {
          localStorage.removeItem('googleToken');
          toast({
            title: "Signed Out",
            description: "Signed out from Gmail"
          });
        }
      );
    }
  } catch (error) {
    console.error("Error signing out from Gmail:", error);
    toast({
      variant: "destructive",
      title: "Gmail Error",
      description: "Failed to sign out from Gmail"
    });
  }
};

export const isUserSignedIn = (): boolean => {
  return !!localStorage.getItem('googleToken');
};

const encodeEmail = (emailData: { to: string; subject: string; body: string }): string => {
  const { to, subject, body } = emailData;
  const emailContent = [
    "From: me",
    `To: ${to}`,
    `Subject: ${subject}`,
    "",
    body,
  ].join("\r\n").trim();

  return btoa(emailContent)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
};

export const sendEmailViaGmail = async (emailData: {
  to: string;
  subject: string;
  body: string;
}): Promise<boolean> => {
  try {
    if (!isUserSignedIn()) {
      const signInSuccess = await signIn();
      if (!signInSuccess) {
        return false;
      }
    }

    await initGmailApi();
    const encodedEmail = encodeEmail(emailData);

    await gapi.client.gmail.users.messages.send({
      userId: "me",
      resource: {
        raw: encodedEmail,
      },
    });

    toast({
      title: "Email Sent",
      description: "Email sent successfully via Gmail"
    });
    
    return true;
  } catch (error) {
    console.error("Error sending email via Gmail API:", error);
    toast({
      variant: "destructive",
      title: "Gmail Error",
      description: "Failed to send email via Gmail"
    });
    return false;
  }
};
