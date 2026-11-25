---
title: "Writing motion into weights"
subtitle: "Weight-space programming for motion control"
date: 2026-11-26
description: "GPT-6 Astra wrote two tiny controllers directly as weights. Watch their recorded docking and warehouse decisions."
tags: [llm, evaluation]
draft: false
wide: true
css: ["/blog/weight-space-programming/replay.css"]
js: ["/blog/weight-space-programming/timeline-data.js", "/blog/weight-space-programming/replay-v2.js"]
---

Can an LLM write useful neural-network weights without training? Inspired by [weight-space programming](https://rikiyat.github.io/blog/weight-space-programming/), I asked GPT-6 Astra to write two tiny controllers and revise them from simulator feedback.

**Docking reached 200/200 unseen successes by call 7. Warehouse improved by just 1.4 on-time jobs per episode.** The useful change in docking was learning to get around a panel. In the warehouse, most of the improvement came when an aisle closed and a robot slowed down.

- **Two networks:** 3,623 parameters (14.5 kB) for docking; 1,633 parameters (6.5 kB) for warehouse, counting float32 weights and biases.
- **One attempt per task:** no training, web, or code tools for the writer. Each evaluation call tested 20 complete practice episodes.
- **Unseen test:** 200 episodes per checkpoint, balanced across four challenge families. These scores were measured afterward and never shown to the writer.
- This page follows the first ten calls of longer recorded runs. These results describe one attempt per task in these simulators.

## At a glance

<figure class="wsp-timeline" data-wsp-timeline aria-label="Weight edits and practice scores by evaluation call"><p>The timeline requires JavaScript.</p></figure>

The edits changed what the docking controller could do: it progressed from holding safely to completing the approach. In the warehouse, they mostly adjusted how an already working controller handled disrupted traffic. In both tasks, the unseen tests followed the broad pattern seen in practice.

## Spacecraft docking

1. Approach a moving collar from about 25 metres away.
2. Clear the hull, attached panel, and crossing debris.
3. Dock at low speed with the correct alignment. A safe hold does not count as docking.

Four challenge families isolate collar motion, panel bypass, debris, and all three together. Each has 50 unseen variants. Drag the replay to inspect depth; the grid spacing is 5 m.

<figure class="wsp-replay" data-wsp-replay="docking" aria-label="Spacecraft docking test replays"><p>The replay requires JavaScript.</p></figure>

| Calls spent | 0 | 5 | 10 |
| :-- | --: | --: | --: |
| Successful docks / 200 | 0 | 100 | 200 |
| Mean fuel used | 0.155 | 0.232 | 0.387 |

**The panel was the turning point.** The first controller held safely in every case. By call 5 it could dock without the panel; by call 7 it could clear the panel too. Success came with higher fuel use. Fuel averages include failed episodes.

## Warehouse traffic

Six robots share nine junctions. The network ranks moves; a fixed safety layer blocks conflicts.

1. Collect a storage pod.
2. Carry it to a pick station for service.
3. Return it before the deadline to complete the job.

The tests cover balanced traffic, a station burst, a bottleneck, and an aisle closure with one slowed robot.

<figure class="wsp-replay" data-wsp-replay="warehouse" aria-label="Warehouse traffic test replays"><p>The replay requires JavaScript.</p></figure>

| Calls spent | 0 | 5 | 10 |
| :-- | --: | --: | --: |
| On-time jobs / episode | 57.6 | 58.3 | 59.0 |
| Late or unfinished / episode | 11.3 | 10.5 | 9.8 |

**The improvement was concentrated in disrupted traffic:** on-time jobs rose from 55.8 to 60.5 in the closure and slowdown cases. The other three families changed by only 0.2–0.4 jobs per episode.
