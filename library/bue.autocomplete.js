// $Id$

//Autocomplete user defined phrases as they are typed in the editor.
BUE.postprocess.push(function(E, $) {

  E.AC = {'"':  '"', "'": "'", '(': ')', '[': ']', '{': '}', '<!--': '-->', '<?php': '?>'};
  
  //make sure string preparation runs last as other processes may extend autocomplete list.
  if (!E.index) BUE.postprocess.push(function(E){
    $.each(E.AC, function(a, b) {
      var len = a.length;
      if (len > 1) {
        var chr = a.charAt(len-1);
        if (typeof E.AC[chr] != 'object') {
          E.AC[chr] = {lookback: {}, ins: E.AC[chr] || false};
        }
        E.AC[chr].lookback[a.substr(0, len-1)] = b;
        delete E.AC[a];
      }
    });
  });

  $(E.textArea).keypress(function(e) {
    var code = typeof e.charCode == 'undefined' ? e.keyCode : e.charCode;
    //disable keycodes that have multi-meaning in opera. 39: hypen-right, 40: parenthesis-down.
    //extend 37:percentage-left, 38:ampersand-up, 33:exclamation-pageup, 34:double quote-pagedown...
    if ($.browser.opera && (code+'').search(/^(39|40)$/) != -1) return;
    var ac, chr = String.fromCharCode(code);
    if (!(ac = E.AC[chr])) return;
    if (!ac.lookback) return E.replaceSelection(ac, 'start');
    var pos = E.posSelection(), content = E.getContent();
    for (var lb in ac.lookback) {
      if (content.substring(pos.start - lb.length, pos.start) == lb) {
        return E.replaceSelection(ac.lookback[lb], 'start');
      }
    }
    if (ac.ins) {
      return E.replaceSelection(ac.ins, 'start');
    }
  });
 
});


//Extend or alter autocomplete list in your own postprocess:
//E.AC['YOUR_AC_TRIGGERING_STRING'] = 'YOUR_AUTO_ENTERED_STRING';