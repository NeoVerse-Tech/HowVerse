# Howverse

**Learn how the future gets built.**

Howverse is a phone-first, swipeable library that explains how pioneering science, technology and engineering actually works. You pick a sector, read a short story about a topic, step into a live 3D world of it, and launch it to watch it run. You can orbit it, pull it apart and see the real numbers.

It grew out of Virtual Verse. The city game and the story were removed, and what remains is the part that teaches.

---

## What a visitor experiences

1. **Arrival.** The intro animation plays the moment the page opens. A galaxy collapses into a glowing orb, flashes, then bursts into a star field.
2. **Home.** Eleven sector cards sit in a row. The next card peeks in from the edge, so it is clear you can swipe. A strip of icon chips lets you jump straight to any sector, and a counter shows where you are.
3. **Sector.** Opening a sector lists its topics.
4. **Topic.** Each topic runs in three steps: Learn, then World, then Launch.

---

## The three steps of every topic

- **Learn.** A short story of how the thing works, in plain language.
- **World.** A live 3D scene of the thing that you can orbit and pull apart.
- **Launch.** Run it and watch it operate, with real numbers beside it.

Every topic follows the same three steps, so a visitor always knows what to expect.

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
| Megastructures | Engineering at planetary scale | Space elevator, Orbital ring, Ark station |
| Life and Medicine | Rebuilding the body from inside | Bloodstream, Nanobots, Gene editing |
| Earth and Climate | Reading and reshaping a planet | Terraforming, Geothermal, Storm science |
| Computing and AI | Machines that think and calculate | Inside a chip, Quantum computer, Orbital data center |
| Transport | Moving people faster and cleaner | Maglev, Vacuum tube, Hover vehicles |
| Ocean and Deep | The frontier under the surface | Undersea habitat, Submersible |
| Materials and Nano | Matter, designed from the atom up | Graphene, Metamaterials |
| Physics Frontier | Where known physics gets strange | Black hole, Time dilation, Warp drive |
| Robotics | Machines that build, farm and walk | Robot farm, Giant mech |

That makes 30 topics in total. Each sector has its own colour, which tints the star field and the interface while you are inside it.

---

## Current status

The shell is built: the intro animation, the swipeable home screen, quick-jump chips, and the sector pages. Topics currently show as "Coming soon". The first topic to be built will be the Spaceship, and it will become the template for the other 29.

---

## Project structure

Howverse is plain HTML, CSS and JavaScript with no build step. It runs on any static host.

- **index.html**: the single entry page.
- **css/**: styles, split by purpose: base, loader, home and sector.
- **js/app.js**: wires the pages together and starts the intro.
- **js/data/**: all sector and topic content in one place.
- **js/core/**: the single 3D renderer shared by every page.
- **js/ui/**: the loader, the home screen and the sector page.
- **js/topics/**: one folder per sector, one file per topic. This is where the 30 topics will live.

One 3D renderer stays alive across all pages. This keeps the app light, which matters because it is built and used on phones.

---

## How it grows

- **A new sector** is one new entry in the data file. The cards, chips and counter update automatically.
- **A new topic** is one new file in its sector's topic folder, plus one line in the main page to load it.
- **Nothing else needs to change.** Each topic is self-contained, so topics can be built one at a time, in any order, with any tool.

---

## Design principles

- **Teach first.** Every screen exists to help someone understand something.
- **Phone first.** Designed for thumbs and small screens before anything else.
- **Light and fast.** One renderer, no heavy assets, quick to open.
- **Honest.** Claims are labelled, numbers are real, speculation is marked as speculation.
- **Consistent.** Every topic follows the same Learn, World, Launch pattern.
- **Expandable.** Small independent pieces, so the library can grow without breaking what already works.

---

## Deployment

Upload the whole folder to a static host such as Vercel. The app loads its libraries from a CDN, so visitors need an internet connection on first load.

---

## Roadmap

1. Build the Spaceship topic as the reference template.
2. Add a simple registry so each topic file can register itself and open from its sector page.
3. Build one flagship topic per sector, so all eleven feel alive.
4. Fill in the remaining topics.
5. Consider bringing the Virtual Verse story back later as an optional layer.
