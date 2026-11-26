# Howverse

**Learn how the future gets built.**

Howverse is a phone-first, swipeable library that explains how pioneering science, technology and engineering actually works. You pick a sector, read how a thing works, step into a live 3D model of it, pull it apart, run it, and where it makes sense, take the controls yourself. Every number on screen comes from real physics, and every claim is labelled with how much of it is real.

It grew out of Virtual Verse. The city game and the story were removed, and what remains is the part that teaches.

---

## What a visitor experiences

1. **Arrival.** The intro animation plays the moment the page opens. A galaxy collapses into a glowing orb, flashes, then bursts into a star field.
2. **Home.** Eleven sector cards sit in a row. The next card peeks in from the edge, so it is clear you can swipe. A strip of icon chips jumps straight to any sector, and a counter shows where you are. The card in focus runs a topic carousel: it features one topic at a time and moves to the next every 3 seconds, with a progress bar along the bottom. Hold the panel to pause, tap a dot to jump to a topic, tap the panel to open the sector. Cards off screen stay still, and the carousel pauses when the tab is hidden and does not run if the phone asks for reduced motion. Under it, a "More ideas" row of small dashed chips lists concepts that are not yet topics.
3. **Sector.** Opening a sector lists its topics, with a search bar pinned at the top for when a sector grows. Typing filters by topic name or subtitle, and every word typed must match. Topics that are built say "Open". The rest say "Coming soon".
4. **Topic.** Each topic opens as a set of tabs: Learn, World, Launch, and Fly when the topic has a flight model.

---

## The tabs of every topic

- **Learn.** A short story of how the thing works, in plain language, with the 3D model turning behind the text.
- **World.** The live 3D model. Orbit it, pinch to zoom, pull it apart with a slider, and tap any part to see what it does, its key numbers, and how real it is.
- **Launch.** A guided replay of the whole mission. Scrub through the timeline, or press Play, and watch the readouts change.
- **Fly.** You are the pilot. The model runs on live physics and you set the controls, with time warp to cover hours or days in seconds.

Learn, World and Launch are the same for every topic, so a visitor always knows what to expect. Fly appears only for topics where flying makes sense.

---

## Honest labels

Nothing is presented as fact when it is not. Every claim carries one of three labels:

- **BUILT:** it exists and works today.
- **PROPOSED:** a serious design exists, but it has not been built.
- **THEORETICAL:** it is allowed by known physics but unproven.

---

## The eleven sectors

| Sector | Theme | Topics |
|---|---|---|
| Spaceflight | How we leave the planet | Spaceship, Rocket and capsule, Fusion drive |
| Energy | Power that changes what is possible | Fusion reactor, Dyson swarm, Space solar power |
| Megastructures | Engineering at planetary scale | Space elevator, Orbital ring, Ark station, Deployable tower |
| Life and Medicine | Rebuilding the body from inside | Bloodstream, Nanobots, Gene editing |
| Earth and Climate | Reading and reshaping a planet | Terraforming, Geothermal, Storm science |
| Computing and AI | Machines that think and calculate | Inside a chip, Quantum computer, Orbital data center |
| Transport | Moving people faster and cleaner | Maglev, Vacuum tube, Hover vehicles |
| Ocean and Deep | The frontier under the surface | Undersea habitat, Submersible |
| Materials and Nano | Matter, designed from the atom up | Graphene, Metamaterials |
| Physics Frontier | Where known physics gets strange | Black hole, Time dilation, Warp drive |
| Robotics | Machines that build, farm and walk | Robot farm, Giant mech, Microbot swarm |

That makes 32 topics in total. Each sector has its own colour, which tints the star field and the interface while you are inside it.

---

## Current status

**Built and working**
- The intro animation, the swipeable home screen, the quick-jump chips and the sector pages.
- The topic page and its registry. A topic file registers itself, and its sector page then opens it.
- **Spaceship** (Spaceflight), the first topic and the template for the others. It has all four tabs.
- **Nanobots** (Life and Medicine), the second topic, at a scale where physics is very different from ours. It has all four tabs.
- **Fusion reactor** (Energy), the third topic, a live 3D tokamak. It has all four tabs.
- **Deployable tower** (Megastructures), the first structure topic, where the physics is loads, buckling and wind. It has all four tabs.
- **Graphene** (Materials and Nano), a nanoindentation test that breaks a one-atom-thick drum with a diamond tip. It has all four tabs.
- **Metamaterials** (Materials and Nano), a prism of copper rings and wires that bends a beam the wrong way. It has all four tabs.
- **Orbital data center** (Computing and AI), a megawatt-class compute satellite in a dawn-dusk orbit, where cooling rather than power is the limit. It has all four tabs.
- **Microbot swarm** (Robotics), slender ball-jointed magnetic bots that flow out of a pile and grow sculptures, and an honest account of why nothing yet shows those sculptures would hold. It has all four tabs. Learn and World show a single bot.
- The home carousel with its "More ideas" row, and the search bar on the sector page.

**Coming soon**
- The remaining topics. They show as "Coming soon" until their files exist.

---

## The Spaceship topic

A crewed fusion ship that flies from Earth orbit to Mars and stops there.

**Reference design (THEORETICAL)**

| | |
|---|---|
| Wet mass | 200 t |
| Dry mass | 140 t (60 t of propellant) |
| Thrust | 20 kN |
| Exhaust speed | 100 km/s |
| Jet power | 1 GW |
| Speed change available | 35.7 km/s |
| Acceleration | about 0.1 m/s² at the start |
| Ring gravity | 0.34 g (6 rpm, 8.5 m radius) |

**Seven parts in the World tab:** crew hull, spin ring, shadow shield, fusion reactor, propellant tanks, radiators and magnetic nozzle.

**Launch tab:** parked in orbit, ring spin-up, reactor ignition, a 30 t burn, a 40-day coast, a flip, a braking burn, arrival. The trip takes about six weeks and ends with propellant to spare.

### The Fly tab

The ship runs on live physics. You choose what to do and the numbers follow.

- **Throttle.** The engine burns real propellant at 0.2 kg/s at full power. Mass, speed and distance update each step from the rocket equation.
- **Flip.** The engine only pushes along the ship's axis, so to slow down you must turn the ship around. The turn takes about 30 minutes of ship time and the engine is locked while it happens.
- **Time warp.** 1x, 1 min/s, 1 h/s and 1 day/s. At 1x nothing visibly changes, because the thrust is gentle. That is the lesson.
- **Auto.** Flies the reference plan once so you can see the right answer, then try to beat it.
- **Live gauges.** Speed, distance to Mars, propellant, thrust, acceleration, delta-v left, braking distance, heading, radiator temperature, radio delay to Earth and relativistic clock lag.
- **The goal.** Stop inside Mars's sphere of influence (about 577,000 km) slower than about 385 m/s. Burn too long and you cannot stop. Flip too late and you fly past.

**What the Fly model simplifies.** It is a straight line from Earth to a stationary Mars. It ignores the Sun's gravity, the gravity of both planets, and planetary motion, so a real trajectory would be curved. Planet sizes and distances on screen are compressed so they can be seen. The Learn tab says all of this to the visitor.

---

## The Nanobots topic

A magnetic corkscrew micro-robot, about 3 µm long, sent to clear a blood clot. It is a composite of published lab microswimmers, not one device. General figures (viscosity, thermal motion, drag) are physics. Design figures (the 3 µm length, the 20 Hz drive) are typical lab values chosen to fit together. The treatment itself is PROPOSED: no approved nanobot therapy exists yet.

**Reference design**

| | |
|---|---|
| Length | 3 µm, with a magnetic head and a helical tail |
| Swim speed | 20 µm/s at a 20 Hz field |
| Drag | about 2 pN at that speed |
| Reynolds number | about 0.00002, so inertia is gone and water feels like honey |
| Field | about 10 mT, rotating at about 20 Hz |
| Step-out | the helix loses lock above about 28 Hz |
| Swarm | 100,000 bots |

**Learn tab:** 13 sections, from how small is small, the Reynolds number and the scallop theorem, to heat shaking everything, power without a battery, DNA machines and an honest status check.

**World tab:** seven parts: magnetic head, helical tail, drug payload, targeting molecules, stealth coating, release lock and outside field coils. All are BUILT except the release lock, which is PROPOSED because it is still lab research. The helix spins and red blood cells drift past. The pull-apart slider separates the parts.

**Launch tab:** a clot-busting mission in 9 phases, from injection to clearance. Blood runs at 2 mm/s, 100 times faster than the bots swim, so they ride the flow. Only in the slow zone at the clot, where the flow drops to 15 µm/s, can a 20 µm/s swimmer steer. The bots dock, crawl over the clot, release a clot-dissolving enzyme, and the clot shrinks from 100% to 15%. Then the flow returns, sweeps the bots away, and the liver and spleen clear what is left over about 3 hours. Readouts: distance, blood flow, swim speed, drag, Reynolds number, field, payload released, clot left and bot count.

**Fly tab:** you steer one bot, standing in for the swarm, through a flat slice of a 50 µm vessel. It starts 1.5 mm upstream of the clot and about 20 µm off the centre. Blood carries it toward the clot at up to 4 mm/s.
- **Freq.** Switches the field on and cycles 15, 20, 28 and 40 Hz. Pick 20 Hz to be safe. Above about 28 Hz the helix steps out, and near the wall the limit is lower.
- **Heading.** The slider steers: 0° is downstream, −90° and +90° cross the vessel, 180° is upstream. The flow carries you but cannot stop you crossing.
- **Dock.** The clot only catches bots within 12 µm of the centre. Docking puts you on the clot face.
- **Cover and release.** Crawl along the face to cover all of it, because the enzyme only reaches where the bot has been. Then press Release.
- **Time warp.** 0.1×, 1×, 1 min/s and 10 min/s. It starts in slow motion so you have time to steer. Raise it to watch the clot dissolve, which takes about 35 minutes.
- **Heat.** Brownian motion jiggles the bot, so no two flights are the same.
- **Auto.** Flies the reference plan once so you can see the right answer.

**What the Fly model simplifies:** a flat slice of one vessel, steady flow, one bot, no collisions with blood cells, and a clot that is a simple catch zone. The Learn tab says so.

---

## The Fusion reactor topic

A tokamak, the doughnut-shaped magnetic bottle that holds plasma hot enough to fuse. It follows one real design, the ITER tokamak, so every figure is an ITER design value (PROPOSED), not a measurement. The machine is still under construction. It is an experiment, not a power plant, and it will not make electricity.

**Reference design (PROPOSED)**

| | |
|---|---|
| Fusion power | 500 MW from 50 MW of heating, so Q = 10 |
| Size | major radius 6.2 m, minor radius 2.0 m, plasma volume about 830 m³ |
| Plasma | about 150 million K, 1.0×10²⁰ particles per m³, 15 MA of current |
| Field | 5.3 T in the plasma, about 11.8 T at the coil |
| Magnets | 18 toroidal coils, 6 poloidal rings, a 6-module central solenoid, all at 4.5 K |
| Neutron wall load | about 0.6 MW/m² |
| Pulse | about 400 s of burn, until the central solenoid runs out of swing |

**Learn tab:** 13 sections, from the idea and why fusion is hard, through the reaction, the Lawson test and the magnetic bottle, to heating, the neutron problem, breeding tritium, taking out the ash, superconducting magnets, safety and an honest status check.

**World tab:** nine parts: plasma, vacuum vessel, blanket, divertor, toroidal field coils, central solenoid, poloidal field coils, heating systems and cryostat. The layout follows ITER's published sizes: a vessel 19.4 m across and 11.3 m tall with 45 ports, 18 rectangular D-shaped coils wedged together at the centre and standing on gravity supports, a 13 m solenoid, six poloidal rings from 8 m to 25 m across, 54 divertor cassettes shaped as a V with a dome, a blanket of 18 gapped sectors, and a faint 29 m cryostat round the lot. Faint shells never block a tap: a tap picks the solid part behind them, and the cryostat or vessel wall is selected only when nothing solid is under the finger. A wedge is cut away so you can see inside. White field lines wind round the doughnut with a safety factor q of about 3, and moving markers show the twist. The plasma glows with fusion power, the magnets glow with field, and the pull-apart slider separates every part.

**Launch tab:** one full pulse in 9 phases: cooling the magnets, pumping out the air, charging the field coils, fuel and breakdown, current ramp-up, heating up, the burn, ramp-down, and afterglow and reset. Readouts: time, coil temperature, field, plasma current, plasma heat, density, heating in, fusion power, power gain Q and stored heat.

**Fly tab:** you run the pulse. Set the heating power and step the fuel density up and down.
- **Heating.** The slider sets 0 to 73 MW of external heating. Start near 70 percent, about 50 MW.
- **Fuel + / Fuel −.** Eight fuel levels from 0.3 to 1.3 ×10²⁰ per m³. Fusion grows with the square of the density.
- **H-mode.** The plasma needs enough power flowing out through its edge to form an insulating barrier, which roughly doubles confinement.
- **The goal.** Hold at least 400 MW of fusion at Q of 10 or better for 400 seconds, inside a 15 minute pulse.
- **Two limits end the run in a disruption.** Too much fuel passes the density limit. Too much pressure passes the beta limit. Both have live gauges.
- **Time warp.** 1×, 10×, 1 min/s and 10 min/s.
- **Auto.** Flies the reference plan once so you can see the right answer.

**What the Fly model simplifies:** a single 0-D plasma with no spatial profiles, the energy confinement time scaled from the design point, bremsstrahlung as the only radiation loss, and a flat limit for each of density and pressure. The Learn tab says so.

---

## The Deployable tower topic

A telescoping tower that nests down to a fraction of its height before a storm, so the wind has far less to grab. Telescoping masts, cranes and jack-up rigs are BUILT, and tuned mass dampers hold up real skyscrapers. A 300 m tower that does all of it at once, with people inside, is PROPOSED. Nothing like it exists, and the Learn tab says so.

**Reference design (PROPOSED)**

| | |
|---|---|
| Height | 300 m deployed, 60 m stowed |
| Stages | 6 nested steel tubes, 60 m long, 24 m wide at the base down to 9 m at the top, 30 mm wall |
| Mass | about 14,000 t, including a 280 t tuned mass damper |
| Wind limit | the base reaches its limit at about 37 m/s fully tall (41 m/s with the damper), against a 55 m/s design storm |
| Stowed | the wind moment falls about 96%, and the base never governs |
| Drive | 5 MW continuous, 9 MW peak, 0.12 m/s top speed, so retracting takes about 50 minutes at the rated power |
| Occupancy | 2,000 people, deployed only |

Every number on screen comes from `core.js`: a power-law wind profile with a flat gust factor, drag on each stage, Euler buckling with the bending magnified near the buckling load, sway from integrating the curvature up the tower, and drive power from the weight the jacks carry.

**Learn tab:** 13 sections, from why a tower shrinks, wind, the lever arm, telescoping tubes and the reference design, through the base check, buckling, sway, the tuned mass damper, the jacks and the locking pins, to timing a storm and an honest list of what the model leaves out. Every figure is computed from `core.js`.

**World tab:** eight parts: foundation and anchors, telescoping stages, locking pins, drive jacks, floor modules, facade skin, damper mass and control system. With nothing selected the tower slowly retracts and redeploys, and its pins release and engage as it moves. Selecting a part lights it and fades the rest. Pull-apart separates the stages. The damper swings, the wind sensors spin and wind streaks blow past. Sway is exaggerated tenfold so it can be seen.

**Launch tab:** one storm cycle in 9 phases over about 8.9 hours: calm, forecast, evacuate, lock check, retract, ride out the storm, all clear, redeploy, locks engaged. Readouts: height, wind speed, wind load, overturning moment, sway, drive power, stages locked and people inside. The scripted run stays inside the tower's limit all the way through. The tightest moment is the instant the pins release at full height.

**Fly tab:** you run the storm. It starts when the forecast arrives, with the building full and the storm about four and a half hours away.
- **Deploy.** The slider sets a target height. The drive chases it at full speed, which is faster than the drive can cool.
- **Evacuate.** Empties the building over an hour. The drive will not move while anyone is inside.
- **Lock / Unlock.** Pins release or engage one joint at a time. The drive will not move a locked tower, and pins only engage at an end stop. Released pins cost the tower about half its strength, so never be tall and unpinned in strong wind.
- **Damper.** On or off. It trims the peak wind load by about 18%.
- **Heat.** At full speed the drive overheats in about ten minutes and trips for ten more. Retract in steps and watch the gauge.
- **Time warp.** 1×, 10 s/s, 1 min/s, 5 min/s and 15 min/s.
- **Auto.** Flies the reference plan once so you can see the right answer.
- **The goal.** Get everyone through the storm. The best result is everyone safe and the tower redeployed and locked. Retraction is slow, so you must start on the forecast: Auto started more than about an hour after the forecast arrives loses the tower. If the base stays past its limit for a minute, the tower is lost, and anyone still inside is lost with it.

**What the Fly model simplifies:** scripted wind, one drive, a single base section for strength, one failure rule, and pins that are either all on or all off. The Learn tab says so.

---

## The Graphene topic

A sheet of carbon one atom thick, tested the way it was first measured: lay a flake over a round well in a chip, press its centre with a diamond tip on a cantilever, and record force against depth until it breaks. The model follows the nanoindentation test of Lee and colleagues (Science, 2008). The experiment is BUILT. The apparatus numbers are design values chosen to fit together.

**Reference experiment (BUILT)**

| | |
|---|---|
| Drum | 1 µm across, 0.335 nm thick, about 30 million atoms |
| Stiffness | 340 N/m in 2D, about 1.0 TPa over the thickness, five times steel |
| Strength | about 42 N/m in 2D, about 125 GPa over the thickness, more than 300 times structural steel |
| Strain at the top of the stress curve | about 25% |
| Sharp tip | 16.5 nm radius. Breaks the sheet at about 2.14 µN and a depth of about 117 nm |
| Blunt tip | 60 nm radius. Needs about 7.8 µN and about 416 nm of piezo travel, more than the 260 nm available, so it cannot break the sheet |
| Cantilever | 40 N/m. Bends about 53 nm at the break |

Every number on screen comes from `core.js`: a force made of a pre-tension term and a cubic stretching term, a stress-strain curve that softens at large strain, a stress under the tip from an energy estimate, and a cantilever that bends so the piezo travels further than the tip.

**Learn tab:** 13 sections, from what graphene is and where it came from, how little there is and how stiff and strong it is, through the indentation test, the bending cantilever and the stress under the tip, to electrons and light, heat and gas, making it, uses and an honest list of what the model leaves out.

**World tab:** eight parts: honeycomb lattice, suspended membrane, chip and well, diamond tip, cantilever, laser and detector, piezo scanner and defects. The membrane and tip are drawn to scale, with one scene unit equal to 100 nm. The bonds under the tip turn from blue to red as the strain climbs. With nothing selected, the tip pushes in and retreats on its own and never breaks the sheet. The atoms are drawn about 240 times too large and the cantilever bend 2.5 times larger, and the Learn tab says so.

**Launch tab:** one measurement in 9 phases: peel the flake, find it, place it over the wells, approach, contact, elastic push, stretch, fracture and read the result. Readouts: piezo travel, tip depth, force, cantilever bend, strain, stress, share of strength and tip radius. After the break the readouts hold the peak value.

**Fly tab:** you run the indenter.
- **Piezo.** The slider sets how far the piezo extends. It follows at no more than 80 nm/s, from a 40 nm gap above the sheet. The tip moves less than the piezo, because the cantilever bends.
- **Tip.** Switches between the sharp and blunt tip. It only changes while the tip is clear of the sheet.
- **Retract.** Pulls the piezo back to zero.
- **Time warp.** 0.1×, 0.5×, 1× and 3×.
- **Auto.** Fits the sharp tip and pushes at a steady pace until the sheet breaks.
- **The goal.** Break the sheet and read the peak force. The blunt tip shows why tip radius matters: it runs out of piezo range first.

**What the Fly model simplifies:** the load is a point at the centre of a perfect circular membrane, the stress under the tip comes from an energy estimate, and it leaves out thermal ripples, adhesion, tip wear, slipping at the edge, creep and every defect. A real flake would break somewhat below the perfect value. The Learn tab says so.

---

## The Metamaterials topic

A wedge of copper split rings and wires on circuit board, tested with microwaves around 10 GHz. In a narrow band both its permittivity and its permeability are negative, so its refractive index is negative and a beam bends to the opposite side from an ordinary prism. The experiment is BUILT, in the style of Shelby, Smith and Schultz (Science, 2001). The design values are chosen to fit together and are not a copy of that device. Perfect lenses are PROPOSED, and broadband visible cloaks are THEORETICAL.

**Reference experiment (BUILT)**

| | |
|---|---|
| Cells | 4 mm wide, about 7 per wavelength at 10.7 GHz |
| Wedge | 32 mm thick at the beam, 60 mm tall, exit face tilted 18.4° |
| Wires | plasma frequency 15 GHz, so ε is negative below it |
| Rings | resonant at 10 GHz, so μ is negative from 10 to about 11.55 GHz |
| Negative band | power gets through (at least 1%) from about 10.3 to 11.6 GHz |
| Matched point | n = −1 at about 10.68 GHz, with ε ≈ −0.97 and μ ≈ −1.02, and about 26% of the power through |
| Beam bend there | about +37°, twice the wedge angle, against about −9° for a Teflon wedge (n = 1.44) |

Every number on screen comes from `core.js`: a Drude curve for the wires, a Lorentz curve for the rings, an index from the two with the sign chosen so it is negative when both are negative, an impedance mismatch at each face, absorption through the wedge, and the beam angle from Snell's law at the slanted face.

**Learn tab:** 13 sections, from what a metamaterial is, the refractive index and Veselago's idea, through wires and split rings, the negative band, backward phase and the prism experiment, to loss and bandwidth, the perfect lens, invisibility and its limits, and an honest list of what the model leaves out.

**World tab:** eight parts: copper wires, split rings, circuit board, wedge of cells, Teflon control, microwave source, detector and wave crests. The cells are drawn to scale. The thin bars are the wave crests: they move forward in air and Teflon, and backward inside the metamaterial while the beam still moves forward. Pull-apart separates the wires from the rings. With nothing selected it alternates the Teflon control and the metamaterial and sweeps the frequency. The crests are drawn at a third of their true spacing so several fit on screen.

**Launch tab:** one experiment in 9 phases: the Teflon control, swap in the metamaterial, sweep down, the rings resonate, the negative band, the band closes, blocked, back to normal and the matched point. Readouts: medium, frequency, wavelength, ε and μ, index, beam bend, power through and crest motion.

**Fly tab:** you run the microwave bench.
- **Frequency.** The slider sets the synthesiser from 8 to 16 GHz. It follows at 1 GHz per second.
- **Medium.** Swaps the metamaterial for the Teflon control. The cells disappear and the wedge turns solid.
- **Record.** Logs a measurement. The message says what was seen and which way to go.
- **Time warp.** 0.25×, 0.5×, 1× and 3×, which changes the sweep speed. Use 0.25× to fine-tune.
- **Auto.** Sweeps to the matched frequency and records it.
- **The goal.** Record a point where the index is −1, within 0.15, with at least 8% of the power through. Outside the negative band nothing gets through, because ε and μ have opposite signs and the index is imaginary.

**What the Fly model simplifies:** an effective medium with one permittivity and one permeability for the whole slab, one damping term each for the wires and rings, a beam that hits the first face head on, the same impedance mismatch at both faces, and a detector that rides on the beam. It leaves out coupling between rings and wires, the direction dependence of real cells, beam spreading and fabrication error. The Learn tab says so.

---

## The Orbital data center topic

A compute satellite in a dawn-dusk sun-synchronous orbit at 650 km. That orbit stays in sunlight nearly all year, so the node needs almost no battery, and the real limit is heat: in vacuum the only way to get rid of it is to radiate it. Small GPU satellites in orbit are BUILT. A megawatt-class node like this one is PROPOSED. Gigawatt clusters are THEORETICAL. The design values are chosen to fit together in the spirit of published concepts, and are not a copy of any company's design.

**Reference design (PROPOSED)**

| | |
|---|---|
| Orbit | 650 km, 98° inclination, 97.6 min per lap, about 14.8 laps a day |
| Compute | 700 accelerators at 1 kW each, 693 PFLOP/s peak, 740 kW with housekeeping |
| Array | two sun-tracking wings, 2,800 m², about 0.92 MW on a sunny day |
| Radiators | 850 m² of flat two-sided fins kept edge-on to the Sun, about 45 °C at full load |
| Chips | about 80 °C at the junction at full load, against an 85 °C limit |
| Shield | 5 mm aluminium-equivalent vault around the compute, a 15 krad budget |
| Mass | about 29 t |
| Links | laser terminals 10 cm across: 8 Tb/s to a neighbour 200 m away, 100 Gb/s to the ground |
| Shadow | up to about 20 min a lap in the shadow season, sunlit about 96% of the year |

Every number on screen comes from `core.js`: solar flux and cell efficiency that falls as the cells warm, the Stefan-Boltzmann law for radiator area with Earth heat and reflected sunlight added, one lumped thermal mass, orbit period and eclipse from the Sun angle through the year, a fixed radiation dose curve, bit-flip rates and job restarts with Young-Daly checkpointing, laser link budgets, ground pass geometry, drag, mass and launch cost.

**Learn tab:** 14 sections, ending in an honest list of what the model leaves out. Facts about real missions are as reported by late November 2026.

**World tab:** nine parts: solar array, radiators, compute, radiation shield, power electronics, thermal loop, laser links, bus and orbit. The Earth is generated in code. The node is drawn about ten thousand times too large against it, with the true ratio of Earth's radius to the orbit's. The Sun direction and the Earth's shadow follow the real geometry, the wings turn to face the Sun and the fins stay edge-on. The radiators glow with temperature and the racks with load. In World and Learn the season is sped up so the shadow season can be seen arriving.

**Launch tab:** one mission in 9 phases over about 8 hours: launch, release and sun lock, unfold, power up, compute load, laser link, ground pass, particle storm, shadow season. The last phase jumps six months ahead. Eight readouts stay on screen (time, altitude, Sun angle, array power, power draw, radiators, chip junction, compute) and two change with the phase. The radiator temperature and battery charge are stepped through the whole mission once at load, so the lag behind the load is real and scrubbing back and forth never disagrees.

**Fly tab:** you manage the node through 24 hours of the shadow season.
- **Load.** The slider sets the compute load. Compute stops by itself in shadow, because the array makes nothing and the battery only carries housekeeping.
- **Heat.** The radiators and chips follow the load with a lag. At the chip limit of 85 °C the node trips and shuts the compute down. It restarts only when the chips, at the load you ask for, are 12 K under the limit, so a lower load restarts sooner. A live Safe load gauge shows what the radiators can carry.
- **The radiator hit.** After 3.5 hours a micrometeoroid cuts a fin and 30% of the radiator area is gone. Full load now overheats. One fin shortens on screen.
- **The storm.** From hour 8 to hour 11 a particle storm makes restarts about 30 times as common.
- **Checkpoint.** Cycles 30, 60, 150, 300 and 900 seconds. Short intervals lose less work per restart but cost more time. The best choice is near 900 s in quiet and near 150 s in the storm.
- **Downlink.** Results only count once they are sent. Seven ground passes of about 9 minutes each fall at fixed times. Press Downlink during a pass to send the buffer at 100 Gb/s. The buffer holds 12 TB, and compute pauses when it is full.
- **Idle.** Drops the load to zero.
- **Time warp.** 1x, 1 min/s, 10 min/s and 30 min/s. It starts at 10 min/s, so a day takes about 2.5 minutes.
- **Auto.** Flies the reference plan once so you can see the right answer: it holds the safe load, shortens checkpoints in the storm and opens every downlink.
- **The goal.** Send 28 TB of results to the ground in 24 hours. Auto reaches about 30 TB. Full load all day ends in repeated trips, and a steady 75% load with no tuning falls short.

**What the Fly model simplifies:** restarts are a smooth average rather than random events, the passes are on a fixed schedule, the results are one fixed amount per unit of compute, and the radiator environment is the orbit average. The Learn tab says so.

---

## The Microbot swarm topic

Slender magnetic bots flow out of a pile, crawl over each other and lock into sculptures: a hand, tendrils, a breaking wave, an arch, a twisted column and a tree. The reference bot (MK1) is a composite of published swarm and modular-robot work, not one device, and its shape follows a picture of a Fusion 360 model. Weight and the magnet law are real physics. Size, magnet recess, battery share, drive power and radio timing are design values.

**How real it is**

| Label | What |
|---|---|
| BUILT | Swarms that coordinate flat shapes (Kilobots, 1,024 robots). Modular self-reconfiguring robots at tens of units. Neodymium magnets, thin-film cells and tiny radios as parts |
| PROPOSED | This bot, its walking ball joint, and the sculptures |
| THEORETICAL | Bundles that lock well enough to hold the sculptures. A swarm of millions, as in Big Hero 6 |

**Reference bot (PROPOSED)**

| | |
|---|---|
| Shape | two tapered eight-sided segments on a ball joint, 6.8 mm long, 2 mm across the shoulders (3.4 : 1), end faces 1 mm, ball 1.44 mm |
| Mass | about 32 mg |
| Joint | shoulders touch at a fold of about 85°, works to 60° |
| Magnets | ten neodymium discs: one behind each end face, four behind the long flats of each segment |
| End bond | about 8.9 mN, 28 bots hanging |
| Flank bond | about 2.2 mN, 7 bots, when two flats meet flush and their magnets line up |
| One level chain | holds only about 2 bots |
| Battery | thin-film, 30% of the volume, about 1.34 J, 80% usable, 7.5 hours idle |
| Drive | 6 mW, 10 mm/s |
| Radio | 50 µW idle, 0.1 s per hop |

**From bots to shapes**

- A shape is a few smooth curves, each with a thickness that can change along it.
- Each curve is filled with strands: chains of bots joined end to end and bending at their balls.
- Strands sit 1.667 mm apart on a square grid, with every second one slid 1.6 mm along. This saves about 31% of the cross-section.
- The structure check covers bending on the end bonds, squeeze, tipping, sliding (including arch feet) and the joint bend limit. It is first-order statics.

**The open problem.** The sculptures pass the check only if the strands in a bundle grip each other and bend as one beam. At the packed spacing the flank magnets miss each other and pull only about 0.38 mN per bot toward a neighbour (a rough estimate). If every strand bends alone, all six shapes fail at size 1 and larger. The tendrils at 1.5 times would need 476% of the bond limit, against 19% when locked.

**Learn tab:** 17 sections, from the idea and the reference bot to magnets, chains, bundles, the open problem, how the swarm flows, the structure check, power, heat, scale, radio, a swarm of millions and an honest status check.

**World tab:** one bot only. Six parts: tapered segments, ball joint and drive, magnets, battery, radio and brain, and structure analysis (dimension lines). Selecting the joint folds the bot to its limit. Selecting an inside part, or pulling apart, turns the segments see-through.

**Launch tab:** 6 phases: pile, trunk rises, tendrils reach (4,194 bots), stand and check, let go and flow back, and reshape into a hand (2,817 bots). The same pile of bots makes both.

**Fly tab:** you command the swarm.
- **Shape.** Cycles the six sculptures, then any added with `T.addForm`.
- **Size.** 0.7, 1, 1.5, 2 and 3 times. Sizes that would be far above 45,000 bots are skipped.
- **Lanes.** 4, 16, 64 or 256 walking lanes. More lanes build faster, but more bots walk at once, which makes heat.
- **Strands.** Locked or loose bundles in the structure check.
- **Release.** The swarm lets go from the tips and flows back to the pile.
- **Drive slider.** How hard the swarm walks. Slower is cooler, but waiting bots keep draining.
- **Limits.** 40 K above the room, and 80% of any battery.
- **Time warp.** 1×, 5×, 20×, 2 min/s and 10 min/s. It starts at 20×.
- **Auto.** Eases the drive off as the swarm warms.
- **What to try.** The arch at 2 times with 256 lanes overheats. The same arch with 4 lanes and the drive at 15% runs out of battery. The wave at 3 times slides apart. Loose strands hold a hand at 0.7 times but not at 1.

**Adding a shape** takes one call in `forming.js`:

```js
T.addForm('horn','Horn',k=>[
 T.stroke([[0,0,0],[0,0,20*k],[10*k,0,40*k]],10*k,2*k)
]);
```

A stroke is a list of control points in millimetres (z up), then the radius at the start and at the end. A branch takes `{on:index}` naming the stroke it grows from, and an arch with both feet on the floor takes `{arch:true}`. It appears under the Fly tab's Shape button on its own.

**What the model simplifies:** the build order is worked out in advance rather than by each bot's local rules, walking paths are simplified and bots can pass through each other, magnet forces are a two-dipole estimate, bots that overlap where curves join are dropped, and there are no radio collisions, crowding or failed bots.

**Related topics:** Nanobots (Life and Medicine) and Metamaterials (Materials and Nano).

---

## Project structure

Howverse is plain HTML, CSS and JavaScript with no build step. It runs on any static host. Vue 3, Vue Router and three.js load from a CDN.

```
index.html              the single entry page; loads the core scripts in order
css/
  base.css              colours, fonts, page transitions
  loader.css            the intro animation
  home.css              the swipe rail, cards, chips and the topic carousel
  sector.css            the sector page and its search bar
  topic.css             the topic page: tabs, dock, gauges, Fly controls
js/
  app.js                router and start-up (keep it tiny)
  data/sectors.js       all sector and topic listings
  core/scene.js         the one shared three.js renderer
  ui/loader.js          the intro
  ui/home.js            the swipe home screen and the topic carousel
  ui/sector.js          the sector page and its search
  ui/topic.js           the topic page and its tabs, and the on-demand topic loader
  topics/<sector>/      one folder per sector, one file per topic
    flight/spaceship.js
    life/nanobots/
    mega/deployable-tower/
    nano/graphene/
    nano/metamaterials/
    mind/orbital-data-center/
    bots/microbot-swarm/
    energy/fusion-reactor/
      index.js          the manifest: the list of files, in load order
      core.js           shared constants and helpers
      parts.js          the World tab parts
      world.js          the 3D scene
      mission.js        the Launch tab mission, and the shared plasma model
      fly.js            the Fly tab model (needs mission.js loaded first)
      learn.js          the Learn tab text
      register.js       registers the topic, loaded last
```

Nanobots, Deployable tower, Graphene, Metamaterials, Orbital data center and Microbot swarm use the same multi-file layout as Fusion reactor. One 3D renderer stays alive across all pages. This keeps the app light, which matters because it is built and used on phones.

---

## How a topic is built

A topic is one file that registers itself in `HV.topics` under its slug. The topic page reads it and draws every tab.

```js
HV.topics.spaceship = {
  slug, title, hook, stats,      // header and the three headline numbers
  learn,                         // the Learn story: sections, each with a label
  parts,                         // the World tab's parts: name, label, description, key numbers
  create,                        // builds the 3D model: update(dt, time, o), dispose()
  mission,                       // the Launch timeline: at(u), read(state), phases
  fly                            // optional: a live flight model for the Fly tab
};
```

- **A new sector** is one new entry in `js/data/sectors.js`. The cards, chips and counter update automatically. Each sector can also carry an `ideas` list, plain strings for concepts that are not yet topics. They show as "More ideas" chips under the home card and are not tappable.
- **A new topic** is one new folder at `js/topics/<sector id>/<slug>/`, plus its slug added to `HV.BUILT` in `js/data/sectors.js`. Inside the folder, `index.js` lists the topic's files and the loader runs them in order. Topics load on demand when the visitor taps them, so `index.html` never changes. A topic can have as many files as it needs, and working on it touches only its own folder. A single file at `js/topics/<sector id>/<slug>.js` still works for small topics. If a file is missing or at the wrong path, the sector page shows exactly which path failed.
- **The 3D model's `update`** is called as `update(dt, time, o)`, where `o` carries `state` (the Launch or Fly readings), `tab`, `explode` (the pull-apart slider, 0 to 1) and `sel` (the selected part). A model that takes a different signature will not respond to the slider, the selection or the mission.
- **The Fly tab** appears on its own when a topic provides `fly`. A flight model can bring its own controls: `ui` (slider label and range, button list), `warp` and `warpL` (time-warp steps) and `dtmax` (largest physics step). Without them the spaceship controls are shown. A button in `ui.btns` can carry its own label (`lf`, a function) and its own pressed state (`on`, a function). The keys the page knows are `flip`, `cut`, `warp`, `auto`, `reset`, `drop`, `lamps`, `evac`, `lock` and `damper`. A new key needs one entry in `act` in `ui/topic.js` that calls the matching method on the flight model.
- **Reserved state keys.** The topic page reads `n` (phase name) and `f` (phase text) from every Launch and Fly state, so a physics model must never return its own values under those two names. Metamaterials returns `fr` for frequency and `nc` for the complex index for this reason.
- **Reusing page keys.** A flight model can borrow a known key for a different job and give it its own label with `lf`. Graphene uses `lamps` for the tip change and `cut` for Retract. Metamaterials uses `lamps` for the medium swap and `drop` for Record. Fusion reactor uses `drop` for Fuel + and `lamps` for Fuel −. Do not borrow `cut`: the page maps it to the heating slider, not to the model. This needs no change to `ui/topic.js`.
- **Time-warp list length.** The page starts on warp step 3 (index 2), so a flight model's `warp` list needs at least three entries.
- **File order matters.** If one file uses helpers from another, the manifest must list the provider first. In Fusion reactor, `mission.js` comes before `fly.js`.
- Each topic is self-contained, so topics can be built one at a time, in any order, with any tool.

---

## Design principles

- **Teach first.** Every screen exists to help someone understand something.
- **Phone first.** Designed for thumbs and small screens before anything else.
- **Light and fast.** One renderer, no image files (planets and textures are generated in code), quick to open.
- **Honest.** Claims are labelled, numbers are real, speculation is marked as speculation and simplifications are stated.
- **Hands on.** Where possible, the visitor does not just watch. They fly it, and their choices change the result.
- **Consistent.** Every topic follows the same tabs, so what is learned on one carries to the next.
- **Expandable.** Small independent pieces, so the library can grow without breaking what already works.

---

## Deployment

Upload the whole folder to a static host such as Vercel. The app loads its libraries from a CDN, so visitors need an internet connection on first load. After an update, hard refresh once so old CSS and scripts are not served from cache.

---

## Roadmap

1. ~~Build the Spaceship topic as the reference template.~~ Done.
2. ~~Add a registry so each topic file registers itself and opens from its sector page.~~ Done.
3. Build **Submersible** (Ocean and Deep), a topic in a different sector to prove the template carries over.
4. ~~Build a third topic, **Nanobots**, at a scale where the physics is very different.~~ Done.
5. ~~Finish **Fusion reactor**: hook the Fly model into `register.js` and confirm all four tabs run.~~ Done. The Auto plan now holds the full 400 s burn.
6. ~~Build **Deployable tower** (Megastructures): a tall structure that telescopes itself down and opens up again. It is the first structure topic, where the physics is loads, buckling and wind rather than fuel or flow.~~ Done.
7. ~~Add the home carousel, the "More ideas" row and the sector search bar.~~ Done.
8. ~~Build the Materials and Nano sector: **Graphene** and **Metamaterials**.~~ Done.
8a. ~~Build **Orbital data center**, the first Computing and AI topic.~~ Done.
8b. ~~Build **Microbot swarm** (Robotics): slender ball-jointed magnetic bots that grow free-form sculptures from strands.~~ Done. Open: make the strands in a bundle grip each other.
9. Build **Rocket and capsule**, and move the code the topics share (formatters, the 3D scaffolding) into one place.
10. Build one flagship topic per sector, so all eleven feel alive.
11. Fill in the remaining topics.
12. Consider bringing the Virtual Verse story back later as an optional layer.
