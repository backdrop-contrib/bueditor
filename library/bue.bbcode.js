// $Id$
//BBCode library. Requires the default library.
(function(E) {

//open image dialog
E.bbcImage = function() {
  var E = this, M = E.getSelection().match(new RegExp('^\\[img(?:=(\\d+)x(\\d+))?](.+)\\[/img]$')) || ['', '', '', ''];
  var form = [
   {name: 'src', title: 'Image URL', value: M[3], suffix: E.imce.button('attr_src'), required: true},
   {name: 'width', title: 'Width x Height', value: M[1], suffix: ' x ', attributes: {size: 3}, getnext: true},
   {name: 'height', value: M[2], attributes: {size: 3}}
  ];
  var opt = {title: 'Insert/edit image'};
  opt.submit = function(tag, form) {
    var el = form.elements, src = el['attr_src'].value, w = el['attr_width'].value, h = el['attr_height'].value;
    E.replaceSelection('[img'+ (w*1 ? ('='+ w +'x'+ h) : '') +']'+ src +'[/img]');
  };
  return E.tagDialog('img', form, opt);
};

//open link dialog
E.bbcLink = function() {
  var E = this, S = E.getSelection();
  var M = S.match(new RegExp('^\\[url(?:=([^\\]]*))?]((?:.|[\r\n])*)\\[/url]$')) || ['', '', ''];
  var form = [
   {name: 'href', title: 'URL', value: M[1] || M[2], suffix: E.imce.button('attr_href'), required: true},
   {name: 'text', value: M[1] ? M[2] : (M[0] ? '' : S)}
  ];
  var opt = {title: 'Insert/edit link'};
  opt.submit = function(tag, form) {
    var el = form.elements, url = el['attr_href'].value, txt = el['attr_text'].value;
    E.replaceSelection('[url'+ (txt ? ('='+ url) : '') +']'+ (txt || url) +'[/url]');
  };
  return E.tagDialog('a', form, opt);
};

//bbcode tag chooser. limited version of html tag chooser.
E.bbcTagChooser = function(tags, opt) {
  var E = this; E.tagChooser(tags, opt);
  $('a.choice-link', BUE.quickPop).unbind('click').each(function(i, a) {//override click event
    $(a).click(function() {
      E.tagSelection('['+ tags[i][0] +']', '[/'+ tags[i][0] +']').focus();
      return false;
    });
  });
  return E;
};

})(BUE.instance.prototype);