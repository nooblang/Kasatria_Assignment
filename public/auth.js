let tokenClient;

document.getElementById("googleBtn").onclick = () => {
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: "789832176651-0h8f3cjbl4dat3g6f82sa0lgr057kbf9",
    scope: "https://www.googleapis.com/auth/spreadsheets.readonly",
    callback: (resp) => {
      if (resp.error) return console.error(resp);

      // Save token temporarily
      sessionStorage.setItem("access_token", resp.access_token);

      // Redirect to visualizer
      window.location.href = "/index.html";
    }
  });

  tokenClient.requestAccessToken({ prompt: "consent" });
};
