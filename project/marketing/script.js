// Track sign-up clicks for analytics (Plausible, optional).
document.querySelectorAll("a[href*=""signup""]").forEach(function (a) {
  a.addEventListener("click", function () {
    if (window.plausible) {
      var plan = null;
      try { plan = new URL(a.href).searchParams.get("plan"); } catch (e) {}
      window.plausible("signup_click", { props: { plan: plan || "unknown" } });
    }
  });
});
