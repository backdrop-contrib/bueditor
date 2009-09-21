// $Id$
//Find & Replace library. Requires default library.
(function(E) {

//shortcuts
var H = BUE.html, I = BUE.input, t = Drupal.t;

//confirmation message that will be used multiple times.
var CM = function() {
  return confirm(t('End of textarea reached. Continue search at the beginning of textarea?'));
};

//cookie get & set
var K = function (name, value) {
  if (typeof(value) == 'undefined') {//get
    return unescape((document.cookie.match(new RegExp('(^|;) *'+ name +'=([^;]*)(;|$)')) || ['', '', ''])[2]);
  }
  document.cookie = name +'='+ escape(value) +'; expires='+ (new Date(new Date()*1 + 30*86400000)).toGMTString() +'; path=/';//set
};

//return find&replace form
var FRF = function () {
  if (BUE.frForm) return BUE.frForm;
  var Dv = function(s) {return H('div', s, {style: 'margin-bottom: 4px'})};
  var Ta = function(n) {return H('span', H('textarea', K('bfr_'+ n), {name: n, cols: 36, rows: 1, 'class': 'resizable'}))};
  var Cb = function(n, v) {return H('span', I('checkbox', n, '', {checked: K('bfr_'+ n) || null}) + v)};
  var Bt = function(n, v) {return I('button', n, v, {onclick: 'BUE.active.frSubmit(this)'})};
  var F = Dv(Ta('fn')) + Dv(Ta('rp'));
  F += Dv(Cb('mc', t('Match case')) +' '+ Cb('re', t('Regular expressions')));
  F += Dv(Bt('fnb', t('Find next')) +' '+ Bt('rpb', t('Replace')) +' '+ Bt('rab', t('Replace all')));
  BUE.frPop = BUE.createPopup('bue-fr-pop', null, F = BUE.frForm = $(H('form', F))[0]);
  Drupal.behaviors.textarea(F);
  $('div.grippie', F).height(4);
  $(window).unload(function() {
    if (!BUE.frForm) return;
    var el = BUE.frForm.elements;
    K('bfr_fn', el.fn.value);
    K('bfr_rp', el.rp.value);
    K('bfr_mc', el.mc.checked ? 'checked' : '');
    K('bfr_re', el.re.checked ? 'checked' : '');
  });
  return F;
};

//scroll editor textarea to the specified character index. 
E.scrollTo = function(index) {
  var E = this, T = E.textArea, h = $(T).height();
  var sT = BUE.scrlT = BUE.scrlT || $(document.createElement('textarea')).css({width: $(T).width(), height: 1, visibility: 'hidden'}).appendTo(document.body)[0];
  sT.value = T.value.substr(0, index);
  T.scrollTop = sT.scrollHeight > h ? sT.scrollHeight - Math.ceil(h/2) : 0;
  return E;
};

//find a string inside editor content. search options: mc-match case, re-regular expression
E.find = function (str, mc, re) {
  var E = this, from = E.posSelection().end, content = E.getContent();
  if (from == content.length) from = 0;
  var content = content.substr(from);
  var regx = new RegExp(re ? str : BUE.regesc(str), mc ? '' : 'i');
  var index = content.search(regx);
  if (index == -1) {
    if (from == 0) {
      alert(t('No matching phrase found!'));
    }
    else if (CM()) {
      E.makeSelection(0, 0);
      E.find(str, mc, re);
    }
  }
  else {
    var strlen = re ? content.match(regx)[0].length : str.length;
    index += from;
    E.makeSelection(index, index+strlen).scrollTo(index);
  }
  return E;
};

//replace str1 with str2.
E.replace = function(str1, str2, mc, re) {
  var E = this, s = E.find(str1, mc, re).getSelection();
  var rgx = new RegExp('^'+ (re ? str1 : BUE.regesc(str1)) +'$', mc ? '' : 'i');
  if (s && s.search(rgx) == 0 && confirm(t('Replace this occurance of "!text"?', {'!text': s}))) {
    str2 = re ? s.replace(new RegExp(str1, 'g' + (mc ? '' : 'i')), str2) : str2;
    E.replaceSelection(str2);
  }
  return E;
};

//replace all occurrences of str1 with str2.
E.replaceAll = function(str1, str2, mc, re) {
  var E = this, P = E.posSelection(), C = E.getContent(), n = 0;
  var R = new RegExp(re ? str1 : BUE.regesc(str1), 'g' + (mc ? '' : 'i'));
  var F = re ?  (function(s) {n++; return s.replace(R, str2)}) : (function() {n++; return str2;});
  var start = P.start == 0 || CM() ? 0 : P.start;
  E.setContent(C.substr(0, start) + C.substr(start).replace(R, F));
  alert(t('Total replacements: !count', {'!count': n}));
  return E;
};

//open Find & Replace form.
E.frForm = function(op, mc, re) {
  var el = FRF().elements, rp = op == 'replace';
  BUE.frPop.open(t(rp ? 'Find & Replace' : 'Search'));
  $(el.mc.parentNode)[mc ? 'show' : 'hide']();
  $(el.re.parentNode)[re ? 'show' : 'hide']();
  $([el.rp.parentNode, el.rpb, el.rab])[rp ? 'show' : 'hide']();
  $(el.fnb)[rp ? 'hide' : 'show']();
  el.fn.focus();
  return this;
};

//submit Find & Replace form.
E.frSubmit = function(B) {
  var E = this, el = B.form.elements, fn = BUE.text(el.fn.value);
  if (!fn) {
    el.fn.focus();
    return E;
  }
  var op = B.name, rp = BUE.text(el.rp.value);
  var mc = $(el.mc.parentNode).is(':visible') && el.mc.checked;
  var re = $(el.re.parentNode).is(':visible') && el.re.checked;
  switch (op) {
    case 'fnb': E.find(fn, mc, re); break;//find
    case 'rpb': E.replace(fn, rp, mc, re); break;//replace
    case 'rab': E.replaceAll(fn, rp, mc, re); break;//replace all
  }
  return E.focus();
};

})(BUE.instance.prototype);

/*
 * Use js:E.frForm(type, match_case, reg_exp) in your button content
 * type - either 'find' or 'replace'
 * match_case - boolean that shows/hides a checkbox allowing case insensitive search.
 * reg_exp - boolean that shows/hides a checkbox allowing regular expression search.
 * E.frForm('find') - Pops up the simplest search form
 * E.frForm('replace', true, true) - Pops up a replace form with match-case and regular-expression options.
 */

