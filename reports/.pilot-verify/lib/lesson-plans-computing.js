"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.COMPUTING_LENSES = void 0;
/** Concept-specific teaching for the computing concepts that do not yet have a
 *  pilot-authored plan. */
exports.COMPUTING_LENSES = {
    "what-is-code": {
        intuition: "A recipe tells a cook what to do in order; code tells a computer the same way, but with no room for interpretation. 'Add salt' is ambiguous to a machine; 'add 2 grams of salt' is an instruction.",
        move: "Break the goal into small, ordered steps, then write each step as an instruction the machine can test. Name the inputs, the process and the output before writing any syntax.",
        check: "Read the instructions aloud exactly as written, including the boring cases. If a step could be interpreted two ways, the computer will usually choose the way you did not intend.",
        trap: [
            "Writes code that does what the programmer meant rather than what the words say.",
            "A computer executes the instructions literally, so an unstated assumption is not followed. Make every condition and every input explicit, then test an unexpected value.",
        ],
    },
    variables: {
        intuition: "A variable is a labelled box. Putting 0 in a box called score and then adding 10 changes what the box holds; the label stays the same while the value moves.",
        move: "Choose a name that says what the value means, assign it once, and update it explicitly. Keep types consistent: a number for arithmetic, a string for text, a boolean for a yes/no condition.",
        check: "Print the variable before and after each change. If a calculation gives text joined together instead of a sum, one of the values is a string and needs converting.",
        trap: [
            "Adds a number to a string and expects arithmetic: \"3\" + 4 gives \"34\" in many languages.",
            "A string is text, so + joins it. Convert the text to a number first, or keep numeric values numeric from the start, before adding.",
        ],
    },
    conditionals: {
        intuition: "A thermostat chooses between heating, cooling and doing nothing based on the temperature. A conditional is the same decision written as a test, with one branch taken and the others skipped.",
        move: "Write the condition as a boolean expression, order the branches from most specific to least specific, and make the else branch handle everything left over. Use early returns to keep nesting shallow.",
        check: "Test the boundary values, not only the middle of each range. If the condition is `> 30`, test 30 as well as 29 and 31; an off-by-one at the boundary is the usual bug.",
        trap: [
            "Uses two separate if statements when the second should only run if the first did not.",
            "Two independent ifs can both run. Use else-if when the cases are mutually exclusive, so a value cannot fall into more than one branch.",
        ],
    },
    loops: {
        intuition: "A for loop is a factory line that repeats a fixed number of times; a while loop is a door that stays open until a condition changes. Both save you from copying the same instruction by hand.",
        move: "For a known collection, iterate over the items directly. For a condition, update the variable that controls the loop inside the body, and make sure it can eventually become false.",
        check: "Trace the first and last iteration, and check the loop variable's start and end values. If the body never changes the while condition, the loop will not terminate.",
        trap: [
            "Uses `<=` when iterating to the length of a list, then reads one item past the end.",
            "A list of length n has indices 0 to n − 1. `range(n)` or `< n` stops at the last valid index; `<= n` goes one too far.",
        ],
    },
    "lists-arrays": {
        intuition: "A list is a row of numbered lockers. The first locker is number 0, so a list of three items has positions 0, 1 and 2 — not 1, 2 and 3. That zero is a position, not a count.",
        move: "Use index access for a known position, append to add at the end, and iteration for every item. For a grid, use a list of lists and address it as grid[row][column].",
        check: "Check the length before indexing, and remember that the last valid index is length − 1. An empty list has no valid index at all.",
        trap: [
            "Uses the first index as 1 because people count from one.",
            "Most programming languages index lists from 0. The first item is at 0 and the last is at length − 1; using 1 skips the first item and can run past the end.",
        ],
    },
    "functions-code": {
        intuition: "A function is a named machine: put an input in, get an output out, and reuse the same machine wherever the job appears. Changing the machine changes every call at once.",
        move: "Give the function a name that describes its job, list only the parameters it needs, and return a value rather than printing it when callers need the result. Keep one job per function.",
        check: "Call the function with a normal value, a boundary value and an invalid value. If it returns a different type from the one the caller expects, the contract is unclear.",
        trap: [
            "Prints the result inside the function and also returns it, so callers cannot tell which value is the answer.",
            "Printing is a side effect for a human; returning is how a program passes a value on. Choose one contract, usually return, and let the caller decide whether to display it.",
        ],
    },
    dictionaries: {
        intuition: "A dictionary is a labelled index: instead of searching a list for a name, you look it up directly by its key. The label is the key and the stored value is what comes back.",
        move: "Choose a key that uniquely identifies the value, then use get, set and membership checks. For counting, start missing keys at zero before adding one; for grouping, append to a list stored under each key.",
        check: "A missing key is not the same as a key whose value is zero or empty. Use a safe lookup with a default, and check membership before assuming the key exists.",
        trap: [
            "Uses a list and scans it for every lookup when the data is naturally keyed.",
            "A scan is O(n) for every lookup, while a dictionary is typically O(1). The right structure changes the program's growth, not just its length.",
        ],
    },
    "algorithms-search": {
        intuition: "Looking for a word in a dictionary by reading every page is linear search. Opening to the middle and choosing a half is binary search — far fewer steps, but only because the book is already in order.",
        move: "For binary search, keep a low and high index, inspect the middle, and discard the half that cannot contain the target. Stop when the range is empty or the target is found.",
        check: "Binary search requires sorted data; if the list is unsorted, the comparison tells you nothing about which half to discard. Count the steps: 1,000,000 items should take about 20 halvings.",
        trap: [
            "Runs binary search on an unsorted list because it is faster than linear search.",
            "The halving step depends on order. In an unsorted list, the middle value does not tell you which side the target is on, so the search can discard the answer.",
        ],
    },
    "algorithms-sort": {
        intuition: "Bubble sort repeatedly swaps neighbours until the biggest values rise to the end. Merge sort splits the list into halves, sorts each, and merges the sorted pieces — much less work on large lists.",
        move: "Trace a small list by hand. For merge sort, write the split, the recursive sort of each half, and the merge step that repeatedly takes the smaller front item from the two sorted halves.",
        check: "After sorting, every adjacent pair must be in order, and the output must contain exactly the same items as the input. Check the empty list and the one-item list as base cases.",
        trap: [
            "Says merge sort is always faster because it has a better Big-O class.",
            "Big-O describes growth for large inputs. For a tiny list, the overhead of splitting and merging can make a simpler sort faster; use the complexity to predict scaling, not every runtime.",
        ],
    },
    recursion: {
        intuition: "Russian dolls contain smaller dolls of the same kind. A recursive function solves a problem by opening a smaller version of the same problem, stopping when it reaches the smallest doll.",
        move: "Write the base case first, then the recursive case with an input that is strictly closer to the base. Trust the recursive call to solve the smaller problem, and combine its result.",
        check: "Every path must reach the base case. Trace factorial(3) down to factorial(0) and back up; if the argument does not shrink, the recursion will overflow the call stack.",
        trap: [
            "Forgets the base case and relies on the loop or an external condition to stop.",
            "Without a base case, the function calls itself forever until the call stack overflows. The base case is the first thing to write and the first thing to test.",
        ],
    },
    complexity: {
        intuition: "A million operations are fine; a million-squared operations are not. Big-O describes how the work grows as the input grows, which is more useful than a stopwatch on one machine.",
        move: "Count the loops that depend on n: one pass is O(n), a nested pair is O(n²), and halving the input each time is O(log n). Drop constants and lower-order terms, because the growth class is the point.",
        check: "Double n and predict the new cost: O(n) doubles, O(n²) quadruples, O(log n) adds one step. If the measured growth does not match, a hidden loop or repeated scan is present.",
        trap: [
            "Calls an O(n²) algorithm fast because it finishes quickly on ten items.",
            "Small inputs hide growth. At n = 10, n² is 100; at n = 100,000, it is 10 billion. Complexity is about the shape of the curve, not the first measurement.",
        ],
    },
    "binary-data": {
        intuition: "A light switch is either on or off, and a byte is eight switches. With eight bits there are 2⁸ = 256 possible patterns, which is enough for a character, a small number or one channel of a colour.",
        move: "Convert between binary and decimal by labelling positions with powers of two. For text, use a character encoding; for images, store pixel colour values; for sound, store samples of amplitude over time.",
        check: "Eight bits make one byte, and a binary digit can only be 0 or 1. Check the number of distinct values: n bits give 2ⁿ patterns, not n values.",
        trap: [
            "Thinks a kilobyte is exactly 1,000 bytes in every context.",
            "Decimal units use powers of 10 and binary units use powers of 2. A kibibyte is 1,024 bytes, while a kilobyte is often 1,000; the difference matters at storage scale.",
        ],
    },
    networks: {
        intuition: "A letter is split into numbered pages, each page is addressed, and the pages can take different routes and be reassembled at the destination. Packets work the same way.",
        move: "Describe the layer's job: IP addresses and routes packets, TCP orders and retransmits them, DNS maps names to addresses, and HTTP carries requests and responses. Keep the layers separate when diagnosing a problem.",
        check: "A network problem can be name resolution, routing, a port, or the application. Test each layer in turn rather than assuming the website itself is down.",
        trap: [
            "Says the internet is the same thing as the World Wide Web.",
            "The internet is the network of networks that moves packets; the web is one application — HTTP pages — running on top of it. Email and video calls use the internet without using the web.",
        ],
    },
    cybersecurity: {
        intuition: "A chain is only as strong as its weakest link. A strong password does not help if a phishing email convinces you to hand it over, which is why security is about people and systems, not only cryptography.",
        move: "Identify the threat first: phishing targets the person, malware targets the machine, brute force targets the credential. Match the defence to the threat: awareness, updates, strong unique passwords and 2FA.",
        check: "Ask what the attacker gains and what the defence actually prevents. Encryption protects data in transit; hashing protects stored passwords; neither stops a user from being tricked into revealing a password.",
        trap: [
            "Says hashing a password is the same as encrypting it.",
            "Encryption is reversible with the key; a hash is a one-way fingerprint. Storing a hash means even the server cannot recover the password, which is the point.",
        ],
    },
    "databases-sql": {
        intuition: "A spreadsheet with one row per student is a table. A primary key is the student ID that identifies each row; a foreign key is the class ID that links a student to a class.",
        move: "Write the query in clauses: SELECT the columns, FROM the table, WHERE the filter, GROUP BY the grouping, ORDER BY the order. For a join, name the key that links the two tables.",
        check: "Run the query without the filter first to see the full table, then add one clause at a time. A join that duplicates rows usually means the key is not unique on one side.",
        trap: [
            "Stores the same student's name in every class row instead of linking to a student table.",
            "Duplicated data can disagree with itself and must be updated in several places. Normalise it into a student table and link by a foreign key.",
        ],
    },
    "web-stack": {
        intuition: "A house has a frame, decoration and wiring. HTML is the frame, CSS is the decoration, and JavaScript is the wiring that makes the lights respond to a switch.",
        move: "Start with semantic HTML for structure, add CSS for layout and appearance, then JavaScript for behaviour. Keep content, presentation and interaction in separate layers so each can change without breaking the others.",
        check: "Disable JavaScript and check the page still has its content; disable CSS and check the structure still makes sense. If either layer is doing another layer's job, the page will be harder to maintain and less accessible.",
        trap: [
            "Uses JavaScript to build all the page content when HTML could carry it.",
            "An HTML-first page is readable before scripts run, works with assistive technology and is easier to index. JavaScript should add behaviour, not replace the document's structure.",
        ],
    },
    "ai-basics": {
        intuition: "A spam filter learns from thousands of emails already labelled spam or not spam. It is not following a hand-written rule for every word; it is finding patterns in the examples.",
        move: "Separate training data from test data, choose a model, fit its parameters on the training set, and evaluate on data it has never seen. Compare against a simple baseline before claiming the model is useful.",
        check: "A model that scores 99% on its training data but 60% on new data has overfit. Check the test set, the class balance and whether the data contains leakage from the answer.",
        trap: [
            "Judges a model only by its accuracy on the data it was trained on.",
            "Training accuracy measures memorisation, not generalisation. The useful number is performance on held-out data, especially when one class is much more common than another.",
        ],
    },
    "statistics-data": {
        intuition: "A dataset can have the same mean and wildly different spreads. A summary that reports only the average hides the shape, the outliers and the people the average does not describe.",
        move: "Clean the data, plot it, compute several summaries (mean, median, spread), and look for missing values and outliers. State the sample and how it was collected before drawing a conclusion.",
        check: "Ask whether the sample is representative and whether the comparison is fair. A difference between groups can come from a confounding variable rather than the thing being studied.",
        trap: [
            "Concludes that a correlation in a dataset proves causation.",
            "Observational data can be explained by a third variable, reverse causation or selection bias. A causal claim needs a controlled design or a strong independent argument.",
        ],
    },
};
