/*===============================================================================================================================*\
\-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-/
 \.-   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -./

                                ,--.   ,--,--.     ,--.       ,--. ,--.   ,--,--,------. ,--.
                                 \  `v'  /`--',---.|  |,---.,-'  '-|   `v'   |  |  .-.  \|  |
                                  \     / ,--| .-. |  | .=./'-.  .-|  |`.'|  |  |  |  \  |  |
                                   \   /  |  | '-' |  |  `--. |  | |  |   |  |  |  '--'  |  |
                                    `-'   `--'`---'`--'`----' `--' `--'   `--`--`-------'`--'
                                          '~-. VioletMIDI v0.2.0 © 2022 Humza Khan .-~'

 /'-   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -'\
/-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-\
\*===============================================================================================================================*/

/*
  
  TODO

  - add ui icons
  - implement button groups
  - implement edit history (undo/redo)

  - CLEAN UP CODE :D

  ...

  - partially generalize MIDI editor behavior
  - implement tracks
  
*/

let Violet = {};

/*===============================================================================================================================*\
 -~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-
  *** MISC/HELPER FUNCTIONS ***
 -~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-
\*===============================================================================================================================*/

function noteArrayEncode(arr) {
  let str = "";
  for (const i in arr) {
    str += `,${arr[i].pos}/${arr[i].pitch}/${arr[i].length}`
  }
  str = str.substr(1, str.length - 1);
  return str;
}

function noteArrayDecode(str) {
  let arr = [];
  if (str != "") {
    let sub1 = str.split(",");
    for (const i in sub1) {
      let sub2 = sub1[i].split("/");
      arr.push(new Violet.Note(Number(sub2[0]), Number(sub2[1]), Number(sub2[2])));
    }
  }
  return arr;
}

function secondsToBlips(seconds, bpm) {
  let beatsPerSec = bpm/60;
  let blipsPerSec = beatsPerSec * 16;
  return seconds * blipsPerSec;
}

// 64 blips = 1 measure in 4/4 time
// (so 1 blip = 64th note; 16 blips = quarter note)

/*===============================================================================================================================*\
 -~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-
  *** MUSICAL CLASSES ***
 -~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-
\*===============================================================================================================================*/

Violet.Project = class {
  constructor(bpm, length) { // pos, length in measures
    this.bpm = bpm;
    this.length = length;
    this.timeSignature = [4,4];
    this.tracks = [];
  }
}

Violet.Track = class {
  constructor() {
    this.regions = [];
  }
}

Violet.Region = class {
  constructor(pos, length) { // pos, length in blips
    this.pos = pos;
    this.length = length;
    //this.loop = 1;
    this.notes = [];
  }

  insertNote(pos, pitch, length) {
    let newNote = new Violet.Note(pos, pitch, length);
    this.notes.push(newNote);
    return newNote;
  }

  deleteNote(note) {
    for (const i in this.notes) {
      if (note === this.notes[i]) {
        this.notes.splice(i,1);
      }
    }
  }
}

Violet.Note = class {
  constructor(pos, pitch, length) { // pitch in MIDI (0-127, middle C = 60); pos, length in blips
    // characteristic properties
    this.pos = pos;
    this.pitch = pitch;
    this.length = length;

    // internal variables used by the program
    this.sysPriorPos = pos;
    this.sysPriorPitch = pitch;
    this.sysPriorLength = length;
  }

  setEndpoint(endpoint) {
    this.length = endpoint - this.pos;
  }
}

Violet.View = class {
  constructor(offsetX, offsetY, unitWidth, unitHeight) {
    this.offsetX = offsetX;
    this.offsetY = offsetY;
    this.unitWidth = unitWidth;
    this.unitHeight = unitHeight;
  }

  copy() {
    return new Violet.View(this.offsetX, this.offsetY, this.unitWidth, this.unitHeight);
  }

  debugString() {
    return `X: ${this.offsetX}\nY: ${this.offsetY}\nW: ${this.unitWidth}\nH: ${this.unitHeight}`;
  }
}

/*===============================================================================================================================*\
 -~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-
  @instrument
  *** INSTRUMENT CLASS ***
  The Violet.Instrument class handles playback by providing an interface from Violet MIDI data to Tone.js sound output
 -~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-
\*===============================================================================================================================*/

Violet.Instrument = class {
  constructor() {
    this.filter = new Tone.Filter(4500, "lowpass", -12).toDestination();
    this.synth = new Tone.PolySynth(Tone.Synth).connect(this.filter);
    this.synth.options.oscillator.type = "sawtooth";
    this.synth.options.envelope.attack = 0.01;
    this.synth.options.envelope.sustain = 0.5;
    this.synth.options.envelope.decay = 2.0;
    this.synth.options.envelope.release = 0.25;
    this.synth.options.volume=-18;

    // delet this
    Tone.Transport.bpm.value = 180;
  }

  playNote(pitch, pos, length) {
    let tonePitch = Tone.Midi(pitch).toFrequency();
    let tonePos = Tone.now() + (pos * Tone.Time("64n").toSeconds());
    let toneLength = length * Tone.Time("64n").toSeconds();
    this.synth.triggerAttack(tonePitch, tonePos);
    this.synth.triggerRelease(tonePitch, tonePos+toneLength);
  }

  playScheduledNote(pitch, time, length) {
    let tonePitch = Tone.Midi(pitch).toFrequency();
    let toneLength = length * Tone.Time("64n").toSeconds();
    this.synth.triggerAttack(tonePitch, time);
    this.synth.triggerRelease(tonePitch, time+toneLength);
  }
};

/*===============================================================================================================================*\
 -~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-
  @renderer
  *** RENDERER OBJECT ***
  The Violet.Renderer object contains all of the canvas drawing methods.
 -~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-
\*===============================================================================================================================*/

Violet.Renderer = {};

Violet.Renderer.clear = function() {
  c.fillStyle = Violet.App.colors.bg.replace("$", Violet.App.favColor);
  c.fillRect(0, 0, Violet.App.canvasWidth, Violet.App.canvasHeight);
}

// GUI DRAW FUNCTIONS

Violet.Renderer.drawGUIMenu = function(view) {
  let gradient = c.createLinearGradient(view.x, view.y, view.x, view.y + view.h);
  gradient.addColorStop(0, "#101010");
  gradient.addColorStop(0.5, "#242424");
  gradient.addColorStop(1, "#101010");
  c.fillStyle = gradient;
  c.fillRect(view.x, view.y, view.w, view.h);
}

Violet.Renderer.drawGUIButton = function(view, button) {
  // button
  let startX = button.convertPos(view).x;
  let startY = button.convertPos(view).y;
  let width = button.convertPos(view).w;
  let height = button.convertPos(view).h;
  let gradient = c.createLinearGradient(startX, startY, startX, startY + height);
  gradient.addColorStop(0, button.colors.fill1.replace("$", Violet.App.favColor));
  gradient.addColorStop(0.48, button.colors.fill2.replace("$", Violet.App.favColor));
  gradient.addColorStop(0.52, button.colors.fill3.replace("$", Violet.App.favColor));
  gradient.addColorStop(1, button.colors.fill4.replace("$", Violet.App.favColor));
  c.fillStyle = gradient;
  c.strokeStyle = button.colors.outline.replace("$", Violet.App.favColor);
  c.lineWidth = 2;
  c.fillRect(startX, startY, width, height);
  c.strokeRect(startX, startY, width, height);
  // label
  let fontSize = height/3;
  c.font = `bold ${fontSize}px '${Violet.App.font}'`;
  c.textBaseline = "top";
  c.textAlign = "center";
  c.fillStyle = "#ffffffc0";
  let labelHeight = c.measureText(button.label).actualBoundingBoxDescent;
  c.fillText(button.label, startX + width/2, startY + (height-labelHeight)/2);
}

Violet.Renderer.drawGUIPressedButton = function(view, button) {
  let startX = button.convertPos(view).x;
  let startY = button.convertPos(view).y;
  let width = button.convertPos(view).w;
  let height = button.convertPos(view).h;
  c.fillStyle = "#00000080";
  c.strokeStyle = "#ffffff80";
  c.lineWidth = 3;
  c.fillRect(startX, startY, width, height);
  c.strokeRect(startX, startY, width, height);
}

// EDITOR DRAW FUNCTIONS

Violet.Renderer.drawMIDIBackdrop = function(region, view, timeSignature) {
  // draw key backrop
  let startX = -view.offsetX + Violet.App.sidebarWidth;
  let startY = view.offsetY;
  c.lineWidth = 1;
  c.strokeStyle = "#00000060";
  for (let i=0; i<=127; i++) {
    // key colors
    c.fillStyle = ((Violet.App.KEYCOLORS[i%12]) ? ("#303030") : ("#404040"));
    c.fillRect(startX, startY - (i+1)*view.unitHeight, region.length*view.unitWidth, view.unitHeight);
    // key outlines
    c.beginPath();
    c.moveTo(startX, startY - i*view.unitHeight);
    c.lineTo(startX + region.length*view.unitWidth, startY - i*view.unitHeight);
    c.stroke();
  }

  // draw barlines
  let beatLength = 64 / timeSignature[1];
  let measureLength = beatLength * timeSignature[0];
  let currentX = startX;
  for (let i=0; i<=region.length-1; i++) {
    let drawBarline = true;
    if (i%measureLength == 0) {
      c.strokeStyle = "#ffffff80";
    } else if (i%beatLength == 0) {
      c.strokeStyle = "#000000a0";
    } else if (i%4 == 0) {
      c.strokeStyle = "#00000020";
    } else {
      drawBarline = false;
    }
    if (drawBarline) {
      c.beginPath();
      c.moveTo(currentX, startY);
      c.lineTo(currentX, startY - 128*view.unitHeight);
      c.stroke();
    }
    currentX += view.unitWidth;
  }
}

Violet.Renderer.drawTimeline = function(length, view, timeSignature, playbackLoop, playbackLoopStart, playbackLoopEnd) {
  // draw timeline bars
  let startX = -view.offsetX + Violet.App.sidebarWidth;
  let h = Violet.App.timelineHeight;
  let gradient = c.createLinearGradient(0, h*0.5, 0, h);
  gradient.addColorStop(0, "#303030");
  gradient.addColorStop(1, "#242424");
  c.fillStyle = gradient;
  c.fillRect(startX, h*0.5, length * view.unitWidth, h*0.5);
  c.fillStyle = "#202020";
  c.fillRect(startX, 0, length * view.unitWidth, h*0.5);
  c.lineWidth = 2;
  c.strokeStyle = "#00000080";
  c.beginPath();
  c.moveTo(startX, h*0.5);
  c.lineTo(startX + length*view.unitWidth, h*0.5);
  c.stroke();

  // draw playback loop indicator
  c.strokeStyle = ((playbackLoop) ? ("#ffffffc0") : ("#ffffff80"));
  c.fillStyle = "#00000000";
  if (playbackLoop) {
    gradient = c.createLinearGradient(0, 0, 0, h*0.5);
    gradient.addColorStop(0, Violet.App.colors.loopIndicator.fill1.replace("$",Violet.App.favColor));
    gradient.addColorStop(1, Violet.App.colors.loopIndicator.fill2.replace("$",Violet.App.favColor));
    c.fillStyle = gradient;
  }
  c.fillRect(startX + playbackLoopStart*view.unitWidth, 0, (playbackLoopEnd - playbackLoopStart)*view.unitWidth, h*0.5);
  c.strokeRect(startX + playbackLoopStart*view.unitWidth, 0, (playbackLoopEnd - playbackLoopStart)*view.unitWidth, h*0.5);
  
  // segment measures
  let beatLength = 64 / timeSignature[1];
  let measureLength = beatLength * timeSignature[0];
  let currentX = startX;
  for (let i=0; i<=length-1; i++) {
    let drawBarline = true;
    if (i%measureLength == 0) {
      // measure barlines
      c.strokeStyle = "#ffffff80";
      c.beginPath();
      c.moveTo(currentX, 0);
      c.lineTo(currentX, h);
      c.stroke();
      // measure numbers
      c.font = `bold ${h/3}px '${Violet.App.font}'`;
      c.textBaseline = "top";
      c.textAlign = "left";
      c.fillStyle = "#ffffffc0";
      c.fillText(String(Math.floor(i/measureLength)), currentX+4, 4);
    } else if (i%beatLength == 0) {
      // beat barlines
      c.strokeStyle = "#ffffff40";
      c.beginPath();
      c.moveTo(currentX, h*0.75);
      c.lineTo(currentX, h);
      c.stroke();
    }
    currentX += view.unitWidth;
  }
}

Violet.Renderer.drawNotes = function(notes, view, colors) {
  if (notes.length == 0) {return;}
  let outline = colors.outline.replace("$", Violet.App.favColor);
  let fill1 = colors.fill1.replace("$", Violet.App.favColor);
  let fill2 = colors.fill2.replace("$", Violet.App.favColor);
  let startX = -view.offsetX + Violet.App.sidebarWidth;
  let startY = view.offsetY;

  c.strokeStyle = outline;
  for (const i in notes) {
    let currentNoteX = startX + notes[i].pos*view.unitWidth;
    let currentNoteLength = notes[i].length*view.unitWidth
    let currentNoteY = startY - (notes[i].pitch+1)*view.unitHeight;
    let gradient = c.createLinearGradient(currentNoteX, currentNoteY, currentNoteX, currentNoteY + view.unitHeight);
    gradient.addColorStop(0, fill1);
    gradient.addColorStop(1, fill2);
    c.fillStyle = gradient;
    c.fillRect(currentNoteX, currentNoteY, currentNoteLength, view.unitHeight);
    c.strokeRect(currentNoteX, currentNoteY, currentNoteLength, view.unitHeight);
    c.strokeRect(currentNoteX, currentNoteY, currentNoteLength, view.unitHeight);
  }
}

Violet.Renderer.drawPianoSidebar = function(view, hoveredPitch) {
  let startY = view.offsetY;
  c.lineWidth = 1;
  c.strokeStyle = "#000000ff";
  c.font = `bold ${view.unitHeight-2}px '${Violet.App.font}'`;
  c.textBaseline = "top";
  c.textAlign = "left";
  for (i=0; i<=127; i++) {
    let currentY = startY - (i+1)*view.unitHeight;
    // key colors
    let keyGradient = c.createLinearGradient(0, currentY, 0, currentY + view.unitHeight);
    if (Violet.App.KEYCOLORS[i%12]) {
      if (i != hoveredPitch) {
        keyGradient.addColorStop(0, "#404040");
        keyGradient.addColorStop(1, "#000000");
      } else {
        keyGradient.addColorStop(0, `hsl(${Violet.App.favColor},100%,40%)`);
        keyGradient.addColorStop(1, `hsl(${Violet.App.favColor},100%,10%)`);
      }
    } else {
      if (i != hoveredPitch) {
        keyGradient.addColorStop(0, "#ffffff");
        keyGradient.addColorStop(1, "#c0c0c0");
      } else {
        keyGradient.addColorStop(0, `hsl(${Violet.App.favColor},100%,80%)`);
        keyGradient.addColorStop(1, `hsl(${Violet.App.favColor},100%,67%)`);
      }
    }
    c.fillStyle = keyGradient;
    c.fillRect(0, currentY, Violet.App.sidebarWidth, view.unitHeight);
    c.strokeRect(0, currentY, Violet.App.sidebarWidth, view.unitHeight);
    // C key labels
    if (i%12 == 0) {
      let labelStr = "C" + String(Math.floor(i/12));
      let labelWidth = c.measureText(labelStr).width;
      let labelOffsetY = (view.unitHeight - c.measureText(labelStr).actualBoundingBoxDescent)/2;
      c.fillStyle = "#000000c0";
      c.fillText(labelStr, Violet.App.sidebarWidth - labelWidth - 2, currentY + labelOffsetY);
    }
  }
  let currentY = startY - (128)*view.unitHeight - Violet.App.timelineHeight;
  c.fillStyle = "#202020"
  c.fillRect(0, currentY, Violet.App.sidebarWidth, Violet.App.timelineHeight);
  c.strokeRect(0, currentY, Violet.App.sidebarWidth, Violet.App.timelineHeight);
}

Violet.Renderer.drawSelectBox = function(x1, y1, x2, y2) {
  c.fillStyle = "#ffffff40";
  c.lineWidth = 1;
  c.strokeStyle = "#ffffff80";
  c.fillRect(x1, y1, x2-x1, y2-y1);
}

Violet.Renderer.drawPlayhead = function(view, playheadPos) {
  let playheadX = Violet.App.sidebarWidth + playheadPos*view.unitWidth - view.offsetX;
  c.lineWidth = 1;
  c.fillStyle = "#ffffff80"
  c.fillRect(playheadX-2,Violet.App.timelineHeight*0.5,4,Violet.App.canvasHeight-Violet.App.timelineHeight*0.5);
}

/*===============================================================================================================================*\
 -~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-
  @app
  *** APP OBJECT ***
  The Violet.App object contains app constants and user preferences. It also handles the highest-level program logic, which
  involves passing control to either the Editor or the GUI, depending on what the user is interacting with.
 -~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-
\*===============================================================================================================================*/

Violet.App = {
  audioContextStarted: false,
  desktop: true,
  // app constants
  KEYCOLORS: [false, true, false, true, false, false, true, false, true, false, true, false],
  NOTE_BLIP: 1,
  NOTE_16: 4,
  NOTE_8: 8,
  NOTE_Q: 16,
  NOTE_H: 32,
  NOTE_W: 64,
  // dimensions
  canvasWidth: 0,
  canvasHeight: 0,
  sidebarWidth: 96,
  timelineHeight: 48,
  landscape: true,
  //
  editing: true, // true if interacting with editor, false if interacting with GUI
  mousedown: false,
  //
  font: "Tahoma",
  favColor: 265,
  colors: {
    bg: "#303030",
    loopIndicator: {
      fill1: "hsl($,100%,45%)",
      fill2: "hsl($,100%,25%)"
    },
    note: {
      outline: "hsl($,100%,25%)",
      fill1: "hsl($,100%,75%)",
      fill2: "hsl($,100%,50%)"
    },
    noteSelected: {
      outline: "hsl($,100%,50%)",
      fill1: "hsl($,100%,100%)",
      fill2: "hsl($,100%,75%)"
    },
    noteHandle: {
      outline: "hsl($,100%,100%)",
      fill1: "hsl($,100%,50%)",
      fill2: "hsl($,100%,100%)"
    },
    buttonColored: {
      outline: "hsl($,50%,30%)",
      fill1: "hsl($,50%,45%)",
      fill2: "hsl($,50%,40%)",
      fill3: "hsl($,50%,35%)",
      fill4: "hsl($,50%,33%)"
    },
    buttonGray: {
      outline: "hsl($,0%,15%)",
      fill1: "hsl($,0%,30%)",
      fill2: "hsl($,0%,25%)",
      fill3: "hsl($,0%,23%)",
      fill4: "hsl($,0%,20%)"
    },
    buttonSelected: {
      outline: "hsl($,100%,50%)",
      fill1: "hsl($,100%,70%)",
      fill2: "hsl($,100%,65%)",
      fill3: "hsl($,100%,63%)",
      fill4: "hsl($,100%,60%)"
    }
  },
  //
  resize: function(width, height, stretchView) {
    if (stretchView) {
      Violet.Editor.viewport.unitWidth *= width/this.canvasWidth;
      Violet.Editor.viewport.offsetX *= width/this.canvasWidth;
      Violet.Editor.viewport.unitHeight *= height/this.canvasHeight;
      Violet.Editor.viewport.offsetY *= height/this.canvasHeight;
    }
    this.canvasWidth = width;
    this.canvasHeight = height;
    if (width > height) {
      this.landscape = true;
      this.sidebarWidth = 0.08 * width;
      this.timelineHeight = 0.1 * height;
      Violet.GUI.view = {
        x: 0.75 * width,
        y: 0,
        w: 0.25 * width,
        h: height
      };
    } else {
      this.landscape = false;
      this.sidebarWidth = 0.1 * width;
      this.timelineHeight = 0.08 * height;
      Violet.GUI.view = {
        x: 0,
        y: 0.75 * height,
        w: width,
        h: 0.25 * height
      };
    }

    this.DOMCanvas.setAttribute("width", this.canvasWidth);
    this.DOMCanvas.setAttribute("height", this.canvasHeight);

    Violet.App.render();
  },
  changeOrientation: function() {
    this.resize(this.canvasHeight,this.canvasWidth);
  },
  render: function() {
    Violet.Editor.draw();
    Violet.GUI.draw();
  },

  // APP EVENT FUNCTIONS

  eventFrame: function(touchX, touchY) {
    Violet.Editor.eventFrame();
  },
  eventMouseDown: function(touchX, touchY) {
    // if (this.mousedown == true) ...?
    this.mousedown = true;
    if (
      (touchX >= Violet.GUI.view.x) &&
      (touchX <= Violet.GUI.view.x + Violet.GUI.view.w) &&
      (touchY >= Violet.GUI.view.y) &&
      (touchY <= Violet.GUI.view.y + Violet.GUI.view.h)
    ) {
      // user is interacting with the GUI
      this.editing = false;
      Violet.GUI.eventPress(touchX, touchY);
    } else {
      // user is interacting with the editor
      this.editing = true;
      Violet.Editor.eventMouseDown(touchX, touchY);
    }
  },
  eventMouseUp: function(touchX, touchY) {
    if (this.mousedown) {
      Violet.Editor.eventMouseUp(touchX, touchY);
      Violet.GUI.eventRelease(touchX, touchY);
      this.mousedown = false;
    }
  },
  eventMouseMove: function(touchX, touchY) {
    if (this.mousedown) {
      if (!this.editing) {
        Violet.GUI.eventPress(touchX, touchY);
      } else {
        Violet.Editor.eventMouseMove(touchX, touchY);
      }
    }
  }
};

/*===============================================================================================================================*\
 -~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-
  @gui
  *** GUI OBJECT ***
  The Violet.GUI object handles the user interface. Features a custom-written engine for dynamic, scaleable Canvas UI.
 -~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-
\*===============================================================================================================================*/

Violet.GUI = {
  view: {
    x: 0,
    y: 0,
    w: 0,
    h: 0
  },
  currentTab: "editorRegionDefault",
  Button: class {
    constructor(label, tab, x, y, w, h, colors, clickEvent) {
      this.x = x;
      this.y = y;
      this.w = w;
      this.h = h;
      this.label = label;
      this.tab = tab;
      this.clickEvent = ((clickEvent instanceof Function) ? (clickEvent) : (null));
      this.clicked = false;
      this.colors = colors;
    }
    convertPos(view) {
      if (Violet.App.landscape) {
        return {
          x: view.x + view.w*this.x,
          y: view.y + view.h*this.y,
          w: view.w*this.w,
          h: view.h*this.h
        };
      } else {
        return {
          x: view.x + view.w*this.y,
          y: view.y + view.h*this.x,
          w: view.w*this.h,
          h: view.h*this.w
        };
      }
    }
  },
  buttons: new Map(),
  addButton: function(id, label, tab, x, y, w, h, colors, clickEvent) {
    this.buttons.set(id, new Violet.GUI.Button(label, tab, x, y, w, h, colors, clickEvent));
  },
  draw: function() {
    Violet.Renderer.drawGUIMenu(this.view);
    let pressedButton = null;
    for (const i of this.buttons) {
      if (i[1].tab == this.currentTab) {
        Violet.Renderer.drawGUIButton(this.view, i[1]);
        if (i[1].clicked) {
          pressedButton = i[1];
        }
      }
    }
    if (pressedButton != null) {
      Violet.Renderer.drawGUIPressedButton(this.view, pressedButton);
    }
  },

  // AUXILIARY GUI FUNCTIONS

  aux: {
    setEditMode: function(mode) {
      Violet.GUI.currentTab = "editorRegionDefault";
      Violet.Editor.editMode = mode;
      let modeButtons = [
        Violet.GUI.buttons.get("modeScroll"),
        Violet.GUI.buttons.get("modeZoom"),
        Violet.GUI.buttons.get("modePlace"),
        Violet.GUI.buttons.get("modeResize"),
        Violet.GUI.buttons.get("modeDelete"),
        Violet.GUI.buttons.get("modeSelect"),
        Violet.GUI.buttons.get("modePaste"),
        Violet.GUI.buttons.get("modeLoop")
      ];
      for (const i in modeButtons) {
        if (i == mode) {
          modeButtons[i].colors = Violet.App.colors.buttonSelected;
        } else {
          modeButtons[i].colors = Violet.App.colors.buttonGray;
        }
      }
      if ((mode == 0) || (mode == 1)) {
        Violet.GUI.buttons.get("modeTools").colors = Violet.App.colors.buttonGray;
      } else {
        Violet.GUI.buttons.get("modeTools").colors = Violet.App.colors.buttonSelected;
        Violet.GUI.buttons.get("modeTools").label = `Edit [${modeButtons[mode].label}]`;
      }
      Violet.App.render();
    }
  },

  // GUI EVENT FUNCTIONS

  eventPress: function(touchX, touchY) {
    for (const i of this.buttons) {
      if (
        (touchX >= i[1].convertPos(this.view).x) &&
        (touchX <= i[1].convertPos(this.view).x + i[1].convertPos(this.view).w) &&
        (touchY >= i[1].convertPos(this.view).y) &&
        (touchY <= i[1].convertPos(this.view).y + i[1].convertPos(this.view).h) &&
        (this.currentTab == i[1].tab)
      ) {
        i[1].clicked = true;
      } else {
        i[1].clicked = false;
      }
    }
    Violet.App.render();
  },
  eventRelease: function(touchX, touchY) {
    for (const i of this.buttons) {
      if (i[1].clicked) {
        if (i[1].clickEvent != null) {
          i[1].clickEvent();
        }
        i[1].clicked = false;
      }
    }
    Violet.App.render();
  }
};

// editorRegionDefault
Violet.GUI.addButton("modeTools", "Tools", "editorRegionDefault",   0.10, 0.05, 0.80, 0.11, Violet.App.colors.buttonGray, function() {
  Violet.GUI.currentTab = "editorRegionTools";
});

Violet.GUI.addButton("modeScroll", "Scroll", "editorRegionDefault", 0.10, 0.16, 0.80, 0.11, Violet.App.colors.buttonGray, function() {
  Violet.GUI.aux.setEditMode(0);
});

Violet.GUI.addButton("modeZoom", "Zoom", "editorRegionDefault",     0.10, 0.27, 0.80, 0.11, Violet.App.colors.buttonGray, function() {
  Violet.GUI.aux.setEditMode(1);
});

Violet.GUI.addButton("copy", "Copy", "editorRegionDefault",         0.10, 0.40, 0.40, 0.11, Violet.App.colors.buttonColored, function() {
  Violet.Editor.clipboardCopy();
});

Violet.GUI.addButton("deselect", "Deselect", "editorRegionDefault", 0.50, 0.40, 0.40, 0.11, Violet.App.colors.buttonColored, function() {
  Violet.Editor.selection = [];
});

Violet.GUI.addButton("undo", "Undo", "editorRegionDefault",         0.10, 0.53, 0.40, 0.11, Violet.App.colors.buttonColored);

Violet.GUI.addButton("redo", "Redo", "editorRegionDefault",         0.50, 0.53, 0.40, 0.11, Violet.App.colors.buttonColored);

Violet.GUI.addButton("play", "Play", "editorRegionDefault",         0.10, 0.66, 0.50, 0.11, Violet.App.colors.buttonColored, function() {
  Violet.Editor.regionPlayback();
});

Violet.GUI.addButton("loopToggle", "Loop", "editorRegionDefault",   0.60, 0.66, 0.30, 0.11, Violet.App.colors.buttonSelected, function() {
  Violet.Editor.playbackLoop = !Violet.Editor.playbackLoop;
  Violet.GUI.buttons.get("loopToggle").colors = ((Violet.Editor.playbackLoop) ? (Violet.App.colors.buttonSelected) : (Violet.App.colors.buttonGray));
});

// editorRegionTools
Violet.GUI.addButton("modePlace", "Place", "editorRegionTools",       0.10, 0.05, 0.80, 0.13, Violet.App.colors.buttonGray, function() {
  Violet.GUI.aux.setEditMode(2);
});

Violet.GUI.addButton("modeResize", "Resize", "editorRegionTools",   0.10, 0.18, 0.80, 0.13, Violet.App.colors.buttonGray, function() {
  Violet.GUI.aux.setEditMode(3);
});

Violet.GUI.addButton("modeDelete", "Delete", "editorRegionTools",   0.10, 0.31, 0.80, 0.13, Violet.App.colors.buttonGray, function() {
  Violet.GUI.aux.setEditMode(4);
});

Violet.GUI.addButton("modeSelect", "Select", "editorRegionTools",   0.10, 0.44, 0.80, 0.13, Violet.App.colors.buttonGray, function() {
  Violet.GUI.aux.setEditMode(5);
});

Violet.GUI.addButton("modePaste", "Paste", "editorRegionTools",     0.10, 0.57, 0.80, 0.13, Violet.App.colors.buttonGray, function() {
  Violet.GUI.aux.setEditMode(6);
});

Violet.GUI.addButton("modeLoop", "Set Loop", "editorRegionTools",   0.10, 0.82, 0.80, 0.13, Violet.App.colors.buttonGray, function() {
  Violet.GUI.aux.setEditMode(7);
});

/*===============================================================================================================================*\
 -~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-
  @editor
  *** EDITOR OBJECT ***
  The Violet.Editor object handles the MIDI piano roll editor.
 -~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-
\*===============================================================================================================================*/

Violet.Editor = {
  // (should reference external properties)
  bpm: 120,
  timeSignature: [4,4],
  instrument: {},

  // mouse properties
  mousedown: false,
  opStartX: 0,
  opStartY: 0,
  opEndX: 0,
  opEndY: 0,
  opStartPos: 0,
  opStartPitch: 0,
  opEndPos: 0,
  opEndPitch: 0,
  priorViewport: {},
  priorHoveredPitch: 0,
  clickedTimeline: false,
  clickedSidebar: false,

  regionView: true, // true for region view, false for track view
  playback: false,
  playbackLoop: true,
  playbackLoopStart: 0,
  playbackLoopEnd: 512,
  playhead: 0,
  playbackBPM: 0,
  viewport: {},
  region: {},
  selectedNote: {},
  hoveredPitch: -1,
  selection: [],
  selecting: false,
  plurality: 0, // 0: none, 1: single note, 2: selection of notes
  clipboard: "",
  newNoteLength: Violet.App.NOTE_Q,
  gridSnap: Violet.App.NOTE_8,
  editMode: 0,
  /*
    editMode values
    0: scroll
    1: zoom
    2: create/move notes
    3: resize notes
    4: delete notes
    5: select notes
    6: paste
    7: set loop
  */

  // constrain viewport within bounds
  validateViewport: function() {
    let maxY = (128*this.viewport.unitHeight)+Violet.App.timelineHeight;
    let minY = Violet.App.canvasHeight;
    if (this.viewport.offsetY < minY) {
      this.viewport.offsetY = minY;
    }
    if (this.viewport.offsetY > maxY) {
      this.viewport.offsetY = maxY;
    }
    if (this.viewport.offsetX < 0) {
      this.viewport.offsetX = 0;
    }
  },

  // convert canvas coords to note position & pitch (with relation to zoom & scroll)
  localXToPos: function(x) {
    return Math.round((x-Violet.App.sidebarWidth+this.viewport.offsetX)/this.viewport.unitWidth);
  },
  localYToPitch: function(y,roundDown) {
    if (!roundDown) {
      return -Math.round((y-this.viewport.offsetY)/this.viewport.unitHeight);
    } else {
      return -Math.ceil((y-this.viewport.offsetY)/this.viewport.unitHeight);
    }
  },

  // returns n rounded to the nearest gridSnap
  snap: function(n) {
    return Math.round(n/this.gridSnap)*this.gridSnap;
  },

  // find note at canvas coords
  findNote: function(x,y) {
    let targetPos = this.localXToPos(x);
    let targetPitch = this.localYToPitch(y, true);
    let targetNote = undefined;
    for (const i in this.region.notes) {
      if (this.region.notes[i].pitch == targetPitch) {
        if ((this.region.notes[i].pos <= targetPos) && (targetPos <= this.region.notes[i].pos + this.region.notes[i].length)) {
          targetNote = this.region.notes[i];
        }
      }
    }
    return targetNote;
  },

  // returns true if a note is within the specified canvas coords
  noteInRect: function(x1,y1,x2,y2,note) {
    // ensure x1,y1 is top left corner of selection and x2,y2 is bottom right
    let temp;
    if (x1 > x2) {
      temp = x2;
      x2 = x1;
      x1 = temp;
    }
    if (y1 > y2) {
      temp = y2;
      y2 = y1;
      y1 = temp;
    }

    // calculate top left (x1,y1) & bottom right (x2,y2) corners of note
    let noteX1 = -this.viewport.offsetX + Violet.App.sidebarWidth + note.pos*this.viewport.unitWidth;
    let noteX2 = noteX1 + note.length*this.viewport.unitWidth
    let noteY1 = this.viewport.offsetY - (note.pitch+1)*this.viewport.unitHeight;
    let noteY2 = noteY1 + this.viewport.unitHeight;

    return ((x1 < noteX2) && (x2 > noteX1) && (y1 < noteY2) && (y2 > noteY1));
  },

  // returns true if the specified note is currently in the selection
  isSelected: function(note) {
    for (const i in this.selection) {
      if (this.selection[i] == note) {
        return true;
      }
    }
    return false;
  },

  insertNote: function(pos, pitch, length) {
    let newNote = this.region.insertNote(pos, pitch, length);
    Violet.App.render();
    return newNote;
  },

  deleteNote: function(note) {
    this.region.deleteNote(note);
    Violet.App.render();
  },

  clipboardCopy: function() {
    this.clipboard = noteArrayEncode(this.selection);
  },

  movePlayhead: function(pos) {
    this.playback = false;
    this.playhead = pos;
    if (this.playhead < 0) {
      this.playhead = 0;
    }
    if (this.playhead > this.region.length) {
      this.playhead = this.region.length;
    }
  },

  // main draw function
  draw: function() {
    Violet.Renderer.clear();
    Violet.Renderer.drawMIDIBackdrop(this.region, this.viewport, this.timeSignature);
    Violet.Renderer.drawNotes(this.region.notes, this.viewport, Violet.App.colors.note);
    Violet.Renderer.drawNotes(this.selection, this.viewport, Violet.App.colors.noteSelected);
    if (this.selectedNote instanceof Violet.Note) {
      Violet.Renderer.drawNotes([this.selectedNote], this.viewport, Violet.App.colors.noteHandle);
    }
    Violet.Renderer.drawTimeline(this.region.length, this.viewport, this.timeSignature, this.playbackLoop, this.playbackLoopStart, this.playbackLoopEnd);
    Violet.Renderer.drawPlayhead(this.viewport,this.playhead);
    Violet.Renderer.drawPianoSidebar(this.viewport, this.hoveredPitch);
    if (Violet.Editor.selecting) {
      Violet.Renderer.drawSelectBox(this.opStartX, this.opStartY, this.opEndX, this.opEndY);
    }
  },

  // playback functions
  regionPlayback: function() {
    if (!this.playback) {
      if (this.region.notes.length > 0) {
        this.playback = true;
        this.playbackBPM = Tone.Transport.bpm.value;
        const osc = new Tone.Oscillator().toDestination();
        Tone.Transport.scheduleRepeat((time) => {
          // REGION SCANNER FUNCTION
          if (this.playback) {
            // scan notes
            for (const i in this.region.notes) {
              if (this.playhead == this.region.notes[i].pos) {
                this.instrument.playScheduledNote(this.region.notes[i].pitch, time, this.region.notes[i].length);
              }
            }
            this.playhead++;
            // conditions for terminating playback
            if (this.playbackLoop) {
              // if loop mode is on
              if (this.playhead >= this.playbackLoopEnd) {
                this.playhead = this.playbackLoopStart;
                if ((this.playbackLoopEnd-this.playbackLoopStart) <= 1) {
                  this.playback = false;
                }
              }
            } else {
              // if loop mode is off
              if (this.playhead >= this.region.length) {
                this.playhead = 0;
                this.playback = false;
              }
            }
            Violet.App.render();
          } else {
            Tone.Transport.cancel();
          }
        }, "64n");
        Tone.Transport.start();
      }
    } else {
      this.playback = false;
      Tone.Transport.cancel();
    }
  },

  // EDITOR EVENT FUNCTIONS

  eventFrame: function() {
    
  },

  eventMouseDown: function(touchX, touchY) {
    this.opStartX = touchX;
    this.opStartY = touchY;
    this.opEndX = touchX;
    this.opEndY = touchY;

    this.opStartPos = this.localXToPos(touchX);
    this.opStartPitch = this.localYToPitch(touchY, true);
    this.opEndPos = this.localXToPos(touchX);
    this.opEndPitch = this.localYToPitch(touchY, true);

    this.priorViewport = this.viewport.copy();

    if (this.opStartY <= Violet.App.timelineHeight) {
      this.clickedTimeline = true;
      this.movePlayhead(this.snap(this.opStartPos));
    } else {
      this.clickedTimeline = false;
    }

    if (!this.clickedTimeline) {
      // *** Prepare notes for operation
      let targetNote = this.findNote(this.opStartX, this.opStartY);
      if (targetNote == undefined) {
        // no note is being operated on
        this.plurality = 0;
      } else if ((this.editMode == 2) || (this.editMode == 3) || (this.editMode == 4) || (this.editMode == 5)) {
        // notes are being operated on
        this.selectedNote = targetNote;
        this.hoveredPitch = targetNote.pitch;
        this.selectedNote.sysPriorPos = this.selectedNote.pos;
        this.selectedNote.sysPriorPitch = this.selectedNote.pitch;
        this.selectedNote.sysPriorLength = this.selectedNote.length;
        if (this.isSelected(targetNote)) {
          // selection of notes is being operated on
          this.plurality = 2;
          for (const i in this.selection) {
            this.selection[i].sysPriorPos = this.selection[i].pos;
            this.selection[i].sysPriorPitch = this.selection[i].pitch;
            this.selection[i].sysPriorLength = this.selection[i].length;
          }
        } else {
          // single note is being operated on
          this.plurality = 1;
        }
      }

      // *** [editMode 2] Create note
      if (this.editMode == 2) {
        if (this.plurality == 0) {
          // place note
          this.selectedNote = this.insertNote(this.snap(this.opStartPos), this.opStartPitch, this.newNoteLength);
          this.plurality = 1;
        }
      }

      // play hovered note
      if ((this.editMode == 2) || (((this.editMode == 3) || (this.editMode == 5)) && (this.plurality != 0))) {
        this.instrument.playNote(this.selectedNote.pitch, 0, Violet.App.NOTE_16);
        this.hoveredPitch = this.selectedNote.pitch;
        this.priorHoveredPitch = this.selectedNote.pitch;
      }

      // *** [editMode 4] Delete note
      if (this.editMode == 4) {
        // single note
        if (this.plurality == 1) {
          this.deleteNote(targetNote);
        }
        // selection of notes
        else if (this.plurality == 2) {
          for (const i in this.selection) {
            this.deleteNote(this.selection[i]);
          }
          this.selectedNote = {};
          this.selection = [];
        }
      }

      // *** [editMode 5] Select note
      if (this.editMode == 5) {
        this.selecting = true;
        if ((!this.isSelected(targetNote)) && this.plurality == 1) {
          this.selection.push(targetNote);
        }
      }

      // *** [editMode 6] Paste clipboard
      if (this.editMode == 6) {
        if (this.clipboard != "") {
          // paste notes
          this.selection = [];
          let paste = noteArrayDecode(this.clipboard);
          let handle = paste[0];
          for (const i in paste) {
            this.region.notes.push(paste[i]);
            this.selection.push(paste[i]);
            // use the bottom-leftmost note as the "handle"
            if (paste[i].pos < handle.pos) {
              handle = paste[i];
            } else if (paste[i].pos == handle.pos) {
              if (paste[i].pitch < handle.pitch) {
                handle = paste[i];
              }
            }
          }
          this.selectedNote = handle;
          this.plurality = 2;
          // move entire paste based on position of handle
          let handleOriginPos = this.selectedNote.pos;
          let handleOriginPitch = this.selectedNote.pitch;
          this.selectedNote.sysPriorPos = this.opStartPos;
          this.selectedNote.sysPriorPitch = this.opStartPitch;
          for (const i in paste) {
            paste[i].sysPriorPos = this.opStartPos + (paste[i].pos - handleOriginPos);
            paste[i].sysPriorPitch = this.opStartPitch + (paste[i].pitch - handleOriginPitch);
          }
          this.eventMouseMove(touchX, touchY);
        }
      }
    
      // *** [editMode 7] Set loop startpoint
      if (this.editMode == 7) {
        this.playbackLoopStart = this.snap(this.opStartPos);
      }
    }
    Violet.App.render();
  },

  eventMouseUp: function(touchX, touchY) {

    // *** [editMode 7] Reverse loop points if oriented incorrectly
    if (this.editMode == 7) {
      if (this.playbackLoopStart > this.playbackLoopEnd) {
        let temp = this.playbackLoopStart;
        this.playbackLoopStart = this.playbackLoopEnd;
        this.playbackLoopEnd = temp;
      }
    }
    this.selecting = false;
    this.selectedNote = {};
    this.hoveredPitch = -1;
    Violet.App.render();
  },

  eventMouseMove: function(touchX, touchY) {
    this.opEndX = touchX;
    this.opEndY = touchY;
    this.opEndPos = this.localXToPos(touchX);
    this.opEndPitch = this.localYToPitch(touchY, true)

    let dx = this.opStartX - this.opEndX;
    let dy = -this.opStartY + this.opEndY;
    let dPos = this.opEndPos - this.opStartPos;
    let dPitch = this.opEndPitch - this.opStartPitch;
    if (!this.clickedTimeline) {
      // *** [editMode 0] Position scroll
      if (this.editMode == 0) {
        this.viewport.offsetX = this.priorViewport.offsetX + dx;
        this.viewport.offsetY = this.priorViewport.offsetY + dy;
        this.validateViewport();
      }

      // *** [editMode 1] Zoom scroll
      if (this.editMode == 1) {
        this.viewport.unitWidth = this.priorViewport.unitWidth - 0.05*dx;
        this.viewport.unitHeight = this.priorViewport.unitHeight - 0.1*dy;

        // normalize offset with vertical zoom
        if (this.viewport.unitHeight >= 4) {
          this.viewport.offsetY = (this.priorViewport.offsetY) * (this.viewport.unitHeight/this.priorViewport.unitHeight);
        }
        if (this.viewport.unitWidth >= 1)  {
          this.viewport.offsetX = this.priorViewport.offsetX * (this.viewport.unitWidth/this.priorViewport.unitWidth);
        }
        if (this.viewport.unitWidth < 1) {this.viewport.unitWidth = 1;}
        if (this.viewport.unitHeight < 4) {this.viewport.unitHeight = 4;}
        this.validateViewport();
      }

      // *** [editMode 2, 6] Moving selected notes, moving newly created/pasted notes
      if ((this.editMode == 2) || (this.editMode == 6)) {
        if (this.plurality != 0) {
          // move grabbed note
          this.selectedNote.pos = this.snap(this.selectedNote.sysPriorPos + dPos);
          this.selectedNote.pitch = this.selectedNote.sysPriorPitch + dPitch;
          let selectedNoteDifferencePos = this.selectedNote.pos - this.selectedNote.sysPriorPos;
          let selectedNoteDifferencePitch = this.selectedNote.pitch - this.selectedNote.sysPriorPitch;
          // move selected notes
          if (this.plurality == 2) {
            for (const i in this.selection) {
              if (this.selection[i] != this.selectedNote) {
                this.selection[i].pos = this.selection[i].sysPriorPos + selectedNoteDifferencePos;
                this.selection[i].pitch = this.selection[i].sysPriorPitch + selectedNoteDifferencePitch;
              }
            }
          }
          // play hovered note
          if (this.priorHoveredPitch != this.selectedNote.pitch) {
            this.instrument.playNote(this.selectedNote.pitch, 0, Violet.App.NOTE_16);
            this.hoveredPitch = this.selectedNote.pitch;
          }
          this.priorHoveredPitch = this.selectedNote.pitch;
        }
      }

      // *** [editMode 3] Resizing notes
      if (this.editMode == 3) {
        if (this.plurality != 0) {
          // resize grabbed note
          this.selectedNote.setEndpoint(this.snap(this.opEndPos));
          if (this.selectedNote.length < 1) {
            this.selectedNote.length = 1;
          }
          let selectedNoteDifferenceLength = this.selectedNote.length - this.selectedNote.sysPriorLength;
          // resize selected notes
          if (this.plurality == 2) {
            for (const i in this.selection) {
              if (this.selection[i] != this.selectedNote) {
                this.selection[i].length = this.selection[i].sysPriorLength + selectedNoteDifferenceLength;
                if (this.selection[i].length < 1) {
                  this.selection[i].length = 1;
                }
              }
            }
          }
        }
      }

      // *** [editMode 5] Selecting notes
      if (this.editMode == 5) {
        for (const i in this.region.notes) {
          if (
            (this.noteInRect(this.opStartX, this.opStartY, this.opEndX, this.opEndY, this.region.notes[i])) &&
            (!this.isSelected(this.region.notes[i]))
          ) {
            this.selection.push(this.region.notes[i]);
          }
        }
      }

      // *** [editMode 7] Set loop endpoint
      if (this.editMode == 7) {
        this.playbackLoopEnd = this.snap(this.opEndPos);
      }
    } else {
      this.movePlayhead(this.snap(this.opEndPos));
    }
    Violet.App.render();
  }
};

/*===============================================================================================================================*\
 -~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-
  @testing
  @init
  *** TESTING / INITIALIZATION ***
 -~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-
\*===============================================================================================================================*/

// initialize editor
Violet.Editor.instrument = new Violet.Instrument();
Violet.Editor.region = new Violet.Region(0, 512);
Violet.Editor.viewport = new Violet.View(0, 1174, 1.9, 13);

// test region (redbone - childish gambino)
//Violet.Editor.region.notes = noteArrayDecode('368/37/80,320/44/48,448/46/64,256/45/64,192/46/64,256/52/64,112/37/80,192/54/64,448/54/64,320/54/48,112/56/80,368/56/80,432/56/16,64/54/48,64/44/48,80/61/16,192/61/64,336/61/16,368/61/80,320/59/16,256/61/64,448/61/16,96/63/16,112/64/80,64/59/16,0/52/64,48/61/16,0/45/64,464/63/16,480/64/16,352/63/16,96/68/16,32/63/16,80/71/16,192/71/16,16/64/16,0/61/32,112/73/80,208/73/16,64/75/16,320/75/16,48/76/16,224/76/16,336/76/16,368/76/144,32/78/16,352/78/16,16/80/16,256/80/64,240/83/16,496/68/16');

Violet.App.DOMCanvas = document.getElementById("CanvasMain");
let c = Violet.App.DOMCanvas.getContext("2d");
Violet.GUI.aux.setEditMode(2);

// STARTUP

Violet.App.__beginResizeTest = function() {
  Violet.App.resize(window.innerWidth, window.innerHeight, false);
  window.onresize = function() {
    Violet.App.resize(window.innerWidth, window.innerHeight, true);
  };
  window.onresize();
}

Violet.App.initialize = async function(desktop) {
  await Tone.start();
  Violet.App.audioContextStarted = true;
  document.getElementById("intro").style.display = "none";
  Violet.App.DOMCanvas.style = "display: block;"
  Violet.App.desktop = desktop;
  // TOUCH DOWN
  if (Violet.App.desktop) {
    Violet.App.DOMCanvas.onmousedown = function(e) {
      if (Violet.App.audioContextStarted) {
        Violet.App.eventMouseDown(e.pageX, e.pageY);
      }
    }
  } else {
    Violet.App.DOMCanvas.ontouchstart = function(e) {
      if (Violet.App.audioContextStarted) {
        Violet.App.eventMouseDown(e.touches[0].clientX, e.touches[0].clientY);
      }
    }
  }
  // TOUCH UP
  if (Violet.App.desktop) {
    document.body.onmouseup = async function(e) {
      if (Violet.App.audioContextStarted) {
        Violet.App.eventMouseUp(e.pageX, e.pageY);
      }
      if (!Violet.App.audioContextStarted) {
        await Tone.start();
        Violet.App.audioContextStarted = true;
      }
    }
  } else {
    document.body.ontouchend = async function(e) {
      if (Violet.App.audioContextStarted) {
        Violet.App.eventMouseUp(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
      } else  {
        await Tone.start();
        Violet.App.audioContextStarted = true;
      }
    }
  }
  // TOUCH MOVE
  if (Violet.App.desktop) {
    document.body.onmousemove = function(e) {
      if (Violet.App.audioContextStarted) {
        Violet.App.eventMouseMove(e.pageX, e.pageY);
      }
    }
  } else {
    document.body.ontouchmove = function(e) {
      if (Violet.App.audioContextStarted) {
        Violet.App.eventMouseMove(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
      }
    }
  }
  Violet.App.__beginResizeTest();
}

document.getElementById("initMobile").addEventListener("click",function() {Violet.App.initialize(false)});
document.getElementById("initDesktop").addEventListener("click",function() {Violet.App.initialize(true)});

