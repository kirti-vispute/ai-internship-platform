import Script from "next/script";

// Runs before paint so the correct theme/appearance attributes are on <html>
// before hydration — avoids a flash of the default theme. Kept as a tiny
// inline script (no next-themes dependency) mirroring the ThemeProvider's
// own storage-key contract in lib/theme/theme-config.ts.
const INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("internai.theme")||"ocean";var a=localStorage.getItem("internai.appearance")||"dark";var r=document.documentElement;r.setAttribute("data-theme",t);r.setAttribute("data-appearance",a);r.classList.toggle("dark",a==="dark");}catch(e){}})();`;

export function ThemeInitScript() {
  return (
    <Script id="theme-init" strategy="beforeInteractive">
      {INIT_SCRIPT}
    </Script>
  );
}
