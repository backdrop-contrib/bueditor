// $Id$

//Autocomplete user defined phrases as they are typed in the editor.
//Requires: none
BUE.preprocess.autocomplete = function(E, $) {

  //tag completer for html & bbcode
  var tagComplete = function(E, prefix) {
    var cursor = E.posSelection().start, content = E.getContent();
    if (content.substr(cursor - 1, 1) == '/') return;
    var mate = ({'>': '<', ']': '['})[prefix];
    var i = content.substr(0, cursor).lastIndexOf(mate);
    if (i < 0) return;
    var re = new RegExp('^([a-z][a-z0-9]*)[^\\'+ prefix +']*$');
    var match = content.substring(i + 1, cursor).match(re);
    match && E.replaceSelection(mate +'/'+ match[1] + prefix, 'start');
  };

  E.AC = {'<!--': '-->', '<?php': '?>', '>': tagComplete, ']': tagComplete};
  
  //make sure string preparation runs last as other processes may extend autocomplete list.
  if (!E.index) BUE.postprocess.autocomplete = function(E, $) {
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
  };

  $(E.textArea).keypress(function(e) {
    var code = e.charCode === undefined ? e.keyCode : e.charCode;
    //disable keycodes that have multi-meaning in opera. 39: hypen-right, 40: parenthesis-down.
    //extend 37:percentage-left, 38:ampersand-up, 33:exclamation-pageup, 34:double quote-pagedown...
    if ($.browser.opera && (code+'').search(/^(39|40)$/) != -1) return;
    var handler, suffix, chr = String.fromCharCode(code), prefix = chr;
    if (!(handler = E.AC[chr])) return;
    if (!handler.lookback) {
      suffix = handler;
    }
    else {
      var pos = E.posSelection(), content = E.getContent();
      for (var lb in handler.lookback) {
        if (content.substring(pos.start - lb.length, pos.start) == lb) {
          prefix = lb + prefix;
          suffix = handler.lookback[lb];
          break;
        }
      }
      if (suffix === undefined && handler.ins) {
        suffix = handler.ins
      }
    }
    if ($.isFunction(suffix)) {
      return suffix(E, prefix);
    }
    typeof suffix == 'string' && E.replaceSelection(suffix, 'start');
  });
 
};


//Extend or alter autocomplete list in your own postprocess:
//E.AC['PREFIX'] = 'SUFFIX';
//E.AC['PREFIX'] = HANDLER = function(E, PREFIX){...};