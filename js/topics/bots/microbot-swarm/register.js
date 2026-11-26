/* Microbot swarm · registers the topic. Loaded last. */
(function() {
 const HV = window.HV,
  T = HV.T.microbots;
 const REF = T.REF;
 HV.topics = HV.topics || {};
 
 /* the loader looks the topic up by the slug of its sector-page name, 'Microbot swarm' -> microbot-swarm */
 const topic = {
  slug: 'microbot-swarm',
  title: 'Microbot swarm',
  hook: 'Slender ball-jointed magnetic bots flow over each other and grow into sculptures, and the same recipe fails at a million.',
  stats: [
   [+(T.LEN * 1e3).toFixed(1) + ' mm', 'one bot, long'],
   [REF.model.n.toLocaleString('en-US'), 'bots in the sculpture'],
   [T.fmtT(REF.time.time), 'to grow it']
  ],
  learn: T.LEARN,
  parts: T.PARTS,
  create: T.create,
  fly: { create: T.createFly },
  mission: { at: T.at, read: T.read, phases: T.P.map(p => ({ n: p.n, w: p.w })) }
 };
 HV.topics['microbot-swarm'] = topic;
 HV.topics.microbots = topic;
})();