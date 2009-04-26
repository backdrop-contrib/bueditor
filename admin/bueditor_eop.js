// $Id$

//Add editor name prompt for copy and add_default operations.
//Confirm editor deletion without going to the confirmation page.
$(function() {
  $("#available-editors-list").find("a.eop-copy, a.eop-add-default").removeClass("active").click(function() {
    var name = prompt(Drupal.t('Editor name'), this.name);
    if (name) location.replace(this.href + "&name=" + name);
    return false;
  }).end().find("a.eop-delete").click(function() {
    if (confirm(Drupal.t('All buttons and settings of this editor will be removed.'))) {
      location.replace($(this).nextAll("a.eop-copy")[0].href.replace("eop=copy", "eop=delete"));
    }
    return false;
  });
});