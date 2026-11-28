/* Octopus arms · registers the topic. Loaded last. */
(function() {
  const HV = window.HV,
    T = HV.T.octopus;
  
  HV.topics = HV.topics || {};
  
  /* the loader looks the topic up by the slug of its sector-page name, 'Octopus arms' -> octopus-arms */
  const topic = {
    slug: 'octopus-arms',
    title: 'Octopus arms',
    hook: 'Four AI-assisted snake arms on your back, steered by muscle signals, kept honest by physics.',
    stats: [
      [T.NARM + ' arms', 'on the harness'],
      [T.N + ' segments', 'on one arm'],
      [T.MTOT.toFixed(0) + ' kg', 'carried in all']
    ],
    learn: T.LEARN,
    parts: T.PARTS,
    create: T.create,
    fly: { create: T.createFly },
    mission: { at: T.at, read: T.read, duration: T.duration, phases: T.P.map(p => ({ n: p.n, w: p.w })) }
  };
  
  HV.topics['octopus-arms'] = topic;
  HV.topics.octopus = topic;
})();