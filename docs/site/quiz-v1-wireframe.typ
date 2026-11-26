// Quiz v1: low-fidelity screen sketches (two screens per page).
#set page(width: 30cm, height: 19cm, margin: 1cm)
#set text(size: 11pt, fill: black)

#let outline(body, height: auto, fill: white) = block(
  width: 100%, height: height, inset: 10pt,
  stroke: 1pt + black, fill: fill, body,
)
#let card(body, height: 1.7cm) = outline(height: height)[#body]
#let answer(body, fill: white, ink: black) = outline(height: 1.2cm, fill: fill)[
  #text(fill: ink)[#body]
]
#let screen(body, height: 15.4cm) = outline(height: height, fill: white)[#body]
#let page-title(number, label) = [
  *Quiz v1 wireframe* #h(1fr) #number / #label
  #v(0.35cm)
]

#page-title("01", "Choose and configure")
#grid(
  columns: (1fr, 1fr), gutter: 0.8cm,
  screen[
    #grid(columns: (1fr, auto, 1fr), [], [*HOME*], align(right)[Settings →])
    #v(0.5cm)
    Choose a category
    #v(0.4cm)
    #grid(
      columns: (1fr, 1fr), gutter: 0.35cm,
      card(height: 2cm)[General Knowledge],
      card(height: 2cm)[Music],
      card(height: 2cm)[Geography],
      card(height: 2cm)[Film],
      card(height: 2cm)[Sports],
      card(height: 2cm)[Computers],
    )
    #v(0.6cm)
    Select a card to start 10 questions.
  ],
  screen[
    #grid(columns: (1fr, auto, 1fr), [← Back], [*SETTINGS*], [])
    #v(0.6cm)
    *Time per question* (required)
    #v(0.25cm)
    Choose one duration:
    #v(0.35cm)
    #grid(
      columns: (1fr, 1fr, 1fr), gutter: 0.3cm,
      card[○ 3 sec], card[○ 5 sec], card[○ 7 sec],
      card[○ 10 sec], card[● 15 sec], card[○ 20 sec],
    )
    #v(0.5cm)
    Default: 15 sec. Your choice applies to each question.
  ],
)

#pagebreak()
#page-title("02", "Play and finish")
#grid(
  columns: (1fr, 1fr), gutter: 0.8cm,
  screen(height: 14.5cm)[
    #grid(columns: (1fr, auto, 1fr), [← Back · cancel run], [*QUIZ*], [])
    #v(0.45cm)
    Geography #h(1fr) Question 3 / 10 #h(1fr) Timer stopped
    #v(0.4cm)
    #outline(height: 2.1cm)[*Question* \ Which ocean is the largest?]
    #v(0.35cm)
    #answer(fill: rgb("#eeeeee"), ink: rgb("#777777"))[○ Atlantic Ocean]
    #v(0.18cm)
    #answer(fill: rgb("#eeeeee"), ink: rgb("#777777"))[○ Indian Ocean]
    #v(0.18cm)
    #answer(fill: rgb("#bce8c0"))[● Pacific Ocean ✓]
    #v(0.18cm)
    #answer(fill: rgb("#eeeeee"), ink: rgb("#777777"))[○ Arctic Ocean]
    #v(0.3cm)
    #card(height: 1.1cm)[Next →]
  ],
  screen(height: 14.5cm)[
    #align(center)[*RESULTS*]
    #v(1.5cm)
    #align(center)[
      Quiz complete
      #v(0.8cm)
      #text(size: 28pt, weight: "bold")[7 / 10]
      #v(0.25cm)
      correct answers
    ]
    #v(1.5cm)
    #card(height: 1.3cm)[Play Again · same category]
    #v(0.3cm)
    #card(height: 1.3cm)[Home]
  ],
)
#v(0.2cm)
#text(size: 9pt)[*State annotations (not UI copy):* Quiz shows correct selection (green). Wrong selection: chosen option red, correct option green. Timeout: no selection, correct option green. All other options disabled after resolution; Next follows resolution.]
