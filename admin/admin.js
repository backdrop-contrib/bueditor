// $Id$

if (Drupal.jsEnabled) {
  $(document).ready(editorAdminInitiate);
}

function editorAdminInitiate() {
  $('#button-table select').each(function () {
    if (this.id.substr(this.id.length-5)=='-icon') {
      $(this).change(function () { editorIconCap(this) });
      editorIconCap(this);
    }
  });
  if ($('#button-table').get(0).rows[1].cells[5].getElementsByTagName('input').length) {
    $('#button-table').get(0).rows[0].cells[5].innerHTML = '<input type="checkbox" onclick="editorCheckAll(this.checked)">';
    $('#edit-go').click(editorGoSelected);
  }
  else {
    $('#edit-go').css('display', 'none');
    $('#edit-selaction').css('display', 'none');
  }
}

function editorIconCap(input) {
  input.parentNode.lastChild.tagName=='IMG' ? input.parentNode.removeChild(input.parentNode.lastChild) : '';
  var cap = $('#edit-button-'+ input.id.split('-')[2] +'-caption').get(0);
  if (input.value) {
    cap.style.display =  'none';
    var img = document.createElement('img');
    img.src = editorPath +'icons/'+ input.value;
    img.style.display = 'block';
    input.parentNode.appendChild(img);
  }
  else {
    cap.style.display =  'block';
  }
}

function editorCheckAll(state) {
  $('#button-table tbody input[@type=checkbox]').each(function () {this.checked = state});
}

function editorGoSelected() {
  if ($('#edit-selaction').get(0).selectedIndex) {
    var chk, chks = $('#button-table tbody input[@type=checkbox]');
    for (var i=0; chk=chks[i]; i++) {
      if (chk.checked) return true;
    }
  }
  return false;
}