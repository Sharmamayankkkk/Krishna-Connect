# To learn more about how to use Nix to configure your environment
# see: https://firebase.google.com/docs/studio/customize-workspace

{ pkgs, ... }: {

  # Which nixpkgs channel to use.
  channel = "stable-24.11"; # or "unstable"

  # Use https://search.nixos.org/packages to find packages
  packages = [
    pkgs.nodejs_20
    pkgs.zulu      # Changed to zulu17 for stability (or keep pkgs.zulu if you want latest)
    pkgs.supabase-cli
    pkgs.sudo
    pkgs.cloc
  ];

  # Sets environment variables in the workspace
  env = {};

  # Firebase emulator configuration
  services.firebase.emulators = {
    detect = true;
    projectId = "demo-app";
    services = ["auth" "firestore"];
  };

  idx = {
    # Search for the extensions you want on https://open-vsx.org/ and use "publisher.id"
    extensions = [
      # "vscodevim.vim"
    ];

    workspace = {
      onCreate = {
        default.openFiles = [
          "src/app/page.tsx"
        ];
        
        run-cloc = ''
          cloc . --exclude-dir=node_modules,.next,.git,.vercel,dist,build --out=cloc_output.log
        '';
      };
    };

    # Enable previews and customize configuration
    previews = {
      enable = true;
      previews = {
        web = {
          command = ["npm" "run" "dev" "--" "--port" "$PORT" "--hostname" "0.0.0.0"];
          manager = "web";
        };
      };
    };
  };
}
