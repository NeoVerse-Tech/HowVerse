# Howverse

**Learn how the future gets built.**

A phone-first, swipeable library explaining pioneering science and engineering. Pick a sector, read how a thing works, open its live 3D model, run it and, where it makes sense, take the controls. Numbers come from real physics and claims are labelled by how real they are. It grew out of Virtual Verse, keeping the part that teaches.

## What you do

- **Home:** swipe through 11 sector cards with a topic carousel.
- **Sector:** search its topics.
- **Topic:** **Learn** (plain-language story), **World** (3D model you can pull apart), **Launch** (guided mission replay), **Fly** (control a live physics model).

**Labels:** **BUILT** exists today. **PROPOSED** is a serious design, not built. **THEORETICAL** is allowed by known physics, unproven.

## Sectors (33 topics, built in bold)

| Sector | Topics |
|---|---|
| Spaceflight | **Spaceship**, Rocket and capsule, Fusion drive |
| Energy | **Fusion reactor**, **Dyson swarm**, Space solar power |
| Megastructures | Space elevator, Orbital ring, Ark station, **Deployable tower** |
| Life and Medicine | Bloodstream, **Nanobots**, Gene editing |
| Earth and Climate | Terraforming, Geothermal, Storm science |
| Computing and AI | Inside a chip, Quantum computer, **Orbital data center** |
| Transport | Maglev, Vacuum tube, Hover vehicles |
| Ocean and Deep | Undersea habitat, Submersible |
| Materials and Nano | **Graphene**, **Metamaterials** |
| Physics Frontier | Black hole, Time dilation, Warp drive |
| Robotics | Robot farm, Giant mech, **Microbot swarm**, **Octopus arms** |

## Built tech

| Topic | What it is | Your goal in Fly |
|---|---|---|
| **Spaceship** (THEORETICAL) | Crewed fusion ship to Mars | Arrive slow enough, close enough |
| **Fusion reactor** (PROPOSED) | ITER-style tokamak | Hold 400 MW for 400 s |
| **Dyson swarm** | Collectors orbiting the Sun to harvest its power | |
| **Deployable tower** (PROPOSED) | 300 m tower that folds to 60 m for storms | Keep everyone safe, then redeploy |
| **Nanobots** (PROPOSED) | Magnetic corkscrew robot for blood clots | Clear the clot face |
| **Orbital data center** (PROPOSED) | 700 GPU compute satellite | Downlink 28 TB in 24 h |
| **Graphene** (BUILT experiment) | Poking a one-atom-thick drum | Break it and read the force |
| **Metamaterials** (BUILT experiment) | Bending microwaves the "wrong" way | Record a point where n = -1 |
| **Microbot swarm** (PROPOSED) | Magnetic bots that flow into sculptures | Build a shape that holds |
| **Octopus arms** (PROPOSED) | Four wearable snake arms, 1.4 m reach | Reach, hold and carry within limits |

Octopus arms status: fixed-base snake arms and lab wearable extra limbs are BUILT; the four-arm harness and standing on the arms are PROPOSED; self-thinking arms are THEORETICAL.

## For builders

Plain HTML, CSS and JavaScript with Vue 3, Vue Router and three.js from a CDN. No build step. Deploy the folder to any static host (e.g. Vercel), then hard refresh after updates.

```
index.html
css/
js/app.js                      router and start-up
js/data/sectors.js             sector and topic lists, HV.BUILT
js/core/scene.js               shared three.js renderer
js/ui/                         loader, home, sector, topic
js/topics/<sector>/<slug>/     index, core, parts, learn, mission, world, fly, register
```

**New topic:** add the folder and put its slug in `HV.BUILT`. It registers in `HV.topics` with `slug, title, hook, stats, learn, parts, create, mission` and optional `fly`.

**Rules that prevent breakage**
- In `update(dt, time, o)`, `o.state` is the whole readout; unwrap it before using the inner state.
- Never name state values `n` or `f`.
- Every Fly button key needs an entry in `act` in `ui/topic.js`. Never borrow `cut`.
- `fly.js` loads after `mission.js`; `register.js` loads last.

## Next

1. Hover glider and flight suit (Transport).
2. Hologram and drone illusion system.
3. Submersible, then Rocket and capsule.
4. Fly 2.0, below.

## Fly 2.0: pilotable mini-worlds

**Vision.** Today you control a model. Next, you step inside its world and pilot it, with the same real physics underneath.

| World | You pilot | Mission idea | You feel |
|---|---|---|---|
| **Octopus workshop** | The wearer and each arm | Climb to a ledge, fetch a crate, survive a stumble | Reach, balance, weight |
| **Swarm lab** | The swarm as one body | Flow through a gap, rebuild as a bridge, carry an object | Heat, battery, grip |
| **Mars run** | The spaceship | Leave orbit, flip, brake, capture | Inertia, fuel, timing |

**Shared pilot interface**
- Left thumb moves, right thumb looks, buttons act. Keyboard and gamepad too.
- Chase, cockpit and free cameras.
- A HUD showing live limits, so you see why something failed.
- Missions in three levels: Learn, Pilot, Expert.
- Auto pilot to demonstrate, ghost runs to beat, shareable run links.

**Build order**
1. Shared Fly shell (controls, camera, HUD, objectives).
2. Octopus workshop, since its shelf, ladder and ledge already exist.
3. Swarm lab.
4. Mars run.
5. Other topics one at a time; each keeps its current Fly tab until ready.

**Ground rules:** physics stays in each topic's `fly.js` (extended where movement needs it), no image files, one renderer, smooth on a phone.
