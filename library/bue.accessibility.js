// $Id$

//Accessibility improvements.
BUE.postprocess.push(function(E, $) {
  if (E.index) return;//run once
  //Close quickpop by pressing ESC or ENTER key.
  //Allow link focusing(ARROW KEYS) and triggering(ENTER) inside quickpop.
  var Q = E.quickPop, Qo = Q.open, D = E.dialog;
  Q.open = function(content, effect) {
    Qo(content, effect);
    setTimeout(function(){$(Q).find('a:first').focus()});
    return Q;
  };
  $(Q).attr('tabindex', 0).keydown(function (e) {
    switch (e.keyCode) {
      case 13:case 27: 
        setTimeout(function(){Q.close().bue.focus()});
        break;
      case 38:case 40:
        var $a = $('a', E.quickPop), i = $a.index(document.activeElement);
        $a.eq(i+e.keyCode-39).focus();
        return false;
    }
  });
  //Make dialogs close on ESC too.
  $(D).attr('tabindex', 0).keydown(function (e) {
    e.keyCode == 27 && D.close();
  });
});