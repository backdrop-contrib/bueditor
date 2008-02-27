// $Id$

function editorAdminInitiate() {
  var table = $('#button-table');
  table.find('select').each(function () {
    if (this.id.substr(this.id.length-5) == '-icon') {
      $(this).change(function() {editorIconCap(this);}).change();
    }
  });
  if (table.find('input:checkbox').size()) {
    $('#edit-go').click(function() {
      return $('#edit-selaction').val() && table.find('input:checkbox:checked').size() ? true : false
    });
  }
  else {
    $('#edit-go,#edit-selaction').hide();
  }
}

function editorIconCap(selbox) {
  var cap = $('#'+ selbox.id.substr(0, selbox.id.length-4) +'caption-wrapper');
  var img = $(selbox.nextSibling.tagName == 'IMG' ? selbox.nextSibling : document.createElement('img'));
  if (selbox.value) {
    cap.hide();
    img.attr('src', iconPath +'/'+ selbox.value).insertAfter(selbox).css('display', 'block');
  }
  else {
    cap.show();
    img.hide();
  }
}

$(document).ready(editorAdminInitiate);