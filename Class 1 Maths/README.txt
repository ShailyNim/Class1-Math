CLASS 1 MATHS
=============

TO PLAY
  Double-click  index.html
  It opens in your browser. Nothing to install, no terminal, works offline.
  (Chrome, Edge or Firefox. On Safari see the note at the bottom.)


WHAT IS IN THIS FOLDER
  index.html       The app. This is the one you open.
  curriculum.js    All 171 skills, in teaching order, with what depends on what.
  generators.js    Builds every question fresh. Nothing repeats word for word.
  engine.js        Works out what the child knows and what to ask next.
  app.js           The screens.
  styles.css       Colours and layout.
  progress.json    A copy of the record (see below).
  curriculum.json  The curriculum in plain data form, if you want to read it.


HOW PROGRESS IS REMEMBERED
  It saves by itself, in this browser, on this computer, at the end of every
  session. Close the laptop, come back next week, it picks up where it was.
  The child never has to do anything.

  A browser cannot write a file into its own folder without being asked -- every
  browser forbids it. So the automatic save lives in the browser's own storage.
  To get a real file you can see, back up, or carry to another computer:

      press and hold the small dot in the bottom-right corner for 2 seconds
      -> Progress file -> Save progress file

  That downloads progress.json. Move it into this folder, over the one already
  here. To restore it later, or to move to a new computer, use "Load a progress
  file" on the same screen.

  Worth doing once a month. Clearing your browsing data erases the automatic
  save, and the file is the only way back.


THE GROWN-UP VIEW
  Press and hold the dot in the bottom-right corner for 2 seconds.
  The child cannot reach it by tapping around.

  Overview     what is mastered, what is in progress, what needs going back to,
               and where the wrong answers cluster.
  Skill map    the whole tree. All 171 skills as dots, in teaching order, 23
               sections. Green = mastered, orange = started, white = ready to
               try, faded = still waiting on earlier skills, blue ring = the one
               coming up next. "Show me where we are" jumps straight to it.
               Tap any dot for that skill's name, confidence, and what it needs
               first. A green dot with a dashed red edge is one that has faded
               and is due a refresh.
  Progress file  save, load, or erase.

  The percentage is not a test score. It is how confident the model is that the
  skill is understood. A skill counts as mastered at 90% confidence AND four
  correct answers at the harder difficulty levels, so guessing cannot get there.
  Confidence fades slowly over months without practice, which is what puts a
  skill back on the review list.


HOW THE QUESTIONS WORK
  Every skill can be asked at four or five levels of difficulty. The same skill
  starts as "point at the right picture" and ends as "write the missing number
  in the sentence". The app moves up after two right in a row and eases off
  after two wrong, so it finds the edge of what the child can do rather than
  grinding away at what they already know.


SAFARI
  Safari blocks browser storage for files opened directly from a folder. If the
  grown-up view says storage is blocked, use Chrome, Edge or Firefox -- or save
  the progress file at the end of each session and load it at the start of the
  next.
