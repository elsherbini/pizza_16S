---
description: Alpha diversity, beta diversity, and ordination in microbial ecology, explained with pizzerias.
---

# Pizza, alpha and beta

> How would you compare different pizzerias if you had access to their orders on a given night?
> Are they selling a lot of different pizzas, or mostly just one or two? Are different pizzerias selling the same types of pizzas?

A scrolling explainer. Scroll to begin.

## Act 0 — The Friday night snapshot {#snapshot}

> Where a count table comes from, and what it leaves out.

It is seven o'clock on a Friday at Vinnie's Slice Shop in Bay Ridge, and over the next four
hours the register prints 240 tickets. Each ticket is a datapoint telling you what pizzas are getting ordered.

In microbial ecology this pile of paper is a **sample**, and the pizzeria it came from is
the community you are trying to describe.

---

Read what is printed on each ticket and you learn which pizza it was: Margherita, plain
cheese, grandma slice. Note this is a pretty low-resolution look at the pizza, one shop's pepperoni might be really different from another, with different ingredients, etc. Access to these tickets is more like 16S rRNA amplicon data compared to shotgun metagenomics where you'd actually get all the ingredients used in each pizza and any modifications customers made, etc.

---

Sort the tickets into a column for each pizza type. These are the same 240 tickets, standing in different piles.

---

Count each column and you have the row that every method here consumes: a **count vector**,
one number per pizza type, summing to the number of tickets you read.

Stack a few of those rows and you have a **count table**. Each column is a different pizza and each row is a pizzeria. The ticket counts of each pizza type are in the cells of the table. If a pizzeria didn't have a particular pizza, or it didn't sell any the night you got the orders, you end up with a 0 in that cell.

One caution before going further. You are looking at orders, not at the menu. Vinnie's may
stock a pizza nobody happened to order tonight, and in this table that pizza is
indistinguishable from one he has never made. Every worry in the rest of this piece grows
out of that gap.

## Act 1 — Counting the menu {#richness}

> Observed richness, and the thing it refuses to look at.

How diverse were the sales at each of these pizzerias? One way to answer that is to count
how many different pizzas each of them sold tonight.

One square per pizza type that appeared on the spike at least once: Vinnie's on the left,
Sono Pizzeria Napoletana in the middle, Gino's Corner on the right.

---

Twelve, twelve, and five. That count is **observed richness**, and it treats every type
identically whether it sold once or a hundred and ninety times.

QIIME 2 calls it `observed_features`; in vegan it falls out of `specnumber()`. It is also
the first Hill number, q = 0, which will matter shortly.

---

By that measure Vinnie's and Sono's are the same diversity, and Gino's is less than half as
diverse as either. Is that a fair description of these three shops?

Four out of five tickets at Vinnie's say the same thing: plain cheese. The other eleven
types divide what is left. Sono's spreads its 180 tickets across all twelve of its.

Richness cannot see any of this, because richness never looks at the counts. Worse, it is
the metric most sensitive to how deeply you sequenced, which is the subject of Act 3.

## Act 2 — Eighty percent plain cheese {#evenness}

> Shannon, Simpson, Pielou, and the one number that reconciles them.

The same three shops as rank-abundance profiles: every pizza type is a bar, longest first,
all three panels on one shared scale.

The shapes are what matter. Vinnie's falls off a cliff after its first bar, Sono's steps
down gently across all twelve, and Gino's is short and flat.

---

Suppose you stood at the counter and tried to guess what the next ticket would say. At
Vinnie's you would be right most of the time; at Sono's you would rarely be. Shannon's
index measures that uncertainty.

```formula
H' = -&sum; p<sub>i</sub> ln p<sub>i</sub>
```

<em>p<sub>i</sub></em> is the share of tickets going to type *i*. When one pizza takes
almost everything you will guess right nearly every time, so H' is small. When all twelve
types sell equally you are guessing among twelve, and H' reaches its ceiling of ln 12,
about 2.48.

Sono's scores 2.45, close to that ceiling. Vinnie's scores 0.91 with exactly the same
twelve types on the board.

---

Imagine two customers walking into the same pizzeria and ordering without consulting each
other. How often would they order the same pizza?

```formula
D = &sum; p<sub>i</sub><sup>2</sup>
```

That probability is Simpson's index. At Vinnie's, 0.64: nearly two thirds of customer pairs
match, and almost always on plain cheese. At Sono's, 0.09. Some tools report 1 - D instead
and call that Simpson diversity, and scikit-bio reserves the name `simpson` for that form
while calling the sum of squares `dominance`. Check which one your pipeline means before
comparing anything.

How level is a shop's profile once richness is set aside? Pielou's evenness answers by
dividing Shannon by its maximum, J' = H' / ln S, leaving only how evenly the tickets spread
across whatever types are on the board. Gino's five types score 1.00. Vinnie's twelve score
0.36.

---

Which of those three numbers should you report? Shannon is in nats, Simpson is a
probability, Pielou is a ratio, and none of them lets you say that one shop is twice as
diverse as another.

Hill numbers put all three on one scale, the effective number of types.

```formula
<sup>q</sup>D = ( &sum; p<sub>i</sub><sup>q</sup> )<sup>1/(1-q)</sup>
```

Read it as a question: if this shop sold every pizza at the same rate, how many would it
need on the board to feel as varied as it does?

Drag *q*. At q = 0 the answer is richness again. At q = 1 the curve passes through exp(H').
At q = 2 it lands on 1/D, the inverse Simpson. Vinnie's twelve types are worth 12 at q = 0,
about 2.5 by q = 1, and 1.6 by q = 2, because it stocks twelve and runs on one.

## Act 3 — A slow Tuesday {#rarefaction}

> Rarefaction, Good's coverage, and why unequal sequencing depth ruins a comparison.

If one shop reports more pizza types than another, is it more varied, or was it simply
busier? Observed richness cannot separate those two, because it rises with every additional
ticket you read.

Reading a shop's tickets one at a time, plotting how many distinct types you have seen
after each one, makes the difference visible. That is a **rarefaction curve**.

These are computed analytically, the way `vegan::rarefy` does it, from Hurlbert's 1971
expectation rather than by repeated random subsampling. There is no seed and no simulation
noise in them.

---

Every curve stops where that shop's night stopped. Vinnie's read 240 tickets and went flat
somewhere around a hundred, having by then seen everything it sells. Forno Sperimentale
closed after 34 tickets with its curve still climbing at the moment it was cut off.

Forno's observed richness is 14; Vinnie's is 12. Taken at face value those are nearly the
same shop.

---

Reading those two numbers side by side is the mistake. Pull the depth back to 34 tickets,
the most that all five shops can supply, and read the curves where that line crosses them.

Forno still has 14, because 34 tickets is all it ever had. Vinnie's drops to 5.3, because a
random 34 of its tickets would be almost nothing but plain cheese.

At equal effort Forno is roughly two and a half times as rich. Observed richness hid that,
and it hid it in the direction that flatters whichever sample was sequenced more deeply.

---

Good's coverage estimates how much of a community you have already met.

```formula
C = 1 - F<sub>1</sub> / N
```

F<sub>1</sub> is the number of types ordered exactly once. Nine of Forno's fourteen types
sold a single slice out of 34 tickets, which puts its coverage at 73.5%. Something like a
quarter of the next customers through that door would order a pizza it has no record of
tonight. Vinnie's, at 98.3%, has finished discovering itself.

What to do about uneven depth is genuinely contested. Rarefying to a common depth, as
above, discards real observations, and McMurdie and Holmes argued in 2014 that doing so is
inadmissible. The alternatives, scaling factors and variance-stabilising transformations,
carry assumptions of their own. The one indefensible option is comparing raw richness
across samples sequenced to different depths, which is exactly what the 14-versus-12
reading was.

## Act 4 — Two shops, one question {#beta}

> Jaccard asks what is on the board. Bray-Curtis asks what actually sold.

Every number so far has described the inside of one shop. What would it mean to say that
two shops resemble each other?

**Beta diversity** is the family of answers: a distance between two samples rather than a
summary of one.

Here are Vinnie's two locations back to back, one row per pizza type, each converted to
shares of its own night so that the busier shop does not simply come out looking bigger.

---

Do they serve the same kinds of pizza? Ignore the volumes entirely and look only at which
types appear at all.

```formula
J = 1 - |A &cap; B| / |A &cup; B|
```

Both locations stock the same twelve types, so the intersection is the union and the
distance is 0.00. By this measure the two shops are one community.

---

Do they serve them in the same proportions?

```formula
BC = &sum; |a<sub>i</sub> - b<sub>i</sub>| / &sum; (a<sub>i</sub> + b<sub>i</sub>)
```

On relative abundances this reduces to something readable straight off the chart. The solid
blocks are min(a<sub>i</sub>, b<sub>i</sub>), the share of a night the two shops genuinely
have in common. They total 21%, and Bray-Curtis is one minus that: 0.79.

The original Vinnie's sells plain cheese. Uptown sells vodka slices and grandma slices to a
neighbourhood that wants them. Same board, different restaurant, and only one of the two
metrics noticed.

---

Neither metric is the right one, because they answer different questions. Jaccard weights a
type that sold once the same as one that sold two hundred times, which makes it sensitive
to sequencing depth: a shallow run misses rare things and reports a smaller intersection.
Bray-Curtis is driven by the abundant end and barely registers the tail at all.

Sono Pizzeria against Forno Sperimentale, now on screen, is the ordinary case: eight types
in common, four unique to Sono's and six to Forno's, giving Jaccard 0.56 and Bray-Curtis
0.71.

The degenerate case is worth knowing too. Vinnie's against Sono's shares not a single pizza
type, so both metrics return exactly 1.00 and neither can say anything further. Two samples
with nothing in common are equally distant however differently they have nothing in common.

## Act 5 — Every pair at once {#matrix}

> The distance matrix is the complete answer and the wrong shape for a person.

One number describes one pair. With five shops there are ten of them, few enough to read
straight off the table.

Rows and columns are the same five shops, so the diagonal is each shop against itself and
the matrix is symmetric: half of it is redundant. Vinnie's against Sono's is 1.00, the two
having not one pizza type in common.

---

Add the other thirty shops and there are 595 distinct distances in front of you.

Every one of them is still exactly as true as the ten you could read a moment ago. None of
them is legible. This is the state of any real study: the matrix holds the complete answer
in a form nobody can use.

---

Nothing has changed except the order of the rows and columns. Shops that resemble each
other now sit next to each other, and blocks appear along the diagonal.

The reordering used one number per shop, and that number was the first axis of the
ordination in the next act. Ordination is this idea taken seriously: find the arrangement
that makes the structure visible, then be honest about how much had to be discarded to get
it.

## Act 6 — Drawing the map {#pcoa}

> Principal coordinates analysis, and what its axes are and are not.

Suppose someone handed you the driving distances between thirty-five towns and asked you to
draw the map. Could you? For distances that came from real positions, very nearly so: the
distances pin the arrangement down up to rotation and reflection.

**Principal coordinates analysis** does that with samples in place of towns. Gower's
double-centring turns the squared distances into a cross-product matrix, its eigenvectors
give the directions, and the eigenvalues say how much of the structure each direction
carries. It is `cmdscale()` in R, `skbio.stats.ordination.pcoa` in Python, and
`qiime diversity pcoa` at the command line.

---

Now colour the points by style, which the ordination never saw. It was given the
Bray-Curtis matrix and nothing else: no labels, no styles, no names.

The New York slice shops, the Neapolitan places and the Detroit square places have sorted
themselves out anyway. Shops with similar sales mixes ended up with similar coordinates
because they had similar distances, and that is the entire mechanism.

---

The five shops from the earlier acts are drawn hollow.

Vinnie's and Vinnie's Uptown, which Jaccard scored at 0.00, are ordinary neighbours here
rather than the same point: Bray-Curtis puts them at 0.79, close to the median distance in
this field. Under a Jaccard ordination they would land on top of each other.

Forno Sperimentale sits furthest from everything, with the highest mean distance of any
shop in the study. A forty-item menu sampled 34 times will do that, and it is worth
remembering that this is partly a statement about Forno and partly a statement about its
sample size.

---

The axes repay a closer look, because they carry less than their prominence suggests.

Axis 1 carries 46.9% of the positive eigenvalue total and axis 2 carries 25.4%, so this
picture holds 72.4% of the structure in the matrix and has discarded the rest. The axes
have no units. Their signs are arbitrary, so a mirror image of this plot is the identical
result, and any interpretation that depends on left versus right is an interpretation of
nothing.

Bray-Curtis violates the triangle inequality, so the centred matrix is not positive
semi-definite and some eigenvalues come out negative. Here they hold 2.6% of the total.
scikit-bio warns about this and then drops them; the percentages above are computed over
the positive eigenvalues alone, which is the usual convention and also the one that
flatters the plot.

## Act 7 — When you only trust the ranking {#nmds}

> NMDS, the Shepard diagram, and what stress is actually measuring.

How much of a Bray-Curtis value would you defend: its magnitude, or only its ordering? For
most ecological dissimilarities the honest answer is the ordering.

**NMDS** takes that answer seriously. It gives up on reproducing the distances and keeps
only their rank order: if shop A is further from B than from C, the picture must show that,
and by how much is not its problem. This is `metaMDS()` in vegan, and it is the plot most
microbial ecology papers print.

---

To see what the fit is doing, plot every pair twice. Horizontal is what Bray-Curtis said;
vertical is what the picture drew. All 595 pairs, one dot each. This is a **Shepard
diagram**.

---

What NMDS fits to that cloud is the best non-decreasing step function it can manage, by
isotonic regression, after which it moves the points to close the gap between the dots and
the steps.

Any monotone relationship at all is a perfect fit. That freedom is the whole method, and it
is why an NMDS plot has no units on either axis.

---

The vertical ticks are the residuals. Stress is their size relative to the distances drawn.

```formula
stress = &radic;( &sum;(d - d&#770;)&sup2; / &sum; d&sup2; )
```

Kruskal's rules of thumb: under 0.05 excellent, under 0.1 good, under 0.2 usable, over 0.2
not worth reading. This fit reaches 0.077 after 115 accepted steps, starting from the PCoA
solution the way `metaMDS` does.

That PCoA starting configuration scores 0.147 on the same criterion. NMDS wins because it
spent the whole run optimising precisely this quantity and PCoA never looked at it. What
you give up is real: NMDS axes carry no variance explained, can be rotated or reflected
without changing anything, and cannot be compared between studies.

## Act 8 — Reading it honestly {#reading}

> What separation on an ordination does and does not entitle you to say.

Both controls above the plot are live. Changing the method shifts the picture a little;
changing the distance metric rearranges it.

---

Switching from Bray-Curtis to Jaccard replaces every one of the 595 numbers in the matrix,
so the ordination is now drawing a different dataset from the same count table.

On Jaccard the first two axes carry 62.6% instead of 72.4%, the negative eigenvalues grow
from 2.6% to 6.4%, and NMDS stress rises from 0.077 to 0.109. Presence and absence is a
harder thing to flatten into two dimensions than abundance is, because the rare types that
Jaccard weights fully do not lie along any single gradient.

The choice of distance metric moves the result further than the choice of ordination method
does, and it is the choice papers most often make without saying why.

---

The gap between two nearby points is more trustworthy than the gap between two distant
ones, because the fit spends its effort where it can. In PCoA the axes are ordered by
eigenvalue, so vertical spread genuinely matters less than horizontal spread, and a plot
stretched to fill its frame hides that. Both axes here are drawn on one scale for exactly
that reason.

Above all: a cluster you can see is not a cluster that is significant. Two groups can
separate convincingly by eye and fail a test, and two groups can overlap and pass one.

---

The test is PERMANOVA, `adonis2()` in vegan or
`qiime diversity beta-group-significance`, which permutes the group labels a few thousand
times and asks how often chance alone produces this much separation.

It carries a trap. PERMANOVA can come back significant because the groups sit in different
places, or because one group is simply more scattered than the other, and those are
different findings. `betadisper()` tells them apart. Reporting the first without checking
the second is among the most common errors in this literature.

None of that is in this piece. Neither are the phylogenetic metrics, Faith's PD and
UniFrac, which ask not merely whether two shops sell different pizzas but how different
those pizzas are from each other. Nor is the compositional argument, which observes that a
ticket spike holds a fixed number of slots, so the proportions on it are constrained in
ways that ordinary statistics do not expect.

## Act 9 — The limits of the analogy {#coda}

> Every analogy has a boundary. Knowing this one's is the last useful thing it can do.

The count table you have been reading all the way through records what the counting process
reported, which comes apart from what the pizzeria actually sold in ways the analogy has
been hiding.

#### Some tickets get printed twice

PCR does not amplify every template equally, and 16S copy number varies several-fold
between taxa, so a pizza can appear on the spike more often than it left the kitchen. A
count table is a biased sample of a biased amplification of a biased extraction. Relative
abundances are comparable across samples far more safely than they are comparable across
taxa within one.

#### Some tickets came from next door

Reagent and kit contamination puts organisms in your data that were never in your sample,
and it dominates when biomass is low. A shop with 34 tickets is far more distorted by three
stray ones than a shop with 240. Chimeras are the stranger version: two real sequences
fused into a pizza nobody ever ordered.

#### The pizzas do not compete for the oven

This is where the analogy fails worst. Pizza types are independent labels on a menu, while
microbial taxa consume each other's outputs, inhibit each other, and cross-feed. A
community is not a menu, and no diversity metric in this piece models an interaction of any
kind. They are all descriptions of a list.

#### One Friday night

Every number here comes from a single evening. Communities move, on timescales from hours
to seasons, and a single snapshot cannot tell a stable community from one caught mid-swing.

#### The spike holds a fixed number of slots

A sequencing run returns a roughly fixed number of reads regardless of how much was in the
sample, so the data are compositional: one taxon rising forces the others to fall, whether
or not anything happened to them. Aitchison's critique and the centred log-ratio transform
are the response, and they are a genuinely different way of doing all of this. That, along
with the phylogenetic metrics and hypothesis testing, is what comes after this piece.

### The whole analogy on one page

---

| Pizza | Microbial ecology | Where you meet it |
| --- | --- | --- |
| One pizzeria | A sample | one row of the count table |
| One order ticket | One read | a record in a FASTQ file |
| A pizza type, "Margherita" | An ASV or OTU | DADA2 output, a taxonomy assignment |
| The exact ingredients | Gene content and function | shotgun metagenomics, not 16S |
| Red base or white | A coarser rank, roughly phylum | what you colour a bar chart by |
| The full menu | The true community | never observed |
| Tonight's tickets | The observed community | the count table |
| Tickets read | Sequencing depth | reads per sample |
| Distinct types tonight | Observed richness | observed_features, specnumber() |
| How level the sales are | Evenness | Pielou's J' |
| Guessing the next ticket | Shannon entropy | diversity(x, "shannon") |
| Two customers ordering alike | Simpson index | dominance() or simpson() |
| Reading only 34 tickets | Rarefaction | rarefy(), after Hurlbert 1971 |
| Types sold exactly once | Singletons | Good's coverage |
| Do two shops stock the same pizzas? | Jaccard distance | vegdist(x, "jaccard", binary = TRUE) |
| Do two shops sell the same pizzas? | Bray-Curtis distance | vegdist(x, "bray") |
| Every pair at once | Distance matrix | a dist object, a DistanceMatrix |
| The map | Ordination | cmdscale(), metaMDS() |
| How bent the map is | Kruskal's stress | reported by metaMDS |

---

### Colophon

Every metric on these pages is computed in the browser from the count table, not read from
a precomputed file. The implementations are checked against scikit-bio 0.7.3 and scipy 1.18
on this same dataset, to ten decimal places for the alpha and beta metrics and eight for
the PCoA eigenvalues. Logarithms are natural throughout, matching `vegan`.

The five hero pizzerias are hand-built so that each one breaks a metric the previous one
survived. The other thirty are drawn from style archetypes with a seeded generator, so the
dataset is the same on every machine.
