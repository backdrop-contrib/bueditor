// $Id$

//Register button accesskeys as Ctrl shortcuts.
BUE.postprocess.push(function(E, $) {

  //store key-button relations.
  E.ctrlKeys = {};

  //get button keys
  $.each(E.buttons, function(i, B) {
    if (k = E.tpl.buttons[B.bid][3]) {
      E.ctrlKeys[k.toUpperCase().charCodeAt(0)] = B;
    }
  });

  //register ctrl shortcuts for the editor.
  $(E.textArea).keydown(function(e) {
    if (e.ctrlKey && !e.shiftKey && !e.originalEvent.altKey && E.ctrlKeys[e.keyCode]) {
      E.ctrlKeys[e.keyCode].click();
      return false;
    }
  });

});


//Extend or alter shortcuts in your own postprocess:
//E.ctrlKeys['YOUR_KEY_CODE'] = {click: YOUR_CALLBACK};