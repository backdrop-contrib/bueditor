// $Id$

//IMCE integration. Introduces E.imce=BUE.imce
//Requires: bue.popup.js
(function(E, $) {

var I = E.imce = BUE.imce = {};
$(function() {I.url = Drupal.settings.BUE.imceURL || ''});

//imce button
I.button = function(fname, text) {
  return I.url ? '<input type="button" id="bue-imce-button" name="bib" value="'+ (text || Drupal.t('Browse')) +'" onclick="BUE.imce.open(this.form.elements[\''+ fname +'\'])">' : '';
};

//prepare opening
I.prepare = function(opt) {
  I.ready = I.sendto = function(){};
  if (!opt) return;
  if (opt.form) {//field
    I.target = opt;
    I.ready = I.highlightTarget;
    I.sendto = I.fillTarget;
  }
  else {//options
    $.isFunction(opt.ready) && (I.ready = opt.ready);
    $.isFunction(opt.sendto) && (I.sendto = opt.sendto);
  }
};

//open imce
I.open = function(opt) {
  I.prepare(opt);
  if (!I.pop) {
    var url = I.url + (I.url.indexOf('?') < 0 ? '?' : '&') + 'app=bue|imceload@bueImceLoad';
    I.pop = BUE.openPopup('bue-imce-pop', Drupal.t('File Browser'), '<iframe src="'+ url +'"></iframe>');
  }
  else {
    I.pop.open();
    I.ready(I.win, I.pop);
  }
  var $p = $(I.pop), $w = $(window), o = $.browser.opera;
  var h = (o ? $w[0].innerHeight : $w.height()) - $p.height(), w = $w.width() - $p.width();
  $p.css({'top': $w.scrollTop() + Math.max(0, h/2), 'left': Math.max(0, w/2)});
};

//execute sendto operation
I.finish = function(file, win) {
  I.sendto(file, win, I.pop);
};

//process file & close imce
I.fillTarget = function(file, win, pop) {
  var target = I.target, el = target.form.elements, val = {'alt': file.name, 'width': file.width, 'height': file.height};
  target.value = file.url;
  for (var i in val) {
    if (el['attr_'+i]) el['attr_'+i].value = val[i];
  }
  pop.close();
  target.focus();
};

//highlight file in imce file list
I.highlightTarget = function(win, pop) {
  I.win.imce.highlight(I.target.value.substr(I.target.value.lastIndexOf('/')+1));
};

//imce onload function.
window.bueImceLoad = function(win) {
  (I.win = win).imce.setSendTo(Drupal.t('Send to editor'), I.finish);
  I.ready(win, I.pop);
};

})(BUE.instance.prototype, jQuery);

//backward compatibility
eDefBrowseButton = function(l, f, t) {return BUE.imce.button(f, t)};
