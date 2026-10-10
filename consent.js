/* La Bécassière — bandeau de consentement + Pixel Meta
 * Le Pixel n'est chargé qu'après acceptation explicite (exigence CNIL).
 * Choix conservé 13 mois maximum, puis redemandé.
 */
(function () {
  "use strict";

  // ⇩⇩ Remplacer par l'identifiant du Pixel (Gestionnaire d'événements Meta) ⇩⇩
  var PIXEL_ID = "REMPLACER_PAR_ID_PIXEL";

  var KEY = "lb_consent_v1";
  var MAX_AGE = 1000 * 60 * 60 * 24 * 395; // ~13 mois

  var TXT = {
    fr: { msg: "Nous utilisons des cookies de mesure publicitaire (Meta) pour faire connaître La Bécassière. Vous pouvez les accepter ou les refuser.", ok: "Accepter", no: "Refuser", manage: "Gérer les cookies" },
    en: { msg: "We use advertising measurement cookies (Meta) to promote La Bécassière. You can accept or decline them.", ok: "Accept", no: "Decline", manage: "Cookie settings" },
    de: { msg: "Wir verwenden Werbe-Messcookies (Meta), um La Bécassière bekannt zu machen. Sie können sie akzeptieren oder ablehnen.", ok: "Akzeptieren", no: "Ablehnen", manage: "Cookie-Einstellungen" },
    sv: { msg: "Vi använder cookies för annonsmätning (Meta) för att marknadsföra La Bécassière. Du kan godkänna eller avböja dem.", ok: "Godkänn", no: "Avböj", manage: "Cookie-inställningar" }
  };

  function lang() {
    var q = new URLSearchParams(location.search).get("lang");
    var l = (q || document.documentElement.lang || "fr").slice(0, 2).toLowerCase();
    return TXT[l] ? l : "fr";
  }

  function read() {
    try {
      var v = JSON.parse(localStorage.getItem(KEY) || "null");
      if (v && Date.now() - v.t < MAX_AGE) return v.c;
    } catch (e) {}
    return null;
  }

  function save(c) {
    try { localStorage.setItem(KEY, JSON.stringify({ c: c, t: Date.now() })); } catch (e) {}
  }

  var loaded = false;
  function loadPixel() {
    if (loaded || !/^\d+$/.test(PIXEL_ID)) return;
    loaded = true;
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
    n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
    document,'script','https://connect.facebook.net/en_US/fbevents.js');
    fbq("init", PIXEL_ID);
    fbq("track", "PageView");
    // Page de réservation : intention forte (le widget Smoobu étant une iframe tierce, la réservation finale n'est pas mesurable ici)
    if (/reserver\.html$/.test(location.pathname)) fbq("track", "InitiateCheckout");
  }

  // Clics vers la réservation, l'e-mail ou le téléphone
  document.addEventListener("click", function (e) {
    if (!loaded || !window.fbq) return;
    var a = e.target.closest && e.target.closest("a");
    if (!a) return;
    var h = a.getAttribute("href") || "";
    if (/reserver\.html/.test(h)) fbq("trackCustom", "ClicReserver");
    else if (/^mailto:|^tel:/.test(h)) fbq("track", "Contact");
  }, true);

  var css = "#lb-cc{position:fixed;left:16px;right:16px;bottom:16px;z-index:9999;max-width:560px;margin:0 auto;background:#1C2C21;color:#F3EFE6;border:1px solid #B08A46;border-radius:10px;padding:18px 20px;font:14px/1.5 Mulish,system-ui,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.3)}" +
    "#lb-cc p{margin:0 0 14px}#lb-cc .b{display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap}" +
    "#lb-cc button{cursor:pointer;border-radius:6px;padding:9px 18px;font:600 14px Mulish,system-ui,sans-serif;border:1px solid #B08A46}" +
    "#lb-cc .ok{background:#B08A46;color:#1C2C21}#lb-cc .no{background:transparent;color:#F3EFE6}" +
    ".lb-cc-manage{background:none;border:0;padding:0;color:inherit;font:inherit;text-decoration:underline;cursor:pointer;opacity:.8}";

  function banner() {
    if (document.getElementById("lb-cc")) return;
    var t = TXT[lang()];
    var d = document.createElement("div");
    d.id = "lb-cc";
    d.setAttribute("role", "dialog");
    d.setAttribute("aria-live", "polite");
    d.innerHTML = '<p></p><div class="b"><button class="no" type="button"></button><button class="ok" type="button"></button></div>';
    d.querySelector("p").textContent = t.msg;
    d.querySelector(".no").textContent = t.no;
    d.querySelector(".ok").textContent = t.ok;
    d.querySelector(".no").onclick = function () { save(false); d.remove(); };
    d.querySelector(".ok").onclick = function () { save(true); d.remove(); loadPixel(); };
    document.body.appendChild(d);
  }

  function init() {
    var s = document.createElement("style");
    s.textContent = css;
    document.head.appendChild(s);

    // Lien « Gérer les cookies » dans le pied de page (retrait du consentement)
    var foot = document.querySelector("footer .wrap");
    if (foot) {
      var m = document.createElement("button");
      m.type = "button";
      m.className = "lb-cc-manage";
      m.textContent = TXT[lang()].manage;
      m.onclick = function () {
        try { localStorage.removeItem(KEY); } catch (e) {}
        if (loaded) { location.reload(); return; } // décharge le Pixel
        banner();
      };
      var wrap = document.createElement("div");
      wrap.style.cssText = "margin-top:12px;font-size:.8rem";
      wrap.appendChild(m);
      foot.appendChild(wrap);
    }

    var c = read();
    if (c === true) loadPixel();
    else if (c === null) banner();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
