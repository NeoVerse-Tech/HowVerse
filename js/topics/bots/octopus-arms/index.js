/* Octopus arms · manifest. Add a file here to add it to the topic. Providers must come before consumers. */
window.HV.manifest = window.HV.manifest || {};
const files = [
  'core.js',     /* shared physics constants and maths */
  'parts.js',    /* World tab part list and descriptions */
  'learn.js',    /* Learn tab sections */
  'mission.js',  /* Launch tab stunt reel and readouts; also shares the stage and pose blend with Fly */
  'world.js',    /* 3D scene */
  'fly.js',      /* Fly tab: you steer the arms one at a time; needs mission.js for the stage */
  'pilot.js',    /* Fly 2.0 pilot world; wraps the Fly model, so it follows fly.js */
  'register.js'  /* registers the topic, loaded last */
];
window.HV.manifest['octopus-arms'] = files;
window.HV.manifest.octopus = files;