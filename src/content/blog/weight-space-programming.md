---
title: "Writing motion into weights: a weight-space programming experiment"
date: 2026-11-25
description: "GPT-6 Astra wrote two tiny controllers directly as weights. Watch their recorded docking and warehouse decisions."
tags: [llm, evaluation]
draft: true
wide: true
css: ["/blog/weight-space-programming/replay.css"]
js: ["/blog/weight-space-programming/timeline-data.js", "/blog/weight-space-programming/replay-v2.js"]
---

Can an LLM write a neural network's weights directly? Inspired by [weight-space programming](https://rikiyat.github.io/blog/weight-space-programming/), I asked GPT-6 Astra to build two small controllers: one to dock with a moving spacecraft, and one to route warehouse robots. The writer had no web or code tools and never trained the networks. It could only write weights, run the fixed evaluator, and revise them from the feedback.

- **Two networks:** 3,623 parameters (0.014 MB) for docking; 1,633 parameters (0.0065 MB) for warehouse traffic, counting float32 weights and biases.
- **One writer attempt per task:** the page follows the first 10 evaluation calls, each testing 20 complete practice episodes. Checkpoints 0, 5 and 10 mark cumulative progress.
- **Unseen test:** 200 new episodes per shown checkpoint, 50 in each challenge family. The writer did not see these results before its choices were fixed.

## At a glance

- **Docking:** 0 / 200 docks with the first weights → **200 / 200** after 10 calls. It learned to approach the port and clear the panel and debris.
- **Warehouse:** 57.6 → **59.0 on-time jobs** per unseen episode. Most gain came from the closure and slowdown cases.

**The striking result is docking:** retrospective scoring shows the first 200/200 controller at call 7; the selected call 10 controller also docked in every unseen case. Warehouse improved only modestly. These are two recorded writer trajectories, not an estimate of how often a fresh attempt would work.

## When the weights changed

The writer edited the weights after every call shown. Hover or select a point to see a short description of the edit and expand the **model's submitted note**. That note is part of the recorded output, not private reasoning. The grey line shows 200-case unseen scores computed afterward; the writer never saw them. Each mint point is a 20-episode practice score.

<figure class="wsp-timeline" data-wsp-timeline aria-label="Weight edits and practice scores by evaluation call"><p>The timeline requires JavaScript.</p></figure>

## Spacecraft docking

The chaser starts about 25 metres from a rotating ghost ship. The goal is to touch its moving collar slowly and aligned, without hitting the hull, an attached panel, or drifting debris. A safe hold avoids a crash but does not count as docking. Its 72 → 32 → 32 → 7 network commands three thrust axes, three rotation axes, and a hold or abort signal every step.

The four **challenge families** each have 50 unseen variants:

1. **Moving collar:** the target drifts and tumbles.
2. **Panel bypass:** an attached panel blocks the direct path.
3. **Crossing debris:** three moving objects cross the approach.
4. **Combined salvage:** collar, panel and debris together.

The replay uses one rotatable 3D view; its corner axes each mark 3 m. The blue craft is the ghost ship, and the dashed outline is its collision boundary. The green trail bends when the controller changes approach stage. Objects that overlap on screen can be apart in depth; the caption gives the closest measured debris gap. The flight console shows the network's commands. Episodes play back to back, with a choice of checkpoint and challenge.

<figure class="wsp-replay" data-wsp-replay="docking" aria-label="Spacecraft docking test replays"><p>The replay requires JavaScript.</p></figure>

| Calls spent | 0 | 5 | 10 |
| :-- | --: | --: | --: |
| Successful docks / 200 | 0 | 100 | 200 |
| Mean fuel used | 0.155 | 0.232 | 0.387 |

Checkpoint 0 held safely in all 200 cases. At call 5 it docked in the moving-collar and debris-only families, but never cleared the panel. At call 10 it docked in all four. Fuel averages include failed episodes.

## Warehouse traffic

Six robots share a three-by-three grid of single-width aisles. The network scores each possible move; a fixed safety layer blocks conflicting moves.

1. A dispatcher gives a robot a job and a deadline.
2. The robot collects a pod from a blue **P** location.
3. It brings the pod to an amber **PICK** station for service.
4. It returns the pod to storage. Only then is the job complete.

The four challenge families are balanced flow, a pick-station burst, a narrow bottleneck, and a temporary link closure with one slowed robot. In the replay, numbered carts are robots; mint means travelling, amber means station service, and grey means idle. Shelves are storage pods, desks are pick stations, and a red dashed aisle is closed. Select a robot to highlight its destination.

<figure class="wsp-replay" data-wsp-replay="warehouse" aria-label="Warehouse traffic test replays"><p>The replay requires JavaScript.</p></figure>

| Calls spent | 0 | 5 | 10 |
| :-- | --: | --: | --: |
| On-time jobs / episode | 57.6 | 58.3 | 59.0 |
| Late or unfinished / episode | 11.3 | 10.5 | 9.8 |

The gain was concentrated in the closure and slowdown cases: on-time jobs rose from 55.8 to 60.5 per episode. The other three families changed by 0.2–0.5 jobs.

## What these results mean

An LLM wrote a small docking controller that succeeded on all 200 held-out cases in this simulator, without optimizing weights by training. It made a much smaller difference to warehouse traffic. The tests cover fixed simulators and seed distributions, not real spacecraft or warehouses. With one writer attempt per task, they show what happened in these runs, not how reliably another run would repeat them.

Every practice and unseen episode, decision, and checksum was saved. This page replays 200 unseen episodes at each of three checkpoints per task. The original writer run continued beyond call 10; those later calls are kept in the private record and excluded from this ten-call view. The original evaluation rules and complete records were preserved.
