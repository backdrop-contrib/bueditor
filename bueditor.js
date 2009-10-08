// $Id$
(function($) {

var BUE = window.BUE = window.BUE || {preset: {}, templates: {}, instances: [], postprocess: []};

//Get editor settings from Drupal.settings and process preset textareas.
BUE.behavior = function(context) {
  var set = Drupal.settings.BUE || null, tpls = BUE.templates, pset = BUE.preset;
  if (set) {
    $.each(set.templates, function (id, tpl) {
      tpls[id] = tpls[id] || $.extend({}, tpl);
    });
    $.extend(pset, set.preset);
    set.templates = {};
    set.preset = {};
  }
  $.each(pset, function (tid, tplid) {
    BUE.processTextarea($('#'+ tid, context).get(0), tplid);
  });
  //fix enter key on autocomplete fields triggering button click.
  $('input.form-autocomplete', context).keydown(function(e) {return e.keyCode != 13});
};

//integrate editor template into textarea T
BUE.processTextarea = function (T, tplid) {
  if (!T || !BUE.templates[tplid] || !(T = $(T).filter('textarea')[0])) return false;
  //check visibility on the element-level only.
  if (T.style.display == 'none' || T.style.visibility == 'hidden') return false;
  if (T.bue) return T.bue;
  var E = new BUE.instance(T, tplid);
  !BUE.active || BUE.active.textArea.disabled ? E.activate() : E.accesskeys(false);
  //post process. this kind of loop does not miss processes added by processes.
  for (var F, i = 0; F = BUE.postprocess[i]; i++) {
    $.isFunction(F) && F(E, $, i);
  }
  return E;
};

//create an editor instance
BUE.instance = function (T, tplid) {
  var i = BUE.instances.length, E = T.bue = BUE.instances[i] = this;
  E.index = i;
  E.textArea = T;
  E.tplid = tplid;
  E.tpl = BUE.templates[tplid];
  E.bindex = null;
  E.safeToPreview = T.value.indexOf('<') == -1;
  E.UI = BUE.$html(BUE.theme(tplid).replace(/\%n/g, i)).insertBefore(T);
  E.buttons = $('.bue-button', E.UI).each(function(i, B) {
    var arr = B.id.split('-');
    $($.extend(B, {eindex: arr[1], bid: arr[3], bindex: i})).click(function(){return BUE.buttonClick(B.eindex, B.bindex)});
  }).get();
  $(T).focus(function() {!T.bue.dialog.esp && T.bue.activate()});
};

//execute button's click event
BUE.buttonClick = function (eindex, bindex) { try {
  var E = BUE.instances[eindex].activate();
  var domB = E.buttons[bindex];
  var tplB = E.tpl.buttons[domB.bid];
  var content = tplB[1];
  E.bindex = bindex;
  E.dialog.close();
  if (tplB[4]) {//execute button script.
    tplB[4](E);
  }
  else if (content) {//or insert content
    var arr = content.split('%TEXT%');
    if (arr.length == 2) E.tagSelection(arr[0], arr[1]);
    else E.replaceSelection(arr.length == 1 ? content : arr.join(E.getSelection()), 'end');
  }
  !(domB.pops || $(domB).is('.stay-clicked')) && E.focus();
  } catch (e) {alert(e.name +': '+ e.message);}
  return false;
};

//return html for editor templates.
BUE.theme = function (tplid) {
  var tpl = BUE.templates[tplid] || {html: ''}, html = '';
  if (typeof tpl.html == 'string') return tpl.html;
  //B(0-title, 1-content, 2-icon or caption, 3-accesskey) and 4-function for js buttons
  for (var B, i = 0; B = tpl.buttons[i]; i++) {
    var img = B[2].search(/\.(png|gif|jpg)$/i) != -1 ? ((new Image()).src = tpl.iconpath +'/'+ B[2]) : null;
    B[4] = B[1].substr(0, 3) == 'js:' ? new Function('E', B[1].substr(3)) : null;//set functions for js buttons
    if (B[0].substr(0, 4) == 'tpl:') {//theme button.
      html += B[4] ? B[4]() : B[1];
      html += B[2] ? ('<span class="separator">'+ (img ? '<img src="'+ img +'" />' : B[2]) +'</span>') : '';
    }
    else {//functional button
      var attr = img ? ['image', 'image', 'src="'+ img +'" alt="'+ B[2] +'"'] : ['button', 'text', 'value="'+ B[2] +'"'];
      html += '<input id="bue-%n-button-'+ i +'" title="'+ B[0] +'" accesskey="'+ B[3] +'" type="'+ attr[0] +'" class="bue-button bue-'+ attr[1] +'-button editor-'+ attr[1] +'-button" '+ attr[2] +' tabindex="-1" />';
    }
  }
  return tpl.html = '<div class="bue-ui editor-container clear-block" id="bue-ui-%n">'+ html +'</div>';
};

//Cross browser selection handling. 0-1=All, 2=IE, 3=Opera
BUE.mode = (window.getSelection || document.getSelection) ? ($.browser.opera ? 3 : 1) : (document.selection && document.selection.createRange ? 2 : 0 );

//New line standardization. At least make them represented by a single char.
BUE.text = BUE.processText = BUE.mode < 2 ? function (s) {return s.toString()} : function (s) {return s.toString().replace(/\r\n/g, '\n')};

//Create selection in a textarea
BUE.selMake = BUE.mode == 2 ? function (T, start, end) {
  range = T.createTextRange();
  range.collapse();
  range.moveEnd('character', end);
  range.moveStart('character', start);
  range.select();
} :
BUE.mode == 3 ? function (T, start, end) {
  var text = BUE.text(T.value), i = text.substring(0, start).split('\n').length, j = text.substring(start, end).split('\n').length;
  T.setSelectionRange(start + i -1 , end + i + j - 2);
} :
function (T, start, end) {
  T.setSelectionRange(start, end);
};

//Return the selection coordinates in a textarea
BUE.selPos = BUE.mode == 2 ? function (T) {
  T.focus();
  var i, val = BUE.text(T.value), mark = '~`^'; //dummy text.
  for (i = 0; val.indexOf(mark) != -1; i++) mark += mark.charAt(i); //make sure mark is unique.
  var mlen = mark.length, range = document.selection.createRange();
  var bm = range.getBookmark(), slen = BUE.text(range.text).length;
  range.text = mark;
  var tmp = BUE.text(T.value), start = tmp.indexOf(mark);
  for (i = 0; tmp.charAt(start+i+mlen) == '\n'; i++);
  for (var end = start+slen; val.charAt(end) == '\n'; end++);
  end -= i;
  T.value = val;
  if (start == end && !val.charAt(end)) range.collapse(false);//bookmark has problems with a cursor at the end
  else range.moveToBookmark(bm);
  range.select();
  return {'start': start, 'end': end};
} :
BUE.mode == 3 ? function (T) {
  var start = T.selectionStart || 0, end = T.selectionEnd || 0;
  var i = T.value.substring(0, start).split('\r\n').length, j = T.value.substring(start, end).split('\r\n').length;
  return {'start': start - i + 1, 'end': end - i - j + 2};
} :
function (T) {
  return {start: T.selectionStart || 0, end: T.selectionEnd || 0}
};

//html 2 jquery. way faster than $(html)
BUE.$html = function(s){return $(document.createElement('div')).html(s).children()};
//not to break old button scripts.
window.editor = window.editor || BUE;
//initiate bueditor
$(document).ready(function () {
  (Drupal.behaviors.BUE = BUE.behavior)(document);//set drupal behavior.
});

})(jQuery);

//Bueditor instance methods
(function(E) {

//focus on editor textarea.
E.focus = function () {
  this.textArea.focus();
  return this;
};

//return textarea content
E.getContent = function () {
  return BUE.text(this.textArea.value);
};

//set textarea content
E.setContent = function (content) {
  var T = this.textArea, st = T.scrollTop;
  T.value = content;
  T.scrollTop = st;
  return this;
};

//return selected text
E.getSelection = function () {
  var pos = this.posSelection();
  return this.getContent().substring(pos.start, pos.end);
};

//replace selected text
E.replaceSelection = function (txt, cursor) {
  var E = this, pos = E.posSelection(), content = E.getContent(), txt = BUE.text(txt);
  var end = cursor == 'start' ? pos.start : pos.start+txt.length, start = cursor == 'end' ? end : pos.start;
  E.setContent(content.substr(0, pos.start) + txt + content.substr(pos.end));
  return E.makeSelection(start, end);
};

//wrap selected text.
E.tagSelection = function (left, right, cursor) {
  var E = this, pos = E.posSelection(), content = E.getContent();
  var left = BUE.text(left), right = BUE.text(right), llen = left.length;
  var end = cursor == 'start' ? pos.start+llen : pos.end+llen, start = cursor == 'end' ? end : pos.start+llen;
  E.setContent(content.substr(0, pos.start) + left + content.substring(pos.start, pos.end) + right + content.substr(pos.end));
  return E.makeSelection(start, end);
};

//make a new selection
E.makeSelection = function (start, end) {
  var E = this;
  if (end < start) end = start;
  BUE.selMake(E.textArea, start, end);
  if (E.dialog.esp) E.dialog.esp = {'start': start, 'end': end};
  return E;
};

//return selection coordinates.
E.posSelection = function () {
  return this.dialog.esp || BUE.selPos(this.textArea);
};

//enable/disable editor buttons
E.buttonsDisabled = function (state, bindex) {
  for (var B, i=0; B = this.buttons[i]; i++) {
    B.disabled = i == bindex ? !state : state;
  }
  return this;
};

//enable/disable button accesskeys
E.accesskeys = function (state) {
  for (var B, i=0; B = this.buttons[i]; i++) {
    B.accessKey = state ? this.tpl.buttons[B.bid][3] : '';
  }
  return this;
};

//activate editor and make it BUE.active
E.activate = function() {
  var E = this, A = BUE.active || null;
  if (E == A) return E;
  A && A.accesskeys(false) && E.accesskeys(true);
  return BUE.active = E;
};

//reserve dialog and quickpop
var pop = E.dialog = E.quickPop = BUE.dialog = BUE.quickPop = {};
pop.open = pop.close = function(){};

})(BUE.instance.prototype);
