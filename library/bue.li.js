// $Id$

//Automatically insert a new list item when enter-key is pressed at the end of a list item.
BUE.postprocess.push(function(E, $) {

  $(E.textArea).keyup(function(e) {
    if (!e.ctrlKey && !e.shiftKey && !e.originalEvent.altKey && e.keyCode == 13) {
      var text = E.getContent().substr(0, E.posSelection().start);
      if (text.search(/<\/li>\s*$/) != -1) {
        E.tagSelection('<li>', '</li>');
      }
    }
  });
 
});