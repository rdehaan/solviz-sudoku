// This file is released under the MIT license.
// See LICENSE.md.

lit_to_atom = {};
model_found = false;

var log = "";
var logElement = document.getElementById('log');
var decisions = Array();

function get_atom_from_lit(lit) {
  if (lit > 0) {
    atom = lit_to_atom[lit];
  }
  else {
    atom = "-" + lit_to_atom[-lit];
  }
  return atom;
}

function interface_register_watch(lit, atom) {
  lit_to_atom[lit] = atom;
  console.log("Interface: registered watch " + atom + " (" + lit + ")");
}
function interface_propagate(lit) {
  if (!need_to_update_graphics()) {
    return;
  }
  atom = get_atom_from_lit(lit);
  index = decisions.findIndex(elem => (elem.type == "decision") && (elem.lit == -lit));
  if (index > -1) {
    decisions.length = index;
    write_decisions_to_log();
  }
  console.log("Interface: propagate " + lit + " " + atom);
  atom_obj = parse_sudoku_atom(atom);
  if (atom_obj != null && atom_obj.positive) {
    sudoku_set_cell_value(atom_obj.i, atom_obj.j, atom_obj.val);
  } else if (atom_obj != null && !atom_obj.positive) {
    sudoku_remove_candidate(atom_obj.i, atom_obj.j, atom_obj.val);
  }
  sudoku_render_board();
}
function interface_undo(lit) {
  if (!need_to_update_graphics()) {
    return;
  }
  var atom = get_atom_from_lit(lit);
  var index = decisions.findIndex(elem => (elem.type == "decision") && (elem.lit == lit));
  if (index > -1) {
    decisions.length = index;
    write_decisions_to_log();
  }
  console.log("Interface: undo " + lit + " " + atom);
  var atom_obj = parse_sudoku_atom(atom);
  if (atom_obj != null && atom_obj.positive) {
    sudoku_set_cell_value(atom_obj.i, atom_obj.j, null);
  } else if (atom_obj != null && !atom_obj.positive) {
    sudoku_add_candidate(atom_obj.i, atom_obj.j, atom_obj.val);
  }
  sudoku_render_board();
}
function interface_decide(lit) {
  atom = get_atom_from_lit(lit);
  decision_obj = {
    type: "decision",
    lit: lit,
  }
  decisions.push(decision_obj);
  write_decisions_to_log();
  console.log("Interface: decide " + lit + " " + atom);
}
function interface_check(model) {
  atoms = Array();
  for (let index = 0; index < model.length; ++index) {
    atom = get_atom_from_lit(model[index]);
    if (atom != null) {
      atom_obj = parse_sudoku_atom(atom);
      if (atom_obj != null && atom_obj.positive) {
        sudoku_set_cell_value(atom_obj.i, atom_obj.j, atom_obj.val);
      }
      atoms.push(atom);
    }
  }
  sudoku_render_board();
  model_found = true;
  console.log("Interface: check " + atoms);
  updateOutput();
  if (need_to_update_graphics() && document.getElementById("pause-on-model").checked) {
    do_pause();
  }
}
function interface_on_model() {
  console.log("Interface: on_model");
}
// function interface_on_unsat() {
//   console.log("Interface: on_unsat");
// }
// function interface_on_finish() {
//   console.log("Interface: on_finish");
// }
function interface_before_start() {
  console.log("Interface: before start");
  sudoku_initialize_candidates();
  sudoku_render_board();
  hidden_program = "";
  for (var i=0; i < board_size; i++) {
    for (var j=0; j < board_size; j++) {
      val = sudoku_get_cell_value(i,j);
      if (val != null) {
        hidden_program += "solution("+(i+1)+","+(j+1)+","+val+").\n"
      }
    }
  }
  decisions = Array();
  write_decisions_to_log();
  model_found = false;
}
function watched_predicates() {
  return "solution";
}
function interface_start() {
  console.log("Interface: start");
  document.getElementById("run").disabled = true;
  document.getElementById("pause").disabled = false;
  board_blocked = true;
  do_resume();
}
function interface_finish() {
  console.log("Interface: finish");
  document.getElementById("run").disabled = false;
  document.getElementById("pause").disabled = true;
  document.getElementById("resume").disabled = true;
  board_blocked = false;
  updateOutput();
  speed_factor = document.getElementById("speed").value;
  setTimeout(function() {
    updateOutput();
  }, speed_factor*500);
  setTimeout(function() {
    updateOutput();
  }, speed_factor*1000);
}
function interface_wait_time_propagate() {
  if (!need_to_update_graphics()) {
    return 0;
  }
  speed_factor = document.getElementById("speed").value;
  return speed_factor*1000;
}
function interface_wait_time_undo() {
  if (!need_to_update_graphics()) {
    return 0;
  }
  speed_factor = document.getElementById("speed").value;
  return speed_factor*1000;
}
function interface_wait_time_check() {
  if (!need_to_update_graphics()) {
    return 0;
  }
  speed_factor = document.getElementById("speed").value;
  return speed_factor*2000;
}
function interface_wait_time_on_model() {
  if (!need_to_update_graphics()) {
    return 0;
  }
  speed_factor = document.getElementById("speed").value;
  return speed_factor*0;
}
function interface_wait_time_decide() {
  if (!need_to_update_graphics()) {
    return 0;
  }
  speed_factor = document.getElementById("speed").value;
  return speed_factor*500;
}
function parse_sudoku_atom(atom) {
  parts = atom.split(/,|\(|\)/)
  if (atom.startsWith("solution(")) {
    i = parseInt(parts[1]);
    j = parseInt(parts[2]);
    v = parseInt(parts[3]);
    return {
      i: i-1,
      j: j-1,
      val: v,
      positive: true,
    }
  } else if (atom.startsWith("-solution(")) {
    i = parseInt(parts[1]);
    j = parseInt(parts[2]);
    v = parseInt(parts[3]);
    return {
      i: i-1,
      j: j-1,
      val: v,
      positive: false,
    }
  } else {
    return null;
  }
}
function load_sudoku() {
  if (!board_blocked) {
    sudoku_initialize_board();
    sudoku_input = document.getElementById("sudoku-input").value;
    sudoku_load_from_string(sudoku_input);
    sudoku_render_board();
  }
}
function clear_sudoku() {
  if (!board_blocked) {
    sudoku_initialize_board();
    sudoku_render_board();
  }
}
function load_example_sudoku() {
  if (!board_blocked) {
    sudoku_initialize_board();
    sudoku_as_string = document.getElementById("example-sudokus").value;
    sudoku_load_from_string(sudoku_as_string);
    sudoku_render_board();
  }
}

Module.can_resume = true;
function do_pause() {
  document.getElementById("pause").disabled = true;
  document.getElementById("resume").disabled = false;
  Module.can_resume = false;
}
function do_resume() {
  document.getElementById("pause").disabled = false;
  document.getElementById("resume").disabled = true;
  Module.can_resume = true;
}

function clearLog() {
  log = "";
  updateLog();
}

function addToLog(text) {
  log = text + "\n" + log;
  updateLog();
}

function updateLog() {
  if (logElement) {
    logElement.textContent = log;
    // logElement.scrollTop = logElement.scrollHeight; // focus on bottom
  }
}

function decision_to_text(atom) {
  atom_obj = parse_sudoku_atom(atom);
  if (atom_obj != null) {
    if (atom_obj.positive) {
      return "- Branched by putting value " + atom_obj.val + " in cell R" + (atom_obj.i+1) + "C" + (atom_obj.j+1);
    } else {
      return "- Branched by ruling out value " + atom_obj.val + " for cell R" + (atom_obj.i+1) + "C" + (atom_obj.j+1);
    }
  }
}

function write_decisions_to_log() {
  if (!need_to_update_graphics()) {
    return;
  }
  log = "";
  if (decisions.length == 0) {
    log = "(None..)";
  }
  for (let index = 0; index < decisions.length; ++index) {
    decision = decisions[index];
    if (decision.type == "decision") {
      log = decision_to_text(get_atom_from_lit(decision.lit)) + "..\n" + log;
    }
  }
  updateLog();
}

function need_to_update_graphics() {
  var index = document.getElementById("mode").selectedIndex;
  if (index == 0 && model_found == true) {
    return false;
  }
  return true;
}

clearLog();
write_decisions_to_log();

sudoku_initialize_board();
sudoku_render_board();
board_blocked = false;
load_example_from_path("examples/simple1.lp");
