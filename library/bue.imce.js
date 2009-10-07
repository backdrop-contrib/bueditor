// $Id$

//IMCE integration. Introduces E.imce=BUE.imce
//Requires: bue.popup.js
(function(E, $) {

var target = {form: {}, value: '', focus: function(){}};
var I = E.imce = BUE.imce = {field: target};
$(function() {I.url = Drupal.settings.BUE.imceURL || ''});

//imce button
I.button = function(fname, text) {
  return I.url ? '<input type="button" id="bue-imce-button" name="bib" value="'+ (text || Drupal.t('Browse')) +'" onclick="BUE.imce.open(this.form.elements[\''+ fname +'\'])">' : '';
};

//open imce
I.open = function(field) {
  I.field = field || target;
  if (!I.pop) {
    var url = I.url + (I.url.indexOf('?') < 0 ? '?' : '&') + 'app=bue|imceload@bueImceLoad';
    I.pop = BUE.openPopup('bue-imce-pop', Drupal.t('File Browser'), '<iframe src="'+ url +'"></iframe>');
  }
  else {
    I.pop.open();
    I.hlight();
  }
  var $p = $(I.pop), $w = $(window), o = $.browser.opera;
  var h = (o ? $w[0].innerHeight : $w.height()) - $p.height(), w = $w.width() - $p.width();
  $p.css({'top': $w.scrollTop() + Math.max(0, h/2), 'left': Math.max(0, w/2)});
};

//close imce & process file
I.finish = function(file, win) {
  I.field.value = file.url;
  var el = I.field.form.elements || {}, val = {'alt': file.name, 'width': file.width, 'height': file.height};
  for (var i in val) {
    if (el['attr_'+i]) el['attr_'+i].value = val[i];
  }
  I.pop.close();
  I.field.focus();
};

//highlight file
I.hlight = function() {
  I.win.imce.highlight(I.field.value.substr(I.field.value.lastIndexOf('/')+1));
};

//imce startup function.
window.bueImceLoad = function(win) {
  (I.win = win).imce.setSendTo(Drupal.t('Send to editor'), I.finish);
  I.hlight();
};

})(BUE.instance.prototype, jQuery);

//backward compatibility
eDefBrowseButton = function(l, f, t) {return BUE.imce.button(f, t)};
