import type { AuthoredLesson } from "../../lesson-contract";

// A SCATTER GRAPH SHOWS A RELATIONSHIP; IT DOES NOT EXPLAIN IT.
//
// The concept has three separate judgments that learners merge: direction,
// strength, and cause. The lesson keeps them apart. It fits a line through two
// points and checks predictions against the data range, because extrapolation
// is a claim about the model rather than a reading from the graph. The
// correlation/causation section uses the standard ice-cream and drowning
// example but makes the hidden variable explicit, then gives the learner a
// second case where the causal direction could run backwards.
export const MATHS_SCATTER_CORRELATION: AuthoredLesson = {
  contract: "openmind.lesson/1.0",
  conceptId: "scatter-correlation",
  version: "1.0.0",
  subject: "maths",
  curriculum: {
    reference:
      "GCSE Mathematics, statistics: scatter graphs, positive and negative correlation, lines of best fit, interpolation, extrapolation and the distinction between correlation and causation",
    level: "Key Stage 3 to GCSE Foundation and Higher",
    note:
      "Scope cited against the published GCSE mathematics subject content. All explanations, examples, practice, assessment and the transfer task are original. No specification, textbook or examination text is reproduced.",
  },
  declaredStatus: "draft",

  objectives: [
    {
      statement:
        "Describe a scatter graph by the direction and strength of its correlation, using the pattern rather than a single pair of points.",
      evidence:
        "The learner identifies a rising cloud as positive correlation, a falling cloud as negative, and a formless cloud as no correlation, and explains that strength is about how closely the points follow the pattern.",
    },
    {
      statement:
        "Draw or use a line of best fit and calculate its equation from two points on the line.",
      evidence:
        "The learner uses points (2, 58) and (6, 78) to obtain gradient 5 and equation y = 5x + 48, and predicts y = 70.5 at x = 4.5.",
    },
    {
      statement:
        "Distinguish interpolation from extrapolation and state why a prediction outside the data range is less reliable.",
      evidence:
        "The learner predicts inside the observed x-range with confidence, and refuses to treat a prediction at x = 12 as equally trustworthy because the line has not been tested there.",
    },
    {
      statement:
        "Explain why correlation does not establish causation, naming a plausible third factor or reverse causation.",
      evidence:
        "The learner explains that ice-cream sales and drowning deaths rise together because hot weather drives both, and does not conclude that buying ice cream causes drowning.",
    },
    {
      statement:
        "Explain how an outlier can change a line of best fit and a correlation judgment.",
      evidence:
        "The learner describes an outlier pulling the line toward it and weakening or reversing the apparent pattern, and says the original data should be checked before the point is discarded.",
    },
  ],

  priorKnowledge: {
    conceptIds: ["data-charts", "straight-lines"],
    check: [
      {
        id: "d1",
        question: "Which chart is appropriate for two measured variables on the same individual?",
        answer:
          "A scatter graph. Each point represents one individual, with one variable on the horizontal axis and the other on the vertical axis.",
        targets: ["data-charts"],
      },
      {
        id: "d2",
        question: "Find the gradient of the line through (2, 4) and (6, 12).",
        answer:
          "Gradient = change in y ÷ change in x = (12 − 4) ÷ (6 − 2) = 8 ÷ 4 = 2. The line rises 2 units for every 1 unit across.",
        targets: ["straight-lines"],
      },
      {
        id: "d3",
        question: "A line has equation y = 3x + 1. What is y when x = 4?",
        answer:
          "Substitute x = 4: y = 3 × 4 + 1 = 13. The equation gives a value for every x, but that does not mean every x is meaningful for the data.",
        targets: ["straight-lines"],
      },
      {
        id: "d4",
        question: "What does a negative gradient mean on a graph?",
        answer:
          "As x increases, y decreases. The line falls from left to right, so the two variables move in opposite directions.",
        targets: ["straight-lines"],
      },
    ],
  },

  introduction: {
    hook:
      "A café records the outdoor temperature and its hot-drink sales for ten days. On a scatter graph, the points tend to fall as temperature rises: hotter days, fewer hot drinks. That is negative correlation. A second graph of hours studied against test score tends to rise: positive correlation. A third graph of shoe size against test score is a formless cloud: no useful correlation. The direction and the tightness of the cloud are the first things to read. The second thing is what the pattern does not say: none of these graphs, by itself, proves that one variable causes the other.",
    why:
      "Scatter graphs are how data with two measurements is inspected before a model is fitted. They appear in science practicals, economics, public health and machine learning. The line of best fit is a summary, and a summary is only useful inside the range and conditions it was made from. Interpolation is a reading inside that range; extrapolation is a claim beyond it. Correlation is a description of how two variables move together; causation is a claim about mechanism, which needs a controlled comparison or a credible explanation, not a sloping cloud.",
  },

  explanation: [
    {
      heading: "One point is one individual, with two measurements",
      paragraphs: [
        "A scatter graph plots one point for each individual or trial. The horizontal axis holds one measured variable and the vertical axis holds the other. Unlike a bar chart, neither axis is a category; unlike a line graph, the points are not joined in time order. The order of the points does not matter, and joining them would invent a sequence the data does not have.",
        "Label both axes with the variable and its unit. The scales should be uniform and chosen so the pattern is visible without distorting it. A point's position is a pair of measurements, not an answer to a question; the pair is read together with every other pair. A single point far from the rest is an outlier, and it deserves a check before it is interpreted.",
        "The pattern is a property of the cloud, not of any two points. Two points always define a line, so choosing a convenient pair can make almost any slope look convincing. Read the whole cloud first, then fit a line through its middle.",
      ],
    },
    {
      heading: "Direction: positive, negative or none",
      paragraphs: [
        "Positive correlation means that as one variable increases, the other tends to increase. Hours studied and test score usually show this. Negative correlation means that as one variable increases, the other tends to decrease; temperature and hot-drink sales usually show this. No correlation means the points form no clear upward or downward pattern.",
        "Direction is not the same as steepness. A shallow rising cloud is still positive correlation; a steep falling cloud is still negative. The sign of the relationship is about which way the pattern runs, while the strength is about how closely the points cluster around it.",
        "A correlation can be strong or weak. Strong correlation means the points lie close to a clear line or curve; weak correlation means the pattern is visible but loose. A single outlier can make a strong pattern look weak, or a weak pattern look strong, which is why the point is inspected rather than automatically deleted.",
      ],
    },
    {
      heading: "A line of best fit summarises the middle of the cloud",
      paragraphs: [
        "A line of best fit is a straight line through the middle of the points, chosen so that the vertical distances of the points above and below it are balanced. It does not have to pass through any particular point, and it should not be forced through the origin unless the context requires it. It is a model of the trend, not a join-the-dots path.",
        "For a roughly linear cloud, take two points on the line — not necessarily data points — and calculate its equation. If the line passes through (2, 58) and (6, 78), the gradient is (78 − 58) ÷ (6 − 2) = 20 ÷ 4 = 5. Using y = mx + c at (2, 58): 58 = 5 × 2 + c, so c = 48. The line is y = 5x + 48.",
        "The equation turns a reading into a prediction. At x = 4.5, y = 5 × 4.5 + 48 = 70.5. The prediction is an estimate from the model, not a measurement. Report it with the same care as the data: a test score cannot be 70.5 marks if marks are whole numbers, and the context may require rounding.",
      ],
    },
    {
      heading: "Interpolation is inside the data; extrapolation is beyond it",
      paragraphs: [
        "Interpolation means predicting within the range of x-values that were observed. If the data run from x = 1 to x = 7, a prediction at x = 4.5 is interpolation. The line has support from points on both sides, so the estimate is reasonably trustworthy, though still an estimate.",
        "Extrapolation means predicting outside the observed range. A prediction at x = 12 from data ending at x = 7 is extrapolation. The straight-line pattern may not continue: the relationship may curve, flatten or break down. In a test-score context, a prediction above 100 is impossible, which is an immediate signal that the model has left its valid range.",
        "The distinction is about the data range, not the distance from the mean. A small extrapolation is still extrapolation. If a question asks for a prediction, state whether it is inside or outside the observed range and give the reason for your confidence. A number without that qualification hides the model's main limitation.",
      ],
    },
    {
      heading: "Outliers can pull the line and change the story",
      paragraphs: [
        "An outlier is a point that does not follow the overall pattern. It may be a recording error, a different population, or a genuine unusual case. Before deciding, check the original measurements and the context. Deleting a point merely because it weakens the preferred conclusion is not analysis.",
        "A line of best fit is influenced by every point, so an outlier can tilt it toward itself. In a rising cloud, a low outlier at a high x-value pulls the right end of the line down, reducing the gradient. The line may then pass below the main cluster and give poor predictions for ordinary points.",
        "An outlier can also create the appearance of correlation where none exists, especially in a small data set. Report the outlier, show the line with and without it if the decision matters, and explain which version is more defensible for the question. The goal is not a tidy graph; it is an honest summary.",
      ],
    },
    {
      heading: "Correlation is not causation",
      paragraphs: [
        "A correlation says the variables move together. It does not say which one drives the other, or whether a third variable drives both. Ice-cream sales and drowning deaths rise together across the year, but buying ice cream does not cause drowning. Hot weather increases both: more people buy ice cream and more people swim.",
        "Three common alternatives to a direct causal link are a common cause, reverse causation and chance. A common cause explains both variables at once, as temperature does. Reverse causation means the proposed effect is actually influencing the proposed cause. Chance means the pattern may be a coincidence in a small sample, which is why the size and selection of the data matter.",
        "A controlled experiment, or a credible mechanism supported by other evidence, is needed before a causal claim. A scatter graph can suggest a hypothesis; it cannot confirm one. The correct sentence is 'the data show a positive association between x and y', not 'x causes y', unless the study design supports the stronger claim.",
      ],
    },
    {
      heading: "Reading a correlation claim critically",
      paragraphs: [
        "Ask what was measured, on whom, and over what range. A correlation computed over a narrow range can be strong without saying much outside it. A correlation in a selected group may not hold in the wider population. A correlation based on averages can differ from one based on individuals, sometimes reversing sign entirely.",
        "Ask how the variables were defined. Changing the units does not change the correlation, but changing the definition can. Ask whether the relationship is linear; a strong curved relationship can have a modest straight-line correlation, and a straight line can be a poor summary even when the correlation is high.",
        "Finally, separate the numerical summary from the causal story. A correlation coefficient near 1 or −1 describes a tight linear pattern; it does not describe a mechanism. The graph and the coefficient are evidence about association, and the causal claim needs its own evidence.",
      ],
    },
  ],

  representations: [
    {
      id: "r1",
      kind: "maths.graph",
      body:
        "Each point pairs one individual's two measurements. The cloud's direction and tightness describe the correlation.",
      notation:
        "hours studied x: 1, 2, 3, 4, 5, 6, 7   ·   test score y: 52, 58, 61, 68, 72, 79, 83",
      caption:
        "The points rise from left to right and lie fairly close to a line, so this is strong positive correlation. No point is joined to the next; the order of the rows is not a time sequence.",
    },
    {
      id: "r2",
      kind: "maths.expression",
      body:
        "A line of best fit through the middle of the cloud can be written as an equation and used for predictions.",
      notation:
        "through (2, 58) and (6, 78): gradient = (78 − 58)/(6 − 2) = 5   ·   y = 5x + 48   ·   at x = 4.5, y = 70.5",
      caption:
        "The gradient is the change in the predicted score per extra hour. The intercept is the model's value at x = 0, which may or may not be meaningful in context.",
    },
    {
      id: "r3",
      kind: "maths.graph",
      body:
        "Interpolation stays inside the observed x-range; extrapolation goes beyond it and relies on the pattern continuing.",
      notation:
        "observed x: 1 to 7   ·   x = 4.5 is interpolation   ·   x = 12 is extrapolation",
      caption:
        "A prediction at x = 12 from data ending at x = 7 is a claim about the model, not a reading from the data. The straight line may not continue.",
    },
    {
      id: "r4",
      kind: "maths.expression",
      body:
        "A correlation can have a common cause, reverse causation or chance behind it. The graph alone does not choose between them.",
      notation:
        "ice-cream sales ↑ and drowning deaths ↑   ·   common cause: hot weather   ·   not: ice cream causes drowning",
      caption:
        "The association is real; the causal direction is not established by the scatter graph. A controlled comparison or a plausible mechanism is needed.",
    },
  ],

  workedExamples: [
    {
      id: "w1",
      prompt:
        "A scatter graph plots hours studied against test score. The points rise from about (1, 52) to (7, 83) and lie fairly close to a straight line. Describe the correlation and explain what the pattern does and does not show.",
      steps: [
        {
          move:
            "Read the direction first: as hours studied increases from 1 to 7, the test scores tend to increase from about 52 to about 83.",
          why:
            "The overall movement from left to right describes the sign of the relationship. One pair of points is not enough; the pattern across the cloud is what matters.",
        },
        {
          move:
            "Read the strength: the points lie fairly close to a line, so the positive correlation is strong rather than weak.",
          why:
            "Strength is about how tightly the points cluster around the trend. A rising cloud with wide scatter would still be positive but weaker.",
        },
        {
          move:
            "State the association without claiming a cause: more study time is associated with higher scores, but the graph does not prove that studying caused the increase.",
          why:
            "Other variables, such as prior attainment or motivation, could influence both. A correlation describes co-movement, not a mechanism.",
        },
        {
          move:
            "The correlation is strong and positive: as study time rises by 1 hour, the score tends to rise by about 5 marks. The graph shows an association, not proof that studying causes the higher score.",
          why:
            "The approximate rate comes from the overall slope, not from a single pair. The final clause keeps the causal claim separate from the numerical description.",
        },
      ],
      answer: "strong positive correlation; about 5 marks per extra hour, but not proof of causation",
    },
    {
      id: "w2",
      prompt:
        "A line of best fit passes through (2, 58) and (6, 78). Find its equation and predict the score at 4.5 hours.",
      steps: [
        {
          move:
            "Find the gradient: change in y ÷ change in x = (78 − 58) ÷ (6 − 2) = 20 ÷ 4 = 5.",
          why:
            "The gradient is the predicted change in the vertical variable for each one-unit increase in the horizontal variable.",
        },
        {
          move:
            "Use y = mx + c with one point: 58 = 5 × 2 + c, so c = 58 − 10 = 48. The equation is y = 5x + 48.",
          why:
            "Substituting a point on the line fixes the intercept. Using a point not on the line would give a different, wrong intercept.",
        },
        {
          move:
            "Substitute x = 4.5: y = 5 × 4.5 + 48 = 22.5 + 48 = 70.5.",
          why:
            "The prediction is inside the observed range 1 to 7, so it is interpolation. It is still an estimate from the model, not a measurement.",
        },
        {
          move:
            "The equation is y = 5x + 48, and the predicted score at 4.5 hours is 70.5. The prediction is interpolation because 4.5 lies inside the data range 1 to 7.",
          why:
            "Naming the range separates a supported estimate from an extrapolation. It also tells the reader why this prediction is more defensible than one at x = 12.",
        },
      ],
      answer: "y = 5x + 48; predicted score 70.5 at 4.5 hours (interpolation)",
    },
    {
      id: "w3",
      prompt:
        "The same line y = 5x + 48 is fitted to data with x from 1 to 7. Predict the score at 12 hours, and explain why the prediction should not be trusted.",
      steps: [
        {
          move:
            "Substitute x = 12: y = 5 × 12 + 48 = 60 + 48 = 108.",
          why:
            "The equation can be evaluated at any x. Arithmetic validity is not the same as contextual validity.",
        },
        {
          move:
            "Compare 12 with the observed range 1 to 7: 12 is outside the range, so this is extrapolation.",
          why:
            "The line was fitted to data between 1 and 7. Outside that interval, there is no evidence that the same straight-line pattern continues.",
        },
        {
          move:
            "Check the context: a test score of 108 is impossible if the maximum is 100, so the model has produced a value that cannot occur.",
          why:
            "A prediction that violates a known bound is a signal that the model is being used beyond its range. The arithmetic is correct; the application is not.",
        },
        {
          move:
            "The predicted value is 108, but it is an extrapolation beyond the data range 1 to 7 and exceeds the possible score, so it should not be trusted.",
          why:
            "The final sentence gives both reasons: distance beyond the observed range and a context bound. Either one is enough to reject the prediction as a real forecast.",
        },
      ],
      answer: "108 at 12 hours; extrapolation beyond 1–7 and above the maximum score, so unreliable",
    },
    {
      id: "w4",
      prompt:
        "A line y = 2x + 1 predicts y = 9 at x = 4. A new point is measured at (4, 15). Explain what the point is and how it could affect the line.",
      steps: [
        {
          move:
            "Compare the observed value 15 with the prediction 9 at the same x = 4. The point is 6 units above the line.",
          why:
            "A residual is the vertical distance between the observed point and the model's prediction. A large residual marks a point the model does not explain well.",
        },
        {
          move:
            "The point (4, 15) is an outlier relative to the pattern summarised by y = 2x + 1.",
          why:
            "An outlier is a point that does not follow the overall pattern. It may be a genuine extreme case or a measurement error, so it should be checked before it is removed.",
        },
        {
          move:
            "If the line is refitted with this point, it will be pulled upward at the right-hand end, which tends to increase the gradient and the intercept.",
          why:
            "A line of best fit balances all points. A high point at a large x-value exerts leverage on the right end, so the line tilts toward it.",
        },
        {
          move:
            "The new point (4, 15) is an outlier 6 units above the prediction 9; refitting can tilt the line upward, so the original data and the reason for the point must be checked first.",
          why:
            "The explanation connects the residual to the line's leverage and then to the decision. Deleting the point without checking would hide a real observation or a real error.",
        },
      ],
      answer: "outlier 6 units above the predicted 9; it can tilt the line upward, so check it before refitting",
    },
  ],

  misconceptions: [
    {
      id: "m1",
      belief: "If two variables are correlated, one must cause the other.",
      whyItFails:
        "Correlation describes co-movement, not mechanism. A third variable can drive both, the causal direction can be reversed, or the pattern can be chance. Ice-cream sales and drowning deaths rise together because hot weather increases both, not because ice cream causes drowning.",
      correction:
        "State the association first, then ask what else could explain it. A causal claim needs a controlled comparison or a credible mechanism supported by evidence beyond the scatter graph.",
      contrast: {
        wrong: "The graph rises, so studying causes higher scores",
        right: "The graph shows a positive association; a controlled study is needed before claiming that studying causes higher scores",
      },
    },
    {
      id: "m2",
      belief: "A line of best fit must pass through the first and last data points.",
      whyItFails:
        "A line of best fit summarises the middle of the cloud. It need not pass through any data point, and forcing it through the extremes lets two unusual points control the whole model. The best line balances the vertical distances of all points.",
      correction:
        "Draw the line through the middle of the pattern, with roughly equal numbers of points above and below. Choose two points on the line itself to calculate its equation, not two data points that happen to be convenient.",
      contrast: {
        wrong: "Join the lowest and highest points and call it the line of best fit",
        right: "Draw a line through the middle of the cloud; it may pass through no data point at all",
      },
    },
    {
      id: "m3",
      belief: "A prediction from the line is equally reliable anywhere the equation can be evaluated.",
      whyItFails:
        "The line is supported only by the observed range. Outside that range the relationship may curve, flatten or break down, and context bounds may make the prediction impossible. A test score above 100 is the clearest example: the arithmetic works, but the answer cannot occur.",
      correction:
        "State whether the prediction is interpolation (inside the observed range) or extrapolation (outside it). Treat extrapolation as a cautious hypothesis, and check it against context bounds and any reason the pattern might change.",
      contrast: {
        wrong: "The equation gives 108 at 12 hours, so the score will be 108",
        right: "108 is an extrapolation beyond the observed 1–7 hours and above the maximum score, so it is not a credible forecast",
      },
    },
    {
      id: "m4",
      belief: "A negative correlation means there is no relationship.",
      whyItFails:
        "Negative correlation is a relationship in which one variable tends to fall as the other rises. It can be just as strong as a positive correlation. 'No correlation' is the formless cloud, not a falling one.",
      correction:
        "Read the direction from the slope of the cloud: rising is positive, falling is negative, formless is none. Strength is separate: a steep falling cloud can be a strong negative relationship.",
      contrast: {
        wrong: "Hotter days mean fewer hot drinks, so there is no correlation",
        right: "Hotter days mean fewer hot drinks: that is a negative correlation",
      },
    },
    {
      id: "m5",
      belief: "An outlier should always be deleted because it spoils the pattern.",
      whyItFails:
        "An outlier may be a recording error, a different population, or a genuine extreme case. Deleting it without checking can hide a real effect or a data-quality problem. It can also change the line and the correlation in ways that matter to the conclusion.",
      correction:
        "Check the original measurement and context first. If the point is valid, report the line with and without it and explain which is more appropriate. Never remove a point only because it weakens the desired story.",
      contrast: {
        wrong: "Remove the low point so the rising line looks stronger",
        right: "Check the low point; if it is valid, show how it changes the line and discuss both fits",
      },
    },
    {
      id: "m6",
      belief: "A strong correlation means the line will predict every individual accurately.",
      whyItFails:
        "A correlation describes the overall pattern, not each point. Even a strong correlation leaves scatter around the line, and an individual can be well above or below the prediction. The line predicts an average tendency, not a guarantee.",
      correction:
        "Report the prediction as an estimate with the scatter visible. Use the graph to see the spread around the line, and do not turn a group-level trend into a claim about one person.",
      contrast: {
        wrong: "The correlation is strong, so this learner will score exactly 70.5",
        right: "The line predicts about 70.5 on average; individual scores vary around it",
      },
    },
  ],

  guidedPractice: [
    {
      id: "p1",
      prompt:
        "A line of best fit passes through (2, 58) and (6, 78). Find its gradient.",
      hint: "Gradient = change in y ÷ change in x.",
      answer: "5",
      feedback: {
        correct:
          "(78 − 58) ÷ (6 − 2) = 20 ÷ 4 = 5. The predicted score rises 5 marks per extra hour.",
        incorrect:
          "Subtract in the same order on both axes: (78 − 58) ÷ (6 − 2) = 20 ÷ 4 = 5. Reversing one subtraction gives −5, the wrong sign.",
      },
    },
    {
      id: "p2",
      prompt:
        "Using the line y = 5x + 48, predict the score at 3 hours.",
      hint: "Substitute x = 3 into the equation.",
      answer: "63",
      feedback: {
        correct:
          "y = 5 × 3 + 48 = 15 + 48 = 63. This is interpolation because 3 lies inside the observed range 1 to 7.",
        incorrect:
          "Substitute x = 3: 5 × 3 = 15, then add 48 to get 63. Multiplying 5 by 48 would use the intercept as part of the gradient.",
      },
    },
    {
      id: "p3",
      prompt:
        "The data range is x = 1 to x = 7. Is a prediction at x = 10 interpolation or extrapolation?",
      hint: "Compare 10 with the observed range.",
      answer: "extrapolation",
      feedback: {
        correct:
          "10 is outside the observed range 1 to 7, so the prediction is extrapolation and relies on the pattern continuing.",
        incorrect:
          "The line can be evaluated at 10, but 10 is outside the data range. That makes it extrapolation, not interpolation.",
      },
    },
    {
      id: "p4",
      prompt:
        "A rising cloud has one point far below the line at a high x-value. What happens to the line of best fit if that point is included?",
      hint: "A line balances all points, so a low point at the right end pulls that end down.",
      answer: "the line tilts downward at the right, reducing the gradient",
      feedback: {
        correct:
          "The low outlier pulls the right-hand end of the line down, so the gradient decreases and the line may sit below the main cluster.",
        incorrect:
          "The line is pulled toward every point. A low point at a high x-value lowers the right end, reducing the gradient; it does not leave the line unchanged.",
      },
    },
    {
      id: "p5",
      prompt:
        "As temperature rises, hot-drink sales fall. What type of correlation is this?",
      hint: "The variables move in opposite directions.",
      answer: "negative correlation",
      feedback: {
        correct:
          "One variable rises while the other falls, so the correlation is negative. It is a relationship, not an absence of one.",
        incorrect:
          "A falling pattern is negative correlation. 'No correlation' would be a formless cloud, not a clear downward trend.",
      },
    },
  ],

  assessment: [
    {
      id: "a1",
      kind: "short-answer",
      prompt:
        "A line of best fit passes through (1, 50) and (5, 70). Find its gradient.",
      modelAnswer: "5",
      marking: [
        "Subtracts the y-values: 70 − 50 = 20.",
        "Subtracts the x-values in the same order: 5 − 1 = 4, then divides 20 ÷ 4 = 5.",
      ],
      check: {
        accepted: ["5", "+5"],
      },
    },
    {
      id: "a2",
      kind: "constructed-response",
      prompt:
        "A study finds a strong positive correlation between the number of firefighters at a fire and the amount of damage. Explain why it would be wrong to conclude that sending more firefighters causes more damage. Suggest a more plausible explanation and state what kind of evidence would support a causal claim.",
      modelAnswer:
        "The correlation is positive because larger fires tend to attract more firefighters and also cause more damage. Fire size is a common cause of both variables, so the number of firefighters is associated with damage without causing it. A more plausible explanation is that the severity of the fire drives both the response and the damage. To support a causal claim, a controlled comparison or a careful natural experiment would be needed, with fire size and other relevant factors accounted for; the scatter graph alone cannot separate the common cause from a direct effect.",
      marking: [
        "Identifies the correlation as positive but not necessarily causal.",
        "Names fire size (or fire severity) as a common cause of both variables.",
        "Explains that larger fires attract more firefighters and cause more damage.",
        "States that a controlled comparison or natural experiment is needed for a causal claim.",
        "Mentions accounting for other relevant factors rather than relying on the scatter graph alone.",
      ],
    },
    {
      id: "a3",
      kind: "short-answer",
      prompt:
        "A line of best fit has equation y = 4x + 10. Predict y when x = 6.",
      modelAnswer: "34",
      marking: [
        "Substitutes x = 6 into the equation: 4 × 6 = 24.",
        "Adds the intercept: 24 + 10 = 34.",
      ],
      check: {
        accepted: ["34", "34.0"],
      },
    },
    {
      id: "a4",
      kind: "constructed-response",
      prompt:
        "Explain what an outlier is and describe two different ways it can affect a line of best fit or a conclusion from a scatter graph.",
      modelAnswer:
        "An outlier is a point that does not follow the overall pattern of the other points. It can be a genuine extreme value, a member of a different population or a recording error. First, it can pull the line of best fit toward itself, changing the gradient and intercept; a low point at a high x-value can flatten a rising line. Second, it can make a strong correlation look weaker, or create the appearance of a correlation in a small data set. Because of these effects, the original measurement and context should be checked before the point is removed, and the analysis should report how the conclusion changes if it is included or excluded.",
      marking: [
        "Defines an outlier as a point that does not follow the overall pattern.",
        "Gives at least one possible cause: genuine extreme, different population or measurement error.",
        "Explains that the outlier can pull the line and change its gradient or intercept.",
        "Explains that it can weaken, strengthen or create an apparent correlation.",
        "States that the point should be checked before removal and the effect on the conclusion reported.",
      ],
    },
    {
      id: "a5",
      kind: "short-answer",
      prompt:
        "A correlation coefficient of −0.9 is found between two variables. Describe the direction and strength of the correlation.",
      modelAnswer: "strong negative correlation",
      marking: [
        "Recognises the negative sign as a falling relationship.",
        "Recognises that 0.9 is close to −1, so the negative correlation is strong.",
      ],
      check: {
        accepted: ["strong negative correlation", "strong negative", "negative and strong"],
      },
    },
  ],

  transfer: [
    {
      id: "t1",
      prompt:
        "A school finds that students who eat breakfast score higher on a test. The correlation is positive and moderate. A governor concludes that the school should provide breakfast to raise scores. Evaluate the conclusion. Propose one common-cause explanation, one reverse-causation explanation and one way to gather stronger evidence.",
      whyItTransfers:
        "The learner must apply the correlation/causation distinction to a new context, generate competing explanations rather than only rejecting the causal claim, and propose a design that could distinguish them. The task also tests whether the learner can keep the observed association while rejecting an unsupported mechanism.",
      answer:
        "The positive, moderate correlation means breakfast eating and test scores tend to rise together, but it does not establish that breakfast causes the higher scores. A common-cause explanation is that families with more stable routines or higher income provide both breakfast and additional academic support. A reverse-causation explanation is less direct but possible if students who feel well or are already engaged with school are more likely to eat breakfast; the causal direction is not settled by the correlation. Stronger evidence would come from a controlled comparison, such as a randomised or carefully matched trial in which breakfast provision is changed while other factors are held as constant as possible, with scores measured before and after. The school should not claim that providing breakfast will raise scores on the basis of this correlation alone.",
      marking: [
        "Accepts the positive, moderate association but rejects the causal conclusion.",
        "Gives a plausible common cause, such as family routine, income or prior attainment.",
        "Gives a plausible reverse-causation or selection explanation and explains it.",
        "Proposes a controlled or matched comparison rather than another observational correlation.",
        "States what would be measured and what would be held constant.",
        "Concludes that the governor's policy claim is not supported by the correlation alone.",
      ],
    },
  ],

  retrieval: [
    {
      id: "x1",
      prompt:
        "A line passes through (2, 10) and (6, 30). Find its gradient.",
      answer:
        "(30 − 10) ÷ (6 − 2) = 20 ÷ 4 = 5. The line rises 5 units for every 1 unit across.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt:
        "Using y = 3x + 2, find y when x = 5.",
      answer:
        "y = 3 × 5 + 2 = 15 + 2 = 17. This is a model prediction, not a measurement.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt:
        "What is the difference between correlation and causation?",
      answer:
        "Correlation means two variables move together; causation means one produces a change in the other. A correlation can be explained by a common cause, reverse causation or chance, so it does not by itself establish causation.",
      when: "week-later",
    },
    {
      id: "x4",
      prompt:
        "Why is interpolation usually more reliable than extrapolation?",
      answer:
        "Interpolation predicts inside the observed data range, where the line is supported by nearby points. Extrapolation predicts outside that range, where the pattern may change and there is no direct evidence that the line continues.",
      when: "month-later",
    },
    {
      id: "x5",
      prompt:
        "What effect can an outlier have on a line of best fit?",
      answer:
        "An outlier can pull the line toward itself, changing the gradient and intercept, and it can weaken or create the appearance of a correlation. It should be checked before being removed.",
      when: "month-later",
    },
  ],

  summary: [
    "A scatter graph plots one point per individual, with one measured variable on each axis.",
    "Positive correlation: both variables tend to rise together. Negative: one tends to fall as the other rises. None: no clear pattern.",
    "Strength is how closely the points follow the pattern; it is separate from direction.",
    "A line of best fit goes through the middle of the cloud and need not pass through any data point.",
    "From two points on the line, gradient = change in y ÷ change in x, then solve for the intercept.",
    "Interpolation is inside the observed range; extrapolation is outside it and depends on the pattern continuing.",
    "An outlier can pull the line and change the correlation; check it before deciding what to do.",
    "Correlation is not causation: a common cause, reverse causation or chance can produce an association.",
    "Only a controlled comparison or a credible mechanism supports a causal claim; the scatter graph suggests, it does not prove.",
  ],

  accessibility: [
    {
      need: "screen-reader",
      alternative:
        "The data are given as a table of paired values in the caption and prose, not only as points. The correlation is described in words — rising, falling, tight or loose — and every prediction is written as an equation and a sentence.",
    },
    {
      need: "dyslexia",
      alternative:
        "Axes, gradient and intercept are named in words before symbols. The line calculation is set out as one operation per line, and the correlation/causation distinction is kept in a two-column contrast rather than a long paragraph.",
    },
    {
      need: "cognitive",
      alternative:
        "The lesson uses one reading routine: direction, strength, line, prediction range, cause. Each worked example repeats the same five questions, so the learner is not asked to invent a new procedure for each graph.",
    },
    {
      need: "colour-vision",
      alternative:
        "The trend is described by the positions of the points and by the words positive, negative and none, not by colour. The line of best fit is identified by its equation and label.",
    },
    {
      need: "motor",
      alternative:
        "All answers are typed; no points need to be dragged or plotted. The data table and equations provide a complete route without manipulating a graph.",
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
        "All teaching prose, data sets, examples, practice, assessment and the breakfast transfer task are original to OpenMind.",
    },
    {
      sourceId: "gcse-mathematics-subject-content",
      basis: "curriculum-citation",
      licence: "official-reference",
      attribution:
        "Scope cited against the published GCSE mathematics subject content for scatter graphs, lines of best fit and correlation.",
      reproduction: "none",
    },
  ],

  authors: [
    {
      author: "OpenMind curriculum team",
      role: "instructional author",
      authoredAt: "2026-11-12",
      method: "ai-assisted-then-edited",
    },
  ],

  reviews: [],
  learnerTesting: [],
  translations: [],
};
