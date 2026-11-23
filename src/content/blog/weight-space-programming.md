---
title: "Can an LLM write the weights for a controller?"
date: 2026-11-24
description: "One untrained weight-writing attempt for a spacecraft docking controller and a warehouse traffic controller, with recorded replays and unseen tests."
tags: [llm, evaluation]
draft: true
wide: true
css: ["/blog/weight-space-programming/replay.css"]
js: ["/blog/weight-space-programming/replay-data-v2.js", "/blog/weight-space-programming/replay-v2.js"]
---

Can a language model write the numbers inside a neural network, without training it? Inspired by [weight-space programming](https://rikiyat.github.io/blog/weight-space-programming/), I gave GPT-6 Astra two small controllers to write from scratch: one for a spacecraft approaching a moving dock, and one for six warehouse robots carrying storage pods to pick stations. The model could not browse the web or run code while writing the weights. There was no gradient-based training in these writer attempts.

Choose a spacecraft challenge and checkpoint below to watch the recorded chaser path around a moving dock, panel, or debris.

<figure class="wsp-replay" data-wsp-replay="docking" aria-label="Recorded spacecraft docking replay"><p>The replay requires JavaScript.</p></figure>

The docking controller has **3,623 parameters** (72 inputs, two 32-unit hidden layers, seven outputs). The warehouse controller has **1,633 parameters** (16 inputs, two 32-unit hidden layers, one score output). These networks are deliberately small; the interesting question is whether the writer can use feedback to alter their behavior.

## How the experiment worked

I ran **one independent writing attempt per task**. The first weights, called checkpoint 0, were submitted before the writer saw any episode results. The writer then had 20 evaluation calls. Each call ran 20 complete practice episodes: five cases from each of four challenge types. The writer saw practice feedback, selected controllers at cumulative calls 5, 10, 15 and 20, and could keep revising. A checkpoint is the controller the writer selected at that point, not a separate training run.

After selection was locked, each checkpoint faced **200 unseen episodes**, with 50 new seeds per challenge type. Those test results were withheld from the writer. Each task has 400 practice episode runs across the calls and 200 unseen scores per checkpoint. Docking has 1,000 distinct held-out episode records. Warehouse has 800: checkpoint 20 reused the checkpoint 15 controller, so its 200 scores reuse the same records. A replay below is one recorded *practice* episode, selected so the challenge seed is matched across checkpoints; the tables report the separate unseen tests. The full episode and decision records, including checksums, are retained in the private experiment run.

**Warehouse continuation note.** After call 14, repeatedly sending the full writer history exceeded the client input limit. For the remaining turns, earlier writer actions and overall and key scenario metrics stayed in the prompt, while the latest interaction kept its full episode feedback. Older detailed traces remained saved and could be requested again. This prompt compaction changed the writer context; the simulator, seeds, 20-call budget, and checkpoint rules did not change.

## A moving spacecraft dock

The chaser flies in three dimensions toward a tumbling ghost ship. Its docking collar moves with the target. Some cases add an attached panel that blocks a direct approach; others add drifting debris, or both. The controller chooses translation thrust, rotation torque and an abort/hold decision. A dock counts only when the ship contacts the moving port at acceptable speed and alignment. A safe hold avoids collision but is **not** a successful dock.

The replay above compares the same starting condition across checkpoints. Plan and elevation views show the chaser's path around obstacles; the port view shows lateral and vertical alignment. The drawing is a projection of recorded simulation coordinates. It is not a physical orbital rendering.

| Checkpoint | Successful docks | Mean fuel used (sim. units) | Mean duration (s) |
| ---: | ---: | ---: | ---: |
| 0 | 0 / 200 | 0.155 | 20.5 |
| 5 | 100 / 200 | 0.232 | 33.5 |
| 10 | 200 / 200 | 0.387 | 76.9 |
| 15 | 200 / 200 | 0.442 | 64.5 |
| 20 | 200 / 200 | 0.415 | 57.0 |

The first controller safely held or aborted in all 200 unseen cases, so its dock count was zero. By call 5 it docked in 100 cases, succeeding in every moving-collar and debris-only case but none of the panel cases. By call 10 it docked in all 200, including the combined panel-and-debris cases. The later checkpoints kept that success rate. Fuel and duration are averages over successful and unsuccessful episodes, so they should be read alongside dock count.

## A warehouse with pod trips

Six robots share a nine-junction, single-width aisle network. A dispatcher assigns each released job; the learned controller scores candidate moves at each junction. To complete a job, a robot goes to a storage pod, carries it to one of two pick stations, waits for service, and returns it to storage before its deadline. Four test settings vary arrival load, station demand, aisle bottlenecks, and a temporary closure with a slowed robot. A fixed safety layer rejects conflicting moves; a safety rejection is recorded rather than silently counting it as a successful move.

<figure class="wsp-replay" data-wsp-replay="warehouse" aria-label="Recorded warehouse pod delivery replay"><p>The replay requires JavaScript.</p></figure>

The top and bottom rows are storage pods, the middle left and right nodes are pick stations, and the center is robot parking. Pick a robot to follow its trip. Its color and caption distinguish waiting, travel and station service. Red dashed aisle means a closed link. The replay displays actual recorded robot positions and events, one tick at a time.

| Checkpoint | On-time jobs / episode | Late or unfinished / episode | Mean episode p95 job duration (ticks) | Safety rejections / episode |
| ---: | ---: | ---: | ---: | ---: |
| 0 | 57.6 | 11.3 | 41.0 | 22.3 |
| 5 | 58.3 | 10.5 | 35.9 | 22.8 |
| 10 | 59.0 | 9.8 | 35.0 | 20.5 |
| 15 | 59.0 | 9.8 | 35.0 | 20.6 |
| 20 | 59.0 | 9.8 | 35.0 | 20.6 |

On-time completions rose by 1.45 jobs per unseen episode from the first to final checkpoint. The writer kept the checkpoint 15 controller at checkpoint 20, so those two rows are identical by design. This is a modest change compared with docking: most of the gain came from the closure-and-slowdown cases, while the other three settings changed little. The separate late-or-unfinished and duration columns keep throughput from hiding delayed jobs. Safety rejections are attempts blocked by the fixed traffic layer, so a lower number is preferable when service is otherwise comparable.

| Challenge | On-time at 0 | On-time at 20 | Late/unfinished at 0 | Late/unfinished at 20 |
| :-- | ---: | ---: | ---: | ---: |
| Balanced flow | 59.0 | 59.5 | 8.4 | 7.9 |
| Station burst | 53.1 | 53.5 | 6.3 | 6.0 |
| Narrow bottleneck | 62.4 | 62.6 | 11.2 | 11.0 |
| Closure + slowdown | 55.8 | 60.5 | 19.1 | 14.4 |

## What this does and does not show

The docking run shows that a language model can use episode feedback to write a small controller that succeeds on all 200 held-out cases in this particular simulator. The warehouse run shows how much its selected policy changed under a more crowded, task-based workflow. Neither result establishes reliability in real spacecraft or warehouses. With one writer attempt per task, this is a documented trajectory, not an estimate of how often a fresh writer would succeed. The 200 held-out cases test these fixed simulators and seed distributions; they do not cover arbitrary conditions.
