nix
{ pkgs, ... }: {
  channel = "stable-24.05";
  packages = [
    pkgs.nodejs_20
  ];

  # Define aquí las variables que usa tu archivo src/firebase/config.ts
  env = {
    NEXT_PUBLIC_FIREBASE_PROJECT_ID = "mibazar-f10d5";
    NEXT_PUBLIC_FIREBASE_APP_ID = "1:258781462057:web:bbbb00d3190946dd812638";
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = "mibazar-f10d5.firebasestorage.app";
    NEXT_PUBLIC_FIREBASE_API_KEY = "AIzaSyATCOlL7Qt5RUOYsfCVpcANHbrvcJlcn4g";
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = "mibazar-f10d5.firebaseapp.com";
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = "258781462057";
    GEMINI_API_KEY="AIzaSyATCOlL7Qt5RUOYsfCVpcANHbrvcJlcn4g";
  };

  idx.previews = {
    enable = true;
    previews = {
      web = {
        command = ["npm", "run", "dev", "--", "--port", "$PORT", "--host", "0.0.0.0"];
        manager = "web";
      };
    };
  };
}
