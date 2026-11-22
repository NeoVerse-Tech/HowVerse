/* Fusion reactor · manifest. The loader reads this list and loads each file in order.
   mission.js must come before fly.js: fly.js uses pfusOf, wOf, kOf and pradOf from mission.js. */
window.HV.manifest=window.HV.manifest||{};
window.HV.manifest['fusion-reactor']=['core.js','parts.js','world.js','mission.js','fly.js','learn.js','register.js'];
