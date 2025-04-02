import { toast } from "sonner";

const CLIENT_ID = "570416026363-6vc4d3b0rehro504289npl7sj3sv7h4q.apps.googleusercontent.com"; // Replace with your actual client ID
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
      const pack = await import("gapi-script");
      gapi = pack.gapi;

      gapi.load("client:auth2", async () => {
        try {
          await gapi.client.init({
            clientId: CLIENT_ID,
            discoveryDocs: DISCOVERY_DOCS,
            scope: SCOPES,
          });
          resolve();
        } catch (initError) {
          console.error("Gmail API client.init error:", initError);
          toast.error("Gmail API initialization failed");
          reject(initError);
        }
      });
    } catch (error) {
      console.error("Gmail API load error:", error);
      toast.error("Failed to load Gmail API");
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

    const authInstance = gapi.auth2.getAuthInstance();
    if (!authInstance.isSignedIn.get()) {
      await authInstance.signIn();
    }
    return true;
  } catch (error) {
    console.error("Error signing in with Gmail:", error);
    toast.error("Failed to sign in with Gmail");
    return false;
  }
};

export const signOut = async (): Promise<void> => {
  try {
    if (isGmailApiInitialized()) {
      const authInstance = gapi.auth2.getAuthInstance();
      if (authInstance.isSignedIn.get()) {
        await authInstance.signOut();
        toast.success("Signed out from Gmail");
      }
    }
  } catch (error) {
    console.error("Error signing out from Gmail:", error);
    toast.error("Failed to sign out from Gmail");
  }
};

export const isUserSignedIn = (): boolean => {
  try {
    if (isGmailApiInitialized()) {
      const authInstance = gapi.auth2.getAuthInstance();
      return authInstance.isSignedIn.get();
    }
    return false;
  } catch (error) {
    console.error("Error checking sign-in status:", error);
    return false;
  }
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

    const encodedEmail = encodeEmail(emailData);

    await gapi.client.gmail.users.messages.send({
      userId: "me",
      resource: {
        raw: encodedEmail,
      },
    });

    toast.success("Email sent successfully via Gmail");
    return true;
  } catch (error) {
    console.error("Error sending email via Gmail API:", error);
    toast.error("Failed to send email via Gmail");
    return false;
  }
};
