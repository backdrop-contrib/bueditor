// $Id$

//Introduces editor popups: E.dialog & E.quickPop
//Requires: none
(function(E, $) {

BUE.popups = BUE.popups || {};

//default template for editor popups or dialogs. Use table wrapper against various positioning bugs in IE.
BUE.popHtml = '<table class="bue-popup" style="display: none;"><tbody class="bue-zero"><tr class="bue-zero"><td class="bue-zero"><div class="bue-popup-head clear-block"><div class="bue-popup-title"></div><div class="bue-popup-close">x</div></div><div class="bue-popup-body clear-block"><div class="bue-popup-content"></div></div></td></tr></tbody></table>';

//open popup.
BUE.openPopup = function (id, title, content, effect) {
  return BUE.createPopup(id).open(title, content, effect);
};

//create popup
BUE.createPopup = function (id, title, content) {
  if (BUE.popups[id]) {
    return BUE.popups[id];
  }
  var P = BUE.popups[id] = $html(BUE.popHtml).appendTo('body').attr('id', id).find('.bue-popup-title').html(title || '').end().find('.bue-popup-content').html(content || '').end().get(0);
  //open
  P.open = function (title, content, effect) {
    var E = P.bue = BUE.active, pos = $(E.buttons[E.bindex]).offset();
    $(P).css({left: pos.left - 20, top: pos.top + 10});
    if (typeof title != 'undefined' && title != null) {
      $('.bue-popup-title', P).html(title);
    }
    if (typeof content != 'undefined' && content != null) {
      $('.bue-popup-content', P).html(content);
    }
    $(P)[effect || 'show']();
    return P;
  };
  //close
  P.close = function (effect) {return $(P)[effect || 'hide']()[0]};
  $('.bue-popup-close', P).click(function() {P.close()});
  //drag
  $('.bue-popup-head', P).mousedown(function (e) {
    var X = e.pageX, Y = e.pageY, pos = {X: parseInt($(P).css('left')), Y: parseInt($(P).css('top'))};
    var drag =  function(e) {$(P).css({left: pos.X + e.pageX - X, top: pos.Y + e.pageY - Y});return false;};
    var undrag = function(e) {$(document).unbind('mousemove', drag).unbind('mouseup', undrag)};
    $(document).mousemove(drag).mouseup(undrag);
  });
  return P;
};

//initialize editor dialog & quickPop.
BUE.postprocess.unshift(function (Ed, $) {
  if (Ed.index) return;
  var D = E.dialog = BUE.dialog = BUE.createPopup('bue-dialog');
  var foc  = function () {this.blur()};
  var Do = D.open, Dc = D.close;
  D.open = function (title, content, effect) {
    D.esp && D.close();
    var E = BUE.active;
    E.buttonsDisabled(true);
    $(E.buttons[E.bindex]).addClass('stay-clicked');
    D.esp = E.posSelection();
    $(E.textArea).focus(foc);
    return Do(title, content, effect);
  };
  D.close = function (effect) {
    if (!D.esp) return D;
    var E = D.bue;
    $(E.textArea).unbind('focus', foc);
    E.buttonsDisabled(false);
    $(E.buttons[E.bindex]).removeClass('stay-clicked');
    E == BUE.active && E.makeSelection(D.esp.start, D.esp.end).focus();
    D.esp = null;
    return Dc(effect);
  };
  var Q = E.quickPop = BUE.quickPop = BUE.createPopup('bue-quick-pop');
  var Qo = Q.open, Qc = Q.close;
  Q.open = function(content, effect) {
    $(document).mouseup(Q.close);
    return Qo(null, content, effect);
  };
  Q.close = function() {
    $(document).unbind('mouseup', Q.close);
    return Qc();
  };
  $('.bue-popup-head', Q).hide();
});

//shortcuts
var $html = BUE.$html;

})(BUE.instance.prototype, jQuery);