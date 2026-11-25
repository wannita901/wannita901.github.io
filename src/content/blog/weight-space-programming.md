---
title: "From weights to motion: two weight-space programming experiments"
date: 2026-11-25
description: "GPT-6 Astra wrote two tiny controllers directly as weights. Watch their recorded docking and warehouse decisions."
tags: [llm, evaluation]
draft: true
wide: true
css: ["/blog/weight-space-programming/replay.css"]
js: ["/blog/weight-space-programming/timeline-data.js", "/blog/weight-space-programming/replay-v2.js"]
---

Can an LLM write a neural network's weights directly? Inspired by [weight-space programming](https://rikiyat.github.io/blog/weight-space-programming/), I asked GPT-6 Astra to build two small controllers: one to dock with a moving spacecraft, and one to route warehouse robots. The writer had no web or code tools and never trained the networks. It could only write weights, run the fixed evaluator, and revise them from the feedback.

- **Two networks:** 3,623 parameters for docking; 1,633 for warehouse traffic.
- **One writer attempt per task:** 20 evaluation calls, each testing 20 complete practice episodes. Checkpoints 0, 5, 10, 15 and 20 mark cumulative progress.
- **Unseen test:** 200 new episodes per checkpoint, 50 in each challenge family. The writer did not see these results before its choices were fixed.

## At a glance

- **Docking:** 0 / 200 docks with the first weights → **200 / 200** after 20 calls. It learned to approach the port and clear the panel and debris.
- **Warehouse:** 57.6 → **59.0 on-time jobs** per unseen episode. Most gain came from the closure and slowdown cases.

**The striking result is docking:** retrospective scoring shows the first 200/200 controller at call 7; the selected call 10 controller also docked in every unseen case. Warehouse improved only modestly, and at call 20 the writer kept its call 15 controller. These are two recorded writer trajectories, not an estimate of how often a fresh attempt would work.

## When the weights changed

The chart follows each **practice evaluation call**. Red marks show weight edits; select a point to read the writer's recorded explanation. The 10-call view focuses on the rapid docking gain. Calls 11–20 were still run: docking success stayed at 20/20 practice cases, while approach time and other safety details continued to change. The grey line adds retrospective 200-case unseen scores at every saved call through 10; these were computed only after the writer had finished and were never feedback for its edits. The separate checkpoint results are reported below.

<figure class="wsp-timeline" data-wsp-timeline aria-label="Weight edits and practice scores by evaluation call"><p>The timeline requires JavaScript.</p></figure>

## Spacecraft docking

The chaser starts about 25 metres from a rotating ghost ship. The goal is to touch its moving collar slowly and aligned, without hitting the hull, an attached panel, or drifting debris. A safe hold avoids a crash but does not count as docking. Its 72 → 32 → 32 → 7 network commands three thrust axes, three rotation axes, and a hold or abort signal every step.

The four **challenge families** each have 50 unseen variants:

1. **Moving collar:** the target drifts and tumbles.
2. **Panel bypass:** an attached panel blocks the direct path.
3. **Crossing debris:** three moving objects cross the approach.
4. **Combined salvage:** collar, panel and debris together.

The rotatable 3D scene shows the recorded positions and orientations. Drag it to inspect depth. The dark sphere is the ghost ship, **not a planet**: this experiment simulates close approach in a frame moving with the target, so its orbital path around a planet is outside the scene. The sharp bend in the green trail is the controller switching between staging, panel bypass, crossing, and final approach targets; it is not an orbital path. Red debris may overlap the chaser on screen while passing at a different depth, so the caption reports their measured closest 3D gap. The command bars below show what the controller actually sent at each moment. Play runs the unseen episodes back to back; the episode and checkpoint controls let you jump anywhere.

<figure class="wsp-replay" data-wsp-replay="docking" aria-label="Spacecraft docking test replays"><p>The replay requires JavaScript.</p></figure>

| Calls spent | 0 | 5 | 10 | 15 | 20 |
| :-- | --: | --: | --: | --: | --: |
| Successful docks / 200 | 0 | 100 | 200 | 200 | 200 |
| Mean fuel used | 0.155 | 0.232 | 0.387 | 0.442 | 0.415 |
| Mean duration (s) | 20.5 | 33.5 | 76.9 | 64.5 | 57.0 |
| Mean unapproved time near hull (s) | 0 | 0 | 3.53 | 1.50 | 0 |

Checkpoint 0 held safely in all 200 cases. At call 5 it docked in the moving-collar and debris-only families, but never cleared the panel. At call 10 it docked in all four. Docking success then stayed at 200/200, but later edits shortened the mean approach from 76.9 to 57.0 seconds and removed unapproved time near the hull. Fuel averages include failed episodes.

## Warehouse traffic

Six robots share a three-by-three grid of single-width aisles. The network scores each possible move; a fixed safety layer blocks conflicting moves.

1. A dispatcher gives a robot a job and a deadline.
2. The robot collects a pod from a blue **P** location.
3. It brings the pod to an amber **PICK** station for service.
4. It returns the pod to storage. Only then is the job complete.

The four challenge families are balanced flow, a pick-station burst, a narrow bottleneck, and a temporary link closure with one slowed robot. In the replay, numbered circles are robots; mint means travelling, amber means station service, and grey means idle. A red dashed aisle is closed. Select a robot to follow its current pod and destination.

<figure class="wsp-replay" data-wsp-replay="warehouse" aria-label="Warehouse traffic test replays"><p>The replay requires JavaScript.</p></figure>

| Calls spent | 0 | 5 | 10 | 15 | 20 |
| :-- | --: | --: | --: | --: | --: |
| On-time jobs / episode | 57.6 | 58.3 | 59.0 | 59.0 | 59.0 |
| Late or unfinished / episode | 11.3 | 10.5 | 9.8 | 9.8 | 9.8 |

The gain was concentrated in the closure and slowdown cases: on-time jobs rose from 55.8 to 60.5 per episode. The other three families changed by 0.2–0.5 jobs. The writer reused checkpoint 15 at checkpoint 20, so those test results are identical.

## What these results mean

An LLM wrote a small docking controller that succeeded on all 200 held-out cases in this simulator, without optimizing weights by training. It made a much smaller difference to warehouse traffic. The tests cover fixed simulators and seed distributions, not real spacecraft or warehouses. With one writer attempt per task, they show what happened in these runs, not how reliably another run would repeat them.

Every practice and unseen episode, decision, and checksum was saved. Docking has 1,000 distinct unseen episode records across five checkpoints. Warehouse has 800 because checkpoints 15 and 20 use the same controller. After warehouse call 14, the repeated prompt exceeded the client input limit; later prompts kept previous actions and aggregate scores plus the latest full feedback. The original records and evaluation rules were preserved.
