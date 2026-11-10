import type { AuthoredLesson } from "../../lesson-contract";

// A CHART IS AN ARGUMENT, AND ITS SCALE IS PART OF THE ARGUMENT.
//
// The reported failure is not "cannot read a bar". It is that a picture is
// trusted as a neutral copy of the numbers: the taller bar is assumed to mean
// more without asking from what baseline, a pie is read as counts rather than
// shares, and a line is drawn through categories that have no order. This
// lesson makes three questions precede every reading — what is the total, what
// does each axis do, and what is missing — and makes the pie angle arithmetic
// rather than a guess.
export const MATHS_DATA_CHARTS: AuthoredLesson = {
  contract: "openmind.lesson/1.0",
  conceptId: "data-charts",
  version: "1.0.0",
  subject: "maths",
  curriculum: {
    reference:
      "GCSE Mathematics, statistics: bar charts, line graphs, pie charts and scatter graphs; choosing, constructing and criticising a representation",
    level: "Key Stage 3 to GCSE Foundation",
    note:
      "Scope cited against the published GCSE mathematics subject content and the National Curriculum for statistics. No specification, textbook or commercial lesson text is reproduced.",
  },
  declaredStatus: "draft",

  objectives: [
    {
      statement:
        "Choose a chart from the type of data and the question being asked, and explain why the alternatives are weaker.",
      evidence:
        "For unordered categories the learner chooses a bar chart, for change over time a line graph, for shares of one whole a pie chart, and for two measured variables a scatter graph, giving a reason for each choice rather than naming a favourite.",
    },
    {
      statement:
        "Read a chart honestly by finding its total, its scale and its baseline, and explain how a truncated axis changes the comparison the picture makes.",
      evidence:
        "Given bars of 32 and 36 on axes starting at 0 and at 30, the learner says the true rise is 4 (12.5%) while the truncated chart draws heights of 2 and 6, and that the labels are true even when the visual ratio is not.",
    },
    {
      statement:
        "Construct a bar chart and a pie chart from a frequency table, calculate each pie angle, and state what the chart does not show.",
      evidence:
        "For 60 learners travelling by walk, bus, car and cycle the learner obtains 90°, 144°, 72° and 54°, checks the angles sum to 360°, and explains that the pie shows each share but not the total of 60 or the count in each category.",
    },
  ],

  priorKnowledge: {
    // The genome declares `averages` as the prerequisite. A chart is a summary,
    // and the two checks are the summary arithmetic this lesson uses: a mean
    // from a list, and a total rebuilt from a mean.
    conceptIds: ["averages"],
    check: [
      {
        id: "d1",
        question: "Find the mean of 4, 6, 8 and 10.",
        answer:
          "7. The total is 28 and there are four values, so the mean is 28 ÷ 4 = 7. A chart summarises a data set the same way: one mark stands for many values.",
        targets: ["averages"],
      },
      {
        id: "d2",
        question: "The mean of five values is 12. What is their total?",
        answer:
          "60, because 5 × 12 = 60. Rebuilding a total from a summary is the move a pie chart needs when the counts have to be turned into shares of the whole.",
        targets: ["averages"],
      },
    ],
  },

  introduction: {
    hook:
      "A local paper reports that cycling to a school has 'tripled'. The chart shows two bars, 32 last year and 36 this year, on an axis that starts at 30 rather than 0. The bars are 2 and 6 units tall, so the second really does look three times the first. The numbers rose by 4, which is 12.5%. Every label on the chart is true, and the picture still tells a story the data do not support.",
    why:
      "A chart is not a photograph of a data set; it is an argument about which comparison matters. The type of chart decides what is easy to see: bars compare categories, a line shows change through an ordered sequence, a pie shows each category's share of one whole, and a scatter shows whether two measured variables move together. The scale decides how large a difference looks, and the total decides what a share means. Reading a chart critically means asking three questions before believing it — what is the total, what does the axis do, and what is missing — and those questions are also the checklist for making an honest one.",
  },

  explanation: [
    {
      heading: "The question decides the chart",
      paragraphs: [
        "A bar chart compares counts or amounts across categories. Its bars are separate because the categories are separate: football, netball and swimming have no order, so the gap between the bars is information. A line graph is different. It is used when the horizontal axis is an ordered sequence, usually time, because the segment between two points asserts that the values in between are meaningful. Drawing a line through favourite colours joins points that have no in-between, so the trend it appears to show was invented by the chart.",
        "A pie chart is for parts of one whole: every category is a share of the same total, and the angles sum to 360°. A scatter graph is for two measured variables on the same individual, such as height and shoe size, and it can show a relationship without either variable being a category. Choosing a chart is therefore part of answering the question. A pie with twelve thin slices is unreadable; a bar chart with forty categories is a wall; a line through unordered categories is a false claim about continuity. The chart should make the intended comparison easy, not decorate the table.",
      ],
    },
    {
      heading: "A scale is part of the argument",
      paragraphs: [
        "In a bar chart the length of the bar encodes the value, so the baseline is part of the measurement. If the axis starts at 0, a value of 36 is 90% of a full-scale 40 and a value of 32 is 80%, which is the ratio the numbers actually have. If the axis starts at 30, the same two values become bars of 6 and 2, and the second looks three times the first. The labels are still correct; the lengths are not proportional to the values, so the visual comparison is false. A truncated bar chart is not lying about the numbers, it is lying with the lengths.",
        "A line graph encodes value by position rather than length, so a truncated vertical axis exaggerates a change without changing the shape of the line. That can be legitimate when the interesting variation is small, provided the axis is labelled and the reader is told, but it is misleading when the picture is presented as the whole story. Equal intervals matter on both axes: a gap of 10 must be the same distance wherever it appears, or the slope and the spacing stop meaning anything. Axes need names and units, because a number without a unit cannot be checked.",
      ],
    },
    {
      heading: "Pie charts encode shares, not counts",
      paragraphs: [
        "A pie chart turns each category's share of the total into an angle. The whole circle is 360°, so a category with a quarter of the total gets a quarter of 360°, which is 90°. For 60 learners travelling by walk, bus, car and cycle in the counts 15, 24, 12 and 9, the shares are 25%, 40%, 20% and 15%, and the angles are 90°, 144°, 72° and 54°. The four angles must add to 360°; if they do not, either a count or a division is wrong. The largest sector is the bus at 144°, which is 40% of the learners.",
        "The angle is a share, so it cannot tell you a count without the total. Half of 40 learners is 20, while a quarter of 200 is 50: the second slice is smaller and the number of learners is larger. Across two pie charts with different totals, a bigger angle does not mean more items; within one chart, it does mean a larger share. A pie also hides the total itself, because the circle is always 100% however many people were asked. That is why a report should print the total and the counts beside the chart rather than leaving the reader to infer them.",
      ],
    },
    {
      heading: "Reading critically: total, scale, missing",
      paragraphs: [
        "Three questions catch most misleading charts. What is the total? A percentage without a base is unreadable, and two charts with different totals cannot be compared by angle. What does each axis do? Check where the vertical axis starts, whether the intervals are equal, and whether both axes are labelled with units. What is missing? Non-responses, merged categories, a change in what was counted, or a source that stopped at a convenient year can matter more than anything drawn. A chart can be accurate in every number and still mislead by what it leaves out.",
        "The defence is arithmetic rather than suspicion. Read the values, recompute a share or a difference, and compare it with what the picture appears to claim. In a scatter graph, a pattern is not a cause: two variables can rise together because a third factor drives both, and the genome's next concept, correlation, is where that distinction is taught. When you make a chart, state the total, the scale and the units, and start bars at zero, so a reader can check the argument instead of trusting the shape.",
      ],
    },
  ],

  representations: [
    {
      id: "r1",
      kind: "maths.expression",
      body:
        "A frequency table becomes a bar chart by using each count as the height of its bar. The bars start at zero so their lengths stay proportional to the counts.",
      notation:
        "football 12 · netball 8 · swimming 5 · athletics 3 · total 28 · scale 0 to 12, step 2",
      caption:
        "The tallest bar is football at 12 and the shortest is athletics at 3, a ratio of four to one that the zero baseline preserves. If the axis started at 10, those same bars would be 2 and -7 units, which is impossible, or 2 and 0, which reverses the order.",
    },
    {
      id: "r2",
      kind: "maths.expression",
      body:
        "A pie chart turns each category's share into an angle. The whole circle is the total, so every angle is share × 360° and the angles must add to 360°.",
      notation:
        "travel to school, 60 learners: walk 15, bus 24, car 12, cycle 9   ·   angles 90°, 144°, 72°, 54°   ·   sum 360°   ·   bus = 40%",
      caption:
        "The bus sector is the largest at 144°, which is 40% of the 60 learners, or 24 people. The pie shows the share clearly and the total not at all: the same angles would describe 6 learners or 600.",
    },
    {
      id: "r3",
      kind: "maths.expression",
      body:
        "The same two values can look almost equal or three times apart depending on where the bar axis starts. The numbers do not change; the lengths do.",
      notation:
        "cycling 32 → 36   ·   true change +4 = 12.5%   ·   axis 0–40: heights 80% and 90%   ·   axis 30–40: heights 2 and 6 = 3×",
      caption:
        "On a zero baseline the rise is one tenth of a full bar and looks small, which is honest. Starting at 30 draws the same rise as a bar three times as tall, which is the picture the headline 'tripled' came from.",
    },
  ],

  workedExamples: [
    {
      id: "w1",
      prompt:
        "A table records favourite sports: football 12, netball 8, swimming 5 and athletics 3. Build a bar chart and state its scale and total.",
      steps: [
        {
          move: "Add the counts to find the total: 12 + 8 + 5 + 3 = 28 learners were asked.",
          why:
            "The total is the whole the bars are parts of. Without it, a reader cannot turn a count into a share or check that every learner is represented once.",
        },
        {
          move: "Choose a bar chart, because the categories have no natural order and the question compares their counts.",
          why:
            "A line would imply that football, netball and swimming sit on an ordered scale, which they do not. A pie would show shares, but the comparison asked for is between counts.",
        },
        {
          move: "Set the vertical axis from 0 to 12 with steps of 2, label it 'number of learners', and draw each bar to its count.",
          why:
            "A zero baseline keeps bar length proportional to the count. A step of 2 fits the largest value of 12 without compressing the smaller bars into illegibility.",
        },
        {
          move: "Check the chart against the table: the football bar is 12, the athletics bar is 3, and the four bars account for all 28 learners.",
          why:
            "The chart has to preserve both the individual values and the total. A bar drawn to the wrong height is a false number even when the table beside it is right.",
        },
      ],
      answer:
        "A bar chart with a 0–12 axis, bars of 12, 8, 5 and 3, labelled in learners; total 28.",
    },
    {
      id: "w2",
      prompt:
        "A survey of 60 learners records how they travel: walk 15, bus 24, car 12, cycle 9. Draw a pie chart, calculating each angle.",
      steps: [
        {
          move: "Check the total: 15 + 24 + 12 + 9 = 60.",
          why:
            "Every share is a fraction of this total, and a pie is only valid when the categories account for the whole group exactly once.",
        },
        {
          move: "Turn each count into a share and then an angle: 15/60 × 360° = 90°, 24/60 × 360° = 144°, 12/60 × 360° = 72°, 9/60 × 360° = 54°.",
          why:
            "The angle is the share of the circle, so the same fraction that gives the proportion gives the angle. Multiplying by 360° converts a fraction of the whole into degrees.",
        },
        {
          move: "Check the angles sum to 360°: 90 + 144 + 72 + 54 = 360.",
          why:
            "The four sectors must fill the circle exactly. A sum above or below 360° means a count, a total or a division is wrong, and the check catches it before the chart is drawn.",
        },
        {
          move: "The bus sector is 144°, the largest; it is 40% of the learners, which is 24 people. The pie shows the share but not the 60 or the 24 unless they are printed beside it.",
          why:
            "A reader can see that bus is the largest share without knowing how many learners were asked. The count needs the total, which is why the total belongs in the title or the key.",
        },
      ],
      answer:
        "Angles 90°, 144°, 72° and 54°, summing to 360°; bus is the largest share at 40% (24 learners).",
    },
    {
      id: "w3",
      prompt:
        "A chart shows cycling rising from 32 to 36 with a vertical axis starting at 30. Explain what the picture exaggerates and what the true change is.",
      steps: [
        {
          move: "Find the true change: 36 - 32 = 4, and 4 ÷ 32 = 0.125, so the rise is 12.5%.",
          why:
            "The percentage compares the change with the starting value. It is the honest size of the change, independent of how the axis is drawn.",
        },
        {
          move: "Read the bar heights the axis actually draws: with a baseline of 30, the bars are 36 - 30 = 6 and 32 - 30 = 2.",
          why:
            "Bar length encodes value above the baseline. The labels 32 and 36 are true, but the lengths a reader compares are 2 and 6.",
        },
        {
          move: "Compare the visual ratio with the true ratio: 6 ÷ 2 = 3, while 36 ÷ 32 = 1.125. The chart makes a 12.5% rise look like a tripling.",
          why:
            "The reader compares lengths, not printed labels. A truncated axis turns a small change into a large-looking one, which is why the headline and the picture agree with each other and not with the data.",
        },
        {
          move: "The honest chart starts at 0, where the bars are 32 and 36 and the true rise of 4 (12.5%) looks small; the 30-based chart's heights of 2 and 6 are what turn that rise into a three-times picture, so a truncated axis must be disclosed and the values read.",
          why:
            "A zero baseline preserves the ratio. Truncation can be legitimate, but only when it is disclosed, because the picture no longer carries the comparison on its own.",
        },
      ],
      answer:
        "The true rise is 4, or 12.5%; the 30-based axis draws bars of 2 and 6, a three-times picture, so the chart exaggerates a small change.",
    },
  ],

  misconceptions: [
    {
      id: "m1",
      belief:
        "A pie chart shows the counts, so a bigger slice always means more items, even when comparing two different charts.",
      whyItFails:
        "A pie angle is a share of that chart's total, not a count. Half of 40 learners is 20, while a quarter of 200 is 50: the second slice is smaller and represents more learners. The circle is always 100%, so the total is invisible unless it is printed.",
      correction:
        "Use angles to compare shares within one chart, and counts to compare across charts. Print the total and the category counts beside the pie, and recompute a count from the share only when the total is known.",
      contrast: {
        wrong: "the bigger slice always means more learners",
        right: "50% of 40 is 20, but 25% of 200 is 50: the smaller share is more learners",
      },
    },
    {
      id: "m2",
      belief:
        "Any data can be shown on a line graph, because joining the points shows the trend.",
      whyItFails:
        "A line asserts that the horizontal axis is ordered and that values between the points are meaningful. Favourite colours, makes of car and types of pet have no in-between, so a line through them invents a sequence and a trend that the data never had.",
      correction:
        "Use a line only when the horizontal axis is an ordered sequence, usually time. For unordered categories use a bar chart, which keeps the categories separate and does not imply a value between them.",
      contrast: {
        wrong: "join favourite colours with a line to show the trend",
        right: "favourite colours are unordered, so they belong on separate bars",
      },
    },
    {
      id: "m3",
      belief:
        "Starting a bar chart's axis at 30 instead of 0 is acceptable, because the bars are still labelled with the true values.",
      whyItFails:
        "A bar's length is the value above the baseline, and that length is what a reader compares. Starting at 30 turns values of 32 and 36 into bars of 2 and 6, so a 12.5% rise looks like a tripling. The labels can be true while the visual comparison is false.",
      correction:
        "Start a bar chart at zero. If a truncated axis is genuinely needed for detail, label it clearly, say that it is truncated, and expect the reader to compare the printed values rather than the bar lengths. For a line graph, check the vertical range before describing the size of a change.",
      contrast: {
        wrong: "the bars are labelled 32 and 36, so the chart is honest",
        right: "the bars are drawn 2 and 6 units tall, which is a three-times picture for a 12.5% rise",
      },
    },
  ],

  guidedPractice: [
    {
      id: "p1",
      prompt:
        "A table lists favourite fruits and how many learners chose each. Which chart would you use, and why is a line graph a poor choice?",
      hint:
        "Ask whether the categories have an order. Fruit names do not sit on a scale, and a line asserts that the values between two points mean something.",
      answer:
        "A bar chart, because the categories are unordered and the question compares counts. A line graph would join unrelated fruits and imply a trend between them; a pie would be appropriate only if the question were each fruit's share of one whole.",
      feedback: {
        correct:
          "You chose from the data type and the question, and you rejected the line for the reason that makes it wrong rather than because it is unusual.",
        incorrect:
          "Use a bar chart: the fruits have no order, so separate bars compare their counts. A line would invent an order and a trend, and a pie answers a different question about shares.",
      },
    },
    {
      id: "p2",
      prompt:
        "A pie chart is drawn for 40 learners: 10 walk, 20 take the bus and 10 come by car. Calculate each angle and check the total.",
      hint:
        "Each angle is the category's share of 40 multiplied by 360°. The three angles must add to 360°.",
      answer:
        "Walk 10/40 × 360° = 90°, bus 20/40 × 360° = 180°, car 10/40 × 360° = 90°. The angles sum to 360°, and the bus sector is half the circle because half the learners take the bus.",
      feedback: {
        correct:
          "You converted each count to a share before multiplying by 360°, and the sum check confirms the whole circle is accounted for.",
        incorrect:
          "Divide each count by the total 40 first: 10/40 gives 90°, 20/40 gives 180°, and the second 10 gives 90°. The angles must add to 360°.",
      },
    },
    {
      id: "p3",
      prompt:
        "A bar chart starts its vertical axis at 50. Two bars are labelled 52 and 58. What is the true difference, and what does the picture exaggerate?",
      hint:
        "Subtract the baseline from each value to find the drawn heights, then compare the ratio of the heights with the ratio of the values.",
      answer:
        "The true difference is 58 - 52 = 6, which is 6/52 ≈ 11.5%. The drawn heights are 2 and 8, a ratio of 4, so the chart makes an 11.5% difference look like a fourfold one.",
      feedback: {
        correct:
          "You separated the printed values from the drawn lengths, which is exactly where a truncated axis does its work.",
        incorrect:
          "The values differ by 6, about 11.5%. Starting at 50 draws heights of 2 and 8, a four-times picture, so the visual difference is much larger than the real one.",
      },
    },
  ],

  assessment: [
    {
      id: "a1",
      kind: "constructed-response",
      prompt:
        "A survey of 200 learners records how they travel: bus 80, walk 50, car 40, cycle 30. Calculate the pie angles, explain what the pie does not show, and explain why a bar chart of the same data should start at zero.",
      modelAnswer:
        "The total is 200. The angles are 80/200 × 360° = 144°, 50/200 × 360° = 90°, 40/200 × 360° = 72° and 30/200 × 360° = 54°, which sum to 360°. The pie shows each share of the 200, but it does not show the total or the counts: the largest sector means the largest share, not automatically the largest number unless the total is known and printed. A bar chart of the counts must start at zero because the bar's length encodes the count; starting at 60 would draw the 80 and 50 bars as 20 and -10, which is impossible, and would make the differences look far larger than they are. The zero baseline keeps the bars proportional to the counts, so the comparison the chart invites is the comparison the data support.",
      marking: [
        "Uses the total 200 and obtains the four angles 144°, 90°, 72° and 54°.",
        "Checks that the angles sum to 360°.",
        "Explains that the pie shows shares, not counts, and that the total is not visible in the circle.",
        "Explains that bar length encodes the count, so a non-zero baseline distorts the comparison, and gives the concrete effect of starting at 60.",
      ],
    },
    {
      id: "a2",
      kind: "short-answer",
      prompt: "A pie chart shows that 25% of learners walk. The total is 80 learners. How many walk?",
      modelAnswer: "20",
      marking: [
        "Converts the share to a fraction or decimal: 25% = 0.25.",
        "Multiplies by the total: 0.25 × 80 = 20 learners.",
      ],
      check: { accepted: ["20", "20 learners", "20 pupils"] },
    },
    {
      id: "a3",
      kind: "short-answer",
      prompt: "A bar chart's vertical axis starts at 100. Two bars are labelled 108 and 116. What is the true difference between the values?",
      modelAnswer: "8",
      marking: [
        "Subtracts the two printed values rather than the drawn heights: 116 - 108.",
        "Obtains 8, noting that the drawn heights are 16 and 8 if the baseline is 100.",
      ],
      check: { accepted: ["8"] },
    },
  ],

  transfer: [
    {
      id: "t1",
      prompt:
        "Two schools report their cycling. School A has 400 pupils and 40 cycle; School B has 250 pupils and 30 cycle. A headline says 'More cyclists at School B'. A second says 'Cycling is more common at School B'. Calculate the counts and the shares, and say which chart would support each headline. Then explain which claim is true, and what would reverse the second claim.",
      whyItTransfers:
        "The lesson reads one chart and computes one set of pie angles. Here the learner must compare two data sets with different totals, keep the count and the share apart, decide which representation supports which sentence, and then work out what would change the answer. The arithmetic is familiar; the separation of count from share, and the fact that a total can reverse a claim, are new.",
      answer:
        "School A: 40 out of 400 is 40/400 = 10%. School B: 30 out of 250 is 30/250 = 12%. School B has the higher share, but School A has more cyclists in total (40 against 30). A bar chart of the counts supports 'more cyclists at A', because 40 is taller than 30; the pie charts, or a bar of percentages, support 'cycling is more common at B', because 12% is a larger share than 10%. So the first headline is false and the second is true, but they are answers to different questions: one is about counts, the other about rates. A pie alone cannot show the 40 against 30 without the totals printed. If School B had 500 pupils, 30 cyclists would be 6%, below School A's 10%, so the second headline would reverse while the counts stayed the same — the total is doing the work.",
      marking: [
        "Calculates both shares: 40/400 = 10% and 30/250 = 12%.",
        "States both counts, 40 and 30, and separates the count comparison from the share comparison.",
        "Matches each headline to the representation that supports it: a count bar chart for the first, a pie or percentage chart for the second.",
        "Explains that a larger total with the same count lowers the share, so changing School B's total to 500 would reverse the second claim.",
      ],
    },
  ],

  retrieval: [
    {
      id: "x1",
      prompt: "Which chart would you use for the temperature on each day of a week, and why?",
      answer:
        "A line graph, because the days are an ordered sequence and the line shows how the value changes from one day to the next; a bar chart would compare days but hide the trend.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt: "A pie chart has a sector of 90°. What share of the whole is it, and what fraction?",
      answer: "90/360 = 0.25, so 25%, which is one quarter of the whole.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt: "Why should the vertical axis of a bar chart start at zero?",
      answer:
        "Because the bar's length encodes the value. A non-zero baseline makes the lengths no longer proportional to the values, so equal differences look unequal and a small change can look like a large one.",
      when: "month-later",
    },
  ],

  summary: [
    "The question chooses the chart: bars for unordered categories, a line for an ordered sequence, a pie for parts of one whole, a scatter for two measured variables.",
    "A bar's length encodes its value, so bars start at zero; truncating the axis can make a 12.5% rise look like a tripling even when every label is true.",
    "A pie angle is share × 360°, the angles must sum to 360°, and the chart shows shares rather than counts or the total.",
    "Read a chart by asking what the total is, what each axis does, and what is missing before believing the shape.",
    "Two charts with different totals cannot be compared by angle: recompute the counts, because a smaller share of a larger total can be more items.",
  ],

  accessibility: [
    {
      need: "screen-reader",
      alternative:
        "Every chart is also given as a table or a list of values in the text, and each angle is written as a share and a number of degrees, so no answer depends on seeing the drawing.",
    },
    {
      need: "low-vision",
      alternative:
        "Values and angles are set in the reading text at the learner's chosen size, and the lesson never relies on a small label inside a chart; the same numbers are in the paragraph beside it.",
    },
    {
      need: "dyslexia",
      alternative:
        "The reading routine is three short questions — total, scale, missing — and each calculation is written as one operation per line so a reader can follow it without holding a whole table in mind.",
    },
    {
      need: "colour-vision",
      alternative:
        "Categories are named in words and ordered by their labels, never distinguished by colour alone; a pie sector is identified by its category name and angle, not by a colour key.",
    },
    {
      need: "motor",
      alternative:
        "All practice and assessment answers are typed. No dragging bars, drawing sectors or interacting with a chart is required to demonstrate the method.",
    },
  ],

  provenance: [
    {
      sourceId: "openmind-authored",
      basis: "openmind-authored",
      licence: "OpenMind internal",
      attribution: "Written for OpenMind.",
      reproduction: "none",
      note:
        "All explanations, examples, practice, assessments and the two-school cycling transfer are original to OpenMind.",
    },
    {
      sourceId: "gcse-mathematics-subject-content",
      basis: "curriculum-citation",
      licence: "official-reference",
      attribution:
        "Scope cited against the published GCSE mathematics subject content for statistics.",
      reproduction: "none",
    },
  ],

  authors: [
    {
      author: "OpenMind curriculum team",
      role: "instructional author",
      authoredAt: "2026-11-09",
      method: "ai-assisted-then-edited",
    },
  ],

  reviews: [],
  learnerTesting: [],
  translations: [],
};
