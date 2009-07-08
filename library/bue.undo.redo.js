// $Id$

//Introduce editor history for cross-browsers undo/redo. 
BUE.postprocess.push(function(E) {

  var H = E.history = {
    max: 50, //maximum number of states in undo/redo history
    keys: {'13': 1, '32': 1}, //the key codes(not char codes) triggering state saving. (13:enter, 32:space)
    period: 2000, //minimum time needed to pass before saving successively triggered states.
    states: [], //stores the states
    current: -1, //index of the latest activated/stored state
    writable: true //dynamic allowance of state saving.
  };

  //allow write permission
  H.allow = function(){H.writable = true};

  //save textarea state.
  H.save = function(bypass) {
    //chek write perm
    if (!bypass && !H.writable) {
      return;
    }
    H.writable = false;
    setTimeout(H.allow, H.period);
    //delete redo-states if any.
    while(H.states[H.current + 1]) {
      H.states.pop();
    }
    var V = E.getContent(), len = H.states.length;
    if (len && V == H.states[len-1].value) {
      return;
    }
    if (len == H.max) {
      H.states.shift();
      len--;
    }
    H.states[(H.current = len)] = {value: V, cursor: E.posSelection()};
  };
  
  //restore a state relative to the current state.
  H.go = function(i) {
    if (i && i < 0 && H.current == H.states.length - 1) {
      H.save(true);
    }
    var state, index = H.current + (i || 0);
    if (state = H.states[index]) {
      E.textArea.value = state.value;//not using setContent() since it triggers state saving.
      E.makeSelection(state.cursor.start, state.cursor.end);
      H.current = index;
    }
  };
  
  //attach textarea events triggering history operations.
  $(E.textArea).one('focus', H.save).keyup(function(e) {
    if (H.writable && H.keys[e.keyCode]) {
      H.save();
    }
  });
  
  //save history on setContent.
  H._setContent = E.setContent;
  E.setContent = function(content) {
    H.save();
    return H._setContent(content);
  };

  //undo/redo for the editor.
  E.undo = function() {H.go(-1)};
  E.redo = function() {H.go(1)};
  
});

//EXTEND OR HACK in your own postprocess.
//Change settings:
//E.history.max = YOUR_MAXIMUM_NUMBER_OF_UNDO_STATES;
//E.history.keys['YOUR_KEYCODE_TRIGGERING_STATE_SAVE'] = 1;
//E.history.period = YOUR_MIN_TIME_IN_MILISECONDS_TO_PASS_BEFORE_SAVING_THE_NEXT_STATE;
